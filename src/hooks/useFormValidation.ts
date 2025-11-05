/**
 * Form Validation Hook
 * 
 * React hook for managing form validation with real-time feedback.
 * Integrates with Zod schemas and provides user-friendly error messages.
 * 
 * Created: November 4, 2025
 */

import { useState, useCallback, useMemo } from 'react';
import type { ZodSchema } from 'zod';
import {
  validatePatientData,
  validateRiskAssessmentRequest,
  validatePDFReportData,
  getUserFriendlyValidationErrors,
  validateMetricsConsistency,
} from '../lib/validation';
import type { PatientData } from '../lib/mockData';

/**
 * Form validation state
 */
export interface FormValidationState {
  errors: Record<string, string>;
  warnings: string[];
  isValid: boolean;
  touched: Record<string, boolean>;
  isDirty: boolean;
}

/**
 * Form validation actions
 */
export interface FormValidationActions {
  validateField: (fieldName: string, value: any) => boolean;
  validateForm: (formData: any) => boolean;
  setFieldTouched: (fieldName: string) => void;
  clearErrors: () => void;
  setErrors: (errors: Record<string, string>) => void;
  getFieldError: (fieldName: string) => string | undefined;
  hasError: (fieldName: string) => boolean;
}

/**
 * Use form validation hook
 */
export function useFormValidation(initialErrors: Record<string, string> = {}) {
  const [state, setState] = useState<FormValidationState>({
    errors: initialErrors,
    warnings: [],
    isValid: Object.keys(initialErrors).length === 0,
    touched: {},
    isDirty: false,
  });

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (fieldName: string, value: any): boolean => {
      // Basic validation based on field name and type
      const errors: Record<string, string> = { ...state.errors };

      // Remove existing error for this field
      delete errors[fieldName];

      // Perform field-specific validation
      let isFieldValid = true;

      // Age validation
      if (fieldName === 'age') {
        if (!Number.isInteger(value) || value < 18 || value > 120) {
          errors[fieldName] = 'Age must be between 18 and 120';
          isFieldValid = false;
        }
      }

      // Email validation
      if (fieldName.includes('email')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errors[fieldName] = 'Invalid email address';
          isFieldValid = false;
        }
      }

      // Phone validation
      if (fieldName.includes('phone')) {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        if (value && !phoneRegex.test(value)) {
          errors[fieldName] = 'Invalid phone number';
          isFieldValid = false;
        }
      }

      // BP validation
      if (fieldName === 'restingBP') {
        if (!Number.isFinite(value) || value < 60 || value > 250) {
          errors[fieldName] = 'Blood pressure must be between 60 and 250 mmHg';
          isFieldValid = false;
        }
      }

      // Cholesterol validation
      if (fieldName === 'cholesterol') {
        if (!Number.isFinite(value) || value < 0 || value > 500) {
          errors[fieldName] = 'Cholesterol must be between 0 and 500 mg/dL';
          isFieldValid = false;
        }
      }

      // Heart rate validation
      if (fieldName === 'maxHR' || fieldName === 'heartRate') {
        if (!Number.isInteger(value) || value < 20 || value > 250) {
          errors[fieldName] = 'Heart rate must be between 20 and 250 bpm';
          isFieldValid = false;
        }
      }

      // Stress level validation
      if (fieldName === 'stressLevel' || fieldName === 'sleepQuality') {
        if (!Number.isInteger(value) || value < 1 || value > 10) {
          errors[fieldName] = 'Value must be between 1 and 10';
          isFieldValid = false;
        }
      }

      // Sleep hours validation
      if (fieldName === 'sleepHours') {
        if (!Number.isFinite(value) || value < 0 || value > 24) {
          errors[fieldName] = 'Sleep hours must be between 0 and 24';
          isFieldValid = false;
        }
      }

      setState(prev => ({
        ...prev,
        errors,
        isValid: Object.keys(errors).length === 0,
        isDirty: true,
      }));

      return isFieldValid;
    },
    [state.errors]
  );

  /**
   * Validate entire form
   */
  const validateForm = useCallback(
    (formData: any): boolean => {
      // Use appropriate validator based on form type
      let result = validatePatientData(formData);

      if (!result.success && result.errors) {
        setState(prev => ({
          ...prev,
          errors: result.errors!,
          isValid: false,
          isDirty: true,
        }));
        return false;
      }

      // Check for cross-field warnings
      const consistencyCheck = validateMetricsConsistency(formData);
      setState(prev => ({
        ...prev,
        errors: {},
        warnings: consistencyCheck.warnings,
        isValid: true,
        isDirty: true,
      }));

      return true;
    },
    []
  );

  /**
   * Mark field as touched
   */
  const setFieldTouched = useCallback((fieldName: string) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [fieldName]: true },
    }));
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
      warnings: [],
      isValid: true,
      isDirty: false,
    }));
  }, []);

  /**
   * Set errors
   */
  const setErrors = useCallback((errors: Record<string, string>) => {
    setState(prev => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).length === 0,
    }));
  }, []);

  /**
   * Get error for specific field
   */
  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      return state.errors[fieldName];
    },
    [state.errors]
  );

  /**
   * Check if field has error
   */
  const hasError = useCallback(
    (fieldName: string): boolean => {
      return !!(state.errors[fieldName] && state.touched[fieldName]);
    },
    [state.errors, state.touched]
  );

  return {
    state,
    actions: {
      validateField,
      validateForm,
      setFieldTouched,
      clearErrors,
      setErrors,
      getFieldError,
      hasError,
    },
  };
}

