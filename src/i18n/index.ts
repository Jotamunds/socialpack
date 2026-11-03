import { en, type LocaleMessages } from "./en";

export const DEFAULT_LOCALE = "en" as const;

export type Locale = typeof DEFAULT_LOCALE;

type Leaves<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string ? K : `${K}.${Leaves<T[K]>}`;
    }[keyof T & string];

export type MessageKey = Leaves<LocaleMessages>;

const catalogs: Record<Locale, LocaleMessages> = {
  en,
};

/**
 * Copy for the sale site. Works in Server and Client Components.
 * A later pt.ts can join `catalogs` with the same key shape; callers stay on `t(key)`.
 */
export function t(key: MessageKey, locale: Locale = DEFAULT_LOCALE): string {
  const parts = key.split(".");
  let node: unknown = catalogs[locale];

  for (const part of parts) {
    if (typeof node !== "object" || node === null || !(part in node)) {
      return key;
    }
    node = (node as Record<string, unknown>)[part];
  }

  return typeof node === "string" ? node : key;
}
