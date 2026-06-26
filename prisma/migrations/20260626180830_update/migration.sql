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
    "adminId" INTEGER,
    CONSTRAINT "Group_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Group" ("adminId", "code", "currentTrackId", "isPlaying", "maxUsers", "playbackStartedAt", "provider", "streamToken") SELECT "adminId", "code", "currentTrackId", "isPlaying", "maxUsers", "playbackStartedAt", "provider", "streamToken" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");
CREATE UNIQUE INDEX "Group_streamToken_key" ON "Group"("streamToken");
CREATE UNIQUE INDEX "Group_adminId_key" ON "Group"("adminId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
