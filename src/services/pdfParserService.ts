/**
 * PDF Parser Service
 * Parses extracted PDF text and maps fields to form inputs
 * Uses strict pdfParser with non-hallucination rules
 */

import { extractTextFromPDF, PDFExtractionResult } from './pdfExtractionService';
import { parse as strictParse, convertToFormData as strictConvertToFormData, type ParsedField as StrictParsedField } from '@/utils/pdfParser';
import { 
  findMatchingField, 
  validateValue, 
  FieldMapping,
  normalizeText 
} from '@/lib/pdfFieldMapping';

export interface ParsedField {
  fieldName: string;
  value: any;
  label: string;
  confidence: 'high' | 'medium' | 'low';
  rawText: string;
  lineNumber?: number;
  unknown_field?: boolean;
}

export interface PDFParseResult {
  success: boolean;
  parsedFields: ParsedField[];
  unmappedData: string[];
  unknownFields: Array<{
    label: string;
    value: string;
    rawText: string;
    unknown_field: true;
  }>;
  extractionMethod: 'text-extraction' | 'ocr';
  fullText: string;
  error?: string;
}

/**
 * Main PDF parsing function
 */
export async function parsePDFForFormData(file: File): Promise<PDFParseResult> {
  try {
    // Step 1: Extract text from PDF
    const extractionResult = await extractTextFromPDF(file);
    
    if (!extractionResult.success) {
      return {
        success: false,
        parsedFields: [],
        unknownFields: [],
        unmappedData: [],
        extractionMethod: extractionResult.method,
        fullText: '',
        error: extractionResult.error || 'Failed to extract text from PDF'
      };
    }
    
    // Step 2: Parse the extracted text using STRICT parser
    const strictParseResult = strictParse(extractionResult.fullText);
    
    // Step 3: Identify unmapped data (for user awareness)
    const unmappedData = identifyUnmappedData(extractionResult.fullText, strictParseResult.parsedFields);
    
    return {
      success: true,
      parsedFields: strictParseResult.parsedFields,
      unknownFields: strictParseResult.unknownFields,
      unmappedData,
      extractionMethod: extractionResult.method,
      fullText: extractionResult.fullText
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      success: false,
      parsedFields: [],
      unknownFields: [],
      unmappedData: [],
      extractionMethod: 'text-extraction',
      fullText: '',
      error: error instanceof Error ? error.message : 'Unknown error during parsing'
    };
  }
}

/**
 * Parse text to extract field values
 */
function parseTextForFields(text: string): ParsedField[] {
  const parsedFields: ParsedField[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  const processedFields = new Set<string>();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Try different parsing strategies
    const fieldResult = 
      tryExactLabelValuePair(line, i) ||
      tryColonSeparatedPair(line, i) ||
      tryKeyValuePattern(line, i) ||
      tryMultiLinePair(line, lines[i + 1], i);
    
    if (fieldResult && !processedFields.has(fieldResult.fieldName)) {
      parsedFields.push(fieldResult);
      processedFields.add(fieldResult.fieldName);
    }
  }
  
  return parsedFields;
}

/**
 * Strategy 1: Try to match "Label: Value" or "Label Value" patterns
 */
function tryExactLabelValuePair(line: string, lineNumber: number): ParsedField | null {
  // Match patterns like "Age: 45" or "Age 45" or "Age = 45"
  const patterns = [
    /^(.+?):\s*(.+)$/,           // Label: Value
    /^(.+?)\s*=\s*(.+)$/,        // Label = Value
    /^(.+?)\s+(\d+\.?\d*)$/,     // Label Number
    /^(.+?)\s+(yes|no|true|false|positive|negative|present|absent)/i, // Label Boolean
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const [, labelPart, valuePart] = match;
      const mapping = findMatchingField(labelPart);
      
      if (mapping) {
        return createParsedField(mapping, valuePart, labelPart, line, lineNumber, 'high');
      }
    }
  }
  
  return null;
}

/**
 * Strategy 2: Try colon-separated pairs
 */
function tryColonSeparatedPair(line: string, lineNumber: number): ParsedField | null {
  if (!line.includes(':')) return null;
  
  const [labelPart, ...valueParts] = line.split(':');
  const valuePart = valueParts.join(':').trim();
  
  if (!valuePart) return null;
  
  const mapping = findMatchingField(labelPart);
  
  if (mapping) {
    return createParsedField(mapping, valuePart, labelPart, line, lineNumber, 'high');
  }
  
  return null;
}

