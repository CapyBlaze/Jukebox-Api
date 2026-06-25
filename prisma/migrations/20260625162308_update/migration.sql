/*
  Warnings:

  - The primary key for the `QueueMusic` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `QueueMusic` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QueueMusic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QueueMusic_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QueueMusic" ("addedAt", "addedBy", "groupId", "id", "title", "url") SELECT "addedAt", "addedBy", "groupId", "id", "title", "url" FROM "QueueMusic";
DROP TABLE "QueueMusic";
ALTER TABLE "new_QueueMusic" RENAME TO "QueueMusic";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
