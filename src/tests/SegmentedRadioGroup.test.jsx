import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import SegmentedRadioGroup from "@/components/UI/SegmentedRadioGroup";

test("segmented group emits disabled styling hooks for disabled options", () => {
  const markup = renderToStaticMarkup(
    <SegmentedRadioGroup
      label="Neck filter"
      name="neck-filter"
      value="enabled"
      onChange={() => {}}
      options={[
        { value: "enabled", label: "Enabled" },
        { value: "disabled", label: "Disabled", disabled: true },
      ]}
    />,
  );

  assert.match(markup, /tv-binary-toggle__option/);
  assert.match(markup, /tv-binary-toggle__option--disabled/);
  assert.match(markup, /aria-disabled="true"/);
  assert.match(markup, /disabled=""[^>]*value="disabled"/);
});
