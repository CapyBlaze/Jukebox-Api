/*
  Warnings:

  - The primary key for the `SearchCache` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `SearchCache` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "MetadataCache" (
    "provider" TEXT NOT NULL,
    "providerKey" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("provider", "providerKey")
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SearchCache" (
    "provider" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("provider", "query")
);
INSERT INTO "new_SearchCache" ("createdAt", "provider", "query", "results") SELECT "createdAt", "provider", "query", "results" FROM "SearchCache";
DROP TABLE "SearchCache";
ALTER TABLE "new_SearchCache" RENAME TO "SearchCache";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
