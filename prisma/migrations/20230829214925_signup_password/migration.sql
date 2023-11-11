-- CreateTable
CREATE TABLE "SignupPassword" (
    "hash" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SignupPassword_hash_key" ON "SignupPassword"("hash");
