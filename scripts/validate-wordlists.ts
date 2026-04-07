#!/usr/bin/env ts-node
// ─── Wordlist Validator ──────────────────────────────────────────────────────
// Checks for duplicates within and across wordlists for all locales.
// Run: npx ts-node scripts/validate-wordlists.ts

import { ptBRLocale } from '../src/locales/pt-BR';
import { ptPTLocale } from '../src/locales/pt-PT';
import { esLocale } from '../src/locales/es';
import type { LocaleData } from '../src/locales/index';

const LOCALES: Record<string, LocaleData> = {
  'pt-BR': ptBRLocale,
  'pt-PT': ptPTLocale,
  'es': esLocale,
};

let errors = 0;

function findDuplicates(name: string, words: string[]): void {
  const seen = new Map<string, number>();
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase().trim();
    if (seen.has(word)) {
      console.error(`  ✗ DUPLICATA em ${name}: "${word}" (índice ${seen.get(word)} e ${i})`);
      errors++;
    } else {
      seen.set(word, i);
    }
  }
}

function findCrossListDuplicates(
  nameA: string, listA: string[],
  nameB: string, listB: string[],
): void {
  const setA = new Set(listA.map(w => w.toLowerCase().trim()));
  for (const word of listB) {
    const normalized = word.toLowerCase().trim();
    if (setA.has(normalized)) {
      console.error(`  ✗ DUPLICATA CRUZADA: "${normalized}" existe em ${nameA} e ${nameB}`);
      errors++;
    }
  }
}

function validateAbbreviations(localeName: string, locale: LocaleData): void {
  const { ABBREVIATION_MAP, HARD_BLOCKED, CONTEXT_SENSITIVE } = locale;
  const hardSet = new Set(HARD_BLOCKED.map(w => w.toLowerCase().trim()));
  const contextSet = new Set(CONTEXT_SENSITIVE.map(w => w.toLowerCase().trim()));
  for (const [abbr, expansion] of Object.entries(ABBREVIATION_MAP)) {
    const inHard = hardSet.has(abbr) || hardSet.has(expansion);
    const inContext = contextSet.has(abbr) || contextSet.has(expansion);
    if (!inHard && !inContext) {
      console.warn(`  ⚠ [${localeName}] Abreviação "${abbr}" → "${expansion}": não está em HARD_BLOCKED nem CONTEXT_SENSITIVE`);
    }
  }

  const seenKeys = new Set<string>();
  for (const key of Object.keys(ABBREVIATION_MAP)) {
    if (seenKeys.has(key)) {
      console.error(`  ✗ DUPLICATA em [${localeName}] ABBREVIATION_MAP: chave "${key}"`);
      errors++;
    }
    seenKeys.add(key);
  }
}

console.log('🔍 Validando wordlists de todos os locales...\n');

for (const [localeName, locale] of Object.entries(LOCALES)) {
  console.log(`\n─── Locale: ${localeName} ───`);
  console.log(`  HARD_BLOCKED: ${locale.HARD_BLOCKED.length} termos`);
  findDuplicates(`[${localeName}] HARD_BLOCKED`, locale.HARD_BLOCKED);

  console.log(`  CONTEXT_SENSITIVE: ${locale.CONTEXT_SENSITIVE.length} termos`);
  findDuplicates(`[${localeName}] CONTEXT_SENSITIVE`, locale.CONTEXT_SENSITIVE);

  console.log(`  ABBREVIATION_MAP: ${Object.keys(locale.ABBREVIATION_MAP).length} mapeamentos`);
  validateAbbreviations(localeName, locale);

  console.log(`  Verificando duplicatas cruzadas (HARD_BLOCKED ↔ CONTEXT_SENSITIVE)...`);
  findCrossListDuplicates(
    `[${localeName}] HARD_BLOCKED`, locale.HARD_BLOCKED,
    `[${localeName}] CONTEXT_SENSITIVE`, locale.CONTEXT_SENSITIVE,
  );
}

console.log('');
if (errors > 0) {
  console.error(`❌ ${errors} problema(s) encontrado(s)!`);
  process.exit(1);
} else {
  console.log('✅ Nenhuma duplicata encontrada em nenhum locale!');
  process.exit(0);
}
