CREATE TABLE IF NOT EXISTS investigations (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  incident_id TEXT,
  status TEXT NOT NULL,
  root_cause TEXT,
  confidence INTEGER,
  mitigation TEXT,
  remediation_title TEXT,
  remediation_json TEXT,
  approval_status TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_investigations_updated_at
  ON investigations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_investigations_incident_id
  ON investigations(incident_id);