/**
 * Strategy 3: Try key-value patterns with regex
 */
function tryKeyValuePattern(line: string, lineNumber: number): ParsedField | null {
  // Comprehensive pattern matching for medical reports with flexible formatting
  const medicalPatterns = [
    // Age patterns
    { pattern: /\b(age|patient age|yrs?|years? old)\b[:\s=-]+(\d+)/i, field: 'age' },
    
    // Blood pressure patterns
    { pattern: /\b(blood pressure|bp|systolic bp|systolic|resting bp)\b[:\s=-]+(\d+)/i, field: 'restingBP' },
    { pattern: /\b(systolic|sys)\b[:\s=-]+(\d+)[\s\/]*(diastolic|dia)?[:\s]*(\d+)?/i, field: 'restingBP' },
    { pattern: /(\d{2,3})\/(\d{2,3})\s*(mmhg|mm hg)?/i, field: 'restingBP' }, // 120/80 format
    
    // Cholesterol patterns
    { pattern: /\b(cholesterol|total cholesterol|chol|tc)\b[:\s=-]+(\d+)/i, field: 'cholesterol' },
    { pattern: /\b(hdl|hdl cholesterol|hdl-c)\b[:\s=-]+(\d+)/i, field: 'hdlCholesterol' },
    { pattern: /\b(ldl|ldl cholesterol|ldl-c)\b[:\s=-]+(\d+)/i, field: 'ldlCholesterol' },
    { pattern: /\b(triglycerides?|tg|trig)\b[:\s=-]+(\d+)/i, field: 'triglycerides' },
    
    // Heart rate patterns
    { pattern: /\b(heart rate|hr|pulse|max hr|maximum heart rate)\b[:\s=-]+(\d+)/i, field: 'maxHR' },
    { pattern: /\b(resting heart rate|resting hr)\b[:\s=-]+(\d+)/i, field: 'restingHR' },
    
    // Physical measurements
    { pattern: /\b(height|ht)\b[:\s=-]+(\d+\.?\d*)\s*(cm|centimeters?)?/i, field: 'height' },
    { pattern: /\b(weight|wt|body weight)\b[:\s=-]+(\d+\.?\d*)\s*(kg|kilograms?|lbs?)?/i, field: 'weight' },
    { pattern: /\b(waist circumference|waist|wc)\b[:\s=-]+(\d+\.?\d*)/i, field: 'waistCircumference' },
    { pattern: /\b(bmi|body mass index)\b[:\s=-]+(\d+\.?\d*)/i, field: 'bmi' },
    
    // Blood sugar/glucose
    { pattern: /\b(fasting blood sugar|fbs|blood glucose|glucose|blood sugar)\b[:\s=-]+(\d+)/i, field: 'fastingBS' },
    { pattern: /\b(hba1c|a1c|glycated hemoglobin)\b[:\s=-]+(\d+\.?\d*)/i, field: 'hba1c' },
    
    // ECG patterns
    { pattern: /\b(ecg|ekg|electrocardiogram)\b[:\s=-]+(normal|abnormal|st elevation|st depression)/i, field: 'restingECG' },
    { pattern: /\b(st segment)\b[:\s=-]+(normal|elevated|depressed)/i, field: 'restingECG' },
    
    // Boolean conditions
    { pattern: /\b(diabetes|diabetic|dm)\b[:\s=-]+(yes|no|positive|negative|present|absent|true|false)/i, field: 'diabetes' },
    { pattern: /\b(smoking|smoker|tobacco use)\b[:\s=-]+(yes|no|positive|negative|present|absent|true|false|current|former|never)/i, field: 'smoking' },
    { pattern: /\b(exercise|exertional) (angina|chest pain)\b[:\s=-]+(yes|no|positive|negative|present|absent)/i, field: 'exerciseAngina' },
    { pattern: /\b(previous|prior|history of) (heart attack|mi|myocardial infarction)\b[:\s=-]+(yes|no|positive|negative|present|absent)/i, field: 'previousHeartAttack' },
    { pattern: /\b(family history|fh).*?(heart disease|cardiac|cvd)\b[:\s=-]+(yes|no|positive|negative|present|absent)/i, field: 'familyHistory' },
    { pattern: /\b(hypertension|high blood pressure|htn)\b[:\s=-]+(yes|no|positive|negative|present|absent)/i, field: 'hypertension' },
    
    // Chest pain type
    { pattern: /\b(chest pain type|cp type|angina type)\b[:\s=-]+(typical|atypical|non-anginal|asymptomatic)/i, field: 'chestPainType' },
    
    // Sleep and lifestyle
    { pattern: /\b(sleep hours?|hours? of sleep)\b[:\s=-]+(\d+)/i, field: 'sleepHours' },
    { pattern: /\b(exercise|physical activity)\b[:\s=-]+(\d+)\s*(hours?|hrs?|minutes?|mins?)/i, field: 'exerciseHours' },
    { pattern: /\b(stress level)\b[:\s=-]+(\d+)/i, field: 'stressLevel' },
  ];
  
  for (const { pattern, field } of medicalPatterns) {
    const match = line.match(pattern);
    if (match) {
      const labelPart = match[1];
      let valuePart = match[2];
      
      // Special handling for blood pressure (systolic/diastolic format)
      if (field === 'restingBP' && match[0].includes('/')) {
        valuePart = match[1]; // Take systolic value
      }
      
      // Try to find mapping using the field hint
      const mapping = findMatchingField(field) || findMatchingField(labelPart);
      
      if (mapping) {
        return createParsedField(mapping, valuePart, labelPart, line, lineNumber, 'high');
      }
    }
  }
  
  return null;
}

