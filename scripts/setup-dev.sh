#!/bin/bash
# Development Environment Setup Script for SyncCode
# This script automates the complete development environment setup

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_deps=()

    # Check required commands
    local required_commands=("node" "npm" "yarn" "docker" "docker-compose" "git")

    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            missing_deps+=("$cmd")
        fi
    done

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and run this script again."
        log_info "Installation guides:"
        log_info "  Node.js: https://nodejs.org/"
        log_info "  Yarn: https://yarnpkg.com/"
        log_info "  Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    # Check Node.js version
    local node_version=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$node_version" -lt 18 ]; then
        log_error "Node.js version 18+ is required (current: $(node -v))"
        exit 1
    fi

    # Check Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi

    log_success "All prerequisites satisfied"
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment files..."

    cd "$PROJECT_ROOT"

    # Create tools/.env if it doesn't exist
    if [ ! -f "tools/.env" ]; then
        cat > tools/.env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://synccode_user:synccode_dev_password@localhost:5433/synccode_dev
POSTGRES_USER=synccode_user
POSTGRES_PASSWORD=synccode_dev_password
POSTGRES_DB=synccode_dev

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=dev_secret_key_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_key_change_in_production

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3002
EOF
        log_success "Created tools/.env"
    else
        log_warning "tools/.env already exists, skipping"
    fi

    # Create .env.local for client if needed
    if [ ! -f "packages/client/.env.local" ]; then
        cat > packages/client/.env.local << 'EOF'
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000
EOF
        log_success "Created packages/client/.env.local"
    fi

    log_success "Environment files configured"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."

    cd "$PROJECT_ROOT"

    # Install workspace dependencies
    yarn install --frozen-lockfile || yarn install

    log_success "Dependencies installed"
}

# Start infrastructure services
start_infrastructure() {
    log_info "Starting infrastructure services (PostgreSQL, Redis, Prometheus, Grafana)..."

    cd "$PROJECT_ROOT/tools"

    # Stop any existing containers
    docker-compose down 2>/dev/null || true

    # Start services
    docker-compose up -d

    log_info "Waiting for services to be ready..."

    # Wait for PostgreSQL
    local max_attempts=30
    local attempt=0
    while ! docker exec collab-editor-postgres pg_isready -U synccode_user -d synccode_dev >/dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            log_error "PostgreSQL failed to start within ${max_attempts} seconds"
            exit 1
        fi
        sleep 1
    done
    log_success "PostgreSQL is ready"

    # Wait for Redis
    attempt=0
    while ! docker exec collab-editor-redis redis-cli ping >/dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            log_error "Redis failed to start within ${max_attempts} seconds"
            exit 1
        fi
        sleep 1
    done
    log_success "Redis is ready"

    log_success "All infrastructure services are running"
}

# Setup database
setup_database() {
    log_info "Setting up database..."

    cd "$PROJECT_ROOT/packages/server"

    # Load environment
    set -a
    source "$PROJECT_ROOT/tools/.env"
    set +a

    # Generate Prisma Client
    log_info "Generating Prisma Client..."
    npx prisma generate

    # Run migrations
    log_info "Running database migrations..."
    npx prisma migrate dev --name init || npx prisma migrate deploy

    # Verify database
    log_info "Verifying database schema..."
    npx prisma validate

    log_success "Database setup complete"
}

# Build packages
build_packages() {
    log_info "Building packages..."

    cd "$PROJECT_ROOT"

    # Build shared package first
    log_info "Building @collab/shared..."
    yarn workspace @collab/shared run build

    log_success "All packages built successfully"
}

# Setup git hooks (optional)
setup_git_hooks() {
    log_info "Setting up git hooks..."

    cd "$PROJECT_ROOT"

    # Check if .git directory exists
    if [ ! -d ".git" ]; then
        log_warning "Not a git repository, skipping git hooks setup"
        return
    fi

    # Create pre-commit hook for type checking
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for type checking

echo "Running type checks..."

# Type check server
cd packages/server
npx tsc --noEmit || exit 1

# Type check client
cd ../client
npx tsc --noEmit || exit 1

echo "Type checks passed"
exit 0
EOF

    chmod +x .git/hooks/pre-commit
    log_success "Git hooks configured"
}

# Print success message and next steps
print_success_message() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}║  ✓ Development environment setup complete!            ║${NC}"
    echo -e "${GREEN}║                                                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    log_info "Next steps:"
    echo ""
    echo "  1. Start the development servers:"
    echo "     ${BLUE}yarn dev${NC}"
    echo ""
    echo "  2. Open your browser:"
    echo "     Client:     ${BLUE}http://localhost:3000${NC}"
    echo "     API:        ${BLUE}http://localhost:5000${NC}"
    echo "     Prometheus: ${BLUE}http://localhost:9090${NC}"
    echo "     Grafana:    ${BLUE}http://localhost:3002${NC} (admin/admin)"
    echo ""
    echo "  3. Access Prisma Studio (database GUI):"
    echo "     ${BLUE}cd packages/server && npx prisma studio${NC}"
    echo ""
    echo "  4. View logs:"
    echo "     ${BLUE}docker logs -f collab-editor-postgres${NC}"
    echo "     ${BLUE}docker logs -f collab-editor-redis${NC}"
    echo ""
    log_info "For more information, check CLAUDE.md"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                        ║${NC}"
    echo -e "${BLUE}║        SyncCode Development Environment Setup          ║${NC}"
    echo -e "${BLUE}║                                                        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""

    check_prerequisites
    setup_environment
    install_dependencies
    start_infrastructure
    setup_database
    build_packages
    setup_git_hooks
    print_success_message
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Setup failed. Cleaning up..."
        cd "$PROJECT_ROOT/tools"
        docker-compose down 2>/dev/null || true
    fi
}

trap cleanup EXIT

# Run main function
main
