# PERFORMANCE & SECURITY OPTIMIZATION GUIDE

## EXECUTIVE SUMMARY

### Current Metrics
- **Bundle Size:** 1,809.55 KB (1.76 MB) ❌ **OVER LIMIT**
- **Gzip Size:** 521.02 KB
- **First Load:** ~3-4 seconds ⚠️
- **Lighthouse Score:** ~55/100 ❌
- **Security Headers:** Missing ❌

### Targets
- **Bundle Size:** < 400 KB (reduce by 78%)
- **First Load:** < 1.5 seconds
- **Lighthouse Score:** > 90/100
- **Security Headers:** Full implementation

---

## PART 1: PERFORMANCE OPTIMIZATION

### 1.1 CODE SPLITTING

#### Problem
All code loaded upfront - tree-shaking not effective enough.

#### Solution: Route-Based Code Splitting

```typescript
// src/App.tsx - BEFORE
import Dashboard from '@/components/Dashboard';
import PatientForm from '@/components/PatientForm';
import PredictionHistory from '@/components/PredictionHistory';
import PremiumDashboard from '@/components/subscription/PremiumDashboard';

// AFTER - Lazy load components
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/components/Dashboard'));
const PatientForm = lazy(() => import('@/components/PatientForm'));
const PredictionHistory = lazy(() => import('@/components/PredictionHistory'));
const PremiumDashboard = lazy(() => import('@/components/subscription/PremiumDashboard'));
const ProfessionalDashboard = lazy(() => import('@/components/subscription/ProfessionalDashboard'));

// Routes
export const routes = [
  {
    path: '/dashboard',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Dashboard />
      </Suspense>
    ),
  },
  {
    path: '/premium',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <PremiumDashboard />
      </Suspense>
    ),
  },
];
```

#### Manual Chunks Configuration (vite.config.ts)

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@/components/ui', 'lucide-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // Feature chunks
          'predictions': [
            '@/services/advancedMLModels',
            '@/lib/edgeCaseHandler',
            '@/services/mlService',
          ],
          'forms': [
            '@/components/PatientForm',
            '@/lib/validation',
          ],
          'premium': [
            '@/components/subscription/PremiumDashboard',
            '@/components/subscription/ProfessionalDashboard',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase warning threshold during development
  },
});
```

### 1.2 DYNAMIC IMPORTS

```typescript
// Load heavy dependencies only when needed

// LAZY LOAD CHARTS
const Charts = lazy(() => import('@/components/ui/chart'));

// LAZY LOAD ML MODELS
export async function loadAdvancedModels() {
  return import('@/services/advancedMLModels');
}

// LAZY LOAD RECOMMENDATIONS ENGINE  
export async function loadRecommendationsEngine() {
  return import('@/services/recommendationEngine');
}

// Usage in components
export function useAdvancedModels() {
  const [models, setModels] = useState<typeof advancedMLModels | null>(null);

  useEffect(() => {
    loadAdvancedModels().then(setModels);
  }, []);

  return models;
}
```

### 1.3 TREE SHAKING & DEAD CODE REMOVAL

```typescript
// In vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn'],
      },
      output: {
        comments: false,
      },
    },
  },
});
```

### 1.4 IMAGE OPTIMIZATION

```typescript
// Create optimized image component
// src/components/OptimizedImage.tsx

import { useState } from 'react';

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);

  // Use WebP with fallback
  return (
    <picture>
      <source srcSet={`${src}.webp`} type="image/webp" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading="lazy" // Lazy load images
        onLoad={() => setLoaded(true)}
        style={{
          opacity: loaded ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
        }}
      />
    </picture>
  );
}
```

### 1.5 CACHING STRATEGY

```typescript
// src/lib/cache.ts

class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: Record<string, number> = {
    'predictions': 5 * 60 * 1000, // 5 minutes
    'userProfile': 30 * 60 * 1000, // 30 minutes
    'riskModels': 60 * 60 * 1000, // 1 hour
  };

  set(key: string, data: any, ttlKey: string = 'default'): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string, ttlKey: string = 'default'): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const ttl = this.ttl[ttlKey] || 60000;
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();
```

### 1.6 DATABASE QUERY OPTIMIZATION

```typescript
// Implement connection pooling
// .env
DATABASE_CONNECTION_POOL_SIZE=10
DATABASE_QUERY_TIMEOUT=5000

// Add indexes for common queries
// lib/database-setup.sql

CREATE INDEX idx_predictions_user_id_created 
  ON ml_predictions(user_id, created_at DESC);

CREATE INDEX idx_profiles_user_id 
  ON profiles(user_id) UNIQUE;

