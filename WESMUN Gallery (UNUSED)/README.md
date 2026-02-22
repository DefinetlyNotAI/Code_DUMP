# WESMUN Photo Gallery

A modern, elegant photo gallery web application built for WESMUN (Wesgreen Model United Nations) to showcase event
photos. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## Features

- **Organized Gallery**: Browse photos organized by different committees and categories
- **Smart Filtering**: Filter images by committee/category with an intuitive filter bar
- **Multi-Select**: Select multiple images at once for batch operations
- **Bulk Download**: Download selected images as a ZIP file
- **Elegant UI**: Clean, modern interface with gold accent theme (#D4AF37)
- **Responsive Design**: Fully responsive layout that works on all devices
- **Optimized Performance**: Server-side rendering with Next.js for fast loading
- **Image Metadata**: Automatic image dimension detection and optimization

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd "WESMUN Gallery"
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Generate the gallery manifest:
    ```bash
    npm run build-manifest
    ```

4. Run the development server:
    ```bash
    npm run dev
    ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
WESMUN Gallery/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   └── download/             # Image download endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main gallery page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── gallery/                  # Gallery-specific components
│   │   ├── gallery-client-wrapper.tsx
│   │   ├── gallery-client.tsx
│   │   ├── gallery-grid.tsx
│   │   ├── gallery-item.tsx
│   │   ├── filter-bar.tsx
│   │   └── download-toolbar.tsx
│   ├── ui/                       # Reusable UI components
│   ├── footer.tsx
│   └── deployement-info.tsx
├── lib/                          # Utility functions
│   ├── gallery.ts                # Gallery data management
│   └── ui.ts                     # UI utilities
├── public/                       # Static assets
│   ├── images/                   # Gallery images (organized by folder)
│   ├── gallery-manifest.json     # Auto-generated image metadata
│   └── wesmun.svg                # WESMUN logo
├── scripts/                      # Build scripts
│   └── generate-gallery-manifest.js
└── package.json
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run build-manifest` - Generate gallery manifest from images

## Adding Images

1. Add your images to the `public/images/` directory, organized by category:
   ```
   public/images/
   ├── eco/
   ├── fsc/
   ├── hcc/
   ├── sochum/
   └── unsc/
   ```

2. Run the manifest generation script:
   ```bash
   npm run build-manifest
   ```

3. The gallery will automatically detect and display new images

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) - React framework with App Router
- **UI Library**: [React 19](https://react.dev/) - Latest React version
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS
- **Components**:
    - [Radix UI](https://www.radix-ui.com/) - Headless UI components
    - [Lucide React](https://lucide.dev/) - Icon library
- **Image Processing**: [image-size](https://www.npmjs.com/package/image-size) - Get image dimensions
- **Archive**: [yazl](https://www.npmjs.com/package/yazl) - ZIP file creation

## Key Features Explained

### Gallery Manifest

The `gallery-manifest.json` file is automatically generated from your images' folder.
It contains metadata about all images including:

- File paths and URLs
- Folder organization
- Image dimensions
- Optimized loading structure

### Download System

Users can:

1. Select multiple images using checkboxes
2. Filter selection by category
3. Download selected images as a ZIP file via the `/api/download` endpoint

### Responsive Design

The gallery adapts to different screen sizes:

- Mobile: Single column layout
- Tablet: 2-3 column grid
- Desktop: 4+ column masonry-style grid

## Configuration

### Tailwind Configuration

Tailwind is configured in `tailwind.config.cjs` with custom plugins and animations.

### Next.js Configuration

Next.js settings can be modified in `next.config.mjs`.

## Contributing

This is a project for WESMUN. If you need to contribute:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For issues or questions, please contact the WESMUN technical team.

---

**Built with ❤️ for WESMUN**
