import Link from "next/link";
import { MapPin, Truck, Clock, Navigation } from "lucide-react";
import { listMapaOperacional } from "@/lib/data/mapa";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import {
  STATUS_COLABORADOR_LABEL,
  STATUS_COLABORADOR_COLOR,
  STATUS_CHAMADO_LABEL,
  TIPO_COLABORADOR_LABEL,
  SEMAFORO_COLOR,
} from "@/lib/labels";
import { semaforoSla, tempoRestanteSla } from "@/lib/sla";
import { formatHora, cn } from "@/lib/utils";

const ORDEM_STATUS = ["EM_ATENDIMENTO", "EM_DESLOCAMENTO", "DISPONIVEL", "FOLGA"];
const TIPOS = ["TECNICO", "TI", "AJUDANTE"] as const;

export default async function MapaOperacionalPage(props: PageProps<"/mapa">) {
  const searchParams = await props.searchParams;
  const equipeParam = Array.isArray(searchParams?.equipe) ? searchParams?.equipe[0] : searchParams?.equipe;
  const equipe = (TIPOS as readonly string[]).includes(equipeParam ?? "") ? equipeParam : undefined;

  const todas = await listMapaOperacional();
  const linhas = todas
    .filter((l) => !equipe || l.colaborador.tipo === equipe)
    .sort(
      (a, b) =>
        ORDEM_STATUS.indexOf(a.colaborador.status) - ORDEM_STATUS.indexOf(b.colaborador.status) ||
        a.colaborador.nome.localeCompare(b.colaborador.nome)
    );

  const contagem = (status: string) => todas.filter((l) => l.colaborador.status === status).length;
  const agora = new Date();

  return (
    <div className="p-6">
      <RealtimeRefresher events={["chamados:changed", "colaboradores:changed"]} />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Mapa Operacional</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Onde cada equipe está e para onde vai
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm dark:border-slate-700">
          {[{ valor: undefined, label: "Todos" }, ...TIPOS.map((t) => ({ valor: t, label: TIPO_COLABORADOR_LABEL[t] }))].map(
            (f) => (
              <Link
                key={f.label}
                href={f.valor ? `/mapa?equipe=${f.valor}` : "/mapa"}
                className={cn(
                  "rounded-md px-3 py-1",
                  f.valor === equipe
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {f.label}
              </Link>
            )
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {ORDEM_STATUS.map((s) => (
          <Badge key={s} className={STATUS_COLABORADOR_COLOR[s]}>
            {STATUS_COLABORADOR_LABEL[s]}: {contagem(s)}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {linhas.map(({ colaborador, atual, proximo, viatura }) => (
          <Card key={colaborador.id} className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {colaborador.nome}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {TIPO_COLABORADOR_LABEL[colaborador.tipo]}
                </p>
              </div>
              <Badge className={STATUS_COLABORADOR_COLOR[colaborador.status]}>
                {STATUS_COLABORADOR_LABEL[colaborador.status]}
              </Badge>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-0.5 flex items-center gap-1 text-xs font-medium text-slate-400 uppercase">
                  <Navigation className="size-3" /> Cliente atual
                </p>
                {atual ? (
                  <>
                    <Link href={`/chamados/${atual.id}`} className="font-medium hover:underline">
                      {atual.cliente}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {STATUS_CHAMADO_LABEL[atual.status]}
                      {atual.endereco ? ` · ${atual.endereco}` : ""}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          SEMAFORO_COLOR[semaforoSla(atual.prazoSla, atual.slaClasse, null, agora)]
                        )}
                      />
                      SLA: {tempoRestanteSla(atual.prazoSla, null, agora)}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400">Nenhum atendimento em curso</p>
                )}
              </div>
              <div>
                <p className="mb-0.5 flex items-center gap-1 text-xs font-medium text-slate-400 uppercase">
                  <Clock className="size-3" /> Próximo atendimento
                </p>
                {proximo ? (
                  <Link href={`/chamados/${proximo.id}`} className="hover:underline">
                    <span className="font-mono text-slate-500">{formatHora(proximo.dataProgramada!)}</span>{" "}
                    {proximo.cliente}
                  </Link>
                ) : (
                  <p className="text-slate-400">Sem próximo atendimento programado</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Truck className="size-3.5" /> {viatura ? viatura.nome : "Sem viatura"}
                </span>
                {(atual?.regiao ?? proximo?.regiao) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {atual?.regiao ?? proximo?.regiao}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
        {linhas.length === 0 && (
          <p className="text-sm text-slate-400">Nenhum colaborador encontrado.</p>
        )}
      </div>
    </div>
  );
}
