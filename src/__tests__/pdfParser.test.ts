/**
 * Unit tests for PDF Parser
 * Tests mapping of Age, Sex, Sleep Hours, HDL, Chest Pain Type
 * Verifies non-hallucination rule: unknown fields must return unknown_field: true
 */

import { describe, it, expect } from 'vitest';
import { parse, convertToFormData, type ParsedField } from '@/utils/pdfParser';

describe('PDF Parser - Critical Field Mapping', () => {
  describe('Required Fields Mapping', () => {
    it('should correctly map Age field', () => {
      const sampleText = `
Patient Information:
Age: 45
Gender: Male
      `;
      
      const result = parse(sampleText);
      
      expect(result.success).toBe(true);
      const ageField = result.parsedFields.find(f => f.fieldName === 'age');
      expect(ageField).toBeDefined();
      expect(ageField?.value).toBe(45);
      expect(ageField?.confidence).toBe('high');
      expect(ageField?.unknown_field).toBeUndefined();
    });

    it('should correctly map Sex/Gender field', () => {
      const sampleText = `
Sex: Male
Gender: Female
      `;
      
      const result = parse(sampleText);
      
      expect(result.success).toBe(true);
      const genderField = result.parsedFields.find(f => f.fieldName === 'gender');
      expect(genderField).toBeDefined();
      expect(genderField?.unknown_field).toBeUndefined();
    });

    it('should correctly map Sleep Hours field', () => {
      const sampleText = `
Sleep Hours: 7
Hours of Sleep: 8
Sleep Duration: 6 hours
      `;
      
      const result = parse(sampleText);
      
      expect(result.success).toBe(true);
      const sleepField = result.parsedFields.find(f => f.fieldName === 'sleep_hours');
      expect(sleepField).toBeDefined();
      expect(sleepField?.value).toBeGreaterThanOrEqual(6);
      expect(sleepField?.value).toBeLessThanOrEqual(8);
      expect(sleepField?.unknown_field).toBeUndefined();
    });

    it('should correctly map HDL Cholesterol field', () => {
      const sampleText = `
HDL: 45
HDL Cholesterol: 50 mg/dL
Good Cholesterol: 48
      `;
      
      const result = parse(sampleText);
      
      expect(result.success).toBe(true);
      const hdlField = result.parsedFields.find(f => f.fieldName === 'hdlCholesterol');
      expect(hdlField).toBeDefined();
      expect(hdlField?.value).toBeGreaterThanOrEqual(45);
      expect(hdlField?.value).toBeLessThanOrEqual(50);
      expect(hdlField?.unknown_field).toBeUndefined();
    });

    it('should correctly map Chest Pain Type field', () => {
      const sampleText = `
Chest Pain Type: Typical Angina
Type of Chest Pain: Atypical
CP Type: Non-anginal
      `;
      
      const result = parse(sampleText);
      
      expect(result.success).toBe(true);
      const chestPainField = result.parsedFields.find(f => f.fieldName === 'chestPainType');
      expect(chestPainField).toBeDefined();
      expect(chestPainField?.unknown_field).toBeUndefined();
    });
  });

  describe('Multiple Field Formats', () => {
    it('should handle colon-separated format', () => {
      const sampleText = 'Age: 45';
      const result = parse(sampleText);
      
      const field = result.parsedFields[0];
      expect(field.fieldName).toBe('age');
      expect(field.value).toBe(45);
    });

    it('should handle equals format', () => {
      const sampleText = 'Age = 50';
      const result = parse(sampleText);
      
      const field = result.parsedFields[0];
      expect(field.fieldName).toBe('age');
      expect(field.value).toBe(50);
    });

    it('should handle space-separated format', () => {
      const sampleText = 'Age 55';
      const result = parse(sampleText);
      
      const field = result.parsedFields[0];
      expect(field.fieldName).toBe('age');
      expect(field.value).toBe(55);
    });
  });

  describe('Validation Rules', () => {
    it('should reject age values outside valid range', () => {
      const sampleText = `
Age: 150
Patient Age: 0
      `;
      
      const result = parse(sampleText);
      
      // Both should be rejected due to validation
      const ageFields = result.parsedFields.filter(f => f.fieldName === 'age');
      expect(ageFields.length).toBe(0);
    });

    it('should validate HDL within range (0-200)', () => {
      const sampleText = `
HDL: 45
HDL: 250
      `;
      
      const result = parse(sampleText);
      
      const validHdl = result.parsedFields.find(f => f.fieldName === 'hdlCholesterol');
      expect(validHdl).toBeDefined();
      expect(validHdl?.value).toBe(45); // First valid one
    });

    it('should validate sleep hours within range (0-24)', () => {
      const sampleText = `
Sleep Hours: 7
Sleep Hours: 30
      `;
      
      const result = parse(sampleText);
      
      const sleepField = result.parsedFields.find(f => f.fieldName === 'sleep_hours');
      expect(sleepField).toBeDefined();
      expect(sleepField?.value).toBe(7);
    });
  });

  describe('Non-Hallucination Rule - Unknown Fields', () => {
    it('should mark unknown labels with unknown_field: true', () => {
      const sampleText = `
Patient Favorite Color: Blue
Shoe Size: 10
Unknown Medical Term: Some Value
      `;
      
      const result = parse(sampleText);
      
      expect(result.unknownFields.length).toBeGreaterThan(0);
      
      result.unknownFields.forEach(field => {
        expect(field.unknown_field).toBe(true);
        expect(field.label).toBeDefined();
        expect(field.value).toBeDefined();
      });
    });

    it('should NOT invent mappings for similar-sounding fields', () => {
      const sampleText = `
Agee: 45
Ager: 50
Aged Person: 60
      `;
      
      const result = parse(sampleText);
      
      // These should be unknown, not mapped to 'age'
      const ageFields = result.parsedFields.filter(f => f.fieldName === 'age');
      expect(ageFields.length).toBe(0);
      
      expect(result.unknownFields.length).toBeGreaterThan(0);
    });

    it('should separate known and unknown fields', () => {
      const sampleText = `
Age: 45
Favorite Food: Pizza
HDL: 50
Eye Color: Brown
Sleep Hours: 7
      `;
      
      const result = parse(sampleText);
      
      expect(result.parsedFields.length).toBe(3); // Age, HDL, Sleep Hours
      expect(result.unknownFields.length).toBe(2); // Favorite Food, Eye Color
      
      // Verify known fields don't have unknown_field flag
      result.parsedFields.forEach(field => {
        expect(field.unknown_field).toBeUndefined();
      });
      
      // Verify unknown fields have the flag
      result.unknownFields.forEach(field => {
        expect(field.unknown_field).toBe(true);
      });
    });
  });

  describe('Comprehensive Sample PDF', () => {
    it('should parse complete medical report correctly', () => {
      const samplePDF = `
CARDIAC RISK ASSESSMENT REPORT
==============================

Patient Information:
Age: 45
Sex: Male
Height: 175 cm
Weight: 80 kg

Vital Signs:
Blood Pressure: 130/85 mmHg
Systolic BP: 130
Diastolic BP: 85
Heart Rate: 75 bpm
Resting Heart Rate: 72 bpm

Laboratory Results:
Total Cholesterol: 220 mg/dL
HDL Cholesterol: 45 mg/dL
LDL Cholesterol: 140 mg/dL
Triglycerides: 180 mg/dL

Medical History:
Diabetes: No
Smoking: Yes
Chest Pain Type: Typical Angina

Lifestyle:
Sleep Hours: 6
Physical Activity: Moderate
      `;
      
      const result = parse(samplePDF);
      
      expect(result.success).toBe(true);
      expect(result.parsedFields.length).toBeGreaterThan(10);
      
      // Verify critical fields
      const criticalFields = ['age', 'gender', 'hdlCholesterol', 'sleep_hours', 'chestPainType'];
      
      criticalFields.forEach(fieldName => {
        const field = result.parsedFields.find(f => f.fieldName === fieldName);
        expect(field, `Field ${fieldName} should be parsed`).toBeDefined();
        expect(field?.unknown_field).toBeUndefined();
      });
      
      // Check specific values
      const age = result.parsedFields.find(f => f.fieldName === 'age');
      expect(age?.value).toBe(45);
      
      const hdl = result.parsedFields.find(f => f.fieldName === 'hdlCholesterol');
      expect(hdl?.value).toBe(45);
      
      const sleep = result.parsedFields.find(f => f.fieldName === 'sleep_hours');
      expect(sleep?.value).toBe(6);
    });
  });

  describe('Form Data Conversion', () => {
    it('should convert parsed fields to form data format', () => {
      const sampleText = `
Age: 45
HDL: 50
Sleep Hours: 7
Gender: Male
      `;
      
      const result = parse(sampleText);
      const formData = convertToFormData(result.parsedFields);
      
      expect(formData.age).toBe(45);
      expect(formData.hdlCholesterol).toBe(50);
      expect(formData.sleep_hours).toBe(7);
      expect(formData.gender).toBeDefined();
    });

    it('should exclude unknown fields from form data', () => {
      const sampleText = `
Age: 45
Favorite Color: Blue
HDL: 50
      `;
      
      const result = parse(sampleText);
      const formData = convertToFormData(result.parsedFields);
      
      expect(formData.age).toBe(45);
      expect(formData.hdlCholesterol).toBe(50);
      expect(Object.keys(formData)).not.toContain('Favorite Color');
      expect(Object.keys(formData)).not.toContain('unknown');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const result = parse('');
      
      expect(result.success).toBe(true);
      expect(result.parsedFields.length).toBe(0);
      expect(result.unknownFields.length).toBe(0);
    });

    it('should handle text with no recognizable patterns', () => {
      const sampleText = `
This is just random text
with no medical information
at all in it
      `;
      
      const result = parse(sampleText);
      
      expect(result.success).toBe(true);
      expect(result.parsedFields.length).toBe(0);
    });

    it('should handle malformed data gracefully', () => {
      const sampleText = `
Age: Not a number
HDL: Invalid
Sleep Hours: Too many
      `;
      
      const result = parse(sampleText);
      
      // All should fail validation
      expect(result.parsedFields.length).toBe(0);
    });

    it('should handle duplicate fields (use first valid occurrence)', () => {
      const sampleText = `
Age: 45
Age: 50
Age: 55
      `;
      
      const result = parse(sampleText);
      
      const ageFields = result.parsedFields.filter(f => f.fieldName === 'age');
      expect(ageFields.length).toBe(1);
      expect(ageFields[0].value).toBe(45); // First occurrence
    });
  });

  describe('Boolean Field Parsing', () => {
    it('should parse boolean fields correctly', () => {
      const sampleText = `
Diabetes: Yes
Smoking: No
Exercise Angina: Positive
      `;
      
      const result = parse(sampleText);
      
      const diabetes = result.parsedFields.find(f => f.fieldName === 'diabetes');
      expect(diabetes?.value).toBe(true);
      
      const smoking = result.parsedFields.find(f => f.fieldName === 'smoking');
      expect(smoking?.value).toBe(false);
    });

    it('should handle various boolean representations', () => {
      const testCases = [
        { text: 'Diabetes: yes', expected: true },
        { text: 'Diabetes: Yes', expected: true },
        { text: 'Diabetes: true', expected: true },
        { text: 'Diabetes: positive', expected: true },
        { text: 'Diabetes: no', expected: false },
        { text: 'Diabetes: false', expected: false },
        { text: 'Diabetes: negative', expected: false },
      ];
      
      testCases.forEach(({ text, expected }) => {
        const result = parse(text);
        const field = result.parsedFields.find(f => f.fieldName === 'diabetes');
        expect(field?.value).toBe(expected);
      });
    });
  });
});
