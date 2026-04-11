-- DropIndex
DROP INDEX "Horse_imageId_key";

-- DropIndex
DROP INDEX "Horse_id_key";

-- DropIndex
DROP INDEX "HorseAssignment_eventId_userId_key";

-- DropIndex
DROP INDEX "HorseAssignment_id_key";

-- DropIndex
DROP INDEX "_EventToHorse_B_index";

-- DropIndex
DROP INDEX "_EventToHorse_AB_unique";

-- DropIndex
DROP INDEX "_horseLeader_B_index";

-- DropIndex
DROP INDEX "_horseLeader_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Horse";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "HorseAssignment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_EventToHorse";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_horseLeader";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL DEFAULT 'horse',
    "notes" TEXT,
    "status" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "cooldown" BOOLEAN NOT NULL DEFAULT false,
    "cooldownStartDate" DATETIME,
    "cooldownEndDate" DATETIME,
    "orgId" TEXT,
    "imageId" TEXT,
    CONSTRAINT "Animal_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Animal_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("fileId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnimalAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    CONSTRAINT "AnimalAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnimalAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnimalAssignment_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AnimalToEvent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AnimalToEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "Animal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AnimalToEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_animalHandler" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_animalHandler_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_animalHandler_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "orgId" TEXT,
    "cleaningCrewReq" INTEGER NOT NULL DEFAULT 0,
    "lessonAssistantsReq" INTEGER NOT NULL DEFAULT 0,
    "sideWalkersReq" INTEGER NOT NULL DEFAULT 0,
    "animalHandlersReq" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Event_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("cleaningCrewReq", "end", "id", "isPrivate", "lessonAssistantsReq", "orgId", "sideWalkersReq", "start", "title") SELECT "cleaningCrewReq", "end", "id", "isPrivate", "lessonAssistantsReq", "orgId", "sideWalkersReq", "start", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_id_key" ON "Event"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Animal_id_key" ON "Animal"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Animal_imageId_key" ON "Animal"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "AnimalAssignment_id_key" ON "AnimalAssignment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "AnimalAssignment_eventId_userId_key" ON "AnimalAssignment"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "_AnimalToEvent_AB_unique" ON "_AnimalToEvent"("A", "B");

-- CreateIndex
CREATE INDEX "_AnimalToEvent_B_index" ON "_AnimalToEvent"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_animalHandler_AB_unique" ON "_animalHandler"("A", "B");

-- CreateIndex
CREATE INDEX "_animalHandler_B_index" ON "_animalHandler"("B");
