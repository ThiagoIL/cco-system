import {
  PhoneIncoming,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  XCircle,
  UserCheck,
  Wrench,
  Truck,
  CircleDot,
  Car,
  Layers,
} from "lucide-react";
import { dashboardCounts } from "@/lib/data/chamados";
import { StatCard } from "@/components/stat-card";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export default async function DashboardPage() {
  const c = await dashboardCounts();

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
      <div className="mb-6">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Dashboard Operacional
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Visão em tempo real da operação
        </p>
      </div>

      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        Chamados
      </p>
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
          tone="warning"
        />
        <StatCard label="SLA vencidos" value={c.slaVencido} icon={XCircle} tone="danger" />
        <StatCard label="Backlog operacional" value={c.backlog} icon={Layers} tone="danger" />
      </div>

      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        Técnicos
      </p>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
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

      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        Viaturas
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Disponíveis"
          value={c.viaturasDisponiveis}
          icon={Truck}
          tone="success"
        />
        <StatCard label="Em uso" value={c.viaturasEmUso} icon={Car} />
      </div>
    </div>
  );
}
