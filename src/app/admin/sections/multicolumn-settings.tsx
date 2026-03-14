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
import { saveMulticolumnSettings, type SaveMulticolumnState } from "../actions";
import type { MulticolumnSettings, MulticolumnBlock, ButtonVariant } from "@/types";
import { DEFAULT_MULTICOLUMN_BLOCK } from "@/types";
import { CTA_VARIANTS } from "../constants";

const MAX_BLOCKS = 8;

interface MulticolumnSettingsProps {
  userId: string;
  initialSettings: MulticolumnSettings;
}

export function MulticolumnSettingsForm({ userId, initialSettings }: MulticolumnSettingsProps) {
  const { toast } = useToast();

  const [, formAction, pending] = useActionState(
    async (prev: SaveMulticolumnState | null, formData: FormData) => {
      const result = await saveMulticolumnSettings(prev, formData);
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
  const [blocks, setBlocks] = React.useState<MulticolumnBlock[]>(
    initialSettings.blocks.length > 0 ? initialSettings.blocks : [],
  );
  const [ctaLabel, setCtaLabel] = React.useState(initialSettings.cta_label);
  const [ctaUrl, setCtaUrl] = React.useState(initialSettings.cta_url);
  const [ctaVariant, setCtaVariant] = React.useState<ButtonVariant>(initialSettings.cta_variant);

  const addBlock = () => {
    if (blocks.length < MAX_BLOCKS) {
      setBlocks([...blocks, { ...DEFAULT_MULTICOLUMN_BLOCK }]);
    }
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index: number, field: keyof MulticolumnBlock, value: string) => {
    const updated = [...blocks];
    updated[index] = { ...updated[index], [field]: value };
    setBlocks(updated);
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Hidden inputs */}
      {blocks.map((block, index) => (
        <React.Fragment key={index}>
          <input type="hidden" name={`blocks[${index}].image_url`} value={block.image_url} />
          <input type="hidden" name={`blocks[${index}].title`} value={block.title} />
          <input type="hidden" name={`blocks[${index}].subtitle`} value={block.subtitle} />
          <input type="hidden" name={`blocks[${index}].link_url`} value={block.link_url} />
        </React.Fragment>
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
                Mostrar u ocultar la seccion multicolumna en tu pagina
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
            Titulo de la seccion
          </Text>
        </CardHeader>
        <CardContent>
          <Input
            name="title"
            label="Titulo"
            placeholder="Ej: Nuestros servicios"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Bloques */}
      {blocks.map((block, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Heading as="h4" className="text-base">
                Bloque {index + 1}
              </Heading>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeBlock(index)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ImageUpload
              bucket="images"
              path={`${userId}/multicolumn/${index}`}
              currentUrl={block.image_url || undefined}
              onUpload={(url) => updateBlock(index, "image_url", url)}
              onRemove={() => updateBlock(index, "image_url", "")}
            />
            <Input
              label="Titulo"
              placeholder="Ej: Corte clasico"
              value={block.title}
              onChange={(e) => updateBlock(index, "title", e.target.value)}
            />
            <Input
              label="Subtitulo"
              placeholder="Ej: Desde $5000"
              value={block.subtitle}
              onChange={(e) => updateBlock(index, "subtitle", e.target.value)}
            />
            <Input
              label="Link"
              placeholder="Ej: https://wa.me/..."
              value={block.link_url}
              onChange={(e) => updateBlock(index, "link_url", e.target.value)}
            />
          </CardContent>
        </Card>
      ))}

      {blocks.length < MAX_BLOCKS && (
        <Button type="button" variant="outline" onClick={addBlock}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Agregar bloque ({blocks.length}/{MAX_BLOCKS})
        </Button>
      )}

      {/* CTA */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">
            Boton de accion (CTA)
          </Heading>
          <Text size="sm" variant="muted">
            Agrega un boton debajo de la grilla
          </Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="cta_label"
              label="Texto del boton"
              placeholder="Ej: Ver todos los servicios"
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
