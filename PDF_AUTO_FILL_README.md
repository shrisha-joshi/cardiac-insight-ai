# PDF Auto-Fill Feature

## Overview

This feature allows users to upload PDF medical reports and automatically extract patient data to populate the prediction form. The system uses a deterministic mapping approach to ensure accuracy and provides user confirmation before applying the data.

## Components

### 1. Field Mapping Configuration (`src/lib/pdfFieldMapping.ts`)

Defines a comprehensive mapping table that translates common PDF field labels to form input names:

```typescript
{
  "Age": "age",
  "Patient Age": "age",
  "Sleep Hours": "sleep_hours",
  "HDL Cholesterol": "hdl",
  ...
}
```

**Features:**
- Maps multiple synonyms to each field
- Includes validation rules (min/max values, data types)
- Supports number, boolean, select, and text field types
- Case-insensitive matching with normalization

### 2. PDF Extraction Service (`src/services/pdfExtractionService.ts`)

Handles text extraction from PDF files with two methods:

**Primary Method: PDF.js (pdfjs-dist)**
- Direct text extraction from text-based PDFs
- Fast and accurate for PDFs with embedded text
- Used as the primary extraction method

**Fallback Method: Tesseract.js (OCR)**
- Optical Character Recognition for scanned PDFs
- Automatically triggered if minimal text is detected
- Provides confidence scores for extracted text

**Functions:**
- `extractTextFromPDF(file)` - Main extraction function
- `estimatePDFType(file)` - Determines if PDF is text-based or scanned
- `isValidPDF(file)` - Validates file type

### 3. PDF Parser Service (`src/services/pdfParserService.ts`)

Parses extracted text and maps it to form fields using multiple strategies:

**Parsing Strategies:**

1. **Exact Label-Value Pairs**: `Age: 45`, `Age = 45`
2. **Colon-Separated Pairs**: `Blood Pressure: 120`
3. **Regex Pattern Matching**: Medical terminology patterns
4. **Multi-Line Parsing**: Label on one line, value on next

**Features:**
- Strict label matching (exact tokens)
- Confidence scoring (high/medium/low)
- Value validation against field constraints
- Unmapped data tracking

**Functions:**
- `parsePDFForFormData(file)` - Main parsing function
- `filterByConfidence(fields, minConfidence)` - Filter by confidence level
- `convertToFormData(fields)` - Convert to form state format

### 4. Confirmation Modal (`src/components/PDFParseConfirmationModal.tsx`)

User interface for reviewing and confirming parsed data:

**Features:**
- Display all parsed fields with confidence indicators
- Checkbox selection for individual fields
- Show extraction method (text-extraction or OCR)
- Display unmapped/unrecognized data
- Accept/Reject buttons

**Confidence Indicators:**
- 🟢 High: Green badge - Exact match with high confidence
- 🟡 Medium: Yellow badge - Fuzzy match or moderate confidence
- 🔵 Low: Blue badge - Uncertain match

### 5. Enhanced Patient Form (`src/components/PatientForm.tsx`)

Integrated PDF upload functionality:

**New Features:**
- PDF upload button with progress indicator
- Automatic PDF detection and processing
- Toast notifications for status updates
- Confirmation modal integration
- Form state merging

**User Flow:**
1. User uploads PDF file
2. System extracts and parses text
3. Confirmation modal shows parsed fields
4. User reviews and selects fields to apply
5. Data is merged into form on acceptance

## Field Mappings

### Supported Fields

| Field Name | Synonyms | Type | Validation |
|------------|----------|------|------------|
| age | age, patient age, years old | number | 1-120 |
| gender | gender, sex, m/f | select | - |
| restingBP | blood pressure, bp, systolic bp | number | 60-250 |
| cholesterol | cholesterol, total cholesterol, chol | number | 100-500 |
| maxHR | heart rate, hr, pulse | number | 40-220 |
| diabetes | diabetes, diabetic, blood sugar | boolean | yes/no |
| smoking | smoking, smoker, tobacco use | boolean | yes/no |
| hdlCholesterol | hdl, hdl cholesterol, good cholesterol | number | 0-200 |
| ldlCholesterol | ldl, ldl cholesterol, bad cholesterol | number | 0-300 |
| triglycerides | triglycerides, tg | number | 0-1000 |
| height | height, height cm, ht | number | 100-250 |
| weight | weight, weight kg, wt | number | 30-300 |
| sleep_hours | sleep hours, hours of sleep | number | 0-24 |

