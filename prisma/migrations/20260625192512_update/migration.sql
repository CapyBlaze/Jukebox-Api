-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "downVote" INTEGER NOT NULL DEFAULT 0,
    "upVote" INTEGER NOT NULL DEFAULT 0,
    "groupId" TEXT NOT NULL,
    CONSTRAINT "Vote_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vote" ("groupId", "id", "title", "url", "userId") SELECT "groupId", "id", "title", "url", "userId" FROM "Vote";
DROP TABLE "Vote";
ALTER TABLE "new_Vote" RENAME TO "Vote";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
