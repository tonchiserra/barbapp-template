"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Button,
  Input,
  Switch,
  Card,
  CardHeader,
  CardContent,
  Heading,
  Text,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  ImageUpload,
  useToast,
} from "@/components/ui";
import { saveCarouselSettings, type SaveCarouselState } from "../actions";
import type { CarouselSettings, CarouselSlide, ButtonVariant, HAlign, VAlign } from "@/types";
import { DEFAULT_CAROUSEL_SLIDE } from "@/types";
import { CTA_VARIANTS } from "../constants";

interface CarouselSettingsProps {
  userId: string;
  initialSettings: CarouselSettings;
}

const H_ALIGNS: { value: HAlign; label: string }[] = [
  { value: "left", label: "Izquierda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Derecha" },
];

const V_ALIGNS: { value: VAlign; label: string }[] = [
  { value: "top", label: "Arriba" },
  { value: "center", label: "Centro" },
  { value: "bottom", label: "Abajo" },
];

export function CarouselSettingsForm({ userId, initialSettings }: CarouselSettingsProps) {
  const { toast } = useToast();

  const [, formAction, pending] = useActionState(
    async (prev: SaveCarouselState | null, formData: FormData) => {
      const result = await saveCarouselSettings(prev, formData);
      if (result.success) {
        toast("Configuracion guardada exitosamente", "success");
      } else if (result.error) {
        toast(result.error, "error");
      }
      return result;
    },
    null,
  );

  const [isVisible, setIsVisible] = React.useState(initialSettings.is_visible);
  const [autoSlide, setAutoSlide] = React.useState(initialSettings.auto_slide);
  const [slides, setSlides] = React.useState<CarouselSlide[]>(
    initialSettings.slides.length > 0 ? initialSettings.slides : [],
  );

  const addSlide = () => {
    if (slides.length < 3) {
      setSlides([...slides, { ...DEFAULT_CAROUSEL_SLIDE }]);
    }
  };

  const removeSlide = (index: number) => {
    setSlides(slides.filter((_, i) => i !== index));
  };

  const updateSlide = (index: number, field: keyof CarouselSlide, value: string) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], [field]: value };
    setSlides(updated);
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Visibilidad */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h3" className="text-base">
                Visibilidad
              </Heading>
              <Text size="sm" variant="muted">
                Mostrar u ocultar el carrusel en tu pagina
              </Text>
            </div>
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>
          {isVisible && <input type="hidden" name="is_visible" value="on" />}
        </CardHeader>
      </Card>

      {/* Auto-slide */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h3" className="text-base">
                Auto-slide
              </Heading>
              <Text size="sm" variant="muted">
                Cambiar de slide automaticamente cada 5 segundos
              </Text>
            </div>
            <Switch checked={autoSlide} onCheckedChange={setAutoSlide} />
          </div>
          {autoSlide && <input type="hidden" name="auto_slide" value="on" />}
        </CardHeader>
      </Card>

      {/* Slides header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading as="h3" className="text-base">
            Slides
          </Heading>
          <Text size="sm" variant="muted">
            Agrega hasta 3 slides ({slides.length}/3)
          </Text>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSlide}
          disabled={slides.length >= 3}
        >
          Agregar slide
        </Button>
      </div>

      {slides.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <Text size="sm" variant="muted" className="text-center">
              No hay slides. Presiona &quot;Agregar slide&quot; para crear uno.
            </Text>
          </CardContent>
        </Card>
      )}

      {/* Slide blocks */}
      {slides.map((slide, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Heading as="h4" className="text-sm">
                Slide {index + 1}
              </Heading>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSlide(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Hidden inputs for form submission */}
            <input type="hidden" name={`slides[${index}].image_desktop`} value={slide.image_desktop} />
            <input type="hidden" name={`slides[${index}].image_mobile`} value={slide.image_mobile} />
            <input type="hidden" name={`slides[${index}].title`} value={slide.title} />
            <input type="hidden" name={`slides[${index}].subtitle`} value={slide.subtitle} />
            <input type="hidden" name={`slides[${index}].cta_label`} value={slide.cta_label} />
            <input type="hidden" name={`slides[${index}].cta_url`} value={slide.cta_url} />
            <input type="hidden" name={`slides[${index}].cta_variant`} value={slide.cta_variant} />
            <input type="hidden" name={`slides[${index}].text_color`} value={slide.text_color} />
            <input type="hidden" name={`slides[${index}].align_h`} value={slide.align_h} />
            <input type="hidden" name={`slides[${index}].align_v`} value={slide.align_v} />

            {/* Images */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Imagen desktop *
                </label>
                <ImageUpload
                  bucket="images"
                  path={`${userId}/carousel/${index}/desktop`}
                  currentUrl={slide.image_desktop || undefined}
                  onUpload={(url) => updateSlide(index, "image_desktop", url)}
                  onRemove={() => updateSlide(index, "image_desktop", "")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Imagen mobile
                </label>
                <ImageUpload
                  bucket="images"
                  path={`${userId}/carousel/${index}/mobile`}
                  currentUrl={slide.image_mobile || undefined}
                  onUpload={(url) => updateSlide(index, "image_mobile", url)}
                  onRemove={() => updateSlide(index, "image_mobile", "")}
                />
              </div>
            </div>

            {/* Title & Subtitle */}
            <Input
              label="Titulo"
              placeholder="Titulo del slide"
              value={slide.title}
              onChange={(e) => updateSlide(index, "title", e.target.value)}
            />
            <Input
              label="Subtitulo"
              placeholder="Subtitulo del slide"
              value={slide.subtitle}
              onChange={(e) => updateSlide(index, "subtitle", e.target.value)}
            />

            {/* CTA */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Texto del boton"
                placeholder="Ej: Reservar turno"
                value={slide.cta_label}
                onChange={(e) => updateSlide(index, "cta_label", e.target.value)}
              />
              <Input
                label="URL del boton"
                placeholder="Ej: #reservar"
                value={slide.cta_url}
                onChange={(e) => updateSlide(index, "cta_url", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Estilo del boton
              </label>
              <Select
                value={slide.cta_variant}
                onValueChange={(val: string) => updateSlide(index, "cta_variant", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CTA_VARIANTS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Text color */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Color del texto
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={slide.text_color}
                  onChange={(e) => updateSlide(index, "text_color", e.target.value)}
                  className="h-10 w-10 shrink-0 rounded-lg border border-input bg-background"
                />
                <Input
                  value={slide.text_color}
                  onChange={(e) => updateSlide(index, "text_color", e.target.value)}
                  placeholder="#ffffff"
                  className="font-mono"
                />
              </div>
            </div>

            {/* Alignment */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Alineacion horizontal
                </label>
                <Select
                  value={slide.align_h}
                  onValueChange={(val: string) => updateSlide(index, "align_h", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {H_ALIGNS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">
                  Alineacion vertical
                </label>
                <Select
                  value={slide.align_v}
                  onValueChange={(val: string) => updateSlide(index, "align_v", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {V_ALIGNS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
