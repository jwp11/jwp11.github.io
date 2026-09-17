---
title: "从 Sensor 到屏幕:泰山派 RK3566 摄像头 → ISP → 硬件 H.264 → 推流 → 解码显示的完整链路"
date: 2026-09-17
tags:
  - "嵌入式Linux"
  - "RK3566"
  - "GStreamer"
  - "摄像头"
  - "ISP"
  - "硬件编码"
summary: "把一颗 MIPI 摄像头变成电脑/手机上能看的实时画面,中间要经过采集、ISP、硬件编码、网络封装、解码显示五环,外加一条 3A 控制回路。这篇把整条链路和涉及的名词(MIPI CSI、Bayer RAW、ISP、NV12、H.264、RTP/RTSP/RTMP/WebRTC、HDMI 分支)逐个讲清楚,并给出每环的设备节点、可执行命令、验证方法与常见坑。"
---
把一块 RK3566(立创·泰山派)加一颗 OV8858 MIPI 摄像头做成能实时推流的"运动相机",整条链路可以完整画成下面这样——注意它是**两条链路**:一条搬图像数据,一条做 3A 控制。

> 本篇讲**原理与完整链路**。如果你要看这块板子从串口、烧写、DTB、接 OV8858 到 3A 踩坑的实操记录,另有 [泰山派 RK3566 运动相机实战手册](tspi-camera.html)。

## 一、总览:完整链路图

```text
光线
 ↓
OV8858 图像传感器
 ↓  MIPI CSI-2,4 Lane
RK3566 CSI 接收器
 ↓
RK3566 ISP 图像处理器
 ↓
NV12 原始视频帧
 ↓
RK3566 硬件 H.264 编码器
 ↓
RTP / RTSP / RTMP / WebRTC
 ↓
网络
 ↓
电脑或手机解码显示
```

另外还有一条 **3A 控制链路**(它不搬像素,只调参数):

```text
ISP 统计画面亮度
 ↓
rkaiq_3A_server
 ↓
通过 I2C 调整 OV8858 的曝光、增益和白平衡
```

两条链路合到一张图里:

```text
        ┌─────────────────── 3A 控制链路 ───────────────────┐
        │                                                   │
        ▼            MIPI CSI-2 (4 Lane)                    │
┌──────────────┐  ───────────────────►  ┌──────────┐  NV12  ┌──────────┐  H.264  ┌───────────┐
│   OV8858     │                        │  RK3566  │ ─────► │ RK3566   │ ─────► │ 网络封装   │ ──► 网络 ──► 电脑/手机
│ 图像传感器   │  ◄─── I2C(曝光/增益) ── │   ISP    │        │ 硬件编码  │        │ RTP/RTSP  │            解码显示
└──────────────┘                        └──────────┘        └──────────┘        └───────────┘
        ▲                                    │
        │                              rkaiq_3A_server
        └────────────────────────────────────┘
```

把五环的"输入/输出/负责硬件"列出来:

| 环节 | 输入 | 输出 | 负责硬件/软件 |
|---|---|---|---|
| ① 采集 | 光子 | Bayer RAW(如 RAW10) | OV8858 + MIPI CSI-2 |
| ② ISP | Bayer RAW | **NV12**(YUV 4:2:0) | RK3566 ISP |
| ③ 编码 | NV12 | **H.264 码流** | RK3566 硬件编码器(VENC/MPP) |
| ④ 封装 | H.264 NAL | **RTP 包**(UDP) | GStreamer rtph264pay + udpsink |
| ⑤ 解码显示 | RTP 包 | 屏幕像素 | 电脑/手机的 VLC 等播放器 |

下面按这个顺序逐个讲。

## 二、① OV8858:把光转换成原始图像

OV8858 是摄像头**传感器**,负责把光线转换成电信号。

它输出的**不是** NV12,而是 **Bayer RAW** 数据(例如 RAW10)——可以理解为"传感器只提供最原始的红绿蓝感光数据",每个像素只有一个颜色分量,还带大量噪点,不能直接显示。

