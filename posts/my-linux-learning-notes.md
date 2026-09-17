---
id: my-linux-learning-notes
title: linux sdk源码介绍笔记
date: 2026-09-17
tags:
  - rk3566
  - sdk
summary: blbl linux内核笔记 学习
---
# linux sdk 源码学习笔记

1.device/rockchip/ 芯片平台中心

2.uboot/ 制造启动引导程序

3.kernel-6.1/ 制造linux内核

4.buildroot/ 制造根文件系统，linux下一切都是文件

5.external 第三方组件，例如wifi固件

6.prebuilts/ 预编译好的交叉工具链

7.rkbin/ + tools/ 固件签名，打包，烧写工具

总之，改动任何平台配置都离不开device/rockchip/

# sdk顶层目录全景，把顶层十几个目录一次性列清楚

整个sdk的编译调度中心

