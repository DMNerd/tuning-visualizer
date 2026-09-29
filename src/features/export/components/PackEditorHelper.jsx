import { Trans, useTranslation } from "react-i18next";
import { STR_MAX, STR_MIN } from "@shared/config/appDefaults";
import { SPELLING_MARKER_DISPLAY } from "@domain/theory/notation";

const EXAMPLE_SNIPPET = JSON.stringify(
  {
    name: "Custom tuning example",
    spelling: "german",
    system: { edo: 12 },
    tuning: {
      strings: [
        { label: "String 1", note: "E" },
        { label: "String 2", note: "Hih" },
        { label: "String 3", midi: 55 },
        { label: "String 4", note: "Aeh" },
      ],
    },
    meta: {
      stringMeta: [{ index: 0, startFret: 2, greyBefore: true }],
      board: { fretStyle: "dotted", notePlacement: "onFret" },
    },
  },
  null,
  2,
);

// Tags translators may use in the rich-text helper strings
const RICH = { strong: <strong />, code: <code /> };

// Collapsible side panel listing pack rules, shortcut actions and an example.
export default function PackEditorHelper({
  isCollapsed,
  onToggle,
  icons,
  hasSpellingHint,
  onInsertString,
  onResetTemplate,
  onToggleSpellingHint,
}) {
  const { t } = useTranslation();
  const markers = (
    <>
      {SPELLING_MARKER_DISPLAY.map((marker, idx) => (
        <span key={marker}>
          {idx > 0 ? ", " : ""}
          <code>"{marker}"</code>
        </span>
      ))}
    </>
  );

  return (
    <>
      <div className="tv-pack-helper__toggle-row">
        <button
          type="button"
          className="tv-pack-helper__toggle"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-controls="pack-helper-content"
          aria-label={
            isCollapsed
              ? t("editor.helperShowAria")
              : t("editor.helperHideAria")
          }
        >
          <span
            className={`tv-pack-helper__chevron${
              isCollapsed ? " is-rotated" : ""
            }`}
            aria-hidden
          >
            {icons.chevron}
          </span>
          <span className="tv-pack-helper__toggle-label">
            {isCollapsed ? t("editor.helperShow") : t("editor.helperHide")}
          </span>
        </button>
      </div>
      <aside
        id="pack-helper-content"
        className={`tv-pack-helper${isCollapsed ? " is-hidden" : ""}`}
        tabIndex={isCollapsed ? -1 : 0}
        aria-label={t("editor.helperAria")}
        aria-expanded={!isCollapsed}
        aria-hidden={isCollapsed}
      >
        <div className="tv-pack-helper__header">
          <div className="tv-pack-helper__header-text">
            <h3>{t("editor.requirements")}</h3>
            <p>{t("editor.requirementsIntro")}</p>
          </div>
        </div>
        <div className="tv-pack-helper__content">
          <ul className="tv-pack-helper__list">
            <li>
              <Trans i18nKey="editor.ruleName" components={RICH} />
            </li>
            <li>
              <Trans i18nKey="editor.ruleEdo" components={RICH} />
            </li>
            <li>
              <Trans
                i18nKey="editor.ruleStrings"
                values={{ min: STR_MIN, max: STR_MAX }}
                components={RICH}
              />
            </li>
            <li>
              <Trans i18nKey="editor.ruleEachString" components={RICH} />
            </li>
            <li>
              <Trans
                i18nKey="editor.ruleSpelling"
                components={{ ...RICH, markers }}
              />
            </li>
          </ul>
          <div className="tv-pack-helper__meta">
            <div className="tv-pack-helper__meta-section">
              <div className="tv-pack-helper__meta-title">
                {t("editor.stringMetaTitle")}
              </div>
              <p className="tv-pack-helper__meta-copy">
                <Trans i18nKey="editor.stringMetaIntro" components={RICH} />
              </p>
              <ul className="tv-pack-helper__meta-list">
                <li>
                  <Trans i18nKey="editor.stringMetaIndex" components={RICH} />
                </li>
                <li>
                  <Trans
                    i18nKey="editor.stringMetaStartFret"
                    components={RICH}
                  />
                </li>
                <li>
                  <Trans
                    i18nKey="editor.stringMetaGreyBefore"
                    components={RICH}
                  />
                </li>
              </ul>
            </div>
            <div className="tv-pack-helper__meta-section">
              <div className="tv-pack-helper__meta-title">
                {t("editor.boardMetaTitle")}
              </div>
              <p className="tv-pack-helper__meta-copy">
                <Trans i18nKey="editor.boardMetaIntro" components={RICH} />
              </p>
              <ul className="tv-pack-helper__meta-list">
                <li>
                  <Trans i18nKey="editor.boardFretStyle" components={RICH} />
                </li>
                <li>
                  <Trans
                    i18nKey="editor.boardNotePlacement"
                    components={RICH}
                  />
                </li>
                <li>
                  <Trans i18nKey="editor.boardHiddenFrets" components={RICH} />
                </li>
                <li>{t("editor.boardNoPatterns")}</li>
              </ul>
            </div>
          </div>
          <div
            className="tv-pack-helper__actions"
            role="group"
            aria-label={t("editor.shortcuts")}
          >
            <button
              type="button"
              className="tv-button tv-button--ghost"
              onClick={onInsertString}
            >
              {icons.add} {t("editor.addString")}
            </button>
            <button
              type="button"
              className="tv-button tv-button--ghost"
              onClick={onResetTemplate}
            >
              {icons.reset} {t("editor.reloadTemplate")}
            </button>
            <button
              type="button"
              className="tv-button tv-button--ghost"
              onClick={onToggleSpellingHint}
            >
              {hasSpellingHint ? icons.cancel : icons.ok}{" "}
              {hasSpellingHint
                ? t("editor.removeSpelling")
                : t("editor.setSpelling", { spelling: "de-h/b" })}
            </button>
          </div>
          <div className="tv-pack-helper__example">
            <div className="tv-pack-helper__example-header">
              {t("editor.example")}
            </div>
            <pre>
              <code>{EXAMPLE_SNIPPET}</code>
            </pre>
          </div>
        </div>
      </aside>
    </>
  );
}
