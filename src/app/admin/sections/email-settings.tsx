"use client";

import * as React from "react";
import {
  Button, Input, Textarea,
  Card, CardHeader, CardContent,
  Heading, Text, Badge, useToast,
} from "@/components/ui";
import { saveEmailSettings, type SaveEmailState } from "../actions";
import type { EmailSettings } from "@/types";
import { DEFAULT_EMAIL_SETTINGS } from "@/types";

interface EmailSettingsFormProps {
  initialSettings: EmailSettings;
}

const VARIABLES = [
  { token: "{nombre}", description: "Nombre del cliente" },
  { token: "{servicio}", description: "Nombre del servicio" },
  { token: "{profesional}", description: "Nombre del profesional" },
  { token: "{fecha}", description: "Fecha del turno" },
  { token: "{hora}", description: "Hora del turno" },
];

const EXAMPLE_VARS: Record<string, string> = {
  nombre: "Juan",
  servicio: "Corte clasico",
  profesional: "Carlos",
  fecha: "lunes 3 de marzo",
  hora: "14:30",
};

function replaceVars(template: string): string {
  let result = template;
  for (const [key, value] of Object.entries(EXAMPLE_VARS)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

export function EmailSettingsForm({ initialSettings }: EmailSettingsFormProps) {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [settings, setSettings] = React.useState<EmailSettings>(initialSettings);

  const update = (key: keyof EmailSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setSettings(DEFAULT_EMAIL_SETTINGS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    const fd = new FormData();
    fd.set("subject", settings.subject);
    fd.set("greeting", settings.greeting);
    fd.set("body", settings.body);
    fd.set("farewell", settings.farewell);

    const result = await saveEmailSettings(null, fd);
    setPending(false);

    if (result.success) {
      toast("Configuracion de email guardada", "success");
    } else if (result.error) {
      toast(result.error, "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">Plantilla del email</Heading>
          <Text size="sm" variant="muted">
            Personaliza los textos del email que se envia al completar un turno.
          </Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <Text size="sm" className="font-medium">Asunto</Text>
            <Input
              value={settings.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="Gracias por tu visita, {nombre}!"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Text size="sm" className="font-medium">Saludo</Text>
            <Input
              value={settings.greeting}
              onChange={(e) => update("greeting", e.target.value)}
              placeholder="Gracias por tu visita, {nombre}!"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Text size="sm" className="font-medium">Mensaje</Text>
            <Textarea
              value={settings.body}
              onChange={(e) => update("body", e.target.value)}
              placeholder="Tu turno fue completado con exito."
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Text size="sm" className="font-medium">Despedida</Text>
            <Input
              value={settings.farewell}
              onChange={(e) => update("farewell", e.target.value)}
              placeholder="Te esperamos de nuevo!"
            />
          </div>
        </CardContent>
      </Card>

      {/* Variables */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">Variables disponibles</Heading>
          <Text size="sm" variant="muted">
            Usa estas variables en los textos y se reemplazaran automaticamente.
          </Text>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {VARIABLES.map(({ token, description }) => (
              <Badge key={token} variant="secondary" className="font-mono text-xs">
                {token}
                <span className="ml-1 font-sans text-muted-foreground">— {description}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">Vista previa</Heading>
          <Text size="sm" variant="muted">Asi se vera el email con datos de ejemplo</Text>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border bg-white p-6">
            <p className="mb-1 text-xs text-muted-foreground">
              Asunto: <strong>{replaceVars(settings.subject)}</strong>
            </p>
            <hr className="my-3 border-border" />
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {replaceVars(settings.greeting)}
            </h2>
            {settings.body && (
              <p className="mb-4 text-sm text-muted-foreground">
                {replaceVars(settings.body)}
              </p>
            )}
            <div className="mb-4 rounded-xl bg-muted p-4 text-sm">
              <p className="mb-1"><strong>Servicio:</strong> {EXAMPLE_VARS.servicio}</p>
              <p className="mb-1"><strong>Profesional:</strong> {EXAMPLE_VARS.profesional}</p>
              <p className="mb-1"><strong>Fecha:</strong> {EXAMPLE_VARS.fecha}</p>
              <p><strong>Hora:</strong> {EXAMPLE_VARS.hora} hs</p>
            </div>
            {settings.farewell && (
              <p className="text-xs text-muted-foreground">
                {replaceVars(settings.farewell)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={handleReset}>
          Restablecer
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar email"}
        </Button>
      </div>
    </form>
  );
}
