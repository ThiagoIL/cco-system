import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getChamadoById } from "@/lib/data/chamados";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Input, Label, Select } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { SemaforoDot } from "@/components/semaforo-dot";
import { ChamadoForm } from "../chamado-form";
import { updateChamado, deleteChamado } from "../actions";
import { createPendencia, resolverPendencia } from "../../pendencias/actions";
import { createRetorno } from "../../retornos/actions";
import {
  STATUS_PENDENCIA_LABEL,
  ORIGEM_LABEL,
  CLASSIFICACAO_LABEL,
} from "@/lib/labels";
import { formatDateHora } from "@/lib/utils";

export default async function ChamadoDetailPage(
  props: PageProps<"/chamados/[id]">
) {
  const { id } = await props.params;
  const [chamado, colaboradores, viaturas] = await Promise.all([
    getChamadoById(id),
    prisma.colaborador.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.viatura.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  if (!chamado) notFound();

  const updateAction = updateChamado.bind(null, id);
  const deleteAction = deleteChamado.bind(null, id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Link
        href="/chamados"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
      >
        <ArrowLeft className="size-4" /> Voltar para chamados
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Chamado #{chamado.numero} — {chamado.cliente}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {ORIGEM_LABEL[chamado.origem]} · {CLASSIFICACAO_LABEL[chamado.classificacao]} ·
            Aberto em {formatDateHora(chamado.dataAbertura)}
          </p>
        </div>
        <SemaforoDot semaforo={chamado.semaforo} />
      </div>

      <Card>
        <CardHeader title="Dados do chamado" />
        <div className="p-4">
          {/* A key faz o formulário remontar quando o chamado muda no servidor
              (ex.: um retorno reabre o chamado), evitando mostrar status antigo. */}
          <ChamadoForm
            key={`${chamado.status}-${chamado.updatedAt.getTime()}`}
            action={updateAction}
            colaboradores={colaboradores}
            viaturas={viaturas}
            chamado={chamado}
            submitLabel="Salvar alterações"
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Pendências"
          subtitle="Toda pendência deve ter responsável, motivo e prazo"
        />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {chamado.pendencias.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {p.motivo}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Responsável: {p.responsavel.nome} · Prazo: {formatDateHora(p.prazo)} ·
                  Previsto: {formatDateHora(p.dataPrevista)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    p.status === "ABERTA"
                      ? "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                  }
                >
                  {STATUS_PENDENCIA_LABEL[p.status]}
                </Badge>
                {p.status === "ABERTA" && (
                  <form action={resolverPendencia.bind(null, p.id, chamado.id)}>
                    <Button type="submit" variant="secondary">
                      Resolver
                    </Button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {chamado.pendencias.length === 0 && (
            <p className="p-4 text-sm text-slate-400">Nenhuma pendência registrada.</p>
          )}
        </div>
        <ActionForm action={createPendencia} resetOnSuccess className="grid grid-cols-1 gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 dark:border-slate-800">
          <input type="hidden" name="chamadoId" value={chamado.id} />
          <div className="sm:col-span-2">
            <Label htmlFor="p-motivo">Motivo</Label>
            <Input id="p-motivo" name="motivo" required />
          </div>
          <div>
            <Label htmlFor="p-responsavel">Responsável</Label>
            <Select id="p-responsavel" name="responsavelId" required defaultValue="">
              <option value="" disabled>
                Selecione...
              </option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="p-prazo">Prazo</Label>
            <Input id="p-prazo" name="prazo" type="datetime-local" required />
          </div>
          <div>
            <Label htmlFor="p-prevista">Data prevista</Label>
            <Input id="p-prevista" name="dataPrevista" type="datetime-local" required />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="secondary" className="w-full">
              Adicionar pendência
            </Button>
          </div>
        </ActionForm>
      </Card>

      <Card>
        <CardHeader title="Retornos" subtitle="Registro de retornos deste chamado" />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {chamado.retornos.map((r) => (
            <div key={r.id} className="p-4">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {r.motivo}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cliente: {r.cliente} · Equipe: {r.colaborador?.nome ?? "—"} ·{" "}
                {formatDateHora(r.data)}
              </p>
            </div>
          ))}
          {chamado.retornos.length === 0 && (
            <p className="p-4 text-sm text-slate-400">Nenhum retorno registrado.</p>
          )}
        </div>
        <ActionForm action={createRetorno} resetOnSuccess className="grid grid-cols-1 gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 dark:border-slate-800">
          <input type="hidden" name="chamadoId" value={chamado.id} />
          <div className="sm:col-span-2">
            <Label htmlFor="r-motivo">Motivo do retorno</Label>
            <Input id="r-motivo" name="motivo" required />
          </div>
          <div>
            <Label htmlFor="r-cliente">Cliente</Label>
            <Input id="r-cliente" name="cliente" defaultValue={chamado.cliente} required />
          </div>
          <div>
            <Label htmlFor="r-equipe">Equipe responsável</Label>
            <Select id="r-equipe" name="colaboradorId" defaultValue={chamado.colaboradorId ?? ""}>
              <option value="">Não atribuída</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="r-data">Data</Label>
            <Input id="r-data" name="data" type="datetime-local" required />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="secondary" className="w-full">
              Registrar retorno
            </Button>
          </div>
        </ActionForm>
      </Card>

      <form action={deleteAction} className="flex justify-end">
        <ConfirmButton
          type="submit"
          variant="danger"
          confirmText="Excluir este chamado permanentemente?"
        >
          Excluir chamado
        </ConfirmButton>
      </form>
    </div>
  );
}
