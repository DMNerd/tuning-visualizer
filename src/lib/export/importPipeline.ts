export const IMPORT_PIPELINE_ERROR_CODES = {
  NO_FILE: "no_file",
  FILE_READ_FAILED: "file_read_failed",
  INVALID_JSON: "invalid_json",
  IMPORT_FAILED: "import_failed",
} as const;

export type ImportPipelineErrorCode =
  (typeof IMPORT_PIPELINE_ERROR_CODES)[keyof typeof IMPORT_PIPELINE_ERROR_CODES];

export type ImportPipelineError = {
  code: ImportPipelineErrorCode;
  message: string;
  fileName?: string;
  cause?: unknown;
};

export type ImportPipelineSuccess = {
  ok: true;
  fileName: string;
  packs: unknown[];
  importedCount: number;
};

export type ImportPipelineFailure = {
  ok: false;
  error: ImportPipelineError;
};

export type ImportPipelineResult =
  | ImportPipelineSuccess
  | ImportPipelineFailure;

type ImportPipelineArgs = {
  file?: File | null;
  importFromJson?: (
    json: unknown[],
    filenames?: string[],
  ) => Promise<unknown> | void;
};

export function getImportPipelineErrorMessage(
  error: ImportPipelineError,
): string {
  switch (error.code) {
    case IMPORT_PIPELINE_ERROR_CODES.NO_FILE:
      return "No file selected.";
    case IMPORT_PIPELINE_ERROR_CODES.FILE_READ_FAILED:
      return `Could not read ${error.fileName || "the selected file"}.`;
    case IMPORT_PIPELINE_ERROR_CODES.INVALID_JSON:
      return `${error.fileName || "Selected file"} is not valid JSON.`;
    case IMPORT_PIPELINE_ERROR_CODES.IMPORT_FAILED:
      return error.message || "Import failed.";
    default:
      return "Import failed.";
  }
}

export async function runImportFilePipeline({
  file,
  importFromJson,
}: ImportPipelineArgs): Promise<ImportPipelineResult> {
  if (!file) {
    return {
      ok: false,
      error: {
        code: IMPORT_PIPELINE_ERROR_CODES.NO_FILE,
        message: "No file selected.",
      },
    };
  }

  let text = "";
  try {
    text = await file.text();
  } catch (cause) {
    return {
      ok: false,
      error: {
        code: IMPORT_PIPELINE_ERROR_CODES.FILE_READ_FAILED,
        message: "Unable to read selected file.",
        fileName: file.name,
        cause,
      },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (cause) {
    return {
      ok: false,
      error: {
        code: IMPORT_PIPELINE_ERROR_CODES.INVALID_JSON,
        message: "Selected file is not valid JSON.",
        fileName: file.name,
        cause,
      },
    };
  }

  const packs = Array.isArray(parsed) ? parsed : [parsed];

  try {
    await importFromJson?.(packs, [file.name]);
  } catch (cause) {
    return {
      ok: false,
      error: {
        code: IMPORT_PIPELINE_ERROR_CODES.IMPORT_FAILED,
        message:
          cause instanceof Error
            ? cause.message
            : "Imported data could not be normalized.",
        fileName: file.name,
        cause,
      },
    };
  }

  return {
    ok: true,
    fileName: file.name,
    packs,
    importedCount: packs.length,
  };
}
