-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "provider" TEXT NOT NULL DEFAULT 'youtube'
);
INSERT INTO "new_Group" ("code", "maxUsers") SELECT "code", "maxUsers" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
