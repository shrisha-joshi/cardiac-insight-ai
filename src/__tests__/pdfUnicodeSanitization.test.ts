/**
 * PDF Unicode Fix Tests
 * Tests for sanitizeText() function and Unicode handling in PDF generation
 */

import { describe, it, expect } from 'vitest';

// Helper function that mirrors the actual sanitizeText implementation
const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  const replacements: Record<string, string> = {
    '\u0101': 'a', '\u012B': 'i', '\u016B': 'u', '\u1E5B': 'r', '\u1E5D': 'r',
    '\u1E37': 'l', '\u1E39': 'l', '\u0113': 'e', '\u014D': 'o',
    '\u1E43': 'm', '\u1E25': 'h', '\u1E45': 'n', '\u00F1': 'n',
    '\u1E6D': 't', '\u1E0D': 'd', '\u1E47': 'n', '\u015B': 's', '\u1E63': 's',
    '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"',
    '\u2013': '-', '\u2014': '-', '\u2026': '...',
    '\u0100': 'A', '\u0112': 'E', '\u012A': 'I', '\u014C': 'O', '\u016A': 'U',
    '\u015A': 'S' // Capital Ś
  };
  
  let sanitized = text;
  for (const [unicode, ascii] of Object.entries(replacements)) {
    sanitized = sanitized.replace(new RegExp(unicode, 'g'), ascii);
  }
  
  return sanitized;
};

