import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  count?: number;
  className?: string;
}

export function StarRating({ value, onChange, size = "md", showValue, count, className }: StarRatingProps) {
  const sizes = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-6 w-6" };
  const interactive = !!onChange;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(s)}
            className={cn(interactive && "cursor-pointer hover:scale-110 transition-transform", !interactive && "cursor-default")}
            aria-label={`${s} stars`}
          >
            <Star
              className={cn(sizes[size], s <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40")}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-muted-foreground">
          {value > 0 ? value.toFixed(1) : "—"}
          {typeof count === "number" && ` (${count})`}
        </span>
      )}
    </div>
  );
}
