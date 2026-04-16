import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import * as path from 'path';
import * as fs from 'fs';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;

  const dbPath = path.resolve(process.cwd(), 'database', 'agente.db');
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await initSchema(db);
  return db;
}

async function initSchema(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS proyectos (
      id TEXT PRIMARY KEY,
      nombre_obra TEXT NOT NULL,
      ubicacion TEXT,
      usuario_id TEXT NOT NULL,
      estudio_id TEXT NOT NULL,
      fecha_creacion TEXT NOT NULL,
      blueprint_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS presupuestos (
      id TEXT PRIMARY KEY,
      proyecto_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      total_estimado REAL NOT NULL,
      costo_m2 REAL NOT NULL,
      divisa TEXT NOT NULL,
      datos_json TEXT NOT NULL,
      validacion_json TEXT,
      FOREIGN KEY (proyecto_id) REFERENCES proyectos (id)
    );

    CREATE TABLE IF NOT EXISTS market_intel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      tasa_blue REAL NOT NULL,
      tasa_mep REAL
    );
  `);
}
