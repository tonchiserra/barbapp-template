"use client";

import {
  Button,
  Heading,
  Text,
  Link,
  Input,
  Textarea,
  Badge,
  Separator,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Checkbox,
  Switch,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function UIKitPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-16 flex flex-col gap-2">
        <Link href="/" variant="muted" className="mb-4 text-sm">
          &larr; Volver
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">UI Kit</h1>
        <p className="text-muted-foreground">
          Componentes reutilizables del sistema de diseno
        </p>
      </div>

      <div className="flex flex-col gap-16">
        {/* Tipografia */}
        <Section title="Tipografia">
          <div className="flex flex-col gap-4">
            <Heading as="h1">Heading 1</Heading>
            <Heading as="h2">Heading 2</Heading>
            <Heading as="h3">Heading 3</Heading>
            <Heading as="h4">Heading 4</Heading>
            <Heading as="h5">Heading 5</Heading>
            <Heading as="h6">Heading 6</Heading>
          </div>
          <Separator />
          <Row label="Texto">
            <div className="flex flex-col gap-2">
              <Text size="lg">Texto grande</Text>
              <Text size="base">Texto base</Text>
              <Text size="sm">Texto pequeno</Text>
            </div>
          </Row>
          <Row label="Variantes de texto">
            <div className="flex flex-col gap-2">
              <Text variant="default">Texto default</Text>
              <Text variant="muted">Texto muted</Text>
              <Text variant="destructive">Texto destructive</Text>
            </div>
          </Row>
          <Row label="Links">
            <Link href="#" variant="default">
              Link default
            </Link>
            <Link href="#" variant="muted">
              Link muted
            </Link>
            <Link href="#" variant="destructive">
              Link destructive
            </Link>
          </Row>
        </Section>

        <Separator />

        {/* Botones */}
        <Section title="Botones">
          <Row label="Variantes">
            <Button variant="primary">Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructivo</Button>
          </Row>
          <Row label="Tamanos">
            <Button size="sm">Pequeno</Button>
            <Button size="md">Mediano</Button>
            <Button size="lg">Grande</Button>
          </Row>
          <Row label="Estado deshabilitado">
            <Button disabled>Deshabilitado</Button>
            <Button variant="outline" disabled>
              Deshabilitado
            </Button>
          </Row>
        </Section>

        <Separator />

        {/* Badges */}
        <Section title="Badges">
          <Row>
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secundario</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructivo</Badge>
          </Row>
        </Section>

        <Separator />

        {/* Formularios */}
        <Section title="Formularios">
          <div className="grid gap-6 sm:grid-cols-2">
            <Input label="Nombre" placeholder="Tu nombre" />
            <Input label="Email" type="email" placeholder="tu@email.com" />
          </div>
          <Input
            label="Con error"
            placeholder="Campo invalido"
            error="Este campo es obligatorio"
          />
          <Input
            label="Con ayuda"
            placeholder="Escribe algo"
            helperText="Maximo 100 caracteres"
          />
          <Input label="Deshabilitado" placeholder="No editable" disabled />
          <Textarea
            label="Mensaje"
            placeholder="Escribe tu mensaje..."
            helperText="Minimo 20 caracteres"
          />
          <Textarea
            label="Con error"
            placeholder="Mensaje"
            error="El mensaje es muy corto"
          />
          <Row label="Select">
            <Select>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corte">Corte de pelo</SelectItem>
                <SelectItem value="barba">Arreglo de barba</SelectItem>
                <SelectItem value="combo">Corte + Barba</SelectItem>
                <SelectItem value="color">Coloracion</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="Checkbox">
            <Checkbox label="Acepto los terminos y condiciones" />
            <Checkbox label="Recordarme" defaultChecked />
            <Checkbox label="Deshabilitado" disabled />
          </Row>
          <Row label="Switch">
            <Switch label="Notificaciones" />
            <Switch label="Activo" defaultChecked />
            <Switch label="Deshabilitado" disabled />
          </Row>
        </Section>

        <Separator />

        {/* Cards */}
        <Section title="Cards">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Corte clasico</CardTitle>
                <CardDescription>
                  Corte tradicional con tijera y maquina
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Text size="sm" variant="muted">
                  Duracion estimada: 30 min
                </Text>
              </CardContent>
              <CardFooter>
                <Button size="sm">Reservar</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Arreglo de barba</CardTitle>
                <CardDescription>
                  Perfilado y recorte profesional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Text size="sm" variant="muted">
                  Duracion estimada: 20 min
                </Text>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline">
                  Reservar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Section>

        <Separator />

        {/* Dialog */}
        <Section title="Dialog">
          <Row>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Abrir dialogo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar reserva</DialogTitle>
                  <DialogDescription>
                    Estas a punto de reservar un turno. Esta accion no se puede
                    deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost">Cancelar</Button>
                  <Button>Confirmar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Row>
        </Section>

        <Separator />

        {/* Separator */}
        <Section title="Separador">
          <Text size="sm" variant="muted">
            Horizontal (por defecto):
          </Text>
          <Separator />
          <Row label="Vertical">
            <div className="flex h-8 items-center gap-4">
              <Text size="sm">Elemento A</Text>
              <Separator orientation="vertical" />
              <Text size="sm">Elemento B</Text>
              <Separator orientation="vertical" />
              <Text size="sm">Elemento C</Text>
            </div>
          </Row>
        </Section>
      </div>
    </div>
  );
}
