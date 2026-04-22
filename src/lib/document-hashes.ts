import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface DocumentHashEntry {
  file: string;
  algorithm: 'sha256';
  hash: string;
  bytes: number;
}

export interface DocumentHashes {
  politica_tratamiento_datos: DocumentHashEntry;
  politica_datos_sensibles: DocumentHashEntry;
}

const FILES = {
  politica_tratamiento_datos: 'politica-tratamiento-datos.pdf',
  politica_datos_sensibles: 'politica-datos-sensibles.pdf',
} as const;

let cache: DocumentHashes | null = null;
let inflight: Promise<DocumentHashes> | null = null;

async function hashFile(relPath: string): Promise<DocumentHashEntry> {
  const abs = path.join(process.cwd(), 'public', relPath);
  const buf = await readFile(abs);
  const hash = createHash('sha256').update(buf).digest('hex');
  return { file: relPath, algorithm: 'sha256', hash, bytes: buf.byteLength };
}

export async function getDocumentHashes(): Promise<DocumentHashes> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const [tratamiento, sensibles] = await Promise.all([
      hashFile(FILES.politica_tratamiento_datos),
      hashFile(FILES.politica_datos_sensibles),
    ]);
    cache = {
      politica_tratamiento_datos: tratamiento,
      politica_datos_sensibles: sensibles,
    };
    return cache;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
