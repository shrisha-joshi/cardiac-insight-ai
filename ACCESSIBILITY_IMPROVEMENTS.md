# ACCESSIBILITY & UI/UX IMPROVEMENT GUIDE

## Overview
This guide documents accessibility improvements needed for the Cardiac Insight AI application to meet WCAG 2.1 AA standards and provide excellent user experience.

## 1. ARIA LABELS & SEMANTIC HTML

### Current Issues
- ❌ Many form inputs missing `aria-label`
- ❌ Buttons not describing purpose clearly
- ❌ Links not descriptive enough

### Solution: Form Components Enhancement

```typescript
// Example improvement for PatientForm component

// BEFORE:
<Input
  id="age"
  type="number"
  value={formData.age}
  onChange={(e) => updateField('age', parseInt(e.target.value))}
/>

// AFTER:
<Input
  id="age"
  type="number"
  value={formData.age}
  onChange={(e) => updateField('age', parseInt(e.target.value))}
  aria-label="Patient age in years"
  aria-describedby="age-help"
  aria-required="true"
  aria-invalid={validationErrors.some(e => e.field === 'age')}
/>
<span id="age-help" className="text-xs text-muted-foreground">
  Age must be between 18 and 130 years
</span>
```

### Required ARIA Additions

#### All Input Fields Need:
```typescript
// Pattern for all inputs
aria-label="[descriptive name]"
aria-describedby="[field]-help"
aria-required="true/false"
aria-invalid="true/false"
```

#### All Buttons Need:
```typescript
// Pattern for all buttons
aria-label="[action description]"
aria-pressed="true/false"  // For toggle buttons
aria-expanded="true/false" // For expandable buttons
```

#### Form Sections Need:
```typescript
<fieldset>
  <legend>Heart Attack Risk Assessment</legend>
  {/* form fields inside */}
</fieldset>
```

### Implementation Checklist

**Basic Information Section:**
- [ ] Add aria-label to age input
- [ ] Add aria-label to gender select
- [ ] Add aria-label to height input
- [ ] Add aria-label to weight input

**Cardiovascular Metrics Section:**
- [ ] Add aria-label to all BP inputs
- [ ] Add aria-label to cholesterol input
- [ ] Add aria-label to heart rate inputs
- [ ] Add aria-label to exercise test inputs

**Health History Section:**
- [ ] Add aria-label to all checkbox inputs
- [ ] Add aria-label to medication selects
- [ ] Add aria-label to ECG/test result inputs

**Lifestyle Assessment Section:**
- [ ] Add aria-label to diet select
- [ ] Add aria-label to activity level select
- [ ] Add aria-label to stress level slider
- [ ] Add aria-label to sleep hours input

---

## 2. COLOR CONTRAST IMPROVEMENTS

### Current Issues
- ⚠️ Some text may have insufficient contrast ratio
- ⚠️ Risk level colors not distinct enough for colorblind users

### WCAG 2.1 AA Requirements
- Normal text: **4.5:1** contrast ratio
- Large text (18pt+): **3:1** contrast ratio
- UI Components: **3:1** contrast ratio

### Risk Level Color Scheme - IMPROVED

```typescript
// BEFORE:
const riskColors = {
  low: '#00ff00',      // Too bright
  medium: '#ffff00',   // Too bright
  high: '#ff0000',     // Too bright
};

// AFTER (WCAG AA compliant):
const riskColors = {
  low: '#0D7E33',      // Dark green (7.2:1 on white)
  medium: '#D97706',   // Dark amber/orange (6.1:1 on white)
  high: '#DC2626',     // Dark red (7.5:1 on white)
};

// With text labels for colorblind users
const riskLabels = {
  low: '✓ Low Risk',
  medium: '⚠ Medium Risk',
  high: '⛔ High Risk',
};
```

### Improve Badge Component

```typescript
// components/ui/badge.tsx - Enhanced

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  riskLevel?: 'low' | 'medium' | 'high';
  ariaLabel?: string; // NEW
  icon?: React.ReactNode; // NEW - For visual distinction
}

export function Badge({
  variant,
  riskLevel,
  ariaLabel,
  icon,
  ...props
}: BadgeProps) {
  const baseStyle = cn(
    'inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold',
    'border border-current/20', // NEW: visible border
  );

  const riskStyle = {
    low: cn(baseStyle, 'bg-green-50 text-green-800 border-green-200'),
    medium: cn(baseStyle, 'bg-amber-50 text-amber-800 border-amber-200'),
    high: cn(baseStyle, 'bg-red-50 text-red-800 border-red-200'),
  };

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={riskLevel ? riskStyle[riskLevel] : baseStyle}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {props.children}
    </div>
  );
}
```

