import fs from 'node:fs/promises';
import path from 'node:path';
import type { AnalysisResult } from '../lib/analysis-types';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Initialize the database file if it doesn't exist
async function initDB() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify([]));
  }
}

export async function saveAnalysisResult(result: AnalysisResult) {
  await initDB();
  const data = await fs.readFile(DB_PATH, 'utf-8');
  const results: AnalysisResult[] = JSON.parse(data);
  results.push(result);
  await fs.writeFile(DB_PATH, JSON.stringify(results, null, 2));
}

export async function getAnalysisResult(id: string): Promise<AnalysisResult | undefined> {
  await initDB();
  const data = await fs.readFile(DB_PATH, 'utf-8');
  const results: AnalysisResult[] = JSON.parse(data);
  return results.find(r => r.id === id);
}

export async function getAllResults(): Promise<AnalysisResult[]> {
  await initDB();
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}
