"use client";

import { useActionState, useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Card,
  CardHeader,
  CardContent,
  Heading,
  Text,
} from "@/components/ui";
import { onboardStaff } from "./actions";
import type { Branch } from "@/types";

export function OnboardingForm({ branches }: { branches: Branch[] }) {
  const [branchId, setBranchId] = useState("");
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      return await onboardStaff(formData);
    },
    null,
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Heading as="h1" className="text-2xl">
            Completar perfil
          </Heading>
          <Text size="sm" variant="muted">
            Ingresa tus datos para comenzar
          </Text>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <Input
              name="name"
              label="Nombre"
              placeholder="Tu nombre completo"
              required
              error={state?.error}
            />
            {branches.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Text size="sm" className="font-medium">
                  Sucursal
                </Text>
                <input type="hidden" name="branch_id" value={branchId} />
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={pending}
            >
              {pending ? "Guardando..." : "Continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
