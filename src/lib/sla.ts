import type { ClasseSla } from "@/generated/prisma/enums";

/** Prazo de cada classe de SLA, em horas. */
export const SLA_HORAS: Record<ClasseSla, number> = {
  A: 2,
  B: 4,
  C: 8,
  D: 24,
};

/** A partir de quando (fração do prazo restante) o semáforo vira amarelo. */
const LIMIAR_ALERTA = 0.25;

export type SemaforoSla = "VERDE" | "AMARELO" | "VERMELHO";

export function calcularPrazoSla(dataAbertura: Date, classe: ClasseSla): Date {
  const horas = SLA_HORAS[classe];
  return new Date(dataAbertura.getTime() + horas * 60 * 60 * 1000);
}

/**
 * Semáforo de SLA. Se `dataConclusao` for informada, compara a conclusão
 * contra o prazo (SLA histórico); caso contrário compara "agora" contra o prazo.
 */
export function semaforoSla(
  prazoSla: Date,
  classe: ClasseSla,
  dataConclusao?: Date | null,
  agora: Date = new Date()
): SemaforoSla {
  const referencia = dataConclusao ?? agora;
  if (referencia > prazoSla) return "VERMELHO";

  const horasTotais = SLA_HORAS[classe];
  const janelaAlertaMs = horasTotais * 60 * 60 * 1000 * LIMIAR_ALERTA;
  const restanteMs = prazoSla.getTime() - referencia.getTime();

  if (restanteMs <= janelaAlertaMs) return "AMARELO";
  return "VERDE";
}

export const SLA_CLASSE_LABEL: Record<ClasseSla, string> = {
  A: "Classe A (até 2h)",
  B: "Classe B (até 4h)",
  C: "Classe C (até 8h)",
  D: "Classe D (até 24h)",
};
