# GK Card Maker

A specialized, mobile-first web application for generating high-resolution General Knowledge (GK) question cards in the exact visual style of reference television and educational quiz formats.

## 🎯 Design Source of Truth

The card follows a fixed 16:9 aspect ratio rendered at 1920×1080:
- **Outer Frame**: Dark canvas border with a bold, rounded green outer border (`#16a34a`).
- **Inner Separation**: Clean spacing band separating the border from the pristine white card surface.
- **Top Question Box**: Rounded rectangular header with lime-to-yellow gradient background (`#84cc16` to `#facc15`) and a solid black border.
- **Devanagari Typography**:
  - Question number highlighted in bold **Red** (`#dc2626`).
  - Question text rendered in an authentic 4-color gradient (Red → Magenta → Purple → Blue) using **Noto Sans Devanagari**.
  - Intelligent auto-fitting engine prevents character or matra clipping.
- **Four Vertical Options (A, B, C, D)**:
  - Yellow background cards (`#fef08a`) with orange/red borders (`#ea580c`) and bold black lettering.
- **Right Visual Subject**:
  - Dedicated transparent clipart/illustration zone (Tiger, Blue Jeans, Human Skeleton, Drinking Water, etc.) that never overlaps options.
- **Correct Answer**:
  - Stored locally for quiz tracking, but strictly omitted from generated PNG cards.

---

## 🚀 Key Features

1. **Live Preview & Client-Side PNG Export**
   - Instant live preview in 16:9 ratio.
   - 1-click download as `GK-Question-04.png` at 1920×1080 (or 1280×720).
   - Direct "Copy Image" to clipboard.

2. **Hindi & English Typography Auto-Fit**
   - Native support for Hindi, English, and Hinglish.
   - Dynamic scale-down engine prevents long questions or options from overflowing.

3. **Curated Transparent Clipart & AI Image Generator**
   - Built-in library of transparent SVG assets.
   - Automatic topic extraction with prompt generator for transparent educational cutouts.
   - Custom image drag-and-drop & file upload support (PNG, JPG, WEBP).

4. **Batch Card Generator & ZIP Export**
   - Paste multiline text questions in standard numbering format.
   - Generates all cards with progress indication.
   - 1-click batch download as `GK-Cards.zip` using JSZip.

5. **Local Persistence & Backup**
   - Works 100% offline without login.
   - JSON export and import for seamless backup and dataset transfer.

---

## 🛠️ Development & Build

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Compile production build
npm run build
```

## ⚙️ Environment Variables

Optionally set `GEMINI_API_KEY` for AI question generation and Gemini visual generation:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(If no API key is provided, the application runs fully offline with its rich curated question bank and transparent clipart assets.)*
