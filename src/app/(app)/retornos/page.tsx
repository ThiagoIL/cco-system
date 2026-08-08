import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { formatDateHora } from "@/lib/utils";

export default async function RetornosPage() {
  const retornos = await prisma.retorno.findMany({
    include: { chamado: true, colaborador: true },
    orderBy: { data: "desc" },
  });

  return (
    <div className="p-6">
      <RealtimeRefresher events={["retornos:changed"]} />
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Controle de Retornos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {retornos.length} retorno(s) registrado(s)
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-4 py-2">Chamado</th>
              <th className="px-4 py-2">Motivo</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Equipe responsável</th>
              <th className="px-4 py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {retornos.map((r) => (
              <tr
                key={r.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className="px-4 py-2">
                  <Link href={`/chamados/${r.chamadoId}`} className="hover:underline">
                    #{r.chamado.numero}
                  </Link>
                </td>
                <td className="px-4 py-2">{r.motivo}</td>
                <td className="px-4 py-2">{r.cliente}</td>
                <td className="px-4 py-2">{r.colaborador?.nome ?? "—"}</td>
                <td className="px-4 py-2">{formatDateHora(r.data)}</td>
              </tr>
            ))}
            {retornos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Nenhum retorno registrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