CREATE INDEX idx_predictions_risk_level
  ON ml_predictions(risk_level);
```

### 1.7 MEMOIZATION & PERFORMANCE TRACKING

```typescript
// components/RiskDisplay.tsx

import { memo, useMemo } from 'react';

export const RiskDisplay = memo(function RiskDisplay({
  prediction,
}: RiskDisplayProps) {
  // Memoize expensive calculations
  const formattedScore = useMemo(() => {
    return Math.round(prediction.riskScore * 100) / 100;
  }, [prediction.riskScore]);

  const riskTrend = useMemo(() => {
    return calculateTrend(prediction);
  }, [prediction]);

  return (
    <div>
      <div className="text-4xl font-bold">{formattedScore}%</div>
      {riskTrend && <TrendIndicator trend={riskTrend} />}
    </div>
  );
});

// Precompile large lists
export const memoizedRecommendations = memo(function Recommendations({
  items,
}: any) {
  return items.map((item, idx) => (
    <RecommendationCard key={idx} {...item} />
  ));
});
```

### 1.8 Lighthouse Monitoring

```typescript
// Add performance monitoring
// src/lib/performanceMonitor.ts

export class PerformanceMonitor {
  static measureComponent(componentName: string) {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (duration > 1000) {
        console.warn(`⚠️ ${componentName} took ${duration}ms to render`);
      } else {
        console.log(`✓ ${componentName} rendered in ${duration}ms`);
      }
    };
  }

  static logWebVitals() {
    // Send to monitoring service
    web-vitals.getCLS((metric) => console.log('CLS:', metric));
    web-vitals.getFID((metric) => console.log('FID:', metric));
    web-vitals.getFCP((metric) => console.log('FCP:', metric));
    web-vitals.getLCP((metric) => console.log('LCP:', metric));
    web-vitals.getTTFB((metric) => console.log('TTFB:', metric));
  }
}
```

---

## PART 2: SECURITY HARDENING

### 2.1 SECURITY HEADERS

```typescript
// vite.config.ts - Add security headers

export default defineConfig({
  server: {
    middlewareMode: true,
    headers: {
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://supabase.*; frame-ancestors 'none';",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    },
  },
});
```

### 2.2 INPUT SANITIZATION

```typescript
// src/lib/sanitize.ts

import DOMPurify from 'dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

// Usage in components
<input
  value={sanitizeInput(userInput)}
  onChange={(e) => setUserInput(sanitizeInput(e.target.value))}
/>
```

### 2.3 ENCRYPTION AT REST

```typescript
// src/lib/encryption.ts

import crypto from 'crypto-js';

const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'default-key';

export function encryptSensitiveData(data: any): string {
  return crypto.AES.encrypt(
    JSON.stringify(data),
    ENCRYPTION_KEY
  ).toString();
}

export function decryptSensitiveData(encryptedData: string): any {
  const decrypted = crypto.AES.decrypt(encryptedData, ENCRYPTION_KEY).toString(
    crypto.enc.Utf8
  );
  return JSON.parse(decrypted);
}

// Usage: Encrypt sensitive patient data before storing
export async function savePredictionSecurely(
  userId: string,
  patientData: PatientData,
  prediction: PredictionResult
) {
  const encrypted = {
    patientData: encryptSensitiveData(patientData),
    predictionResult: encryptSensitiveData(prediction),
  };

  return await supabase
    .from('ml_predictions')
    .insert({
      user_id: userId,
      encrypted_data: JSON.stringify(encrypted),
      // Don't store sensitive data in plaintext
    });
}
```

### 2.4 RATE LIMITING

```typescript
// src/lib/rateLimiter.ts

class RateLimiter {
  private requestCounts = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requestTimes = this.requestCounts.get(key) || [];

    // Remove old requests outside the time window
    const recentRequests = requestTimes.filter(
      (time) => now - time < this.windowMs
    );

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requestCounts.set(key, recentRequests);
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const requestTimes = this.requestCounts.get(key) || [];
    const recentRequests = requestTimes.filter(
      (time) => now - time < this.windowMs
    );
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

export const predictionLimiter = new RateLimiter(10, 60000); // 10 predictions/minute

// Usage in components
export async function handlePrediction(data: PatientData) {
  const userId = user.id;
  
  if (!predictionLimiter.isAllowed(userId)) {
    toast({
      title: 'Rate Limited',
      description: `Too many requests. Try again in ${predictionLimiter.getRemainingRequests(userId)} seconds`,
      variant: 'destructive',
    });
    return;
  }

  // Proceed with prediction
}
```

### 2.5 IMPLEMENT TWO-FACTOR AUTHENTICATION

```typescript
// src/services/authService.ts

import { totp } from 'otplib';

export async function enableTwoFactorAuth(userId: string) {
  // Generate secret
  const secret = totp.generateSecret();

  // Save to database
  await supabase
    .from('user_2fa')
    .upsert({
      user_id: userId,
      secret,
      enabled: false,
      backup_codes: generateBackupCodes(),
    });

  return secret;
}

export async function verifyTwoFactorToken(userId: string, token: string) {
  const { data } = await supabase
    .from('user_2fa')
    .select('secret')
    .eq('user_id', userId)
    .single();

  return totp.check(token, data.secret);
}

function generateBackupCodes(): string[] {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
  }
  return codes;
}
```

### 2.6 SECURE SESSION MANAGEMENT

```typescript
// src/lib/sessionManager.ts

export class SessionManager {
  private static SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static sessionTimer: NodeJS.Timeout;

  static startSession() {
    this.resetTimer();
  }

  static resetTimer() {
    clearTimeout(this.sessionTimer);

    this.sessionTimer = setTimeout(() => {
      this.expireSession();
    }, this.SESSION_TIMEOUT);
  }

  static expireSession() {
    // Clear user data
    localStorage.removeItem('auth_token');
    // Redirect to login
    window.location.href = '/login';
  }

  static extendSession() {
    this.resetTimer();
  }
}

// In main component
useEffect(() => {
  SessionManager.startSession();

  // Reset on user activity
  const activity = () => SessionManager.resetTimer();
  document.addEventListener('mousedown', activity);
  document.addEventListener('keydown', activity);

  return () => {
    document.removeEventListener('mousedown', activity);
    document.removeEventListener('keydown', activity);
  };
}, []);
```

### 2.7 AUDIT LOGGING

```typescript
// src/lib/auditLog.ts

export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  details?: any;
}

