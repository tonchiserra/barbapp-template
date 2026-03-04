import type { ThemeSettings } from "@/types";
import { hexToHsl, luminance } from "./utils";

export function generateThemeCss(theme: ThemeSettings): string {
  const bg = hexToHsl(theme.background);
  const fg = hexToHsl(theme.foreground);
  const primary = hexToHsl(theme.primary);
  const secondary = hexToHsl(theme.secondary);

  const primaryFg = luminance(theme.primary) > 0.5 ? "0 0% 0%" : "0 0% 100%";
  const secondaryFg = luminance(theme.secondary) > 0.5 ? "0 0% 9%" : "0 0% 100%";

  // Parse background HSL to derive muted/border colors
  const bgParts = bg.split(" ");
  const bgH = bgParts[0];
  const bgS = parseInt(bgParts[1]);
  const bgL = parseInt(bgParts[2]);
  const isLightBg = bgL > 50;

  const mutedL = isLightBg ? Math.max(bgL - 4, 0) : Math.min(bgL + 8, 100);
  const muted = `${bgH} ${Math.min(bgS + 5, 100)}% ${mutedL}%`;

  const fgParts = fg.split(" ");
  const fgL = parseInt(fgParts[2]);
  const mutedFgL = Math.round((fgL + bgL) / 2 + (isLightBg ? 5 : -5));
  const mutedFg = `${fgParts[0]} ${parseInt(fgParts[1])}% ${Math.min(Math.max(mutedFgL, 0), 100)}%`;

  const borderL = isLightBg ? Math.max(bgL - 8, 0) : Math.min(bgL + 12, 100);
  const border = `${bgH} ${bgS}% ${borderL}%`;

  return `:root {
  --background: ${bg};
  --foreground: ${fg};
  --primary: ${primary};
  --primary-foreground: ${primaryFg};
  --secondary: ${secondary};
  --secondary-foreground: ${secondaryFg};
  --muted: ${muted};
  --muted-foreground: ${mutedFg};
  --accent: ${muted};
  --accent-foreground: ${secondaryFg};
  --border: ${border};
  --input: ${border};
  --ring: ${primary};
}`;
}
