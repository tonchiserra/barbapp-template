"use client";

import { Button, Heading, Text } from "@/components/ui";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Heading as="h2" className="text-xl">
        Algo salio mal
      </Heading>
      <Text variant="muted" size="sm" className="max-w-sm">
        {error.message || "Ocurrio un error inesperado. Intenta de nuevo."}
      </Text>
      <Button variant="outline" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
