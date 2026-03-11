"use client";

import * as React from "react";
import {
  Button, Input, Switch,
  Card, CardContent,
  Text, useToast,
} from "@/components/ui";
import { saveRankingSettings } from "@/app/admin/turnero-actions";
import type { RankingSettings } from "@/types";

interface RankingSettingsFormProps {
  settings: RankingSettings;
}

export function RankingSettingsForm({ settings }: RankingSettingsFormProps) {
  const { toast } = useToast();
  const [title, setTitle] = React.useState(settings.title);
  const [description, setDescription] = React.useState(settings.description);
  const [isVisible, setIsVisible] = React.useState(settings.is_visible);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    if (isVisible) formData.set("is_visible", "on");

    const result = await saveRankingSettings(null, formData);
    setPending(false);
    if (result.success) {
      toast("Configuracion guardada", "success");
    } else {
      toast(result.error || "Error", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 py-4">
          <Text size="sm" variant="muted">
            El ranking muestra los 100 clientes con mas puntos acumulados en tu pagina publica.
          </Text>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <Text size="sm">Mostrar seccion de ranking</Text>
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>
          <Input
            label="Titulo"
            placeholder="Ranking de Clientes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Descripcion (opcional)"
            placeholder="Los clientes mas fieles de nuestro negocio"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </CardContent>
      </Card>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar configuracion"}
      </Button>
    </form>
  );
}
