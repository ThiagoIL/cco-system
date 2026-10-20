import { indicadoresOperacao, indicadoresPorTecnico } from "@/lib/data/indicadores";
import { StatCard } from "@/components/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { ProdutividadeChart } from "./produtividade-chart";
import { CheckCircle2, RotateCcw, Layers, Gauge } from "lucide-react";

export default async function IndicadoresPage() {
  const [operacao, porTecnico] = await Promise.all([
    indicadoresOperacao(),
    indicadoresPorTecnico(),
  ]);

  return (
    <div className="p-6">
      <RealtimeRefresher
        events={["chamados:changed", "retornos:changed", "pendencias:changed"]}
      />
      <div className="mb-6">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Indicadores</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Últimos 30 dias · Operação, técnicos e visão de supervisão
        </p>
      </div>

      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        Operação
      </p>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="SLA cumprido"
          value={operacao.slaPercentual === null ? "—" : `${operacao.slaPercentual}%`}
          icon={Gauge}
          tone={
            operacao.slaPercentual === null
              ? "default"
              : operacao.slaPercentual >= 90
                ? "success"
                : "warning"
          }
        />
        <StatCard label="Backlog" value={operacao.backlog} icon={Layers} tone="danger" />
        <StatCard label="Retornos (30d)" value={operacao.retornos30d} icon={RotateCcw} />
        <StatCard
          label="Concluídos (30d)"
          value={operacao.concluidos30d}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Produtividade por técnico"
          subtitle="Ordens de serviço concluídas nos últimos 30 dias"
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
          title="Técnicos e Supervisão"
          subtitle="Produtividade, SLA da equipe e pendências por colaborador"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-4 py-2">Colaborador</th>
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
                  <td className="px-4 py-2">{t.osConcluidas}</td>
                  <td className="px-4 py-2">{t.tempoMedioHoras}h</td>
                  <td className="px-4 py-2">{t.horasProdutivas}h</td>
                  <td className="px-4 py-2">{t.retornosGerados}</td>
                  <td className="px-4 py-2">{t.pendenciasAbertas}</td>
                  <td className="px-4 py-2">
                    {t.slaPercentual === null ? "—" : `${t.slaPercentual}%`}
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
