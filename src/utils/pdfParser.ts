/**
 * PDF Parser with strict non-hallucination rules
 * Returns unknown_field: true for unmapped labels
 */

import fieldMappings from '@/constants/fieldMap.json';

export interface ParsedField {
  fieldName: string;
  value: any;
  label: string;
  confidence: 'high' | 'medium' | 'low';
  rawText: string;
  lineNumber?: number;
  unknown_field?: boolean;
}

export interface ParseResult {
  success: boolean;
  parsedFields: ParsedField[];
  unknownFields: Array<{
    label: string;
    value: string;
    rawText: string;
    unknown_field: true;
  }>;
  fullText: string;
  error?: string;
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Find matching field from fieldMap.json
 * Returns null if no match found (strict non-hallucination rule)
 * STRICT: Only exact matches allowed - no fuzzy matching or contains logic
 */
function findMatchingField(label: string): typeof fieldMappings[keyof typeof fieldMappings] | null {
  const normalizedLabel = normalizeText(label);
  
  for (const [key, mapping] of Object.entries(fieldMappings)) {
    for (const mappingLabel of mapping.labels) {
      const normalizedMappingLabel = normalizeText(mappingLabel);
      
      // STRICT: Only exact match
      if (normalizedLabel === normalizedMappingLabel) {
        return mapping;
      }
    }
  }
  
  return null; // STRICT: No match = no hallucination
}

/**
 * Validate value against field constraints
 */
function validateValue(
  value: string | number | boolean,
  mapping: typeof fieldMappings[keyof typeof fieldMappings]
): { valid: boolean; normalizedValue?: any; error?: string } {
  if (mapping.type === 'number') {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    
    if (isNaN(numValue)) {
      return { valid: false, error: 'Invalid number' };
    }
    
    // Check validation if it exists
    if ('validation' in mapping && mapping.validation) {
      if (mapping.validation.min !== undefined && numValue < mapping.validation.min) {
        return { valid: false, error: `Value below minimum ${mapping.validation.min}` };
      }
      
      if (mapping.validation.max !== undefined && numValue > mapping.validation.max) {
        return { valid: false, error: `Value above maximum ${mapping.validation.max}` };
      }
    }
    
    return { valid: true, normalizedValue: numValue };
  }
  
  if (mapping.type === 'boolean') {
    const strValue = String(value).toLowerCase().trim();
    const truthyValues = ['yes', 'true', '1', 'positive', 'present'];
    const falsyValues = ['no', 'false', '0', 'negative', 'absent'];
    
    if (truthyValues.includes(strValue)) {
      return { valid: true, normalizedValue: true };
    }
    
    if (falsyValues.includes(strValue)) {
      return { valid: true, normalizedValue: false };
    }
    
    return { valid: false, error: 'Invalid boolean value' };
  }
  
  return { valid: true, normalizedValue: value };
}

/**
 * Main parser function
 * STRICT NON-HALLUCINATION: Unknown labels return unknown_field: true
 */
export function parse(text: string): ParseResult {
  const parsedFields: ParsedField[] = [];
  const unknownFields: ParseResult['unknownFields'] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  const processedFields = new Set<string>();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Try different parsing strategies
    const result = 
      tryExactLabelValuePair(line, i) ||
      tryColonSeparatedPair(line, i) ||
      tryKeyValuePattern(line, i);
    
    if (result) {
      if (result.unknown_field) {
        // Unknown field - don't add to parsedFields
        unknownFields.push(result as any);
      } else if (!processedFields.has(result.fieldName)) {
        parsedFields.push(result);
        processedFields.add(result.fieldName);
      }
    }
  }
  
  return {
    success: true,
    parsedFields,
    unknownFields,
    fullText: text
  };
}

/**
 * Strategy 1: Exact Label-Value pairs
 */
