/*
  Warnings:

  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Note_id_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Note";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Horse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "imageId" TEXT,
    CONSTRAINT "Horse_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("fileId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "barnCrewReq" INTEGER NOT NULL DEFAULT 0,
    "pastureCrewReq" INTEGER NOT NULL DEFAULT 0,
    "lessonAssistantsReq" INTEGER NOT NULL DEFAULT 0,
    "sideWalkersReq" INTEGER NOT NULL DEFAULT 0,
    "horseLeadersReq" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "HorseAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    CONSTRAINT "HorseAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HorseAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HorseAssignment_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_instructor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_instructor_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_instructor_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_barnCrew" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_barnCrew_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_barnCrew_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_pastureCrew" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_pastureCrew_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_pastureCrew_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_lessonAssistant" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_lessonAssistant_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_lessonAssistant_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_sideWalker" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_sideWalker_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_sideWalker_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_horseLeader" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_horseLeader_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_horseLeader_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EventToHorse" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EventToHorse_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EventToHorse_B_fkey" FOREIGN KEY ("B") REFERENCES "Horse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "birthdate" DATETIME,
    "height" INTEGER,
    "yearsOfExperience" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "imageId" TEXT,
    "lastLogin" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "instructor" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "User_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("fileId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "imageId", "name", "updatedAt", "username") SELECT "createdAt", "email", "id", "imageId", "name", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_imageId_key" ON "User"("imageId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Horse_id_key" ON "Horse"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Horse_imageId_key" ON "Horse"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_id_key" ON "Event"("id");

-- CreateIndex
CREATE UNIQUE INDEX "HorseAssignment_id_key" ON "HorseAssignment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "HorseAssignment_eventId_userId_key" ON "HorseAssignment"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "_instructor_AB_unique" ON "_instructor"("A", "B");

-- CreateIndex
CREATE INDEX "_instructor_B_index" ON "_instructor"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_barnCrew_AB_unique" ON "_barnCrew"("A", "B");

-- CreateIndex
CREATE INDEX "_barnCrew_B_index" ON "_barnCrew"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_pastureCrew_AB_unique" ON "_pastureCrew"("A", "B");

-- CreateIndex
CREATE INDEX "_pastureCrew_B_index" ON "_pastureCrew"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_lessonAssistant_AB_unique" ON "_lessonAssistant"("A", "B");

-- CreateIndex
CREATE INDEX "_lessonAssistant_B_index" ON "_lessonAssistant"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_sideWalker_AB_unique" ON "_sideWalker"("A", "B");

-- CreateIndex
CREATE INDEX "_sideWalker_B_index" ON "_sideWalker"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_horseLeader_AB_unique" ON "_horseLeader"("A", "B");

-- CreateIndex
CREATE INDEX "_horseLeader_B_index" ON "_horseLeader"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EventToHorse_AB_unique" ON "_EventToHorse"("A", "B");

-- CreateIndex
CREATE INDEX "_EventToHorse_B_index" ON "_EventToHorse"("B");
