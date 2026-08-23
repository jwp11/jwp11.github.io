/* ============================================
   Python 语法教程内容 —— 20 章完整版
   每个语法点:先讲「作用」和「使用场景」,再看代码
   ============================================ */

const PY_CHAPTERS = [
  {
    id: "hello",
    title: "1. 初见 Python",
    content: `
## print:让程序开口说话

**作用**:\`print()\` 把内容显示到屏幕上,是你调试程序、查看结果的第一工具。

**使用场景**:想知道变量的值是多少?程序运行到哪一步了?打印出来看一眼,是最直接的办法。

\`\`\`python
print("Hello, Python!")      # 打印一句话
print(1 + 1)                 # 打印计算结果:2
name = "小明"
print("你好,", name)          # 可以一次打印多项:你好, 小明
\`\`\`

## 注释:写给人看的说明

**作用**:以 \`#\` 开头的内容是注释,Python 运行时会完全忽略它。

**使用场景**:给代码写说明书——解释这段代码为什么这么写、注意什么。三个月后的你会感谢现在写注释的你。

\`\`\`python
age = 18   # 把 18 存进 age 这个变量(注释跟在代码后面也行)
# 下面这行代码暂时不想运行,注释掉即可:
# print("调试信息")
\`\`\`

## 变量:给数据贴名字标签

**作用**:变量就是一个"贴了名字的盒子",把数据装进去,之后用名字就能取出数据。

**使用场景**:任何需要"先存起来、后面再用"的数据——用户名、计算结果、文件内容……变量是编程的基本单位。

\`\`\`python
name = "小明"      # 把字符串装进 name
age = 18           # 把整数装进 age
height = 1.75      # 小数(浮点数)
is_student = True  # 真/假(布尔值),只有 True 和 False 两种

print(name)        # 用名字取数据:小明
\`\`\`

Python 的变量**不需要提前声明类型**,装什么就是什么类型。命名规则:只能用字母、数字、下划线,不能数字开头,区分大小写;习惯写成全小写加下划线,如 \`user_age\`。

## 多变量赋值与交换

**作用**:一行给多个变量赋值。\`a, b = b, a\` 是 Python 特有的优雅写法,一行完成两个变量互换。

**使用场景**:排序、算法中经常需要交换两个值;接收函数返回的多个结果时也用它。

\`\`\`python
a, b = 1, 2        # 同时赋值:a=1, b=2
a, b = b, a        # 交换!现在 a=2, b=1
print(a, b)        # 2 1
\`\`\`
`,
  },
  {
    id: "types",
    title: "2. 数字与类型转换",
    content: `
## 三种基本数据类型

**作用**:Python 用类型区分数据的种类——整数(\`int\`)是没有小数点的数;浮点数(\`float\`)带小数点;布尔值(\`bool\`)只有真(\`True\`)和假(\`False\`)两个值。

**使用场景**:计数、年龄、金额用整数;身高、精度计算用浮点数;"是否登录""是否成年"这类只有两种状态的判断用布尔值。

\`\`\`python
x = 10          # int 整数
y = 3.14        # float 浮点数
flag = True     # bool 布尔值(注意首字母大写)
\`\`\`

**查看与判断类型**:\`type()\` 告诉你数据是什么类型;\`isinstance()\` 判断"是不是某类型",返回 True/False。

\`\`\`python
print(type(x))             # <class 'int'>
print(isinstance(x, int))  # True
\`\`\`

## 类型转换:把数据变成需要的类型

**作用**:\`int()\`、\`float()\`、\`str()\` 把数据从一种类型转成另一种。

**使用场景**:最常见的一幕——\`input()\` 收到的键盘输入**永远是字符串**,想参与数学计算必须先转成数字。

\`\`\`python
int("42")       # 字符串 "42" → 整数 42
float("3.14")   # → 3.14
str(100)        # 数字 100 → 字符串 "100"

age = int(input("请输入年龄:"))   # 输入 "20" → 转成整数 20
print(age + 1)                     # 21(不转换的话会报错)
\`\`\`

> **坑**:\`int("abc")\` 会直接报错(ValueError)。转换前要确保内容真的是数字。

## 除法的三个面孔

**作用**:同样是"除",三种运算符行为完全不同——这点是新手最容易混淆的。

\`\`\`python
print(10 / 4)    # 2.5   普通除法,结果永远是小数
print(10 // 4)   # 2     整除,丢掉小数部分(向下取整)
print(10 % 4)    # 2     取余数(模运算)
print(2 ** 10)   # 1024  乘方(** 不是指针!)
\`\`\`

**使用场景**:\`//\` 用于"只要整数份"的场景,如把 100 分钟换成多少整小时;\`%\` 用于判断整除、循环取值——\`n % 2 == 0\` 判断偶数是最经典的用法。
`,
  },
  {
    id: "operators",
    title: "3. 运算符一览",
    content: `
## 算术运算符:做数学题

**作用**:对数字进行加减乘除等运算。

| 运算符 | 含义 | 示例 |
|---|---|---|
| \`+\` \`-\` \`*\` | 加、减、乘 | \`1 + 2 * 3\` → 7(先乘除后加减) |
| \`/\` | 除(结果必是小数) | \`10 / 4\` → 2.5 |
| \`//\` | 整除 | \`10 // 4\` → 2 |
| \`%\` | 取余数 | \`10 % 4\` → 2 |
| \`**\` | 乘方 | \`2 ** 8\` → 256 |

## 比较运算符:得出"是真是假"

**作用**:比较两个值的大小或是否相等,**结果永远是布尔值** True 或 False。

**使用场景**:几乎所有判断语句的条件部分都靠它——"分数 >= 60"“名字 == 'admin'"。

\`\`\`python
print(3 > 2)       # True
print(3 == 3.0)    # True(值相等)
print("a" != "b")  # True
\`\`\`

> **头号新手坑**:\`==\` 是比较"相等吗",\`=\` 是赋值"存进去"。条件里写 \`if x = 5\` 会直接报错。

## 逻辑运算符:组合多个条件

**作用**:把多个 True/False 组合成一个结论。Python 用英文单词:\`and\`(并且)、\`or\`(或者)、\`not\`(取反)。

**使用场景**:"年龄满 18 **并且**带证件才能进"(\`and\),"周一**或**周五开会"(\`or\`),"**不是**会员"(\`not\`)。

\`\`\`python
age = 20
has_id = True

age >= 18 and has_id    # True:两个条件都满足才 True
age < 12 or age > 65    # False:满足其中一个就是 True
not has_id              # False:真假互换
\`\`\`

## 成员运算符 in:判断"在不在里面"

**作用**:\`in\` 检查某个值是否存在于列表、字符串、字典等容器中。

**使用场景**:黑名单校验(\`ip in blacklist\`)、敏感词过滤、查找前先确认存在。

\`\`\`python
nums = [1, 2, 3]
print(2 in nums)         # True
print("py" in "python")  # True,字符串也能查
print(5 not in nums)     # True
\`\`\`

## is 与 == 的区别

**作用**:\`==\` 比较**值**是否相等;\`is\` 比较**是不是同一个对象**(内存里同一块地方)。

\`\`\`python
a = [1, 2]; b = [1, 2]
a == b     # True:内容一样
a is b     # False:两个不同的列表对象

x = None
x is None  # True —— 判断 None 官方推荐只用 is
\`\`\`

## 海象运算符 :=(进阶,3.8+)

**作用**:在判断的同时完成赋值,"边赋值边使用"。

\`\`\`python
# 老写法要两行:n = len("hello"); if n > 3:
if (n := len("hello")) > 3:
    print(f"长度是 {n}")   # n 已经赋好值,直接用
\`\`\`
`,
  },
  {
    id: "strings",
    title: "4. 字符串详解",
    content: `
## 字符串是什么

**作用**:字符串(\`str\`)用来存文本——名字、地址、一段话、文件内容。写法:单引号或双引号包起来,效果一样。

**使用场景**:凡是"文字信息"都是字符串:处理用户输入、拼接提示语、解析文本文件。

## 索引与切片:按位置取字符

**作用**:每个字符有编号(**从 0 开始**),方括号加编号就能取出对应字符;冒号可以"切"出一段。

\`\`\`python
s = "Hello, Python"
s[0]       # 'H' —— 第 0 个字符
s[-1]      # 'n' —— 负数从末尾倒数,-1 是最后一个
s[0:5]     # 'Hello' —— 切片[起:止],包含起、不包含止
s[7:]      # 'Python' —— 省略终点 = 取到结尾
s[::-1]    # 'nohtyP,olleH' —— 步长 -1,反转字符串
len(s)     # 13 —— 字符串长度
\`\`\`

**使用场景**:取文件扩展名 \`filename[-3:]\`、手机号打码 \`phone[:3] + "****" + phone[-4:]\`。

## f-string:把变量嵌进字符串(重点!)

**作用**:\`f"...\` 字符串里用 \`{变量名}\` 直接嵌入值,是 Python 最推荐的格式化方式。

**使用场景**:拼提示语、生成日志、输出报告——比 + 号拼接方便太多。

\`\`\`python
name = "小明"
score = 92.5

print(f"{name} 的成绩是 {score}")     # 小明 的成绩是 92.5
print(f"保留一位小数:{score:.1f}")     # 92.5
print(f"补零:{7:03d}")                # 007
print(f"直接算:{3 * 4 + 1}")          # 13,花括号里能写表达式
\`\`\`

## 常用字符串方法

**作用**:方法就是"字符串自带的处理功能",用 \`变量名.方法名()\` 调用。

\`\`\`python
s = "  Hello World  "
s.strip()              # 去掉两端空白 → 'Hello World'(清理用户输入必备)
s.lower()              # 全转小写;s.upper() 全转大写
s.replace("o", "0")    # 替换字符 → 'Hell0 W0rld'

"a,b,c".split(",")     # 按逗号切开 → ['a','b','c'] 列表(解析CSV、拆分输入)
"-".join(["2026","08","23"])  # 用 - 把列表拼回字符串 → '2026-08-23'

"hello".startswith("he")  # True,判断开头;endswith() 判结尾
"hello".find("ll")        # 2,查找位置;找不到返回 -1
"hello".count("l")        # 2,统计出现次数
\`\`\`

> **关键概念**:字符串是**不可变的**——所有"修改"方法都返回**新字符串**,原字符串永远不变。所以必须用变量接住结果:\`s = s.strip()\`,只写 \`s.strip()\` 等于白干。
`,
  },
  {
    id: "conditions",
    title: "5. 条件判断",
    content: `
## if 语句:让程序学会"看情况"

**作用**:根据条件的真假,决定执行哪段代码——这是程序"做决定"的方式。

**使用场景**:到处都是——分数及格吗?用户存在吗?密码对吗?

\`\`\`python
score = 85

if score >= 90:          # 注意行尾的冒号
    print("优秀")         # 缩进 4 格的代码属于 if
elif score >= 80:        # else if 的缩写,上一个不成立才检查它
    print("良好")         # ← score=85 会走到这里
elif score >= 60:
    print("及格")
else:                    # 以上全不成立
    print("不及格")
\`\`\`

**语法要点**:条件后写冒号 \`:\`;归属某分支的代码**缩进 4 个空格**——Python 用缩进表示层级,缩进错了程序就错。

## 三元表达式:一行搞定小判断

**作用**:简单的"二选一赋值"压缩成一行。

\`\`\`python
# 等价于三行 if-else
level = "成年" if age >= 18 else "未成年"
\`\`\`

## 真值:哪些算"假"

**作用**:\`if\` 后面不一定写比较表达式,任何值都能直接判断真假。

**视为 False 的值**:\`None\`、\`0\`、\`""\` 空字符串、\`[]\` 空列表、\`{}\` 空字典。**其余一律为 True**。

\`\`\`python
name = input("姓名:")
if name:                  # 非空字符串 = True,说明用户输入了内容
    print(f"你好,{name}")
else:
    print("你没有输入任何内容")
\`\`\`

## match-case:新版多分支(3.10+)

**作用**:对一个值做"多选一"匹配,比一长串 if-elif 更清晰。

**使用场景**:解析命令(\`start\`/\`stop\`)、按状态码分发处理。

\`\`\`python
command = "start"
match command:
    case "start":
        print("启动")
    case "stop" | "exit":     # 竖线让多个值匹配同一分支
        print("停止")
    case _:                    # 下划线 = 兜底,匹配其他所有值
        print("未知命令")
\`\`\`
`,
  },
  {
    id: "loops",
    title: "6. 循环",
    content: `
## for 循环:逐个处理每一项

**作用**:把序列(列表、字符串、范围……)里的元素**挨个取出**处理一遍。

**使用场景**:统计全班成绩、处理文件每一行、给列表每个元素加工——"批量处理"就用 for。

\`\`\`python
for fruit in ["苹果", "香蕉", "橘子"]:   # 依次取出每个元素
    print(fruit)                        # 打印三行

for ch in "abc":        # 字符串也是序列,能逐字符遍历
    print(ch)

for i in range(5):      # range(5) 生成 0,1,2,3,4
    print(i)            # range(起, 止, 步长),如 range(2, 10, 2) → 2,4,6,8
\`\`\`

## while 循环:满足条件就一直转

**作用**:只要条件为 True 就反复执行,直到条件变 False。

**使用场景**:"重复到某件事发生为止"——游戏主循环、重试请求、等待用户输入正确内容。次数不确定时用 while,次数确定用 for。

\`\`\`python
count = 0
while count < 3:
    print(count)
    count += 1        # 必须更新条件!否则永远 True,变成死循环
\`\`\`

## break 与 continue:中途控制循环

**作用**:\`break\` 立刻**彻底跳出**循环;\`continue\` **跳过本轮**剩余代码,直接进入下一轮。

\`\`\`python
for n in range(10):
    if n == 3:
        continue       # 3 被跳过,不执行下面的打印
    if n == 7:
        break          # 到 7 直接结束整个循环
    print(n)           # 输出:0 1 2 4 5 6
\`\`\`

**使用场景**:\`break\`——找到目标就停止搜索;\`continue\`——过滤掉不想要的,只处理剩下的。

## 循环的 else:没被 break 才执行(冷知识)

\`\`\`python
for n in [2, 4, 6]:
    if n % 2 == 1:
        print("发现奇数!")
        break
else:                   # 循环正常跑完(没被 break)才执行
    print("全是偶数")
\`\`\`

## enumerate 与 zip:带编号遍历、两两配对

**作用**:\`enumerate\` 让你**同时**拿到下标和元素;\`zip\` 把两个序列**两两配对**。

**使用场景**:\`enumerate\`——打印排行榜名次;\`zip\`——姓名列表配成绩列表。

\`\`\`python
for i, fruit in enumerate(["苹果", "香蕉"]):
    print(f"第{i+1}名:{fruit}")

for name, score in zip(["小明", "小红"], [90, 85]):
    print(f"{name}:{score}分")     # 小明:90分 / 小红:85分
\`\`\`
`,
  },
  {
    id: "lists",
    title: "7. 列表",
    content: `
## 列表是什么

**作用**:列表(\`list\`)是一个**有序、可修改**的容器,能按顺序存放任意多个值。

**使用场景**:凡是"一组同类数据"都适合——购物清单、班级成绩、待办事项。它是 Python 使用频率最高的容器。

\`\`\`python
nums = [3, 1, 4, 1, 5]
mixed = [1, "hello", True, [2, 3]]   # 混着装也行,但一般装同类

nums[0]      # 3,索引从 0 开始(和字符串一样)
nums[-1]     # 5,负数倒数
nums[1:4]    # [1, 4, 1],切片规则同字符串
\`\`\`

## 增删改:四种"增"的区别

**作用**:列表是**可变**的——创建之后随时能加、删、改。

\`\`\`python
nums = [1, 2]
nums.append(3)         # 尾部加一个 → [1,2,3](最常用)
nums.insert(0, 0)      # 插到指定位置 → [0,1,2,3]
nums.extend([4, 5])    # 把另一个列表的元素接上来 → [0,1,2,3,4,5]

nums[0] = 99           # 改:按下标直接覆盖
nums.remove(99)        # 删:按值删(只删找到的第一个)
last = nums.pop()      # 删:弹出最后一项并返回它
del nums[0]            # 删:按下标删
\`\`\`

## 排序与统计

\`\`\`python
nums = [3, 1, 4, 1, 5]

sorted(nums)             # 返回排好序的【新列表】,原列表不变
nums.sort()              # 【原地】排序,改动自身,返回 None
nums.sort(reverse=True)  # 降序

len(nums)                # 元素个数
sum(nums) / max(nums) / min(nums)   # 求和 / 最大 / 最小
nums.count(1)            # 值 1 出现的次数
nums.index(4)            # 值 4 的下标
\`\`\`

> **高频坑**:\`b = a\` **不是复制列表**!它只是给同一个列表又贴了个名字——\`b.append(x)\` 后 \`a\` 也跟着变。真要独立副本:\`b = a.copy()\` 或 \`b = a[:]\`。
`,
  },
  {
    id: "tuples",
    title: "8. 元组与解包",
    content: `
## 元组:写了就不许改的列表

**作用**:元组(\`tuple\`)和列表几乎一样,唯一的区别是**创建后不能修改**——不能增、删、改元素。

**使用场景**:存放**不应该被改动**的数据——坐标 \`(x, y)\`、RGB 颜色、一年十二个月份。防止代码不小心改坏固定数据。

\`\`\`python
point = (3, 5)
point[0]        # 3,读取方式和列表完全一样
point[0] = 99   # 报错!TypeError,元组不可修改
\`\`\`

**语法核心:元组由逗号定义,括号只是配角**——这是上一章字典之前最容易踩的坑:

\`\`\`python
a = (1, 2)     # 元组
b = 1, 2       # 也是元组(括号可省)
c = ("xy")     # ✗ 这不是元组!只是带括号的字符串
d = ("xy",)    # ✓ 单元素元组,那个逗号绝不能省
\`\`\`

## 解包赋值:一口气取出所有值

**作用**:把序列里的值按位置**同时**赋给多个变量。

\`\`\`python
x, y = (3, 5)              # x=3, y=5
x, y = y, x                # 交换变量(原理就是右边先打包成元组)

first, *rest = [1, 2, 3, 4]   # 星号收集剩下的:first=1, rest=[2,3,4]
*init, last = [1, 2, 3, 4]    # init=[1,2,3], last=4
\`\`\`

## 函数返回多个值,靠的就是元组

\`\`\`python
def min_max(nums):
    return min(nums), max(nums)   # 其实是返回了一个元组 (最小, 最大)

lo, hi = min_max([3, 1, 4])       # 解包接收
print(lo, hi)                     # 1 4
\`\`\`
`,
  },
  {
    id: "dicts",
    title: "9. 字典",
    content: `
## 字典是什么

**作用**:字典(\`dict\`)按**键(key)→ 值(value)** 的方式存数据,像一本真正的字典——通过"词条"直接翻到"释义",查找速度极快。

**使用场景**:描述一个事物的一堆属性(用户信息、商品详情)、配置项、JSON 数据。**它是 Python 最重要的数据结构,没有之一。**

\`\`\`python
user = {"name": "小明", "age": 18}

user["name"]        # 取值:小明(用键取值,不是下标)
user["age"] = 19    # 修改
user["city"] = "北京"  # 新增:键不存在就新增
del user["city"]    # 删除
"name" in user      # True,判断【键】是否存在
len(user)           # 键值对数量
\`\`\`

## 安全取值:get 与 setdefault

**问题**:\`user["不存在的键"]\` 会直接报错崩溃。

**作用**:\`get()\` 取不到时返回默认值而不报错,程序更健壮。

\`\`\`python
user.get("phone")               # None(不报错)
user.get("phone", "未填写")      # 自定义默认值:"未填写"

user.setdefault("tags", []).append("vip")  # 键不存在先设为 [],再操作
\`\`\`

## 遍历字典的三种姿势

\`\`\`python
for key in user:                    # 默认遍历键
    print(key)
for key, value in user.items():    # 同时拿键和值(最常用)
    print(f"{key} = {value}")
for v in user.values():            # 只要值
    print(v)
\`\`\`

## 嵌套与链式取值(重点!)

**作用**:字典的值可以是任何东西——列表、甚至另一个字典。层层嵌套,这正是 **JSON 数据的 Python 写法**,调 API 处理返回数据全靠它。

\`\`\`python
data = {
    "model": "seedance",
    "reference_images": ["a.jpg", "b.jpg"],   # 字典套列表
    "owner": {"name": "小明", "level": 5},     # 字典套字典
}

# 链式取值:从左往右一层层剥开
# 先 data["owner"] 得到内层字典,再 ["name"] 取值
who = data["owner"]["name"]           # "小明"

# 稳妥版:任何一层取不到都返回 None,不崩溃
who = data.get("owner", {}).get("name")
\`\`\`

## 合并与字典推导

\`\`\`python
defaults = {"theme": "dark", "lang": "zh"}
custom = {"theme": "light"}
merged = defaults | custom     # 合并,右边覆盖左边 → theme 变 light

squares = {n: n * n for n in range(4)}   # {0:0, 1:1, 2:4, 3:9}
\`\`\`
`,
  },
  {
    id: "sets",
    title: "10. 集合",
    content: `
## 集合是什么

**作用**:集合(\`set\`)是一个**自动去重、无序**的容器——同一个值只能存在一份。

**使用场景**:去重(一秒去掉列表重复项)、快速判断"在不在"(比列表快得多)、数学集合运算(交集、并集)。

\`\`\`python
s = {1, 2, 3, 3, 2}
print(s)              # {1, 2, 3},重复自动消失

list(set([1, 2, 2, 3, 3]))   # 去重利器:[1, 2, 3]

empty = set()         # ⚠️ 空集合必须这样写,{} 是空字典!
s.add(4)              # 添加
s.remove(1)           # 删除(元素不存在会报错)
s.discard(99)         # 删除(不存在也不报错,更安全)
\`\`\`

## 集合运算:交集并集一行搞定

**作用**:\`& | - ^\` 四个符号对应数学里的交、并、差、对称差。

**使用场景**:"两份名单的共同好友"(交集)、"合并所有标签"(并集)、"A 有 B 没有"(差集)。

\`\`\`python
a = {1, 2, 3}
b = {3, 4, 5}

a | b    # 并集 {1,2,3,4,5} —— 所有不重复的元素
a & b    # 交集 {3}        —— 两边都有的
a - b    # 差集 {1,2}      —— a 有、b 没有的
a ^ b    # 对称差 {1,2,4,5} —— 只属于一边的
\`\`\`

## 实战:去重且保持原顺序

\`\`\`python
seen = set()          # 记录见过的元素
result = []
for x in [3, 1, 3, 2, 1]:
    if x not in seen:   # 集合判断"在不在"极快
        seen.add(x)
        result.append(x)
# result = [3, 1, 2],去重且保持首次出现的顺序
\`\`\`
`,
  },
  {
    id: "functions",
    title: "11. 函数与参数",
    content: `
## 函数是什么

**作用**:函数是**打包好的一段代码**,起个名字,之后随时调用。一次定义,处处使用。

**使用场景**:同样的逻辑出现第二次,就该写成函数——避免复制粘贴,改一处就全局生效。

\`\`\`python
def greet(name, greeting="你好"):     # def 定义;greeting 有默认值
    """给指定的人问好(三个引号是文档说明)"""
    return f"{greeting},{name}!"      # return 交回结果并结束函数

greet("小明")                    # 你好,小明!(默认值生效)
greet("小红", greeting="早上好")  # 关键字传参,指名道姓地传
\`\`\`

没有 \`return\` 的函数会返回 \`None\`(空值)。

## 两种传参方式

\`\`\`python
def power(base, exp):
    return base ** exp

power(2, 10)          # 位置传参:按顺序对应,2→base,10→exp
power(exp=10, base=2) # 关键字传参:写明参数名,顺序随意
\`\`\`

## *args:收集多余的位置参数

**作用**:参数前加 \`*\`,多余的按顺序传进来的参数会被**打包成一个元组**。

**使用场景**:参数个数不定——\`print()\` 和 \`sum()\` 内部就是这么实现的:\`print(1)\`、\`print(1,2,3)\` 都行。

\`\`\`python
def add_all(*args):        # args 是约定俗成的名字
    print(type(args))      # <class 'tuple'>
    return sum(args)

add_all(1, 2)        # 3
add_all(1, 2, 3, 4)  # 10,传多少个都行
\`\`\`

## **kwargs:收集多余的关键字参数

**作用**:参数前加 \`**\`,多余的"名字=值"式参数会被**打包成一个字典**。

**使用场景**:库函数接收大量可选配置——\`connect("COM3", baud=115200, timeout=3)\`,多出来的选项全进字典统一处理。

\`\`\`python
def connect(device, **kwargs):
    print(f"连接 {device}")
    for key, value in kwargs.items():   # kwargs 是字典,遍历它
        print(f"  选项 {key} = {value}")

connect("COM3", baud=115200, timeout=3)
# 连接 COM3
#   选项 baud = 115200
#   选项 timeout = 3
\`\`\`

**一收一放,互为逆操作**:

\`\`\`python
def f(a, b):
    return a + b

d = {"a": 1, "b": 2}
f(**d)     # ** 在调用时反向操作:把字典摊开成关键字参数 → 3
\`\`\`

## lambda:一次性小函数

**作用**:\`lambda 参数: 表达式\` 定义匿名小函数,只有一行、用完即弃。

**使用场景**:排序的 key、临时小逻辑——不值得起名字的函数。

\`\`\`python
square = lambda x: x * x        # 等价于 def square(x): return x * x

pairs = [(1, 9), (2, 3)]
pairs.sort(key=lambda p: p[1])  # 按每个元组的第 2 项排序
\`\`\`
`,
  },
  {
    id: "scope",
    title: "12. 作用域与闭包",
    content: `
## 作用域:名字的有效范围

**作用**:一个变量并不是到处都能用——它只在创建它的"区域"里有效。Python 查找名字的顺序叫 **LEGB**:先找当前函数(Local)→ 外层函数(Enclosing)→ 全局(Global)→ 内置(Built-in)。

**使用场景**:理解了它,才能解释"为什么函数里改了变量,外面没变"这类经典疑惑。

\`\`\`python
x = "全局"

def outer():
    x = "外层函数"          # 这是个【新的】局部变量,不是外面那个
    def inner():
        x = "内层函数"      # 又是一个新的
        print(x)            # 就近原则:内层函数
    inner()

outer()
\`\`\`

## global:在函数内修改全局变量

**作用**:声明 \`global\` 后,函数里对该名字的操作作用于全局变量。

\`\`\`python
count = 0

def hit():
    global count       # 不写这行,下面的 count += 1 会报错
    count += 1         # 修改的是全局的 count

hit(); hit()
print(count)           # 2
\`\`\`

## nonlocal:修改外层函数的变量

**作用**:函数嵌套时,\`nonlocal\` 声明"我要改的是外面那层函数的变量"。

\`\`\`python
def counter():
    n = 0
    def increase():
        nonlocal n     # 指向外层 counter 的 n
        n += 1
        return n
    return increase

c = counter()          # c 记住了自己的 n
print(c(), c(), c())   # 1 2 3,每次调用在上次基础上加
\`\`\`

## 闭包:函数记住了它的出生环境

**作用**:内层函数引用了外层函数的变量,即使外层函数已经执行结束,这些变量依然被内层函数"记住"——这就是闭包。上面的 \`counter\` 就是闭包:\`n\` 藏在函数里,外部碰不到,但每次调用都在累加。

> **经典坑**:循环里创建的闭包共享同一个变量:
> \`\`\`python
> funcs = [lambda: i for i in range(3)]
> print([f() for f in funcs])      # [2, 2, 2]!不是 [0,1,2]
> # 修复:lambda i=i: i,用默认参数把当时的值固定住
> \`\`\`
`,
  },
  {
    id: "comprehensions",
    title: "13. 推导式",
    content: `
## 列表推导式:一行的"加工流水线"

**作用**:用一行代码完成"遍历 → 变换 → 过滤",生成一个新列表。它是 Python 最具标志性的语法。

**使用场景**:需要"基于一个序列生成新列表"时——批量计算、筛选、提取字段。

先看普通写法和推导式的对比:

\`\`\`python
# 目标:0~9 中的偶数列表
# 普通写法(4 行):
evens = []
for n in range(10):
    if n % 2 == 0:
        evens.append(n)

# 推导式(1 行),结果完全相同:
evens = [n for n in range(10) if n % 2 == 0]   # [0,2,4,6,8]
\`\`\`

**读法**:"对 range(10) 里的每个 n,**如果** n 是偶数,**就把** n 放进新列表"。固定结构:

> \`[表达式 for 变量 in 序列 if 条件]\`

\`\`\`python
squares = [n * n for n in range(5)]          # [0,1,4,9,16],每个数平方
names = ["小明", "小红"]
hello = [f"你好,{n}" for n in names]          # 批量加工每个元素
\`\`\`

## 带 if-else 的推导式

**作用**:对每个元素"二选一"地生成结果。

\`\`\`python
labels = ["偶" if n % 2 == 0 else "奇" for n in range(5)]
# ['偶','奇','偶','奇','偶']
\`\`\`

⚠️ 位置区别:**筛选**的 if 写在**末尾**(不要它),**三元**的 if-else 写在**前面**(变成什么)。

## 字典 / 集合 / 生成器推导

**作用**:换括号就换产物——方括号出列表,花括号出字典/集合,圆括号出生成器(惰性,省内存)。

\`\`\`python
word_len = {w: len(w) for w in ["cat", "apple"]}  # {'cat':3,'apple':5}
unique = {ch for ch in "hello"}                   # {'h','e','l','o'}
lazy = (n * n for n in range(1000000))            # 不立即计算,用到才算
\`\`\`

> 建议:推导式只在一眼能看懂时使用;逻辑一复杂,老老实实写 for 循环更清晰。
`,
  },
  {
    id: "iterators",
    title: "14. 迭代器与生成器",
    content: `
## 可迭代对象与迭代器

**作用**:能用 \`for\` 遍历的东西叫**可迭代对象**(列表、字符串、字典、文件……)。**迭代器**是与之配套的"取数把手",支持一次次 \`next()\` 取下一个值。

**使用场景**:理解 for 的底层机制;需要"手动控制取数节奏"时。

\`\`\`python
it = iter([1, 2, 3])   # 从列表获取迭代器
next(it)               # 1
next(it)               # 2
next(it)               # 3
# next(it) 再调会抛 StopIteration(取完了的信号)
\`\`\`

for 循环的本质:不断 next,直到收到 StopIteration 就停止——你写 \`for x in [1,2,3]\` 时,Python 在背后干的就是这件事。

## 生成器函数:yield 让函数"可暂停"

**作用**:\`yield\` 让函数变成**生成器**——执行到 yield 就**暂停并交出一个值**,下次调用从暂停处继续。数据一个一个产生,**不会一次性占满内存**。

**使用场景**:处理大文件(几个 G 逐行读)、无限序列(斐波那契)、数据流水线。

\`\`\`python
def countdown(n):
    while n > 0:
        yield n       # 交出 n,在这里暂停
        n -= 1        # 下次从这行继续

for x in countdown(3):
    print(x)          # 3 2 1
\`\`\`

对比:普通函数 \`return\` 后就结束了;生成器可以"交出很多次",像挤牙膏。

## 无限序列也不怕

\`\`\`python
def fibonacci():
    a, b = 0, 1
    while True:            # 无限循环!但没关系,要多少算多少
        yield a
        a, b = b, a + b

from itertools import islice
print(list(islice(fibonacci(), 8)))   # 只取前 8 个
# [0, 1, 1, 2, 3, 5, 8, 13]
\`\`\`

## 生成器表达式与 yield from

\`\`\`python
total = sum(n * n for n in range(1000))   # 圆括号形式,边生成边累加,省内存

def chain(*iterables):
    for it in iterables:
        yield from it          # 把另一个可迭代对象的元素逐个转交

list(chain([1, 2], "ab"))      # [1, 2, 'a', 'b']
\`\`\`
`,
  },
  {
    id: "decorators",
    title: "15. 装饰器",
    content: `
## 前置知识:函数也是对象

**作用**:在 Python 里,函数可以像普通值一样——赋给变量、当参数传递、当返回值。这是理解装饰器的钥匙。

\`\`\`python
def shout(text):
    return text.upper() + "!"

speak = shout          # 把函数赋给另一个名字(没有加括号,不是调用!)
print(speak("hi"))     # HI!
\`\`\`

## 装饰器是什么

**作用**:装饰器是一个"给函数套外壳"的工具——**不修改原函数代码**的前提下,给它增加额外功能(计时、日志、权限检查、缓存……)。

**使用场景**:框架里到处都是——Flask 的 \`@app.route()\`、pytest 的 \`@fixture\`。学会它,看框架源码不再懵。

先看一个完整例子(计时器),注释逐行解释:

\`\`\`python
import time
from functools import wraps

def timer(func):                      # 装饰器:接收一个函数
    @wraps(func)                      # 小仪式:保留原函数的名字和文档
    def wrapper(*args, **kwargs):     # 外壳:签名照单全收
        start = time.time()
        result = func(*args, **kwargs)  # 调用真正的原函数
        cost = time.time() - start
        print(f"{func.__name__} 耗时 {cost:.3f} 秒")
        return result                 # 把原函数的结果原样交回
    return wrapper                    # 装饰器返回这个外壳

@timer                                # 这一行等价于:slow_add = timer(slow_add)
def slow_add(a, b):
    time.sleep(0.5)
    return a + b

slow_add(1, 2)    # 照常调用,自动多打印耗时:slow_add 耗时 0.500 秒
\`\`\`

执行流程:\`@timer\` 把 \`slow_add\` 传进装饰器 → 得到 \`wrapper\` → 名字 \`slow_add\` 从此指向 \`wrapper\` → 之后每次调用 \`slow_add\`,实际跑的都是 wrapper(先计时,再调用真身)。

## 带参数的装饰器:再包一层

**作用**:让装饰器自己也能接收选项(\`@repeat(times=3)\`),需要在外面再套一层函数。

\`\`\`python
def repeat(times):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for _ in range(times):          # 重复执行 times 次
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(times=3)
def hello():
    print("hi")

hello()    # 打印三次 hi
\`\`\`

三层结构记忆法:最外层收装饰器参数 → 中间层收函数 → 最内层收调用参数。
`,
  },
  {
    id: "oop",
    title: "16. 类与面向对象",
    content: `
## 类是什么

**作用**:类(\`class\`)是创建对象的"模板/图纸"——把**数据**(属性)和**行为**(方法)打包在一起。对象 = 按图纸造出的具体实例。

**使用场景**:管理有状态的东西——一个用户(姓名+积分+登录行为)、一只怪物(血量+攻击)、一个连接(地址+收发数据)。大型程序靠类组织代码。

\`\`\`python
class Dog:
    species = "犬科"                  # 类属性:所有狗共享这一个值

    def __init__(self, name, age):   # 构造方法:造对象时自动执行
        self.name = name             # 实例属性:每只狗自己的
        self.age = age

    def bark(self):                  # 方法:对象的行为
        return f"{self.name}: 汪汪!"

d1 = Dog("旺财", 3)     # 造一只狗(实例化,不需要 new)
d2 = Dog("小黑", 2)     # 再造一只
d1.bark()               # 旺财: 汪汪!
\`\`\`

**self 是什么**:就是"当前这个对象自己"。调用 \`d1.bark()\` 时,Python 自动把 \`d1\` 填进 \`self\`——所以方法内用 \`self.name\` 拿到的是 d1 自己的名字。

## 继承:子类复用父类

**作用**:子类自动获得父类的全部属性和方法,还能扩展或改写(重写)。避免重复代码。

**使用场景**:"猫是一种动物"——动物共有的(名字、吃)写在父类,猫特有的(喵叫)写在子类。

\`\`\`python
class Animal:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return "..."

class Cat(Animal):                        # 括号里写父类
    def __init__(self, name, indoor):
        super().__init__(name)            # super() 调用父类的构造,先完成公共部分
        self.indoor = indoor              # 再添加子类自己的属性
    def speak(self):                      # 重写:覆盖父类的同名方法
        return "喵~"

c = Cat("咪咪", True)
print(c.name, c.speak())                  # 咪咪 喵~(父类的属性照样能用)
\`\`\`

## 魔法方法:让对象支持内置操作

**作用**:双下划线包围的方法(\`__xx__\`)是 Python 的"钩子"——定义了它们,你的对象就能用 \`+\`、\`print\`、\`len\` 这些原生操作。

\`\`\`python
class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):                   # print(v) 时显示什么
        return f"Vector({self.x}, {self.y})"
    def __add__(self, other):             # 让 v1 + v2 可用
        return Vector(self.x + other.x, self.y + other.y)
    def __eq__(self, other):              # 让 v1 == v2 按值比较
        return self.x == other.x and self.y == other.y

v = Vector(1, 2) + Vector(3, 4)           # Vector(4, 6),+ 被翻译成 __add__
\`\`\`

## @property:看起来像属性的方法

**作用**:用方法算出来的值,让外部**像访问属性一样**使用(\`c.area\` 而不是 \`c.area()\`)。

\`\`\`python
class Circle:
    def __init__(self, r):
        self._r = r               # 下划线开头 = 约定俗成的"内部变量,别直接碰"

    @property
    def area(self):               # 半径定了,面积随时可算,不必单独存储
        return 3.14159 * self._r ** 2

c = Circle(2)
print(c.area)     # 12.566...,注意没加括号,像属性一样用
\`\`\`
`,
  },
  {
    id: "exceptions",
    title: "17. 异常处理",
    content: `
## 为什么需要异常处理

程序出错时会"抛出异常"并立即崩溃退出。**异常处理让你接住错误、决定怎么办**——提示用户、重试、记录日志——程序不至于一言不合就死。

## try / except:接住错误

**作用**:把可能出错的代码放进 \`try\`,出错后跳进对应的 \`except\` 分支处理,程序继续活着。

**使用场景**:一切"外部输入不可控"的地方——用户输入、文件读取、网络请求。

\`\`\`python
try:
    age = int(input("年龄:"))       # 输入 "abc" 会抛 ValueError
    print(100 // age)                # 输入 0 会抛 ZeroDivisionError
except ValueError:
    print("这不是数字,请重新输入")   # 分别接住不同类型的错误
except ZeroDivisionError as e:       # as e 把错误信息存进变量 e
    print(f"出错了:{e}")
\`\`\`

## else 与 finally:精细分工

**作用**:\`else\` 在**没出错**时执行;\`finally\` **无论如何**都执行。

**使用场景**:\`finally\` 专门放清理动作(关文件、断连接)——成功要清理,失败也要清理。

\`\`\`python
try:
    f = open("data.txt")
except FileNotFoundError:
    print("文件不存在")
else:
    print("打开成功,开始处理")
    f.close()
finally:
    print("这行无论如何都会执行")
\`\`\`

## raise:主动抛出错误

**作用**:发现不合理的情况时,自己抛出异常中断执行,把问题暴露出来。

\`\`\`python
def set_age(age):
    if age < 0:
        raise ValueError("年龄不能是负数")   # 主动抛出
    return age
\`\`\`

## 自定义异常

**作用**:继承 \`Exception\` 就能定义自己的异常类型,让错误信息更贴切、可精确捕获。

\`\`\`python
class BalanceError(Exception):     # 自定义:余额不足异常
    pass

def withdraw(balance, amount):
    if amount > balance:
        raise BalanceError(f"余额不足,还差 {amount - balance}")
    return balance - amount

try:
    withdraw(100, 200)
except BalanceError as e:
    print(e)                       # 余额不足,还差 100
\`\`\`

> **经验**:别用裸 \`except:\` 吞掉一切错误(连 Ctrl+C 都拦),至少写成 \`except Exception as e\` 并记录下来——报错不可怕,可怕的是不知道错在哪。
`,
  },
  {
    id: "files",
    content: `
## 文件读写:程序记住数据的方式

**作用**:变量存在内存里,程序一关就没了。写进**文件**,数据才能长期保存。

**使用场景**:保存配置、记录日志、导出结果、处理数据文件。

## with open:标准姿势

**作用**:\`open()\` 打开文件得到文件对象;\`with\` 保证代码块结束时**自动关闭文件**,哪怕中途出错也不会漏关。

\`\`\`python
# 写文件:"w" 是覆盖写(重写整个文件),"a" 是追加写(接在末尾)
with open("notes.txt", "w", encoding="utf-8") as f:
    f.write("第一行\\n")            # \\n 是换行符
    f.write("第二行\\n")

# 读文件:一次性全读进来,得到一个字符串
with open("notes.txt", encoding="utf-8") as f:
    content = f.read()
print(content)
\`\`\`

> 处理中文**必须**加 \`encoding="utf-8"\`,否则 Windows 下极易乱码。

## 逐行读取:大文件也不怕

**作用**:\`for line in f\` 一行一行读,每次内存里只有一行——几个 G 的文件也能处理。

\`\`\`python
with open("notes.txt", encoding="utf-8") as f:
    for line in f:
        print(line.strip())       # strip() 去掉每行末尾的换行符
\`\`\`

## 模式速查表

| 模式 | 含义 | 文件不存在时 |
|---|---|---|
| \`"r"\` | 只读(默认) | 报错 |
| \`"w"\` | 覆盖写 | 自动创建 |
| \`"a"\` | 追加写 | 自动创建 |
| \`"rb"\` / \`"wb"\` | 二进制读/写 | 图片、视频用它 |

⚠️ \`"w"\` 模式打开的瞬间就会清空原文件——想保留旧内容请用 \`"a"\`。

## pathlib:新时代路径工具

**作用**:\`Path\` 对象把路径变成可操作的对象,拼接、判断、读写一行搞定,且 Windows/Mac 通用。

\`\`\`python
from pathlib import Path

p = Path("data") / "notes.txt"             # 用 / 拼路径,自动处理分隔符
p.exists()                                  # 文件存在吗?
text = p.read_text(encoding="utf-8")        # 一行读完
p.write_text("新内容", encoding="utf-8")     # 一行写入
\`\`\`
`,
    title: "18. 文件操作",
  },
  {
    id: "modules",
    title: "19. 模块与包",
    content: `
## 模块:别人的代码直接用

**作用**:\`import\` 把其他文件(模块)的代码引入当前程序。Python 强大的生态就是靠它——数万个现成的库随取随用。

**使用场景**:需要现成功能时别造轮子——算数学 \`import math\`,发网络请求 \`import requests\`。

四种导入姿势:

\`\`\`python
import math                  # 整个模块导入,用时要带前缀
math.sqrt(16)                # 4.0

from math import sqrt, pi    # 只导入需要的名字,直接用
sqrt(16)

from math import sqrt as s  # 起个别名
import numpy as np           # 社区约定俗成的别名(np/pd/plt)

from math import *           # 全部导入(不推荐:容易名字冲突)
\`\`\`

## 自己写模块 + __name__ 的秘密

**作用**:任何 \`.py\` 文件都是模块;特殊的 \`if __name__ == "__main__":\` 让文件**身兼两职**——直接运行时执行测试代码,被别人导入时安静提供函数。

\`\`\`python
# tools.py
def say_hello():
    print("hello")

if __name__ == "__main__":   # 直接运行本文件时,__name__ 是 "__main__"
    say_hello()              # → 执行,方便自测
# 被 import 时,__name__ 是 "tools",条件不成立,不执行
\`\`\`

这就是为什么很多脚本底部都有这三行——它让你可以放心地在文件里写测试代码,而不影响导入它的其他程序。

## 包:用文件夹组织模块

**作用**:项目变大后,把模块按文件夹分组——含 \`__init__.py\` 的文件夹就是"包"。

\`\`\`text
myproject/
├── main.py              # 主程序
└── utils/               # 包(文件夹)
    ├── __init__.py      # 让文件夹成为包(可以是空文件)
    ├── files.py         # 文件工具模块
    └── net.py           # 网络工具模块
\`\`\`

\`\`\`python
from utils.files import read_config    # 包.模块 导入具体函数
\`\`\`

## pip:安装第三方库

\`\`\`bash
pip install requests          # 安装
pip install requests==2.31.0  # 指定版本
pip list                      # 查看装了哪些
\`\`\`
`,
  },
  {
    id: "builtins",
    title: "20. 内置函数与常用标准库",
    content: `
## 高频内置函数(不用 import,开箱即用)

**作用**:Python 自带的常用工具函数,覆盖统计、转换、判断等日常操作。

\`\`\`python
len([1, 2, 3])          # 3,长度/个数
sum([1, 2, 3])          # 6,求和
max(3, 7, 1)            # 7,最大值;min() 最小值
abs(-5)                 # 5,绝对值
round(3.14159, 2)       # 3.14,四舍五入到 2 位小数

any([0, 1, 0])          # True —— 有一个为真就是 True
all([1, 1, 0])          # False —— 全部为真才是 True
\`\`\`

## map 与 filter:批量加工、批量筛选

**作用**:\`map(函数, 序列)\` 对每个元素执行函数;\`filter(函数, 序列)\` 只保留函数返回 True 的元素。

\`\`\`python
nums = ["1", "2", "3"]
ints = list(map(int, nums))                # 批量转类型:[1, 2, 3]

evens = list(filter(lambda n: n % 2 == 0, range(10)))
# [0, 2, 4, 6, 8],筛出偶数

dict(zip(["a", "b"], [90, 85]))            # {'a': 90, 'b': 85},两列表配成字典
\`\`\`

## 常用标准库速查

**作用**:随 Python 一起安装的官方库,不用额外下载,覆盖大部分日常需求。

| 库 | 干什么用 | 一句话示例 |
|---|---|---|
| \`json\` | 读写 JSON(调 API 必备) | \`json.dumps(data)\` |
| \`datetime\` | 日期与时间 | \`datetime.now()\` |
| \`os\` / \`pathlib\` | 文件路径、系统操作 | \`Path("a") / "b.txt"\` |
| \`random\` | 随机数 | \`random.randint(1, 6)\` |
| \`re\` | 正则表达式(文本提取) | \`re.findall(r"\\d+", s)\` |
| \`collections\` | 增强版容器 | \`Counter("aab")\` 统计词频 |
| \`itertools\` | 迭代工具 | \`islice(gen, 5)\` |
| \`time\` | 计时、休眠 | \`time.sleep(1)\` |

## JSON 与字典互转(实战必备)

**作用**:网络上传输的数据几乎都是 JSON 格式,而 Python 里对应的就是字典。\`json\` 库负责两者互转。

\`\`\`python
import json

data = {"model": "seedance", "n": 1}
text = json.dumps(data)         # 字典 → JSON 字符串(发请求用)
obj = json.loads(text)          # JSON 字符串 → 字典(解析响应用)
print(obj["model"])             # seedance
\`\`\`

---

**核心语法到此全部通关!** 🎉 接下来是实战篇(第 21-24 章)——用一个真实的爬虫项目,把前面学的函数、字典、循环、异常处理、文件操作全部串起来用一遍。
`,
  },

  {
    id: "http",
    title: "21. HTTP 入门:网页是怎么传输的",
    content: `
## 爬虫前先懂一点网络

**作用**:爬虫的本质是"模拟浏览器向服务器要数据"。要理解爬虫,得先理解浏览器和服务器之间是怎么"对话"的——这套对话规则就叫 HTTP。

**使用场景**:调试爬虫("为什么返回 403?")、看懂接口文档、调 API,都靠这几个基础概念。

## 请求与响应:一问一答

你在浏览器输入网址回车的瞬间,发生了一次"问答":

- **请求(Request)**:浏览器问服务器——"请把首页给我"(顺便报上自己的身份)
- **响应(Response)**:服务器答——"给你,状态 200,内容是 HTML"

爬虫做的事,就是用代码发出同样的"问题",收下"答案",再从答案里挑出想要的数据。

## URL 的结构

\`\`\`text
https://www.example.com:443/news/list?page=2&id=5
└─┬─┘   └────┬────┘ └┬┘ └───┬───┘ └─────┬─────┘
协议        域名      端口    路径      查询参数
\`\`\`

**查询参数**(\`?key=value&key=value\`)最重要——翻页、搜索、筛选通常就是改这里的数字。

## 常见状态码:服务器的"回话暗号"

| 状态码 | 含义 | 爬虫该怎么办 |
|---|---|---|
| \`200\` | 成功 | 正常解析内容 |
| \`404\` | 页面不存在 | 检查 URL 是否拼错 |
| \`403\` | 拒绝访问(常是识别出爬虫) | 补 User-Agent 请求头(下一章) |
| \`429\` | 请求太频繁 | 加延时,放慢速度 |
| \`500\` | 服务器内部错误 | 稍后重试 |

## GET 与 POST

**作用**:两种最常用的请求方式——GET 是"我要**看**数据"(参数在 URL 里),POST 是"我要**交**数据"(参数藏在请求体里)。

**使用场景**:打开网页、翻页是 GET;登录、提交表单、搜索框提交通常是 POST。

## 神器:F12 开发者工具

**作用**:浏览器按 \`F12\` 打开开发者工具,**Network(网络)** 面板能看到浏览器发出的每一个请求和收到的每一个响应。

**使用场景**:这是爬虫工程师的"显微镜"——看到的数据不在网页源码里?打开 Network 找找,十有八九是浏览器又发了个请求从接口拿的 JSON。选中某个请求,看 Headers(请求头)、Response(响应内容),信息全在里面。

> 学习建议:随便打开一个网站,按 F12 → Network → 刷新页面,看看第一个请求返回的 HTML 长什么样——爬虫拿到的就是这份东西。
`,
  },

  {
    id: "requests",
    title: "22. requests:发送 HTTP 请求",
    content: `
## requests 是什么

**作用**:\`requests\` 是 Python 最流行的 HTTP 库,一行代码就能像浏览器一样向服务器要网页。

**使用场景**:爬虫的第一步永远是它——先拿到网页的 HTML 源码,再交给下一章的解析工具处理。

安装(终端里执行):

\`\`\`bash
pip install requests
\`\`\`

## 最简单的用法

\`\`\`python
import requests

url = "https://www.example.com"
r = requests.get(url, timeout=10)   # 发 GET 请求,10 秒超时(务必写!)

print(r.status_code)   # 200 —— 状态码
print(r.text)          # 网页源码(一大坨 HTML 字符串)
\`\`\`

**要点**:\`r\` 是响应对象,常用属性就三个——\`status_code\`(状态码)、\`text\`(文本内容)、\`content\`(二进制内容,下载图片用)。

## 带上身份:请求头 User-Agent

**作用**:每个请求都带着"自我介绍"(请求头),其中 \`User-Agent\` 表明"我是谁"——Python requests 默认报的名字会被很多网站一眼认出是爬虫,直接回 403 拒绝。

**使用场景**:把自己伪装成普通浏览器,是爬虫的基本礼貌和通行证。

\`\`\`python
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/126.0.0.0 Safari/537.36"
}
r = requests.get(url, headers=headers, timeout=10)
\`\`\`

## 查询参数:params

**作用**:把 \`?page=2&type=news\` 这样的查询参数写成字典,requests 帮你拼到 URL 上,不用手动拼字符串。

\`\`\`python
params = {"page": 2, "type": "news"}
r = requests.get("https://www.example.com/list", params=params, headers=headers, timeout=10)
print(r.url)   # https://www.example.com/list?page=2&type=news
\`\`\`

## 健壮的爬虫骨架(推荐背下来)

**作用**:网络请求随时可能失败——超时、断网、服务器抽风。成熟的爬虫必须把这些都接住。

\`\`\`python
import requests

def fetch(url):
    """抓取网页,成功返回源码,失败返回 None"""
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    try:
        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()          # 状态码不是 2xx 就抛异常
        r.encoding = r.apparent_encoding   # 自动探测编码,防中文乱码
        return r.text
    except requests.RequestException as e:
        print(f"抓取失败 {url}: {e}")
        return None

html = fetch("https://www.example.com")
\`\`\`

这个骨架综合了前面学的**函数、字典、异常处理**——基础语法学得好不好,一眼就看出来。
`,
  },

  {
    id: "bs4",
    title: "23. BeautifulSoup:解析与提取",
    content: `
## 为什么需要解析

**作用**:上一章拿到的 HTML 是一大坨字符串,直接在字符串里找数据又脆又难看。BeautifulSoup 把 HTML 解析成"树状结构",让你像查字典一样按标签、属性精准取数据。

**使用场景**:从网页里提取标题、正文、链接、价格、评论——爬虫的核心环节。

安装:

\`\`\`bash
pip install beautifulsoup4
\`\`\`

## 基本用法

\`\`\`python
from bs4 import BeautifulSoup

html = """
<html>
  <body>
    <h1 class="title">今日新闻</h1>
    <ul class="news-list">
      <li><a href="/news/1">Python 3.13 发布</a></li>
      <li><a href="/news/2">AI 视频新突破</a></li>
    </ul>
  </body>
</html>
"""

soup = BeautifulSoup(html, "html.parser")   # 第二个参数指定解析器

print(soup.title)        # <title>今日新闻</title> 之类:快速取某标签
print(soup.h1.text)      # 今日新闻 —— .text 只要文字
\`\`\`

## find 与 find_all:按标签/属性查找

**作用**:\`find()\` 找**第一个**符合条件的标签,\`find_all()\` 找**全部**,返回列表。

\`\`\`python
links = soup.find_all("a")            # 所有 <a> 标签
first = soup.find("li")               # 第一个 <li>

# 加条件:找 class 为 news-list 的 <ul>
news_list = soup.find("ul", class_="news-list")
# 注意是 class_(带下划线),因为 class 是 Python 关键字

for a in news_list.find_all("a"):
    print(a.text, a["href"])          # 文字 和 href 属性
\`\`\`

**提取三件套**:\`a.text\`(标签内文字)、\`a["href"]\` 或 \`a.get("href")\`(属性值,\`get\` 取不到不报错)、\`a.attrs\`(全部属性字典)。

## CSS 选择器:select(更强大)

**作用**:\`select()\` 支持 CSS 选择器语法——\`#\` 代表 id、\`.\` 代表 class、空格代表"里面的",和写网页样式用同一套规则。

\`\`\`python
# 选 class=news-list 里面的所有 a 标签
for a in soup.select(".news-list a"):
    print(a.get("href"))

# 选 id=main 的元素里的 h2
h2 = soup.select_one("#main h2")      # select_one 只取第一个
\`\`\`

## 相对链接补全:urljoin

**作用**:爬到的链接常是 \`/news/1\` 这种"半截"相对路径,要拼上域名才是能访问的完整网址。\`urljoin\` 自动处理。

\`\`\`python
from urllib.parse import urljoin

full = urljoin("https://www.example.com/news/list", "/news/1")
print(full)    # https://www.example.com/news/1
\`\`\`
`,
  },

  {
    id: "spider",
    title: "24. 完整实战:爬虫小项目",
    content: `
## 项目目标

把前三章的知识串成一个完整程序:**抓取一个(示意)新闻列表页 → 提取标题和链接 → 翻页 → 存成 CSV 文件**。这就是一个最典型也最实用的爬虫骨架,换成任何网站只需改解析部分。

## 完整代码(逐段讲解)

\`\`\`python
import csv
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE_URL = "https://www.example.com/news/list"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/126.0.0.0 Safari/537.36"
}

def fetch(url):
    """第 22 章的骨架:抓网页,失败返回 None"""
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        r.raise_for_status()
        r.encoding = r.apparent_encoding
        return r.text
    except requests.RequestException as e:
        print(f"抓取失败 {url}: {e}")
        return None

def parse(html, page_url):
    """第 23 章的解析:提取 (标题, 链接) 列表"""
    soup = BeautifulSoup(html, "html.parser")
    items = []
    for a in soup.select(".news-list a"):          # 按实际网站改选择器
        title = a.text.strip()
        link = urljoin(page_url, a.get("href", ""))  # 相对链接补全
        if title and link:
            items.append({"title": title, "link": link})
    return items

def save(rows, filename="news.csv"):
    """第 18 章的文件操作:存成 CSV,Excel 能直接打开"""
    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["title", "link"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"已保存 {len(rows)} 条到 {filename}")

def main():
    all_items = []
    for page in range(1, 4):                 # 爬 1~3 页
        url = f"{BASE_URL}?page={page}"
        print(f"正在抓取第 {page} 页...")
        html = fetch(url)
        if html:
            all_items.extend(parse(html, url))
        time.sleep(2)                        # 每页停 2 秒,礼貌爬取!
    save(all_items)

if __name__ == "__main__":                   # 第 19 章的知识点
    main()
\`\`\`

**注意**:\`encoding="utf-8-sig"\` 是给 CSV 加 BOM 头——不加的话 Excel 打开中文会乱码。

## 礼貌爬虫守则(重要)

爬虫是工具,怎么用是素质。写爬虫前请记住:

- **控制频率**:\`time.sleep()\` 加延时,别把人家服务器打挂——高频爬取等于攻击
- **只取公开数据**:需要登录/付费才能看的内容不要爬
- **看 robots.txt**:访问 \`网站/robots.txt\` 能看到站长允许/禁止爬哪些路径
- **遵守法律和网站条款**:爬取的数据仅用于个人学习,不商用、不倒卖
- **标注身份**:正经的爬虫会在 User-Agent 里留联系方式

## 进阶方向

学完这个骨架,想继续深入可以了解:

- **动态页面**:数据靠 JavaScript 加载、源码里没有?F12 找到数据接口直接请求 JSON(比解析 HTML 更稳),或用 \`selenium\`/\`playwright\` 控制真浏览器
- **框架**:\`scrapy\`——大型爬虫工程的标准武器
- **存储升级**:存进 SQLite 数据库而不是 CSV

---

**全部 24 章完成!** 🎉 从 print 到爬虫项目,你已经具备独立写小工具的能力了。最好的下一步:找一个你真正感兴趣的网站(从 F12 开始),把这套骨架改造一遍。
`,
  },
];
