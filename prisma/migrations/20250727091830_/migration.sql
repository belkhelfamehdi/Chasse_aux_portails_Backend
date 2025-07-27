/*
  Warnings:

  - Added the required column `firstname` to the `Utilisateur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastname` to the `Utilisateur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Utilisateur" ADD COLUMN     "firstname" TEXT NOT NULL,
ADD COLUMN     "lastname" TEXT NOT NULL;
