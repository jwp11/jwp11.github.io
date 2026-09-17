---
title: "Python 学习笔记:从一个 headers 字典到 **kwargs"
date: 2026-08-22
tags:
  - "Python"
  - "学习笔记"
summary: "从调用 API 时的 headers 字典出发,一路搞懂字典嵌套列表、链式取值、元组的逗号陷阱,最后打通 **kwargs 和解包赋值。"
---
这周在读 API 示例代码时被一行代码卡住了:

```python
prediction_id = generate_result["data"]["id"]
```

顺着这行代码,把 Python 的几个基础概念彻底搞明白了,记个笔记。

## 字典的值可以是任何东西

```python
data = {
    "model": "seedance-2.5",
    "reference_images": [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
    ],
}
```

字典套列表、列表套字典,层层嵌套——这不是语法混乱,这就是 **JSON 的 Python 写法**。`json.dumps(data)` 一转,就能直接当请求体发出去。

## 链式取值从左往右剥

`result["data"]["id"]` 的求值过程:

1. `result["data"]` 先取出内层字典
2. `["id"]` 再从内层字典里取值

不管嵌套多少层都是这个规则。稳妥写法用 `.get()`:

```python
prediction_id = generate_result.get("data", {}).get("id")
```

取不到得到 `None` 而不是直接崩,方便先判断再处理。

## 元组是由逗号定义的

最容易踩的坑:

```python
a = ("x", "y")   # 元组,两个元素
b = ("x" "y")    # 字符串自动拼接,得到 "xy"
c = ("xy",)      # 单元素元组,逗号不能省
```

**判断标准:看逗号,不看括号。**

## **opts 不是指针

C 语言的 `**` 是二级指针,Python 里完全是另一回事:

- `def f(**opts)` —— 把多余的关键字参数**打包**成字典
- `f(**d)` —— 把字典**摊开**成关键字参数
- `2 ** 10` —— 乘方

一收一放,互为逆操作。读 pymavlink 源码时看到它把连接字符串里的 `baud=57600` 解析出来塞进 opts 字典,和关键字参数合并处理,设计得挺优雅。

## if __name__ == "__main__"

`__name__` 是 Python 自动填的变量:直接运行时等于 `"__main__"`,被 import 时等于模块名。所以这段代码的意思是:**只有直接运行本文件才执行,被导入时不执行**。让一个文件既能当脚本跑、又能当模块被复用。

接下来准备拿这些知识写一个调用视频生成 API 的完整脚本:提交任务 → 轮询状态 → 下载视频。
