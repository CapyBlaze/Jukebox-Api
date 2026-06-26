/*
  Warnings:

  - You are about to drop the column `playing` on the `Group` table. All the data in the column will be lost.
  - The required column `streamToken` was added to the `Group` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "provider" TEXT NOT NULL DEFAULT 'youtube',
    "isPlaying" BOOLEAN NOT NULL DEFAULT false,
    "currentTrackId" INTEGER,
    "playbackStartedAt" DATETIME,
    "streamToken" TEXT NOT NULL,
    "adminId" INTEGER NOT NULL,
    CONSTRAINT "Group_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Group" ("adminId", "code", "maxUsers", "provider") SELECT "adminId", "code", "maxUsers", "provider" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");
CREATE UNIQUE INDEX "Group_streamToken_key" ON "Group"("streamToken");
CREATE UNIQUE INDEX "Group_adminId_key" ON "Group"("adminId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
