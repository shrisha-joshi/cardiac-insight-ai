/**
 * Integration tests for PDF Auto-Fill feature
 * Tests end-to-end workflow: PDF upload → parsing → form population
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from '@/utils/pdfParser';
import { parsePDFForFormData } from '@/services/pdfParserService';
import fieldMappings from '@/constants/fieldMap.json';

describe('PDF Auto-Fill Integration Tests', () => {
  describe('Field Mapping Verification', () => {
    it('should have mappings for all critical fields mentioned in README', () => {
      const criticalFields = ['age', 'gender', 'sleep_hours', 'hdlCholesterol', 'chestPainType'];
      
      criticalFields.forEach(fieldName => {
        expect(fieldMappings).toHaveProperty(fieldName);
        const mapping = fieldMappings[fieldName as keyof typeof fieldMappings];
        expect(mapping.fieldName).toBe(fieldName);
        expect(mapping.labels).toBeInstanceOf(Array);
        expect(mapping.labels.length).toBeGreaterThan(0);
      });
    });

    it('should have validation rules for numeric fields', () => {
      const numericFields = ['age', 'sleep_hours', 'hdlCholesterol'];
      
      numericFields.forEach(fieldName => {
        const mapping = fieldMappings[fieldName as keyof typeof fieldMappings];
        expect(mapping.type).toBe('number');
        if ('validation' in mapping) {
          expect(mapping.validation).toBeDefined();
          expect(mapping.validation?.min).toBeDefined();
          expect(mapping.validation?.max).toBeDefined();
        }
      });
    });
  });

  describe('Sample Clinical PDF Parsing', () => {
    const sampleClinicalPDF = `
CARDIAC RISK ASSESSMENT REPORT
===============================
Patient ID: 12345
Report Date: November 18, 2025

PATIENT INFORMATION
-------------------
Age: 45 years
Sex: Male
Height: 175 cm
Weight: 80 kg
Waist Circumference: 92 cm

VITAL SIGNS
-----------
Blood Pressure: 130/85 mmHg
Systolic BP: 130
Diastolic BP: 85
Resting Heart Rate: 72 bpm
Heart Rate: 75 bpm

LABORATORY RESULTS
------------------
Total Cholesterol: 220 mg/dL
HDL Cholesterol: 45 mg/dL
LDL Cholesterol: 140 mg/dL
Triglycerides: 180 mg/dL

MEDICAL HISTORY
---------------
Diabetes: No
Smoking: Yes
Chest Pain Type: Typical Angina
Exercise Angina: No
Previous Heart Attack: No
Family History: Yes

LIFESTYLE FACTORS
-----------------
Sleep Hours: 6
Physical Activity: Moderate
Dietary Pattern: Western

UNKNOWN FIELDS (Should be marked)
----------------------------------
Favorite Color: Blue
Shoe Size: 10
Patient's Hobby: Reading
`;

    it('should parse all critical fields from sample PDF', () => {
      const result = parse(sampleClinicalPDF);
      
      expect(result.success).toBe(true);
      expect(result.parsedFields.length).toBeGreaterThan(0);
      
      // Critical fields must be present
      const fieldNames = result.parsedFields.map(f => f.fieldName);
      expect(fieldNames).toContain('age');
      expect(fieldNames).toContain('gender');
      expect(fieldNames).toContain('hdlCholesterol');
      expect(fieldNames).toContain('sleep_hours');
      expect(fieldNames).toContain('chestPainType');
    });

    it('should extract correct values for critical fields', () => {
      const result = parse(sampleClinicalPDF);
      
      const age = result.parsedFields.find(f => f.fieldName === 'age');
      expect(age?.value).toBe(45);
      
      const hdl = result.parsedFields.find(f => f.fieldName === 'hdlCholesterol');
      expect(hdl?.value).toBe(45);
      
      const sleep = result.parsedFields.find(f => f.fieldName === 'sleep_hours');
      expect(sleep?.value).toBe(6);
      
      const gender = result.parsedFields.find(f => f.fieldName === 'gender');
      expect(gender?.value).toBeDefined();
    });

    it('should mark unknown fields correctly', () => {
      const result = parse(sampleClinicalPDF);
      
      expect(result.unknownFields.length).toBeGreaterThan(0);
      
      // Verify unknown fields have the flag
      result.unknownFields.forEach(field => {
        expect(field.unknown_field).toBe(true);
      });
      
      // Check for specific unknown fields
      const unknownLabels = result.unknownFields.map(f => f.label.toLowerCase());
      expect(unknownLabels.some(label => 
        label.includes('color') || 
        label.includes('shoe') || 
        label.includes('hobby')
      )).toBe(true);
    });

    it('should not include unknown fields in parsed fields array', () => {
      const result = parse(sampleClinicalPDF);
      
      // Known fields should not have unknown_field flag
      result.parsedFields.forEach(field => {
        expect(field.unknown_field).toBeUndefined();
      });
      
      // Unknown fields should only be in unknownFields array
      const parsedFieldNames = result.parsedFields.map(f => f.fieldName);
      expect(parsedFieldNames).not.toContain('unknown');
    });
  });

  describe('Form Data Conversion', () => {
    it('should convert parsed fields to correct form field names', () => {
      const sampleText = `
Age: 45
HDL: 50
Sleep Hours: 7
Sex: Male
      `;
      
      const result = parse(sampleText);
      
      // Check field name mappings
      const fieldNames = result.parsedFields.map(f => f.fieldName);
      expect(fieldNames).toContain('age');
      expect(fieldNames).toContain('hdlCholesterol');
      expect(fieldNames).toContain('sleep_hours');
      expect(fieldNames).toContain('gender');
      
      // Verify no unknown fields
      expect(result.unknownFields.length).toBe(0);
    });
  });

  describe('ML Service Field Name Compatibility', () => {
    it('should use field names compatible with backend ML service', () => {
      const sampleText = `
Age: 45
Gender: Male
Sleep Hours: 7
HDL Cholesterol: 50
Chest Pain Type: Typical
      `;
      
      const result = parse(sampleText);
      
      // These field names should match what the ML service expects
      const expectedMLFields = {
        age: 45,
        gender: 'Male',
        sleep_hours: 7,
        hdlCholesterol: 50,
        chestPainType: 'Typical'
      };
      
      result.parsedFields.forEach(field => {
        if (field.fieldName in expectedMLFields) {
          expect(field.value).toBeDefined();
        }
      });
    });
  });

  describe('Validation Edge Cases', () => {
    it('should reject values outside valid ranges', () => {
      const sampleText = `
Age: 150
HDL: 300
Sleep Hours: 30
      `;
      
      const result = parse(sampleText);
      
      // All should fail validation
      expect(result.parsedFields.length).toBe(0);
    });

    it('should accept values within valid ranges', () => {
      const sampleText = `
Age: 45
HDL: 50
Sleep Hours: 7
      `;
      
      const result = parse(sampleText);
      
      expect(result.parsedFields.length).toBe(3);
      
      result.parsedFields.forEach(field => {
        expect(field.value).toBeDefined();
        expect(field.unknown_field).toBeUndefined();
      });
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign high confidence to exact matches', () => {
      const sampleText = `
Age: 45
HDL: 50
      `;
      
      const result = parse(sampleText);
      
      result.parsedFields.forEach(field => {
        expect(field.confidence).toBe('high');
      });
    });
  });

  describe('Browser Console Logging Test', () => {
    it('should provide detailed console output for debugging', () => {
      const sampleText = `
Age: 45
HDL: 50
Unknown Field: Some Value
      `;
      
      const result = parse(sampleText);
      
      console.log('\n=== PDF Parsing Results ===');
      console.log('Success:', result.success);
      console.log('Parsed Fields:', result.parsedFields.length);
      console.log('Unknown Fields:', result.unknownFields.length);
      
      console.log('\n--- Known Fields ---');
      result.parsedFields.forEach(field => {
        console.log(`${field.fieldName}: ${field.value} (${field.confidence})`);
      });
      
      console.log('\n--- Unknown Fields ---');
      result.unknownFields.forEach(field => {
        console.log(`${field.label}: ${field.value} (unknown_field: ${field.unknown_field})`);
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe('Non-Hallucination Verification', () => {
    it('should never invent field mappings', () => {
      const sampleText = `
Patient's Favorite Food: Pizza
Eye Color: Brown
Blood Type: O+
Marital Status: Married
      `;
      
      const result = parse(sampleText);
      
      // None of these should be mapped to known fields
      expect(result.parsedFields.length).toBe(0);
      
      // All should be unknown
      expect(result.unknownFields.length).toBeGreaterThan(0);
      
      result.unknownFields.forEach(field => {
        expect(field.unknown_field).toBe(true);
      });
    });

    it('should strictly follow fieldMap.json mappings', () => {
      const sampleText = `
Age: 45
Agee: 50
Patient Age: 55
      `;
      
      const result = parse(sampleText);
      
      // Only "Age" and "Patient Age" should be mapped
      const ageFields = result.parsedFields.filter(f => f.fieldName === 'age');
      expect(ageFields.length).toBe(1);
      
      // "Agee" should be unknown
      const unknownLabels = result.unknownFields.map(f => f.label);
      expect(unknownLabels.some(label => label.toLowerCase().includes('agee'))).toBe(true);
    });
  });

  describe('Acceptance Criteria Verification', () => {
    it('should parse sample PDF and show fields in confirmation modal format', () => {
      const samplePDF = `
Age: 45
Sex: Male
HDL: 50
Sleep Hours: 7
Chest Pain Type: Typical Angina
      `;
      
      const result = parse(samplePDF);
      
      // All critical fields should be present
      expect(result.parsedFields.length).toBe(5);
      
      // Format for modal display
      const modalData = result.parsedFields.map(field => ({
        label: field.label,
        value: field.value,
        fieldName: field.fieldName,
        confidence: field.confidence,
        isUnknown: field.unknown_field || false
      }));
      
      expect(modalData.length).toBe(5);
      modalData.forEach(item => {
        expect(item.isUnknown).toBe(false);
        expect(item.confidence).toBeDefined();
      });
    });

    it('should populate form inputs when accepted', () => {
      const samplePDF = `
Age: 45
HDL: 50
Sleep Hours: 7
      `;
      
      const result = parse(samplePDF);
      
      // Simulate form population
      const formData: Record<string, string | number | boolean | null> = {};
      result.parsedFields.forEach(field => {
        if (!field.unknown_field) {
          formData[field.fieldName] = field.value;
        }
      });
      
      expect(formData.age).toBe(45);
      expect(formData.hdlCholesterol).toBe(50);
      expect(formData.sleep_hours).toBe(7);
      expect(Object.keys(formData).length).toBe(3);
    });
  });
});
