/**
 * Example usage and test cases for PDF parsing functionality
 */

import { parsePDFForFormData, filterByConfidence, convertToFormData } from '@/services/pdfParserService';
import { findMatchingField, validateValue } from '@/lib/pdfFieldMapping';

// Example 1: Basic PDF parsing
async function exampleBasicParsing(pdfFile: File) {
  const result = await parsePDFForFormData(pdfFile);
  
  console.log('Parse Result:', {
    success: result.success,
    fieldCount: result.parsedFields.length,
    method: result.extractionMethod,
    unmapped: result.unmappedData.length
  });
  
  // Display parsed fields
  result.parsedFields.forEach(field => {
    console.log(`${field.fieldName}: ${field.value} (${field.confidence})`);
  });
}

// Example 2: Filter by confidence
async function exampleFilterByConfidence(pdfFile: File) {
  const result = await parsePDFForFormData(pdfFile);
  
  // Only use high confidence fields
  const highConfidence = filterByConfidence(result.parsedFields, 'high');
  console.log('High confidence fields:', highConfidence);
  
  // Use medium and high confidence
  const mediumAndUp = filterByConfidence(result.parsedFields, 'medium');
  console.log('Medium+ confidence fields:', mediumAndUp);
}

// Example 3: Manual field matching
function exampleManualMatching() {
  // Test different label formats
  const testLabels = [
    'Age',
    'patient age',
    'Age in Years',
    'Blood Pressure',
    'BP',
    'Systolic BP',
    'Total Cholesterol',
    'HDL-C',
    'Diabetes Mellitus'
  ];
  
  testLabels.forEach(label => {
    const mapping = findMatchingField(label);
    if (mapping) {
      console.log(`"${label}" → ${mapping.fieldName}`);
    } else {
      console.log(`"${label}" → NOT MAPPED`);
    }
  });
}

// Example 4: Value validation
function exampleValueValidation() {
  const testCases = [
    { field: 'age', value: 45 },
    { field: 'age', value: 150 }, // Invalid: too high
    { field: 'diabetes', value: 'yes' },
    { field: 'diabetes', value: 'positive' },
    { field: 'cholesterol', value: 220 },
    { field: 'cholesterol', value: '220 mg/dL' } // Will extract number
  ];
  
  testCases.forEach(test => {
    const mapping = findMatchingField(test.field);
    if (mapping) {
      const validation = validateValue(test.value, mapping);
      console.log(`${test.field}=${test.value}: ${validation.valid ? '✓' : '✗'} ${validation.error || ''}`);
    }
  });
}

// Example 5: Complete workflow
async function exampleCompleteWorkflow(pdfFile: File) {
  console.log('Starting PDF parsing workflow...');
  
  // Step 1: Parse PDF
  const result = await parsePDFForFormData(pdfFile);
  
  if (!result.success) {
    console.error('Parsing failed:', result.error);
    return;
  }
  
  console.log(`✓ Extracted ${result.parsedFields.length} fields using ${result.extractionMethod}`);
  
  // Step 2: Filter by confidence
  const highConfidence = filterByConfidence(result.parsedFields, 'high');
  const mediumConfidence = filterByConfidence(result.parsedFields, 'medium').filter(
    f => !highConfidence.some(hc => hc.fieldName === f.fieldName)
  );
  
  console.log(`  - ${highConfidence.length} high confidence`);
  console.log(`  - ${mediumConfidence.length} medium confidence`);
  console.log(`  - ${result.parsedFields.length - highConfidence.length - mediumConfidence.length} low confidence`);
  
  // Step 3: Convert to form data (use high confidence only)
  const formData = convertToFormData(highConfidence);
  console.log('Form data:', formData);
  
  // Step 4: Review unmapped data
  if (result.unmappedData.length > 0) {
    console.log(`⚠ ${result.unmappedData.length} unmapped items found:`);
    result.unmappedData.slice(0, 3).forEach(item => {
      console.log(`  - ${item}`);
    });
  }
  
  return {
    formData,
    needsReview: mediumConfidence.length > 0,
    unmapped: result.unmappedData
  };
}

// Example 6: Simulate user confirmation flow
async function exampleUserConfirmationFlow(pdfFile: File) {
  // Parse PDF
  const result = await parsePDFForFormData(pdfFile);
  
  if (!result.success) {
    console.error('Parse failed');
    return;
  }
  
  // Simulate user selecting fields
  const userSelectedFields = result.parsedFields.filter(
    field => field.confidence === 'high' || field.confidence === 'medium'
  );
  
  console.log(`User selected ${userSelectedFields.length} of ${result.parsedFields.length} fields`);
  
  // Convert selected fields to form data
  const formData = convertToFormData(userSelectedFields);
  
  // Merge with existing form data
  const existingFormData = { age: 0, gender: 'male' };
  const mergedData = { ...existingFormData, ...formData };
  
  console.log('Merged form data:', mergedData);
  
  return mergedData;
}

// Test data samples
const SAMPLE_PDF_TEXT = `
CARDIAC RISK ASSESSMENT REPORT
==============================

Patient Information:
Age: 45
Gender: Male
Height: 175 cm
Weight: 80 kg

Vital Signs:
Blood Pressure: 130/85 mmHg
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
Family History of Heart Disease: Yes
Hypertension: No

Exercise Capacity: Moderate
Sleep Hours: 6 hours
`;

// Parse sample text (simulated)
function parseSimulatedText() {
  const lines = SAMPLE_PDF_TEXT.split('\n').filter(l => l.trim());
  
  const patterns = [
    /Age:\s*(\d+)/,
    /Blood Pressure:\s*(\d+)/,
    /Total Cholesterol:\s*(\d+)/,
    /HDL Cholesterol:\s*(\d+)/,
    /Smoking:\s*(Yes|No)/i,
    /Diabetes:\s*(Yes|No)/i
  ];
  
  const text = lines.join(' ');
  
  patterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match) {
      console.log(`Matched: ${match[0]} → Value: ${match[1]}`);
    }
  });
}

// Export examples for testing
export {
  exampleBasicParsing,
  exampleFilterByConfidence,
  exampleManualMatching,
  exampleValueValidation,
  exampleCompleteWorkflow,
  exampleUserConfirmationFlow,
  parseSimulatedText
};
