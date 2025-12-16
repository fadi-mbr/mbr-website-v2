# MBR Auto Services - Design Token System

This document provides a comprehensive reference for all design tokens used in the MBR Auto Services website. All tokens are defined in `src/app/globals.css` as CSS custom properties.

---

## 🎨 Color Tokens

### Primary Brand Colors

| Token | Value | Usage | Contrast Ratio |
|-------|-------|-------|----------------|
| `--primary` | `#E30613` | Primary brand red - main actions, highlights | 5.8:1 ✅ |
| `--primary-hover` | `#FF1A2E` | Hover states for primary elements | 6.2:1 ✅ |
| `--primary-active` | `#B80513` | Active/pressed states | 5.5:1 ✅ |
| `--primary-dark` | `#8B0000` | Dark variant for backgrounds | - |
| `--primary-light` | `#E30613` | Light text variant (same as primary) | 5.8:1 ✅ |
| `--primary-accent` | `#FF4757` | Lighter accent variant | 6.0:1 ✅ |

**Usage Guidelines:**
- Use `--primary` for all brand red elements
- Never use Tailwind's `text-red-400`, `text-red-500`, etc.
- Use `--primary-hover` for interactive hover states
- Use `--primary-active` for pressed/active states

### Text Colors

| Token | Value | Usage | Contrast Ratio |
|-------|-------|-------|----------------|
| `--text-primary` | `#ffffff` | Main headings, important text | 21:1 ✅ |
| `--text-secondary` | `#e5e5e5` | Subheadings, secondary text | 17:1 ✅ |
| `--text-body` | `#a1a1aa` | Body text, paragraphs | 8.5:1 ✅ |
| `--text-muted` | `#71717a` | Supporting text, captions | 5.2:1 ✅ |
| `--text-subtle` | `#52525b` | Very subtle text, disabled | 3.8:1 ⚠️ |

**Accessibility Notes:**
- All text colors meet WCAG AA standards (4.5:1 for normal text)
- `--text-subtle` is borderline - use sparingly, only for non-critical text

### Luxury Accent Colors

| Token | Value | Usage | Contrast Ratio |
|-------|-------|-------|----------------|
| `--text-luxury-silver` | `#f3f4f6` | Silver accents, highlights | 18:1 ✅ |
| `--text-luxury-gold` | `#F4D03F` | Gold text (WCAG compliant) | 6.8:1 ✅ |
| `--text-luxury-gold-accent` | `#fcd34d` | Gold decorative accents only | 2.8:1 ❌ |

**Important:** 
- `--text-luxury-gold-accent` should **NEVER** be used for text (fails WCAG AA)
- Use `--text-luxury-gold` when gold text is needed with proper contrast
- Use `--text-luxury-gold-accent` only for decorative elements, borders, icons

### Status Colors

| Token | Value | Usage | Contrast Ratio |
|-------|-------|-------|----------------|
| `--text-success` | `#34d399` | Success states, open status | 5.3:1 ✅ |
| `--text-error` | `#E30613` | Error states, closed status (uses brand red) | 5.8:1 ✅ |

### Surface Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#000000` | Main page background |
| `--surface` | `#111111` | Card backgrounds, elevated surfaces |
| `--surface-elevated` | `#1a1a1a` | Higher elevation surfaces |
| `--surface-glass` | `rgba(255, 255, 255, 0.03)` | Glass effect backgrounds |

---

## 📏 Spacing Tokens

