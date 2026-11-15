import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Item = { id?: string; slug?: string; [k: string]: unknown };

// ponytail: JSON read once at startup; swap for a DB when data outgrows static files
const load = (name: string): Item[] =>
  JSON.parse(readFileSync(join(__dirname, "..", "data", `${name}.json`), "utf8"));

// query param -> field name it filters on
const resources: Record<string, Record<string, string>> = {
  objects: { category: "category" },
  stories: { mission: "mission_slugs" },
  missions: { destination: "destination", status: "status" },
  locations: { body: "body", mission: "mission_slugs" },
  artifacts: { status: "status", mission: "mission_slug", location: "location_slug" },
  sources: {},
  media: { asset_type: "asset_type", mission: "mission_slugs" },
  // content the FE renders (moved here from the FE data files): BE is the source of truth
  chapters: { category: "category" },
  "scene-objects": { category: "category", chapter: "chapter_number" },
  "source-catalog": { kind: "kategori" },
  galleries: {},
};

class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const intParam = (v: unknown, def: number, min: number) => {
  if (v === undefined) return def;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min) throw new ApiError(400, "INVALID_PARAMETER", "limit/offset tidak valid.");
  return n;
};

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true }));
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({ message: "WAYANG ANTARIKSA API is running!" });
  });

  // Assets live outside the repo (large files); override with ASSETS_DIR
  app.use("/assets", express.static(process.env.ASSETS_DIR ?? join(__dirname, "..", "..", "NASA", "NASA Assets")));

  for (const [name, filters] of Object.entries(resources)) {
    const items = load(name);

    app.get(`/api/v1/${name}`, (req, res) => {
      const limit = intParam(req.query.limit, 50, 1);
      const offset = intParam(req.query.offset, 0, 0);
      let out = items;
      for (const [param, field] of Object.entries(filters)) {
        const v = req.query[param];
        if (v === undefined) continue;
        out = out.filter((i) => (Array.isArray(i[field]) ? (i[field] as unknown[]).includes(v) : String(i[field]) === v));
      }
      res.json({ data: out.slice(offset, offset + limit), meta: { count: out.length, limit, offset } });
    });

    app.get(`/api/v1/${name}/:slug`, (req, res) => {
      const item = items.find((i) => (i.slug ?? i.id) === req.params.slug); // sources/media have no slug
      if (!item) throw new ApiError(404, "RESOURCE_NOT_FOUND", "Resource tidak ditemukan.");
      res.json({ data: item });
    });
  }

  app.use((_req, _res, next) => next(new ApiError(404, "RESOURCE_NOT_FOUND", "Resource tidak ditemukan.")));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err instanceof ApiError ? err : new ApiError(500, "INTERNAL_ERROR", "Terjadi kesalahan server.");
    if (e.status === 500) console.error(err);
    res.status(e.status).json({ error: { code: e.code, message: e.message } });
  });

  return app;
}
