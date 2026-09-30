-- Frostbite D1 foundation
-- API keys are never stored in this database.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS members (
  torn_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin','owner')),
  faction_id INTEGER NOT NULL DEFAULT 41234,
  days_in_faction INTEGER NOT NULL DEFAULT 0,
  registered_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);
CREATE INDEX IF NOT EXISTS idx_members_last_seen ON members(last_seen_at);

CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  torn_id INTEGER NOT NULL,
  badge_key TEXT NOT NULL,
  badge_tier TEXT,
  earned_at INTEGER NOT NULL DEFAULT (unixepoch()),
  awarded_by INTEGER,
  source TEXT NOT NULL DEFAULT 'automatic' CHECK (source IN ('automatic','manual')),
  details TEXT,
  UNIQUE(torn_id, badge_key),
  FOREIGN KEY (torn_id) REFERENCES members(torn_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_achievements_member ON achievements(torn_id);

CREATE TABLE IF NOT EXISTS wars (
  war_id INTEGER PRIMARY KEY,
  started_at INTEGER,
  ended_at INTEGER,
  result TEXT,
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS war_participation (
  war_id INTEGER NOT NULL,
  torn_id INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  successful INTEGER NOT NULL DEFAULT 0,
  top_five INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (war_id, torn_id),
  FOREIGN KEY (war_id) REFERENCES wars(war_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chains (
  chain_id INTEGER PRIMARY KEY,
  started_at INTEGER,
  ended_at INTEGER,
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS chain_participation (
  chain_id INTEGER NOT NULL,
  torn_id INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (chain_id, torn_id),
  FOREIGN KEY (chain_id) REFERENCES chains(chain_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS organised_crimes (
  crime_id INTEGER PRIMARY KEY,
  completed_at INTEGER,
  successful INTEGER NOT NULL DEFAULT 0,
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS crime_participation (
  crime_id INTEGER NOT NULL,
  torn_id INTEGER NOT NULL,
  PRIMARY KEY (crime_id, torn_id),
  FOREIGN KEY (crime_id) REFERENCES organised_crimes(crime_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tenure_snapshots (
  torn_id INTEGER NOT NULL,
  days_in_faction INTEGER NOT NULL,
  observed_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (torn_id, observed_at)
);

CREATE TABLE IF NOT EXISTS manual_awards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  torn_id INTEGER NOT NULL,
  badge_key TEXT NOT NULL,
  awarded_by INTEGER NOT NULL,
  awarded_at INTEGER NOT NULL DEFAULT (unixepoch()),
  note TEXT,
  revoked_at INTEGER,
  UNIQUE(torn_id, badge_key)
);

-- Permanent Frostbite owner. Name may be refreshed later from Torn.
INSERT INTO members (torn_id, name, role, faction_id)
VALUES (3982553, 'St4TIC', 'owner', 41234)
ON CONFLICT(torn_id) DO UPDATE SET
  role = 'owner',
  faction_id = 41234,
  updated_at = unixepoch();
