.PHONY: help install dev dev-server dev-client build build-server build-client start clean clean-build type-check watch-type-check lint test setup reset kill-ports stop check-deps dev-check prod format

# Default target
help:
	@echo "IFixAI - AI Chat Application"
	@echo ""
	@echo "Available commands:"
	@echo "  make install        - Install dependencies"
	@echo "  make dev            - Start development server (frontend + backend)"
	@echo "  make dev-server     - Start backend server only"
	@echo "  make dev-client     - Start frontend dev server only"
	@echo "  make build          - Build for production"
	@echo "  make build-server   - Build backend only"
	@echo "  make build-client   - Build frontend only"
	@echo "  make start          - Start production server"
	@echo "  make clean           - Clean build artifacts and dependencies"
	@echo "  make clean-build     - Clean only build artifacts (keep node_modules)"
	@echo "  make type-check      - Run TypeScript type checking"
	@echo "  make watch-type-check - Watch mode for type checking"
	@echo "  make setup           - Initial setup (install deps and create data dir)"
	@echo "  make reset           - Reset database (delete data directory)"
	@echo "  make kill-ports      - Kill processes on ports 3000 and 4000"
	@echo "  make stop            - Stop all development servers"
	@echo "  make lint            - Lint code"
	@echo "  make format          - Format code (requires prettier)"
	@echo "  make test            - Run tests"
	@echo "  make check-deps      - Check if dependencies are installed"
	@echo "  make dev-check       - Check deps then start dev"
	@echo "  make prod            - Build then start production server"
	@echo "  make help            - Show this help message"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install

# Development commands
dev: check-deps kill-ports
	@echo "🚀 Starting development servers..."
	npm run dev

dev-server:
	@echo "🔧 Starting backend server..."
	npm run dev:server

dev-client:
	@echo "🎨 Starting frontend dev server..."
	npm run dev:client

# Build commands
build:
	@echo "🔨 Building for production..."
	npm run build

build-server:
	@echo "🔨 Building backend..."
	npm run build:server

build-client:
	@echo "🔨 Building frontend..."
	npm run build:client

# Start production server
start:
	@echo "▶️  Starting production server..."
	npm start

# Type checking
type-check:
	@echo "🔍 Running TypeScript type check..."
	npm run type-check

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist
	rm -rf build
	rm -rf node_modules
	@echo "✅ Clean complete"

# Clean only build artifacts (keep node_modules)
clean-build:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist
	rm -rf build
	@echo "✅ Build artifacts cleaned"

# Setup project (install deps and create data dir)
setup: install
	@echo "📁 Creating data directory..."
	@mkdir -p data
	@echo "✅ Setup complete!"

# Reset database
reset:
	@echo "🗑️  Resetting database..."
	@rm -rf data/*.db data/*.db-shm data/*.db-wal
	@echo "✅ Database reset complete"

# Kill processes on ports 3000 and 4000
kill-ports:
	@echo "🛑 Killing processes on ports 3000 and 4000..."
	@-lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@-lsof -ti:4000 | xargs kill -9 2>/dev/null || true
	@echo "✅ Ports cleared"

# Stop all development servers
stop:
	@echo "🛑 Stopping all development servers..."
	@pkill -f "tsx watch.*server/index" || true
	@pkill -f "concurrently.*dev" || true
	@pkill -f "vite" || true
	@-lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@-lsof -ti:4000 | xargs kill -9 2>/dev/null || true
	@echo "✅ All servers stopped"

# Watch mode for type checking
watch-type-check:
	@echo "👀 Watching for type errors..."
	npm run type-check -- --watch

# Format code (if you add prettier)
format:
	@echo "✨ Formatting code..."
	@if command -v prettier > /dev/null; then \
		prettier --write "src/**/*.{ts,tsx,js,jsx,json,css}"; \
	else \
		echo "⚠️  Prettier not found. Install it with: npm install -D prettier"; \
	fi

# Lint code
lint:
	@echo "🔍 Linting code..."
	@if [ -f "node_modules/.bin/eslint" ]; then \
		npx eslint src --ext .ts,.tsx; \
	else \
		echo "⚠️  ESLint not configured"; \
	fi

# Run tests (if you add tests)
test:
	@echo "🧪 Running tests..."
	@if [ -f "package.json" ] && grep -q '"test"' package.json; then \
		npm test; \
	else \
		echo "⚠️  No tests configured"; \
	fi

# Check if dependencies are installed
check-deps:
	@echo "🔍 Checking dependencies..."
	@if [ ! -d "node_modules" ]; then \
		echo "❌ Dependencies not installed. Run 'make install' first."; \
		exit 1; \
	else \
		echo "✅ Dependencies installed"; \
	fi

# Development workflow: check deps, then start dev
dev-check: check-deps dev

# Production workflow: build then start
prod: build start

