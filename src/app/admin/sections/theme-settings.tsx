"use client";

import * as React from "react";
import {
  Button, Input,
  Card, CardHeader, CardContent, CardFooter,
  Heading, Text, useToast,
} from "@/components/ui";
import { saveThemeSettings, type SaveThemeState } from "../actions";
import type { ThemeSettings } from "@/types";
import { DEFAULT_THEME_SETTINGS } from "@/types";

interface ThemeSettingsFormProps {
  initialSettings: ThemeSettings;
}

const COLOR_FIELDS: { key: keyof ThemeSettings; label: string; description: string }[] = [
  { key: "background", label: "Color de fondo", description: "Fondo general de la pagina" },
  { key: "foreground", label: "Color de texto", description: "Textos, titulos y parrafos" },
  { key: "primary", label: "Color primario", description: "Botones principales, enlaces y acentos" },
  { key: "secondary", label: "Color secundario", description: "Botones secundarios, badges y fondos sutiles" },
];

export function ThemeSettingsForm({ initialSettings }: ThemeSettingsFormProps) {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [colors, setColors] = React.useState<ThemeSettings>(initialSettings);

  const updateColor = (key: keyof ThemeSettings, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setColors(DEFAULT_THEME_SETTINGS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    const fd = new FormData();
    fd.set("background", colors.background);
    fd.set("foreground", colors.foreground);
    fd.set("primary", colors.primary);
    fd.set("secondary", colors.secondary);

    const result = await saveThemeSettings(null, fd);
    setPending(false);

    if (result.success) {
      toast("Estilos guardados", "success");
    } else if (result.error) {
      toast(result.error, "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">Colores del tema</Heading>
          <Text size="sm" variant="muted">
            Personaliza los colores de tu pagina publica. Los cambios solo afectan la landing page.
          </Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {COLOR_FIELDS.map(({ key, label, description }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Text size="sm" className="font-medium">{label}</Text>
              <Text size="sm" variant="muted">{description}</Text>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                  className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-input bg-background"
                />
                <Input
                  value={colors[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                  placeholder="#000000"
                  className="max-w-[140px] font-mono"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">Vista previa</Heading>
          <Text size="sm" variant="muted">Asi se veran los colores en tu pagina</Text>
        </CardHeader>
        <CardContent>
          <div
            className="overflow-hidden rounded-xl border p-6"
            style={{ backgroundColor: colors.background, color: colors.foreground }}
          >
            <p className="mb-1 text-lg font-semibold">Titulo de ejemplo</p>
            <p className="mb-4 text-sm opacity-60">
              Este es un texto de ejemplo para previsualizar los colores.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: colors.primary, color: "#fff" }}
              >
                Boton primario
              </button>
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: colors.secondary, color: colors.foreground }}
              >
                Boton secundario
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={handleReset}>
          Restablecer
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar estilos"}
        </Button>
      </div>
    </form>
  );
}
