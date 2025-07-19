/*
  Warnings:

  - You are about to drop the column `villeId` on the `POI` table. All the data in the column will be lost.
  - You are about to drop the `Ville` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cityId` to the `POI` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "POI" DROP CONSTRAINT "POI_villeId_fkey";

-- DropForeignKey
ALTER TABLE "Ville" DROP CONSTRAINT "Ville_adminId_fkey";

-- AlterTable
ALTER TABLE "POI" DROP COLUMN "villeId",
ADD COLUMN     "cityId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Ville";

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rayon" INTEGER NOT NULL,
    "adminId" INTEGER,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POI" ADD CONSTRAINT "POI_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
