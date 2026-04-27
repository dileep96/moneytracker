import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "tracker.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS holdings (
      symbol TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      account TEXT NOT NULL,
      asset_class TEXT NOT NULL,
      currency TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      avg_cost_native REAL NOT NULL DEFAULT 0,
      last_price_native REAL NOT NULL DEFAULT 0,
      last_price_at TEXT,
      source TEXT NOT NULL,
      source_id TEXT,
      first_acquired_at TEXT,
      notes TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS price_history (
      symbol TEXT NOT NULL,
      ts TEXT NOT NULL,
      price_native REAL NOT NULL,
      PRIMARY KEY (symbol, ts)
    );

    CREATE TABLE IF NOT EXISTS dca_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      ts TEXT NOT NULL,
      amount_aed REAL NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      ts TEXT PRIMARY KEY,
      total_aed REAL NOT NULL,
      total_usd REAL NOT NULL,
      payload_json TEXT NOT NULL
    );
  `);
}

export type HoldingRow = {
  symbol: string;
  name: string;
  account: string;
  asset_class: string;
  currency: string;
  quantity: number;
  avg_cost_native: number;
  last_price_native: number;
  last_price_at: string | null;
  source: string;
  source_id: string | null;
  first_acquired_at: string | null;
  notes: string | null;
  updated_at: string;
};

export function listHoldings(): HoldingRow[] {
  return getDb().prepare("SELECT * FROM holdings").all() as HoldingRow[];
}

export function upsertHolding(h: Partial<HoldingRow> & { symbol: string }) {
  const existing = getDb().prepare("SELECT * FROM holdings WHERE symbol = ?").get(h.symbol) as HoldingRow | undefined;
  const row: HoldingRow = {
    symbol: h.symbol,
    name: h.name ?? existing?.name ?? h.symbol,
    account: h.account ?? existing?.account ?? "ibkr",
    asset_class: h.asset_class ?? existing?.asset_class ?? "equity_etf",
    currency: h.currency ?? existing?.currency ?? "USD",
    quantity: h.quantity ?? existing?.quantity ?? 0,
    avg_cost_native: h.avg_cost_native ?? existing?.avg_cost_native ?? 0,
    last_price_native: h.last_price_native ?? existing?.last_price_native ?? 0,
    last_price_at: h.last_price_at ?? existing?.last_price_at ?? null,
    source: h.source ?? existing?.source ?? "manual",
    source_id: h.source_id ?? existing?.source_id ?? null,
    first_acquired_at: h.first_acquired_at ?? existing?.first_acquired_at ?? null,
    notes: h.notes ?? existing?.notes ?? null,
    updated_at: new Date().toISOString(),
  };
  getDb()
    .prepare(
      `INSERT INTO holdings
        (symbol, name, account, asset_class, currency, quantity, avg_cost_native,
         last_price_native, last_price_at, source, source_id, first_acquired_at, notes, updated_at)
       VALUES (@symbol, @name, @account, @asset_class, @currency, @quantity, @avg_cost_native,
         @last_price_native, @last_price_at, @source, @source_id, @first_acquired_at, @notes, @updated_at)
       ON CONFLICT(symbol) DO UPDATE SET
         name=excluded.name,
         account=excluded.account,
         asset_class=excluded.asset_class,
         currency=excluded.currency,
         quantity=excluded.quantity,
         avg_cost_native=excluded.avg_cost_native,
         last_price_native=excluded.last_price_native,
         last_price_at=excluded.last_price_at,
         source=excluded.source,
         source_id=excluded.source_id,
         first_acquired_at=COALESCE(holdings.first_acquired_at, excluded.first_acquired_at),
         notes=excluded.notes,
         updated_at=excluded.updated_at`,
    )
    .run(row);
}

export function recordPrice(symbol: string, priceNative: number, ts: string = new Date().toISOString()) {
  getDb()
    .prepare("INSERT OR REPLACE INTO price_history (symbol, ts, price_native) VALUES (?, ?, ?)")
    .run(symbol, ts, priceNative);
}

export function logDca(symbol: string, amountAed: number, note?: string) {
  getDb()
    .prepare("INSERT INTO dca_log (symbol, ts, amount_aed, note) VALUES (?, ?, ?, ?)")
    .run(symbol, new Date().toISOString(), amountAed, note ?? null);
}

export function dcaThisMonth(symbol: string): number {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const r = getDb()
    .prepare("SELECT COALESCE(SUM(amount_aed), 0) AS total FROM dca_log WHERE symbol = ? AND ts >= ?")
    .get(symbol, start.toISOString()) as { total: number };
  return r.total;
}

export function getSetting(key: string): string | null {
  const r = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return r?.value ?? null;
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
    .run(key, value);
}

export function saveSnapshot(totalAed: number, totalUsd: number, payload: unknown) {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO portfolio_snapshots (ts, total_aed, total_usd, payload_json) VALUES (?, ?, ?, ?)",
    )
    .run(new Date().toISOString(), totalAed, totalUsd, JSON.stringify(payload));
}

export function recentSnapshots(limit = 90) {
  return getDb()
    .prepare("SELECT ts, total_aed, total_usd FROM portfolio_snapshots ORDER BY ts DESC LIMIT ?")
    .all(limit) as { ts: string; total_aed: number; total_usd: number }[];
}
