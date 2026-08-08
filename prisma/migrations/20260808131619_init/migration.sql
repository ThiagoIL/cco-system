-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN', 'SUPERVISOR', 'TECNICO');

-- CreateEnum
CREATE TYPE "TipoColaborador" AS ENUM ('TECNICO', 'TI', 'AJUDANTE', 'ESTAGIARIO');

-- CreateEnum
CREATE TYPE "StatusColaborador" AS ENUM ('DISPONIVEL', 'EM_ATENDIMENTO', 'EM_DESLOCAMENTO', 'FOLGA');

-- CreateEnum
CREATE TYPE "StatusViatura" AS ENUM ('DISPONIVEL', 'EM_USO', 'MANUTENCAO', 'RESERVA');

-- CreateEnum
CREATE TYPE "OrigemChamado" AS ENUM ('WHATSAPP', 'TELEFONE', 'EMAIL', 'APLICATIVO', 'GRUPO_OFICIAL', 'MONITORAMENTO');

-- CreateEnum
CREATE TYPE "ClassificacaoChamado" AS ENUM ('P1', 'P2', 'P3', 'P4');

-- CreateEnum
CREATE TYPE "ClasseSla" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "StatusChamado" AS ENUM ('NOVO', 'PROGRAMADO', 'EM_DESLOCAMENTO', 'EM_ATENDIMENTO', 'PENDENTE_MATERIAL', 'PENDENTE_CLIENTE', 'RETORNO_PROGRAMADO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "StatusPendencia" AS ENUM ('ABERTA', 'RESOLVIDA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL DEFAULT 'TECNICO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaboradores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoColaborador" NOT NULL,
    "status" "StatusColaborador" NOT NULL DEFAULT 'DISPONIVEL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viaturas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "status" "StatusViatura" NOT NULL DEFAULT 'DISPONIVEL',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamados" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "cliente" TEXT NOT NULL,
    "endereco" TEXT,
    "regiao" TEXT,
    "descricao" TEXT,
    "origem" "OrigemChamado" NOT NULL,
    "classificacao" "ClassificacaoChamado" NOT NULL,
    "slaClasse" "ClasseSla" NOT NULL,
    "status" "StatusChamado" NOT NULL DEFAULT 'NOVO',
    "dataAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataProgramada" TIMESTAMP(3),
    "prazoSla" TIMESTAMP(3) NOT NULL,
    "dataConclusao" TIMESTAMP(3),
    "colaboradorId" TEXT,
    "viaturaId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chamados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendencias" (
    "id" TEXT NOT NULL,
    "chamadoId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "prazo" TIMESTAMP(3) NOT NULL,
    "dataPrevista" TIMESTAMP(3) NOT NULL,
    "status" "StatusPendencia" NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retornos" (
    "id" TEXT NOT NULL,
    "chamadoId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "colaboradorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retornos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "viaturas_nome_key" ON "viaturas"("nome");

-- CreateIndex
CREATE INDEX "chamados_status_idx" ON "chamados"("status");

-- CreateIndex
CREATE INDEX "chamados_dataProgramada_idx" ON "chamados"("dataProgramada");

-- CreateIndex
CREATE INDEX "chamados_prazoSla_idx" ON "chamados"("prazoSla");

-- AddForeignKey
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_viaturaId_fkey" FOREIGN KEY ("viaturaId") REFERENCES "viaturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamados" ADD CONSTRAINT "chamados_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "chamados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retornos" ADD CONSTRAINT "retornos_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "chamados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retornos" ADD CONSTRAINT "retornos_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