*See `pdfFieldMapping.ts` for complete list*

## Usage Example

### For Users

1. Click "Choose Files" button in the Medical Documents section
2. Select a PDF medical report
3. Wait for processing (progress shown)
4. Review parsed fields in confirmation modal
5. Select/deselect fields as needed
6. Click "Accept Selected Fields" to apply data
7. Complete any remaining fields manually

### For Developers

```typescript
import { parsePDFForFormData } from '@/services/pdfParserService';

// Parse PDF file
const result = await parsePDFForFormData(pdfFile);

if (result.success) {
  console.log('Parsed fields:', result.parsedFields);
  console.log('Unmapped data:', result.unmappedData);
  console.log('Extraction method:', result.extractionMethod);
  
  // Convert to form data
  const formData = convertToFormData(result.parsedFields);
}
```

## Confidence Scoring

The system assigns confidence levels based on multiple factors:

- **High Confidence**: Exact label match + valid value + clear format
- **Medium Confidence**: Fuzzy label match + valid value
- **Low Confidence**: Pattern match + uncertain value format

Users can filter fields by minimum confidence level before applying.

## Error Handling

- Invalid PDF files trigger error toast
- No data found shows warning message
- OCR fallback automatic for scanned PDFs
- Validation errors prevent invalid data entry
- User can reject all data and enter manually

## Extensibility

### Adding New Fields

1. Add field mapping in `pdfFieldMapping.ts`:
```typescript
newField: {
  fieldName: 'newField',
  labels: ['new field', 'synonym1', 'synonym2'],
  type: 'number',
  validation: { min: 0, max: 100 }
}
```

2. Field will automatically be detected and parsed

### Custom Parsing Strategies

Add new strategy function in `pdfParserService.ts`:
```typescript
function tryCustomPattern(line: string, lineNumber: number): ParsedField | null {
  // Custom parsing logic
  return createParsedField(mapping, value, label, line, lineNumber, 'high');
}
```

## Dependencies

- **pdfjs-dist** (v5.4.394): PDF text extraction
- **tesseract.js**: OCR for scanned PDFs
- **React**: UI components
- **shadcn/ui**: Component library

## Performance Considerations

- Text extraction: < 1 second for most PDFs
- OCR processing: 2-5 seconds per page
- Large PDFs may take longer
- First page processed first for quick feedback

## Security

- Files processed client-side (no upload to server)
- No data persistence beyond session
- PDF content not stored or cached
- User confirmation required before data use

## Limitations

1. Only first PDF is processed if multiple uploaded
2. Scanned PDFs require OCR (slower)
3. Handwritten text not supported
4. Complex table layouts may not parse correctly
5. Multi-page PDFs processed sequentially

## Future Enhancements

- [ ] Support for multiple PDF processing
- [ ] Table data extraction
- [ ] Image-based biomarker recognition
- [ ] Machine learning for fuzzy matching
- [ ] Save field mappings for specific report types
- [ ] Batch processing for multiple patients

## Testing

To test the feature:

1. Create a sample PDF with medical data
2. Include various field formats (Label: Value, Label Value, etc.)
3. Test with both text and scanned PDFs
4. Verify field mapping accuracy
5. Test error cases (invalid values, missing data)

## Troubleshooting

**PDF not processing:**
- Verify file is valid PDF
- Check browser console for errors
- Try different PDF format

**No fields detected:**
- Check field labels match mapping table
- Try more standard label formats
- Review unmapped data in modal

**Wrong values extracted:**
- Review confidence indicators
- Manually correct in form
- Report issue for mapping improvement
