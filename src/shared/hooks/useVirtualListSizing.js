import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createTextFit } from "@shared/lib/textFit";

const DEFAULT_OPTION_HEIGHT = 40;
const MEASUREMENT_DELTA_PX = 2;
const WIDTH_BUCKET_SIZE = 8;
const OPTION_FONT_FAMILY =
  'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const OPTION_FONT_SIZE = 13;

// Tracks a floating list's viewport size (rAF-batched, ignoring sub-2px
// jitter) and estimates wrapped row heights for virtualization, cached per
// option key and width bucket.
export default function useVirtualListSizing({
  options,
  getOptionKey,
  getOptionLabel,
}) {
  const [listViewportHeight, setListViewportHeight] = useState(0);
  const [listViewportWidth, setListViewportWidth] = useState(0);
  const measurementFrameRef = useRef(null);
  const pendingMeasurementRef = useRef(null);
  const latestViewportRef = useRef({ width: 0, height: 0 });
  const widthBucketRef = useRef(0);
  const rowHeightCacheRef = useRef(new Map());
  const textFit = useMemo(
    () => createTextFit({ fontFamily: OPTION_FONT_FAMILY }),
    [],
  );

  const listContentWidth = Math.max(60, listViewportWidth - 20);
  const viewportWidthBucket = Math.max(
    WIDTH_BUCKET_SIZE,
    Math.round(listContentWidth / WIDTH_BUCKET_SIZE) * WIDTH_BUCKET_SIZE,
  );

  const applyMeasurement = useCallback((nextWidth, nextHeight) => {
    const previous = latestViewportRef.current;
    const hasWidthDelta =
      Math.abs(previous.width - nextWidth) >= MEASUREMENT_DELTA_PX;
    const hasHeightDelta =
      Math.abs(previous.height - nextHeight) >= MEASUREMENT_DELTA_PX;

    if (!hasWidthDelta && !hasHeightDelta) {
      return;
    }

    const nextViewport = {
      width: hasWidthDelta ? nextWidth : previous.width,
      height: hasHeightDelta ? nextHeight : previous.height,
    };

    latestViewportRef.current = nextViewport;

    if (hasWidthDelta) {
      setListViewportWidth(nextViewport.width);
    }
    if (hasHeightDelta) {
      setListViewportHeight(nextViewport.height);
    }
  }, []);

  const handleListMeasure = useCallback(
    ({ width, height }) => {
      pendingMeasurementRef.current = {
        width: width ?? 0,
        height: height ?? 0,
      };

      if (measurementFrameRef.current != null) {
        return;
      }

      measurementFrameRef.current = window.requestAnimationFrame(() => {
        measurementFrameRef.current = null;
        const measurement = pendingMeasurementRef.current;
        pendingMeasurementRef.current = null;

        if (!measurement) return;

        applyMeasurement(measurement.width, measurement.height);
      });
    },
    [applyMeasurement],
  );

  useEffect(
    () => () => {
      if (measurementFrameRef.current != null) {
        window.cancelAnimationFrame(measurementFrameRef.current);
      }
    },
    [],
  );

  const estimateOptionHeight = useCallback(
    (index) => {
      const option = options[index];
      if (!option) return DEFAULT_OPTION_HEIGHT;

      const optionKey = getOptionKey(option);
      const label = getOptionLabel(option);
      if (!label) return DEFAULT_OPTION_HEIGHT;

      const cacheKey = `${optionKey}|${viewportWidthBucket}|${OPTION_FONT_SIZE}|${OPTION_FONT_FAMILY}`;
      const cached = rowHeightCacheRef.current.get(cacheKey);
      if (cached != null) return cached;

      const lineCount = textFit.estimateWrappedLines(label, listContentWidth, {
        lineHeight: 17,
        fontWeight: 500,
        fontSize: OPTION_FONT_SIZE,
        widthBucket: WIDTH_BUCKET_SIZE,
      });
      const estimatedHeight = Math.max(
        DEFAULT_OPTION_HEIGHT,
        16 + lineCount * 17,
      );
      rowHeightCacheRef.current.set(cacheKey, estimatedHeight);
      return estimatedHeight;
    },
    [
      options,
      getOptionKey,
      getOptionLabel,
      listContentWidth,
      viewportWidthBucket,
      textFit,
    ],
  );

  useEffect(() => {
    rowHeightCacheRef.current.clear();
  }, [options]);

  useEffect(() => {
    if (widthBucketRef.current === viewportWidthBucket) return;
    widthBucketRef.current = viewportWidthBucket;
    rowHeightCacheRef.current.clear();
  }, [viewportWidthBucket]);

  return {
    listViewportWidth,
    listViewportHeight,
    handleListMeasure,
    estimateOptionHeight,
  };
}
