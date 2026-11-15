# NASA Hackathon 2026 — Documentation Pack

Mulai dengan `docs/PROJECT.md` dan `docs/SPRINT.md`. Gunakan `docs/UI_UX_GUIDELINE.md` untuk desain Figma/Claude MCP dan `docs/CONTENT_REQUIREMENT.md` untuk isi halaman. Dokumen schema, API, aset, dan development menjadi acuan teknis bersama.

Ini adalah baseline awal. Semua bagian `TBD` perlu dikonfirmasi tim.


## Menjalankan backend
```bash
npm install
cp .env.example .env   # opsional
npm run dev            # http://localhost:5000
npm test
node scripts/gen-media.js   # regenerate data/media.json dari folder NASA Assets
```
Data: JSON statis di `data/`. Aset (3D/gambar/video) disajikan di `/assets` dari `../NASA/NASA Assets` (ubah dengan `ASSETS_DIR`).
