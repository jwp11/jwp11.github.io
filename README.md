# jwp11.github.io · 个人博客

纯 HTML/CSS/JS 静态博客,零依赖零构建,托管在 GitHub Pages。

**线上地址**:https://jwp11.github.io/

## 内容

- 🏠 首页:文章列表
- 📝 博客文章:见 `posts/`(Markdown 文件,一篇一个)
- 🐍 Python 语法完整教程(24 章,含爬虫实战篇):`python.html`
- 📷 泰山派 RK3566 运动相机实战(12 节,踩坑手册):`tspi-camera.html`

## 写文章(不用碰代码)

用 **Pages CMS** 在网页上写:打开 https://app.pagescms.org → GitHub 登录 → 选本仓库 →
「博客文章」→ 新建 → 填标题/日期/标签/摘要/正文(图片可拖拽上传)→ 保存,约 1 分钟自动上线。

配置在仓库根目录的 `.pages.yml`(定义了上面那张表单有哪些字段)。

## 本地预览

```bash
node serve.mjs        # 打开 http://localhost:8137
```

> 文章是运行时从 `posts/` 读取的,**不要再直接双击 `index.html`**(`file://` 下浏览器会拦截 fetch)。

改了/新增了 `posts/*.md` 后,刷新文章索引:

```bash
node scripts/gen-posts-index.mjs      # 线上由 GitHub Action 自动执行
```

## 修改与发布

```bash
git add -A && git commit -m "说明" && git push
```

推送 main 分支后约 1 分钟,线上自动更新。

> AI 助手请阅读 [AGENTS.md](AGENTS.md) 了解项目结构与写作规范。
