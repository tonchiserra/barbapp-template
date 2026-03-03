"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  Button,
  Input,
  Textarea,
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
import { saveGallerySettings, type SaveGalleryState } from "../actions";
import type { GallerySettings, ButtonVariant } from "@/types";

const MAX_IMAGES = 9;

const CTA_VARIANTS: { value: ButtonVariant; label: string }[] = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "destructive", label: "Destructive" },
];

interface GallerySettingsProps {
  userId: string;
  initialSettings: GallerySettings;
}

export function GallerySettingsForm({ userId, initialSettings }: GallerySettingsProps) {
  const { toast } = useToast();

  const [, formAction, pending] = useActionState(
    async (prev: SaveGalleryState | null, formData: FormData) => {
      const result = await saveGallerySettings(prev, formData);
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
  const [title, setTitle] = React.useState(initialSettings.title);
  const [description, setDescription] = React.useState(initialSettings.description);
  const [images, setImages] = React.useState<string[]>(initialSettings.images);
  const [ctaLabel, setCtaLabel] = React.useState(initialSettings.cta_label);
  const [ctaUrl, setCtaUrl] = React.useState(initialSettings.cta_url);
  const [ctaVariant, setCtaVariant] = React.useState<ButtonVariant>(initialSettings.cta_variant);

  const addImage = () => {
    if (images.length < MAX_IMAGES) {
      setImages([...images, ""]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, url: string) => {
    const updated = [...images];
    updated[index] = url;
    setImages(updated);
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Hidden inputs for images */}
      {images.map((url, index) => (
        <input key={index} type="hidden" name={`images[${index}]`} value={url} />
      ))}
      <input type="hidden" name="cta_variant" value={ctaVariant} />

      {/* Visibilidad */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h3" className="text-base">
                Visibilidad
              </Heading>
              <Text size="sm" variant="muted">
                Mostrar u ocultar la galeria en tu pagina
              </Text>
            </div>
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>
          {isVisible && <input type="hidden" name="is_visible" value="on" />}
        </CardHeader>
      </Card>

      {/* Contenido */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">
            Contenido
          </Heading>
          <Text size="sm" variant="muted">
            Titulo y descripcion de la galeria
          </Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            name="title"
            label="Titulo"
            placeholder="Ej: Nuestros trabajos"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            name="description"
            label="Descripcion"
            placeholder="Descripcion opcional de la galeria"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Imagenes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h3" className="text-base">
                Imagenes
              </Heading>
              <Text size="sm" variant="muted">
                Hasta {MAX_IMAGES} imagenes en formato 4:5 (max 2MB cada una)
              </Text>
            </div>
            <Text size="sm" variant="muted">
              {images.length}/{MAX_IMAGES}
            </Text>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {images.map((url, index) => (
              <div key={index} className="relative">
                <div className="aspect-[4/5]">
                  <ImageUpload
                    bucket="images"
                    path={`${userId}/gallery/${index}`}
                    currentUrl={url || undefined}
                    onUpload={(newUrl) => updateImage(index, newUrl)}
                    onRemove={() => removeImage(index)}
                    className="h-full"
                  />
                </div>
              </div>
            ))}
          </div>

          {images.length < MAX_IMAGES && (
            <Button
              type="button"
              variant="outline"
              onClick={addImage}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Agregar imagen
            </Button>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">
            Boton de accion (CTA)
          </Heading>
          <Text size="sm" variant="muted">
            Agrega un boton debajo de la galeria
          </Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="cta_label"
              label="Texto del boton"
              placeholder="Ej: Ver mas trabajos"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
            />
            <Input
              name="cta_url"
              label="URL del boton"
              placeholder="Ej: https://instagram.com/..."
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Estilo del boton
            </label>
            <Select
              value={ctaVariant}
              onValueChange={(val: string) => setCtaVariant(val as ButtonVariant)}
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
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
