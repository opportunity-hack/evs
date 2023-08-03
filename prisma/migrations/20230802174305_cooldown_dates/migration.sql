/*
  Warnings:

  - You are about to drop the column `doNotSchedule` on the `Horse` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Horse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "cooldown" BOOLEAN NOT NULL DEFAULT false,
    "cooldownStartDate" DATETIME,
    "cooldownEndDate" DATETIME,
    "imageId" TEXT,
    CONSTRAINT "Horse_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("fileId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Horse" ("id", "imageId", "name", "notes", "status", "updatedAt") SELECT "id", "imageId", "name", "notes", "status", "updatedAt" FROM "Horse";
DROP TABLE "Horse";
ALTER TABLE "new_Horse" RENAME TO "Horse";
CREATE UNIQUE INDEX "Horse_id_key" ON "Horse"("id");
CREATE UNIQUE INDEX "Horse_imageId_key" ON "Horse"("imageId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
