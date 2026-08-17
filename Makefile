.PHONY: init build test lint typecheck format check pack-check

init: ## Install toolchain (mise) and dependencies
	mise install
	pnpm install

build: ## Build ESM + CJS bundles and type declarations
	pnpm build

test: ## Run tests with coverage
	pnpm test

lint: ## Lint and check formatting
	pnpm lint

typecheck: ## Type-check without emitting
	pnpm typecheck

format: ## Auto-fix lint and formatting issues
	pnpm format

check: typecheck lint test build ## Run every quality gate
	pnpm check:exports

pack-check: ## Show exactly what would be published to npm
	npm pack --dry-run
