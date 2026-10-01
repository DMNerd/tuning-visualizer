import { memo } from "react";
import { useTranslation } from "react-i18next";
import { CHEATSHEET_ROWS } from "@shared/hooks/hotkeyCheatsheet";

function Separator({ children }) {
  return (
    <span className="tv-hotkeys__sep" aria-hidden="true">
      {" "}
      {children}{" "}
    </span>
  );
}

const comboKey = (parts) => parts.join("+");

// Interleaves `items` with separators, each wrapped by `renderItem`.
function joinWith(items, sep, getKey, renderItem) {
  return items.flatMap((item, i) => [
    i > 0 ? <Separator key={`sep-${getKey(item)}`}>{sep}</Separator> : null,
    renderItem(item),
  ]);
}

function renderCombo(parts) {
  return (
    <span className="tv-hotkeys__combo" key={comboKey(parts)}>
      {joinWith(
        parts,
        "+",
        (part) => part,
        (part) => (
          <kbd key={part}>{part}</kbd>
        ),
      )}
    </span>
  );
}

function renderKeys(alts) {
  return alts.map((combos, i) => (
    <span className="tv-hotkeys__alt-wrap" key={combos.map(comboKey).join("/")}>
      <span className="tv-hotkeys__alt">
        {joinWith(combos, "/", comboKey, renderCombo)}
      </span>
      {i < alts.length - 1 ? <Separator>•</Separator> : null}
    </span>
  ));
}

function HotkeysCheatsheet({ onClose }) {
  const { t } = useTranslation();

  return (
    <div className="tv-hotkeys" role="dialog" aria-label={t("hotkeys.dialog")}>
      <div className="tv-hotkeys__title">
        <span>{t("hotkeys.title")}</span>
        {onClose ? (
          <button
            type="button"
            className="tv-hotkeys__close"
            aria-label={t("common.close")}
            onClick={onClose}
          >
            ×
          </button>
        ) : null}
      </div>
      <ul className="tv-hotkeys__list">
        {CHEATSHEET_ROWS.map(({ descKey, alts }) => (
          <li className="tv-hotkeys__row" key={descKey}>
            <span className="tv-hotkeys__keys">{renderKeys(alts)}</span>
            <span className="tv-hotkeys__desc">{t(descKey)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default memo(HotkeysCheatsheet);