function tryExactLabelValuePair(line: string, lineNumber: number): ParsedField | null {
  const patterns = [
    /^(.+?):\s*(.+)$/,           // Label: Value
    /^(.+?)\s*=\s*(.+)$/,        // Label = Value
    /^(.+?)\s+(\d+\.?\d*)$/,     // Label Number
    /^(.+?)\s+(yes|no|true|false|positive|negative|present|absent)/i,
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      const [, labelPart, valuePart] = match;
      const mapping = findMatchingField(labelPart);
      
      if (!mapping) {
        // STRICT NON-HALLUCINATION: Return unknown field
        return {
          fieldName: 'unknown',
          value: valuePart,
          label: labelPart,
          confidence: 'low',
          rawText: line,
          lineNumber,
          unknown_field: true
        };
      }
      
      const validation = validateValue(valuePart, mapping);
      
      if (!validation.valid) {
        continue; // Invalid value, try next pattern
      }
      
      return {
        fieldName: mapping.fieldName,
        value: validation.normalizedValue,
        label: labelPart.trim(),
        confidence: 'high',
        rawText: line,
        lineNumber
      };
    }
  }
  
  return null;
}

/**
 * Strategy 2: Colon-separated pairs
 */
function tryColonSeparatedPair(line: string, lineNumber: number): ParsedField | null {
  if (!line.includes(':')) return null;
  
  const [labelPart, ...valueParts] = line.split(':');
  const valuePart = valueParts.join(':').trim();
  
  if (!valuePart) return null;
  
  const mapping = findMatchingField(labelPart);
  
  if (!mapping) {
    // STRICT NON-HALLUCINATION: Return unknown field
    return {
      fieldName: 'unknown',
      value: valuePart,
      label: labelPart,
      confidence: 'low',
      rawText: line,
      lineNumber,
      unknown_field: true
    };
  }
  
  const validation = validateValue(valuePart, mapping);
  
  if (!validation.valid) {
    return null;
  }
  
  return {
    fieldName: mapping.fieldName,
    value: validation.normalizedValue,
    label: labelPart.trim(),
    confidence: 'high',
    rawText: line,
    lineNumber
  };
}

/**
 * Strategy 3: Key-value patterns with regex
 */
function tryKeyValuePattern(line: string, lineNumber: number): ParsedField | null {
  const medicalPatterns = [
    { pattern: /\b(age|patient age)\b[:\s]+(\d+)/i, field: 'age' },
    { pattern: /\b(sleep hours|hours of sleep)\b[:\s]+(\d+)/i, field: 'sleep_hours' },
    { pattern: /\b(hdl|hdl cholesterol)\b[:\s]+(\d+)/i, field: 'hdlCholesterol' },
    { pattern: /\b(chest pain type|chest pain)\b[:\s]+(\w+)/i, field: 'chestPainType' },
    { pattern: /\b(blood pressure|bp|systolic bp)\b[:\s]+(\d+)/i, field: 'restingBP' },
    { pattern: /\b(cholesterol|total cholesterol)\b[:\s]+(\d+)/i, field: 'cholesterol' },
    { pattern: /\b(heart rate|hr|pulse)\b[:\s]+(\d+)/i, field: 'maxHR' },
  ];
  
  for (const { pattern, field } of medicalPatterns) {
    const match = line.match(pattern);
    if (match) {
      const [, labelPart, valuePart] = match;
      const mapping = findMatchingField(field);
      
      if (!mapping) {
        return {
          fieldName: 'unknown',
          value: valuePart,
          label: labelPart,
          confidence: 'low',
          rawText: line,
          lineNumber,
          unknown_field: true
        };
      }
      
      const validation = validateValue(valuePart, mapping);
      
      if (!validation.valid) {
        continue;
      }
      
      return {
        fieldName: mapping.fieldName,
        value: validation.normalizedValue,
        label: labelPart,
        confidence: 'high',
        rawText: line,
        lineNumber
      };
    }
  }
  
  return null;
}

/**
 * Convert parsed fields to form data object (excluding unknown fields)
 */
export function convertToFormData(fields: ParsedField[]): Record<string, any> {
  const formData: Record<string, any> = {};
  
  for (const field of fields) {
    if (!field.unknown_field) {
      formData[field.fieldName] = field.value;
    }
  }
  
  return formData;
}
