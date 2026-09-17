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
├── posts/            博客文章(Markdown,一篇一个文件)★ 写文章用 Pages CMS 或丢 .md 进来
│   └── index.json    文章索引(由 scripts/gen-posts-index.mjs 自动生成,不要手改)
├── .pages.yml        Pages CMS 配置(定义"短名/标题/日期/标签/摘要/正文"表单字段 + 图片上传)
├── .github/workflows/posts-index.yml  posts/ 有变动时自动更新文章索引
├── scripts/gen-posts-index.mjs        扫描 posts/*.md → 生成 posts/index.json
├── css/style.css     全部样式:CSS 变量主题系统([data-theme] 切换明暗)
├── js/main.js        核心引擎:主题切换、轻量 Markdown 渲染器(BlogMD)、列表/文章渲染(异步加载文章)
├── js/posts.js       文章加载器:读 posts/index.json + posts/*.md,解析 frontmatter(★ 一般不用改)
├── js/python-content.js  教程章节数据(PY_CHAPTERS 数组)★ 加教程章节改这里
├── js/python.js      教程页逻辑(目录/滚动高亮/进度存 localStorage 的 python-progress)
├── js/tspi-camera-content.js  相机实战章节数据(TSPI_CHAPTERS 数组)★ 加章节改这里
├── js/tspi-camera.js 相机实战页逻辑(同 python.js,进度独立存 tspi-progress)
└── serve.mjs         本地预览服务器:node serve.mjs [端口,默认 8137]
```

> 两个教程页(python.html / tspi-camera.html)共用同一套版式类:`py-layout` / `toc-*` / `chapter` / `ch-*`。
> 要再开一个模块页,直接复制 `tspi-camera.html` + `js/tspi-camera.js`,改 TOC 文案、章节数据变量名、进度 localStorage 键、导航栏链接即可。

## 常见任务怎么做

### 新增一篇博客文章(两种方式)

**方式 A(推荐,不用碰代码):Pages CMS 网页表单**

1. 打开 https://app.pagescms.org,用 GitHub 登录(首次需给本仓库安装 Pages CMS 的 GitHub App)
2. 选本仓库 → 左侧「博客文章」→「新建」
3. 依次填:**网址短名**(英文/数字,决定文件名和 `post.html?id=xxx`)、标题、日期、标签、摘要、正文(富文本编辑器,图片可直接拖进来上传)
4. 保存 → 自动 commit 到仓库 → 约 1 分钟上线(`posts/index.json` 由 GitHub Action 自动刷新)

**方式 B:手动加一个 Markdown 文件**

在 `posts/` 下新建 `<id>.md`(文件名即文章 id,英文/数字):

```markdown
---
title: "标题"
date: 2026-09-17
tags: ["标签1", "标签2"]
summary: "首页卡片显示的摘要"
---

正文(Markdown-lite 语法,见下)
```

然后跑 `node scripts/gen-posts-index.mjs` 刷新索引(线上由 Action 自动跑)。

> 文章已从 `js/posts.js` 挪到 `posts/*.md`,所以**不用再转义反引号、也不会被 `${` 坑**。
> 图片放 `images/`,正文里写 `![描述](images/xxx.png)`(Pages CMS 上传会自动写成 `/images/xxx.png`,同样可用)。

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

## Pages CMS(网页表单写文章)一次性配置

仓库里已有 `.pages.yml`,定义了两块:`posts/` 文章集合 + `images/` 图片上传。

- 线上地址:**https://app.pagescms.org**(官方免费托管,不用自己搭服务)
- 首次使用:用 GitHub 登录 → 给本仓库安装/授权 **Pages CMS 的 GitHub App** → 选仓库即可
- 自托管/本地运行的安装说明:https://pagescms.org/docs/guides/installing/

`.pages.yml` 要点:

| 配置 | 作用 |
|---|---|
| `filename.template: "{fields.id}.md"` | 文件用"网址短名"字段命名,也就是 `post.html?id=xxx` 里的 `xxx` |
| `fields[].type: date` | 日期选择器(写出 `YYYY-MM-DD`) |
| `fields[].type: string, list: true` | 标签(回车逐条添加) |
| `fields[].type: rich-text` | 正文,即 Markdown 文件主体(不是 frontmatter) |
| `media.input: images` / `output: /images` | 上传的图片存到 `images/`,正文里写成 `/images/xxx.png` |

改完 `.pages.yml` 后,刷新 Pages CMS 就能看到新字段。

## Markdown-lite 语法(渲染器支持的全部)

`# ## ###` 标题 | `**粗体**` | `*斜体*` | `` `行内代码` `` | 三反引号代码块(可标语言)|
`> 引用` | `- 列表项` | `[文字](地址)` 链接 | `![描述](地址)` 图片 | 管道表格 | `---` 分割线

## ⚠️ 转义坑(只影响两个"教程内容"文件)

`js/python-content.js` 和 `js/tspi-camera-content.js` 的正文仍在 **JS 模板字符串(反引号)** 里,所以:
- 代码块围栏要写成转义形式:\`\`\` 在源码里是 `` \\`\\`\\` ``(每个反引号前加反斜杠)
- 行内代码同样要转义:`\\`像这样\\``
- **改完必须跑**:`node --check` 对应文件,语法错误会让整页内容空白
- 正文中不要出现 `${`(会被当成 JS 插值)

> 博客文章(`posts/*.md`)是纯 Markdown 文件,**没有上面这些坑**。

## 改动后的验证流程

```bash
node --check js/posts.js && node --check js/python-content.js && node --check js/main.js
node --check js/tspi-camera-content.js && node --check js/tspi-camera.js
node scripts/gen-posts-index.mjs   # 改了/新增了 posts/*.md 之后刷新索引
node serve.mjs                     # 起本地预览 → 浏览器开 http://localhost:8137
```

> ⚠️ **本地预览必须用 `node serve.mjs`,不能再双击 `index.html`**:文章现在是 `fetch()` 从 `posts/`
> 加载的,`file://` 协议下会被浏览器拦住(页面会显示"文章加载失败")。

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
