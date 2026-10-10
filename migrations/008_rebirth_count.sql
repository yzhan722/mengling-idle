-- 008: 轮回榜 —— scores 表加 rebirthCount 列（转生次数，来自 era.prestigeCount）

ALTER TABLE scores ADD COLUMN rebirthCount INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_scores_rebirth ON scores(rebirthCount DESC);