OV8858 的**曝光时间、模拟增益**等参数,是通过 **I2C** 配置的:

```text
rkaiq_3A_server ──I2C──► OV8858
```

举例:如果自动曝光(AE)正常工作,白天对着天空拍时,传感器会**自动降低曝光和增益**,避免过曝。

这一环要配对的东西:

- **驱动**:内核里要有 `ov8858` 驱动(defconfig 里的 `CONFIG_VIDEO_OV8858`)
- **上电时序**:复位、PWDN、供电三个 GPIO 按手册顺序拉
- **设备树**:i2c 地址(本模组 `4-0036`)、MIPI lane 数、时钟
- **数据出口**:MIPI CSI-2

验证:

```bash
dmesg | grep -iE "ov8858|csi2-dphy"
# 期望: ov8858 4-0036: Detected OV008858 sensor, REVISION 0xb2
```

> 一个常见约束:这颗 sensor 在 **4-lane 模式下只支持 3264x2448@30 一种分辨率**,想要 1080p 得靠 ISP 缩放,而不是让 sensor 直接输出 1080p。

## 三、② MIPI CSI:把摄像头数据高速传给 RK3566

**MIPI CSI-2** 是摄像头和 SoC 之间的**高速串行接口**。硬件大致是:

```text
OV8858 ──► 4 条 MIPI 数据 Lane ──► RK3566 CSI 接收器
```

关键在于**它只负责"传输"**,不负责:

- 自动曝光
- 图像美化
- H.264 压缩
- 网络发送

它只是把 OV8858 输出的原始图像数据高速送到 RK3566。所以画面黑不黑、偏不偏色、压缩得怎么样,都跟 CSI 无关。

> 排查提示:如果 `dmesg` 报 `No link between dphy and sensor`,是设备树里的 lane/endpoint 配对错了,与 CSI 传输本身无关。

## 四、③ ISP:把原始数据处理成可用图像

**ISP**(Image Signal Processor,图像信号处理器)是整条链路里最"重"的一环。它会做很多工作:

- Bayer RAW 转 RGB/YUV
- 去马赛克(Demosaic)
- 自动曝光配合(配合 3A)
- 自动白平衡
- 降噪
- 锐化
- 镜头校正
- 色彩处理
- 缩放
- 输出 NV12

可以理解为:

```text
OV8858 原始 RAW ──► ISP ──► 正常的彩色视频帧
```

在你的系统里,**`/dev/video0` 就是 ISP 的主输出节点**(mainpath)。

### 4.1 拓扑:用 media controller 看设备怎么连

Linux 把这条链路建模成一张"媒体图",用 `media-ctl` 就能看到所有节点和连接:

```bash
media-ctl -d /dev/media0 -p
```

典型结构:

```text
ov8858(4-0036)          ← 子设备:/dev/v4l-subdev3(曝光/增益)
   └─► rockchip-csi2-dphy0
        └─► rkisp-csi-subdev
             └─► rkisp-isp-subdev   ← ISP 本体(3A、缩放在这生效)
                  ├─► rkisp_mainpath → /dev/video0   主输出(我们要的)
                  └─► rkisp_selfpath → /dev/video1   副输出
dw9714(4-000c)          ← 对焦马达 VCM:/dev/v4l-subdev4(focus_absolute)
```

设一个目标格式试试:

```bash
v4l2-ctl -d /dev/video0 --set-fmt-video=width=1920,height=1080,pixelformat=NV12
```

> 关键:**ISP 输出分辨率与 sensor 采集分辨率解耦**。可以让 ISP 输出 1920x1080,而 sensor 仍按 8MP 采集。

### 4.2 3A 服务:不常驻,画面就是黑的

这是新手最容易翻车的地方。ISP 硬件本身**不会自动算曝光和白平衡**,需要一个用户态程序 **`rkaiq_3A_server`** 常驻后台,它:

