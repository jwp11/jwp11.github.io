/* ============================================
   文章数据加载器
   文章已改为 Markdown 文件,存放在 posts/ 目录,带 YAML frontmatter:
       ---
       title: 标题
       date: 2026-09-17
       tags: [标签1, 标签2]
       summary: 摘要
       ---
       正文(Markdown-lite)
   index.json 由 GitHub Action 自动维护(见 .github/workflows/posts-index.yml),
   也可由 Pages CMS 保存后自动刷新。

   对外接口:window.BlogPosts.load() -> Promise<[ {id,title,date,tags,summary,content} ]>
   ============================================ */
(function (root) {
  const INDEX_URL = "posts/index.json";
  const REPO = "jwp11/jwp11.github.io";
  const BRANCH = "main";
  const CACHE_KEY = "blog-posts-cache-v2";
  const CACHE_TTL = 10 * 60 * 1000; // 10 分钟内直接用缓存

  const store = (function () {
    try { return typeof localStorage !== "undefined" ? localStorage : null; } catch (e) { return null; }
  })();

  /* ---------- 极简 YAML frontmatter 解析(只覆盖本项目用得到的子集) ---------- */
  function parseFrontmatter(text) {
    const m = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/.exec(text);
    if (!m) return { data: {}, body: text };
    const lines = m[1].split(/\r?\n/);
    const body = text.slice(m[0].length);
    const data = {};
    let key = null;
    let block = null; // 块标量 | 或 >

    const unquote = (s) => {
      s = s.trim();
      if (s.length >= 2 && ((s[0] === '"' && s.charAt(s.length - 1) === '"') ||
                            (s[0] === "'" && s.charAt(s.length - 1) === "'"))) {
        const q = s[0];
        s = s.slice(1, -1);
        if (q === '"') {
          s = s.replace(/\\(["\\/nrt])/g, (_, c) =>
            ({ '"': '"', "\\": "\\", "/": "/", n: "\n", r: "\r", t: "\t" }[c]));
        } else {
          s = s.replace(/''/g, "'");
        }
      }
      return s;
    };

    for (const rawLine of lines) {
      const line = rawLine.replace(/\s+$/, "");
      if (block) {
        // 块标量:收集缩进行
        if (line === "" || /^\s/.test(line)) {
          data[key].push(line.replace(/^ {1,2}/, ""));
          continue;
        }
        data[key] = block === ">" ? data[key].join(" ").replace(/\s+/g, " ").trim()
                                  : data[key].join("\n").replace(/\s+$/, "");
        block = null;
      }
      if (!line.trim() || /^\s*#/.test(line)) continue;

      const item = /^\s*-\s+(.*)$/.exec(line);
      if (item && key) {
        if (!Array.isArray(data[key])) data[key] = [];
        data[key].push(unquote(item[1]));
        continue;
      }
      const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
      if (!kv) continue;
      key = kv[1];
      let val = kv[2].trim();
      if (val === "") { data[key] = []; continue; }          // 无值:可能是待续的列表
      if (val === "|" || val === "|-" || val === ">" || val === ">-") {
        data[key] = []; block = val.charAt(0);
        continue;
      }
      data[key] = unquote(val);
    }
    if (block) {
      data[key] = block === ">" ? data[key].join(" ").replace(/\s+/g, " ").trim()
                                : data[key].join("\n").replace(/\s+$/, "");
    }
    // 空列表兜底
    for (const k in data) if (Array.isArray(data[k]) && data[k].length === 0 && typeof data[k] !== "string") {
      // 保留空数组(如 tags 为空)
    }
    return { data, body };
  }

  /* ---------- 取文本 ---------- */
  async function fetchText(url) {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error("HTTP " + r.status + " " + url);
    return r.text();
  }

  function toDate(v) {
    return String(v == null ? "" : v).trim().slice(0, 10);
  }

  function toPost(meta, md) {
    const { data, body } = parseFrontmatter(md);
    const tags = Array.isArray(data.tags) ? data.tags
               : (typeof data.tags === "string" && data.tags ? [data.tags] : []);
    return {
      id: meta.id,
      title: String(data.title || meta.title || meta.id),
      date: toDate(data.date || meta.date),
      tags: tags.map(String),
      summary: String(data.summary || ""),
      content: body.replace(/^\s*\n/, ""),
    };
  }

  /* ---------- 来源 1:posts/index.json(首选,静态、快) ---------- */
  async function loadFromIndex() {
    const list = JSON.parse(await fetchText(INDEX_URL));
    if (!Array.isArray(list) || !list.length) throw new Error("index.json 为空");
    const posts = await Promise.all(
      list.map((meta) => fetchText("posts/" + meta.file).then((md) => toPost(meta, md)))
    );
    return posts;
  }

  /* ---------- 来源 2:GitHub API(兜底,index.json 缺失/过期时用) ---------- */
  async function loadFromApi() {
    const api = "https://api.github.com/repos/" + REPO + "/contents/posts?ref=" + BRANCH;
    const list = JSON.parse(await fetchText(api));
    const files = list.filter((f) => /\.(md|markdown)$/i.test(f.name));
    if (!files.length) throw new Error("仓库 posts/ 下没有文章");
    const posts = await Promise.all(
      files.map((f) => {
        const id = f.name.replace(/\.(md|markdown)$/i, "");
        return fetchText(f.download_url).then((md) => toPost({ id: id, file: f.name }, md));
      })
    );
    return posts;
  }

  function sortPosts(posts) {
    return posts.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  /* ---------- 缓存 ---------- */
  function readCache() {
    if (!store) return null;
    try {
      const obj = JSON.parse(store.getItem(CACHE_KEY) || "null");
      return obj && Array.isArray(obj.posts) ? obj : null;
    } catch (e) { return null; }
  }
  function writeCache(posts) {
    if (!store) return;
    try { store.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), posts: posts })); } catch (e) {}
  }

  /* ---------- 对外:load() ---------- */
  async function load() {
    const cached = readCache();
    if (cached && Date.now() - cached.t < CACHE_TTL) return sortPosts(cached.posts);
    let posts = null;
    try {
      posts = await loadFromIndex();
    } catch (e1) {
      try {
        posts = await loadFromApi();
      } catch (e2) {
        if (cached) return sortPosts(cached.posts); // 网络失败,退回旧缓存
        throw e2;
      }
    }
    posts = sortPosts(posts);
    writeCache(posts);
    return posts;
  }

  root.BlogPosts = { load: load, parseFrontmatter: parseFrontmatter };
})(typeof window !== "undefined" ? window : globalThis);
