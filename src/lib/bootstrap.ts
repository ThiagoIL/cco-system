import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ---- Equipe e frota iniciais (escopo do CCO RCOND/REDETEL) ----

const TECNICOS = ["Jackson", "Júlio", "Erivaldo", "Dinarte", "Matheus", "Rodrigo", "Noé"];
const TI = ["João", "Augusto"];
const AJUDANTES = ["Gilberto", "Alessandro"];
const ESTAGIARIOS = ["Hermeson", "Wallace", "João Silva", "Alberth"];

const VIATURAS = ["VTR 01", "VTR 03", "VTR 04", "VTR 05", "STRADA", "DUSTER", "MOTO 01", "MOTO 02"];

/**
 * Preparação idempotente executada ao iniciar o servidor (ver instrumentation.ts):
 * cria o administrador (a partir das variáveis de ambiente) quando ainda não há
 * usuários e carrega a equipe e as viaturas iniciais quando os cadastros estão vazios.
 */
export async function bootstrap() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if ((await prisma.user.count()) === 0) {
    if (email && password) {
      await prisma.user.create({
        data: {
          nome: process.env.ADMIN_NAME?.trim() || "Administrador CCO",
          email,
          passwordHash: await bcrypt.hash(password, 12),
          papel: "ADMIN",
        },
      });
      console.log(`[bootstrap] administrador criado: ${email}`);
    } else {
      console.warn(
        "[bootstrap] nenhum usuário existe e ADMIN_EMAIL/ADMIN_PASSWORD não foram definidos"
      );
    }
  }

  if ((await prisma.colaborador.count()) === 0) {
    await prisma.colaborador.createMany({
      data: [
        ...TECNICOS.map((nome) => ({ nome, tipo: "TECNICO" as const })),
        ...TI.map((nome) => ({ nome, tipo: "TI" as const })),
        ...AJUDANTES.map((nome) => ({ nome, tipo: "AJUDANTE" as const })),
        ...ESTAGIARIOS.map((nome) => ({ nome, tipo: "ESTAGIARIO" as const })),
      ],
    });
    console.log("[bootstrap] equipe inicial cadastrada");
  }

  if ((await prisma.viatura.count()) === 0) {
    await prisma.viatura.createMany({
      data: VIATURAS.map((nome) => ({ nome })),
      skipDuplicates: true,
    });
    console.log("[bootstrap] viaturas iniciais cadastradas");
  }
}
