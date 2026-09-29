import clsx from "clsx";
import { useTranslation } from "react-i18next";

export default function PresetBadgeList({ badges, className }) {
  const { t } = useTranslation();
  if (!badges?.length) return null;
  return (
    <span className={clsx("tv-preset-picker__option-meta", className)}>
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={clsx("tv-preset-picker__meta-badge", {
            "tv-preset-picker__meta-badge--accent": badge.variant === "accent",
          })}
        >
          {t(badge.labelKey)}
        </span>
      ))}
    </span>
  );
}
