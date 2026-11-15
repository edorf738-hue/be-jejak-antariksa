// Regenerate data/media.json from the NASA Assets folder: node scripts/gen-media.js
const fs = require("node:fs");
const path = require("node:path");

const root = process.env.ASSETS_DIR || path.join(__dirname, "..", "..", "NASA", "NASA Assets");
const type = { glb: "model_3d", stl: "model_3d", mp4: "video" }; // everything else = image
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const out = [];
for (const dir of fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const f of fs.readdirSync(path.join(root, dir.name))) {
    const ext = path.extname(f).slice(1).toLowerCase();
    const base = path.basename(f, "." + ext);
    const missions = /^(apollo|saturn)/i.test(base) ? ["apollo-11"] : /^voyager/i.test(base) ? ["voyager-1", "voyager-2"] : [];
    out.push({
      id: `media-${slug(base)}-${ext}`,
      title: base.replace(/[_]+/g, " "),
      asset_type: type[ext] ?? "image",
      url: `/assets/${encodeURI(dir.name)}/${encodeURIComponent(f)}`,
      format: ext,
      file_size_bytes: fs.statSync(path.join(root, dir.name, f)).size,
      attribution: null, // TBD: credit line per file, check NASA page
      mission_slugs: missions,
    });
  }
}
fs.writeFileSync(path.join(__dirname, "..", "data", "media.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`${out.length} media written`);