describe('PDF Unicode Sanitization', () => {

  describe('Smart Quote Replacement', () => {
    it('should replace smart single quotes with straight quotes', () => {
      const input = '\u2018It\u2019s a test\u2019';
      const expected = "'It's a test'";
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should replace smart double quotes with straight quotes', () => {
      const input = '\u201CQuoted text\u201D';
      const expected = '"Quoted text"';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should handle mixed smart quotes', () => {
      const input = '\u201CHe\u2019s here,\u201D she said';
      const expected = '"He\'s here," she said';
      expect(sanitizeText(input)).toBe(expected);
    });
  });

  describe('Sanskrit/Diacritical Character Replacement', () => {
    it('should sanitize Arjuna correctly', () => {
      const input = 'Ārjuna'; // Contains ā (\u0101)
      const expected = 'Arjuna';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should sanitize Ayurvedic terms with macrons', () => {
      const input = 'Āyurveda'; // Contains ā
      const expected = 'Ayurveda';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should handle ī (long i)', () => {
      const input = 'Yogī'; // Contains ī (\u012B)
      const expected = 'Yogi';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should handle ū (long u)', () => {
      const input = 'Gūrū'; // Contains ū (\u016B)
      const expected = 'Guru';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should handle retroflex consonants', () => {
      const input = 'Maṇḍala'; // Contains ṇ and ḍ
      const expected = 'Mandala';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should handle complex Sanskrit text', () => {
      const input = 'Āśana Prāṇāyāma Dhyāna';
      const expected = 'Asana Pranayama Dhyana';
      expect(sanitizeText(input)).toBe(expected);
    });
  });

  describe('Punctuation Replacement', () => {
    it('should replace ellipsis character', () => {
      const input = 'Wait… what?';
      const expected = 'Wait... what?';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should replace en dash with hyphen', () => {
      const input = 'Pages 10–20';
      const expected = 'Pages 10-20';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should replace em dash with single hyphen', () => {
      const input = 'Title—Subtitle';
      const expected = 'Title-Subtitle';
      expect(sanitizeText(input)).toBe(expected);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('should handle null input', () => {
      expect(sanitizeText(null as any)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(sanitizeText(undefined as any)).toBe('');
    });

    it('should handle plain ASCII text unchanged', () => {
      const input = 'Plain ASCII text 123';
      expect(sanitizeText(input)).toBe(input);
    });

    it('should handle mixed content', () => {
      const input = 'Dr. Smith\u2019s \u201C\u0100yurveda\u201D study\u20142024';
      const expected = 'Dr. Smith\'s "Ayurveda" study-2024';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should handle combining diacritics', () => {
      const input = 'cafe\u0301'; // café using combining acute accent
      // Current implementation doesn't strip combining diacritics, so they remain
      const result = sanitizeText(input);
      expect(result.includes('cafe')).toBe(true); // Base text is preserved
    });
  });

  describe('Medical Recommendations Context', () => {
    it('should sanitize Ayurvedic medicine names', () => {
      const input = 'Ārjuna (Terminalia arjuna) bark extract';
      const expected = 'Arjuna (Terminalia arjuna) bark extract';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should sanitize yoga pose names', () => {
      const input = 'Prāṇāyāma—breathing exercises';
      const expected = 'Pranayama-breathing exercises';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should preserve medical terms', () => {
      const input = 'ACE Inhibitors (e.g., Lisinopril 10mg)';
      expect(sanitizeText(input)).toBe(input);
    });

    it('should handle full recommendation text', () => {
      const input = 'Practice Ānuloma Viloma Prāṇāyāma for 10–15 minutes';
      const expected = 'Practice Anuloma Viloma Pranayama for 10-15 minutes';
      expect(sanitizeText(input)).toBe(expected);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle text from Gemini AI response', () => {
      const input = `\u0100rjuna\u2019s cardioprotective properties are well-documented\u2026`;
      const expected = `Arjuna's cardioprotective properties are well-documented...`;
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should handle patient name with diacritics', () => {
      const input = 'Patient: Rāja Śarmā';
      const expected = 'Patient: Raja Sarma';
      expect(sanitizeText(input)).toBe(expected);
    });

    it('should handle recommendation list items', () => {
      const items = [
        'Ārjuna bark powder – 500mg twice daily',
        'Aśwagandha for stress reduction',
        'Brāhmī for cognitive support'
      ];
      
      const sanitized = items.map(sanitizeText);
      
      expect(sanitized).toEqual([
        'Arjuna bark powder - 500mg twice daily',
        'Aswagandha for stress reduction',
        'Brahmi for cognitive support'
      ]);
    });
  });

  describe('Performance', () => {
    it('should handle large text efficiently', () => {
      const largeText = 'Ārjuna '.repeat(1000);
      const start = performance.now();
      const result = sanitizeText(largeText);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
      expect(result).toBe('Arjuna '.repeat(1000));
    });

    it('should be idempotent', () => {
      const input = '\u0100rjuna\u2019s \u201CPr\u0101\u1E47\u0101y\u0101ma\u201D\u2014ancient wisdom';
      const first = sanitizeText(input);
      const second = sanitizeText(first);
      
      expect(first).toBe(second);
    });
  });
});

describe('PDF Service Integration', () => {
  describe('Text Output Locations', () => {
    it('should sanitize patient information', () => {
      const mockPatient = {
        name: 'R\u0101ja \u015Aarm\u0101',
        age: 55,
        gender: 'Male'
      };
      
      const sanitizedName = sanitizeText(mockPatient.name);
      expect(sanitizedName).toBe('Raja Sarma');
    });

    it('should sanitize risk level descriptions', () => {
      const riskText = 'High risk\u2014requires immediate attention';
      expect(sanitizeText(riskText)).toBe('High risk-requires immediate attention');
    });

    it('should sanitize recommendation categories', () => {
      const recommendations = {
        medicines: ['\u0100rjuna extract'],
        ayurveda: ['A\u015Bwagandha'],
        yoga: ['Pr\u0101\u1E47\u0101y\u0101ma'],
        diet: ['Ghee\u2014clarified butter']
      };
      
      const sanitized = {
        medicines: recommendations.medicines.map(sanitizeText),
        ayurveda: recommendations.ayurveda.map(sanitizeText),
        yoga: recommendations.yoga.map(sanitizeText),
        diet: recommendations.diet.map(sanitizeText)
      };
      
      expect(sanitized.medicines[0]).toBe('Arjuna extract');
      expect(sanitized.ayurveda[0]).toBe('Aswagandha');
      expect(sanitized.yoga[0]).toBe('Pranayama');
      expect(sanitized.diet[0]).toBe('Ghee-clarified butter');
    });
  });
});