export async function logAuditEvent(entry: AuditLogEntry) {
  // Never log sensitive data
  const sanitized = {
    ...entry,
    details: entry.details ? sanitizeInput(JSON.stringify(entry.details)) : undefined,
  };

  return await supabase
    .from('audit_logs')
    .insert(sanitized);
}

// Usage examples
await logAuditEvent({
  userId: user.id,
  action: 'prediction_created',
  resource: 'prediction',
  timestamp: new Date(),
  status: 'success',
});

await logAuditEvent({
  userId: user.id,
  action: 'login_attempt',
  resource: 'auth',
  timestamp: new Date(),
  status: 'failure',
  details: { reason: 'invalid_password' },
});
```

### 2.8 DEPENDENCY SECURITY

```bash
# Regular security audits
npm audit
npm audit fix

# Check for outdated packages
npm outdated

# Use automatic security updates
npm install -g npm-check-updates
ncu -i

# In package.json - Use exact versions for critical deps
{
  "dependencies": {
    "@supabase/supabase-js": "2.39.0",  // Exact version
    "react": "18.2.0",                  // Exact version
  },
  "devDependencies": {
    "vite": "^5.0.0",                   // Allow patches
    "typescript": "~5.2.0"              // Allow minor updates
  }
}
```

---

## IMPLEMENTATION ROADMAP

### Phase 1 (This Week) - Critical
- [ ] Implement code splitting for lazy routes
- [ ] Add security headers
- [ ] Implement rate limiting
- [ ] Enable HTTPS/TLS

### Phase 2 (Next Week) - Important
- [ ] Optimize database queries
- [ ] Implement caching strategy
- [ ] Add input sanitization
- [ ] Encryption at rest

### Phase 3 (Following Week) - Enhanced
- [ ] Two-factor authentication
- [ ] Session management
- [ ] Audit logging
- [ ] Performance monitoring

### Phase 4 (Month 2) - Polish
- [ ] Third-party security audit
- [ ] Penetration testing
- [ ] HIPAA compliance review
- [ ] Insurance carrier requirements

---

## MONITORING & METRICS

### Performance Metrics to Track
```typescript
// Monitor these metrics in production
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s
- Bundle Size: < 400KB gzip
```

### Security Metrics to Track
```typescript
// Track security events
- Failed login attempts
- Rate limit violations
- Suspicious API patterns
- Unauthorized access attempts
- Data export events
```

---

## DEPLOYMENT CHECKLIST

- [ ] Security headers configured
- [ ] SSL/TLS certificate installed
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Database backups automated
- [ ] Monitoring alerts set up
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] 2FA ready for deployment
- [ ] Security headers tested
