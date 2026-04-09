import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useFretboardLayout } from "@/hooks/useFretboardLayout";

function LayoutProbe(props) {
  const layout = useFretboardLayout(props);
  const snapshot = JSON.stringify({
    startFret: layout.startFretFor(0),
    stringStartX: layout.stringStartX(0),
    openX: layout.openXForString(0),
  });

  return React.createElement("div", { "data-layout-snapshot": snapshot }, null);
}

function renderLayoutSnapshot(stringMeta) {
  const markup = renderToStaticMarkup(
    React.createElement(LayoutProbe, {
      frets: 12,
      strings: 1,
      dotSize: 14,
      stringMeta,
    }),
  );

  const payload = markup.match(/data-layout-snapshot="([^"]+)"/)?.[1];
  assert.ok(payload, "expected JSON payload from LayoutProbe");
  const decoded = payload
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&");
  return JSON.parse(decoded);
}

test("layout values update immediately when stringMeta changes", () => {
  const baseline = renderLayoutSnapshot(null);
  const shifted = renderLayoutSnapshot([{ index: 0, startFret: 3 }]);

  assert.equal(baseline.startFret, 0);
  assert.equal(shifted.startFret, 3);

  // start fret > 0 should move the string start and open-note position rightward.
  assert.ok(shifted.stringStartX > baseline.stringStartX);
  assert.ok(shifted.openX > baseline.openX);
});

test("useFretboardLayout derives metaByIndex during render via useMemo", () => {
  const hookPath = path.resolve("src/hooks/useFretboardLayout.js");
  const source = fs.readFileSync(hookPath, "utf8");

  assert.match(
    source,
    /const metaByIndex = useMemo\(\(\) => toStringMetaMap\(stringMeta\), \[stringMeta\]\);/,
  );
  assert.doesNotMatch(source, /useEffect\(/);
  assert.doesNotMatch(source, /useState\(/);
});
