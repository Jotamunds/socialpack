import "server-only";
import { readDataFile, writeDataFile } from "./storage-dir";
import type { CompanyProfile } from "./types";

const FILENAME = "profiles.json";

type Store = Record<string, CompanyProfile>;

async function readStore(): Promise<Store> {
  try {
    const raw = await readDataFile(FILENAME);
    return raw ? (JSON.parse(raw) as Store) : {};
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
  await writeDataFile(FILENAME, JSON.stringify(store, null, 2));
}
