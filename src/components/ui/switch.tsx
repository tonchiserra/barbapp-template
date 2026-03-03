"use client";

import * as React from "react";
import { Switch as RadixSwitch } from "radix-ui";
import { cn } from "@/lib/utils";

interface SwitchProps
  extends React.ComponentPropsWithRef<typeof RadixSwitch.Root> {
  label?: string;
}

const Switch = React.forwardRef<
  React.ComponentRef<typeof RadixSwitch.Root>,
  SwitchProps
>(({ className, label, id, ...props }, ref) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  const switchElement = (
    <RadixSwitch.Root
      ref={ref}
      id={switchId}
      className={cn(
        "peer inline-flex h-8 w-[52px] shrink-0 items-center rounded-full border-2 border-transparent",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-40",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb
        className={cn(
          "pointer-events-none block h-7 w-7 rounded-full bg-white shadow-md ring-0",
          "transition-transform duration-200",
          "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0",
        )}
      />
    </RadixSwitch.Root>
  );

  if (label) {
    return (
      <div className="flex items-center gap-3">
        {switchElement}
        <label
          htmlFor={switchId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      </div>
    );
  }

  return switchElement;
});
Switch.displayName = "Switch";

export { Switch };
export type { SwitchProps };
