import * as React from "react";
import { cn } from "@/lib/utils";

type LinkButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
type LinkButtonSize = "sm" | "md" | "lg";

interface LinkButtonProps extends React.ComponentPropsWithRef<"a"> {
  variant?: LinkButtonVariant;
  size?: LinkButtonSize;
}

const variantStyles: Record<LinkButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
  ghost:
    "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
};

const sizeStyles: Record<LinkButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-12 px-8 text-base rounded-xl",
};

const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap font-semibold",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);
LinkButton.displayName = "LinkButton";

export { LinkButton };
export type { LinkButtonProps };
