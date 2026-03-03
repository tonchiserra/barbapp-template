import * as React from "react";
import { cn } from "@/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps extends React.ComponentPropsWithRef<"h1"> {
  as?: HeadingLevel;
}

const levelStyles: Record<HeadingLevel, string> = {
  h1: "text-4xl font-bold tracking-tight lg:text-5xl",
  h2: "text-3xl font-semibold tracking-tight",
  h3: "text-2xl font-semibold tracking-tight",
  h4: "text-xl font-semibold tracking-tight",
  h5: "text-lg font-semibold",
  h6: "text-base font-semibold",
};

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ as: Tag = "h2", className, ...props }, ref) => {
    return (
      <Tag
        ref={ref as React.Ref<HTMLHeadingElement>}
        className={cn("text-foreground", levelStyles[Tag], className)}
        {...props}
      />
    );
  },
);
Heading.displayName = "Heading";

export { Heading };
export type { HeadingProps };
