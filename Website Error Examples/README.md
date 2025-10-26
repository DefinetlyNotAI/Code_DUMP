# 🌐 Vite + React Error Page System

A **production-ready**, **responsive**, and **elegant error page system** built with **Vite**, **React**, and **TypeScript**. Designed to handle various HTTP error codes with style and clarity, this system ensures users stay informed and engaged even when things go wrong.

---

## 🚀 Core Features

- ✅ Prebuilt pages for common HTTP errors:
  - 404 (Not Found)
  - 403 (Forbidden)
  - 401 (Unauthorized)
  - 500 (Internal Server Error)
  - 502 (Bad Gateway)
  - ...and more
- 🎯 Interactive navigation to preview each error page
- 🖼️ Custom illustrations and animations tailored to each error type
- 📚 Descriptive error messages with friendly, actionable guidance
- 🔁 "Back to Home" buttons for smoother recovery
- 🔍 Filter/search to quickly jump to any error code
- 📱 Fully responsive for mobile, tablet, and desktop

---

## 🎨 Design System

- 🧼 **Minimalist Aesthetic** – Clean lines, ample whitespace, and simple iconography
- 📦 **8px Grid System** – Consistent rhythm across layouts
- 🌈 **Color Palette** – Soft blue primary, orange accents, and modern neutral tones
- 🖋️ **Typography** – Sans-serif font with 3 weights, accessible sizing, and hierarchy
- 🌀 **Illustrations** – Custom abstract, geometric representations of each error
- ✨ **Subtle Animations** – Smooth page transitions and feedback effects
- 🪞 **Shadows & Rounding** – Elegant touches for a polished UI

---

## 🛠️ Tech Stack

- **Vite** – Lightning-fast build & dev tooling
- **React** – Declarative, component-driven UI
- **TypeScript** – Strong typing for scalability and safety
- **ESLint (Flat Config)** – Linting with `@typescript-eslint`, `react-hooks`, and `react-refresh`
- **CSS Modules / Tailwind / SCSS** (customizable) – Clean styling with theme support

---

## 📦 Getting Started

```bash
git clone https://github.com/DefinetlyNotAI/Website_Error_Examples
cd Website_Error_Examples
npm install
npm run dev
````

---

## 🧪 Scripts

| Command           | Description                |
| ----------------- | -------------------------- |
| `npm run dev`     | Start Vite dev server      |
| `npm run build`   | Build for production       |
| `npm run preview` | Preview built site locally |
| `npm run lint`    | Run ESLint (Flat Config)   |

---

## 💡 Customization

* Easily add new error codes: just create a new component under `src/pages/errors/` as well as the animation in `src/components/Illustrations`
* Swap out illustrations with your own assets or animated SVGs
* Use Tailwind, SCSS, or CSS Modules based on your stack preference
* Extend ESLint config via `eslint.config.js` using flat config structure

---

## 📄 License

MIT — Free to use and adapt for personal or commercial projects.

---
