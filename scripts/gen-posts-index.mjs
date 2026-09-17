/* 生成 posts/index.json
   扫描 posts/*.md 的 frontmatter,提取 id / file / date / title,按日期倒序输出。
   本地: node scripts/gen-posts-index.mjs
   线上: GitHub Action 在 posts/ 有改动时自动运行(.github/workflows/posts-index.yml)
*/
import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(import.meta.dirname, "..");
const POSTS_DIR = path.join(REPO, "posts");

function frontmatter(text) {
  const m = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/.exec(text);
  if (!m) return {};
  const data = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const item = /^\s*-\s+(.*)$/.exec(line);
    if (item && key) {
      if (!Array.isArray(data[key])) data[key] = data[key] ? [data[key]] : [];
      data[key].push(unquote(item[1]));
      continue;
    }
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    key = kv[1];
    const v = kv[2].trim();
    data[key] = v ? unquote(v) : [];
  }
  return data;
}

function unquote(s) {
  s = s.trim();
  if (s.length >= 2 && ((s[0] === '"' && s.at(-1) === '"') || (s[0] === "'" && s.at(-1) === "'"))) {
    return s.slice(1, -1);
  }
  return s;
}

const items = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => /\.(md|markdown)$/i.test(f))
  .map((file) => {
    const fm = frontmatter(fs.readFileSync(path.join(POSTS_DIR, file), "utf8"));
    return {
      id: file.replace(/\.(md|markdown)$/i, ""),
      file,
      date: String(fm.date || "").slice(0, 10),
      title: typeof fm.title === "string" ? fm.title : "",
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

fs.writeFileSync(path.join(POSTS_DIR, "index.json"), JSON.stringify(items, null, 2) + "\n", "utf8");
console.log(`posts/index.json 已更新: ${items.length} 篇`);
for (const it of items) console.log(`  ${it.date}  ${it.file}`);
