import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { dashboardCounts } from "@/lib/data/chamados";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { AutoRefreshInterval } from "@/components/auto-refresh-interval";
import { STATUS_CHAMADO_LABEL, STATUS_COLABORADOR_LABEL } from "@/lib/labels";
import { formatHora } from "@/lib/utils";

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
      take: 12,
    }),
    prisma.colaborador.findMany({
      where: { status: { in: ["EM_ATENDIMENTO", "EM_DESLOCAMENTO"] }, ativo: true },
      include: {
        chamados: {
          where: { status: { in: ["EM_ATENDIMENTO", "EM_DESLOCAMENTO"] } },
          take: 1,
        },
      },
    }),
    prisma.pendencia.findMany({
      where: { status: "ABERTA", prazo: { lte: new Date(agora.getTime() + 2 * 60 * 60 * 1000) } },
      include: { chamado: true, responsavel: true },
      orderBy: { prazo: "asc" },
      take: 8,
    }),
  ]);

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
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase">Backlog</p>
          <p className="text-3xl font-bold text-red-400">{counts.backlog}</p>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-6 gap-4">
        <TvStat label="Recebidos hoje" value={counts.recebidosHoje} />
        <TvStat label="Concluídos hoje" value={counts.concluidosHoje} color="text-green-400" />
        <TvStat label="Pendentes" value={counts.pendentes} color="text-amber-400" />
        <TvStat label="SLA em risco" value={counts.slaRisco} color="text-amber-400" />
        <TvStat label="SLA vencido" value={counts.slaVencido} color="text-red-400" />
        <TvStat label="Retornos pend." value={counts.retornosPendentes} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <section className="col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-lg font-semibold">Programação do dia</h2>
          <div className="space-y-2">
            {programacaoHoje.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg bg-slate-800/60 px-4 py-2"
              >
                <span className="font-mono text-lg text-slate-300">
                  {c.dataProgramada ? formatHora(c.dataProgramada) : "--:--"}
                </span>
                <span className="flex-1 px-4 truncate">{c.cliente}</span>
                <span className="text-sm text-slate-400">{c.colaborador?.nome ?? "—"}</span>
                <span className="ml-4 text-sm text-slate-500">
                  {STATUS_CHAMADO_LABEL[c.status]}
                </span>
              </div>
            ))}
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
                <p className="font-medium">{c.nome}</p>
                <p className="text-xs text-slate-400">
                  {STATUS_COLABORADOR_LABEL[c.status]} · {c.chamados[0]?.cliente ?? "—"}
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
          {pendenciasCriticas.map((p) => (
            <div key={p.id} className="rounded-lg bg-slate-900/60 px-4 py-2">
              <p className="font-medium">
                #{p.chamado.numero} — {p.motivo}
              </p>
              <p className="text-xs text-slate-400">
                {p.responsavel.nome} · prazo {formatHora(p.prazo)}
              </p>
            </div>
          ))}
          {pendenciasCriticas.length === 0 && (
            <p className="text-slate-500">Nenhuma pendência crítica no momento.</p>
          )}
        </div>
      </section>
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
