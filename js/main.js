/* ============================================
   博客核心脚本:主题切换 / 列表渲染 / 文章渲染
   轻量 Markdown 渲染器,零依赖,file:// 直开可用
   ============================================ */
(function () {
  "use strict";

  /* ---------- 主题管理 ---------- */
  const Theme = {
    key: "blog-theme",
    get() {
      const saved = localStorage.getItem(this.key);
      if (saved) return saved;
      return window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light" : "dark";
    },
    apply(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      const btn = document.getElementById("themeToggle");
      if (btn) btn.textContent = theme === "dark" ? "🌙" : "☀️";
    },
    toggle() {
      const next = this.get() === "dark" ? "light" : "dark";
      localStorage.setItem(this.key, next);
      this.apply(next);
    },
    init() {
      this.apply(this.get());
      const btn = document.getElementById("themeToggle");
      if (btn) btn.addEventListener("click", () => this.toggle());
    },
  };

  /* ---------- 工具 ---------- */
  const $ = (sel) => document.querySelector(sel);

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function readingTime(content) {
    const chars = content.replace(/\s/g, "").length;
    return Math.max(1, Math.round(chars / 500));
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split("-");
    return `${y} 年 ${+m} 月 ${+d} 日`;
  }

  /* 括号按嵌套深度着色(内层/外层不同色),便于分辨公式与代码的层次 */
  function colorizeDelims(raw) {
    let depth = 0;
    let out = "";
    for (const ch of raw) {
      const c = ch === "&" ? "&amp;" : ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch;
      if (ch === "(" || ch === "[" || ch === "{") {
        depth += 1;
        out += `<span class="pn-${((depth - 1) % 3) + 1}">${c}</span>`;
      } else if (ch === ")" || ch === "]" || ch === "}") {
        out += `<span class="pn-${((depth - 1) % 3) + 1}">${c}</span>`;
        depth = Math.max(0, depth - 1);
      } else {
        out += c;
      }
    }
    return out;
  }

  /* ---------- 轻量 Markdown 渲染器 ---------- */
  function renderMarkdown(src) {
    // 1. 先抽出代码块占位,避免内部内容被其他规则处理
    const codeBlocks = [];
    let text = src.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: lang || "text", code: code.replace(/\n$/, "") });
      return `\u0000CODE${idx}\u0000`;
    });

    text = escapeHtml(text);

    // 2. 表格(GFM 管道表)
    text = text.replace(
      /^(\|.+\|)\n(\|[\s:|-]+\|)\n((?:\|.*\|\n?)*)/gm,
      (_, headRow, _sep, bodyRows) => {
        const th = headRow.split("|").filter((c) => c.trim() !== "")
          .map((c) => `<th>${c.trim()}</th>`).join("");
        const trs = bodyRows.trim().split("\n")
          .map((r) => {
            const tds = r.split("|").filter((c) => c.trim() !== "")
              .map((c) => `<td>${c.trim()}</td>`).join("");
            return `<tr>${tds}</tr>`;
          }).join("");
        return `<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`;
      });

    // 3. 标题
    text = text.replace(/^### (.+)$/gm, "<h3>$1</h3>")
               .replace(/^## (.+)$/gm, "<h2>$1</h2>")
               .replace(/^# (.+)$/gm, "<h2>$1</h2>");

    // 4. 引用、分割线(escapeHtml 已把 > 转成 &gt;,按转义后形态匹配)
    text = text.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");
    text = text.replace(/^(---+)$/gm, "<hr>");

    // 5. 列表(连续的 - 行合并为 ul)
    text = text.replace(/((?:^- .+\n?)+)/gm, (block) => {
      const items = block.trim().split("\n")
        .map((l) => `<li>${l.replace(/^- /, "")}</li>`).join("");
      return `<ul>${items}</ul>`;
    });

    // 6. 行内元素
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" loading="lazy">');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    text = text.replace(/`([^`\n]+)`/g, '<code class="inline">$1</code>');
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");

    // 7. 段落:空行分段,其余行内的换行转为 <br>
    const html = text.split(/\n{2,}/).map((para) => {
      const p = para.trim();
      if (!p) return "";
      if (/^<(h2|h3|ul|ol|blockquote|table|div|hr|img)/.test(p)) return p;
      return `<p>${p.replace(/\n/g, "<br>")}</p>`;
    }).join("\n");

    // 8. 填回代码块
    return html.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => {
      const b = codeBlocks[+i];
      return (
        `<div class="code-block"><div class="code-head">` +
        `<span>${b.lang}</span>` +
        `<button class="copy-btn" type="button">复制</button>` +
        `</div><pre><code>${colorizeDelims(b.code)}</code></pre></div>`
      );
    });
  }

  /* ---------- 代码块复制(事件委托) ---------- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;
    const code = btn.closest(".code-block").querySelector("code");
    navigator.clipboard.writeText(code.innerText).then(() => {
      btn.textContent = "已复制 ✓";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "复制";
        btn.classList.remove("copied");
      }, 1600);
    });
  });

  /* ---------- 打字机效果 ---------- */
  function typewriter(el, phrases) {
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.querySelector(".typed").textContent = phrases[0];
      return;
    }
    let pi = 0, ci = 0, deleting = false;
    const span = el.querySelector(".typed");
    (function tick() {
      const phrase = phrases[pi];
      span.textContent = phrase.slice(0, ci);
      if (!deleting) {
        if (ci++ < phrase.length) return setTimeout(tick, 90);
        deleting = true;
        return setTimeout(tick, 2200);
      }
      if (ci-- > 0) return setTimeout(tick, 35);
      deleting = false;
      pi = (pi + 1) % phrases.length;
      setTimeout(tick, 400);
    })();
  }

  /* ---------- 首页:文章列表 ---------- */
  function renderIndex() {
    const list = $("#postList");
    if (!list) return;
    const sorted = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
    list.innerHTML = sorted.map((p) => `
      <a class="post-card fade-up" href="post.html?id=${p.id}">
        <div class="post-meta">
          <span>📅 ${formatDate(p.date)}</span>
          <span class="read-time">${readingTime(p.content)} 分钟阅读</span>
        </div>
        <div class="post-title">${escapeHtml(p.title)}</div>
        <div class="post-summary">${escapeHtml(p.summary)}</div>
        <div class="post-tags">${p.tags.map((t) => `<span class="tag"># ${escapeHtml(t)}</span>`).join("")}</div>
      </a>`).join("");
  }

  /* ---------- 文章页 ---------- */
  function renderPost() {
    const header = $("#postHeader");
    if (!header) return;
    const id = new URLSearchParams(location.search).get("id");
    const idx = POSTS.findIndex((p) => p.id === id);

    if (idx === -1) {
      header.innerHTML = `
        <div class="not-found">
          <h1>404</h1>
          <p>文章不存在或已被删除</p>
          <a class="back-link" href="index.html">← 返回首页</a>
        </div>`;
      return;
    }

    const sorted = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
    const cur = sorted.findIndex((p) => p.id === id);
    const prev = sorted[cur + 1];
    const next = sorted[cur - 1];

    document.title = `${POSTS[idx].title} · 我的博客`;

    header.innerHTML = `
      <div class="post-meta">
        <span>📅 ${formatDate(POSTS[idx].date)}</span>
        <span class="read-time">${readingTime(POSTS[idx].content)} 分钟阅读</span>
      </div>
      <h1 class="post-page-title">${escapeHtml(POSTS[idx].title)}</h1>
      <div class="post-tags">${POSTS[idx].tags.map((t) => `<span class="tag"># ${escapeHtml(t)}</span>`).join("")}</div>`;

    $("#articleBody").innerHTML = renderMarkdown(POSTS[idx].content);

    const nav = $("#postNav");
    nav.innerHTML =
      (prev
        ? `<a class="post-nav-card" href="post.html?id=${prev.id}">
             <span class="post-nav-label">← 上一篇</span>
             <span class="post-nav-title">${escapeHtml(prev.title)}</span></a>`
        : `<span></span>`) +
      (next
        ? `<a class="post-nav-card next" href="post.html?id=${next.id}">
             <span class="post-nav-label">下一篇 →</span>
             <span class="post-nav-title">${escapeHtml(next.title)}</span></a>`
        : "");
  }

  /* ---------- 启动 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    Theme.init();
    renderIndex();
    renderPost();
    typewriter($("#heroSub"), [
      "code / hardware / life",
      "记录硬件设计与编程学习",
      "保持好奇,持续构建",
    ]);
  });

  // 暴露给其他页面(python.html 等)复用
  window.BlogMD = { renderMarkdown, escapeHtml };
})();