- 通过 `/dev/video7` 读 ISP 统计(亮度直方图、白平衡统计)
- 通过 `/dev/video8` 把算好的参数写回 ISP/sensor

所以顺序必须是:**先起 3A,再开应用**。

```bash
/usr/bin/rkaiq_3A_server < /dev/null > /tmp/3a.log 2>&1 &
```

两个硬性约束:

1. **只能有一套 3A**。同时跑两个(比如外部一个 + 某框架内部自带的)会抢着写 `/dev/video8`,画面一直闪绿。
2. **别自己写软件 AE 去抢曝光**。rkaiq 会每帧覆盖 sensor 曝光寄存器,你用 `v4l2-ctl -c exposure=...` 设完,几秒后读回来就变了。曝光/白平衡统一交给 rkaiq。

> 日志里看到 `aec stats is null` / `awb stats is null` 之类报错,**只要只在启动头几帧出现就正常**,3A 稳定后统计就通了。

验证:

```bash
media-ctl -d /dev/media0 -p | grep -i enabled
# 1080p NV12 一帧 = 1920*1080*1.5 = 3110400 字节
v4l2-ctl -d /dev/video0 --set-fmt-video=width=1920,height=1080,pixelformat=NV12 \
        --stream-mmap --stream-count=5 --stream-to=/tmp/frame.nv12
ls -l /tmp/frame.nv12     # 期望 15552000 = 3110400 * 5
```

## 五、④ NV12:ISP 输出的原始视频格式

**NV12 是图像帧的排列方式**,不是接口,也不是压缩格式。它由两部分组成:

- **Y 平面**:亮度
- **UV 平面**:颜色(色度以 2x2 抽样,所以只有 Y 的 1/2 大小)

```text
YYYYYYYYYYYY
YYYYYYYYYYYY
UVUVUVUVUVUV
```

1920×1080 的 NV12 单帧大小:

```text
1920 × 1080 × 1.5 ≈ 3.1 MB
30fps 时:3.1 MB × 30 ≈ 93 MB/s
```

所以 **NV12 不能直接通过普通 Wi-Fi 上传**——它只是 ISP 和编码器之间的**中间数据**。

## 六、⑤ 硬件 H.264:把 NV12 压缩成小数据

RK3566 内部有**硬件视频编码能力**,通常通过 Rockchip **MPP**(Media Process Platform)或 GStreamer 的元件 **`mpph264enc`** 使用。

数据变化:

```text
NV12 原始帧 ──► 硬件 H.264 编码器 ──► H.264 压缩码流
```

量级对比:

| 形态 | 数据量 |
|---|---|
| 原始 NV12(1080p30) | ≈ 93 MB/s |
| H.264 压缩后 | 约 2~6 Mbps(≈ 0.25~0.75 MB/s) |

H.264 靠两种压缩:

- **空间压缩**:相邻像素相似
- **时间压缩**:相邻视频帧变化不大
- **I 帧**:完整图像(关键帧)
- **P 帧**:只记录相对前一帧的变化

常见参数:

| 参数 | 含义 | 典型值 |
|---|---|---|
| 码率 | 目标带宽 | 2~6 Mbps |
| 帧率 | 每秒帧数 | 30 fps |
| GOP | 关键帧间隔 | 30 |
| `header-mode` | SPS/PPS 头怎么发 | `each-idr` |

> **H.265 也可以进一步降低码率,但电脑和手机的兼容性不如 H.264**,所以建议先把 H.264 做通。

### 6.1 零拷贝的坑:为什么"直接接"会全绿

硬件编码器为了省带宽,默认会对上游缓冲做**零拷贝导入**:它发现输入是 DMABuf,就直接拿文件描述符让 VPU 去映射。

问题出在 **IOMMU 分组**:RK3566 上 `rkisp` 与 `rkvenc` 分属**不同 IOMMU 组**,VPU 在自己的域里映射不到 ISP 的页,读到的是**未映射的全零内存** → 编出 `YUV(0,0,0)` → 解码后整屏纯绿:

