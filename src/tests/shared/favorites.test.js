import test from "node:test";
import assert from "node:assert/strict";

import {
  MemoryStorage,
  importFresh,
  rehydrateFresh,
} from "../helpers/storeTestUtils.js";

import { liftFavorites } from "@shared/lib/favorites";
import { STORAGE_KEYS } from "@shared/lib/storage/storageKeys";

const storage = new MemoryStorage();
globalThis.localStorage = storage;
globalThis.sessionStorage = new MemoryStorage();

const STORE_PATH = "@shared/store/useFavoritesStore.js";

test("liftFavorites moves favourites first and keeps list order", () => {
  const isFavorite = (option) => option === "c" || option === "a";
  assert.deepEqual(liftFavorites(["a", "b", "c", "d"], isFavorite), {
    options: ["a", "c", "b", "d"],
    favoriteCount: 2,
  });
});

test("liftFavorites returns the same array when nothing is starred", () => {
  const options = ["a", "b"];
  const result = liftFavorites(options, () => false);
  assert.equal(result.options, options);
  assert.equal(result.favoriteCount, 0);
});

test("toggleFavorite stars and unstars per scope", async () => {
  storage.clear();
  const { useFavoritesStore } = await importFresh(STORE_PATH);
  const { toggleFavorite } = useFavoritesStore.getState();

  toggleFavorite("scale", "12-TET-Major");
  toggleFavorite("chord", "maj7");
  toggleFavorite("scale", "12-TET-Dorian");
  toggleFavorite("scale", "12-TET-Major");

  assert.deepEqual(useFavoritesStore.getState().favorites, {
    scale: ["12-TET-Dorian"],
    chord: ["maj7"],
  });
});

test("favourites persist globally and drop malformed entries", async () => {
  storage.clear();
  storage.setItem(
    STORAGE_KEYS.FAVORITES,
    JSON.stringify({
      state: { favorites: { preset: ["6:Drop D", 3], chord: "maj" } },
      version: 1,
    }),
  );

  const store = await rehydrateFresh(STORE_PATH, "useFavoritesStore");
  assert.deepEqual(store.getState().favorites, { preset: ["6:Drop D"] });

  store.getState().resetFavorites();
  assert.deepEqual(store.getState().favorites, {});
});
