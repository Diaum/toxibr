#!/usr/bin/env ts-node
// ─── Wordlist Validator ──────────────────────────────────────────────────────
// Checks for duplicates within and across wordlists.
// Run: npx ts-node scripts/validate-wordlists.ts

import { HARD_BLOCKED, CONTEXT_SENSITIVE, ABBREVIATION_MAP } from '../src/wordlists';

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
  nameA: string,
  listA: string[],
  nameB: string,
  listB: string[]
): void {
  const setA = new Set(listA.map((w) => w.toLowerCase().trim()));
  for (const word of listB) {
    const normalized = word.toLowerCase().trim();
    if (setA.has(normalized)) {
      console.error(`  ✗ DUPLICATA CRUZADA: "${normalized}" existe em ${nameA} e ${nameB}`);
      errors++;
    }
  }
}

function validateAbbreviations(): void {
  const abbrevKeys = Object.keys(ABBREVIATION_MAP);

  // Check if abbreviation expands to something in HARD_BLOCKED or CONTEXT_SENSITIVE
  const hardSet = new Set(HARD_BLOCKED.map((w) => w.toLowerCase().trim()));
  const contextSet = new Set(CONTEXT_SENSITIVE.map((w) => w.toLowerCase().trim()));
  for (const [abbr, expansion] of Object.entries(ABBREVIATION_MAP)) {
    const inHard = hardSet.has(abbr) || hardSet.has(expansion);
    const inContext = contextSet.has(abbr) || contextSet.has(expansion);
    if (!inHard && !inContext) {
      console.warn(
        `  ⚠ Abreviação "${abbr}" → "${expansion}": não está em HARD_BLOCKED nem CONTEXT_SENSITIVE`
      );
    }
  }

  // Check for duplicate abbreviation keys
  const seenKeys = new Set<string>();
  for (const key of abbrevKeys) {
    if (seenKeys.has(key)) {
      console.error(`  ✗ DUPLICATA em ABBREVIATION_MAP: chave "${key}"`);
      errors++;
    }
    seenKeys.add(key);
  }
}

console.log('🔍 Validando wordlists...\n');

console.log(`HARD_BLOCKED: ${HARD_BLOCKED.length} termos`);
findDuplicates('HARD_BLOCKED', HARD_BLOCKED);

console.log(`CONTEXT_SENSITIVE: ${CONTEXT_SENSITIVE.length} termos`);
findDuplicates('CONTEXT_SENSITIVE', CONTEXT_SENSITIVE);

console.log(`ABBREVIATION_MAP: ${Object.keys(ABBREVIATION_MAP).length} mapeamentos`);
validateAbbreviations();

console.log('\nVerificando duplicatas cruzadas...');
findCrossListDuplicates('HARD_BLOCKED', HARD_BLOCKED, 'CONTEXT_SENSITIVE', CONTEXT_SENSITIVE);

console.log('');
if (errors > 0) {
  console.error(`❌ ${errors} problema(s) encontrado(s)!`);
  process.exit(1);
} else {
  console.log('✅ Nenhuma duplicata encontrada!');
  process.exit(0);
}
