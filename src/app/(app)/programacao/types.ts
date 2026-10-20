import type { SemaforoSla } from "@/lib/sla";

export type CardChamado = {
  id: string;
  numero: number;
  cliente: string;
  regiao: string | null;
  classificacao: string;
  status: string;
  concluido: boolean;
  /** "08:30" ou null quando ainda não há horário programado. */
  hora: string | null;
  semaforo: SemaforoSla;
  tempoSla: string;
  colaboradorNome: string | null;
  viaturaId: string | null;
};

export type ColunaBoard = {
  /** Valor enviado à action ao soltar um card aqui (id do técnico, região ou dia). */
  chave: string;
  titulo: string;
  subtitulo?: string;
  destaque?: boolean;
  aceitaDrop: boolean;
  cards: CardChamado[];
};

export type VisaoProgramacao = "tecnico" | "equipe" | "regiao" | "data";