/**
 * Use patient data validation hook
 */
export function usePatientDataValidation(initialData?: Partial<PatientData>) {
  const { state, actions } = useFormValidation();

  const validatePatientDataForm = useCallback(
    (data: Partial<PatientData>): boolean => {
      const result = validatePatientData(data);

      if (!result.success && result.errors) {
        actions.setErrors(result.errors);
        return false;
      }

      // Cross-field validation
      const consistency = validateMetricsConsistency(data);
      if (!consistency.valid) {
        console.warn('Consistency warnings:', consistency.warnings);
      }

      actions.clearErrors();
      return true;
    },
    [actions]
  );

  return {
    ...state,
    ...actions,
    validatePatientDataForm,
  };
}

/**
 * Custom error message formatter
 */
export function formatValidationError(error: string, fieldName?: string): string {
  // Improve error message readability
  let message = error;

  // Handle specific patterns
  if (message.includes('must be')) {
    return message.charAt(0).toUpperCase() + message.slice(1);
  }

  if (message.includes('Expected')) {
    // Convert Zod enum errors
    const expected = message.match(/Expected (.*?),/);
    if (expected) {
      const values = expected[1].split(' | ').join(', ');
      message = `Must be one of: ${values}`;
    }
  }

  if (fieldName) {
    const field = fieldName
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .trim();
    return `${field}: ${message}`;
  }

  return message;
}

/**
 * Field validation state helper
 */
export function useFieldValidation(fieldName: string, validator?: (value: any) => boolean) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validate = useCallback(
    (value: any) => {
      if (!touched) return true;

      if (validator) {
        const isValid = validator(value);
        setError(isValid ? null : `Invalid ${fieldName}`);
        return isValid;
      }

      return true;
    },
    [fieldName, touched, validator]
  );

  return {
    error: touched ? error : null,
    touched,
    setTouched,
    validate,
  };
}

/**
 * Real-time validation for input fields
 */
export function useRealTimeValidation(
  fieldName: string,
  value: any,
  validator: (val: any) => { valid: boolean; error?: string }
) {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(() => {
    setIsValidating(true);
    const result = validator(value);
    setError(result.valid ? null : result.error || 'Invalid value');
    setIsValidating(false);
  }, [value, validator]);

  // Debounced validation
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedValidate = useCallback(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    
    const timer = setTimeout(() => {
      validate();
    }, 300);
    
    setDebounceTimer(timer);
  }, [validate, debounceTimer]);

  return { error, isValidating, validate: debouncedValidate };
}

export default {
  useFormValidation,
  usePatientDataValidation,
  formatValidationError,
  useFieldValidation,
  useRealTimeValidation,
};
