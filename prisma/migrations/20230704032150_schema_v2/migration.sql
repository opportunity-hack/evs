-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HorseAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    CONSTRAINT "HorseAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HorseAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HorseAssignment_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HorseAssignment" ("eventId", "horseId", "id", "userId") SELECT "eventId", "horseId", "id", "userId" FROM "HorseAssignment";
DROP TABLE "HorseAssignment";
ALTER TABLE "new_HorseAssignment" RENAME TO "HorseAssignment";
CREATE UNIQUE INDEX "HorseAssignment_id_key" ON "HorseAssignment"("id");
CREATE UNIQUE INDEX "HorseAssignment_eventId_userId_key" ON "HorseAssignment"("eventId", "userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
