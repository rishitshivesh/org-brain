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

CREATE TABLE IF NOT EXISTS org_entities (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_org_entities_type
  ON org_entities(entity_type);

CREATE TABLE IF NOT EXISTS provider_handoffs (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
