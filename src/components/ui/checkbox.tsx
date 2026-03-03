"use client";

import * as React from "react";
import { Checkbox as RadixCheckbox } from "radix-ui";
import { cn } from "@/lib/utils";

interface CheckboxProps
  extends React.ComponentPropsWithRef<typeof RadixCheckbox.Root> {
  label?: string;
}

const Checkbox = React.forwardRef<
  React.ComponentRef<typeof RadixCheckbox.Root>,
  CheckboxProps
>(({ className, label, id, ...props }, ref) => {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;

  const checkbox = (
    <RadixCheckbox.Root
      ref={ref}
      id={checkboxId}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-md border border-primary",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-40",
        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator className="flex items-center justify-center text-current">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );

  if (label) {
    return (
      <div className="flex items-center gap-2.5">
        {checkbox}
        <label
          htmlFor={checkboxId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      </div>
    );
  }

  return checkbox;
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
export type { CheckboxProps };
