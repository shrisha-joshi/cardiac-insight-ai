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
  // More aggressive pattern matching for common medical report formats
  const medicalPatterns = [
    /\b(age|patient age)\b[:\s]+(\d+)/i,
    /\b(blood pressure|bp|systolic bp|systolic)\b[:\s]+(\d+)/i,
    /\b(cholesterol|total cholesterol|chol)\b[:\s]+(\d+)/i,
    /\b(heart rate|hr|pulse)\b[:\s]+(\d+)/i,
    /\b(hdl|hdl cholesterol)\b[:\s]+(\d+)/i,
    /\b(ldl|ldl cholesterol)\b[:\s]+(\d+)/i,
    /\b(triglycerides|tg)\b[:\s]+(\d+)/i,
    /\b(height)\b[:\s]+(\d+)/i,
    /\b(weight)\b[:\s]+(\d+)/i,
    /\b(waist circumference|waist)\b[:\s]+(\d+)/i,
    /\b(diabetes|diabetic)\b[:\s]+(yes|no|positive|negative)/i,
    /\b(smoking|smoker)\b[:\s]+(yes|no|true|false)/i,
  ];
  
  for (const pattern of medicalPatterns) {
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
