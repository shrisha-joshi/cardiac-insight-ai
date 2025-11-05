# 🎨 UI Component Quick Reference Guide

## Table of Contents
1. [Theme System](#theme-system)
2. [Animated Components](#animated-components)
3. [Utility Classes](#utility-classes)
4. [Color Palette](#color-palette)
5. [Typography](#typography)
6. [Animation Timings](#animation-timings)
7. [Usage Examples](#usage-examples)

---

## Theme System

### Using Theme Context
```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### Theme Toggle Component
```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle';

<ThemeToggle />
```

---

## Animated Components

### Heartbeat Animation (ECG Line)
```tsx
import { HeartbeatAnimation } from '@/components/ui/animated-medical-icons';

<HeartbeatAnimation />
```

### Pulsing Heart Icon
```tsx
import { HeartPulse } from '@/components/ui/animated-medical-icons';

<HeartPulse />  // Animates automatically
```

### Background Waves
```tsx
import { DNAWave, WaveformBackground } from '@/components/ui/animated-medical-icons';

// DNA helix waves
<div className="relative">
  <DNAWave />
  <div>Your content</div>
</div>

// Medical waveform pattern
<div className="relative">
  <WaveformBackground />
  <div>Your content</div>
</div>
```

### Medical Icons
```tsx
import { MedicalShieldIcon, AIChipIcon } from '@/components/ui/animated-medical-icons';

<MedicalShieldIcon />  // Animated shield with cross
<AIChipIcon />         // Animated AI chip
```

---

## Utility Classes

### Glassmorphism
```tsx
// Light mode glass
<Card className="glass">
  Content
</Card>

// Dark mode glass
<Card className="glass-dark">
  Content
</Card>

// Automatic (switches with theme)
<Card className="glass dark:glass-dark">
  Content
</Card>
```

### Gradients
```tsx
// Medical gradient (teal to cyan)
<div className="gradient-medical">
  Content
</div>

// Soft teal gradient
<div className="gradient-teal">
  Content
</div>

// Hero gradient background
<div className="gradient-hero">
  Content
</div>
```

### Glow Effects
```tsx
// Static teal glow
<Button className="glow-teal">
  Click me
</Button>

// Animated pulsing glow
<Button className="glow-pulse">
  Click me
</Button>
```

### Shadows
```tsx
// Medical-themed shadow
<Card className="shadow-medical">
  Content
</Card>

// Hover effect shadow
<Card className="shadow-card-hover">
  Content (hover me)
</Card>
```

### Animations
```tsx
// Heartbeat pulse
<Heart className="heartbeat" />

// Shimmer effect
<div className="shimmer">
  Loading...
</div>
```

---

## Color Palette

### Light Mode
```tsx
// Primary medical teal
<div className="bg-medical-primary text-white">Teal</div>

// Accent teal
<div className="bg-medical-accent text-white">Accent</div>

// Success (low risk)
<div className="bg-risk-low text-white">Low Risk</div>

// Warning (medium risk)
<div className="bg-risk-medium text-white">Medium Risk</div>

// Danger (high risk)
<div className="bg-risk-high text-white">High Risk</div>
```

### Gradient Text
```tsx
<h1 className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
  Gradient Text
</h1>

// Dark mode variant
<h1 className="bg-gradient-to-r from-teal-400 to-emerald-400 dark:from-teal-300 dark:to-emerald-300 bg-clip-text text-transparent">
  Gradient Text
</h1>
```

---

## Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### Size Scale
```tsx
// Headings
<h1 className="text-5xl md:text-7xl font-bold">Hero Title</h1>
<h2 className="text-4xl md:text-5xl font-bold">Section Title</h2>
<h3 className="text-2xl font-bold">Card Title</h3>

// Body
<p className="text-xl">Large paragraph</p>
<p className="text-base">Regular paragraph</p>
<p className="text-sm">Small text</p>
```

---

## Animation Timings

### Built-in Animations
```tsx
// Heartbeat (2.4s loop)
<div className="animate-heartbeat">
  ❤️
</div>

// Pulse glow (2.4s loop)
<div className="animate-pulse-glow">
  Glowing
</div>

// Shimmer (2s loop)
<div className="animate-shimmer">
  Shimmering
</div>

// Fade in
<div className="animate-fade-in">
  Fading in
</div>

// Fade in + slide up
<div className="animate-fade-in-up">
  Fading in and sliding
</div>
```

### Framer Motion Animations
```tsx
import { motion } from 'framer-motion';

// Basic fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>

// Slide up
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: 'easeOut' }}
>
  Content
</motion.div>

// Staggered children
const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

<motion.div variants={container} initial="hidden" animate="visible">
  <motion.div variants={item}>Item 1</motion.div>
  <motion.div variants={item}>Item 2</motion.div>
  <motion.div variants={item}>Item 3</motion.div>
</motion.div>

// Hover effects
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Button
</motion.button>
```

---

## Usage Examples

### Feature Card
```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
  whileHover={{ y: -8 }}
>
  <Card className="glass dark:glass-dark border-teal-500/20 shadow-card-hover">
    <CardContent className="p-8">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-6 shadow-lg">
        <Heart className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-2xl font-bold mb-3">Feature Title</h3>
      <p className="text-muted-foreground">Feature description</p>
    </CardContent>
  </Card>
</motion.div>
```

### CTA Button
```tsx
<Button
  size="lg"
  className="group relative px-8 py-6 text-lg font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/40 transition-all duration-300"
>
  <span className="flex items-center gap-2">
    Get Started
    <motion.div
      animate={{ x: [0, 5, 0] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <ArrowRight className="w-5 h-5" />
    </motion.div>
  </span>
</Button>
```

### Stat Card
```tsx
<Card className="glass dark:glass-dark border-teal-500/20 text-center shadow-card-hover">
  <CardContent className="pt-6 pb-6">
    <TrendingUp className="w-8 h-8 mx-auto mb-3 text-teal-500" />
    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
      98.5%
    </div>
    <div className="text-sm text-muted-foreground mt-2">Accuracy</div>
  </CardContent>
</Card>
```

### Testimonial Card
```tsx
<Card className="glass dark:glass-dark border-teal-500/20 shadow-card-hover">
  <CardContent className="p-6">
    <div className="flex items-center gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
    <p className="text-muted-foreground mb-6 leading-relaxed italic">
      "Amazing product that helped me understand my health better."
    </p>
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold">
        JD
      </div>
      <div>
        <div className="font-semibold">John Doe</div>
        <div className="text-sm text-muted-foreground">Healthcare Professional</div>
      </div>
    </div>
  </CardContent>
</Card>
```

### Hero Section
```tsx
<section className="relative pt-20 pb-32 px-4 overflow-hidden">
  {/* Background */}
  <WaveformBackground />
  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-emerald-500/10" />
  
  {/* Content */}
  <div className="container mx-auto max-w-6xl relative z-10">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center space-y-8"
    >
      <Badge className="glass dark:glass-dark px-6 py-2">
        <Sparkles className="w-4 h-4 mr-2 text-teal-500" />
        Backed by AI
      </Badge>
      
      <h1 className="text-5xl md:text-7xl font-bold">
        <span className="block text-foreground">Understand your heart.</span>
        <span className="block bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
          Predict risks early
        </span>
      </h1>
      
      <div className="py-6">
        <HeartbeatAnimation />
      </div>
      
      <Button size="lg" className="gradient-medical text-white shadow-medical">
        Get Started
        <ArrowRight className="ml-2" />
      </Button>
    </motion.div>
  </div>
</section>
```

---

## Best Practices

### 1. **Performance**
```tsx
// ✅ Good: Lazy load heavy components
const Dashboard = lazy(() => import('./components/Dashboard'));

// ✅ Good: Memoize expensive components
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* ... */}</div>;
});

// ❌ Bad: Inline animations everywhere
```

### 2. **Accessibility**
```tsx
// ✅ Good: Respect motion preferences
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{
    duration: 0.6,
    // Disable animations for users who prefer reduced motion
    ...(window.matchMedia('(prefers-reduced-motion: reduce)').matches && {
      duration: 0,
    }),
  }}
>
  Content
</motion.div>

// ✅ Good: Add aria labels
<button aria-label="Toggle theme" onClick={toggleTheme}>
  <Moon className="h-5 w-5" />
</button>
```

### 3. **Consistency**
```tsx
// ✅ Good: Use consistent spacing
const ANIMATION_DURATION = 0.6;
const STAGGER_DELAY = 0.12;

// ✅ Good: Reuse animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

<motion.div variants={fadeInUp}>Content</motion.div>
```

---

## Quick Tips

💡 **Theme-aware Colors:** Always use HSL color variables for theme compatibility
💡 **Animation Duration:** Keep between 0.3s - 0.8s for optimal UX
💡 **Easing:** Use `easeOut` for entrances, `easeIn` for exits
💡 **Stagger:** 0.1s - 0.15s between children for smooth reveals
💡 **Hover Effects:** Keep subtle (scale 1.02 - 1.1)
💡 **Medical Feel:** Use slow, calm animations (2.4s heartbeat)

---

## Troubleshooting

### Theme not switching?
```tsx
// Check if ThemeProvider wraps your app
<ThemeProvider>
  <App />
</ThemeProvider>
```

### Animations not working?
```tsx
// Ensure framer-motion is installed
npm install framer-motion

// Import motion component
import { motion } from 'framer-motion';
```

### Colors not showing?
```tsx
// Check index.css is imported
import './index.css';

// Verify Tailwind classes are correct
className="bg-teal-500" // ✅
className="bg-teal" // ❌
```

---

**Last Updated:** November 5, 2025
**Version:** 1.0.0
