/*
  Warnings:

  - You are about to drop the `_barnCrew` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_pastureCrew` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `barnCrewReq` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `pastureCrewReq` on the `Event` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "_barnCrew_B_index";

-- DropIndex
DROP INDEX "_barnCrew_AB_unique";

-- DropIndex
DROP INDEX "_pastureCrew_B_index";

-- DropIndex
DROP INDEX "_pastureCrew_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_barnCrew";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_pastureCrew";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_cleaningCrew" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_cleaningCrew_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_cleaningCrew_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "cleaningCrewReq" INTEGER NOT NULL DEFAULT 0,
    "lessonAssistantsReq" INTEGER NOT NULL DEFAULT 0,
    "sideWalkersReq" INTEGER NOT NULL DEFAULT 0,
    "horseLeadersReq" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Event" ("end", "horseLeadersReq", "id", "lessonAssistantsReq", "sideWalkersReq", "start", "title") SELECT "end", "horseLeadersReq", "id", "lessonAssistantsReq", "sideWalkersReq", "start", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_id_key" ON "Event"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "_cleaningCrew_AB_unique" ON "_cleaningCrew"("A", "B");

-- CreateIndex
CREATE INDEX "_cleaningCrew_B_index" ON "_cleaningCrew"("B");
