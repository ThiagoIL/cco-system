// Rótulos e cores (Tailwind) em pt-BR para todos os enums do domínio.
// Centralizado aqui para as telas não duplicarem strings soltas.

export const ORIGEM_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  TELEFONE: "Telefone",
  EMAIL: "E-mail",
  APLICATIVO: "Aplicativo",
  GRUPO_OFICIAL: "Grupo Oficial",
  MONITORAMENTO: "Monitoramento",
};

export const CLASSIFICACAO_LABEL: Record<string, string> = {
  P1: "P1 – Crítico",
  P2: "P2 – Alto",
  P3: "P3 – Médio",
  P4: "P4 – Programado",
};

export const CLASSIFICACAO_COLOR: Record<string, string> = {
  P1: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  P2: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  P3: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
  P4: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
};

export const STATUS_CHAMADO_LABEL: Record<string, string> = {
  NOVO: "Novo",
  PROGRAMADO: "Programado",
  EM_DESLOCAMENTO: "Em deslocamento",
  EM_ATENDIMENTO: "Em atendimento",
  PENDENTE_MATERIAL: "Pendente material",
  PENDENTE_CLIENTE: "Pendente cliente",
  RETORNO_PROGRAMADO: "Retorno programado",
  CONCLUIDO: "Concluído",
};

export const STATUS_CHAMADO_COLOR: Record<string, string> = {
  NOVO: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
  PROGRAMADO: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
  EM_DESLOCAMENTO: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
  EM_ATENDIMENTO: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  PENDENTE_MATERIAL: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  PENDENTE_CLIENTE: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  RETORNO_PROGRAMADO: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  CONCLUIDO: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
};

export const TIPO_COLABORADOR_LABEL: Record<string, string> = {
  TECNICO: "Técnico",
  TI: "TI",
  AJUDANTE: "Ajudante",
  ESTAGIARIO: "Estagiário",
};

export const STATUS_COLABORADOR_LABEL: Record<string, string> = {
  DISPONIVEL: "Disponível",
  EM_ATENDIMENTO: "Em atendimento",
  EM_DESLOCAMENTO: "Em deslocamento",
  FOLGA: "Folga",
};

export const STATUS_COLABORADOR_COLOR: Record<string, string> = {
  DISPONIVEL: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  EM_ATENDIMENTO: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  EM_DESLOCAMENTO: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
  FOLGA: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
};

export const STATUS_VIATURA_LABEL: Record<string, string> = {
  DISPONIVEL: "Disponível",
  EM_USO: "Em uso",
  MANUTENCAO: "Manutenção",
  RESERVA: "Reserva",
};

export const STATUS_VIATURA_COLOR: Record<string, string> = {
  DISPONIVEL: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  EM_USO: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  MANUTENCAO: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  RESERVA: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
};

export const STATUS_PENDENCIA_LABEL: Record<string, string> = {
  ABERTA: "Aberta",
  RESOLVIDA: "Resolvida",
};

export const SEMAFORO_COLOR: Record<string, string> = {
  VERDE: "bg-green-500",
  AMARELO: "bg-yellow-400",
  VERMELHO: "bg-red-500",
};

export const SEMAFORO_LABEL: Record<string, string> = {
  VERDE: "No prazo",
  AMARELO: "Em risco",
  VERMELHO: "Vencido",
};

export const PAPEL_USUARIO_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  TECNICO: "Técnico",
};
