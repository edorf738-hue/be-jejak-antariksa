# Prompt Integrasi FE → BE (WAYANG ANTARIKSA)

Salin semua di bawah garis ini ke AI/dev FE. Repo FE: `fe-wayang-antariksa` (Next.js). Baca juga `AGENTS.md` di repo FE.

---

## Peran dan tujuan
Kamu mengerjakan frontend website eksplorasi luar angkasa "WAYANG ANTARIKSA" (hackathon NASA 2026, bahasa konten Indonesia, target pembaca SD–SMP). Hubungkan UI ke backend Express yang sudah jalan. Tema: **"Left behind, never forgotten"**: benda yang ditinggalkan manusia di Bulan, Mars, dan ruang antarbintang.

Halaman: Home, Story, Journey Map, Source. Resources diakses dari Home/halaman terkait (bukan navbar).

## Backend
- Base URL dev: `http://localhost:5000` (jalankan `npm run dev` di `be-wayang-antariksa`). Simpan di env FE, mis. `NEXT_PUBLIC_API_URL`; jangan hardcode.
- CORS: BE membaca `CORS_ORIGIN` (contoh `http://localhost:3000`).
- Tanpa autentikasi. Semua endpoint `GET`.
- Data: JSON statis, dibaca saat server start. Edit data → restart BE.

### Bentuk response
List: `{ "data": [...], "meta": { "count": <total setelah filter>, "limit": 50, "offset": 0 } }`
Detail: `{ "data": {...} }`
Error: `{ "error": { "code": "RESOURCE_NOT_FOUND" | "INVALID_PARAMETER" | "INTERNAL_ERROR", "message": "..." } }` dengan status 404 / 400 / 500.
Query `limit` (default 50, minimal 1) dan `offset` (default 0) harus bilangan bulat; selain itu 400.

### Endpoint
| Endpoint | Detail | Filter query | Jumlah data |
|---|---|---|---|
| `/api/v1/objects` | `/objects/:slug` | `category` = `mars` \| `moon` \| `deep_space` | 3 |
| `/api/v1/missions` | `/missions/:slug` | `destination` = `moon` \| `mars` \| `deep-space`, `status` | 5 |
| `/api/v1/locations` | `/locations/:slug` | `body` = `moon` \| `mars` \| `deep_space`, `mission` | 4 |
| `/api/v1/artifacts` | `/artifacts/:slug` | `status`, `mission`, `location` | 13 |
| `/api/v1/chapters` | `/chapters/:slug` | `category` | 4 (menggantikan `stories`) |
| `/api/v1/source-catalog` | `/source-catalog/:id` | `kind` | 40 (menggantikan `sources`) |
| `/api/v1/media` | `/media/:id` | `asset_type` = `image` \| `video` \| `model_3d`, `mission` | 31 |

Filter pada field array (mis. `mission` di media) berarti "array memuat nilai ini". Perhatikan: `destination` misi memakai tanda hubung (`deep-space`), sedangkan `category`/`body` memakai garis bawah (`deep_space`). Jangan disamakan.

### Slug penting
- Misi: `apollo-11`, `voyager-1`, `voyager-2`, `spirit`, `opportunity`
- Lokasi: `tranquility-base`, `gusev-crater`, `meridiani-planum`, `interstellar-space`
- Objek: `mars`, `moon`, `deep-space`

## Field per resource
- **object**: `id, slug, name, category, short_description, model_asset (null), sources[]`
- **mission**: `id, slug, name, agency, destination, location_slug, launch_date, arrival_date, end_date, date_note, status, status_verified_at, objective, crew[], sources[]`
  - `status`: `completed` | `operating` | `inactive`. Label usulan: Selesai / Masih beroperasi / Nonaktif.
  - Tanggal `YYYY-MM-DD`, bisa `null`. Tampilkan `date_note` sebagai keterangan (zona waktu, perbedaan sumber).
- **location**: `id, slug, name, body, latitude, longitude, coordinate_note, mission_slugs[], environment_3d, sources[]`
  - Lintang negatif = selatan, bujur = timur. `latitude`/`longitude` bisa `null` (ruang antarbintang): jangan digambar sebagai titik di peta, tampilkan teks `coordinate_note`.
- **artifact**: `id, slug, name, mission_slug, location_slug (bisa null), description, status, status_note, model_media_id (bisa null), model_note, sources[]`
  - `status`: `left_behind` (ditinggalkan di benda langit) | `operating` (pesawat masih beroperasi) | `unknown` (nasib tidak diketahui). Bedakan secara visual **tidak hanya dengan warna**.
  - `status_note` adalah keterangan resmi; tampilkan, jangan ditulis ulang.
  - `model_note` mengingatkan model 3D adalah model umum/rekonstruksi: tampilkan labelnya.