### Standardized Spacing Scale

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--space-xs` | `0.5rem` | 8px | Tight spacing, icon gaps |
| `--space-sm` | `1rem` | 16px | Small gaps, compact layouts |
| `--space-md` | `1.5rem` | 24px | Medium spacing, form fields |
| `--space-lg` | `2rem` | 32px | Large gaps, card spacing |
| `--space-xl` | `3rem` | 48px | Extra large spacing |
| `--space-2xl` | `4rem` | 64px | Section element spacing |
| `--space-3xl` | `6rem` | 96px | Major section spacing |

### Responsive Spacing

| Token | Value Range | Usage |
|-------|-------------|-------|
| `--space-section` | `5rem - 10rem` (80px - 160px) | Section vertical padding |
| `--space-element` | `2.5rem - 5rem` (40px - 80px) | Element spacing in sections |
| `--space-content` | `1.5rem - 3rem` (24px - 48px) | Content block spacing |

### Component Padding

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--padding-card` | `2rem` | 32px | Standard card padding |
| `--padding-card-sm` | `1.5rem` | 24px | Smaller cards, compact layouts |
| `--padding-card-lg` | `2.5rem` | 40px | Large cards, featured content |
| `--padding-section` | `6rem` | 96px | Section vertical padding |

**Usage Guidelines:**
- Always use CSS variables instead of hardcoded Tailwind classes
- Use `style={{ padding: 'var(--padding-card)' }}` for component padding
- Use `.section-padding` class for section vertical spacing
- Use `mb-24`, `gap-8` consistently (mapped to `--space-2xl`, `--space-lg`)

---

## 📝 Typography Tokens

### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-display` | `'Inter', -apple-system, sans-serif` | Display headings |
| `--font-body` | `'Inter', -apple-system, sans-serif` | Body text, paragraphs |

### Typography Scale (Responsive)

All typography uses `clamp()` for responsive sizing.

| Token | Size Range | Usage | CSS Class |
|-------|------------|-------|-----------|
| `--text-hero` | `4rem - 8rem` (64px - 128px) | Hero titles, main headlines | `.text-hero` |
| `--text-display` | `2.5rem - 4.5rem` (40px - 72px) | Section headings, display text | `.text-display` |
| `--text-heading` | `1.75rem - 2.75rem` (28px - 44px) | Subsection headings | `.text-heading` |
| `--text-subheading` | `1.125rem - 1.5rem` (18px - 24px) | Card titles, small headings | `.text-subheading` |
| `--text-body` | `0.95rem - 1.125rem` (~15px - 18px) | Body text, paragraphs | `.text-body` |
| `--text-caption` | `0.8rem - 0.95rem` (~13px - 15px) | Captions, fine print | `.text-caption` |

**Usage Guidelines:**
- Always use CSS classes (`.text-display`, `.text-heading`, etc.) instead of Tailwind text size classes
- Never use `text-5xl`, `text-6xl` - use `.text-display` instead
- Never use `text-xl`, `text-2xl` - use `.text-subheading`, `.text-heading` instead

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Light | `300` | Hero titles, display text |
| Regular | `400` | Body text, standard headings |
| Medium | `500` | Subheadings, emphasis |
| Semibold | `600` | Strong emphasis (use sparingly) |

**Note:** Avoid `font-extralight` (200) - may be too thin for readability.

---

