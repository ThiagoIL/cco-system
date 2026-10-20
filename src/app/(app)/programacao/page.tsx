import Link from "next/link";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { TIPO_COLABORADOR_LABEL } from "@/lib/labels";
import { semaforoSla, tempoRestanteSla } from "@/lib/sla";
import { ProgramacaoBoard } from "./board";
import type { CardChamado, ColunaBoard, VisaoProgramacao } from "./types";

const VISOES: { valor: VisaoProgramacao; label: string }[] = [
  { valor: "tecnico", label: "Por técnico" },
  { valor: "equipe", label: "Por equipe" },
  { valor: "regiao", label: "Por região" },
  { valor: "data", label: "Por data (semana)" },
];

const ORDEM_TIPO = ["TECNICO", "TI", "AJUDANTE", "ESTAGIARIO"] as const;
const TITULO_EQUIPE: Record<string, string> = {
  TECNICO: "Técnicos",
  TI: "TI",
  AJUDANTE: "Ajudantes",
  ESTAGIARIO: "Estagiários",
};

function paramStr(v: string | string[] | undefined, fallback: string) {
  return Array.isArray(v) ? (v[0] ?? fallback) : (v ?? fallback);
}

function diaValido(dia: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dia) && !Number.isNaN(new Date(`${dia}T00:00:00`).getTime());
}

