# jwp11.github.io · 个人博客

纯 HTML/CSS/JS 静态博客,零依赖零构建,托管在 GitHub Pages。

**线上地址**:https://jwp11.github.io/

## 内容

- 🏠 首页:文章列表
- 📝 博客文章:见 `js/posts.js`
- 🐍 Python 语法完整教程(24 章,含爬虫实战篇):`python.html`
- 📷 泰山派 RK3566 运动相机实战(12 节,踩坑手册):`tspi-camera.html`

## 本地预览

```bash
node serve.mjs        # 打开 http://localhost:8137
```

也可以直接双击 `index.html`(数据用 JS 加载,file:// 协议可用)。

## 修改与发布

```bash
git add -A && git commit -m "说明" && git push
```

推送 main 分支后约 1 分钟,线上自动更新。

> AI 助手请阅读 [AGENTS.md](AGENTS.md) 了解项目结构与写作规范。
