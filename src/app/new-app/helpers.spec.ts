/// <reference types="jasmine" />

import { excelColumnLabel, generateColumnLabels } from './helpers';

describe('helpers', () => {
  describe('excelColumnLabel', () => {
    it('converts zero-based indexes to Excel column labels', () => {
      expect(excelColumnLabel(0)).toBe('A');
      expect(excelColumnLabel(25)).toBe('Z');
      expect(excelColumnLabel(26)).toBe('AA');
      expect(excelColumnLabel(51)).toBe('AZ');
      expect(excelColumnLabel(52)).toBe('BA');
    });
  });

  describe('generateColumnLabels', () => {
    it('generates labels from A for the requested count', () => {
      expect(generateColumnLabels(5)).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('continues through the multi-letter column boundary', () => {
      expect(generateColumnLabels(28).slice(24)).toEqual(['Y', 'Z', 'AA', 'AB']);
    });

    it('returns an empty array for a zero count', () => {
      expect(generateColumnLabels(0)).toEqual([]);
    });
  });
});
