import Link from "next/link";
import {
  PhoneIncoming,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  XCircle,
  UserCheck,
  Wrench,
  Layers,
  CircleDot,
  Truck,
  Car,
  Radio,
} from "lucide-react";
import { dashboardCounts } from "@/lib/data/chamados";
import { dashboardPainel } from "@/lib/data/dashboard";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SemaforoDot } from "@/components/semaforo-dot";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import {
  CLASSIFICACAO_COLOR,
  CLASSIFICACAO_LABEL,
  STATUS_CHAMADO_LABEL,
  STATUS_COLABORADOR_COLOR,
  STATUS_COLABORADOR_LABEL,
  STATUS_VIATURA_COLOR,
  STATUS_VIATURA_LABEL,
} from "@/lib/labels";
import { tempoRestanteSla } from "@/lib/sla";
import { SerieChart, StatusDonut } from "./dashboard-charts";

const STATUS_HEX: Record<string, string> = {
  NOVO: "#94a3b8",
  PROGRAMADO: "#6366f1",
  EM_DESLOCAMENTO: "#06b6d4",
  EM_ATENDIMENTO: "#3b82f6",
  PENDENTE_MATERIAL: "#f59e0b",
  PENDENTE_CLIENTE: "#f97316",
  RETORNO_PROGRAMADO: "#a855f7",
};

const CLASSIFICACAO_HEX: Record<string, string> = {
  P1: "bg-red-500",
  P2: "bg-orange-500",
  P3: "bg-yellow-400",
  P4: "bg-blue-500",
};

function Secao({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
      {children}
    </p>
  );
}

export default async function DashboardPage() {
  const [c, painel] = await Promise.all([dashboardCounts(), dashboardPainel()]);

  const donut = [...painel.porStatus.entries()].map(([status, valor]) => ({
    nome: STATUS_CHAMADO_LABEL[status],
    valor,
    cor: STATUS_HEX[status] ?? "#94a3b8",
  }));
  const totalAbertos = [...painel.porClassificacao.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="p-6">
      <RealtimeRefresher
        events={[
          "chamados:changed",
          "colaboradores:changed",
          "viaturas:changed",
          "pendencias:changed",
        ]}
      />
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Dashboard Operacional
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Visão em tempo real da operação
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
          <Radio className="size-3.5 animate-pulse" /> Ao vivo
        </span>
      </div>

      <Secao>Chamados</Secao>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Recebidos hoje" value={c.recebidosHoje} icon={PhoneIncoming} />
        <StatCard
          label="Concluídos hoje"
          value={c.concluidosHoje}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard label="Pendentes" value={c.pendentes} icon={Clock} tone="warning" />
        <StatCard
          label="Retornos pendentes"
          value={c.retornosPendentes}
          icon={RotateCcw}
          tone="warning"
        />
        <StatCard
          label="SLA em risco"
          value={c.slaRisco}
          icon={AlertTriangle}
          tone={c.slaRisco > 0 ? "warning" : "default"}
        />
        <StatCard
          label="SLA vencidos"
          value={c.slaVencido}
          icon={XCircle}
          tone={c.slaVencido > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Backlog operacional"
          value={c.backlog}
          icon={Layers}
          tone={c.backlog > 0 ? "danger" : "default"}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Fila de atenção"
            subtitle="Chamados em aberto mais urgentes (SLA vencido e em risco primeiro)"
            action={
              <Link href="/chamados" className="text-xs text-blue-600 hover:underline">
                Ver todos
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {painel.filaAtencao.map((ch) => (
                  <tr
                    key={ch.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-2">
                      <Link href={`/chamados/${ch.id}`} className="font-medium hover:underline">
                        #{ch.numero} {ch.cliente}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {ch.colaborador?.nome ?? "Sem técnico"} · {STATUS_CHAMADO_LABEL[ch.status]}
                      </p>
                    </td>
                    <td className="px-2 py-2">
                      <Badge className={CLASSIFICACAO_COLOR[ch.classificacao]}>
                        {ch.classificacao}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <SemaforoDot semaforo={ch.semaforo} />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {tempoRestanteSla(ch.prazoSla)}
                      </p>
                    </td>
                  </tr>
                ))}
                {painel.filaAtencao.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-400">
                      Nenhum chamado em aberto. Operação em dia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Chamados em aberto por status" />
          <div className="p-2">
            <StatusDonut data={donut} />
          </div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Últimos 7 dias" subtitle="Chamados recebidos × concluídos" />
          <div className="p-4">
            <SerieChart data={painel.serie} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Em aberto por prioridade" subtitle={`${totalAbertos} chamado(s)`} />
          <div className="space-y-3 p-4">
            {(["P1", "P2", "P3", "P4"] as const).map((p) => {
              const qtd = painel.porClassificacao.get(p) ?? 0;
              const pct = totalAbertos > 0 ? Math.round((qtd / totalAbertos) * 100) : 0;
              return (
                <div key={p}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {CLASSIFICACAO_LABEL[p]}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">{qtd}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${CLASSIFICACAO_HEX[p]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Secao>Técnicos</Secao>
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Disponíveis"
          value={c.tecnicosDisponiveis}
          icon={UserCheck}
          tone="success"
        />
        <StatCard label="Em atendimento" value={c.tecnicosEmAtendimento} icon={Wrench} />
        <StatCard
          label="Em deslocamento"
          value={c.tecnicosEmDeslocamento}
          icon={CircleDot}
        />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {painel.colaboradores.map((col) => (
          <div
            key={col.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {col.nome}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {col.chamados[0] ? col.chamados[0].cliente : "Sem atendimento em curso"}
              </p>
            </div>
            <Badge className={STATUS_COLABORADOR_COLOR[col.status]}>
              {STATUS_COLABORADOR_LABEL[col.status]}
            </Badge>
          </div>
        ))}
      </div>

      <Secao>Viaturas</Secao>
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Disponíveis"
          value={c.viaturasDisponiveis}
          icon={Truck}
          tone="success"
        />
        <StatCard label="Em uso" value={c.viaturasEmUso} icon={Car} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {painel.viaturas.map((v) => (
          <div
            key={v.id}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{v.nome}</p>
              <Badge className={STATUS_VIATURA_COLOR[v.status]}>
                {STATUS_VIATURA_LABEL[v.status]}
              </Badge>
            </div>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {v.chamados[0] ? v.chamados[0].cliente : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
