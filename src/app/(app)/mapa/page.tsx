import Link from "next/link";
import { MapPin, Truck } from "lucide-react";
import { listMapaOperacional } from "@/lib/data/mapa";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import {
  STATUS_COLABORADOR_LABEL,
  STATUS_COLABORADOR_COLOR,
  STATUS_CHAMADO_LABEL,
} from "@/lib/labels";
import { formatHora } from "@/lib/utils";

export default async function MapaOperacionalPage() {
  const linhas = await listMapaOperacional();

  return (
    <div className="p-6">
      <RealtimeRefresher events={["chamados:changed", "colaboradores:changed"]} />
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Mapa Operacional
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Onde cada equipe está e para onde vai
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {linhas.map(({ colaborador, atual, proximo, viatura }) => (
          <Card key={colaborador.id} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {colaborador.nome}
              </span>
              <Badge className={STATUS_COLABORADOR_COLOR[colaborador.status]}>
                {STATUS_COLABORADOR_LABEL[colaborador.status]}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase">Cliente atual</p>
                {atual ? (
                  <Link href={`/chamados/${atual.id}`} className="hover:underline">
                    {atual.cliente} — {STATUS_CHAMADO_LABEL[atual.status]}
                  </Link>
                ) : (
                  <p className="text-slate-400">Nenhum atendimento em curso</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase">
                  Próximo atendimento
                </p>
                {proximo ? (
                  <Link href={`/chamados/${proximo.id}`} className="hover:underline">
                    {proximo.cliente} · {formatHora(proximo.dataProgramada!)}
                  </Link>
                ) : (
                  <p className="text-slate-400">Sem próximo atendimento programado</p>
                )}
              </div>
              <div className="flex items-center gap-4 pt-1 text-xs text-slate-500 dark:text-slate-400">
                {viatura && (
                  <span className="flex items-center gap-1">
                    <Truck className="size-3.5" /> {viatura.nome}
                  </span>
                )}
                {atual?.regiao && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {atual.regiao}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
        {linhas.length === 0 && (
          <p className="text-sm text-slate-400">Nenhum colaborador ativo cadastrado.</p>
        )}
      </div>
    </div>
  );
}
