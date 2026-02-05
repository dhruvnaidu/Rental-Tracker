import { formatCurrency, formatDate } from './helpers';

describe('Helper Functions', () => {
  
  // Test 1: Currency Formatting
  describe('formatCurrency', () => {
    test('formats numbers to INR currency', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00');
      expect(formatCurrency(1500.50)).toBe('₹1,500.50');
    });

    test('handles string inputs safely', () => {
      expect(formatCurrency('500')).toBe('₹500.00');
    });

    test('returns ₹0.00 for invalid inputs', () => {
      expect(formatCurrency(null)).toBe('₹0.00');
      expect(formatCurrency(undefined)).toBe('₹0.00');
      expect(formatCurrency('abc')).toBe('₹0.00');
    });
  });

  // Test 2: Date Formatting
  describe('formatDate', () => {
    test('formats YYYY-MM-DD to readable date', () => {
      // Note: We avoid strict string matching for dates due to timezone differences
      // Instead, we check if it contains the month and year
      const result = formatDate('2024-01-01');
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });

    test('returns hyphen for invalid dates', () => {
      expect(formatDate('')).toBe('-');
      expect(formatDate(null)).toBe('-');
      expect(formatDate('invalid-date')).toBe('-');
    });
  });

});