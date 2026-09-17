---
title: "LVGL 学习笔记(一):从三要素到双缓冲,搞懂屏幕是怎么亮起来的"
date: 2026-08-31
tags:
  - "LVGL"
  - "ESP32"
  - "嵌入式"
summary: "在 ESP32-S3 上跑通 LVGL 之后,把渲染管线彻底梳理了一遍:移植三要素、渲染其实是计算而不是搬运、标脏机制、PARTIAL 局部渲染加双缓冲的同步原理,以及我踩过的 DMA 内存和 RGB565 字节序两个坑。"
---
最近在 ESP32-S3 上把 LVGL 跑通了(240x320 的 ST7789 SPI 屏,触摸用的 XPT2046)。跑通之后我盯着代码问了自已一堆问题:渲染到底是什么?缓冲区里装的是什么?为什么我的两块缓冲区没有起到双缓冲的效果?这篇笔记把整条渲染管线串起来。

## 一、LVGL 是什么:它管怎么画,我管画到哪

LVGL 是一个纯 C 写的开源图形库,**不依赖操作系统也不依赖硬件**。它的架构分三层:

```text
应用层:  我写的代码 / SquareLine 生成的 UI(创建控件、写事件回调)
核心层:  对象系统 + 渲染引擎 + lv_timer 调度器 + 内存管理
驱动层:  flush_cb 显示回调 / read_cb 输入回调 —— 由我对接硬件
```

一句话总结:**LVGL 负责"怎么画",我提供一块 RAM 画布和一个把画布发到屏幕的回调函数,其余全是它的事。**

## 二、移植三要素(缺一不可)

### 1. lv_tick:给 LVGL 一块表

```c
static void lv_tick_cb(void *arg)
{
    lv_tick_inc(1);     /* 每 1ms 调一次,ESP32 上用 esp_timer 周期回调 */
}
esp_timer_start_periodic(timer, 1000);   /* 单位微秒 = 1ms */
```

动画、按下计时、超时判断全靠它。没有 tick,界面永远静止。

### 2. lv_timer_handler:LVGL 的心跳

```c
static void lvgl_task(void *arg)
{
    while (1) {
        uint32_t wait_ms = lv_timer_handler();  /* 处理渲染/动画/输入 */
        vTaskDelay(pdMS_TO_TICKS(wait_ms));     /* 按返回值决定歇多久 */
    }
}
```

它内部跑一遍定时器链表:发现脏区域就渲染、推进动画、读取触摸。5~10ms 调一次比较合适。

### 3. flush_cb:把画布发到屏幕

```c
void st7789_flush_cb(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map)
{
    /* area 是要刷新的坐标区域,px_map 里是渲染好的像素 */
    st7789_set_window(area->x1, area->y1, area->x2, area->y2);  /* 开窗 */
    lv_draw_sw_rgb565_swap(px_map, w * h);                      /* 字节序交换 */
    /* SPI 发送 px_map ... */
    lv_display_flush_ready(disp);   /* 告诉 LVGL:这块画完了 */
}
```

三者关系:**tick 是表,handler 是干活的人,flush_cb 是交货通道。** 只有表没有干活的人,界面不动;只有干活的人没有交货通道,画了也白画。

## 三、渲染不是搬运,是计算

我一开始以为"渲染"就是把图片数据从 flash 搬到缓冲区。错。渲染是 CPU **逐像素计算**出最终颜色:

```text
在背景图上画一行字,每个像素要经历:
1. 读背景图在这个位置的颜色(压缩图还要先解码)
2. 查字体点阵:这个位置有没有笔画、透明度多少
3. 混合运算: final = 背景 × (1-α) + 文字颜色 × α
4. 写入 draw buffer
```

每一步都是算术运算,不是 memcpy。所以渲染是整条管线里最耗 CPU 的环节,而"搬运"(DMA 发 SPI)反而是便宜的。

## 四、标脏:LVGL 高效的核心

