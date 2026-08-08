import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { NovoColaboradorForm } from "./novo-colaborador-form";
import { updateColaboradorStatus } from "./actions";
import {
  TIPO_COLABORADOR_LABEL,
  STATUS_COLABORADOR_LABEL,
  STATUS_COLABORADOR_COLOR,
} from "@/lib/labels";
import type { TipoColaborador } from "@/generated/prisma/enums";

const GRUPOS: TipoColaborador[] = ["TECNICO", "TI", "AJUDANTE", "ESTAGIARIO"];

export default async function EquipesPage() {
  const colaboradores = await prisma.colaborador.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="p-6">
      <RealtimeRefresher events={["colaboradores:changed"]} />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Cadastro de Equipes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {colaboradores.length} colaborador(es) ativo(s)
          </p>
        </div>
        <NovoColaboradorForm />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {GRUPOS.map((tipo) => {
          const grupo = colaboradores.filter((c) => c.tipo === tipo);
          return (
            <Card key={tipo}>
              <CardHeader
                title={TIPO_COLABORADOR_LABEL[tipo]}
                subtitle={`${grupo.length} colaborador(es)`}
              />
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {grupo.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {c.nome}
                      </span>
                      <Badge className={STATUS_COLABORADOR_COLOR[c.status]}>
                        {STATUS_COLABORADOR_LABEL[c.status]}
                      </Badge>
                    </div>
                    <form action={updateColaboradorStatus.bind(null, c.id)}>
                      <AutoSubmitSelect name="status" defaultValue={c.status} className="text-xs">
                        {Object.entries(STATUS_COLABORADOR_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </AutoSubmitSelect>
                    </form>
                  </div>
                ))}
                {grupo.length === 0 && (
                  <p className="p-3 text-sm text-slate-400">Nenhum colaborador.</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
