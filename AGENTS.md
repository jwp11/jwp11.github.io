# AGENTS.md — 博客项目工作指南(给 AI 助手的说明)

这是一个**纯静态个人博客**(零依赖、零构建),部署在 GitHub Pages:**https://jwp11.github.io/**
仓库:`https://github.com/jwp11/jwp11.github.io`(推送 main 分支后约 1 分钟自动上线)

任何 AI 助手(ZCode 等)在本目录工作时,请先读完本文件再动手。

## 项目结构

```
├── index.html        首页(导航 + Hero + 教程推广卡片 + 文章列表)
├── post.html         文章详情页(靠 ?id= 参数区分文章)
├── python.html       Python 语法教程页(24 章,左侧目录 + 进度追踪)
├── tspi-camera.html  泰山派 RK3566 运动相机实战页(12 节,同款目录 + 进度追踪)
├── css/style.css     全部样式:CSS 变量主题系统([data-theme] 切换明暗)
├── js/main.js        核心引擎:主题切换、轻量 Markdown 渲染器(BlogMD)、列表/文章渲染
├── js/posts.js       博客文章数据(POSTS 数组)★ 写文章改这里
├── js/python-content.js  教程章节数据(PY_CHAPTERS 数组)★ 加教程章节改这里
├── js/python.js      教程页逻辑(目录/滚动高亮/进度存 localStorage 的 python-progress)
├── js/tspi-camera-content.js  相机实战章节数据(TSPI_CHAPTERS 数组)★ 加章节改这里
├── js/tspi-camera.js 相机实战页逻辑(同 python.js,进度独立存 tspi-progress)
└── serve.mjs         本地预览服务器(可选):node serve.mjs [端口,默认 8137]
```

> 两个教程页(python.html / tspi-camera.html)共用同一套版式类:`py-layout` / `toc-*` / `chapter` / `ch-*`。
> 要再开一个模块页,直接复制 `tspi-camera.html` + `js/tspi-camera.js`,改 TOC 文案、章节数据变量名、进度 localStorage 键、导航栏链接即可。

## 常见任务怎么做

### 新增一篇博客文章
编辑 `js/posts.js`,在 POSTS 数组**最前面**插入一条(新文章排前):
```js
{
  id: "url-safe-english-id",       // 唯一,用于网址 post.html?id=xxx
  title: "标题",
  date: "2026-09-01",
  tags: ["标签1", "标签2"],
  summary: "首页卡片显示的摘要,一两句话。",
  content: `正文,用 Markdown-lite 语法(见下)`,
}
```

### 新增教程章节
编辑 `js/python-content.js`,在 PY_CHAPTERS 末尾追加:
```js
{ id: "唯一英文id", title: "25. 章节标题(带序号)", content: `章节内容` }
```
注意:首页 `index.html` 推广卡片上写死的"24 章"字样需要同步更新。
学习进度存 localStorage 的 `python-progress`(键为章节 id),改 id 会让老用户进度丢失,**已发布章节的 id 不要改**。

### 新增相机实战章节
编辑 `js/tspi-camera-content.js`,在 TSPI_CHAPTERS 末尾追加:
```js
{ id: "唯一英文id", title: "13. 章节标题", content: `章节内容` }
```
首页 `index.html` 相机卡片上写死的"12 节"字样需要同步更新;进度存 `tspi-progress`,同样**已发布章节的 id 不要改**。

该模块的定位是**实战踩坑手册**,每节按「现象 → 原因 → 命令/代码 → 验证」组织,配现象/原因/解决对照表,**不要写成纯原理讲解**。内容主题是泰山派 RK3566(无 eMMC、SD 卡启动)+ OV8858 摄像头的真实调试过程。

### 页头控件(主题 / 内容宽度)
两套控件都在 `js/main.js`(Theme / Width 模块),状态存 localStorage、以属性形式写到 `<html>` 上:

| 控件 | 属性 | localStorage 键 | 取值 |
|---|---|---|---|
| 主题 | `data-theme` | `blog-theme` | `dark` / `light` |
| 内容宽度 | `data-width` | `blog-width` | `standard`(960px) / `wide`(1200px) / `xwide`(1440px) |

宽度靠 CSS 变量 `--content-max` 生效(`css/style.css` 顶部定义 `:root`,`.container` 使用它;档位选择器紧跟主题变量块)。
要改默认宽度,把 `Width.get()` 的兜底值从 `"standard"` 改成想要的档位即可。

**新增页面时必须把这两个按钮一起放进导航**,否则该页没有控件(JS 找不到元素会静默跳过,不报错):
```html
<button class="width-btn" id="widthToggle" type="button" title="内容宽度">标准</button>
<button class="theme-btn" id="themeToggle" type="button" title="切换明暗主题">🌙</button>
```

## Markdown-lite 语法(渲染器支持的全部)

`# ## ###` 标题 | `**粗体**` | `*斜体*` | `` `行内代码` `` | 三反引号代码块(可标语言)|
`> 引用` | `- 列表项` | `[文字](地址)` 链接 | `![描述](地址)` 图片 | 管道表格 | `---` 分割线

## ⚠️ 头号大坑:模板字符串转义

`posts.js` 和 `python-content.js` 的正文都在 **JS 模板字符串(反引号)** 里,所以:
- 代码块围栏要写成转义形式:\`\`\` 在源码里是 `` \\`\\`\\` ``(每个反引号前加反斜杠)
- 行内代码同样要转义:`\\`像这样\\``
- **改完必须跑**:`node --check js/posts.js`(或对应文件),语法错误会让整站内容空白
- 正文中不要出现 `${`(会被当成 JS 插值)

## 改动后的验证流程

```bash
node --check js/posts.js && node --check js/python-content.js && node --check js/main.js
node --check js/tspi-camera-content.js && node --check js/tspi-camera.js
node serve.mjs            # 起本地预览 → 浏览器开 http://localhost:8137 检查
```
有浏览器自动化能力时,抽检:页面无 JS 报错、新内容渲染出来、移动端 390px 视口无横向溢出(scrollWidth == clientWidth)。

## 发布

```bash
git add -A
git commit -m "描述改了什么"
git push
```
推送后等约 1 分钟,刷新 https://jwp11.github.io/ 验证(可用 curl 检查标记字符串是否出现在线上)。

## 风格约定

- 视觉:深色科技风默认,青色 #22d3ee 渐变点缀,等宽字体做元信息;改动尽量用 css/style.css 顶部的 CSS 变量,别散落硬编码颜色
- 教程行文:每个语法点先写「**作用**」再写「**使用场景**」,然后才给代码;中文讲解,代码注释也用中文
- Git 提交人:`Jwp <167638116+jwp11@users.noreply.github.com>`(仓库级配置已设好)
