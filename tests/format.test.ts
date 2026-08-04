import { describe, expect, it } from 'vitest';
import {
  onlyDigits,
  parsePncpDate,
  reaisToCentavos,
  slugify,
  toAaaammdd,
} from '@/lib/format';

describe('reaisToCentavos', () => {
  it('converte reais para centavos', () => {
    expect(reaisToCentavos(10)).toBe(1000n);
    expect(reaisToCentavos(10.5)).toBe(1050n);
    expect(reaisToCentavos('1234.56')).toBe(123456n);
    expect(reaisToCentavos(10.99)).toBe(1099n);
  });

  it('trata nulos e inválidos como zero', () => {
    expect(reaisToCentavos(null)).toBe(0n);
    expect(reaisToCentavos(undefined)).toBe(0n);
    expect(reaisToCentavos('')).toBe(0n);
    expect(reaisToCentavos(Number.NaN)).toBe(0n);
  });
});

describe('parsePncpDate', () => {
  it('parseia AAAAMMDD', () => {
    const d = parsePncpDate('20260801');
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2026);
  });

  it('parseia ISO', () => {
    const d = parsePncpDate('2026-08-01T15:30:00');
    expect(d).toBeInstanceOf(Date);
  });

  it('retorna null para inválido', () => {
    expect(parsePncpDate(null)).toBeNull();
    expect(parsePncpDate('não-é-data')).toBeNull();
  });
});

describe('slugify / onlyDigits / toAaaammdd', () => {
  it('slugify remove acentos', () => {
    expect(slugify('São Paulo / SP')).toBe('sao-paulo-sp');
  });

  it('onlyDigits', () => {
    expect(onlyDigits('12.345.678/0001-90')).toBe('12345678000190');
  });

  it('toAaaammdd', () => {
    const d = new Date('2026-08-01T15:00:00-03:00');
    expect(toAaaammdd(d)).toBe('20260801');
  });
});
