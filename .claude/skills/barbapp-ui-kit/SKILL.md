---
name: barbapp-ui-kit
description: "Barbapp UI Kit component system. ALWAYS use these components when writing JSX/TSX code in the barbapp project instead of raw HTML elements. Triggers: any React/TSX component creation, section building, page layout, UI generation, form building, or code editing within the barbapp project. Applies to ALL files under src/components/ and src/app/."
---

# Barbapp UI Kit

Always import from `@/components/ui`. Never use raw HTML when a UI Kit component exists.

## Component Mapping (mandatory substitutions)

| Instead of | Use |
|------------|-----|
| `<h1>` through `<h6>` | `<Heading as="h1">` through `<Heading as="h6">` |
| `<p>` with text styling | `<Text>` with `variant` and `size` props |
| `<p className="text-muted-foreground">` | `<Text variant="muted">` |
| `<p className="text-sm">` | `<Text size="sm">` |
| `<button>` | `<Button>` with `variant` and `size` props |
| `<a>` styled as button (CTA) | `<LinkButton>` with `variant` and `size` props |
| `<a>` styled as text link | `<Link>` with `variant` prop |
| `<input>` | `<Input>` with `label`, `error`, `helperText` props |
| `<textarea>` | `<Textarea>` with `label`, `error`, `helperText` props |
| Manual card `<div>` | `<Card>` + `<CardHeader>` + `<CardContent>` |

## Quick reference

```tsx
// Headings — renders semantic h1-h6 with consistent styles
<Heading as="h2" className="text-center">Title</Heading>

// Text — renders <p>, <span>, or <div> with variant/size
<Text variant="muted" size="lg" className="text-center">Description</Text>
<Text size="sm" variant="muted">Subtitle</Text>

// Button — renders <button>
<Button variant="primary" size="lg" onClick={handler}>Action</Button>

// LinkButton — renders <a> with button styles (for CTAs and external links)
<LinkButton href="/path" variant="primary" size="lg">CTA Label</LinkButton>

// Link — renders Next.js Link with text-link styles
<Link href="/about" variant="muted">Go to about</Link>
<Link href="https://ext.com" external>External</Link>
```

## CTA pattern

Never duplicate button variant styles manually. Use `LinkButton`:

```tsx
// WRONG — duplicating styles
const CTA_STYLES: Record<ButtonVariant, string> = { ... };
<a href={url} className={cn("...", CTA_STYLES[variant])}>{label}</a>

// CORRECT
<LinkButton href={url} variant={variant} size="lg">{label}</LinkButton>
```

## Admin form pattern

```tsx
import { Button, Input, Textarea, Switch, Card, CardHeader, CardContent,
  Heading, Text, Select, SelectTrigger, SelectValue, SelectContent,
  SelectItem, ImageUpload, useToast } from "@/components/ui";
```

## Full API reference

For complete prop interfaces, variants, and sizes: see [references/api_reference.md](references/api_reference.md).
