-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "animalType" TEXT NOT NULL DEFAULT 'mixed',
    "description" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "mailingList" BOOLEAN NOT NULL DEFAULT true,
    "orgId" TEXT,
    "birthdate" DATETIME,
    "height" INTEGER,
    "yearsOfExperience" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "imageId" TEXT,
    "lastLogin" DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("fileId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("birthdate", "createdAt", "email", "height", "id", "imageId", "lastLogin", "mailingList", "name", "notes", "phone", "updatedAt", "username", "yearsOfExperience") SELECT "birthdate", "createdAt", "email", "height", "id", "imageId", "lastLogin", "mailingList", "name", "notes", "phone", "updatedAt", "username", "yearsOfExperience" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_imageId_key" ON "User"("imageId");
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "orgId" TEXT,
    "cleaningCrewReq" INTEGER NOT NULL DEFAULT 0,
    "lessonAssistantsReq" INTEGER NOT NULL DEFAULT 0,
    "sideWalkersReq" INTEGER NOT NULL DEFAULT 0,
    "horseLeadersReq" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Event_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("cleaningCrewReq", "end", "horseLeadersReq", "id", "isPrivate", "lessonAssistantsReq", "sideWalkersReq", "start", "title") SELECT "cleaningCrewReq", "end", "horseLeadersReq", "id", "isPrivate", "lessonAssistantsReq", "sideWalkersReq", "start", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_id_key" ON "Event"("id");
CREATE TABLE "new_Horse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "cooldown" BOOLEAN NOT NULL DEFAULT false,
    "cooldownStartDate" DATETIME,
    "cooldownEndDate" DATETIME,
    "orgId" TEXT,
    "imageId" TEXT,
    CONSTRAINT "Horse_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Horse_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("fileId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Horse" ("cooldown", "cooldownEndDate", "cooldownStartDate", "id", "imageId", "name", "notes", "status", "updatedAt") SELECT "cooldown", "cooldownEndDate", "cooldownStartDate", "id", "imageId", "name", "notes", "status", "updatedAt" FROM "Horse";
DROP TABLE "Horse";
ALTER TABLE "new_Horse" RENAME TO "Horse";
CREATE UNIQUE INDEX "Horse_id_key" ON "Horse"("id");
CREATE UNIQUE INDEX "Horse_imageId_key" ON "Horse"("imageId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_id_key" ON "Organization"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