![零拷贝跨 IOMMU 组的典型症状:整屏纯绿](images/rk3566-h264-green.png)

```bash
for g in /sys/kernel/iommu_groups/*/devices/*; do
  dev=$(basename $g)
  case "$dev" in *rkvenc*|*rkisp*) echo "$dev";; esac
done
# fdf40000.rkvenc → group 5
# fdff0000.rkisp  → group 7
```

正确做法:**在编码器前把缓冲"落回普通内存"**,让编码器走拷贝路径而不是零拷贝。两个条件缺一不可:

1. 加一次真实的格式转换 `videoconvert ! video/x-raw,format=I420`(NV12→I420)。**不能写成同格式**,否则 `videoconvert` 判定"无需转换"直接透传,缓冲类型没变。
2. 环境变量 **`GST_MPP_NO_RGA=1`**。板上的 `videoconvert` 默认是 RGA(2D 加速器)版,它转换完会把输出**又导出成 DMABuf**,等于没断链。关掉它,退回软件转换,输出才是真正的普通内存。

> 编码器内部逻辑就是一句话:输入是 DMABuf 就 import(零拷贝),否则就 copy(安全)。我们要做的就是逼它走 copy。

## 七、⑥ 网络传输:把 H.264 码流发出去

H.264 编码后的数据还需要**封装成网络协议**。常见方式:

| 协议 | 传输层 | 延迟 | 适用场景 | 板子侧需要什么 |
|---|---|---|---|---|
| **RTP** | UDP | 低 | 局域网 VLC 播放 | `rtph264pay` + `udpsink` + SDP |
| **RTSP** | TCP/UDP | 低 | 局域网播放器(更像"摄像头") | 板子上跑 RTSP 服务(mediamtx / gst-rtsp-server) |
| **RTMP** | TCP | 中 | 推送到直播云平台 | `rtmpsink` + 云推流地址/推流码 |
| **WebRTC** | UDP | 极低 | 手机浏览器/App 观看 | `webrtcbin` + 信令服务器 |

### 7.1 RTP 与 rtph264pay

`rtph264pay` 的作用是**把 H.264 拆成 RTP 数据包**(大 NAL 拆成 FU-A 分片,小 NAL 用 STAP-A 聚合,每包带时间戳和序号)。

但要注意:**`rtph264pay` 只负责封装,它本身不一定把数据发到网络**。后面还必须有网络输出组件,例如:

- `udpsink`
- `rtspclientsink`
- `webrtcbin`

完整的 GStreamer 概念链路是:

```text
v4l2src
 ! video/x-raw,format=NV12,width=1920,height=1080,framerate=30/1
 ! mpph264enc
 ! h264parse
 ! rtph264pay
 ! 网络发送组件(udpsink / rtspclientsink / webrtcbin ...)
```

### 7.2 本项目实际用的:RTP + UDP + SDP

考虑到板子是"自己发、电脑收"的简单场景,我们用的是**最轻的裸 RTP/UDP**,配合一份 SDP 告诉 VLC 怎么解:

```text
h264parse            → 规范化码流(补 SPS/PPS、对齐 AU)
 ! rtph264pay        → 按 RTP 打包
     pt=96              载荷类型 96(动态类型,靠 SDP 告知是 H.264)
     mtu=1200           单包最大 1200 字节(给 IP/UDP 头留余量,避免 IP 分片)
     config-interval=1  周期性重发 SPS/PPS,方便接收端中途接入
 ! udpsink host=<电脑IP> port=5600 sync=false async=false
```

> 裸 RTP 的缺点也很明显:没有"协商"过程,接收端必须手工配 SDP,而且流断了不会自愈。想要"填个 `rtsp://` 就能播"的体验,就在板子上跑一个 RTSP 服务器(如 mediamtx),把这条流喂给它。

## 八、HDMI 在哪里?

**HDMI 是另一条输出分支,不是网络传输的一部分。** 可以理解为:

