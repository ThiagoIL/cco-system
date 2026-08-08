import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { NovaViaturaForm } from "./nova-viatura-form";
import { updateViaturaStatus } from "./actions";
import { STATUS_VIATURA_LABEL, STATUS_VIATURA_COLOR } from "@/lib/labels";
import { Truck } from "lucide-react";

export default async function ViaturasPage() {
  const viaturas = await prisma.viatura.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="p-6">
      <RealtimeRefresher events={["viaturas:changed"]} />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Cadastro de Viaturas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {viaturas.length} viatura(s) ativa(s)
          </p>
        </div>
        <NovaViaturaForm />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {viaturas.map((v) => (
          <Card key={v.id} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-slate-400" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {v.nome}
                </span>
              </div>
              <Badge className={STATUS_VIATURA_COLOR[v.status]}>
                {STATUS_VIATURA_LABEL[v.status]}
              </Badge>
            </div>
            <form action={updateViaturaStatus.bind(null, v.id)}>
              <AutoSubmitSelect name="status" defaultValue={v.status}>
                {Object.entries(STATUS_VIATURA_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </AutoSubmitSelect>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
