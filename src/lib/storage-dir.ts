import "server-only";
import os from "node:os";
import path from "node:path";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

/**
 * Detecta se a execução está em ambiente serverless (Vercel / AWS Lambda).
 * Nesses ambientes, o diretório do projeto (/var/task) é estritamente somente-leitura.
 * O único diretório com permissão de escrita do SO é `/tmp`.
 */
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);

/**
 * Retorna o diretório base para arquivos graváveis locais.
 */
export function getWritableDataDir(): string {
  if (isServerless) {
    return path.join(/*turbopackIgnore: true*/ os.tmpdir(), "socialpack-data");
  }
  return path.join(process.cwd(), "data");
}

/**
 * Lê um arquivo de dados local.
 * Prioridade:
 * 1. Diretório gravável (/tmp em serverless ou data/ local).
 * 2. Seed original empacotado no projeto (process.cwd()/data/arquivo.json).
 */
export async function readDataFile(filename: string): Promise<string | null> {
  const writablePath = path.join(/*turbopackIgnore: true*/ getWritableDataDir(), filename);
  try {
    return await readFile(/*turbopackIgnore: true*/ writablePath, "utf8");
  } catch {
    // Fallback: lê o seed original bundled no repositório
    const seedPath = path.join(process.cwd(), "data", filename);
    try {
      return await readFile(seedPath, "utf8");
    } catch {
      return null;
    }
  }
}

/**
 * Escreve um arquivo de dados local de forma atômica e segura.
 * Se o diretório padrão não permitir escrita, faz fallback automático para `/tmp`.
 */
export async function writeDataFile(filename: string, content: string): Promise<void> {
  let targetDir = getWritableDataDir();
  try {
    await mkdir(targetDir, { recursive: true });
    const targetPath = path.join(/*turbopackIgnore: true*/ targetDir, filename);
    const tmpPath = `${targetPath}.tmp`;
    await writeFile(/*turbopackIgnore: true*/ tmpPath, content, "utf8");
    await rename(/*turbopackIgnore: true*/ tmpPath, targetPath);
  } catch {
    // Fallback garantido para /tmp em caso de restrições de permissão
    targetDir = path.join(/*turbopackIgnore: true*/ os.tmpdir(), "socialpack-data");
    await mkdir(targetDir, { recursive: true });
    const fallbackPath = path.join(/*turbopackIgnore: true*/ targetDir, filename);
    const tmpPath = `${fallbackPath}.tmp`;
    await writeFile(/*turbopackIgnore: true*/ tmpPath, content, "utf8");
    await rename(/*turbopackIgnore: true*/ tmpPath, fallbackPath);
  }
}
