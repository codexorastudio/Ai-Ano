import fs from 'node:fs/promises';
import path from 'node:path';
import type { AnalysisResult } from '../lib/analysis-types';

// On Vercel, the filesystem is read-only except for /tmp
// Use /tmp on serverless environments, fallback to local db.json for dev
const IS_READONLY_FS = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DB_PATH = IS_READONLY_FS
  ? '/tmp/db.json'
  : path.join(process.cwd(), 'db.json');

// In-memory fallback if even /tmp fails
const memoryStore: AnalysisResult[] = [];
let useMemory = false;

async function readDB(): Promise<AnalysisResult[]> {
  if (useMemory) return memoryStore;
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeDB(results: AnalysisResult[]): Promise<void> {
  if (useMemory) {
    memoryStore.length = 0;
    memoryStore.push(...results);
    return;
  }
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(results, null, 2));
  } catch {
    // Filesystem is completely read-only, fall back to memory
    useMemory = true;
    memoryStore.length = 0;
    memoryStore.push(...results);
  }
}

export async function saveAnalysisResult(result: AnalysisResult) {
  const results = await readDB();
  results.push(result);
  await writeDB(results);
}

export async function getAnalysisResult(id: string): Promise<AnalysisResult | undefined> {
  const results = await readDB();
  return results.find(r => r.id === id);
}

export async function getAllResults(): Promise<AnalysisResult[]> {
  return readDB();
}
