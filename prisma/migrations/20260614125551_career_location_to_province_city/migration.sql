/*
  Warnings:

  - You are about to drop the column `location` on the `careers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "careers" DROP COLUMN "location",
ADD COLUMN     "city" VARCHAR(255),
ADD COLUMN     "province" VARCHAR(255);
