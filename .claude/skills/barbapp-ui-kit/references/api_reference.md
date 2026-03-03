# Barbapp UI Kit — Component API Reference

All components import from `@/components/ui`. Source: `src/components/ui/`.

---

## Heading

**File:** `heading.tsx` | **Server-safe**

```tsx
interface HeadingProps extends React.ComponentPropsWithRef<"h1"> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";  // default: "h2"
}
```

| `as` | Styles |
|------|--------|
| `h1` | `text-4xl font-bold tracking-tight lg:text-5xl` |
| `h2` | `text-3xl font-semibold tracking-tight` |
| `h3` | `text-2xl font-semibold tracking-tight` |
| `h4` | `text-xl font-semibold tracking-tight` |
| `h5` | `text-lg font-semibold` |
| `h6` | `text-base font-semibold` |

```tsx
<Heading as="h2" className="text-center">Section Title</Heading>
```

---

## Text

**File:** `text.tsx` | **Server-safe**

```tsx
interface TextProps extends React.ComponentPropsWithRef<"p"> {
  size?: "sm" | "base" | "lg";              // default: "base"
  variant?: "default" | "muted" | "destructive";  // default: "default"
  as?: "p" | "span" | "div";               // default: "p"
}
```

| `size` | Styles |
|--------|--------|
| `sm` | `text-sm leading-relaxed` |
| `base` | `text-base leading-relaxed` |
| `lg` | `text-lg leading-relaxed` |

| `variant` | Styles |
|-----------|--------|
| `default` | `text-foreground` |
| `muted` | `text-muted-foreground` |
| `destructive` | `text-destructive` |

```tsx
<Text variant="muted" size="sm">Subtitle text</Text>
<Text as="span" size="lg">Inline large text</Text>
```

---

## Button

**File:** `button.tsx` | **Server-safe** | Renders `<button>`

```tsx
interface ButtonProps extends React.ComponentPropsWithRef<"button"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";  // default: "primary"
  size?: "sm" | "md" | "lg";  // default: "md"
}
```

| `size` | Styles |
|--------|--------|
| `sm` | `h-9 px-3 text-sm rounded-lg` |
| `md` | `h-11 px-5 text-sm rounded-xl` |
| `lg` | `h-12 px-8 text-base rounded-xl` |

```tsx
<Button variant="primary" size="lg">Submit</Button>
<Button variant="outline" size="sm" onClick={handler}>Cancel</Button>
```

---

## LinkButton

**File:** `link-button.tsx` | **Server-safe** | Renders `<a>`

Same variants and sizes as Button, but renders as an anchor element. Use for CTA links.

```tsx
interface LinkButtonProps extends React.ComponentPropsWithRef<"a"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";  // default: "primary"
  size?: "sm" | "md" | "lg";  // default: "md"
}
```

```tsx
<LinkButton href="https://wa.me/..." variant="primary" size="lg">
  Reservar turno
</LinkButton>
```

---

## Link

**File:** `link.tsx` | **Server-safe** | Wraps Next.js `<Link>`

For text-style links (underline hover), not button-style. Use `LinkButton` for button-style links.

```tsx
interface LinkProps extends React.ComponentPropsWithRef<typeof NextLink> {
  variant?: "default" | "muted" | "destructive";  // default: "default"
  external?: boolean;  // default: false — adds target="_blank" rel="noopener noreferrer"
}
```

```tsx
<Link href="/about">Internal link</Link>
<Link href="https://example.com" external variant="muted">External link</Link>
```

---

## Input

**File:** `input.tsx` | **"use client"**

```tsx
interface InputProps extends React.ComponentPropsWithRef<"input"> {
  label?: string;
  error?: string;
  helperText?: string;
}
```

```tsx
<Input name="title" label="Titulo" placeholder="Ej: Mi titulo" value={val} onChange={handler} />
```

---

## Textarea

**File:** `textarea.tsx` | **"use client"**

```tsx
interface TextareaProps extends React.ComponentPropsWithRef<"textarea"> {
  label?: string;
  error?: string;
  helperText?: string;
}
```

```tsx
<Textarea name="desc" label="Descripcion" rows={3} value={val} onChange={handler} />
```

---

## Switch

**File:** `switch.tsx` | **"use client"** | Radix primitive

```tsx
interface SwitchProps extends React.ComponentPropsWithRef<typeof RadixSwitch.Root> {}
```

```tsx
<Switch checked={isVisible} onCheckedChange={setIsVisible} />
```

---

## Select (Radix)

**File:** `select.tsx` | **"use client"**

```tsx
<Select value={val} onValueChange={handler}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="opt1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

---

## Card (compound)

**File:** `card.tsx` | **Server-safe**

```tsx
<Card>
  <CardHeader>
    <Heading as="h3" className="text-base">Title</Heading>
    <Text size="sm" variant="muted">Description</Text>
  </CardHeader>
  <CardContent className="flex flex-col gap-4">
    {/* content */}
  </CardContent>
</Card>
```

---

## ImageUpload

**File:** `image-upload.tsx` | **"use client"**

```tsx
interface ImageUploadProps {
  bucket: string;           // Supabase storage bucket (e.g., "images")
  path: string;            // Storage path (e.g., `${userId}/gallery/${index}`)
  currentUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  className?: string;
}
```

```tsx
<ImageUpload
  bucket="images"
  path={`${userId}/carousel/${index}/desktop`}
  currentUrl={url || undefined}
  onUpload={(newUrl) => updateImage(index, newUrl)}
  onRemove={() => removeImage(index)}
/>
```

---

## Badge

**File:** `badge.tsx` | **Server-safe**

```tsx
interface BadgeProps extends React.ComponentPropsWithRef<"span"> {
  variant?: "default" | "secondary" | "outline" | "destructive";
  size?: "sm" | "md";
}
```

---

## Separator

**File:** `separator.tsx` | **Server-safe**

```tsx
interface SeparatorProps extends React.ComponentPropsWithRef<"div"> {
  orientation?: "horizontal" | "vertical";
}
```

---

## Dialog (Radix)

**File:** `dialog.tsx` | **"use client"**

Exports: `Dialog`, `DialogTrigger`, `DialogClose`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`

---

## Toast

**File:** `toast.tsx` | **"use client"**

```tsx
const { toast } = useToast();
toast("Message", "success");  // or "error"
```

Wrap app with `<ToastProvider>`.
