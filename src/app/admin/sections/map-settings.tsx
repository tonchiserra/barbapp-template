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
  useToast,
} from "@/components/ui";
import { saveMapSettings, type SaveMapState } from "../actions";
import type { MapSettings, MapLocation } from "@/types";
import { DEFAULT_MAP_LOCATION } from "@/types";

const MAX_LOCATIONS = 5;

export function MapSettingsForm({ initialSettings }: { initialSettings: MapSettings }) {
  const { toast } = useToast();

  const [, formAction, pending] = useActionState(
    async (prev: SaveMapState | null, formData: FormData) => {
      const result = await saveMapSettings(prev, formData);
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
  const [locations, setLocations] = React.useState<MapLocation[]>(
    initialSettings.locations.length > 0 ? initialSettings.locations : [],
  );

  const addLocation = () => {
    if (locations.length < MAX_LOCATIONS) {
      setLocations([...locations, { ...DEFAULT_MAP_LOCATION }]);
    }
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const updateLocation = (index: number, field: keyof MapLocation, value: string) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Hidden inputs for locations */}
      {locations.map((location, index) => (
        <React.Fragment key={index}>
          <input type="hidden" name={`locations[${index}].name`} value={location.name} />
          <input type="hidden" name={`locations[${index}].address`} value={location.address} />
        </React.Fragment>
      ))}

      {/* Visibilidad */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h3" className="text-base">
                Visibilidad
              </Heading>
              <Text size="sm" variant="muted">
                Mostrar u ocultar la seccion de mapa en tu pagina
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
            Titulo y descripcion de la seccion
          </Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            name="title"
            label="Titulo"
            placeholder="Ej: Donde encontrarnos"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            name="description"
            label="Descripcion"
            placeholder="Ej: Visitanos en cualquiera de nuestras sucursales"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Sucursales */}
      {locations.map((location, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Heading as="h4" className="text-base">
                Sucursal {index + 1}
              </Heading>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLocation(index)}
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
            <Input
              label="Nombre"
              placeholder="Ej: Sucursal Centro"
              value={location.name}
              onChange={(e) => updateLocation(index, "name", e.target.value)}
            />
            <Input
              label="Direccion"
              placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
              value={location.address}
              onChange={(e) => updateLocation(index, "address", e.target.value)}
            />
            {location.address && (
              <div className="overflow-hidden rounded-xl">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(location.address)}&output=embed`}
                  className="aspect-video w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={location.name || location.address}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {locations.length < MAX_LOCATIONS && (
        <Button type="button" variant="outline" onClick={addLocation}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Agregar sucursal ({locations.length}/{MAX_LOCATIONS})
        </Button>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
