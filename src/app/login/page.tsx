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
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      return await login(formData);
    },
    null,
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Heading as="h1" className="text-2xl">
            Iniciar sesion
          </Heading>
          <Text size="sm" variant="muted">
            Ingresa tus credenciales para acceder
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
              placeholder="Tu contrasena"
              required
              autoComplete="current-password"
              error={state?.error}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={pending}
            >
              {pending ? "Ingresando..." : "Iniciar sesion"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Separator />
          <Text size="sm" variant="muted" className="text-center">
            No tenes cuenta?{" "}
            <Link href="/registro">Crear cuenta</Link>
          </Text>
        </CardFooter>
      </Card>
    </div>
  );
}
