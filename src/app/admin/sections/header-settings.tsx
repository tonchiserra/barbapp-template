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
import { saveHeaderSettings, type SaveHeaderState } from "../actions";
import type { HeaderSettings, MenuLink, SocialLinks, SocialPlatform } from "@/types";
import { SOCIAL_PLATFORMS } from "@/types";

interface HeaderSettingsProps {
  userId: string;
  initialSettings: HeaderSettings;
}

export function HeaderSettingsForm({ userId, initialSettings }: HeaderSettingsProps) {
  const { toast } = useToast();

  const [, formAction, pending] = useActionState(
    async (prev: SaveHeaderState | null, formData: FormData) => {
      const result = await saveHeaderSettings(prev, formData);
      if (result.success) {
        toast("Configuracion guardada exitosamente", "success");
      } else if (result.error) {
        toast(result.error, "error");
      }
      return result;
    },
    null,
  );

  const [logoType, setLogoType] = React.useState<"text" | "image">(
    initialSettings.logo_type,
  );
  const [menuLinks, setMenuLinks] = React.useState<MenuLink[]>(
    initialSettings.menu_links.length > 0
      ? initialSettings.menu_links
      : [{ label: "", url: "" }],
  );
  const [isVisible, setIsVisible] = React.useState(initialSettings.is_visible);
  const [logoText, setLogoText] = React.useState(initialSettings.logo_text);
  const [logoImageUrl, setLogoImageUrl] = React.useState(
    initialSettings.logo_image_url,
  );
  const [socialLinks, setSocialLinks] = React.useState<SocialLinks>(
    initialSettings.social_links,
  );

  const updateSocialLink = (key: SocialPlatform, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [key]: value || null }));
  };

  const addMenuLink = () => {
    if (menuLinks.length < 8) {
      setMenuLinks([...menuLinks, { label: "", url: "" }]);
    }
  };

  const removeMenuLink = (index: number) => {
    setMenuLinks(menuLinks.filter((_, i) => i !== index));
  };

  const updateMenuLink = (
    index: number,
    field: "label" | "url",
    value: string,
  ) => {
    const updated = [...menuLinks];
    updated[index] = { ...updated[index], [field]: value };
    setMenuLinks(updated);
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
                Mostrar u ocultar el header en tu pagina
              </Text>
            </div>
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>
          {isVisible && <input type="hidden" name="is_visible" value="on" />}
        </CardHeader>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">
            Logo
          </Heading>
          <Text size="sm" variant="muted">
            Como se muestra el logo de tu barberia
          </Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Tipo de logo
            </label>
            <input type="hidden" name="logo_type" value={logoType} />
            <Select
              value={logoType}
              onValueChange={(val: string) =>
                setLogoType(val as "text" | "image")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="image">Imagen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {logoType === "text" ? (
            <Input
              name="logo_text"
              label="Nombre del sitio"
              placeholder="Mi Barberia"
              value={logoText}
              onChange={(e) => setLogoText(e.target.value)}
              required
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Imagen del logo
              </label>
              <ImageUpload
                bucket="images"
                path={`${userId}/logo`}
                currentUrl={logoImageUrl || undefined}
                onUpload={setLogoImageUrl}
                onRemove={() => setLogoImageUrl("")}
              />
            </div>
          )}

          <input type="hidden" name="logo_image_url" value={logoImageUrl} />
          {logoType === "image" && (
            <input type="hidden" name="logo_text" value={logoText} />
          )}
        </CardContent>
      </Card>

      {/* Menu Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h3" className="text-base">
                Enlaces de navegacion
              </Heading>
              <Text size="sm" variant="muted">
                Agrega hasta 8 enlaces al menu ({menuLinks.length}/8)
              </Text>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMenuLink}
              disabled={menuLinks.length >= 8}
            >
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {menuLinks.map((link, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <Input
                  name={`menu_links[${index}].label`}
                  placeholder="Etiqueta (ej: Servicios)"
                  value={link.label}
                  onChange={(e) =>
                    updateMenuLink(index, "label", e.target.value)
                  }
                />
                <Input
                  name={`menu_links[${index}].url`}
                  placeholder="URL (ej: #servicios)"
                  value={link.url}
                  onChange={(e) =>
                    updateMenuLink(index, "url", e.target.value)
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeMenuLink(index)}
                className="mt-1 text-muted-foreground hover:text-destructive"
                aria-label={`Eliminar enlace ${index + 1}`}
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
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </div>
          ))}
          {menuLinks.length === 0 && (
            <Text size="sm" variant="muted" className="py-4 text-center">
              No hay enlaces. Presiona &quot;Agregar&quot; para crear uno.
            </Text>
          )}
        </CardContent>
      </Card>

      {/* Redes Sociales */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">
            Redes sociales
          </Heading>
          <Text size="sm" variant="muted">
            Agrega los links a tus redes (deja en blanco las que no uses)
          </Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {SOCIAL_PLATFORMS.map((platform) => (
            <Input
              key={platform.key}
              name={`social_${platform.key}`}
              label={platform.label}
              placeholder={platform.placeholder}
              type={platform.key === "email" ? "email" : "url"}
              value={socialLinks[platform.key] || ""}
              onChange={(e) => updateSocialLink(platform.key, e.target.value)}
            />
          ))}
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