- **story**: `id, slug, title, chapter_number, summary, body, published, sort_order, mission_slugs[], sources[]`. Urutkan dengan `sort_order`.
- **source**: `id, title, publisher, url, accessed_at (saat ini semua null)`
- **media**: `id, title, asset_type, url, format, file_size_bytes, attribution (saat ini semua null), mission_slugs[]`

## Aset (3D, gambar, video)
- `media.url` adalah path relatif (sudah di-URL-encode), mis. `/assets/Images/...`. Gabungkan dengan base URL BE: `${API_URL}${media.url}`. Jangan di-encode ulang.
- Model 3D: `.glb` (5 file, 0,2–3 MB) aman dimuat di web. `.stl` (`Apollo 11 - Landing Site`, 6,9 MB) lebih berat dan tanpa material; muat hanya saat dibutuhkan.
- Muat model 3D secara lazy (hanya saat dibutuhkan), tampilkan loading, dan sediakan fallback gambar/teks bila 3D gagal atau tidak didukung.
- Video: 6 file `.mp4`, 23–85 MB (`Apollo11_Mission_Introduction.mp4` paling besar). Jangan autoplay, set `preload="none"` atau `metadata`, beri poster. BE mendukung range request.
- Semua gambar perlu `alt` yang bermakna (dari `title` bila belum ada yang lebih baik).
- Tidak ada model/aset untuk rover Spirit & Opportunity dan lingkungan 3D Mars/Bulan/Deep Space di folder aset saat ini. `model_media_id` rover bernilai `null`. Tangani, jangan error.

## Data yang BELUM final (jangan diisi atau dikarang)
- `objects[].short_description` = `"TBD — needs verification"`. Sembunyikan atau tampilkan sebagai "Konten belum tersedia"; jangan hardcode deskripsi sendiri.
- `attribution` media semua `null`; tampilkan "Kredit: NASA (detail menyusul)" atau serupa, lalu isi nanti saat BE diperbarui.
- `status_verified_at` hanya terisi untuk Voyager (`2026-04-17`). Bila `null`, jangan menulis "terverifikasi pada ...".
- `objective` Voyager 1/2 = `"TBD"`.
- Jarak/kecepatan Voyager 2 belum ada.
- Jangan menambah fakta, tanggal, angka, atau status misi dari ingatan. Semua fakta harus datang dari API, dan tiap halaman fakta menampilkan `sources[]` sebagai tautan.

## Pola tampilan per halaman
- **Home**: hero lingkungan 3D (Mars/Bulan/Deep Space) + CTA ke Story dan Journey Map. Pilih tampilan dari `/objects`.
- **Story**: daftar bab dari `/chapters` (4 bab), detail dari `/chapters/:slug`.
- **Journey Map**: destinasi dari `/locations` dikelompokkan per `body`; tiap lokasi menampilkan misi (`mission_slugs`) dan artefaknya (`/artifacts?location=<slug>`). Bedakan lokasi fisik (Bulan/Mars/antariksa) dari penempatan virtual.
- **Source**: gabungkan `/sources` dan atribusi media. Tampilkan `publisher` dan tautan.
- **Artefak**: kartu dengan status, deskripsi, `status_note`, model 3D bila ada, dan sumber.

## State wajib
Setiap pemanggilan API menangani: **loading** (skeleton), **kosong** (pesan "data belum tersedia"), **error** (pesan ramah + tombol coba lagi; 404 dan jaringan putus dibedakan), serta **data parsial** (tampilkan yang ada, `null` tidak dianggap error).

## Aturan implementasi
- Satu modul API client terpusat (mis. `src/lib/api.ts`) dengan tipe TypeScript sesuai field di atas. Jangan menyebar `fetch` di komponen.
- Pisahkan data fetching, logika, dan UI. Komponen reusable.
- Responsif (desktop dan mobile), navigasi keyboard, fokus terlihat, kontras memadai, semantic HTML.
- Jangan ubah bentuk response atau minta BE mengubahnya tanpa koordinasi; bila ada field yang kurang, tulis permintaannya.
- Jangan commit secret atau `.env`.

## Cara uji cepat
```bash
curl http://localhost:5000/api/v1/missions
curl "http://localhost:5000/api/v1/artifacts?status=unknown"
curl "http://localhost:5000/api/v1/media?mission=apollo-11&asset_type=model_3d"
curl -I "http://localhost:5000/assets/Images/Voyager_Golden_Record.jpg"
```

## Keluaran yang diharapkan
1. API client + tipe.
2. Halaman/komponen sesuai bagian "Pola tampilan".
3. Ringkasan: file yang berubah, cara menjalankan, apa yang sudah diuji, dan daftar permintaan perubahan untuk BE (bila ada).
