import assert from "node:assert/strict";
import {
  noteSeasonRelic,
  noteShinySpecies,
  resolveSeasonRelicDef,
  rollSeasonRelic,
  seasonRelicLines,
  shinyGalleryEntries,
  shinyUniqueCount,
  syncShinyGalleryFromMons,
  buildShinyShareText,
  shinyShareCardPayload,
} from "../modules/systems/collection_fun.js";

{
  const def = resolveSeasonRelicDef("s2");
  assert.equal(def.id, "vial_sigil", "s2 relic");
  const miss = rollSeasonRelic("s1", () => 0.99);
  assert.equal(miss, null, "high roll miss");
  const hit = rollSeasonRelic("s1", () => 0);
  assert.ok(hit && hit.item === "rareCandy", "low roll hit");
  const state = { meta: {} };
  const noted = noteSeasonRelic(state, hit);
  assert.equal(noted.count, 1, "relic count");
  assert.equal(seasonRelicLines(state).length, 1, "relic lines");
}

{
  const state = { dex: { caught: {} }, meta: {} };
  const mile1 = noteShinySpecies(state, { id: "p001b", dex: 1, name: "芽苞苞" });
  assert.equal(mile1?.item, "rareCandy", "first shiny milestone");
  assert.equal(shinyUniqueCount(state), 1, "unique 1");
  const again = noteShinySpecies(state, { id: "p001b", dex: 1, name: "芽苞苞" });
  assert.equal(again, null, "dup no mile");
  noteShinySpecies(state, { id: "p002x", dex: 2, name: "叶团团" });
  const mile3 = noteShinySpecies(state, { id: "p003x", dex: 3, name: "花蓬蓬" });
  assert.equal(mile3?.item, "expCandy", "third shiny milestone");
  assert.equal(shinyGalleryEntries(state, 2).length, 2, "gallery limit");
}

{
  const state = {
    dex: { caught: {}, shiny: {} },
    mons: { list: [{ pid: "p25", dex: 25, name: "电毛球", isShiny: true }] },
  };
  const n = syncShinyGalleryFromMons(state);
  assert.equal(n, 1, "sync added");
  assert.equal(shinyUniqueCount(state), 1, "synced unique");
  assert.equal(state.meta?.shinyMilestones?.s1, undefined, "silent sync no mile");
}

{
  const state = {
    dex: {
      shiny: {
        p25: { dex: 25, name: "电毛球", at: 3 },
        p001b: { dex: 1, name: "芽苞苞", at: 2 },
      },
    },
  };
  const text = buildShinyShareText(state);
  assert.ok(text.includes("电毛球") && text.includes("闪光馆"), "share text");
  assert.equal(shinyShareCardPayload(state).unique, 2, "share card unique");
}

console.log("collection-fun-selfcheck: ok");
