import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Gauge,
  Layers,
  RotateCcw,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import {
  PERIODOS,
  indicadoresOperacao,
  indicadoresPorEquipe,
  indicadoresPorTecnico,
} from "@/lib/data/indicadores";
import { SLA_HORAS } from "@/lib/sla";
import { TIPO_COLABORADOR_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { ProdutividadeChart } from "./produtividade-chart";

const pct = (v: number | null) => (v === null ? "—" : `${v}%`);

function toneSla(v: number | null): "default" | "success" | "warning" | "danger" {
  if (v === null) return "default";
  return v >= 90 ? "success" : v >= 70 ? "warning" : "danger";
}

const COR_SLA = {
  default: "text-slate-400",
  success: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
};

function Secao({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
      {children}
    </p>
  );
}

export default async function IndicadoresPage(props: PageProps<"/indicadores">) {
  const searchParams = await props.searchParams;
  const param = Number(Array.isArray(searchParams?.dias) ? searchParams?.dias[0] : searchParams?.dias);
  const dias = (PERIODOS as readonly number[]).includes(param) ? param : 30;

  const [operacao, porTecnico] = await Promise.all([
    indicadoresOperacao(dias),
    indicadoresPorTecnico(dias),
  ]);
  const porEquipe = indicadoresPorEquipe(porTecnico);

  return (
    <div className="p-6">
      <RealtimeRefresher
        events={["chamados:changed", "retornos:changed", "pendencias:changed"]}
      />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Indicadores</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Últimos {dias} dias · Operação, técnicos e visão de supervisão
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
          {PERIODOS.map((p) => (
            <Link
              key={p}
              href={`/indicadores?dias=${p}`}
              className={cn(
                "rounded-md px-3 py-1 text-sm",
                p === dias
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              {p} dias
            </Link>
          ))}
        </div>
      </div>

      <Secao>Operação</Secao>
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="SLA cumprido"
          value={pct(operacao.slaPercentual)}
          icon={Gauge}
          tone={toneSla(operacao.slaPercentual)}
        />
        <StatCard label="Backlog" value={operacao.backlog} icon={Layers} tone="danger" />
        <StatCard label="Retornos" value={operacao.retornos} icon={RotateCcw} />
        <StatCard
          label="Concluídos"
          value={operacao.concluidos}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard label="Produtividade (OS/dia)" value={operacao.osPorDia} icon={TrendingUp} />
        <StatCard label="Tempo médio (h)" value={`${operacao.tempoMedioHoras}h`} icon={Clock} />
        <StatCard label="Taxa de retorno" value={pct(operacao.taxaRetorno)} icon={RotateCcw} tone="warning" />
        <StatCard
          label="Pendências abertas"
          value={operacao.pendenciasAbertas}
          icon={ClipboardList}
          tone="warning"
        />
      </div>

      <Card className="mb-8">
        <CardHeader title="SLA por classe" subtitle="Chamados concluídos dentro do prazo, por classe de SLA" />
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
          {operacao.porClasse.map((c) => (
            <div key={c.classe} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Classe {c.classe} · até {SLA_HORAS[c.classe]}h
              </p>
              <p className={cn("text-2xl font-bold", COR_SLA[toneSla(c.slaPercentual)])}>
                {pct(c.slaPercentual)}
              </p>
              <p className="text-xs text-slate-400">{c.total} concluído(s)</p>
            </div>
          ))}
        </div>
      </Card>

      <Secao>Supervisores — equipes</Secao>
      <Card className="mb-8">
        <CardHeader
          title="Produtividade e SLA por equipe"
          subtitle="Visão consolidada para supervisão: produtividade da equipe, SLA da equipe e pendências"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-4 py-2">Equipe</th>
                <th className="px-4 py-2">Membros</th>
                <th className="px-4 py-2">OS concluídas</th>
                <th className="px-4 py-2">OS por membro</th>
                <th className="px-4 py-2">SLA da equipe</th>
                <th className="px-4 py-2">Tempo médio</th>
                <th className="px-4 py-2">Retornos</th>
                <th className="px-4 py-2">Pendências abertas</th>
              </tr>
            </thead>
            <tbody>
              {porEquipe.map((e) => (
                <tr key={e.tipo} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-2 font-medium">{TIPO_COLABORADOR_LABEL[e.tipo]}</td>
                  <td className="px-4 py-2">{e.membros}</td>
                  <td className="px-4 py-2">{e.osConcluidas}</td>
                  <td className="px-4 py-2">{e.osPorMembro}</td>
                  <td className={cn("px-4 py-2 font-semibold", COR_SLA[toneSla(e.slaPercentual)])}>
                    {pct(e.slaPercentual)}
                  </td>
                  <td className="px-4 py-2">{e.tempoMedioHoras}h</td>
                  <td className="px-4 py-2">{e.retornosGerados}</td>
                  <td className="px-4 py-2">{e.pendenciasAbertas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Secao>Técnicos</Secao>
      <Card className="mb-6">
        <CardHeader
          title="Produtividade por técnico"
          subtitle={`Ordens de serviço concluídas nos últimos ${dias} dias`}
        />
        <div className="p-4">
          <ProdutividadeChart
            data={porTecnico.map((t) => ({
              nome: t.colaborador.nome,
              osConcluidas: t.osConcluidas,
            }))}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Desempenho individual"
          subtitle="OS concluídas, tempo médio, horas produtivas, retornos gerados e SLA por colaborador"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-4 py-2">Colaborador</th>
                <th className="px-4 py-2">Equipe</th>
                <th className="px-4 py-2">OS concluídas</th>
                <th className="px-4 py-2">Tempo médio (h)</th>
                <th className="px-4 py-2">Horas produtivas</th>
                <th className="px-4 py-2">Retornos gerados</th>
                <th className="px-4 py-2">Pendências abertas</th>
                <th className="px-4 py-2">SLA cumprido</th>
              </tr>
            </thead>
            <tbody>
              {porTecnico.map((t) => (
                <tr
                  key={t.colaborador.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="px-4 py-2 font-medium">{t.colaborador.nome}</td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                    {TIPO_COLABORADOR_LABEL[t.colaborador.tipo]}
                  </td>
                  <td className="px-4 py-2">{t.osConcluidas}</td>
                  <td className="px-4 py-2">{t.tempoMedioHoras}h</td>
                  <td className="px-4 py-2">{t.horasProdutivas}h</td>
                  <td className="px-4 py-2">{t.retornosGerados}</td>
                  <td className="px-4 py-2">{t.pendenciasAbertas}</td>
                  <td className={cn("px-4 py-2 font-semibold", COR_SLA[toneSla(t.slaPercentual)])}>
                    {pct(t.slaPercentual)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
