import { SeededRNG } from './rng';
import {
  FIRST_NAMES,
  LAST_NAMES,
  COUNTRIES,
  CITIES,
  STREETS,
  CURRENCY_SYMBOLS,
} from './data-pools';
import type { ColumnSchema, GenerationSettings, SemanticType } from '@/types/schema';
import type { Row } from '@/types/generation';

function generateUUID(rng: SeededRNG): string {
  const hex = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) uuid += '-';
    if (i === 12) uuid += '4';
    else if (i === 16) uuid += hex[8 + Math.floor(rng.next() * 4)];
    else uuid += hex[Math.floor(rng.next() * 16)];
  }
  return uuid;
}

function generateName(rng: SeededRNG): string {
  return `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
}

function generateEmail(rng: SeededRNG, name?: string): string {
  const first = (name ?? generateName(rng)).split(' ');
  const prefix = `${first[0].toLowerCase()}.${first[1].toLowerCase()}`;
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'proton.me', 'icloud.com', 'company.com'];
  const num = rng.int(1, 999);
  return rng.chance(0.5)
    ? `${prefix}@${rng.pick(domains)}`
    : `${prefix}${num}@${rng.pick(domains)}`;
}

function generatePhone(rng: SeededRNG): string {
  const area = rng.int(200, 989);
  const exchange = rng.int(200, 989);
  const subscriber = rng.int(1000, 9999);
  return `(${area}) ${exchange}-${subscriber}`;
}

function generateAddress(rng: SeededRNG): string {
  return `${rng.int(100, 9999)} ${rng.pick(STREETS)}, ${rng.pick(CITIES)}`;
}

function generateDate(rng: SeededRNG, minYear = 2018, maxYear = 2025): string {
  const year = rng.int(minYear, maxYear);
  const month = rng.int(1, 12);
  const day = rng.int(1, 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function generateAge(rng: SeededRNG, outlier: boolean): number {
  if (outlier) {
    return rng.chance(0.5) ? rng.int(1, 5) : rng.int(90, 99);
  }
  return Math.round(rng.gaussian(38, 13));
}

function generateInteger(rng: SeededRNG, col: ColumnSchema, outlier: boolean): number {
  const min = col.min ?? 1;
  const max = col.max ?? 1000;
  if (outlier) {
    return rng.chance(0.5) ? Math.floor(min * 0.1) : Math.ceil(max * 1.5);
  }
  return rng.int(min, max);
}

function generateDecimal(rng: SeededRNG, col: ColumnSchema, outlier: boolean): number {
  const min = col.min ?? 1;
  const max = col.max ?? 1000;
  if (outlier) {
    return rng.chance(0.5) ? min * 0.01 : max * 2;
  }
  return Math.round(rng.float(min, max) * 100) / 100;
}

function generateCurrency(rng: SeededRNG, outlier: boolean): number {
  if (outlier) {
    return rng.chance(0.5) ? rng.float(0.01, 0.5) : rng.float(50000, 100000);
  }
  return Math.round(rng.gaussian(150, 80) * 100) / 100;
}

function generateText(rng: SeededRNG): string {
  const words = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur',
    'adipiscing', 'elit', 'sed', 'eiusmod', 'tempor', 'incididunt',
    'labore', 'voluptate', 'magna', 'aliqua', 'enim', 'minim',
    'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco',
    'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
    'consequat', 'duis', 'aute', 'irure', 'reprehenderit',
    'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla',
    'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat',
    'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
    'mollit', 'anim', 'id', 'est', 'laborum',
    'project', 'report', 'analysis', 'review', 'summary',
    'document', 'specification', 'requirement', 'milestone',
    'deliverable', 'assessment', 'evaluation', 'benchmark',
  ];
  const length = rng.int(3, 8);
  const selected: string[] = [];
  for (let i = 0; i < length; i++) {
    selected.push(rng.pick(words));
  }
  return selected.join(' ');
}

export function generateValue(
  rng: SeededRNG,
  col: ColumnSchema,
  settings: GenerationSettings,
  isOutlier: boolean,
  rowIndex: number,
): string | number | boolean | null {
  if ((col.nullable ?? false) && rng.chance(settings.nullRate / 100)) {
    return null;
  }

  const semantic = (col.semanticType ?? 'text') as SemanticType;
  switch (semantic) {
    case 'person_name':
      return generateName(rng);
    case 'email':
      return generateEmail(rng);
    case 'phone':
      return generatePhone(rng);
    case 'address':
      return generateAddress(rng);
    case 'date':
      return generateDate(rng);
    case 'age':
      return generateAge(rng, isOutlier);
    case 'integer':
      return generateInteger(rng, col, isOutlier);
    case 'decimal':
      return generateDecimal(rng, col, isOutlier);
    case 'currency':
      return generateCurrency(rng, isOutlier);
    case 'boolean':
      return rng.boolean();
    case 'category':
      if (col.allowedValues && col.allowedValues.length > 0) {
        return rng.pick(col.allowedValues);
      }
      return `Category_${rng.int(1, 10)}`;
    case 'uuid':
      return generateUUID(rng);
    case 'text':
      return generateText(rng);
    default:
      return generateText(rng);
  }
}

export function generateRows(
  columns: ColumnSchema[],
  settings: GenerationSettings,
): Row[] {
  const rng = new SeededRNG(settings.seed);
  const rows: Row[] = [];
  // Tracks used values for primary key AND unique columns to enforce uniqueness.
  const usedValues = new Map<string, Set<string | number>>();

  const needsUniqueness = (col: ColumnSchema): boolean =>
    (col.primaryKey ?? false) || (col.unique ?? false);

  for (let i = 0; i < settings.rowCount; i++) {
    const row: Row = {};
    for (const col of columns) {
      const isOutlier = rng.chance(settings.outlierRate / 100);
      const semantic = (col.semanticType ?? 'text') as SemanticType;
      const mustBeUnique = needsUniqueness(col);

      // PK / unique UUID: generate and retry on collision
      if (mustBeUnique && semantic === 'uuid') {
        let val = generateUUID(rng);
        const keySet = usedValues.get(col.name) ?? new Set();
        let attempts = 0;
        while (keySet.has(val) && attempts < 100) {
          val = generateUUID(rng);
          attempts++;
        }
        keySet.add(val);
        usedValues.set(col.name, keySet);
        row[col.name] = val;
        continue;
      }

      // PK / unique integer: sequential IDs guaranteed unique
      if (mustBeUnique && (semantic === 'integer' || semantic === 'age')) {
        const keySet = usedValues.get(col.name) ?? new Set();
        let val = i + 1;
        while (keySet.has(val)) val++;
        keySet.add(val);
        usedValues.set(col.name, keySet);
        row[col.name] = val;
        continue;
      }

      // Unique email: append a numeric suffix to avoid collisions
      if (mustBeUnique && semantic === 'email') {
        let val = generateEmail(rng);
        const keySet = usedValues.get(col.name) ?? new Set();
        let attempts = 0;
        while (keySet.has(val) && attempts < 100) {
          val = generateEmail(rng) + `_${rng.int(1, 99999)}`;
          attempts++;
        }
        keySet.add(val);
        usedValues.set(col.name, keySet);
        row[col.name] = val;
        continue;
      }

      // Generic unique fallback: append index to ensure uniqueness
      if (mustBeUnique) {
        const keySet = usedValues.get(col.name) ?? new Set<string | number>();
        let val: string | number | null = generateValue(rng, col, settings, isOutlier, i);
        if (val !== null && (typeof val === 'string' || typeof val === 'number')) {
          let attempts = 0;
          while (keySet.has(val) && attempts < 100) {
            const base = generateValue(rng, col, settings, isOutlier, i);
            if (base !== null && typeof base === 'string') {
              val = `${base}_${i}_${attempts}`;
            } else if (base !== null && typeof base === 'number') {
              val = base + i * 1000 + attempts;
            } else {
              break;
            }
            attempts++;
          }
          keySet.add(val);
          usedValues.set(col.name, keySet);
          row[col.name] = val;
          continue;
        }
      }

      row[col.name] = generateValue(rng, col, settings, isOutlier, i);
    }
    rows.push(row);
  }

  return rows;
}

export function formatCurrency(value: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '$';
  return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatValue(value: string | number | boolean | null, semanticType?: string): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}
