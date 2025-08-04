#!/bin/bash
# =================================================================
# KUBERNETES CLEANUP SCRIPT FOR SOCIAL CHAT BACKEND
# =================================================================
# This script removes all Kubernetes resources created for the
# Social Chat Backend application.
# =================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="social-chat"
K8S_DIR="$(dirname "$0")"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
}

# Function to delete Kubernetes resources
delete_resources() {
    print_status "Deleting Kubernetes resources..."
    
    # Delete in reverse order of dependencies
    local manifests=(
        "09-ingress.yaml"
        "08-backend.yaml"
        "07-minio.yaml"
        "06-kafka.yaml"
        "05-redis.yaml"
        "04-postgres.yaml"
        "03-persistent-volumes.yaml"
        "02-secrets.yaml"
        "01-configmap.yaml"
        "00-namespace.yaml"
    )
    
    for manifest in "${manifests[@]}"; do
        if [ -f "$K8S_DIR/$manifest" ]; then
            print_status "Deleting resources from $manifest..."
            kubectl delete -f "$K8S_DIR/$manifest" --ignore-not-found=true
        else
            print_warning "Manifest $manifest not found, skipping..."
        fi
    done
    
    print_success "Kubernetes resources deleted"
}

# Function to delete PersistentVolumes (they might not be deleted automatically)
delete_persistent_volumes() {
    print_status "Deleting PersistentVolumes..."
    
    local pvs=("postgres-pv" "redis-pv" "kafka-pv" "minio-pv")
    
    for pv in "${pvs[@]}"; do
        if kubectl get pv "$pv" &> /dev/null; then
            print_status "Deleting PersistentVolume: $pv"
            kubectl delete pv "$pv" --ignore-not-found=true
        fi
    done
    
    print_success "PersistentVolumes deleted"
}

# Function to clean up storage directories
cleanup_storage_dirs() {
    print_status "Cleaning up storage directories..."
    
    if [ -d "/tmp/k8s-data" ]; then
        print_warning "Removing storage data at /tmp/k8s-data"
        print_warning "This will delete all persisted data!"
        
        read -p "Are you sure you want to delete all data? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo rm -rf /tmp/k8s-data
            print_success "Storage directories cleaned up"
        else
            print_status "Storage directories preserved"
        fi
    else
        print_status "No storage directories found to clean up"
    fi
}

# Function to remove Docker image
remove_docker_image() {
    local image="social-chat-backend:latest"
    
    if docker images --format "table {{.Repository}}:{{.Tag}}" | grep -q "$image"; then
        print_status "Removing Docker image: $image"
        
        read -p "Remove Docker image? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker rmi "$image" --force
            print_success "Docker image removed"
        else
            print_status "Docker image preserved"
        fi
    else
        print_status "Docker image not found"
    fi
}

# Function to show cleanup status
show_cleanup_status() {
    print_status "Cleanup Status:"
    echo
    
    print_status "Checking for remaining resources..."
    
    # Check namespace
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        print_warning "Namespace $NAMESPACE still exists"
        kubectl get all -n $NAMESPACE 2>/dev/null || true
    else
        print_success "Namespace $NAMESPACE has been deleted"
    fi
    
    # Check PersistentVolumes
    local remaining_pvs=$(kubectl get pv --no-headers 2>/dev/null | grep -E "(postgres|redis|kafka|minio)-pv" | wc -l)
    if [ "$remaining_pvs" -gt 0 ]; then
        print_warning "Some PersistentVolumes still exist:"
        kubectl get pv | grep -E "(postgres|redis|kafka|minio)-pv" || true
    else
        print_success "All PersistentVolumes have been deleted"
    fi
    
    echo
}

# Main cleanup function
main() {
    print_warning "==================================================================="
    print_warning "        SOCIAL CHAT BACKEND - KUBERNETES CLEANUP"
    print_warning "==================================================================="
    echo
    
    print_warning "This will delete all Kubernetes resources for Social Chat Backend"
    print_warning "including databases, file storage, and application data."
    echo
    
    read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleanup cancelled"
        exit 0
    fi
    
    # Pre-cleanup checks
    check_kubectl
    
    # Perform cleanup
    delete_resources
    delete_persistent_volumes
    
    # Optional cleanup
    cleanup_storage_dirs
    remove_docker_image
    
    # Show results
    show_cleanup_status
    
    print_success "==================================================================="
    print_success "                    CLEANUP COMPLETE!"
    print_success "==================================================================="
    echo
    
    print_status "To redeploy the application, run: ./deploy.sh"
}

# Handle script arguments
case "${1:-}" in
    "resources")
        delete_resources
        ;;
    "volumes")
        delete_persistent_volumes
        ;;
    "storage")
        cleanup_storage_dirs
        ;;
    "image")
        remove_docker_image
        ;;
    "status")
        show_cleanup_status
        ;;
    *)
        main
        ;;
esac 