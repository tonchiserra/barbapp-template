"use client";

import * as React from "react";
import {
  Heading, Text, Input, Textarea, Switch, Button,
  Card, CardHeader, CardContent,
  useToast,
} from "@/components/ui";
import { saveBookingSettings } from "../turnero-actions";
import type { BookingSettings } from "@/types";

export function BookingSettingsForm({ initialSettings }: { initialSettings: BookingSettings }) {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [title, setTitle] = React.useState(initialSettings.title);
  const [description, setDescription] = React.useState(initialSettings.description);
  const [advanceDays, setAdvanceDays] = React.useState(String(initialSettings.advance_days));
  const [minAdvanceHours, setMinAdvanceHours] = React.useState(String(initialSettings.min_advance_hours));
  const [isVisible, setIsVisible] = React.useState(initialSettings.is_visible);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    const fd = new FormData();
    fd.set("title", title);
    fd.set("description", description);
    fd.set("advance_days", advanceDays);
    fd.set("min_advance_hours", minAdvanceHours);
    if (isVisible) fd.set("is_visible", "on");

    const result = await saveBookingSettings(null, fd);
    setPending(false);

    if (result.error) {
      toast(result.error, "error");
    } else {
      toast("Configuracion guardada", "success");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Visibilidad */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h3" className="text-base">
                Visibilidad
              </Heading>
              <Text size="sm" variant="muted">
                Mostrar u ocultar el turnero en tu pagina
              </Text>
            </div>
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>
        </CardHeader>
      </Card>

      {/* Contenido */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">
            Contenido
          </Heading>
          <Text size="sm" variant="muted">
            Titulo y descripcion de la seccion
          </Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            label="Titulo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reserva tu turno"
          />
          <Textarea
            label="Descripcion"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Texto opcional debajo del titulo"
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Reglas */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">
            Reglas de reserva
          </Heading>
          <Text size="sm" variant="muted">
            Limites de anticipacion para nuevas reservas
          </Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            label="Dias de anticipacion"
            type="number"
            min={1}
            max={365}
            value={advanceDays}
            onChange={(e) => setAdvanceDays(e.target.value)}
          />
          <Input
            label="Horas minimas de anticipacion"
            type="number"
            min={0}
            max={72}
            value={minAdvanceHours}
            onChange={(e) => setMinAdvanceHours(e.target.value)}
          />
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
