# Expert Registry Admin UI

**Last Updated: 2025-07-01**

## Overview

React-based administrative interface for the Expert Registry MCP system, built with Mantine UI framework.

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Running Expert Registry MCP server

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The admin UI will be available at http://localhost:3000

### Configuration

Create a `.env` file for environment-specific settings:

```env
# API endpoint (optional, defaults to /api/admin)
VITE_API_URL=http://localhost:8000/api/admin
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

### Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── services/      # API services
├── store/         # State management
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## Features

### Implemented
- ✅ Dashboard with system statistics
- ✅ Expert management (CRUD operations)
- ✅ Real-time updates via SSE
- ✅ Responsive design
- ✅ Dark mode support

### In Progress
- 🚧 Context editor
- 🚧 Analytics dashboard
- 🚧 Performance monitoring
- 🚧 Discovery testing interface
- 🚧 System logs viewer
- 🚧 Settings page

## API Integration

The admin UI communicates with the FastAPI backend through:

- REST API endpoints at `/api/admin/*`
- Server-Sent Events for real-time updates
- JWT authentication (to be implemented)

## Building for Production

```bash
# Build the admin UI
npm run build

# The built files will be in the dist/ directory
```

## Docker Integration

The admin UI is built as part of the main Docker image:

```dockerfile
# In the main Dockerfile
FROM node:20-alpine as admin-builder
WORKDIR /app/admin-ui
COPY admin-ui/package*.json ./
RUN npm ci
COPY admin-ui/ ./
RUN npm run build

# Copy to production stage
COPY --from=admin-builder /app/admin-ui/dist /app/static/admin
```

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Submit PR with clear description

## License

Part of the Expert Registry MCP project