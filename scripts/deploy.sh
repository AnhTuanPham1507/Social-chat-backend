#!/bin/bash

# Social Chat Backend Deployment Script
# This script handles the complete deployment process including environment setup,
# database migrations, and application deployment with health checks

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEFAULT_ENVIRONMENT="staging"
DEFAULT_TIMEOUT=300
DEFAULT_HEALTH_CHECK_RETRIES=10
DEFAULT_HEALTH_CHECK_INTERVAL=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Help function
show_help() {
    cat << EOF
Social Chat Backend Deployment Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENVIRONMENT    Deployment environment (staging/production) [default: staging]
    -i, --image IMAGE_TAG           Docker image tag to deploy [required]
    -t, --timeout SECONDS           Deployment timeout in seconds [default: 300]
    -r, --retries NUMBER            Health check retries [default: 10]
    -s, --skip-migrations           Skip database migrations
    -f, --force                     Force deployment without confirmations
    -h, --help                      Show this help message

Environment Variables:
    DOCKER_REGISTRY                 Docker registry URL
    DATABASE_URL                    Database connection string
    HEALTH_CHECK_URL               Health check endpoint URL

Examples:
    $0 -e staging -i latest
    $0 -e production -i v1.2.3 -f
    $0 --environment staging --image sha-abc123 --timeout 600

EOF
}

# Parse command line arguments
parse_arguments() {
    ENVIRONMENT="$DEFAULT_ENVIRONMENT"
    IMAGE_TAG=""
    TIMEOUT="$DEFAULT_TIMEOUT"
    HEALTH_CHECK_RETRIES="$DEFAULT_HEALTH_CHECK_RETRIES"
    SKIP_MIGRATIONS=false
    FORCE_DEPLOYMENT=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -i|--image)
                IMAGE_TAG="$2"
                shift 2
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -r|--retries)
                HEALTH_CHECK_RETRIES="$2"
                shift 2
                ;;
            -s|--skip-migrations)
                SKIP_MIGRATIONS=true
                shift
                ;;
            -f|--force)
                FORCE_DEPLOYMENT=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Validate required arguments
    if [[ -z "$IMAGE_TAG" ]]; then
        log_error "Image tag is required. Use -i or --image option."
        show_help
        exit 1
    fi

    # Validate environment
    if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'."
        exit 1
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Performing pre-deployment checks..."

    # Check if required environment variables are set
    local required_vars=("DOCKER_REGISTRY")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done

    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose is not installed or not in PATH"
        exit 1
    fi

    # Verify Docker image exists
    local full_image="${DOCKER_REGISTRY}/social-chat-backend:${IMAGE_TAG}"
    log_info "Checking if Docker image exists: $full_image"
    
    if ! docker pull "$full_image"; then
        log_error "Failed to pull Docker image: $full_image"
        exit 1
    fi

    log_success "Pre-deployment checks passed"
}

# Database migration
run_database_migrations() {
    if [[ "$SKIP_MIGRATIONS" == true ]]; then
        log_warning "Skipping database migrations as requested"
        return 0
    fi

    log_info "Running database migrations..."
    
    # Note: This would need to be adapted based on your actual migration strategy
    # For TypeORM with synchronize: true, this might not be necessary
    # But for production, you'd want explicit migrations
    
    local migration_container="social-chat-migration-$(date +%s)"
    local full_image="${DOCKER_REGISTRY}/social-chat-backend:${IMAGE_TAG}"
    
    # Run migration in a temporary container
    if docker run --rm \
        --name "$migration_container" \
        --network "social-chat-${ENVIRONMENT}_my-network" \
        -e DATABASE_URL="${DATABASE_URL:-}" \
        "$full_image" \
        yarn typeorm migration:run; then
        log_success "Database migrations completed successfully"
    else
        log_error "Database migrations failed"
        return 1
    fi
}

# Deploy application
deploy_application() {
    log_info "Deploying application to $ENVIRONMENT environment..."
    
    local compose_file="docker-compose.${ENVIRONMENT}.yml"
    local full_image="${DOCKER_REGISTRY}/social-chat-backend:${IMAGE_TAG}"
    
    # Check if compose file exists
    if [[ ! -f "$PROJECT_ROOT/$compose_file" ]]; then
        log_error "Compose file not found: $compose_file"
        exit 1
    fi
    
    # Set environment variables for docker-compose
    export IMAGE_TAG="$IMAGE_TAG"
    export DOCKER_REGISTRY="$DOCKER_REGISTRY"
    export ENVIRONMENT="$ENVIRONMENT"
    
    # Deploy using docker-compose
    cd "$PROJECT_ROOT"
    
    if docker-compose -f "$compose_file" up -d --force-recreate; then
        log_success "Application deployed successfully"
    else
        log_error "Application deployment failed"
        return 1
    fi
}

# Health check
perform_health_check() {
    log_info "Performing health checks..."
    
    local health_check_url="${HEALTH_CHECK_URL:-http://localhost:3000/health}"
    local retries="$HEALTH_CHECK_RETRIES"
    local interval="$DEFAULT_HEALTH_CHECK_INTERVAL"
    
    log_info "Health check URL: $health_check_url"
    log_info "Retries: $retries, Interval: ${interval}s"
    
    for ((i=1; i<=retries; i++)); do
        log_info "Health check attempt $i/$retries..."
        
        if curl -sf "$health_check_url" > /dev/null; then
            log_success "Health check passed!"
            return 0
        fi
        
        if [[ $i -lt $retries ]]; then
            log_warning "Health check failed, retrying in ${interval}s..."
            sleep "$interval"
        fi
    done
    
    log_error "Health check failed after $retries attempts"
    return 1
}

# Rollback function
rollback_deployment() {
    log_warning "Initiating rollback..."
    
    local compose_file="docker-compose.${ENVIRONMENT}.yml"
    
    # Stop current deployment
    cd "$PROJECT_ROOT"
    docker-compose -f "$compose_file" down
    
    # Here you would restore the previous version
    # This is a simplified version - in practice, you'd want to:
    # 1. Keep track of previous deployment versions
    # 2. Have a proper rollback mechanism
    log_error "Rollback completed. Please manually restore previous version."
}

# Confirmation prompt
confirm_deployment() {
    if [[ "$FORCE_DEPLOYMENT" == true ]]; then
        return 0
    fi
    
    log_warning "You are about to deploy to $ENVIRONMENT environment with image tag: $IMAGE_TAG"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    log_info "Starting deployment process..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Image Tag: $IMAGE_TAG"
    log_info "Timestamp: $(date -Iseconds)"
    
    # Parse arguments
    parse_arguments "$@"
    
    # Confirm deployment
    confirm_deployment
    
    # Execute deployment steps
    if pre_deployment_checks && \
       run_database_migrations && \
       deploy_application && \
       perform_health_check; then
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "🎉 Deployment completed successfully!"
        log_success "Total deployment time: ${duration}s"
        log_success "Environment: $ENVIRONMENT"
        log_success "Image: ${DOCKER_REGISTRY}/social-chat-backend:${IMAGE_TAG}"
        
    else
        log_error "Deployment failed!"
        log_warning "Attempting rollback..."
        rollback_deployment
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Deployment interrupted by user"; exit 130' INT TERM

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 