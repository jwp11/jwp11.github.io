/* ============================================
   泰山派 RK3566 运动相机实战 —— 内容文件
   定位:实战踩坑手册(现象 → 原因 → 命令 → 验证)
   新增章节:往 TSPI_CHAPTERS 末尾追加
   ⚠️ 正文在 JS 模板字符串里:反引号要写成 \` ,不要出现 \${ 和行尾反斜杠
   ============================================ */

const TSPI_CHAPTERS = [
  {
    id: "project-overview",
    title: "1. 项目背景与硬件清单",
    content: `
## 我想做什么

手上有一块**立创·泰山派 RK3566**(4GB 内存,**没有 eMMC**,只能 SD 卡启动),配一个 **OV8858 MIPI 摄像头**模组。目标很明确:

- 让摄像头出图,实时显示到 HDMI
- 做成一台能拍照、录像的运动相机
- 最后用 LVGL 写一套自己的 UI

网上有一份开源的运动相机方案(博主把内核、根文件系统、设备树、驱动源码都放出来了),但没有应用层源码。我的路线是:**先照着他的方案把相机跑通,再逐步换成自己的东西。**

这一系列笔记记录的是**从一块裸板到摄像头出图的完整过程**,重点是踩过的坑——因为其中有好几个坑花了我一整天。

## 硬件清单

| 部件 | 型号 / 规格 | 备注 |
|---|---|---|
| 主控板 | 立创·泰山派 RK3566 | 4GB RAM,**无 eMMC**,只能 SD 启动 |
| 摄像头 | OV8858(模组名 HS5885-BNSM1018-V01) | MIPI CSI,4-lane |
| 存储 | 16GB microSD 卡 | 板上识别为 mmcblk1 |
| 串口 | USB 转 TTL + GH1.25-4P 线 | 调试命脉,见第 2 章 |
| 显示 | HDMI 显示器 | 1920x1080 |
| 主机 | Windows + VMware 里的 Ubuntu | 交叉编译在 Ubuntu 里做 |

## 软件路线

| 层 | 用什么 | 来源 |
|---|---|---|
| Bootloader | U-Boot 2017.09 | 立创官方底包,不动 |
| 内核 | Linux 4.19.232 | **自己编译**(这就是本次的主战场) |
| 根文件系统 | buildroot | 博主提供,驱动全内建 |
| 应用 | ai-cam-ui-widget(预编译) | 博主提供,无源码 |

## 三个阶段

1. **跑起来**:烧系统、接串口、看到启动日志
2. **看见画面**:补驱动、改设备树、打通 CSI → ISP → 显示
3. **自己写**:替换掉预编译的应用,做自己的 UI

## 先看结论:本系列最大的 5 个坑

如果你只想知道"别踩什么",看这张表就够了,细节在各章:

| 坑 | 现象 | 在哪一章 |
|---|---|---|
| dd 把镜像烧成了普通文件 | 烧写"成功"但板子毫无变化 | 第 4 章 |
| 手改 DTB 硬开 HDMI | 黑屏 + 内核 panic | 第 6 章 |
| 3A 服务没启动 | 画面白天也是黑的 | 第 9 章 |
| 两个 3A 同时跑 | 画面亮了一直闪绿光 | 第 9 章 |
| 后台进程读走串口 stdin | 串口 shell 失灵 | 第 10 章 |

> 贯穿全文的一条经验:**嵌入式调试里,"命令返回成功"和"事情真的发生了"是两码事。** 每一次都要回头验证——\`test -b\` 看是不是块设备、\`md5sum\` 比对回读、\`dmesg\` 看驱动有没有真的绑定。这一条至少帮我省下一天。
`,
  },
  {
    id: "serial-debug",
    title: "2. 串口调试环境:从接线到看懂启动日志",
    content: `
## 为什么必须先搞定串口

板子没有屏幕(一开始 HDMI 也没调通)、没有网络(以太网驱动在这颗内核上会 panic)、SD 卡插拔又不方便。**串口是唯一能看见板子内部状态的窗口**——启动到哪一步、内核有没有崩、驱动有没有加载,全靠它。

结论:**串口是这条路的第一优先级,先接通它,再谈其他。**

## 接线

泰山派的调试串口是一个 4Pin 的 GH1.25 座子,丝印是 **V R T G**:

| 丝印 | 含义 | 接到 USB-TTL |
|---|---|---|
| V | VCC(可不接) | 建议不接,板子自己供电 |
| R | RXD(板子的接收) | 接转接板的 **TX** |
| T | TXD(板子的发送) | 接转接板的 **RX** |
| G | GND | 接 GND |

> 串口是**交叉接线**:板子的 T 接你的 R,板子的 R 接你的 T。接反了的现象是"能连上但一个字符都收不到"。

## 头号容易忽略的点:波特率是 1500000

**泰山派的调试串口波特率是 1500000,不是常见的 115200。**

第一次用 115200 打开串口,满屏乱码,我还以为是线接错了。记住这一条:

\`\`\`text
串口参数:1500000 8N1(8 数据位 / 无校验 / 1 停止位),无流控
\`\`\`

用 MobaXterm 或 PuTTY 都可以,Windows 上把波特率手动填成 1500000。

## 一段完整的启动日志长什么样

接通后上电,正常会看到三段内容,顺序固定:

\`\`\`text
[1] U-Boot 阶段
    U-Boot 2017.09 #root (Sep 15 2023 - 12:13:44 +0000)
    ... 打印 DDR 容量、加载 boot.img、跳转内核
    Starting kernel ...

[2] 内核阶段
    [    0.000000] Linux version 4.19.232 ...
    [    0.000000] ... 一堆外设 probe 日志
    [    x.xxxxxx] Run /sbin/init as init process

[3] 用户态阶段
    一堆 init 脚本的输出,最后出现:
    root@RK356X:/#
\`\`\`

看到 \`root@RK356X:/#\` 就说明系统起来了。**如果停在中间某一步,那一步的日志就是最重要的线索。**

## 几个读日志的实用命令

\`\`\`bash
cat /proc/version      # 内核编译时间(判断板子上跑的到底是不是我刚烧的内核)
cat /proc/cmdline      # 内核启动参数(root= 指向哪个分区、是不是 recovery 模式)
dmesg | tail -50       # 本次开机内核日志的尾部
dmesg | grep -i xxx    # 按关键字过滤,最常用
\`\`\`

\`cat /proc/version\` 是**每次烧写完必做的一步**:编译时间对不上,说明烧的根本不是刚编译的那个镜像(第 4 章就是这么发现的)。

## 踩坑记录

| 现象 | 原因 | 解决 |
|---|---|---|
| 满屏乱码 | 波特率错(用了 115200) | 改成 **1500000** |
| 一个字符都没有 | TX/RX 接反 | 交叉接线 |
| 能进系统但没有回显 | 串口 stdin 被后台程序读走了 | 见第 10 章 |
| 日志刷个不停停不下来 | 摄像头/应用在疯狂打印 | 降内核日志等级,见第 10 章 |
`,
  },
  {
    id: "recovery-boot",
    title: "3. 误入 Recovery:一次按键引发的排查",
    content: `
## 现象

某天开始,板子怎么重启都进不去系统,一直停在 Recovery 模式,HDMI 上也不显示正常画面。

## 排查过程(以及一次错误判断)

第一反应是:**是不是 misc 分区里的 BCB(Bootloader Control Block)脏了?**

因为 Android 系的分区方案里,misc 分区专门存"下次该进 Recovery 还是正常启动"这种标志,一旦被置位,就会一直进 Recovery。这个判断听起来很合理,于是我:

\`\`\`bash
# 清掉 misc 分区(在 recovery 里执行)
dd if=/dev/zero of=/dev/block/by-name/misc bs=4096 count=1
sync
reboot
\`\`\`

**没有任何效果。**

## 真正的线索在 U-Boot 日志里

回到串口,把启动日志从头看了一遍,答案就明明白白写在 U-Boot 阶段:

\`\`\`text
download key pressed... entering recovery mode!
boot mode: recovery (key)
\`\`\`

关键信息是 **\`(key)\`** —— 进入 Recovery 的原因是**按键**,不是分区标志。

泰山派上有一颗 **RECOVERY / DOWNLOAD 按键**,上电时如果它处于按下状态,U-Boot 就直接进 Recovery。我检查了一下,那颗按键确实是被压住/卡住的状态。

把按键恢复正常、冷启动,系统就正常进桌面了。

## 教训

> **看到现象先去看第一手日志,不要凭经验猜。** 我按"misc 分区"的经验排查、查文档、执行命令,折腾了半小时,而真正的答案在启动日志里就写着,只是我没从头读。

## 顺手记下来的分区表

排查时把分区关系理清楚了,后面烧写要用。这颗板子上 SD 卡是 \`mmcblk1\`(**不是 mmcblk0**),by-name 软链接对应关系:

| by-name | 实际分区 | 大小 | 用途 |
|---|---|---|---|
| uboot | mmcblk1p1 | 4M | U-Boot |
| misc | mmcblk1p2 | 4M | 启动标志 |
| boot | mmcblk1p3 | 64M | 内核 + 资源 |
| recovery | mmcblk1p4 | 64M | Recovery |
| backup | mmcblk1p5 | 32M | 备份 |
| rootfs | mmcblk1p6 | 6G | 根文件系统 |
| oem | mmcblk1p7 | 128M | OEM |
| userdata | mmcblk1p8 | 8.6G | 用户数据 |

\`\`\`bash
# 看分区对应关系
ls -l /dev/block/by-name/
cat /proc/partitions
\`\`\`

> 注意:**我们的 boot.img(内核)烧到 \`boot\` 也就是 mmcblk1p3**。而 PC 上把 SD 卡插进读卡器时,同一个分区会变成 \`/dev/sdc3\`(卡是 sdc,不是 sda/sdb)。设备名会因为插法而变,**永远不要靠记忆敲设备名**,先 \`lsblk\` 确认。
`,
  },
  {
    id: "sd-flash",
    title: "4. 系统烧写:把镜像烧成了空气的大坑",
    content: `
## 现象:烧写"成功"了,但板子完全没变

我改完内核,重新编译出 boot.img,信心满满地烧进 SD 卡。\`dd\` 命令**没有任何报错**,跑完就提示符返回。插回板子重启——行为跟没烧之前一模一样,还是旧内核。

重新烧了三遍,都一样。

## 根因:那根本不是一个块设备

直到我把 \`dd\` 的目标看一眼:

\`\`\`bash
ls -l /dev/sdc3
-rw-r--r-- 1 root root 24050176 /dev/sdc3
\`\`\`

**注意开头是 \`-rw-r--r--\`,不是 \`brw-rw----\`。**

也就是说,\`/dev/sdc3\` 根本不是一个块设备,而是一个**普通文件**!

原因很简单:上一次操作时,SD 卡不在读卡器里(或者还没枚举完成),\`/dev/sdc3\` 这个路径不存在。而 \`dd if=boot.img of=/dev/sdc3\` 里,shell 会**很贴心地帮你创建这个文件**,然后老老实实把 24MB 数据写进一个普普通通的文件里。

> **\`dd\` 不会因为目标是"一个名字奇怪的文件"而报错。它只负责写。这是它最危险的地方。**

板子当然没变——数据全写在虚拟机硬盘上的一个文件里。

## 正确的烧写姿势

### 1. 确认卡已经枚举,并且真的是块设备

\`\`\`bash
lsblk                       # 找到卡对应的设备名(可能是 sdc,也可能是 sdb)
ls -l /dev/sdc3             # 必须是 brw-rw---- 开头(b = block)
test -b /dev/sdc3 && echo "OK:是块设备" || echo "危险:不是块设备"
\`\`\`

**这三条命令是保命的。** 只要 \`test -b\` 不通过,就绝对不要往下走。

### 2. 烧写

\`\`\`bash
sudo dd if=boot.img of=/dev/sdc3 bs=4M conv=fsync
sync
\`\`\`

- \`bs=4M\`:块大小,比默认 512 字节快很多
- \`conv=fsync\`:写完强制落盘,避免拔卡时数据还在缓存里

### 3. **回读校验(最重要的一步)**

\`\`\`bash
# 看看卡上写进去的是不是和源文件一模一样
dd if=/dev/sdc3 of=/tmp/readback.bin bs=4M count=6
md5sum boot.img /tmp/readback.bin
\`\`\`

两个 md5 一致才算真的烧进去了。我现在的做法是**把这几步写成一个脚本**,每次烧写跑脚本,把 \`test -b\` 和 md5 校验都固化进去。

## 怎么确认板子真的跑上了新内核

烧完插回板子,开机后第一件事:

\`\`\`bash
cat /proc/version
Linux version 4.19.232 (ji@ji-VM) ... #2 SMP Wed Sep 16 08:38:05 CST 2026
\`\`\`

**编译时间戳必须和本次编译的一致**(这里是 \`#2\` 加时间)。这是最省事的"到底烧进去没有"的验证。

## 教训

> 任何写块设备的操作,前一行永远先写 \`test -b\`。
> 任何"写入"操作,后面永远跟一次回读校验。
> 光看命令有没有报错是不够的——\`dd\` 把镜像写进一个文件里,它也是"成功"的。
`,
  },
  {
    id: "kernel-build",
    title: "5. 内核编译环境搭建",
    content: `
## 为什么非要自己编译内核

因为**摄像头驱动没编进去**。

板子到手时,OV8858 相关驱动是不在的:\`/dev/media0\` 没有、\`dmesg\` 里搜不到 ov8858。而博主的做法是"驱动全内建"(根文件系统里连 \`/lib/modules\` 都没有),所以只能改内核配置、重新编译内核。

## SDK 从哪来

立创官方提供了泰山派的 Linux SDK。我用的这份是 **Linux 4.9 系的 tarball**(注意里面内核实际版本是 4.19.232,包名和实际版本号不一致,别被名字骗了)。

解压后是一个 \`Release\` 目录,里面是标准的 Rockchip 目录结构:

\`\`\`text
Release/
├── build.sh                 # 总入口脚本
├── device/rockchip/          # BoardConfig(板级编译配置)
├── kernel/                   # 内核源码 ← 主战场
│   └── arch/arm64/
│       ├── configs/          # defconfig
│       └── boot/dts/rockchip/  # 设备树
├── u-boot/
├── buildroot/
└── output/                   # 编译产物
\`\`\`

## 装依赖(在 Ubuntu 编译机上)

缺依赖的报错通常出现在编译中途,很浪费时间。**一次装齐:**

\`\`\`bash
sudo apt update
sudo apt install -y bison flex libssl-dev libncurses-dev bc \\
     rsync python-is-python3 lz4
\`\`\`

> 这里有个小细节:\`python-is-python3\` 很重要。内核和老脚本默认调用 \`python\`,而新版 Ubuntu 只有 \`python3\`,不装这个符号链接,编译会以"python: not found"中断。

## 板级配置在哪

\`device/rockchip/rk356x/BoardConfig-xxx.mk\` 里定义了编译目标。关键几项:

| 配置项 | 作用 |
|---|---|
| \`RK_KERNEL_DTS\` | 用哪个设备树(**改摄像头就改这里**) |
| \`RK_KERNEL_DEFCONFIG\` | 用哪个内核配置 |
| \`RK_BOOT_IMG\` | 产物名,一般是 boot.img |

## 编译

\`\`\`bash
cd Release
./build.sh kernel
\`\`\`

**增量编译只要 1 分钟左右**(只改了配置或设备树时),全量第一次会比较久。如果编译时间很长,建议放后台并记日志,免得 SSH 断了白跑:

\`\`\`bash
nohup ./build.sh kernel > /data/kernel_build.log 2>&1 &
\`\`\`

产物在 \`kernel/boot.img\`。

## 打开摄像头驱动的正确姿势

编辑内核 defconfig,在末尾追加一行:

\`\`\`bash
echo CONFIG_VIDEO_OV8858=y >> kernel/arch/arm64/configs/rockchip_linux_defconfig
\`\`\`

\`=y\` 表示**内建进内核**(不是编译成 .ko 模块)。这一点很关键:因为根文件系统里没有 \`/lib/modules\`,编成模块的话根本没有地方放,也就加载不上。

编完可以自己验证一下配置有没有生效:

\`\`\`bash
grep -i ov8858 kernel/.config                      # 配置项在不在
grep -i ov8858 kernel/System.map | head            # 符号在不在(最硬的证据)
\`\`\`

看到 \`ov8858_probe\`、\`ov8858_s_stream\` 这类符号,说明驱动确实编进内核了。

## 顺带检查的多媒体配置

这颗内核要跑摄像头,下面这些也得是 \`=y\`(Rockchip 的多媒体全家桶):

\`\`\`text
CONFIG_ROCKCHIP_MPP_SERVICE   MPP 服务框架
CONFIG_VIDEO_ROCKCHIP_ISP      ISP(图像信号处理器)
CONFIG_VIDEO_ROCKCHIP_ISP1
CONFIG_ROCKCHIP_RGA2           2D 图形加速
CONFIG_VIDEO_ROCKCHIP_RGA
CONFIG_ROCKCHIP_RKVDEC / RKVENC  编解码
\`\`\`

\`\`\`bash
# 一次性确认
grep -E "ROCKCHIP_MPP_SERVICE|ROCKCHIP_ISP|ROCKCHIP_RGA2|RKVENC|RKVDEC" kernel/.config
\`\`\`
`,
  },
  {
    id: "hdmi-dtb",
    title: "6. HDMI 黑屏与 DTB 的血泪史",
    content: `
## 现象

要让相机出图,先得有屏幕。板子接上 HDMI 显示器,HDMI **完全没有输出**。翻开源方案的说明,里面写着"要改设备树把 HDMI 打开"。

于是我的第一反应是:**这颗板子已经刷好了系统,只是设备树里 HDMI 被关了。那我不重新编译内核,直接在现有的镜像里把 DTB 抠出来改一下再塞回去,不就行了?**

这个想法很自然,也是我这一天最大的教训。

## 我做了什么

\`\`\`bash
# 从 boot.img 里提取设备树 → 反编译 → 改 HDMI 节点 → 重新编译 → 塞回去
dtc -I dtb -O dts -o rk-kernel.dts rk-kernel.dtb
# ...编辑 dts,打开 hdmi 节点...
dtc -I dts -O dtb -o rk-kernel.dtb rk-kernel.dts
# 把新的 dtb 写回镜像
\`\`\`

改完烧进去,结果:黑屏,并且串口刷出内核 panic。

## 为什么会失败:三个叠加的原因

### 原因 1:boot.img 是 U-Boot 的 FIT 镜像,带哈希校验

这颗板子的 \`boot.img\` 不是简单的 kernel+dtb 拼在一起,而是 **U-Boot 的 FIT 格式**,里面分几块:

\`\`\`text
boot.img(FIT)
├── fdt        @ 0x800      设备树
├── kernel     @ 0x1F000    内核
└── resource   @ 0x15C5A00  资源(含另一份 rk-kernel.dtb)
\`\`\`

FIT 里对每一块都记了**哈希**。我用 \`dtc\` 改过 dtb 再写回去,那块内容的字节变了,哈希就对不上:

\`\`\`text
HASH(c): error
Invalid DTB hash
\`\`\`

U-Boot 直接拒绝启动。

### 原因 2:真正被读的那份 DTB,不是你以为的那份

更坑的是:**显示初始化的读数和内核启动用的不是同一份 dtb。**

U-Boot 在初始化显示时,读的是 **resource 里偏移 \`0x800\` 的那份 rk-kernel.dtb**,而不是 FIT 里那个 \`fdt\` 节点。也就是说,我一开始改的位置根本没被用到——改了也没效果。

### 原因 3:U-Boot 会反过来改写内核的显示节点

U-Boot 会根据自己的"活动显示状态",主动去改内核 fdt 里的显示节点。你手改的内容会被它覆盖掉。

## 失败之后的 panic 长什么样

\`\`\`text
panic_on_set_idle
rk_iommu_init -> pd_npu ack failed
\`\`\`

## 正确的路线

**不要手改二进制镜像里的设备树。** 正确做法是:

1. 改 **SDK 源码里的设备树文件**(在 \`kernel/arch/arm64/boot/dts/rockchip/\` 里)
2. 用 \`./build.sh kernel\` **重新编译出完整的 boot.img**
3. 烧这个完整的 boot.img

这样 U-Boot 的哈希、resource、显示改写逻辑全都是自洽的。

改完之后我的做法是:把 SDK 里默认的 CSI 设备树文件换成摄像头模组对应的那份,HDMI 用 SDK 默认已开启的配置(注意:**SDK 默认和开源方案默认是相反的**——SDK 默认开 HDMI、关 DSI,所以这一步反而不用改)。

## 教训

> **不要试图"只改一个字节"地绕开编译流程。** 当一个镜像带校验、有多份副本、而且启动过程会改写它时,手术式修改的复杂度远高于老老实实改源码重编。我在这上面花的时间,足够把内核编译环境搭三遍。
>
> 还有一条:**先确认"我改的那份东西真的是被使用的那份"**。这次两份 dtb 的教训,后来在别的场景又遇到过一次。
`,
  },
  {
    id: "ov8858-dts",
    title: "7. 接入 OV8858:设备树与驱动",
    content: `
## HDMI 通了之后,轮到摄像头

HDMI 有画面之后,摄像头依然是死的:\`/dev/media0\` 不存在、\`dmesg | grep ov8858\` 什么都没有。

## 第一步:把驱动编进内核

见第 5 章,一行配置:

\`\`\`bash
echo CONFIG_VIDEO_OV8858=y >> kernel/arch/arm64/configs/rockchip_linux_defconfig
\`\`\`

重编后内核里就有了 ov8858 驱动。

## 第二步:设备树告诉内核"摄像头接在哪、怎么接"

这一步才是关键。设备树要回答几个问题:接在哪条 I2C 上、地址多少、几 lane、复位和电源脚是哪个 GPIO、模组叫什么名字。

我用的模组是 **HS5885-BNSM1018-V01**,关键属性:

| 属性 | 值 | 说明 |
|---|---|---|
| I2C 总线 / 地址 | i2c4 / \`0x36\` | OV8858 的 7 位地址 |
| \`data-lanes\` | **4 lane** | 决定了能用哪些分辨率(见下) |
| \`reset-gpios\` | GPIO4_B5 | 复位脚 |
| \`pwdn-gpios\` | GPIO4_B4 | 掉电脚 |
| \`power-gpios\` | GPIO0_B0 | 电源控制 |
| \`rockchip,camera-module-name\` | \`HS5885-BNSM1018-V01\` | **必须和 IQ 文件名对应** |
| \`lens-name\` | \`default\` | 同上 |
| \`lens-focus\` | \`&dw9714\` | 对焦马达(该节点我是 disabled 的) |

> **\`camera-module-name\` 和 \`lens-name\` 不是随便写的注释,它们是运行时用来拼 IQ 调校文件名用的。** 拼出来的文件名必须能在 \`/etc/iqfiles/\` 里找到,否则 3A(自动曝光/白平衡)拿不到调校参数,画面就是黑或偏色——第 9 章会看到这个坑的真实后果。

## 一个必须知道的限制:4 lane 只有一种分辨率

驱动源码里的 mode 表是这样分组的:

| lane 数 | 支持的分辨率 |
|---|---|
| **4 lane** | **只有 3264x2448 @ 30fps** |
| 2 lane | 3264x2448、1632x1224 |

我们的设备树用的是 4 lane,所以**传感器永远以 3264x2448 采集**,没有别的选择。想要 1080p 只能靠后面 ISP 去缩放(见第 11 章)。

## 验证驱动有没有真的绑上

编完烧完重启,这几条日志是"成功"的标志:

\`\`\`bash
dmesg | grep -i ov8858
\`\`\`

\`\`\`text
ov8858 4-0036: driver version: 00.01.06
ov8858 4-0036: Detected OV008858 sensor, REVISION 0xb2
rockchip-csi2-dphy csi2-dphy0: dphy0 matches m00_b_ov8858 4-0036:bus type 4
\`\`\`

三行的含义:

| 日志 | 含义 |
|---|---|
| \`driver version\` | 驱动加载了 |
| \`Detected OV008858 sensor\` | **I2C 通了**,读到了芯片 ID |
| \`dphy0 matches m00_b_ov8858 4-0036\` | **MIPI D-PHY 和 sensor 关联成功** |

第三行尤其重要。如果这里失败,会打出 \`No link between dphy and sensor\` —— 那说明设备树里 lane 数、端口 endpoint 的连法有问题,ISP 那层也就永远不会就绪。

> 顺带一个看着吓人但其实无害的日志:\`avdd/dovdd/dvdd ... using dummy regulator\`。意思是这些电源没有在设备树里绑定 regulator,驱动用"假"稳压器占位。这颗板子上摄像头供电是常开的,所以功能正常。

## 这一步之后的产物

驱动绑上之后,系统里会凭空多出一套设备节点:

\`\`\`text
/dev/media0        媒体控制器(整个 ISP 管道的拓扑入口)
/dev/video0..8     各环节的视频节点
/dev/v4l-subdev0.. sensor / dphy / isp 的子设备
\`\`\`

这些东西存在,才说明"摄像头这条路"真的通了。下一章就来看它们之间的拓扑。
`,
  },
  {
    id: "media-pipeline",
    title: "8. 验证 CSI → ISP 链路",
    content: `
## 摄像头出图要经过好几站

这个 SoC 的图像通路不是"sensor 直出",而是好几级接力:

\`\`\`text
OV8858(MIPI 输出)
   │  MIPI CSI-2
   ▼
rockchip-csi2-dphy0        D-PHY 物理层
   ▼
rkisp-csi-subdev           ISP 的 CSI 输入口
   ▼
rkisp-isp-subdev           ISP 本体(缩放/去噪/3A 生效的地方)
   ▼
rkisp_mainpath             ISP 主输出 ──> /dev/video0
rkisp_selfpath             ISP 副输出 ──> /dev/video1
\`\`\`

**任何一站没接上,后面都是假的。** 验证它们连没连上,用 \`media-ctl\`。

## 第一步:确认 ISP 驱动起来了

\`\`\`bash
dmesg | grep -i rkisp
\`\`\`

关键两行:

\`\`\`text
rkisp rkisp-vir0: rkisp driver version: v01.08.00
rkisp rkisp-vir0: Async subdev notifier completed
\`\`\`

**\`Async subdev notifier completed\` 是决定性的那一行。** 它的意思是"ISP 已经把所有挂在它下面的子设备(sensor、dphy)都找到并绑定好了"。看到它,基本就稳了;看不到,那就要回头查第 7 章的 dphy/sensor 关联。

## 第二步:看拓扑

\`\`\`bash
media-ctl -d /dev/media0 -p
\`\`\`

输出内容很多,看这几处就够了:

| 看什么 | 期望 |
|---|---|
| 每个链接的 \`[ENABLED]\` | sensor → dphy → isp → mainpath 一路都是 ENABLED |
| 默认格式 | \`SBGGR10_1X10/3264x2448\`(sensor 的 Bayer 输出格式和分辨率) |
| 设备名 | \`m00_b_ov8858 4-0036\`(4 是 i2c 总线号,0036 是地址) |

看到 \`m00_b_ov8858 4-0036\` 这个名字特别有安全感——它把"哪条总线、哪个地址"都写进名字里了,和你在设备树里写的对得上。

## 第三步:直接抓帧(最硬的验证)

拓扑对了不等于能出数据。最直接的验证是抓一帧下来:

\`\`\`bash
v4l2-ctl -d /dev/video0 \\
  --set-fmt-video=width=1920,height=1080,pixelformat=NV12 \\
  --stream-mmap --stream-count=5 --stream-to=/tmp/frame.nv12
ls -l /tmp/frame.nv12
\`\`\`

**用文件大小反推有没有真的抓到数据**,这是个很好用的技巧:

\`\`\`text
1920 x 1080 x 1.5(NV12 每像素 1.5 字节) x 5 帧 = 15552000 字节
\`\`\`

抓到 \`15552000\` 字节,一帧不多一帧不少,说明**数据真的从 sensor 一路流到了用户态**。

> 值得一提的是:我抓帧时让 ISP 输出 1920x1080,而 sensor 是 3264x2448。文件大小符合 1920x1080 的计算结果,同时 dmesg 里显示 \`ov8858_s_stream: on: 1, 3264x2448@30\` —— 这正好证明**ISP 在做缩放**:sensor 按 8MP 出,ISP 输出 1080p。第 11 章会用到这个能力。

## 抓帧时的日志对照表

抓帧时 dmesg 会跟着刷几条,这些是正常的:

| 日志 | 含义 |
|---|---|
| \`ov8858_s_stream: on: 1, 3264x2448@30\` | sensor 开始出流 |
| \`csi2-dphy0, data_rate_mbps 720\` | D-PHY 速率(4 lane x 720Mbps) |
| \`rkisp-vir0: first params buf queue\` | ISP 收到了第一批 3A 参数 |
| \`tx stream:4 lose frame:0\` | 丢帧计数(0 表示没丢) |

## 常见报错对照

| 报错 | 意思 | 往哪查 |
|---|---|---|
| \`No link between dphy and sensor\` | D-PHY 和 sensor 没关联 | 设备树 lane 数 / endpoint 写法 |
| 没有 \`Async subdev notifier completed\` | ISP 没等到子设备 | 上一条,链路没通 |
| \`/dev/media0\` 不存在 | ISP 完全没起来 | 内核 ISP 配置(\`CONFIG_VIDEO_ROCKCHIP_ISP\`) |
| 抓帧 0 字节 | 链路通了但没数据 | 看 s_stream 日志,多半是 sensor 没真正启动 |
`,
  },
  {
    id: "isp-3a",
    title: "9. 画面又黑又闪绿:3A 的坑",
    content: `
## 现象一:大白天,画面黑得像晚上

链路全通了,抓帧也有数据,把预览应用跑起来——画面出来了,30fps 很流畅,**但是非常黑**。当时是白天,窗外很亮,画面里能看出有景物在动,但整体暗得几乎看不清。

## 根因:AE(自动曝光)根本没在跑

摄像头出图这件事,分两半:

| 部分 | 负责谁 |
|---|---|
| **数据通路** | 驱动 + ISP 硬件(自动完成) |
| **图像质量** | **3A 算法**(AE 自动曝光 / AWB 自动白平衡 / AF 对焦) |

3A 不是硬件自动的,它需要一个**软件进程**周期性地:读取 ISP 统计信息 → 算出该给的曝光和增益 → 写回 ISP。这个进程就是 \`rkaiq_3A_server\`。

**它没启动的时候,ISP 就用一组默认的、固定的短曝光参数**——结果就是白天也一片漆黑。

## 解决:先起 3A 服务,再起应用

\`\`\`bash
killall ai-cam-ui-widget rkaiq_3A_server 2>/dev/null
sleep 1

# 第一步:起 3A 服务
rkaiq_3A_server > /tmp/3a.log 2>&1 &
sleep 3

# 第二步:再起预览应用
/root/ai-cam-ui-widget --platform linuxfb > /dev/null 2>&1 &
sleep 5
\`\`\`

执行完,画面立刻亮了。**顺序不能反**——应用一开始就会去推流,3A 服务后启动的话,前几秒是黑的,而且有些实现会因此拿不到正确的初始参数。

> 我是怎么确认这个结论的?其实一次偶然:先前有一次画面是清晰的,回头一查,那次正是 \`rkaiq_3A_server\` 还在后台跑着。**"偶尔正常"的现象往往最有价值——它说明硬件和链路都没问题,只是某个运行时条件缺失。**

## 现象二:亮是亮了,但一直闪绿光

3A 起来之后画面确实亮了,新的问题来了:**画面不停地闪绿光**,一闪一闪,像信号灯。

原因和现象一正好是一对:**有两个 3A 在抢同一个 ISP 的参数通道。**

\`\`\`text
外部 rkaiq_3A_server  ──写参数──┐
                                ├──> /dev/video8(ISP 参数输入)──> ISP
rockit 应用内部 3A    ──写参数──┘
\`\`\`

两套 3A 各自往 ISP 推参数,交替生效:一套参数正确时画面正常,另一套参数不对时画面发绿。表现出来就是"一直闪绿"。

绿这个颜色也不是随机的:ISP 拿到的参数不对时,输出的就是接近原始 Bayer 数据的偏绿画面,这是这类问题的典型"绿色屏幕"表现。

## 一个判断"谁在提供 3A"的小实验

画面正在跑的时候,把外部 3A 服务杀掉,观察 2 秒:

\`\`\`bash
killall rkaiq_3A_server
\`\`\`

| 现象 | 结论 |
|---|---|
| 画面**立刻变黑** | 应用自己不做 3A,外部服务是唯一来源 → 保留外部服务 |
| 画面**还是亮的,但仍在闪** | 两边都在做 3A,在抢 → 需要关掉其中一边 |

## 如何用数字验证"画面到底亮不亮"

不要靠肉眼判断亮度。抓一帧 NV12,直接统计 Y(亮度)分量的最小值、最大值、平均值:

\`\`\`bash
# 抓一帧 1920x1080 NV12 到 /tmp/f.nv12,然后统计前 1920x1080 字节(即 Y 平面)
v4l2-ctl -d /dev/video0 --set-fmt-video=width=1920,height=1080,pixelformat=NV12 --stream-mmap --stream-count=1 --stream-to=/tmp/f.nv12
od -An -tu1 -v -N 2073600 /tmp/f.nv12 | awk '{for(i=1;i<=NF;i++){s+=$i;n++;if(n==1||$i<mn)mn=$i;if($i>mx)mx=$i}}END{print "min="mn," max="mx," avg="s/n}'
\`\`\`

怎么读结果:

| 结果 | 含义 |
|---|---|
| \`avg\` 很低(比如 10~30)| 曝光严重不足,AE 没在工作 |
| \`avg\` 适中(80~160)| 曝光正常 |
| \`max\` 也很低 | 完全没有高光,基本可以确定是固定短曝光 |

这个脚本的价值在于:**它能让你在"肉眼觉得有点暗"和"真的曝光不足"之间做出客观判断**,也方便做 A/B 对比(起 3A / 不起 3A,各跑一次)。

## 教训

> 摄像头调不通,先分清楚是**数据通路**的问题还是**图像质量(3A)**的问题。前者看 dmesg 和抓帧字节数,后者看 3A 服务在不在、IQ 文件找没找到。这两个方向的排查手段完全不同,混在一起查会非常低效。
`,
  },
  {
    id: "app-autostart",
    title: "10. 预览应用与开机自启",
    content: `
## 手上这个应用是什么

开源方案给的是一个**预编译的可执行文件**(没有源码),大约 100KB 的 aarch64 ELF。用 \`strings\` 和 \`ldd\` 能看出来它的技术栈:

| 依赖 | 用途 |
|---|---|
| \`librockit.so\` | Rockchip 的多媒体中间件(取流/编码/解码) |
| OpenCV 4.5 | 图像处理、拍照存图 |
| \`librga\` | 2D 硬件加速(缩放、色彩转换) |
| Qt5(Widgets/Gui/Core) | 界面显示 |

它的数据管线是这样的:

\`\`\`text
RK_MPI_VI(从 ISP 取流)
   ▼
VPSS(缩放)
   ▼
VENC(硬编码)
   ▼
VDEC(再解回来)
   ▼
RGA(色彩转换/缩放)
   ▼
Qt(上屏)
\`\`\`

> 注意中间这段"编码再解码"的绕路:明明可以直接把帧送给显示,它却走了一遍硬编硬解。这大概是为了复用录像那套通路,代价是**额外吃掉了不少内存带宽**(见第 11 章)。

## 坑:"读取数据失败"刷屏

应用一跑起来,串口就被一行行 \`读取数据失败\` 刷满了,而且 **Ctrl+C 都停不下来**。

用二进制搜索定位了一下,这个字符串在文件里的**偏移 75781**,紧挨着它的是:

\`\`\`text
/dev/input/event3
Can't open event file
../main.cpp
\`\`\`

结论很明确:**这是应用的按键输入线程**,它去读 \`/dev/input/event3\` 这个输入设备,读不到就无限重试并打印。

我们板子上没有这个输入设备(触摸/按键驱动没编进去),所以它就一直在刷。

**处理办法:把标准输出和错误都重定向掉。**

\`\`\`bash
/root/ai-cam-ui-widget --platform linuxfb > /dev/null 2>&1 &
\`\`\`

功能完全不受影响(预览正常),串口也清净了。

## 坑:后台进程把串口 stdin 读走了

第一次写开机自启的时候,我直接在里面起了应用,结果重启后**串口 shell 失灵**——敲什么没反应,或者字符乱跳。

原因是这些后台程序继承了 rcS 的 stdin,而 rcS 的 stdin 就是串口。它们去读串口,把你的键盘输入吃掉了。

**解决办法:每个后台进程都显式给它一个空的 stdin。**

\`\`\`bash
/usr/bin/rkaiq_3A_server < /dev/null > /dev/null 2>&1 &
\`\`\`

\`< /dev/null\` 这一小段是血的教训,别省。

## 顺带:降掉内核日志刷屏

摄像头一开流,内核会跟着打印(\`ov8858_g_mbus_config enter!\` 之类),串口一样很吵。启动脚本末尾降一下日志等级:

\`\`\`bash
echo 3 > /proc/sys/kernel/printk
\`\`\`

\`3\` 表示只往控制台打 error 及以上。想看完整日志时随时改回来:

\`\`\`bash
echo 7 > /proc/sys/kernel/printk
dmesg | tail -50
\`\`\`

## 开机自启:写进 rcS

这套 buildroot 用的是 **busybox 的 run-parts 结构**:\`/etc/init.d/rcS\` 依次执行 \`/etc/init.d/S??*\` 里的脚本。

想保证"在所有初始化脚本都跑完之后"再启动相机,最省事的做法是**直接追加到 rcS 末尾**:

\`\`\`bash
cat >> /etc/init.d/rcS << 'EOF'

# ================= 运动相机自启 =================
# 降内核日志等级,避免串口被摄像头日志刷屏
echo 3 > /proc/sys/kernel/printk

# 1) 先起 3A 服务(必须在 app 之前,否则画面黑)
/usr/bin/rkaiq_3A_server < /dev/null > /dev/null 2>&1 &
sleep 2

# 2) 再起相机 UI(输出丢弃,屏蔽刷屏)
/root/ai-cam-ui-widget --platform linuxfb < /dev/null > /dev/null 2>&1 &
# ==============================================
EOF
sync
\`\`\`

检查一下追加结果:

\`\`\`bash
tail -14 /etc/init.d/rcS
\`\`\`

然后重启验证。**成功的样子是:HDMI 自动出现画面、是亮的,而串口干净地停在 shell 提示符。**

## 重启后的验收清单

\`\`\`bash
ps | grep -E "rkaiq|ai-cam"     # 两个进程都在
cat /proc/version               # 内核编译时间对得上
ls -l /dev/media0 /dev/video0   # 设备节点都在
\`\`\`

| 检查项 | 期望 |
|---|---|
| HDMI | 自动出现画面,**是亮的** |
| 串口 | 停在 \`root@RK356X:/#\`,不刷屏 |
| 进程 | \`rkaiq_3A_server\` 和 \`ai-cam-ui-widget\` 都在 |

## 日常操作

\`\`\`bash
# 临时关掉预览
killall ai-cam-ui-widget

# 手动再拉起来(注意顺序:先 3A 后应用)
rkaiq_3A_server < /dev/null > /dev/null 2>&1 &
sleep 2
/root/ai-cam-ui-widget --platform linuxfb < /dev/null > /dev/null 2>&1 &
\`\`\`
`,
  },
  {
    id: "resolution-bandwidth",
    title: "11. 分辨率与带宽:8MP 的代价",
    content: `
## 三个"分辨率"不是一回事

刚跑通的时候我很疑惑:"我这相机到底是多少万像素的?" 查完发现,**同一台机器在不同环节上的分辨率完全不同**,必须分开看:

| 环节 | 分辨率 | 怎么来的 |
|---|---|---|
| 传感器采集 | **3264x2448(8MP)** | 4 lane 模式只有这一个分辨率 |
| ISP 输出(\`/dev/video0\`) | **3264x2448** | 默认透传,但可以改 |
| 拍照 | **3264x2448** | 直接把 ISP 出的帧存成 JPG |
| 录像 | 约 **3264x2448** | 走 VENC 编码 |
| HDMI 显示 | **1920x1080** | 缩放后才上屏 |

\`\`\`bash
# 查 ISP 主输出的实际格式
v4l2-ctl -d /dev/video0 --get-fmt-video
\`\`\`

\`\`\`text
Width/Height      : 3264/2448
Pixel Format      : 'NV12' (Y/CbCr 4:2:0)
Bytes per Line    : 3264
Size Image        : 11985408
\`\`\`

注意 \`Size Image = 11985408 = 3264 x 2448 x 1.5\`,和 NV12 的 1.5 字节/像素完全吻合。

## 算一下带宽:这个数字有点吓人

数据是**连续流动**的,所以要看"每秒多少字节":

\`\`\`text
3264 x 2448 x 1.5 字节 x 30 帧/秒
= 11985408 x 30
≈ 360 MB/s
\`\`\`

**每秒 360MB。** 这还只是"采集"这一份,后面还有:

| 环节 | 额外开销 |
|---|---|
| ISP 输出 | 1 份(360 MB/s) |
| VENC 编码器读一帧 | 1 份 |
| VDEC 解码器再写一帧 | 1 份 |
| RGA 缩放后上屏(1080p) | 约 90 MB/s |
| Qt 上屏 | 约 90 MB/s |

这些都在抢同一块 DDR 的带宽。RK3566 的内存带宽是有限的,**这就是之前偶尔卡顿、掉帧的根本原因**——不是 CPU 不够快,是内存带宽被 8MP 数据流吃满了。

## 好消息:ISP 自己会缩放

抓帧的时候我已经验证过了:**让 ISP 输出 1920x1080,sensor 依然按 3264x2448 采集,ISP 负责把画面缩下去。**

\`\`\`text
dmesg 显示:sensor 出流 3264x2448@30
文件大小反推:实际拿到的是 1920x1080
→ 中间的缩放就是 ISP 干的
\`\`\`

这意味着**带宽可以从源头砍掉**:ISP 直接输出 1080p,后面的所有环节都只需要处理 1080p 的数据。

\`\`\`text
3264x2448 NV12 @30fps  ≈ 360 MB/s
1920x1080 NV12 @30fps  ≈  93 MB/s   ← 只要 1/4
\`\`\`

## 为什么现在还是 8MP

因为**手上这个预览应用是预编译的,改不了它的设定**——它内部就是按 3264x2448 配置的 VPSS。

所以"改成 1080p 直出"这件事,必须等**换成自己的程序**才能做。这也正好是下一阶段的目标:

1. 自己写预览程序:V4L2 取流(直接设 1080p)+ 3A 服务 + 上屏
2. UI 用 **LVGL** 来做(这也是我最初的目标)

## 顺带:CMA 内存也要留意

还有一处和内存相关的配置值得记下来:内核的 CMA(连续内存分配器)预留大小。

\`\`\`bash
# 内核配置里查
grep CMA_SIZE_MBYTES kernel/.config
\`\`\`

我这份配置是 \`CONFIG_CMA_SIZE_MBYTES=16\`,而且板级设备树里没有 \`linux,cma\` 节点,也就是**只有 16MB CMA**。对于 8MP 这种大帧缓冲,这是个偏紧的数字,后面如果出现"申请 DMA 缓冲失败"之类的报错,要第一时间回来查这里。
`,
  },
  {
    id: "pitfall-checklist",
    title: "12. 踩坑速查表",
    content: `
## 总表:现象 → 原因 → 解决

把整个过程中所有踩过的坑集中在这里,方便以后快速定位。

| 现象 | 根本原因 | 解决办法 |
|---|---|---|
| 串口满屏乱码 | 波特率不是 115200 | 改成 **1500000** 8N1 |
| 串口收不到任何字符 | TX/RX 没交叉 | 板的 T 接转接板 R,板的 R 接转接板 T |
| 反复进 Recovery | RECOVERY 按键被按住,不是 misc 脏 | 检查按键,冷启动;**不要**去清 misc |
| 烧写完板子毫无变化 | \`dd\` 把镜像写进了普通文件 | 烧前 \`test -b\`,烧后回读 \`md5sum\` |
| 改了 dtb 就 panic | FIT 哈希校验 + 有两份 dtb + U-Boot 会改写 | 改 SDK 源码里的 dts,重新编译 boot.img |
| 驱动改完没生效 | 可能烧的不是新内核 | \`cat /proc/version\` 对编译时间戳 |
| \`dmesg\` 搜不到 ov8858 | 驱动没编进内核 | defconfig 加 \`CONFIG_VIDEO_OV8858=y\` 重编 |
| \`No link between dphy and sensor\` | 设备树 lane/endpoint 没对上 | 检查 \`data-lanes\` 与 endpoint 写法 |
| \`/dev/media0\` 不存在 | ISP 没起来 | 查 \`CONFIG_VIDEO_ROCKCHIP_ISP\` |
| 抓帧 0 字节 | 链路通了但没出流 | 看 \`s_stream\` 日志,确认 sensor 有启动 |
| **白天画面也很黑** | **3A 服务没启动** | 先起 \`rkaiq_3A_server\`,再起应用 |
| **画面亮了一直闪绿** | **两套 3A 抢 ISP 参数** | 只保留一套 3A |
| 串口被"读取数据失败"刷屏 | 应用的按键线程读不到 \`/dev/input/event3\` | 输出重定向 \`> /dev/null 2>&1\` |
| 重启后串口 shell 失灵 | 后台进程读走了串口的 stdin | 加 \`< /dev/null\` |
| 画面偶尔卡顿掉帧 | 8MP 数据流的带宽压力 | ISP 直出 1080p(需自写程序) |
| 申请 DMA 缓冲失败 | CMA 只有 16MB | 调 \`CONFIG_CMA_SIZE_MBYTES\` 或加 \`linux,cma\` |

## 通用方法论(比单个坑更值钱)

### 1. 命令成功 ≠ 事情发生

\`dd\` 写文件也是"成功",\`reboot\` 也可能进了 Recovery。每一步之后都要**独立验证**:

\`\`\`bash
test -b /dev/sdc3        # 是不是块设备
md5sum boot.img readback # 内容是不是真写进去了
cat /proc/version         # 跑的是不是新内核
dmesg | grep -i ov8858    # 驱动是不是真绑上了
\`\`\`

### 2. 先看第一手日志,再凭经验猜

Recovery 那次,答案 \`boot mode: recovery (key)\` 就写在启动日志里,我却在按"misc 分区"的经验折腾。**日志第一。**

### 3. 分岔再排查

- 摄像头问题先分:**数据通路** 还是 **图像质量(3A)**?
- 显示问题先分:**U-Boot 阶段没显示** 还是 **内核起来了没显示**?

方向分对了,排查效率差一个数量级。

### 4. "偶尔正常"是最好的线索

画面黑了很多次、清晰过一次——那一次清晰的场景里,藏着一个"缺失的运行时条件"(当时是 3A 服务在跑)。**抓住那些偶发的成功,对比它和失败的差别。**

### 5. 不要绕开构建流程

手改二进制镜像(第 6 章)看起来省事,实际上要同时对付校验、多副本、运行时改写三件事。改源码重编多花 5 分钟,但结果是自洽的。

## 常用命令速查

\`\`\`bash
# ---- 系统 / 内核 ----
cat /proc/version                       # 内核版本 + 编译时间
cat /proc/cmdline                       # 启动参数
dmesg | grep -iE "ov8858|rkisp|csi2"    # 摄像头相关日志

# ---- 摄像头链路 ----
ls -l /dev/media0 /dev/video0           # 设备节点
media-ctl -d /dev/media0 -p             # 打印拓扑(看 ENABLED 和格式)
v4l2-ctl -d /dev/video0 --get-fmt-video # 查输出格式
v4l2-ctl -d /dev/video0 --list-ctrls    # 查曝光/增益等控件
v4l2-ctl -d /dev/v4l-subdev3 --list-ctrls  # 看 sensor 侧的曝光值

# ---- 抓帧验证 ----
v4l2-ctl -d /dev/video0 --set-fmt-video=width=1920,height=1080,pixelformat=NV12 --stream-mmap --stream-count=5 --stream-to=/tmp/frame.nv12
ls -l /tmp/frame.nv12      # 1920x1080x1.5x5 = 15552000 就对了

# ---- 3A / 应用 ----
ps | grep -E "rkaiq|ai-cam"             # 进程在不在
killall ai-cam-ui-widget rkaiq_3A_server

# ---- 分区 ----
ls -l /dev/block/by-name/               # by-name 软链接
cat /proc/partitions
\`\`\`

## 接下来的计划

| 阶段 | 目标 | 状态 |
|---|---|---|
| 一 | 系统跑起来、串口通 | ✅ |
| 二 | HDMI 显示 | ✅ |
| 三 | OV8858 出图 + 3A | ✅ |
| 四 | 开机自启、可当相机用 | ✅ |
| 五 | 补 IMU / 触摸驱动(防抖录像、触摸交互) | ⏳ |
| 六 | 自写预览程序、LVGL UI、1080p 直出 | ⏳ |

> 到这里,这台机器已经是一台**可以独立工作的运动相机**了:开机自动预览、自动曝光、HDMI 输出。剩下的就是从"能用"走向"自己的东西"。
`,
  },
];