```text
ISP 输出 NV12
   ├──► HDMI 显示
   └──► H.264 编码 ──► 网络
```

所以理论上可以同时做到:

- 本地 **HDMI 实时预览**
- **网络推流**到电脑或手机

但这样会**增加 RK3566 的整体负荷**(ISP 出两路、VPU 编码、内存带宽都要分摊),做的时候要留意帧率和功耗。

## 九、虚拟机的作用(开发机 ≠ 运行环境)

虚拟机主要用于:

- 编译内核
- 编译设备树
- 编译视频应用
- 检查 SDK 中的 MPP / GStreamer
- (可选)跑一个 RTSP 服务器

真正运行时:

| 角色 | 在哪跑 |
|---|---|
| 视频采集、ISP、编码、推流程序 | **开发板** |
| VLC / 手机播放 | **电脑或手机** |

**虚拟机不是必须参与视频传输的。** 如果确实想让 VM 当服务器,必须保证开发板和 VM 网络互通——VMware 通常用**桥接模式**最简单(NAT 模式下板子访问不到 VM)。

## 十、完整命令(可以直接跑的那一条)

把五环串起来,板子上一条 `gst-launch-1.0` 就是完整链路。下面还多了两条"采样支路",用来在板子上客观测亮度和白平衡(不影响主画面):

```bash
GST_MPP_NO_RGA=1 gst-launch-1.0 -e \
  v4l2src device=/dev/video0 \
  ! video/x-raw,format=NV12,width=1920,height=1080,framerate=30/1 \
  ! tee name=t \
  t. ! queue leaky=downstream max-size-buffers=2 \
     ! videoconvert ! video/x-raw,format=I420 \
     ! mpph264enc bps=6000000 gop=30 header-mode=each-idr \
     ! h264parse ! rtph264pay pt=96 config-interval=1 mtu=1200 \
     ! udpsink host=192.168.1.5 port=5600 sync=false async=false \
  t. ! queue leaky=downstream max-size-buffers=2 \
     ! videorate ! video/x-raw,framerate=2/1 \
     ! videoscale ! video/x-raw,width=320,height=240 \
     ! videoconvert ! video/x-raw,format=GRAY8 \
     ! filesink location=/tmp/aeframe \
  t. ! queue leaky=downstream max-size-buffers=2 \
     ! videorate ! video/x-raw,framerate=1/1 \
     ! videoscale ! video/x-raw,width=64,height=48 \
     ! videoconvert ! video/x-raw,format=RGB \
     ! filesink location=/tmp/aecolor
```

对照总览图,每一段就是一句话:

| 管道片段 | 对应环节 |
|---|---|
| `v4l2src device=/dev/video0 ! ...NV12...` | ①+② 从 ISP 主输出取 NV12 |
| `videoconvert ! I420` + `mpph264enc` | ③ 断链 + 硬件 H.264 编码 |
| `h264parse ! rtph264pay ! udpsink` | ④ RTP 封装推流 |
| 电脑端 VLC + SDP | ⑤ 解码显示 |

VLC 用的 SDP:

```text
v=0
o=- 0 0 IN IP4 127.0.0.1
s=TSPI Camera H264
c=IN IP4 192.168.1.5
t=0 0
m=video 5600 RTP/AVP 96
a=rtpmap:96 H264/90000
```

字段对应关系:

- `m=video 5600` —— 监听 5600 端口
- `RTP/AVP 96` —— 载荷类型 96,**必须和板上 `rtph264pay pt=96` 一致**
- `a=rtpmap:96 H264/90000` —— 96 号载荷是 H.264,时钟 90 kHz

也可以命令行验证整条链路:

```bash
gst-launch-1.0 udpsrc port=5600 caps="application/x-rtp,payload=96" \
  ! rtph264depay ! h264parse ! avdec_h264 ! autovideosink
```

实测这条管道 1080p 下约 **15~16.5 fps、3~6 Mbps**(瓶颈是软件 NV12→I420 转换),画面如下:

