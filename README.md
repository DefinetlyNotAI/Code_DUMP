## Dynamic Fandom/Wiki System

A flexible, developer-friendly wiki system for games and media content. Create rich, interconnected wiki pages using a simple folder structure and TypeScript/JSON definitions.

> [!IMPORTANT]
> The example provided is bare-bones, and not even complete, this is a template and so the example is just the minimum for you to see how it actually works

### 📁 Getting Started

1. Clone this repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### 📚 Creating Wiki Pages

Pages are organized in category folders under `src/pages/`, example:

```
src/pages/
  ├── characters/
  │   ├── home.tsx
  │   └── hero.tsx
  ├── items/
  │   ├── home.tsx
  │   └── sword.tsx
  └── locations/
      ├── home.tsx
      └── castle.tsx
```

Each category needs a `home.tsx` that serves as its landing page. Additional `.tsx` files in each folder are automatically registered as entries.

You can add any folder you wish and it will auto-register!

### 🌟 Rarity System

Content is classified using a 5-star rating system:

- ⭐⭐⭐⭐⭐ Legendary (Gold)
- ⭐⭐⭐⭐ Epic (Purple)
- ⭐⭐⭐ Rare (Blue)
- ⭐⭐ Uncommon (Green)
- ⭐ Common (Gray)

The rarity affects the display colour of content titles and influences their prominence in listings.

### 📈 Level Progression Systems

#### Character Ascension
Characters can ascend through different level tiers (20, 40, 60, 80, 100), each requiring:
- Experience points
- Gold
- Specific items
- Unlocks new abilities
- Improves stats

#### Enemy Difficulty
Enemies have different difficulty tiers with:
- Scaled stats
- Improved abilities
- Better drop rates
- Unique rewards

### 📄 Page Schemas

More info about schemas can be found [here](src\pages\SCHEMA_GUIDE.md)

### 🔧 Type System

The wiki uses TypeScript interfaces to ensure consistency and provide autocompletion. See `src/types/WikiTypes.ts` for the complete type definitions.

### 🎨 Styling

The system uses Tailwind CSS for styling. Each component is responsive and optimized for readability.

### 🔄 Auto-Registration

New pages are automatically registered when added to the appropriate category folder. No manual routing or configuration is required.

### 🔍 Search & Navigation

The system includes built-in search functionality and automatic navigation generation based on the folder structure.
