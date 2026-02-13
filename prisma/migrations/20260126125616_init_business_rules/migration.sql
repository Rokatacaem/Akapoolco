/*
  Warnings:

  - The `status` column on the `tables` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[rut]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TableType" AS ENUM ('POOL', 'CARAMBOLA', 'POOL_CHILENO', 'NINE_BALL', 'CARDS', 'SNOOKER');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'ADJUSTMENT', 'RETURN');

-- AlterEnum
ALTER TYPE "UserType" ADD VALUE 'SOCIO_FUNDADOR';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "stockControl" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "shiftId" TEXT;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "isTraining" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "type" "TableType" NOT NULL DEFAULT 'POOL',
DROP COLUMN "status",
ADD COLUMN     "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "currentDebt" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "debtLimit" DECIMAL(10,2) NOT NULL DEFAULT 50000,
ADD COLUMN     "documentImage" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastNameMat" TEXT,
ADD COLUMN     "lastNamePat" TEXT,
ADD COLUMN     "membershipExpiresAt" TIMESTAMP(3),
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "rut" TEXT,
ADD COLUMN     "secondName" TEXT,
ADD COLUMN     "systemAccess" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "initialAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "startUserId" TEXT NOT NULL,
    "endUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waiting_list" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gameType" "TableType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "phone" TEXT,
    "partySize" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waiting_list_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_rut_key" ON "users"("rut");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_startUserId_fkey" FOREIGN KEY ("startUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_endUserId_fkey" FOREIGN KEY ("endUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