export default async function ProgramacaoPage(props: PageProps<"/programacao">) {
  const searchParams = await props.searchParams;
  const hoje = format(new Date(), "yyyy-MM-dd");
  const diaParam = paramStr(searchParams?.data, hoje);
  const dia = diaValido(diaParam) ? diaParam : hoje;
  const visaoParam = paramStr(searchParams?.visao, "tecnico");
  const visao = (VISOES.some((v) => v.valor === visaoParam) ? visaoParam : "tecnico") as VisaoProgramacao;

  const inicio = new Date(`${dia}T00:00:00`);
  const fim = addDays(inicio, visao === "data" ? 7 : 1);
  const agora = new Date();

  const [programados, semData, colaboradores, viaturas] = await Promise.all([
    prisma.chamado.findMany({
      where: { dataProgramada: { gte: inicio, lt: fim } },
      include: { colaborador: true },
      orderBy: { dataProgramada: "asc" },
    }),
    prisma.chamado.findMany({
      where: { dataProgramada: null, status: { not: "CONCLUIDO" } },
      include: { colaborador: true },
      orderBy: { dataAbertura: "asc" },
    }),
    prisma.colaborador.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.viatura.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const toCard = (c: (typeof programados)[number]): CardChamado => ({
    id: c.id,
    numero: c.numero,
    cliente: c.cliente,
    regiao: c.regiao,
    classificacao: c.classificacao,
    status: c.status,
    concluido: c.status === "CONCLUIDO",
    hora: c.dataProgramada ? format(c.dataProgramada, "HH:mm") : null,
    semaforo: semaforoSla(c.prazoSla, c.slaClasse, c.dataConclusao, agora),
    tempoSla: tempoRestanteSla(c.prazoSla, c.dataConclusao, agora),
    colaboradorNome: c.colaborador?.nome ?? null,
    viaturaId: c.viaturaId,
  });

  const cardsProgramados = programados.map(toCard);
  const colunaSemData: ColunaBoard = {
    chave: "backlog",
    titulo: "Sem data programada",
    subtitulo: "Arraste para programar",
    destaque: true,
    aceitaDrop: visao === "data",
    cards: semData.map(toCard),
  };

  let colunas: ColunaBoard[];

  if (visao === "tecnico") {
    const porColaborador = (id: string | null) =>
      programados.filter((c) => c.colaboradorId === id).map(toCard);
    const ordenados = [...colaboradores].sort(
      (a, b) =>
        ORDEM_TIPO.indexOf(a.tipo as (typeof ORDEM_TIPO)[number]) -
          ORDEM_TIPO.indexOf(b.tipo as (typeof ORDEM_TIPO)[number]) || a.nome.localeCompare(b.nome)
    );
    colunas = [
      colunaSemData,
      { chave: "none", titulo: "Sem técnico", aceitaDrop: true, cards: porColaborador(null) },
      ...ordenados.map((col) => ({
        chave: col.id,
        titulo: col.nome,
        subtitulo:
          TIPO_COLABORADOR_LABEL[col.tipo] + (col.status === "FOLGA" ? " · Folga" : ""),
        aceitaDrop: true,
        cards: porColaborador(col.id),
      })),
    ];
  } else if (visao === "equipe") {
    const tipoDe = new Map(colaboradores.map((c) => [c.id, c.tipo]));
    const grupos = ORDEM_TIPO.map((tipo) => {
      const membros = colaboradores.filter((c) => c.tipo === tipo).map((c) => c.nome);
      return {
        chave: tipo,
        titulo: TITULO_EQUIPE[tipo],
        subtitulo: membros.length ? membros.join(", ") : "Sem membros",
        aceitaDrop: false,
        cards: programados
          .filter((c) => c.colaboradorId && tipoDe.get(c.colaboradorId) === tipo)
          .map(toCard),
      };
    });
    colunas = [
      colunaSemData,
      {
        chave: "none",
        titulo: "Sem técnico",
        aceitaDrop: false,
        cards: programados.filter((c) => !c.colaboradorId).map(toCard),
      },
      ...grupos,
    ];
  } else if (visao === "regiao") {
    const regioes = [...new Set(programados.map((c) => c.regiao).filter((r): r is string => !!r))].sort();
    colunas = [
      colunaSemData,
      {
        chave: "none",
        titulo: "Sem região",
        aceitaDrop: true,
        cards: cardsProgramados.filter((c) => !c.regiao),
      },
      ...regioes.map((regiao) => ({
        chave: regiao,
        titulo: regiao,
        aceitaDrop: true,
        cards: cardsProgramados.filter((c) => c.regiao === regiao),
      })),
    ];
  } else {
    colunas = [
      colunaSemData,
      ...Array.from({ length: 7 }, (_, i) => {
        const d = addDays(inicio, i);
        const chave = format(d, "yyyy-MM-dd");
        return {
          chave,
          titulo: format(d, "EEE dd/MM", { locale: ptBR }),
          subtitulo: chave === hoje ? "Hoje" : undefined,
          aceitaDrop: true,
          cards: programados.filter((c) => format(c.dataProgramada!, "yyyy-MM-dd") === chave).map(toCard),
        };
      }),
    ];
  }

  const passo = visao === "data" ? 7 : 1;
  const hrefDia = (d: string) => `/programacao?data=${d}&visao=${visao}`;
  const titulo =
    visao === "data"
      ? `${format(inicio, "dd/MM")} a ${format(addDays(inicio, 6), "dd/MM/yyyy")}`
      : format(inicio, "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="p-6">
      <RealtimeRefresher events={["chamados:changed"]} />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Programação Operacional
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-block first-letter:uppercase">{titulo}</span> ·{" "}
            {visao === "equipe"
              ? "visualização somente leitura"
              : "arraste os atendimentos entre as colunas"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={hrefDia(format(addDays(inicio, -passo), "yyyy-MM-dd"))}
            className="rounded-lg border border-slate-300 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            aria-label="Período anterior"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={hrefDia(hoje)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Hoje
          </Link>
          <Link
            href={hrefDia(format(addDays(inicio, passo), "yyyy-MM-dd"))}
            className="rounded-lg border border-slate-300 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            aria-label="Próximo período"
          >
            <ChevronRight className="size-4" />
          </Link>
          <form className="flex flex-wrap gap-2" method="get">
            <Input type="date" name="data" defaultValue={dia} className="w-40" />
            <Select name="visao" defaultValue={visao} className="w-48">
              {VISOES.map((v) => (
                <option key={v.valor} value={v.valor}>
                  {v.label}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Aplicar
            </Button>
          </form>
        </div>
      </div>

      <ProgramacaoBoard
        key={`${visao}-${dia}`}
        colunas={colunas}
        visao={visao}
        dia={dia}
        viaturas={viaturas.map((v) => ({ id: v.id, nome: v.nome }))}
      />
    </div>
  );
}
