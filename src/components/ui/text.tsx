import * as React from "react";
import { cn } from "@/lib/utils";

type TextSize = "sm" | "base" | "lg";
type TextVariant = "default" | "muted" | "destructive";

interface TextProps extends React.ComponentPropsWithRef<"p"> {
  size?: TextSize;
  variant?: TextVariant;
  as?: "p" | "span" | "div";
}

const sizeStyles: Record<TextSize, string> = {
  sm: "text-sm leading-relaxed",
  base: "text-base leading-relaxed",
  lg: "text-lg leading-relaxed",
};

const variantStyles: Record<TextVariant, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  destructive: "text-destructive",
};

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  (
    { as: Tag = "p", size = "base", variant = "default", className, ...props },
    ref,
  ) => {
    return (
      <Tag
        ref={ref as React.Ref<HTMLParagraphElement>}
        className={cn(sizeStyles[size], variantStyles[variant], className)}
        {...props}
      />
    );
  },
);
Text.displayName = "Text";

export { Text };
export type { TextProps };
