# Roomly — Make Room for Living 🛋️

A modern, responsive web application for planning and furnishing rooms in a home to scale, arranging furniture, exploring spaces in interactive 3D, and budgeting pieces to purchase.

Built with **React**, **Vite**, **Three.js**, and **Lucide Icons**.

---

## ✨ Key Features

- **Warm Modern Interior Aesthetic**: Soft cream backgrounds (`#FAF8F5`), sage green accents (`#466352`), warm terracotta and wood tones, dark charcoal text, rounded cards, and clean typography.
- **Interactive 2D Room Planner**:
  - Room presets: *Living Room*, *Bedroom*, *Home Office*, *Kitchen & Nook*, *Dining Room*, and *Empty Custom Room*.
  - Live metric (`m` / `cm`) and imperial (`ft` / `in`) unit conversions.
  - Architectural scalable grid with snap-to-grid toggle (10 cm increments).
  - Thick perimeter walls, windows, and inward-swinging doors with clearance arcs.
  - Furniture catalog with over 18 pieces (sofas, beds, desks, chairs, wardrobes, bookshelves, coffee tables, lamps, plants, rugs).
  - Drag, rotate (smooth & 15° snap), resize, and layering (bring forward / send back).
  - **Collision & Boundary Detection**: Real-time visual warning highlights and "Auto-separate" button when pieces overlap or extend through walls.
  - Zoom in/out, pan, and center/reset view controls.
  - Multi-step Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`) history.
- **Interactive 3D Room Preview (Three.js)**:
  - Procedural 3D furniture models with realistic upholstery, wood grain, cushions, plants, and glowing lamps.
  - Soft directional shadows and ambient illumination.
  - Day (Sunlight) vs. Evening (Warm golden hour) lighting toggle.
  - OrbitControls (rotate 360°, pitch, zoom, pan).
  - Camera viewpoints: *Orbit*, *Isometric*, *Top-Down Plan*, *Eye-Level Walk-in*.
- **Layout Stylist (Prototype AI Helper)**:
  - Natural language input (e.g. *"add a cozy reading corner"*, *"make space for a desk"*, *"dining nook for 4"*).
  - Quick prompt recommendation chips with intelligent placement.
- **Downloads & Sharing**:
  - Export room design as `.JSON` (complete specification of dimensions, units, coordinates, and rotation).
  - Export 3D model as `.OBJ` file compatible with CAD, Blender, and 3D viewers.
  - Multi-Page Architectural PDF Spec Sheet with 2D blueprint and 4x multi-angle 3D renders.
  - **Shared Room Discovery**: Top ribbon for shared links with 1-click "Copy this design to edit" into personal workspace.
  - **Social Share Modal**: Live card preview mockup with 1-click copy link and direct sharing to WhatsApp, X/Twitter, Pinterest, and Email.
  - Open Graph and Twitter Card tags for social card unfurling.
  - Saved Rooms library with browser `localStorage` persistence.
- **Shopping List & Product Sourcing**:
  - Country-specific retailer links (**United States, United Kingdom, Canada, European Union, Australia**) adapting to regional catalogs (Amazon, IKEA, Wayfair, Target, John Lewis, Structube, OTTO, Temple & Webster).
  - Prices clearly categorized as **Market Estimates** with realistic low-to-high price ranges.
  - Direct specific product search queries targeting exact architectural dimensions, materials, and styles.
  - Transparent affiliate disclosure informing visitors of zero-cost referral support.
  - "I own this" checklist to deduct owned pieces from remaining budget.
  - One-click CSV export with full itemized breakdown.
- **Smart Layout Suggestions**:
  - Curated, rule-based spatial planning groupings (reading corner, work desk, plant sanctuary, dining nook, media console).
  - Strict wall-boundary clearances to guarantee items are placed within bounds.
  - Clear, honest capability labeling as designer spatial rules.
- **Visitor Guidance & Privacy-Conscious Funnel Analytics**:
  - In-planner 3-step First-Use Guide (Add furniture → 3D preview → Save/Share) with interactive progress tracking.
  - Local-first zero-PII funnel analytics tracking conversion and identifying drop-off points across the onboarding funnel.
- **Design Journal**:
  - Curated architectural interior design articles with rich reader modals and "Add featured pieces to room" action.

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation & Launch
1. Clone or navigate to the project directory:
   ```bash
   cd WEBSITE
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser at:
   ```
   http://localhost:5173/
   ```

### Building for Production
To create an optimized production bundle:
```bash
npm run build
```
The output will be in the `dist/` directory. You can preview it with:
```bash
npm run preview
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
|---|---|
| `Ctrl + Z` | Undo previous action |
| `Ctrl + Y` or `Shift + Ctrl + Z` | Redo undone action |
| `Delete` / `Backspace` | Remove selected furniture piece |
| `R` | Rotate selected piece by 45° |
| `Arrow Keys` | Nudge piece by 5 cm |
| `Shift + Arrow Keys` | Nudge piece by 25 cm |
| `Shift + Drag Rotate` | Snap rotation to 15° steps |
| `Scroll Wheel` | Zoom canvas in & out |
| `Drag Background` | Pan canvas in any direction |
| `Escape` | Deselect active furniture piece |
| `?` | Open keyboard shortcuts modal |

---

© 2026 Roomly Studio. Make room for living.
