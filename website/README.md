# Noah Wallet Website

Modern landing page built with **Next.js 16.2.5**, React 19, and Tailwind CSS.

## Features

- **Next.js 16.2.5** - Latest React framework with app router
- **React 19** - Modern React with latest features
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Full type safety
- **Responsive Design** - Mobile, tablet, and desktop
- **Dark Theme** - Modern dark aesthetic matching Noah Wallet

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd website
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
website/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── Navigation.tsx
│   ├── Hero.tsx
│   ├── Features.tsx
│   ├── GetStarted.tsx
│   ├── Docs.tsx
│   └── Footer.tsx
├── public/                 # Static files
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## Sections

1. **Navigation** - Sticky header with navigation links
2. **Hero** - Main headline with CTA buttons
3. **Features** - 6 key features grid
4. **Get Started** - Download buttons
5. **Documentation** - Docs and support links
6. **Footer** - Footer with links and copyright

## Deployment

Deploy to Vercel (recommended):

```bash
npm install -g vercel
vercel
```

Or deploy to other platforms (Netlify, etc.) by building and uploading the `.next` folder.

## Technologies

- **Next.js 16.2.5** - Full-stack React framework
- **React 19** - UI library
- **Tailwind CSS 3.3.5** - Styling
- **TypeScript 5.3** - Type safety
- **PostCSS** - CSS processing

## License

MIT
