"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md p-10 text-center">
      <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        Algo deu errado
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Não foi possível carregar esta página. Tente novamente.
      </p>
      <Button className="mt-4" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
