import { bootstrap } from "../src/lib/bootstrap";
import { prisma } from "../src/lib/prisma";

// Mesmo preparo executado automaticamente a cada start do servidor
// (administrador + equipe e viaturas iniciais). Idempotente.
bootstrap()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
