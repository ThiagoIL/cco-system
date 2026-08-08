"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { TIPO_COLABORADOR_LABEL } from "@/lib/labels";
import { createColaborador } from "./actions";

export function NovoColaboradorForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Novo colaborador
      </Button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await createColaborador(formData);
        setOpen(false);
      }}
      className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" name="nome" required />
      </div>
      <div>
        <Label htmlFor="tipo">Tipo</Label>
        <Select id="tipo" name="tipo" defaultValue="TECNICO">
          {Object.entries(TIPO_COLABORADOR_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <input type="hidden" name="status" value="DISPONIVEL" />
      <Button type="submit">Salvar</Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        <X className="size-4" /> Cancelar
      </Button>
    </form>
  );
}
