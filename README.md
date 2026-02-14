# Oikos Documentation

Official documentation for Oikos - A pluggable LaMAS multi-agent experimentation system.

## Documentation Site

Visit the live documentation at: [https://oikos-docs.vercel.app](https://oikos-docs.vercel.app) (will be available after deployment)

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
Oikos-docs/
├── docs/                          # Documentation source
│   ├── .vitepress/
│   │   └── config.mts            # VitePress configuration
│   ├── index.md                  # Home page
│   ├── 01-getting-started/       # Quick start guides
│   ├── 02-user-guide/            # User documentation
│   ├── 03-architecture/          # System architecture
│   ├── 04-phase-modules/         # Phase 1-7 modules
│   ├── 05-developer-guide/       # Developer guides
│   ├── 06-api-reference/         # API documentation
│   ├── 07-demos-and-tutorials/   # Tutorials
│   ├── 08-research-guide/        # Research methodology
│   └── 09-appendix/              # Appendices
└── package.json
```

## Features

- 🚀 **Fast**: Built with VitePress and Vite
- 🔍 **Searchable**: Built-in local search
- 🌙 **Dark Mode**: Automatic dark/light theme switching
- 📱 **Responsive**: Mobile-friendly design
- 🇨🇳 **Chinese**: Full Chinese language support

## Contributing

Found an issue or want to improve the documentation?

1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
