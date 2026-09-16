/* ============================================
   泰山派相机实战页:目录渲染 / 进度追踪 / 滚动高亮
   依赖 main.js 暴露的 BlogMD.renderMarkdown
   与 python.js 结构一致,但进度独立存储(tspi-progress)
   ============================================ */
(function () {
  "use strict";

  const PROGRESS_KEY = "tspi-progress";
  const tocNav = document.getElementById("tocNav");
  const content = document.getElementById("tspiContent");
  const bar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  if (!tocNav || !content || typeof TSPI_CHAPTERS === "undefined") return;

  /* ---------- 进度存取 ---------- */
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch { return {}; }
  }
  function saveProgress(p) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }

  /* ---------- 渲染目录与章节 ---------- */
  let progress = loadProgress();

  tocNav.innerHTML = TSPI_CHAPTERS.map((ch) => `
    <a class="toc-item${progress[ch.id] ? " done" : ""}" href="#ch-${ch.id}" data-ch="${ch.id}">
      <span class="toc-check"></span>
      <span class="toc-label">${ch.title}</span>
    </a>`).join("");

  content.innerHTML = TSPI_CHAPTERS.map((ch) => `
    <section class="chapter" id="ch-${ch.id}" data-ch="${ch.id}">
      <h2 class="ch-title">${ch.title}</h2>
      <div class="article ch-body">${BlogMD.renderMarkdown(ch.content)}</div>
      <button class="ch-toggle${progress[ch.id] ? " learned" : ""}" type="button" data-ch="${ch.id}">
        ${progress[ch.id] ? "已掌握 ✓(点击取消)" : "标记本章已学"}
      </button>
    </section>`).join("");

  /* ---------- 进度条 ---------- */
  function refreshProgress() {
    const total = TSPI_CHAPTERS.length;
    const learned = TSPI_CHAPTERS.filter((c) => progress[c.id]).length;
    const pct = Math.round((learned / total) * 100);
    bar.style.width = pct + "%";
    progressText.textContent = `已学 ${learned} / ${total} 章 · ${pct}%`;
  }
  refreshProgress();

  /* ---------- 标记已学(事件委托) ---------- */
  content.addEventListener("click", (e) => {
    const btn = e.target.closest(".ch-toggle");
    if (!btn) return;
    const id = btn.dataset.ch;
    if (progress[id]) delete progress[id];
    else progress[id] = true;
    saveProgress(progress);
    btn.classList.toggle("learned", !!progress[id]);
    btn.textContent = progress[id] ? "已掌握 ✓(点击取消)" : "标记本章已学";
    const tocItem = tocNav.querySelector(`[data-ch="${id}"]`);
    if (tocItem) tocItem.classList.toggle("done", !!progress[id]);
    refreshProgress();
  });

  /* ---------- 滚动高亮(scroll-spy) ---------- */
  const sections = [...content.querySelectorAll(".chapter")];
  const tocItems = [...tocNav.querySelectorAll(".toc-item")];

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.dataset.ch;
      tocItems.forEach((t) =>
        t.classList.toggle("active", t.dataset.ch === id));
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  sections.forEach((s) => spy.observe(s));

  /* ---------- 目录点击平滑滚动 ---------- */
  tocNav.addEventListener("click", (e) => {
    const item = e.target.closest(".toc-item");
    if (!item) return;
    e.preventDefault();
    const target = document.getElementById("ch-" + item.dataset.ch);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- 移动端目录折叠:桌面默认展开 ---------- */
  const tocBox = document.getElementById("tocBox");
  function syncTocOpen() {
    if (!tocBox) return;
    tocBox.open = window.innerWidth > 960;
  }
  syncTocOpen();
  window.addEventListener("resize", syncTocOpen);
})();
