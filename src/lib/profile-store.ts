import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CompanyProfile } from "./types";

// Persistência simples em arquivo JSON local (data/profiles.json), indexada por e-mail.
// Em hospedagens serverless o disco é efêmero: troque por um banco de dados nesse caso.

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "profiles.json");

type Store = Record<string, CompanyProfile>;

async function readStore(): Promise<Store> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Store;
  } catch {
    return {};
  }
}

export async function getProfile(email: string) {
  const store = await readStore();
  return store[email.toLowerCase()] ?? null;
}

export async function saveProfile(email: string, profile: CompanyProfile) {
  const store = await readStore();
  store[email.toLowerCase()] = profile;
  await mkdir(DATA_DIR, { recursive: true });
  // Escreve em arquivo temporário e renomeia para não corromper o JSON.
  const tmp = `${FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await rename(tmp, FILE);
}
