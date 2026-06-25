-- CreateTable
CREATE TABLE "IpBan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ipAddress" TEXT NOT NULL,
    "bannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "IpBan_ipAddress_key" ON "IpBan"("ipAddress");
