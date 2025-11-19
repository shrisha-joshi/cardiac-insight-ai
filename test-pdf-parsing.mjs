/**
 * PDF Parsing Test Script
 * Tests the enhanced PDF parser with real medical report PDFs
 */

import { parsePDFForFormData } from './src/services/pdfParserService';
import fs from 'fs';
import path from 'path';

async function testPDFParsing() {
  console.log('🧪 PDF Parsing Test Suite\n');
  console.log('=' .repeat(60));
  
  const testFiles = [
    {
      name: 'Severe Cardiac Report',
      path: 'c:/Users/venup/Downloads/Documents/mock_cardiac_report_severe.pdf',
      expectedFields: {
        age: 56,
        restingBP: 174,
        maxHR: 112,
        cholesterol: 261,
        hdlCholesterol: 32,
        ldlCholesterol: 181
      }
    },
    {
      name: 'General Cardiac Report',
      path: 'c:/Users/venup/Downloads/Documents/mock_cardiac_report_general.pdf',
      expectedFields: {
        age: 42,
        restingBP: 142,
        maxHR: 98,
        cholesterol: 232,
        hdlCholesterol: 38,
        ldlCholesterol: 162
      }
    }
  ];

  for (const testFile of testFiles) {
    console.log(`\n📄 Testing: ${testFile.name}`);
    console.log('-'.repeat(60));
    
    try {
      // Read file
      const fileBuffer = fs.readFileSync(testFile.path);
      const file = new File([fileBuffer], path.basename(testFile.path), {
        type: 'application/pdf'
      });

      // Parse PDF
      const result = await parsePDFForFormData(file);

      console.log(`✓ Extraction Method: ${result.extractionMethod}`);
      console.log(`✓ Success: ${result.success}`);
      console.log(`✓ Parsed Fields: ${result.parsedFields.length}`);
      console.log(`✓ Unknown Fields: ${result.unknownFields.length}`);
      
      if (result.parsedFields.length > 0) {
        console.log('\n📊 Recognized Fields:');
        result.parsedFields.forEach(field => {
          const match = testFile.expectedFields[field.fieldName];
          const status = match === field.value ? '✅' : '⚠️';
          console.log(`  ${status} ${field.fieldName}: ${field.value} (confidence: ${field.confidence})`);
          if (match !== undefined && match !== field.value) {
            console.log(`      Expected: ${match}, Got: ${field.value}`);
          }
        });
      }

      if (result.unknownFields.length > 0) {
        console.log('\n❓ Unknown Fields:');
        result.unknownFields.slice(0, 5).forEach(field => {
          console.log(`  - ${field.label}: ${field.value}`);
        });
        if (result.unknownFields.length > 5) {
          console.log(`  ... and ${result.unknownFields.length - 5} more`);
        }
      }

      // Validation
      const foundFields = result.parsedFields.map(f => f.fieldName);
      const expectedFields = Object.keys(testFile.expectedFields);
      const missingFields = expectedFields.filter(f => !foundFields.includes(f));
      
      if (missingFields.length > 0) {
        console.log('\n⚠️  Missing Expected Fields:');
        missingFields.forEach(field => {
          console.log(`  - ${field}: ${testFile.expectedFields[field]}`);
        });
      } else {
        console.log('\n✅ All expected fields found!');
      }

    } catch (error) {
      console.error(`❌ Error parsing ${testFile.name}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test Complete\n');
}

// Run test
testPDFParsing().catch(console.error);
