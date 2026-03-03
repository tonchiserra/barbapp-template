import * as React from "react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

type LinkVariant = "default" | "muted" | "destructive";

interface LinkProps extends React.ComponentPropsWithRef<typeof NextLink> {
  variant?: LinkVariant;
  external?: boolean;
}

const variantStyles: Record<LinkVariant, string> = {
  default: "text-primary underline-offset-4 hover:underline",
  muted: "text-muted-foreground underline-offset-4 hover:underline hover:text-foreground",
  destructive: "text-destructive underline-offset-4 hover:underline",
};

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ variant = "default", external = false, className, ...props }, ref) => {
    const externalProps = external
      ? { target: "_blank" as const, rel: "noopener noreferrer" }
      : {};

    return (
      <NextLink
        ref={ref}
        className={cn(
          "font-medium transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          variantStyles[variant],
          className,
        )}
        {...externalProps}
        {...props}
      />
    );
  },
);
Link.displayName = "Link";

export { Link };
export type { LinkProps };
