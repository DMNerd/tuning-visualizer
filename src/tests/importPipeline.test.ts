import test from "node:test";
import assert from "node:assert/strict";

import {
  getImportPipelineErrorMessage,
  IMPORT_PIPELINE_ERROR_CODES,
  IMPORT_PIPELINE_MAX_FILE_SIZE_BYTES,
  runImportFilePipeline,
} from "@/lib/export/importPipeline";

void test("runImportFilePipeline rejects files with unsupported metadata", async () => {
  const file = new File(["{}"], "tunings.txt", { type: "text/plain" });

  const result = await runImportFilePipeline({ file });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(
    result.error.code,
    IMPORT_PIPELINE_ERROR_CODES.INVALID_FILE_TYPE,
  );
  assert.equal(result.error.fileName, "tunings.txt");
});

void test("runImportFilePipeline accepts json extension even with empty mime type", async () => {
  const file = new File([JSON.stringify({ name: "My Pack" })], "my-pack.JSON", {
    type: "",
  });

  const result = await runImportFilePipeline({ file });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.fileName, "my-pack.JSON");
  assert.equal(result.importedCount, 1);
});

void test("runImportFilePipeline accepts JSON mime type even without extension", async () => {
  const file = new File([JSON.stringify([{ name: "P1" }])], "imported-data", {
    type: "application/json",
  });

  const result = await runImportFilePipeline({ file });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.importedCount, 1);
});

void test("runImportFilePipeline rejects oversized files before parsing", async () => {
  const oversizedPayload = "a".repeat(IMPORT_PIPELINE_MAX_FILE_SIZE_BYTES + 1);
  const file = new File([oversizedPayload], "big.json", {
    type: "application/json",
  });

  const result = await runImportFilePipeline({
    file,
    importFromJson: () => {
      throw new Error("should not execute");
    },
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, IMPORT_PIPELINE_ERROR_CODES.FILE_TOO_LARGE);
  assert.equal(result.error.fileName, "big.json");
});

void test("getImportPipelineErrorMessage maps new metadata errors", () => {
  const invalidTypeMessage = getImportPipelineErrorMessage({
    code: IMPORT_PIPELINE_ERROR_CODES.INVALID_FILE_TYPE,
    message: "Only JSON files are supported.",
  });

  const tooLargeMessage = getImportPipelineErrorMessage({
    code: IMPORT_PIPELINE_ERROR_CODES.FILE_TOO_LARGE,
    message: "Selected file exceeds limit.",
  });

  assert.equal(invalidTypeMessage, "Only JSON files are supported (.json).");
  assert.match(tooLargeMessage, /Maximum allowed size is 5 MB\./);
});