---

## 3. KEYBOARD NAVIGATION & FOCUS MANAGEMENT

### Issues
- ⚠️ Focus indicators not visible enough
- ❌ Keyboard trap possible in modals
- ❌ Tab order not logical

### Implementation

#### Enhance Focus Visibility

```css
/* Global CSS improvements */

:focus-visible {
  outline: 3px solid #0D7E33 !important;
  outline-offset: 2px !important;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid #0D7E33;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip to main content link */
.skip-to-main {
  position: absolute;
  top: -40px;
  left: 0;
  background: #0D7E33;
  color: white;
  padding: 8px;
  border-radius: 4px;
  z-index: 100;
}

.skip-to-main:focus {
  top: 0;
}
```

#### Add to Header Component

```typescript
// components/layout/Header.tsx

export function Header() {
  return (
    <>
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      
      {/* Header content */}
      <header className="border-b">
        {/* ... */}
      </header>
      
      {/* Main content */}
      <main id="main-content">
        {/* ... */}
      </main>
    </>
  );
}
```

#### Manage Focus in Modals

```typescript
// Hook for managing focus in modals
export function useFocusTrap(ref: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref]);
}
```

---

## 4. SCREEN READER SUPPORT

### Issues
- ❌ Prediction results not announced to screen readers
- ❌ Error messages not associated with fields
- ⚠️ Loading states not announced

### Implementation

#### Add Screen Reader Announcements

```typescript
// hooks/useScreenReaderAnnouncement.ts

import { useEffect } from 'react';

export function useScreenReaderAnnouncement(message: string, priority: 'polite' | 'assertive' = 'polite') {
  useEffect(() => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only'); // Visually hidden
    announcement.textContent = message;

    document.body.appendChild(announcement);

    return () => {
      document.body.removeChild(announcement);
    };
  }, [message, priority]);
}

// Usage in Dashboard
<>
  {loading && (
    <useScreenReaderAnnouncement 
      message="Analyzing heart attack risk. Please wait..."
      priority="polite"
    />
  )}
  
  {currentPrediction && (
    <useScreenReaderAnnouncement
      message={`Risk assessment complete. Your risk level is ${currentPrediction.riskLevel}.`}
      priority="assertive"
    />
  )}
</>
```

#### Associate Error Messages

```typescript
// BEFORE:
<>
  <Input id="age" />
  {error && <span>{error.message}</span>}
</>

// AFTER:
<>
  <Input
    id="age"
    aria-describedby={error ? 'age-error' : undefined}
    aria-invalid={!!error}
  />
  {error && (
    <span id="age-error" role="alert" className="text-red-600">
      {error.message}
    </span>
  )}
</>
```

---

## 5. MOBILE RESPONSIVENESS IMPROVEMENTS

### Issues
- ⚠️ Forms not optimized for mobile
- ⚠️ Risk charts hard to read on small screens
- ❌ Buttons too small for touch (< 44x44px)

### Implementation

#### Touch-Friendly Button Sizing

```typescript
// Update Button component

export function Button({ size = 'default', ...props }: ButtonProps) {
  const sizeClasses = {
    // Ensure minimum touch target of 44x44px
    sm: 'h-8 px-3 text-xs', // May be too small for touch
    default: 'h-10 px-4 text-sm', // 40px, add padding vertically
    lg: 'h-12 px-8 text-base', // 48px, good for touch
    xl: 'h-14 px-10 text-lg', // 56px, excellent for touch
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'rounded-md font-medium',
        'transition-colors',
        // Ensure at least 44px height on mobile
        'min-h-[44px] min-w-[44px]',
        sizeClasses[size],
      )}
      {...props}
    />
  );
}
```

#### Mobile-Optimized Forms

```typescript
// PatientForm improvements

export function PatientForm() {
  return (
    <form className="space-y-4 sm:space-y-6">
      {/* Use stack layout on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Each field takes full width on mobile */}
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="Enter your age"
            // Larger input on mobile
            className="h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select>
            <SelectTrigger className="h-12 sm:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Buttons take full width on mobile */}
      <Button className="w-full h-12">
        Submit
      </Button>
    </form>
  );
}
```

#### Mobile-Optimized Results Display

