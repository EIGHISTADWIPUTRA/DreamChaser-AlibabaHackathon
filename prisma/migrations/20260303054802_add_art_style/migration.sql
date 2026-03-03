-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_stories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'drafting',
    "art_style" TEXT NOT NULL DEFAULT '<3d cartoon>',
    "teacher_grade" INTEGER,
    "teacher_feedback" TEXT,
    "ai_grading_suggestion" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_stories" ("ai_grading_suggestion", "created_at", "id", "status", "teacher_feedback", "teacher_grade", "title", "user_id") SELECT "ai_grading_suggestion", "created_at", "id", "status", "teacher_feedback", "teacher_grade", "title", "user_id" FROM "stories";
DROP TABLE "stories";
ALTER TABLE "new_stories" RENAME TO "stories";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
