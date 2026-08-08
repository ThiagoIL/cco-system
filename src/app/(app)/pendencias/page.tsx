import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { formatDateHora } from "@/lib/utils";
import { STATUS_PENDENCIA_LABEL } from "@/lib/labels";
import { resolverPendencia } from "./actions";

export default async function PendenciasPage() {
  const pendencias = await prisma.pendencia.findMany({
    include: { chamado: true, responsavel: true },
    orderBy: [{ status: "asc" }, { prazo: "asc" }],
  });

  const agora = new Date();

  return (
    <div className="p-6">
      <RealtimeRefresher events={["pendencias:changed"]} />
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Controle de Pendências
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Toda pendência exige responsável, motivo e prazo — nenhuma pendência fica sem dono.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-4 py-2">Chamado</th>
              <th className="px-4 py-2">Motivo</th>
              <th className="px-4 py-2">Responsável</th>
              <th className="px-4 py-2">Prazo</th>
              <th className="px-4 py-2">Data prevista</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {pendencias.map((p) => {
              const vencida = p.status === "ABERTA" && p.prazo < agora;
              return (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-2">
                    <Link href={`/chamados/${p.chamadoId}`} className="hover:underline">
                      #{p.chamado.numero} — {p.chamado.cliente}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{p.motivo}</td>
                  <td className="px-4 py-2">{p.responsavel.nome}</td>
                  <td className={`px-4 py-2 ${vencida ? "font-semibold text-red-600 dark:text-red-400" : ""}`}>
                    {formatDateHora(p.prazo)}
                  </td>
                  <td className="px-4 py-2">{formatDateHora(p.dataPrevista)}</td>
                  <td className="px-4 py-2">
                    <Badge
                      className={
                        p.status === "ABERTA"
                          ? "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                      }
                    >
                      {STATUS_PENDENCIA_LABEL[p.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    {p.status === "ABERTA" && (
                      <form action={resolverPendencia.bind(null, p.id, p.chamadoId)}>
                        <Button type="submit" variant="secondary">
                          Resolver
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {pendencias.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma pendência registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
