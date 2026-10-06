#!/usr/bin/env tsx
/**
 * Converts a v1 form-generator schema to the v2 document format.
 *
 *   npm run migrate -- old-schema.json > new-form.json
 *   npm run migrate -- old-schema.json --action action.json --mapping mapping.json -o new-form.json
 *
 * v1 hid every field without `visible: true`; pass --show-hidden to show those fields instead of keeping them hidden.
 *
 * What changed is reported on stderr, the migrated JSON goes to stdout (or `-o <file>`).
 */
import { readFileSync, writeFileSync } from 'fs';
import { migrateV1 } from '../src/utils/migrate';

const args = process.argv.slice(2);
const takeFlag = (name: string) => {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};

const showHidden = args.includes('--show-hidden');
if (showHidden) args.splice(args.indexOf('--show-hidden'), 1);
const out = takeFlag('-o') || takeFlag('--out');
const actionFile = takeFlag('--action');
const mappingFile = takeFlag('--mapping');
const input = args[0];

if (!input || input === '-h' || input === '--help') {
  console.error('Usage: npm run migrate -- <v1-schema.json> [--action action.json] [--mapping mapping.json] [--show-hidden] [-o out.json]');
  process.exit(input ? 0 : 1);
}

const read = (file: string) => JSON.parse(readFileSync(file, 'utf8'));
const { doc, notes } = migrateV1(read(input), {
  action: actionFile ? read(actionFile) : undefined,
  mapping: mappingFile ? read(mappingFile) : undefined,
  showFieldsWithoutVisible: showHidden,
});

console.error('Migration notes:');
notes.forEach(note => console.error(`  - ${note}`));

const json = JSON.stringify(doc, null, 2) + '\n';
if (out) {
  writeFileSync(out, json);
  console.error(`Written to ${out}`);
} else {
  process.stdout.write(json);
}
