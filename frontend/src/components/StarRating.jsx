import { useState } from "react";

/**
 * Interactive or read-only star rating (1–5).
 * mode: "input" | "display"
 */
export default function StarRating({ value = 0, onChange, mode = "display", size = "md" }) {
  const [hover, setHover] = useState(0);
  const display = mode === "input" ? hover || value : value;

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`star-rating star-rating--${size} ${mode === "input" ? "star-rating--interactive" : ""}`}>
      {stars.map(star => (
        <button
          key={star}
          type="button"
          className={`star ${star <= display ? "star--filled" : "star--empty"}`}
          disabled={mode === "display"}
          onMouseEnter={mode === "input" ? () => setHover(star) : undefined}
          onMouseLeave={mode === "input" ? () => setHover(0) : undefined}
          onClick={mode === "input" && onChange ? () => onChange(star) : undefined}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
      {mode === "display" && value > 0 ? <span className="star-rating__value">{Number(value).toFixed(1)}</span> : null}
    </div>
  );
}

export function RatingSummary({ averageRating = 0, reviewCount = 0 }) {
  return (
    <div className="rating-summary">
      <StarRating value={averageRating} mode="display" size="sm" />
      <span className="rating-summary__meta">
        {averageRating > 0 ? `${averageRating} · ` : ""}
        {reviewCount} review{reviewCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
