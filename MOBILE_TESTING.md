# 📱 Mobile Responsive Testing Guide

## Overview

SynapsePay is designed mobile-first with responsive breakpoints. This guide helps test mobile responsiveness.

---

## 🔍 Quick Test Method

### Browser DevTools

1. Open Chrome/Brave/Edge
2. Press `F12` or `Cmd+Option+I` (Mac)
3. Click the device icon (Toggle Device Toolbar)
4. Select preset devices or custom dimensions

### Recommended Test Devices

| Device | Width | Height | Scale |
|--------|-------|--------|-------|
| iPhone SE | 375px | 667px | 2x |
| iPhone 14 Pro | 393px | 852px | 3x |
| Samsung Galaxy S20 | 360px | 800px | 3x |
| iPad Mini | 768px | 1024px | 2x |
| iPad Pro | 1024px | 1366px | 2x |

---

## 📐 Responsive Breakpoints

SynapsePay uses these Tailwind breakpoints:

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Small tablets, large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops |

---

## ✅ Testing Checklist

### Home Page (`/`)
- [ ] Hero text readable on mobile
- [ ] Stats cards stack vertically
- [ ] Featured agents carousel works
- [ ] "Get Started" button accessible
- [ ] Help button visible (bottom right)

### Marketplace (`/marketplace`)
- [ ] Search bar full width on mobile
- [ ] Category pills horizontally scrollable
- [ ] Agent cards stack on mobile (1 column)
- [ ] Grid view: 1 col mobile, 2 col tablet, 3 col desktop
- [ ] Filter dropdown accessible

### Agent Details (`/agent/:id`)
- [ ] Agent info readable
- [ ] "Pay & Run" button full width on mobile
- [ ] Payment modal fits screen
- [ ] Keyboard doesn't cover input fields

### Devices (`/devices`)
- [ ] Device cards stack
- [ ] Status badges visible
- [ ] "Rent Now" buttons accessible

### Dashboard (`/dashboard`)
- [ ] Stats cards stack (2x2 on tablet, 4x1 on mobile)
- [ ] Charts scroll horizontally if needed
- [ ] Transaction list readable

### Wallet/Payment
- [ ] Connect Wallet button visible in navbar
- [ ] Wallet address truncates properly
- [ ] Payment modal centered and scrollable
- [ ] Confetti animation works

---

## 🎨 Common Mobile Issues to Check

### 1. Text Overflow
```css
/* Should truncate long text */
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

### 2. Horizontal Scroll
Make sure no horizontal scroll on body:
```css
body { overflow-x: hidden; }
```

### 3. Touch Targets
Buttons should be at least 44x44px for touch:
```css
.btn { min-height: 44px; min-width: 44px; }
```

### 4. Safe Area (iPhone X+)
```css
.container { padding-bottom: env(safe-area-inset-bottom); }
```

---

## 📸 Screenshot Checklist for Submission

Take screenshots at these breakpoints:

1. **Mobile (375px)** - iPhone-like view
2. **Tablet (768px)** - iPad-like view
3. **Desktop (1280px)** - Standard desktop

### Pages to Screenshot:
- [ ] Home page (hero section)
- [ ] Marketplace (grid view)
- [ ] Agent details with payment button
- [ ] Payment modal (showing steps)
- [ ] Success state with confetti
- [ ] Dashboard

---

## 🧪 Testing with Real Devices

### iOS (iPhone/iPad)
1. Connect device to Mac
2. Open Safari on Mac
3. Develop menu → Your Device → Inspect

### Android
1. Enable Developer Options on phone
2. Enable USB Debugging
3. Connect to computer
4. In Chrome: `chrome://inspect/#devices`

---

## 🔧 Quick Fixes for Common Issues

### Navbar overflow on mobile
```tsx
// Add max-width and truncate
<span className="max-w-[100px] truncate">{walletAddress}</span>
```

### Modal too wide on mobile
```css
.modal { max-width: calc(100vw - 2rem); width: 100%; }
```

### Grid not responsive
```tsx
// Use responsive grid classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## 📱 Current Mobile Support Status

| Feature | Status | Notes |
|---------|--------|-------|
| Responsive Layout | ✅ | Tailwind responsive classes |
| Touch-Friendly Buttons | ✅ | All buttons 44px+ |
| Mobile Navigation | ✅ | Hamburger menu |
| Payment Modal | ✅ | Scrollable on small screens |
| Wallet Connect | ✅ | Works with mobile wallets |

---

*Last Updated: December 14, 2025*
