import { z } from "zod";

export const chamadoSchema = z.object({
  cliente: z.string().min(1, "Informe o cliente"),
  endereco: z.string().optional(),
  regiao: z.string().optional(),
  descricao: z.string().optional(),
  origem: z.enum([
    "WHATSAPP",
    "TELEFONE",
    "EMAIL",
    "APLICATIVO",
    "GRUPO_OFICIAL",
    "MONITORAMENTO",
  ]),
  classificacao: z.enum(["P1", "P2", "P3", "P4"]),
  slaClasse: z.enum(["A", "B", "C", "D"]),
  status: z.enum([
    "NOVO",
    "PROGRAMADO",
    "EM_DESLOCAMENTO",
    "EM_ATENDIMENTO",
    "PENDENTE_MATERIAL",
    "PENDENTE_CLIENTE",
    "RETORNO_PROGRAMADO",
    "CONCLUIDO",
  ]),
  colaboradorId: z.string().optional(),
  viaturaId: z.string().optional(),
  dataProgramada: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), "Data programada inválida"),
});

export type ChamadoInput = z.infer<typeof chamadoSchema>;
