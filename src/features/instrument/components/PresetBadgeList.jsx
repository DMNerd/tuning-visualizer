import clsx from "clsx";

export default function PresetBadgeList({ badges, className }) {
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
          {badge.label}
        </span>
      ))}
    </span>
  );
}
