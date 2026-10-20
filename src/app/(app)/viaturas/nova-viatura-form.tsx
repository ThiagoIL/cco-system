"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/ui/action-form";
import { Input, Label } from "@/components/ui/field";
import { createViatura } from "./actions";

export function NovaViaturaForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Nova viatura
      </Button>
    );
  }

  return (
    <ActionForm
      action={createViatura}
      onSuccess={() => setOpen(false)}
      className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <Label htmlFor="nome">Identificação</Label>
        <Input id="nome" name="nome" placeholder="Ex: VTR 02" required />
      </div>
      <Button type="submit">Salvar</Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        <X className="size-4" /> Cancelar
      </Button>
    </ActionForm>
  );
}
