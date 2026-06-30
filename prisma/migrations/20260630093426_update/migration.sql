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
    CONSTRAINT "Group_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Group" ("adminId", "code", "currentTrackId", "isPlaying", "maxUsers", "playbackStartedAt", "provider", "streamToken") SELECT "adminId", "code", "currentTrackId", "isPlaying", "maxUsers", "playbackStartedAt", "provider", "streamToken" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");
CREATE UNIQUE INDEX "Group_streamToken_key" ON "Group"("streamToken");
CREATE UNIQUE INDEX "Group_adminId_key" ON "Group"("adminId");
CREATE TABLE "new_Vote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "downVote" INTEGER NOT NULL DEFAULT 0,
    "upVote" INTEGER NOT NULL DEFAULT 0,
    "endDate" DATETIME NOT NULL,
    "groupId" TEXT NOT NULL,
    CONSTRAINT "Vote_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Vote" ("downVote", "endDate", "groupId", "id", "title", "upVote", "url", "userId") SELECT "downVote", "endDate", "groupId", "id", "title", "upVote", "url", "userId" FROM "Vote";
DROP TABLE "Vote";
ALTER TABLE "new_Vote" RENAME TO "Vote";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
