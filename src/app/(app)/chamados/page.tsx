import Link from "next/link";
import { Plus } from "lucide-react";
import { listChamados } from "@/lib/data/chamados";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { SemaforoDot } from "@/components/semaforo-dot";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import {
  ORIGEM_LABEL,
  CLASSIFICACAO_LABEL,
  CLASSIFICACAO_COLOR,
  STATUS_CHAMADO_LABEL,
  STATUS_CHAMADO_COLOR,
} from "@/lib/labels";
import { formatDateHora } from "@/lib/utils";
import type { StatusChamado } from "@/generated/prisma/enums";

export default async function ChamadosPage(props: PageProps<"/chamados">) {
  const searchParams = await props.searchParams;
  const statusParam = searchParams?.status;
  const busca = Array.isArray(searchParams?.busca)
    ? searchParams?.busca[0]
    : (searchParams?.busca ?? "");
  const status = Array.isArray(statusParam) ? statusParam[0] : statusParam;

  const chamados = await listChamados({
    status: status ? [status as StatusChamado] : undefined,
    busca: busca || undefined,
  });

  return (
    <div className="p-6">
      <RealtimeRefresher events={["chamados:changed"]} />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Controle de Chamados
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {chamados.length} chamado(s)
          </p>
        </div>
        <Link href="/chamados/novo">
          <Button>
            <Plus className="size-4" /> Novo chamado
          </Button>
        </Link>
      </div>

      <form className="mb-4 flex flex-wrap gap-3" method="get">
        <Input
          name="busca"
          placeholder="Buscar por cliente, região ou endereço..."
          defaultValue={busca}
          className="max-w-xs"
        />
        <Select name="status" defaultValue={status ?? ""} className="max-w-xs">
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CHAMADO_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">Origem</th>
              <th className="px-4 py-2">Classificação</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">SLA</th>
              <th className="px-4 py-2">Técnico</th>
              <th className="px-4 py-2">Viatura</th>
              <th className="px-4 py-2">Abertura</th>
            </tr>
          </thead>
          <tbody>
            {chamados.map((c) => (
              <tr
                key={c.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                <td className="px-4 py-2">
                  <Link href={`/chamados/${c.id}`} className="font-medium hover:underline">
                    #{c.numero}
                  </Link>
                </td>
                <td className="px-4 py-2">{c.cliente}</td>
                <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                  {ORIGEM_LABEL[c.origem]}
                </td>
                <td className="px-4 py-2">
                  <Badge className={CLASSIFICACAO_COLOR[c.classificacao]}>
                    {CLASSIFICACAO_LABEL[c.classificacao]}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <Badge className={STATUS_CHAMADO_COLOR[c.status]}>
                    {STATUS_CHAMADO_LABEL[c.status]}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <SemaforoDot semaforo={c.semaforo} />
                </td>
                <td className="px-4 py-2">{c.colaborador?.nome ?? "—"}</td>
                <td className="px-4 py-2">{c.viatura?.nome ?? "—"}</td>
                <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                  {formatDateHora(c.dataAbertura)}
                </td>
              </tr>
            ))}
            {chamados.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  Nenhum chamado encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
