import test from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app";

test("api smoke + data integrity", async () => {
  const server = createApp().listen(0);
  const host = `http://localhost:${(server.address() as AddressInfo).port}`;
  const get = async (p: string) => {
    const r = await fetch(host + "/api/v1" + p);
    return { status: r.status, body: (await r.json()) as any };
  };
  const list = async (p: string) => (await get(p + (p.includes("?") ? "&" : "?") + "limit=500")).body.data as any[];
  try {
    // basics
    assert.equal((await get("/objects")).body.meta.count, 3);
    assert.equal((await get("/objects/mars")).body.data.slug, "mars");
    assert.equal((await get("/objects/nope")).status, 404);
    assert.equal((await get("/objects/nope")).body.error.code, "RESOURCE_NOT_FOUND");
    assert.equal((await get("/objects?limit=abc")).status, 400);
    assert.equal((await get("/unknown")).status, 404);

    // filters
    assert.equal((await list("/missions?destination=moon"))[0].slug, "apollo-11");
    assert.equal((await list("/artifacts?status=unknown"))[0].slug, "eagle-ascent-stage");
    assert.equal((await list("/media?mission=voyager-1&asset_type=video")).length, 0);
    assert.ok((await list("/media?mission=apollo-11&asset_type=video")).length > 0);

    // relations point at real records
    const missions = new Set((await list("/missions")).map((m) => m.slug));
    const locations = new Set((await list("/locations")).map((l) => l.slug));
    const media = await list("/media");
    const mediaIds = new Set(media.map((m) => m.id));
    for (const m of await list("/missions")) assert.ok(locations.has(m.location_slug), m.slug);
    for (const l of await list("/locations")) l.mission_slugs.forEach((s: string) => assert.ok(missions.has(s), l.slug));
    for (const a of await list("/artifacts")) {
      assert.ok(missions.has(a.mission_slug), a.slug);
      assert.ok(a.location_slug === null || locations.has(a.location_slug), a.slug);
      assert.ok(a.model_media_id === null || mediaIds.has(a.model_media_id), a.slug);
    }

    // FE content now lives here
    const chapters = await list("/chapters");
    assert.deepEqual(chapters.map((c) => c.slug), ["awal-eksplorasi", "eksplorasi-bulan", "eksplorasi-mars", "deep-space"]);
    assert.ok(chapters.every((c) => c.sections.length > 0 && c.sources.length > 0), "chapter content");
    assert.equal((await get("/chapters/eksplorasi-bulan")).body.data.category, "moon");
    const objs = await list("/scene-objects");
    assert.equal(objs.length, 21);
    assert.equal((await list("/scene-objects?category=moon")).length, 11);
    assert.equal((await list("/scene-objects?chapter=4")).length, 4);
    assert.ok(objs.every((o) => Array.isArray(o.media)), "object media");
    assert.equal((await list("/source-catalog?kind=model3d")).length, 8);
    assert.equal((await list("/source-catalog")).length, 37);
    assert.equal((await get("/journeys/mars")).body.data.kategori.nama, "Mars");
    assert.equal((await list("/journeys")).length, 3);
    assert.equal((await list("/galleries")).length, 3);

    // a media url is actually served
    const m = media.find((x) => x.format === "webp");
    assert.equal((await fetch(host + m.url)).status, 200);
  } finally {
    server.close();
  }
});