![硬件 H.264 推流解码后的真实画面](images/rk3566-h264-ok.png)

## 十一、建议的实施顺序

由内到外、由简到繁,一步一验证:

1. OV8858 → CSI → ISP(先让 `dmesg` 认到 sensor、`media-ctl` 链路 ENABLED)
2. ISP 输出 NV12(抓帧看字节数对不对)
3. NV12 保存或抓帧验证(确认不是全黑/全绿)
4. NV12 → 硬件 H.264(写文件,别牵扯网络)
5. H.264 保存成文件并播放(确认编码正确)
6. H.264 → RTP → 电脑 VLC(本项目这一步已通)
7. 局域网稳定后再做手机
8. 最后再接入云(RTMP)或 WebRTC

## 十二、概念速记

| 名词 | 一句话理解 |
|---|---|
| **MIPI CSI** | 摄像头和芯片之间的**硬件传输接口**(只搬数据) |
| **Bayer RAW** | 传感器输出的最原始数据(每像素单色) |
| **ISP** | 把 RAW 处理成可用彩色画面的处理器(去马赛克/3A/缩放) |
| **NV12** | ISP 输出的**原始图像格式**(Y 平面 + UV 平面,未压缩,很大) |
| **H.264 / mpph264enc** | **压缩后适合网络传输**的视频格式(RK3566 用硬件编码) |
| **RTP** | 把 H.264 拆成网络包的封装格式(需要配 `udpsink` 等发送端) |
| **RTSP / RTMP / WebRTC** | 不同的**网络传输协议**(局域网 / 推流云 / 低延迟) |

整条链路的本质是**五次形态转换**:

```text
光子 →(sensor) Bayer RAW →(ISP+3A) NV12 →(VENC) H.264 →(RTP) UDP 包 →(解码) 画面
```

## 十三、常见故障与定位(按现象查)

| 现象 | 多半是哪一环 | 怎么查 |
|---|---|---|
| 白天画面也全黑 | ② ISP 的 3A 没起来 | 先看进程里有没有 `rkaiq_3A_server`,没有就起它 |
| 画面一直闪绿 | ② 有两套 3A 在抢 `/dev/video8` | 只保留一套 3A |
| 画面偏青绿(缺红) | ② ISP 白平衡参数被改成手动 | 查 IQ 文件 WB 模式,别手改 |
| **整屏纯绿(不是黑)** | ③ 编码器零拷贝读到零页 | 补 `GST_MPP_NO_RGA=1` + `videoconvert ! I420` |
| 电脑黑屏、板上没有 gst 进程 | ④ 推流进程死了 | 看推流日志;重启推流 |
| 电脑黑屏、板上 gst 还活着 | ⑤ 接收端没接上 / 流断过没自愈 | 关掉播放器重开 SDP |
| dmesg 搜不到 sensor | ① 驱动没编进内核 | 打开对应 `CONFIG_VIDEO_*` 重编 |
| 抓帧 0 字节 | ② 链路没 ENABLED | `media-ctl -p` 看连接 |

一个很好用的**码流判据**:如果 RTP 负载**平均只有几十字节/包**、且 P 帧大小**完全不变**,基本可断定编码器吃到的是全零输入(回到第六节的零拷贝问题);正常画面满包应在 1150~1388 字节/包。

## 十四、小结

- 采集端只出 RAW,**必须**有 ISP + 常驻 3A,否则没画面
- **MIPI CSI = 硬件传输接口;NV12 = ISP 输出的原始格式;H.264 = 压缩后适合网络传输的格式;RTSP/WebRTC/RTMP = 网络协议**
- 硬件编码要小心**零拷贝跨 IOMMU 组**的坑:断开 DMABuf 链(软件转换 + `GST_MPP_NO_RGA=1`)比什么都重要
- HDMI 是 ISP 之后的**另一条输出分支**,和网络推流可以并存,但会增加负荷
- 虚拟机只管**编译/开发**,真正跑链路的是开发板,接收端是电脑/手机
