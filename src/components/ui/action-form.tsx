"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/lib/action-result";

/**
 * <form> que executa uma Server Action e mostra o erro devolvido por ela
 * sem derrubar a página. Diferente de `useActionState`, mantém o que o
 * usuário digitou quando há erro e só limpa o formulário em caso de sucesso.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  onSuccess,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        startTransition(async () => {
          const result = await action(null, formData);
          if (result?.error) {
            setError(result.error);
            return;
          }
          setError(null);
          if (resetOnSuccess) form.reset();
          onSuccess?.();
        });
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {error && (
        <p
          role="alert"
          className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}
    </form>
  );
}
