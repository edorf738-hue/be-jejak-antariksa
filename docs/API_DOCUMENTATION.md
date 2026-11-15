# API DOCUMENTATION — NASA Hackathon 2026

**Draft API contract.** Base URL, framework, dan deployment masih TBD.

## Konvensi
- Format JSON UTF-8.
- Tanggal ISO 8601.
- ID berupa string.
- Error response konsisten.
- Endpoint publik MVP tidak membutuhkan autentikasi kecuali ada kebutuhan baru.
- Base URL contoh: `/api/v1` (sesuaikan dengan implementasi).

## Endpoint usulan
| Method | Endpoint | Kegunaan |
|---|---|---|
| GET | `/api/v1/objects` | Daftar objek eksplorasi |
| GET | `/api/v1/objects/:slug` | Detail objek |
| GET | `/api/v1/chapters` | Daftar bab cerita (menggantikan `stories`) |
| GET | `/api/v1/chapters/:slug` | Detail bab |
| GET | `/api/v1/missions` | Daftar misi |
| GET | `/api/v1/missions/:slug` | Detail misi |
| GET | `/api/v1/sources` | Daftar sumber |
| GET | `/api/v1/locations` | Daftar lokasi + koordinat (`:slug` untuk detail) |
| GET | `/api/v1/artifacts` | Daftar artefak yang ditinggalkan (`:slug` untuk detail) |
| GET | `/api/v1/media` | Daftar media (`:id` untuk detail) |
| GET | `/assets/...` | File aset statis (URL ada di field `url` media) |

Query: `limit` (default 50), `offset`, plus filter per resource:
- `objects`: `category`
- `missions`: `destination`, `status`
- `locations`: `body`, `mission`
- `artifacts`: `status` (`left_behind|operating|unknown|...`), `mission`, `location`
- `media`: `asset_type` (`image|video|model_3d`), `mission`
- `chapters`: `category`

Status 3D/media: `attribution` masih `null` (TBD, cek kredit per file di halaman NASA).

## Contoh response objek
```json
{
  "data": [{
    "id": "object-mars",
    "slug": "mars",
    "name": "Mars",
    "category": "mars",
    "short_description": "Deskripsi yang sudah diverifikasi.",
    "model_asset": {
      "url": "/assets/3d/mars.glb",
      "format": "glb"
    },
    "sources": [{
      "title": "Judul referensi",
      "url": "https://example.org"
    }]
  }],
  "meta": { "count": 1 }
}
```
Contoh di atas hanya ilustrasi bentuk kontrak. Ganti data dan URL contoh dengan aset serta sumber aktual.

## Error response
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource tidak ditemukan."
  }
}
```

Status umum: `200` sukses, `400` parameter tidak valid, `404` tidak ditemukan, `500` kesalahan server.

## Penanganan di frontend
- Loading: skeleton/indikator.
- Empty: pesan bahwa data belum tersedia.
- Error: pesan ramah dan opsi retry.
- Partial data: tampilkan bagian yang tersedia tanpa mengarang nilai.

## Kontrak integrasi FE-BE
1. Sepakati nama field dan tipe data.
2. BE sediakan contoh response.
3. FE gunakan mock data yang mengikuti kontrak.
4. Perubahan kontrak dikomunikasikan.
5. Uji endpoint dengan data aktual.
6. Jangan mengubah response shape tanpa koordinasi.

Base URL, framework, CORS, autentikasi, hosting, dan rate limit: **TBD**. Jangan commit API key atau secret.

## Konten FE (sumber kebenaran ada di BE)
Data berikut dulu hidup di file FE; sekarang diedit di `data/*.json` BE dan diambil FE lewat `npm run data:sync`.

| Endpoint | Isi | Filter |
|---|---|---|
| `/api/v1/chapters` (`/:slug`) | 4 bab cerita: narasi, bagian, galeri, video, fakta, artefak, sumber | `category` = `moon` \| `mars` \| `deep-space` |
| `/api/v1/scene-objects` (`/:slug`, mis. `obj-2-0`) | 21 benda/hotspot 3D beserta media popup | `category`, `chapter` (1-4) |
| `/api/v1/source-catalog` (`/:id`) | katalog halaman Sumber (referensi, kredit media, model 3D) | `kind` = `referensi` \| `media` \| `model3d` |
| `/api/v1/journeys` (`/:slug`: `moon`, `mars`, `deep-space`) | Peta Perjalanan per tujuan: kategori, misi, detail, pratinjau, kronologi, sumber | - |
| `/api/v1/galleries` (`/:slug`) | foto galeri per lingkungan | - |

Path aset (`/images/...`, `/models/...`, `/videos/...`) relatif terhadap situs FE (`public/`), bukan `/assets` BE.
Seluruh konten FE (termasuk `docs/content-data.json`) sekarang berasal dari BE; FE tidak lagi mengimpor `content-data.json`.
