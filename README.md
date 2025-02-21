# Scrapyard Showcase

A modern, responsive project showcase website built with React, 
TypeScript, and Tailwind CSS. 
Features beautiful animations, dark mode support, and a ranking system for projects.
(My first React Project!!)

## Features

- 🎨 Modern, responsive design
- 🌓 Automatic dark mode support
- ✨ Smooth animations and transitions
- 📱 Mobile-friendly layout
- 🏆 Project ranking system with tooltips
- 🔍 Lazy loading for better performance
- 🎯 SEO-friendly structure

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/project-showcase.git
   cd project-showcase
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173`

## Project Structure

```
project-showcase/
├── src/
│   ├── components/        # React components
│   ├── data/             # Project data
│   ├── types/            # TypeScript types
│   ├── App.tsx           # Main application component
│   └── main.tsx         # Application entry point
├── public/              # Static assets
└── package.json        # Project dependencies
```

## Adding Projects

Projects are stored in `src/data/projects.json`. Each project should follow this structure:

```json
{
  "id": "unique-id",
  "name": "Project Name",
  "description": "Project description",
  "imageUrl": "https://example.com/image.jpg",
  "tags": ["React", "TypeScript"],
  "rank": "🥇",
  "githubUrl": "https://github.com/...",
  "demoUrl": "https://demo.example.com"
}
```

> [!NOTE]
> Last 3 options are optional,
> 
> For ranks 🥇, 🥈, 🥉, or 🎖️ are the valid ones, 
> and stand for `First`, `Second`, `Third`, `Honorable Mention`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Customization

- Modify `tailwind.config.js` to customize the theme
- Update `src/index.css` for global styles
- Edit components in `src/components/` for layout changes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
