import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/card";
import { ChamadoForm } from "../chamado-form";
import { createChamado } from "../actions";

export default async function NovoChamadoPage() {
  const [colaboradores, viaturas] = await Promise.all([
    prisma.colaborador.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.viatura.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link
        href="/chamados"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
      >
        <ArrowLeft className="size-4" /> Voltar para chamados
      </Link>
      <Card>
        <CardHeader title="Novo chamado" subtitle="Registrar um novo atendimento" />
        <div className="p-4">
          <ChamadoForm
            action={createChamado}
            colaboradores={colaboradores}
            viaturas={viaturas}
            submitLabel="Criar chamado"
          />
        </div>
      </Card>
    </div>
  );
}