/**
 * Strategy 4: Try multi-line pairs (label on one line, value on next)
 */
function tryMultiLinePair(line: string, nextLine: string | undefined, lineNumber: number): ParsedField | null {
  if (!nextLine) return null;
  
  // Check if current line is a label and next line is a value
  const mapping = findMatchingField(line);
  
  if (mapping) {
    // Check if next line looks like a value
    const trimmedNextLine = nextLine.trim();
    const looksLikeValue = 
      /^\d+\.?\d*$/.test(trimmedNextLine) || // Number
      /^(yes|no|true|false|positive|negative)/i.test(trimmedNextLine); // Boolean
    
    if (looksLikeValue) {
      return createParsedField(mapping, trimmedNextLine, line, `${line}\n${nextLine}`, lineNumber, 'medium');
    }
  }
  
  return null;
}

/**
 * Create a ParsedField object with validation
 */
function createParsedField(
  mapping: FieldMapping,
  value: string,
  label: string,
  rawText: string,
  lineNumber: number,
  baseConfidence: 'high' | 'medium' | 'low'
): ParsedField | null {
  const validation = validateValue(value, mapping);
  
  if (!validation.valid) {
    console.warn(`Invalid value for ${mapping.fieldName}: ${value}. Error: ${validation.error}`);
    return null;
  }
  
  // Adjust confidence based on validation and value clarity
  let confidence = baseConfidence;
  
  // Lower confidence for OCR or fuzzy matches
  if (baseConfidence === 'medium' && validation.normalizedValue === undefined) {
    confidence = 'low';
  }
  
  return {
    fieldName: mapping.fieldName,
    value: validation.normalizedValue,
    label: label.trim(),
    confidence,
    rawText,
    lineNumber
  };
}

/**
 * Identify unmapped data for user awareness
 */
function identifyUnmappedData(fullText: string, parsedFields: ParsedField[]): string[] {
  const unmapped: string[] = [];
  const lines = fullText.split('\n').filter(line => line.trim().length > 0);
  
  const parsedLineNumbers = new Set(
    parsedFields.map(f => f.lineNumber).filter(n => n !== undefined)
  );
  
  for (let i = 0; i < lines.length; i++) {
    if (!parsedLineNumbers.has(i)) {
      const line = lines[i].trim();
      // Only include lines that look like they might contain data
      if (line.length > 5 && !/^[^a-zA-Z]*$/.test(line)) {
        unmapped.push(line);
      }
    }
  }
  
  return unmapped.slice(0, 10); // Limit to first 10 unmapped lines
}

/**
 * Filter parsed fields by confidence level
 */
export function filterByConfidence(
  fields: ParsedField[],
  minConfidence: 'high' | 'medium' | 'low' = 'medium'
): ParsedField[] {
  const confidenceLevels = { high: 3, medium: 2, low: 1 };
  const minLevel = confidenceLevels[minConfidence];
  
  return fields.filter(field => 
    confidenceLevels[field.confidence] >= minLevel
  );
}

/**
 * Convert parsed fields to form data object (excluding unknown fields)
 */
export function convertToFormData(fields: ParsedField[]): Record<string, any> {
  return strictConvertToFormData(fields);
}
