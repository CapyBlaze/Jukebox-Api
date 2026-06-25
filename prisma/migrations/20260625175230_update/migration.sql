/*
  Warnings:

  - You are about to drop the column `addedBy` on the `QueueMusic` table. All the data in the column will be lost.
  - Added the required column `userId` to the `QueueMusic` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QueueMusic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QueueMusic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QueueMusic_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QueueMusic" ("addedAt", "groupId", "id", "title", "url") SELECT "addedAt", "groupId", "id", "title", "url" FROM "QueueMusic";
DROP TABLE "QueueMusic";
ALTER TABLE "new_QueueMusic" RENAME TO "QueueMusic";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
