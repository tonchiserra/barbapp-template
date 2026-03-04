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
  useToast,
} from "@/components/ui";
import { saveVideoSettings, type SaveVideoState } from "../actions";
import type { VideoSettings, ButtonVariant } from "@/types";

const CTA_VARIANTS: { value: ButtonVariant; label: string }[] = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "outline", label: "Outline" },
  { value: "ghost", label: "Ghost" },
  { value: "destructive", label: "Destructive" },
];

interface VideoSettingsProps {
  initialSettings: VideoSettings;
}

export function VideoSettingsForm({ initialSettings }: VideoSettingsProps) {
  const { toast } = useToast();

  const [, formAction, pending] = useActionState(
    async (prev: SaveVideoState | null, formData: FormData) => {
      const result = await saveVideoSettings(prev, formData);
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
  const [youtubeUrl, setYoutubeUrl] = React.useState(initialSettings.youtube_url);
  const [description, setDescription] = React.useState(initialSettings.description);
  const [ctaLabel, setCtaLabel] = React.useState(initialSettings.cta_label);
  const [ctaUrl, setCtaUrl] = React.useState(initialSettings.cta_url);
  const [ctaVariant, setCtaVariant] = React.useState<ButtonVariant>(initialSettings.cta_variant);

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
                Mostrar u ocultar la seccion de video en tu pagina
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
            Configura el video destacado de YouTube
          </Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            name="title"
            label="Titulo"
            placeholder="Ej: Conoce nuestro negocio"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            name="youtube_url"
            label="URL de YouTube"
            placeholder="https://www.youtube.com/watch?v=..."
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
          />
          <Textarea
            name="description"
            label="Descripcion"
            placeholder="Descripcion opcional del video"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">
            Boton de accion (CTA)
          </Heading>
          <Text size="sm" variant="muted">
            Agrega un boton debajo del video
          </Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="cta_label"
              label="Texto del boton"
              placeholder="Ej: Reservar turno"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
            />
            <Input
              name="cta_url"
              label="URL del boton"
              placeholder="Ej: https://wa.me/..."
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
          <input type="hidden" name="cta_variant" value={ctaVariant} />
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
