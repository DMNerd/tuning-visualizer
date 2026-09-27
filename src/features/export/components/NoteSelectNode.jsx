import { useId, useMemo } from "react";
import { pushUnique } from "@features/export/model/tuningPackNormalization";

// json-edit-react custom node: renders tuning note strings as a <select>
// of the pack's note options while editing.
export default function NoteSelectNode({
  value,
  setValue,
  handleEdit,
  handleKeyPress,
  isEditing,
  canEdit,
  originalNode,
  customNodeProps,
  getStyles,
  nodeData,
}) {
  const { noteOptions = [], systemLabel } = customNodeProps ?? {};
  const selectId = useId();
  const stringStyles = getStyles("string", nodeData);
  const currentValue = typeof value === "string" ? value : "";

  const options = useMemo(() => {
    const seen = new Set();
    const list = [];
    noteOptions.forEach((option) => pushUnique(list, seen, option));
    if (currentValue && !seen.has(currentValue)) {
      list.push(currentValue);
    }
    return list;
  }, [noteOptions, currentValue]);

  if (!canEdit || !isEditing) {
    return (
      originalNode ?? <span style={stringStyles}>{currentValue || ""}</span>
    );
  }

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setValue(nextValue);
    handleEdit(nextValue);
  };

  return (
    <div className="tv-json-editor__note-editor">
      <select
        id={selectId}
        className="tv-json-editor__note-select"
        value={currentValue || ""}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        autoFocus
      >
        <option value="" disabled>
          Select note…
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {systemLabel ? (
        <span className="tv-json-editor__note-hint">{systemLabel}</span>
      ) : null}
    </div>
  );
}
