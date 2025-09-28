import { useMemo } from "react";
import { slug } from "@/lib/export/scales";

export function useFileBase({ root, scale, accidental, strings }) {
  return useMemo(
    () => slug(root, scale, accidental, `${strings}str`),
    [root, scale, accidental, strings],
  );
}
