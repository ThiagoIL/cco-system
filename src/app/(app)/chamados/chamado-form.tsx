import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import {
  ORIGEM_LABEL,
  CLASSIFICACAO_LABEL,
  STATUS_CHAMADO_LABEL,
} from "@/lib/labels";
import { SLA_CLASSE_LABEL } from "@/lib/sla";
import type { Colaborador, Viatura } from "@/generated/prisma/client";

type ChamadoValues = {
  cliente: string;
  endereco?: string | null;
  regiao?: string | null;
  descricao?: string | null;
  origem: string;
  classificacao: string;
  slaClasse: string;
  status: string;
  colaboradorId?: string | null;
  viaturaId?: string | null;
  dataProgramada?: Date | null;
};

function toDatetimeLocal(date?: Date | null) {
  if (!date) return "";
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function ChamadoForm({
  action,
  colaboradores,
  viaturas,
  chamado,
  submitLabel = "Salvar",
}: {
  action: (formData: FormData) => void | Promise<void>;
  colaboradores: Colaborador[];
  viaturas: Viatura[];
  chamado?: ChamadoValues;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="cliente">Cliente</Label>
          <Input
            id="cliente"
            name="cliente"
            defaultValue={chamado?.cliente}
            required
          />
        </div>
        <div>
          <Label htmlFor="endereco">Endereço</Label>
          <Input id="endereco" name="endereco" defaultValue={chamado?.endereco ?? ""} />
        </div>
        <div>
          <Label htmlFor="regiao">Região</Label>
          <Input id="regiao" name="regiao" defaultValue={chamado?.regiao ?? ""} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            name="descricao"
            rows={3}
            defaultValue={chamado?.descricao ?? ""}
          />
        </div>

        <div>
          <Label htmlFor="origem">Origem</Label>
          <Select id="origem" name="origem" defaultValue={chamado?.origem ?? "WHATSAPP"}>
            {Object.entries(ORIGEM_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="classificacao">Classificação</Label>
          <Select
            id="classificacao"
            name="classificacao"
            defaultValue={chamado?.classificacao ?? "P3"}
          >
            {Object.entries(CLASSIFICACAO_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="slaClasse">Classe de SLA</Label>
          <Select id="slaClasse" name="slaClasse" defaultValue={chamado?.slaClasse ?? "C"}>
            {Object.entries(SLA_CLASSE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={chamado?.status ?? "NOVO"}>
            {Object.entries(STATUS_CHAMADO_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="colaboradorId">Técnico / Colaborador</Label>
          <Select
            id="colaboradorId"
            name="colaboradorId"
            defaultValue={chamado?.colaboradorId ?? ""}
          >
            <option value="">Não atribuído</option>
            {colaboradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="viaturaId">Viatura</Label>
          <Select id="viaturaId" name="viaturaId" defaultValue={chamado?.viaturaId ?? ""}>
            <option value="">Não atribuída</option>
            {viaturas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="dataProgramada">Data programada</Label>
          <Input
            id="dataProgramada"
            name="dataProgramada"
            type="datetime-local"
            defaultValue={toDatetimeLocal(chamado?.dataProgramada)}
          />
        </div>
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
