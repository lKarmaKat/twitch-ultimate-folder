CREATE TABLE IF NOT EXISTS snapshots (
  received_at INTEGER NOT NULL,
  ext_version TEXT NOT NULL,
  cohort TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS snapshots_received_at ON snapshots (received_at);
