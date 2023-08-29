PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
);
INSERT INTO _prisma_migrations VALUES('8f6addae-cc8e-49e3-ace8-7c5822605c74','905470a0151fac33b3cee4bcedf6052a76d460357ad94e4ca609d4208654b178',1690469782230,'20230608211059_init',NULL,NULL,1690469782189,1);
INSERT INTO _prisma_migrations VALUES('84381188-8888-4e52-a477-c3cc3aea90a6','a824f9ec7d85a7bf006d13f881660122e09433cd1623b47d9066c80ec7dbc162',1690469782290,'20230628165652_schema_v1',NULL,NULL,1690469782231,1);
INSERT INTO _prisma_migrations VALUES('b27db0ee-4adc-466d-8ea5-13e94b68add6','ac4b1cb246da0f4ee7a7bc9c77363f1f2cdb69ccc11d1f05ca8829b33bfa81b1',1690469782305,'20230704032150_schema_v2',NULL,NULL,1690469782291,1);
INSERT INTO _prisma_migrations VALUES('fe5c6b1d-8355-44b4-a6e6-1932c652e8a6','784e0b6c607761bcdc18b87fc0f98e89c09753947a2ebd143fb0f08d7836939d',1690469782330,'20230708192944_schema_v3',NULL,NULL,1690469782306,1);
INSERT INTO _prisma_migrations VALUES('ca90cab7-3df5-4b41-b5a9-1be479786315','42b0f7f2ef9f219a9a18163edfbe956eaf7922d772567bf26597741a0391ba8c',1690469782342,'20230709211139_schema_v4',NULL,NULL,1690469782331,1);
INSERT INTO _prisma_migrations VALUES('c8fa00ec-f1b9-407e-afd2-aa65eff10f3d','9d4ba35c62269e65293146673fbeba3d732c2e9d0dc90698e8a6592c44a72117',1690469782348,'20230722142059_add_phone',NULL,NULL,1690469782343,1);
INSERT INTO _prisma_migrations VALUES('74f4adb0-0df0-42f7-b66e-2f7596063001','94cf5621bbb405eaba24a1bcdd78e3eaf7efba3afbb13b29ab6116bf0a36bcb3',1690469797864,'20230727145637_instructor_role',NULL,NULL,1690469797853,1);
CREATE TABLE IF NOT EXISTS "File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Image" (
    "fileId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "altText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Image_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Role VALUES('cllwcvcn90000a1dpldrn1llt','admin',1693316410821,1693316410821);
INSERT INTO Role VALUES('cllwcvcnc0002a1dpbvre5f6j','lessonAssistant',1693316410825,1693316410825);
INSERT INTO Role VALUES('cllwcvcnf0004a1dpi4vpfyya','horseLeader',1693316410827,1693316410827);
INSERT INTO Role VALUES('cllwcvcnh0006a1dp31y5jzwm','instructor',1693316410829,1693316410829);
CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO Permission VALUES('cllwcvcn90001a1dphjmxbu6j','admin',1693316410821,1693316410821);
INSERT INTO Permission VALUES('cllwcvcnc0003a1dpx9z0agj7','lessonAssistant',1693316410825,1693316410825);
INSERT INTO Permission VALUES('cllwcvcnf0005a1dpqt8ted2t','horseLeader',1693316410827,1693316410827);
INSERT INTO Permission VALUES('cllwcvcnh0007a1dptpj58hw2','instructor',1693316410829,1693316410829);
CREATE TABLE IF NOT EXISTS "Password" (
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO Password VALUES('$2a$10$ijhQb/aumx/YOTbDCwo9z.qHYOqk3goyY3bcGodpsaEXzbY5yE3EC','cllwcvcp30008a1dpshn42gie');
CREATE TABLE IF NOT EXISTS "Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "digits" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "expiresAt" DATETIME
);
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "expirationDate" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "_RoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO _RoleToUser VALUES('cllwcvcn90000a1dpldrn1llt','cllwcvcp30008a1dpshn42gie');
CREATE TABLE IF NOT EXISTS "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO _PermissionToRole VALUES('cllwcvcn90001a1dphjmxbu6j','cllwcvcn90000a1dpldrn1llt');
INSERT INTO _PermissionToRole VALUES('cllwcvcnc0003a1dpx9z0agj7','cllwcvcnc0002a1dpbvre5f6j');
INSERT INTO _PermissionToRole VALUES('cllwcvcnf0005a1dpqt8ted2t','cllwcvcnf0004a1dpi4vpfyya');
INSERT INTO _PermissionToRole VALUES('cllwcvcnh0007a1dptpj58hw2','cllwcvcnh0006a1dp31y5jzwm');
CREATE TABLE IF NOT EXISTS "_instructor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_instructor_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_instructor_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "_lessonAssistant" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_lessonAssistant_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_lessonAssistant_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "_sideWalker" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_sideWalker_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_sideWalker_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "_horseLeader" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_horseLeader_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_horseLeader_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "_EventToHorse" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EventToHorse_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EventToHorse_B_fkey" FOREIGN KEY ("B") REFERENCES "Horse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "HorseAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    CONSTRAINT "HorseAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HorseAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HorseAssignment_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "_cleaningCrew" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_cleaningCrew_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_cleaningCrew_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "cleaningCrewReq" INTEGER NOT NULL DEFAULT 0,
    "lessonAssistantsReq" INTEGER NOT NULL DEFAULT 0,
    "sideWalkersReq" INTEGER NOT NULL DEFAULT 0,
    "horseLeadersReq" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "birthdate" DATETIME,
    "height" INTEGER,
    "yearsOfExperience" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "imageId" TEXT,
    "lastLogin" DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("fileId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO User VALUES('cllwcvcp30008a1dpshn42gie','admin@trottracker.org','admin','Starter admin',NULL,NULL,NULL,NULL,NULL,1693316410887,1693316410887,NULL,1693316410887);
CREATE TABLE IF NOT EXISTS "Horse" (
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
CREATE UNIQUE INDEX "File_id_key" ON "File"("id");
CREATE UNIQUE INDEX "Image_fileId_key" ON "Image"("fileId");
CREATE UNIQUE INDEX "Role_id_key" ON "Role"("id");
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "Permission_id_key" ON "Permission"("id");
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");
CREATE UNIQUE INDEX "Password_userId_key" ON "Password"("userId");
CREATE UNIQUE INDEX "Verification_target_type_key" ON "Verification"("target", "type");
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser"("A", "B");
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");
CREATE UNIQUE INDEX "_instructor_AB_unique" ON "_instructor"("A", "B");
CREATE INDEX "_instructor_B_index" ON "_instructor"("B");
CREATE UNIQUE INDEX "_lessonAssistant_AB_unique" ON "_lessonAssistant"("A", "B");
CREATE INDEX "_lessonAssistant_B_index" ON "_lessonAssistant"("B");
CREATE UNIQUE INDEX "_sideWalker_AB_unique" ON "_sideWalker"("A", "B");
CREATE INDEX "_sideWalker_B_index" ON "_sideWalker"("B");
CREATE UNIQUE INDEX "_horseLeader_AB_unique" ON "_horseLeader"("A", "B");
CREATE INDEX "_horseLeader_B_index" ON "_horseLeader"("B");
CREATE UNIQUE INDEX "_EventToHorse_AB_unique" ON "_EventToHorse"("A", "B");
CREATE INDEX "_EventToHorse_B_index" ON "_EventToHorse"("B");
CREATE UNIQUE INDEX "HorseAssignment_id_key" ON "HorseAssignment"("id");
CREATE UNIQUE INDEX "HorseAssignment_eventId_userId_key" ON "HorseAssignment"("eventId", "userId");
CREATE UNIQUE INDEX "_cleaningCrew_AB_unique" ON "_cleaningCrew"("A", "B");
CREATE INDEX "_cleaningCrew_B_index" ON "_cleaningCrew"("B");
CREATE UNIQUE INDEX "Event_id_key" ON "Event"("id");
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_imageId_key" ON "User"("imageId");
CREATE UNIQUE INDEX "Horse_id_key" ON "Horse"("id");
CREATE UNIQUE INDEX "Horse_imageId_key" ON "Horse"("imageId");
COMMIT;
