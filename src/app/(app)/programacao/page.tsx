import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { SemaforoDot } from "@/components/semaforo-dot";
import {
  CLASSIFICACAO_COLOR,
  CLASSIFICACAO_LABEL,
  STATUS_CHAMADO_LABEL,
  STATUS_CHAMADO_COLOR,
} from "@/lib/labels";
import { semaforoSla } from "@/lib/sla";
import { formatHora } from "@/lib/utils";
import { reatribuirChamado } from "./actions";

type Agrupamento = "tecnico" | "regiao" | "data";

function paramStr(v: string | string[] | undefined, fallback: string) {
  return Array.isArray(v) ? (v[0] ?? fallback) : (v ?? fallback);
}

export default async function ProgramacaoPage(props: PageProps<"/programacao">) {
  const searchParams = await props.searchParams;
  const dataStr = paramStr(searchParams?.data, format(new Date(), "yyyy-MM-dd"));
  const agrupar = paramStr(searchParams?.agrupar, "tecnico") as Agrupamento;

  const inicio = new Date(`${dataStr}T00:00:00`);
  const fim = new Date(`${dataStr}T23:59:59.999`);

  const [programados, naoProgramados, colaboradores, viaturas] = await Promise.all([
    prisma.chamado.findMany({
      where: { dataProgramada: { gte: inicio, lte: fim } },
      include: { colaborador: true, viatura: true },
      orderBy: { dataProgramada: "asc" },
    }),
    prisma.chamado.findMany({
      where: { dataProgramada: null, status: { notIn: ["CONCLUIDO"] } },
      include: { colaborador: true, viatura: true },
      orderBy: { dataAbertura: "asc" },
    }),
    prisma.colaborador.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.viatura.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const grupos = new Map<string, typeof programados>();
  for (const chamado of programados) {
    let chave = "Sem técnico";
    if (agrupar === "tecnico") chave = chamado.colaborador?.nome ?? "Sem técnico";
    if (agrupar === "regiao") chave = chamado.regiao ?? "Sem região";
    if (agrupar === "data") chave = dataStr;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(chamado);
  }

  return (
    <div className="p-6">
      <RealtimeRefresher events={["chamados:changed"]} />
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Programação Operacional
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Atendimentos programados por técnico, região e data
        </p>
      </div>

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <Input type="date" name="data" defaultValue={dataStr} className="max-w-[180px]" />
        <Select name="agrupar" defaultValue={agrupar} className="max-w-[220px]">
          <option value="tecnico">Visualizar por técnico</option>
          <option value="regiao">Visualizar por região</option>
          <option value="data">Visualizar por data (lista única)</option>
        </Select>
        <Button type="submit" variant="secondary">
          Aplicar
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...grupos.entries()].map(([chave, itens]) => (
          <Card key={chave}>
            <CardHeader title={chave} subtitle={`${itens.length} atendimento(s)`} />
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {itens.map((c) => {
                const semaforo = semaforoSla(c.prazoSla, c.slaClasse, c.dataConclusao);
                return (
                  <div key={c.id} className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/chamados/${c.id}`} className="text-sm font-medium hover:underline">
                        {c.dataProgramada ? formatHora(c.dataProgramada) : "--:--"} · #{c.numero}{" "}
                        {c.cliente}
                      </Link>
                      <SemaforoDot semaforo={semaforo} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={CLASSIFICACAO_COLOR[c.classificacao]}>
                        {CLASSIFICACAO_LABEL[c.classificacao]}
                      </Badge>
                      <Badge className={STATUS_CHAMADO_COLOR[c.status]}>
                        {STATUS_CHAMADO_LABEL[c.status]}
                      </Badge>
                    </div>
                    <form
                      action={reatribuirChamado.bind(null, c.id)}
                      className="grid grid-cols-2 gap-2"
                    >
                      <AutoSubmitSelect name="colaboradorId" defaultValue={c.colaboradorId ?? ""}>
                        <option value="">Sem técnico</option>
                        {colaboradores.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.nome}
                          </option>
                        ))}
                      </AutoSubmitSelect>
                      <AutoSubmitSelect name="viaturaId" defaultValue={c.viaturaId ?? ""}>
                        <option value="">Sem viatura</option>
                        {viaturas.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.nome}
                          </option>
                        ))}
                      </AutoSubmitSelect>
                    </form>
                  </div>
                );
              })}
              {itens.length === 0 && (
                <p className="p-3 text-sm text-slate-400">Nenhum atendimento.</p>
              )}
            </div>
          </Card>
        ))}
        {grupos.size === 0 && (
          <p className="text-sm text-slate-400">Nenhum atendimento programado para esta data.</p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Sem data programada ({naoProgramados.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-sm">
            <tbody>
              {naoProgramados.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-2">
                    <Link href={`/chamados/${c.id}`} className="hover:underline">
                      #{c.numero} — {c.cliente}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                    {c.regiao ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Badge className={STATUS_CHAMADO_COLOR[c.status]}>
                      {STATUS_CHAMADO_LABEL[c.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
              {naoProgramados.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-400">
                    Tudo programado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
