"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { GripVertical, MapPin, Truck, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CLASSIFICACAO_COLOR,
  SEMAFORO_COLOR,
  STATUS_CHAMADO_COLOR,
  STATUS_CHAMADO_LABEL,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import { moverChamado, type MovimentoChamado } from "./actions";
import type { CardChamado, ColunaBoard, VisaoProgramacao } from "./types";

const BORDA_PRIORIDADE: Record<string, string> = {
  P1: "border-l-red-500",
  P2: "border-l-orange-500",
  P3: "border-l-yellow-400",
  P4: "border-l-blue-500",
};

function moverCard(colunas: ColunaBoard[], cardId: string, destino: string): ColunaBoard[] {
  let card: CardChamado | undefined;
  for (const col of colunas) card ??= col.cards.find((c) => c.id === cardId);
  if (!card) return colunas;
  const movido = card;
  return colunas.map((col) => {
    const semCard = col.cards.filter((c) => c.id !== cardId);
    return col.chave === destino ? { ...col, cards: [...semCard, movido] } : { ...col, cards: semCard };
  });
}

function montarMovimento(
  visao: VisaoProgramacao,
  chave: string,
  dia: string
): MovimentoChamado | null {
  if (visao === "tecnico") return { tipo: "colaborador", valor: chave === "none" ? "" : chave, dia };
  if (visao === "regiao") return { tipo: "regiao", valor: chave === "none" ? "" : chave };
  if (visao === "data") return { tipo: "data", valor: chave === "backlog" ? "" : chave };
  return null;
}

export function ProgramacaoBoard({
  colunas,
  visao,
  dia,
  viaturas,
}: {
  colunas: ColunaBoard[];
  visao: VisaoProgramacao;
  dia: string;
  viaturas: { id: string; nome: string }[];
}) {
  const [optimistic, aplicarMovimento] = useOptimistic(
    colunas,
    (estado, m: { cardId: string; destino?: string; viaturaId?: string | null }) => {
      if (m.destino) return moverCard(estado, m.cardId, m.destino);
      return estado.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === m.cardId ? { ...c, viaturaId: m.viaturaId ?? null } : c
        ),
      }));
    }
  );
  const [, startTransition] = useTransition();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function executar(
    id: string,
    movimento: MovimentoChamado,
    otimista: { destino?: string; viaturaId?: string | null }
  ) {
    setErro(null);
    startTransition(async () => {
      aplicarMovimento({ cardId: id, ...otimista });
      const resultado = await moverChamado(id, movimento);
      if (resultado?.error) setErro(resultado.error);
    });
  }

  function soltar(coluna: ColunaBoard) {
    const id = arrastando;
    setArrastando(null);
    setSobre(null);
    if (!id || !coluna.aceitaDrop) return;
    const origem = optimistic.find((c) => c.cards.some((card) => card.id === id));
    if (origem?.chave === coluna.chave) return;
    const movimento = montarMovimento(visao, coluna.chave, dia);
    if (movimento) executar(id, movimento, { destino: coluna.chave });
  }

  const arrastavel = visao !== "equipe";

  return (
    <div>
      {erro && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {erro}
        </p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {optimistic.map((coluna) => (
          <section
            key={coluna.chave}
            data-coluna={coluna.chave}
            onDragOver={(e) => {
              if (!coluna.aceitaDrop || !arrastando) return;
              e.preventDefault();
              setSobre(coluna.chave);
            }}
            onDragLeave={() => setSobre((atual) => (atual === coluna.chave ? null : atual))}
            onDrop={(e) => {
              e.preventDefault();
              soltar(coluna);
            }}
            className={cn(
              "flex max-h-[70vh] w-72 shrink-0 flex-col rounded-xl border bg-slate-100/70 dark:bg-slate-900/60",
              coluna.destaque
                ? "border-dashed border-slate-300 dark:border-slate-700"
                : "border-slate-200 dark:border-slate-800",
              sobre === coluna.chave &&
                "border-blue-500 bg-blue-50 ring-2 ring-blue-300 dark:bg-blue-950/40"
            )}
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {coluna.titulo}
                </h3>
                {coluna.subtitulo && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {coluna.subtitulo}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {coluna.cards.length}
              </span>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {coluna.cards.map((card) => (
                <article
                  key={card.id}
                  data-card={card.id}
                  draggable={arrastavel && !card.concluido}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", card.id);
                    setArrastando(card.id);
                  }}
                  onDragEnd={() => {
                    setArrastando(null);
                    setSobre(null);
                  }}
                  className={cn(
                    "rounded-lg border border-l-4 border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900",
                    BORDA_PRIORIDADE[card.classificacao],
                    arrastavel && !card.concluido && "cursor-grab active:cursor-grabbing",
                    card.concluido && "opacity-60",
                    arrastando === card.id && "opacity-40"
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    {arrastavel && !card.concluido && (
                      <GripVertical className="mt-0.5 size-4 shrink-0 text-slate-300" />
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/chamados/${card.id}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {card.hora && (
                          <span className="mr-1 font-mono text-slate-500">{card.hora}</span>
                        )}
                        #{card.numero} {card.cliente}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge className={CLASSIFICACAO_COLOR[card.classificacao]}>
                          {card.classificacao}
                        </Badge>
                        <Badge className={STATUS_CHAMADO_COLOR[card.status]}>
                          {STATUS_CHAMADO_LABEL[card.status]}
                        </Badge>
                      </div>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className={cn("size-2 rounded-full", SEMAFORO_COLOR[card.semaforo])} />
                        {card.tempoSla}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                        {card.regiao && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" /> {card.regiao}
                          </span>
                        )}
                        {visao !== "tecnico" && (
                          <span className="flex items-center gap-1">
                            <User className="size-3" /> {card.colaboradorNome ?? "Sem técnico"}
                          </span>
                        )}
                      </div>
                      <label className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Truck className="size-3 shrink-0" />
                        <select
                          value={card.viaturaId ?? ""}
                          onChange={(e) =>
                            executar(
                              card.id,
                              { tipo: "viatura", valor: e.target.value },
                              { viaturaId: e.target.value || null }
                            )
                          }
                          className="w-full rounded border border-slate-200 bg-transparent px-1 py-0.5 text-xs dark:border-slate-700"
                        >
                          <option value="">Sem viatura</option>
                          {viaturas.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.nome}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </article>
              ))}
              {coluna.cards.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-slate-400">
                  {coluna.aceitaDrop ? "Solte um atendimento aqui" : "Nenhum atendimento"}
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