调用 `lv_label_set_text(label, "12:31")` 时,LVGL **并不马上画**,只把 label 所占的那一小块区域记成"脏区域"(dirty = 画面过期了)。

```text
set_text ──> 标脏(记下区域,瞬间完成)
                │
lv_timer_handler ──> 有脏区域吗?
                     ├─ 没有:直接返回(空闲时几乎零开销)
                     └─ 有:只渲染脏区域 ──> 发送 ──> 清除脏标志
```

240x320 全屏是 76800 像素,一个 label 只占 1200 像素——标脏机制让重绘量直接砍掉 98%。手表界面 99% 时间静止,没有这个机制 CPU 早就烧穿了。

## 五、PARTIAL 模式:一块 40 行高的画布刷整屏

我的画布配置:

```c
#define BUF_LINES 40
draw_buf_bytes = 240 * 40 * 2;   /* 19200 字节,只有 1/8 屏 */
buf1 = heap_caps_malloc(draw_buf_bytes, MALLOC_CAP_DMA | MALLOC_CAP_INTERNAL);
buf2 = heap_caps_malloc(draw_buf_bytes, MALLOC_CAP_DMA | MALLOC_CAP_INTERNAL);
lv_display_set_buffers(disp, buf1, buf2, draw_buf_bytes, LV_DISPLAY_RENDER_MODE_PARTIAL);
```

一帧全屏是 240x320x2 = 150KB,画布只有 18.75KB。PARTIAL 模式下 LVGL 分 8 次渲染加发送,拼出整帧;配合标脏,大多数时候连一整块都刷不满。

**为什么要两块(buf1/buf2)?** 乒乓轮换:CPU 往 buf2 渲染下一块时,DMA 正在把 buf1 发往屏幕,两件事并行。

**同步怎么做?** 不需要预测谁快谁慢,靠一个完成标志:

```text
渲染循环规则: 渲染某块画布之前,必须确认它上一次的发送已经完成
  - DMA 发完 buf1 ──> 调 lv_display_flush_ready() 清标志
  - CPU 渲染完 buf2 到交货点,发现标志没清 ──> 等一等
  - 发现标志已清 ──> 直接交货,零等待
```

这样同一块缓冲永远不会同时被 CPU 写和 DMA 读,两种时序都天然正确。

## 六、我踩过的两个坑

### 坑 1:DMA 不能访问 PSRAM

ESP32-S3 有 8MB PSRAM,但 SPI 控制器的 **DMA 只能访问内部 SRAM**。画布如果 malloc 在 PSRAM 里,flush 时会传输异常或性能暴跌。所以必须:

```c
heap_caps_malloc(size, MALLOC_CAP_DMA | MALLOC_CAP_INTERNAL);
```

### 坑 2:RGB565 字节序

ESP32 是小端(低字节在前),SPI 发数据先发低地址字节,但 ST7789 要求**先收高字节**。不交换的话红蓝/明暗全错。发之前调用 `lv_draw_sw_rgb565_swap()` 逐像素交换高低字节。

## 七、一个待改进项

我现在的 flush_cb 用的是 `spi_device_polling_transmit`(阻塞轮询),发完才返回、马上调 flush_ready——这等于渲染和发送**串行**,双缓冲白配了。正确姿势是 `spi_device_queue_trans` 入队即返回,SPI 完成中断里才调 flush_ready,让 CPU 在 DMA 发送期间回去渲染下一块。实测这种异步化一般能提升 20%~40% 帧率,准备下周改。

## 写在最后

整条管线串起来:

```text
改数据 ──> 标脏 ──> lv_timer_handler 发现脏区域
       ──> CPU 渲染(计算像素)进 draw buffer
       ──> DMA 搬运经 SPI 写进屏幕 GRAM
       ──> 屏幕驱动电路自己把 GRAM 内容点亮(不占 CPU)
```

理解了"渲染是计算、搬运是 DMA、显示是屏幕自己的事"这个分工,后面再看任何 GUI 框架(包括手表 SDK)都是同一套思路。下一篇记录异步 flush 的改造和帧率实测。
