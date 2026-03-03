"use client";

import { useActionState } from "react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Heading,
  Text,
  Link,
  Separator,
} from "@/components/ui";
import { signup } from "./actions";

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      return await signup(formData);
    },
    null,
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Heading as="h1" className="text-2xl">
            Crear cuenta
          </Heading>
          <Text size="sm" variant="muted">
            Registrate para comenzar a usar Barbapp
          </Text>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
            <Input
              name="password"
              type="password"
              label="Contrasena"
              placeholder="Minimo 6 caracteres"
              required
              autoComplete="new-password"
            />
            <Input
              name="confirmPassword"
              type="password"
              label="Confirmar contrasena"
              placeholder="Repeti tu contrasena"
              required
              autoComplete="new-password"
              error={state?.error}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={pending}
            >
              {pending ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Separator />
          <Text size="sm" variant="muted" className="text-center">
            Ya tenes cuenta?{" "}
            <Link href="/login">Iniciar sesion</Link>
          </Text>
        </CardFooter>
      </Card>
    </div>
  );
}
