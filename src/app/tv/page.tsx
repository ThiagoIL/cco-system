import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { dashboardCounts } from "@/lib/data/chamados";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { AutoRefreshInterval } from "@/components/auto-refresh-interval";
import { TvClock } from "@/components/tv-clock";
import {
  CLASSIFICACAO_LABEL,
  SEMAFORO_COLOR,
  STATUS_CHAMADO_LABEL,
  STATUS_COLABORADOR_LABEL,
} from "@/lib/labels";
import { semaforoSla, tempoRestanteSla } from "@/lib/sla";
import { formatHora, cn } from "@/lib/utils";

// Sempre renderizado sob demanda: as páginas leem o banco e a sessão a cada
// requisição, então não devem ser pré-renderizadas durante o `next build`.
export const dynamic = "force-dynamic";

export default async function PainelTvPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);
  const fimHoje = new Date();
  fimHoje.setHours(23, 59, 59, 999);
  const agora = new Date();

  const [counts, programacaoHoje, emCampo, pendenciasCriticas] = await Promise.all([
    dashboardCounts(),
    prisma.chamado.findMany({
      where: { dataProgramada: { gte: inicioHoje, lte: fimHoje } },
      include: { colaborador: true, viatura: true },
      orderBy: { dataProgramada: "asc" },
      take: 14,
    }),
    prisma.colaborador.findMany({
      where: { status: { in: ["EM_ATENDIMENTO", "EM_DESLOCAMENTO"] }, ativo: true },
      orderBy: { nome: "asc" },
      include: {
        chamados: {
          where: { status: { in: ["EM_ATENDIMENTO", "EM_DESLOCAMENTO"] } },
          include: { viatura: true },
          take: 1,
        },
      },
    }),
    // Críticas = em aberto e vencidas ou vencendo nas próximas 2h.
    prisma.pendencia.findMany({
      where: { status: "ABERTA", prazo: { lte: new Date(agora.getTime() + 2 * 60 * 60 * 1000) } },
      include: { chamado: true, responsavel: true },
      orderBy: { prazo: "asc" },
      take: 8,
    }),
  ]);

  const slaVerde = Math.max(counts.pendentes - counts.slaRisco - counts.slaVencido, 0);

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <RealtimeRefresher
        events={["chamados:changed", "colaboradores:changed", "pendencias:changed", "viaturas:changed"]}
      />
      <AutoRefreshInterval seconds={60} />

      <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <p className="text-sm font-semibold tracking-widest text-slate-500 uppercase">
            RCOND / REDETEL
          </p>
          <h1 className="text-3xl font-bold">Centro de Controle Operacional</h1>
        </div>
        <TvClock />
      </header>

      <div className="mb-6 grid grid-cols-7 gap-4">
        <TvStat label="Recebidos hoje" value={counts.recebidosHoje} />
        <TvStat label="Concluídos hoje" value={counts.concluidosHoje} color="text-green-400" />
        <TvStat label="Pendentes" value={counts.pendentes} color="text-amber-400" />
        <TvStat label="Retornos pend." value={counts.retornosPendentes} color="text-amber-400" />
        <TvStat label="SLA em risco" value={counts.slaRisco} color="text-amber-400" />
        <TvStat label="SLA vencido" value={counts.slaVencido} color="text-red-400" />
        <TvStat label="Backlog" value={counts.backlog} color="text-red-400" />
      </div>

      <div className="mb-6 flex items-center gap-6 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3">
        <p className="text-sm font-semibold tracking-wide text-slate-400 uppercase">SLA em aberto</p>
        <SlaChip cor="bg-green-500" label="No prazo" valor={slaVerde} />
        <SlaChip cor="bg-yellow-400" label="Em risco" valor={counts.slaRisco} />
        <SlaChip cor="bg-red-500" label="Vencido" valor={counts.slaVencido} />
        <div className="ml-auto flex gap-6 text-sm text-slate-400">
          <span>
            Técnicos: <b className="text-green-400">{counts.tecnicosDisponiveis}</b> disp. ·{" "}
            <b className="text-blue-400">{counts.tecnicosEmAtendimento}</b> atend. ·{" "}
            <b className="text-cyan-400">{counts.tecnicosEmDeslocamento}</b> desloc.
          </span>
          <span>
            Viaturas: <b className="text-green-400">{counts.viaturasDisponiveis}</b> disp. ·{" "}
            <b className="text-blue-400">{counts.viaturasEmUso}</b> em uso
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <section className="col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-lg font-semibold">Programação do dia</h2>
          <div className="space-y-2">
            {programacaoHoje.map((c) => {
              const semaforo = semaforoSla(c.prazoSla, c.slaClasse, c.dataConclusao, agora);
              const concluido = c.status === "CONCLUIDO";
              return (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center gap-4 rounded-lg bg-slate-800/60 px-4 py-2",
                    concluido && "opacity-50"
                  )}
                >
                  <span className="font-mono text-lg text-slate-300">
                    {c.dataProgramada ? formatHora(c.dataProgramada) : "--:--"}
                  </span>
                  <span className={cn("size-3 shrink-0 rounded-full", SEMAFORO_COLOR[semaforo])} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate", concluido && "line-through")}>
                      {c.classificacao === "P1" && (
                        <span className="mr-2 rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold">
                          P1
                        </span>
                      )}
                      {c.cliente}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {tempoRestanteSla(c.prazoSla, c.dataConclusao, agora)}
                      {c.regiao ? ` · ${c.regiao}` : ""}
                    </p>
                  </div>
                  <span className="text-sm text-slate-400">
                    {c.colaborador?.nome ?? "—"}
                    {c.viatura ? ` · ${c.viatura.nome}` : ""}
                  </span>
                  <span className="w-36 text-right text-sm text-slate-500">
                    {STATUS_CHAMADO_LABEL[c.status]}
                  </span>
                </div>
              );
            })}
            {programacaoHoje.length === 0 && (
              <p className="text-slate-500">Nenhum atendimento programado para hoje.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-lg font-semibold">Equipes em campo</h2>
          <div className="space-y-2">
            {emCampo.map((c) => (
              <div key={c.id} className="rounded-lg bg-slate-800/60 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{c.nome}</p>
                  <span
                    className={cn(
                      "text-xs",
                      c.status === "EM_ATENDIMENTO" ? "text-blue-400" : "text-cyan-400"
                    )}
                  >
                    {STATUS_COLABORADOR_LABEL[c.status]}
                  </span>
                </div>
                <p className="truncate text-xs text-slate-400">
                  {c.chamados[0]?.cliente ?? "—"}
                  {c.chamados[0]?.viatura ? ` · ${c.chamados[0].viatura.nome}` : ""}
                </p>
              </div>
            ))}
            {emCampo.length === 0 && (
              <p className="text-slate-500">Nenhuma equipe em campo agora.</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-red-900/50 bg-red-950/20 p-5">
        <h2 className="mb-3 text-lg font-semibold text-red-300">Pendências críticas</h2>
        <div className="grid grid-cols-2 gap-3">
          {pendenciasCriticas.map((p) => {
            const vencida = p.prazo < agora;
            return (
              <div key={p.id} className="rounded-lg bg-slate-900/60 px-4 py-2">
                <p className="font-medium">
                  #{p.chamado.numero} — {p.motivo}
                  <span className="ml-2 text-xs text-slate-500">
                    {CLASSIFICACAO_LABEL[p.chamado.classificacao]}
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  {p.responsavel.nome} · prazo {formatHora(p.prazo)}
                  {vencida && <span className="ml-2 font-semibold text-red-400">VENCIDA</span>}
                </p>
              </div>
            );
          })}
          {pendenciasCriticas.length === 0 && (
            <p className="text-slate-500">Nenhuma pendência crítica no momento.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SlaChip({ cor, label, valor }: { cor: string; label: string; valor: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-3.5 rounded-full", cor)} />
      <span className="text-2xl font-bold">{valor}</span>
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  );
}

function TvStat({
  label,
  value,
  color = "text-slate-100",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
      <p className="text-xs text-slate-500 uppercase">{label}</p>
      <p className={`text-4xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