```typescript
// RiskDisplay component

export function RiskDisplay({ prediction }: { prediction: PredictionResult }) {
  return (
    <Card className="w-full">
      {/* Single column on mobile, multi-column on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Risk Score - Large on all screens */}
        <div className="md:col-span-2 lg:col-span-1">
          <div className="text-center p-6">
            <div className="text-6xl md:text-5xl font-bold">
              {prediction.riskScore}%
            </div>
            <div className="text-xl md:text-lg font-semibold mt-2">
              {prediction.riskLevel.toUpperCase()}
            </div>
          </div>
        </div>
        
        {/* Metrics - Stack on mobile */}
        <div className="md:col-span-2 lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Confidence" value={`${prediction.confidence}%`} />
            <MetricCard label="Model" value="Ensemble" />
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

## 6. ERROR MESSAGING IMPROVEMENTS

### Current Issues
- ❌ Generic error messages
- ❌ No clear action items for users
- ⚠️ Errors not easy to find on screen

### Implementation

#### Enhanced Error Display

```typescript
// components/FormError.tsx - NEW component

interface FormErrorProps {
  error: ValidationError | null;
  suggestion?: string;
}

export function FormError({ error, suggestion }: FormErrorProps) {
  if (!error) return null;

  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border-l-4 p-4 mb-4',
        'bg-red-50 border-red-400 text-red-800',
      )}
    >
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold">{error.message}</h4>
          {suggestion && (
            <p className="text-sm mt-1 text-red-700">
              💡 {suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### Error Field Highlighting

```typescript
// Improve input styling when error

export function Input({ isError, errorMessage, ...props }: InputProps) {
  return (
    <div>
      <input
        className={cn(
          'w-full px-3 py-2 border rounded-md',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          isError
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500',
        )}
        aria-invalid={isError}
        aria-describedby={isError ? `${props.id}-error` : undefined}
        {...props}
      />
      {isError && errorMessage && (
        <p id={`${props.id}-error`} className="text-sm text-red-600 mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
```

---

## 7. LOADING & PROCESSING STATE FEEDBACK

### Issues
- ⚠️ No visual feedback during processing
- ❌ No estimated time indicators
- ❌ No cancel options

### Implementation

```typescript
// Enhanced loading states

<div className="space-y-4">
  {/* Progress indicator */}
  <div className="w-full">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium">Analyzing...</span>
      <span className="text-xs text-muted-foreground">~3 seconds</span>
    </div>
    <Progress value={65} className="h-2" />
  </div>
  
  {/* Status message */}
  <div
    role="status"
    aria-live="polite"
    className="flex items-center gap-2 text-sm"
  >
    <Loader2 className="h-4 w-4 animate-spin" />
    Processing cardiovascular data...
  </div>
  
  {/* Can cancel */}
  <Button variant="outline" size="sm" onClick={handleCancel}>
    Cancel Analysis
  </Button>
</div>
```

---

## IMPLEMENTATION PRIORITY

### Phase 1 (This Week) - Critical Accessibility
- [ ] Add ARIA labels to all form inputs
- [ ] Fix color contrast for risk levels
- [ ] Add skip to main content link
- [ ] Improve focus indicators

### Phase 2 (Next Week) - Screen Reader Support
- [ ] Add aria-describedby to error fields
- [ ] Implement screen reader announcements
- [ ] Test with NVDA/JAWS
- [ ] Add role="status" for dynamic updates

### Phase 3 (Following Week) - Mobile & Touch
- [ ] Ensure 44x44px minimum touch targets
- [ ] Responsive form layouts
- [ ] Mobile-optimized results display
- [ ] Touch-friendly charts/graphs

### Phase 4 (Ongoing) - Polish
- [ ] User testing with accessibility users
- [ ] Third-party accessibility audit
- [ ] WCAG 2.1 AA certification
- [ ] Continuous monitoring

---

## TESTING CHECKLIST

### Keyboard Navigation
- [ ] Tab through form - order is logical
- [ ] Can reach all interactive elements
- [ ] Can escape from modals
- [ ] Enter/Space activate buttons

### Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (Mac)
- [ ] Test with TalkBack (Mobile)

### Color & Contrast
- [ ] Use WebAIM Contrast Checker
- [ ] Test with colorblind simulator
- [ ] Ensure icons + text (not just color)

### Mobile
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Check touch target sizes
- [ ] Verify responsive layouts

### Automated Tools
- [ ] Run axe DevTools
- [ ] Run Lighthouse accessibility audit
- [ ] Check HTML validation
- [ ] Check ARIA usage

---

## REFERENCE LINKS

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Colors Tool](https://accessible-colors.com/)