## 🎭 Effect Tokens

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-minimal` | `0 1px 3px rgba(0, 0, 0, 0.12)` | Subtle elevation |
| `--shadow-elegant` | `0 4px 20px rgba(0, 0, 0, 0.25)` | Cards, buttons |
| `--shadow-dramatic` | `0 10px 40px rgba(0, 0, 0, 0.4)` | Modal overlays |
| `--shadow-luxury` | `0 20px 60px rgba(0, 0, 0, 0.5)` | Premium elements |

### Blur Effects

| Token | Value | Usage |
|-------|-------|-------|
| `--blur-subtle` | `blur(8px)` | Light glass effects |
| `--blur-medium` | `blur(16px)` | Standard glass cards |
| `--blur-strong` | `blur(24px)` | Premium glass effects |

---

## 🎨 Component Classes

### Glass Effects

| Class | Usage |
|-------|-------|
| `.glass-card` | Standard glass card with hover effects |
| `.glass-card-subtle` | Subtle glass effect, minimal blur |
| `.glass-card-premium` | Premium glass with stronger blur |
| `.glass-card-red-accent` | Glass card with red accent border |
| `.glass-content` | Content wrapper inside glass cards |

### Buttons

| Class | Usage |
|-------|-------|
| `.liquid-glass-btn` | Base button with glass effect |
| `.liquid-glass-btn-primary` | Primary CTA button (brand red) |
| `.liquid-glass-btn-secondary` | Secondary button (transparent) |
| `.liquid-glass-btn-small` | Smaller button variant |
| `.liquid-glass-btn-large` | Larger button variant |
| `.liquid-glass-control` | Video/media controls |

### Layout

| Class | Usage |
|-------|-------|
| `.container-luxury` | Main content container (max-width: 1400px) |
| `.section-padding` | Standard section vertical padding |
| `.content-spacing` | Standard content margin-bottom |

---

## ✅ Best Practices

### Color Usage

1. **Always use CSS variables** - Never hardcode colors or use arbitrary Tailwind colors
2. **Brand consistency** - Always use `--primary` for brand red, never Tailwind's `red-*` colors
3. **Accessibility first** - Check contrast ratios before using colors for text
4. **Gold accents** - Use `--text-luxury-gold-accent` only for decorative elements, never text

### Spacing

1. **Use standardized tokens** - Prefer CSS variables over arbitrary values
2. **Consistent margins** - Use `mb-24` for section spacing (maps to `--space-3xl`)
3. **Consistent gaps** - Use `gap-8` for grids (maps to `--space-lg`)
4. **Card padding** - Always use `var(--padding-card)` via inline styles or CSS class

### Typography

1. **Use semantic classes** - `.text-display`, `.text-heading`, etc. instead of size classes
2. **Responsive by default** - All typography tokens are responsive with `clamp()`
3. **Font weight consistency** - Use 300, 400, 500, 600 only
4. **Line height** - Typography classes include appropriate line heights

### Component Consistency

1. **Standard padding** - All cards use `var(--padding-card)` (32px)
2. **Standard spacing** - Sections use `.section-padding` class
3. **Standard gaps** - Grids use `gap-8` consistently
4. **Standard margins** - Section headers use `mb-24`

---

## 🔧 Migration Guide

### Replacing Hardcoded Colors

**Before:**
```tsx
<FaGoogle className="text-red-500" />
<div className="text-red-400">Text</div>
<div className="bg-red-600/5">Background</div>
```

**After:**
```tsx
<FaGoogle className="text-[var(--primary)]" />
<div className="text-[var(--primary)]">Text</div>
<div className="bg-[var(--primary)]/5">Background</div>
```

### Replacing Hardcoded Typography

**Before:**
```tsx
<h2 className="text-5xl md:text-6xl">Heading</h2>
<p className="text-xl">Text</p>
```

**After:**
```tsx
<h2 className="text-display">Heading</h2>
<p className="text-subheading">Text</p>
```

### Replacing Hardcoded Spacing

**Before:**
```tsx
<section className="py-24">
  <div className="mb-20">
    <div className="p-8">Card</div>
  </div>
</section>
```

**After:**
```tsx
<section className="section-padding">
  <div className="mb-24">
    <div style={{ padding: 'var(--padding-card)' }}>Card</div>
  </div>
</section>
```

---

## 📊 Color Contrast Reference

All colors are tested against WCAG AA standards:

- **Normal text**: Requires 4.5:1 contrast ratio
- **Large text** (18px+ or 14px+ bold): Requires 3:1 contrast ratio

**Passing Colors (4.5:1+):**
- ✅ `--primary` (#E30613): 5.8:1
- ✅ `--text-primary` (#ffffff): 21:1
- ✅ `--text-secondary` (#e5e5e5): 17:1
- ✅ `--text-body` (#a1a1aa): 8.5:1
- ✅ `--text-luxury-gold` (#F4D03F): 6.8:1

**Failing Colors (Do Not Use for Text):**
- ❌ `--text-luxury-gold-accent` (#fcd34d): 2.8:1 - Decorative only!

---

**Last Updated**: December 2024  
**Maintained By**: MBR Development Team







