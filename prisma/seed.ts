import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ---- Equipe (escopo do CCO RCOND/REDETEL) ----

const TECNICOS = [
  "Jackson",
  "Júlio",
  "Erivaldo",
  "Dinarte",
  "Matheus",
  "Rodrigo",
  "Noé",
];

const TI = ["João", "Augusto"];

const AJUDANTES = ["Gilberto", "Alessandro"];

const ESTAGIARIOS = ["Hermeson", "Wallace", "João Silva", "Alberth"];

const VIATURAS = [
  "VTR 01",
  "VTR 03",
  "VTR 04",
  "VTR 05",
  "STRADA",
  "DUSTER",
  "MOTO 01",
  "MOTO 02",
];

async function upsertColaborador(nome: string, tipo: "TECNICO" | "TI" | "AJUDANTE" | "ESTAGIARIO") {
  const existente = await prisma.colaborador.findFirst({ where: { nome, tipo } });
  if (existente) return existente;
  return prisma.colaborador.create({ data: { nome, tipo } });
}

async function main() {
  console.log("Seeding colaboradores...");
  for (const nome of TECNICOS) await upsertColaborador(nome, "TECNICO");
  for (const nome of TI) await upsertColaborador(nome, "TI");
  for (const nome of AJUDANTES) await upsertColaborador(nome, "AJUDANTE");
  for (const nome of ESTAGIARIOS) await upsertColaborador(nome, "ESTAGIARIO");

  console.log("Seeding viaturas...");
  for (const nome of VIATURAS) {
    await prisma.viatura.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
  }

  console.log("Seeding usuário administrador...");
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@rcondredetel.com.br";
  const adminSenha = process.env.ADMIN_PASSWORD ?? "cco@2026admin";
  const passwordHash = await bcrypt.hash(adminSenha, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      nome: "Administrador CCO",
      email: adminEmail,
      passwordHash,
      papel: "ADMIN",
    },
  });

  console.log("\n✔ Seed concluído.");
  console.log(`  Login admin: ${adminEmail}`);
  console.log(`  Senha:       ${adminSenha}`);
  console.log("  ⚠ Troque essa senha após o primeiro acesso.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
