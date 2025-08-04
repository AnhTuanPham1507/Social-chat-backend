#!/bin/bash
# =================================================================
# KUBERNETES DEPLOYMENT SCRIPT FOR SOCIAL CHAT BACKEND (NO SUDO)
# =================================================================
# This is a modified version of the original script with sudo
# commands disabled for Windows compatibility.
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
DOCKER_IMAGE="social-chat-backend:latest"
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
        print_error "Please install kubectl: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    
    print_status "kubectl found: $(kubectl version --client --short 2>/dev/null || echo 'Version check failed')"
}

# Function to check if cluster is accessible
check_cluster() {
    print_status "Checking cluster connectivity..."
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        print_error "Please ensure your cluster is running and kubectl is configured"
        print_error "For minikube: minikube start"
        print_error "For kind: kind create cluster"
        print_error "For Docker Desktop: Enable Kubernetes in Docker Desktop settings"
        exit 1
    fi
    
    print_success "Connected to cluster: $(kubectl config current-context)"
}

# Function to build Docker image
build_docker_image() {
    print_status "Building Docker image..."
    
    if [ ! -f "../Dockerfile" ]; then
        print_error "Dockerfile not found in parent directory"
        print_error "Please ensure you're running this script from the k8s directory"
        exit 1
    fi
    
    cd ..
    docker build -t $DOCKER_IMAGE .
    cd k8s
    
    print_success "Docker image built: $DOCKER_IMAGE"
}

# Function to load image into cluster (for kind/minikube)
load_image_to_cluster() {
    CLUSTER_TYPE=$(kubectl config current-context)
    
    if [[ $CLUSTER_TYPE == *"kind"* ]]; then
        print_status "Loading image into kind cluster..."
        kind load docker-image $DOCKER_IMAGE
        print_success "Image loaded into kind cluster"
    elif [[ $CLUSTER_TYPE == *"minikube"* ]]; then
        print_status "Loading image into minikube..."
        minikube image load $DOCKER_IMAGE
        print_success "Image loaded into minikube"
    else
        print_warning "Cluster type not recognized, skipping image load"
        print_warning "For cloud clusters, push image to a registry"
    fi
}

# Function to create storage directories (DISABLED FOR WINDOWS)
create_storage_dirs() {
    print_status "Skipping storage directory creation (Windows compatibility)..."
    
    # ORIGINAL CODE (COMMENTED OUT):
    # sudo mkdir -p /tmp/k8s-data/{postgres,redis,kafka,minio}
    # sudo chmod 777 /tmp/k8s-data/{postgres,redis,kafka,minio}
    
    print_warning "Storage directory creation disabled to avoid sudo requirement"
    print_warning "Kubernetes will create necessary directories automatically"
    print_warning "If you encounter storage issues, manually create directories or use Docker Desktop"
    
    print_success "Storage setup completed (automatic mode)"
}

# Function to apply Kubernetes manifests
apply_manifests() {
    print_status "Applying Kubernetes manifests..."
    
    # Apply in order of dependencies
    local manifests=(
        "00-namespace.yaml"
        "01-configmap.yaml"
        "02-secrets.yaml"
        "03-persistent-volumes.yaml"
        "04-postgres.yaml"
        "05-redis.yaml"
        "06-kafka.yaml"
        "07-minio.yaml"
        "08-backend.yaml"
        "09-ingress.yaml"
    )
    
    for manifest in "${manifests[@]}"; do
        if [ -f "$K8S_DIR/$manifest" ]; then
            print_status "Applying $manifest..."
            kubectl apply -f "$K8S_DIR/$manifest"
        else
            print_warning "Manifest $manifest not found, skipping..."
        fi
    done
    
    print_success "All manifests applied"
}

# Function to wait for deployments
wait_for_deployments() {
    print_status "Waiting for deployments to be ready..."
    
    local deployments=("postgres" "redis" "kafka" "minio" "backend")
    
    for deployment in "${deployments[@]}"; do
        print_status "Waiting for $deployment deployment..."
        kubectl wait --for=condition=available --timeout=300s deployment/$deployment -n $NAMESPACE
        print_success "$deployment deployment is ready"
    done
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    echo
    
    print_status "Namespace:"
    kubectl get namespace $NAMESPACE
    echo
    
    print_status "Pods:"
    kubectl get pods -n $NAMESPACE -o wide
    echo
    
    print_status "Services:"
    kubectl get services -n $NAMESPACE
    echo
    
    print_status "PersistentVolumes:"
    kubectl get pv
    echo
    
    print_status "PersistentVolumeClaims:"
    kubectl get pvc -n $NAMESPACE
    echo
    
    print_status "Ingress (if available):"
    kubectl get ingress -n $NAMESPACE 2>/dev/null || echo "No ingress found"
    echo
}

# Function to show access information
show_access_info() {
    print_success "==================================================================="
    print_success "                    DEPLOYMENT COMPLETE!"
    print_success "==================================================================="
    echo
    
    print_status "Access your application using one of these methods:"
    echo
    
    print_status "1. Port Forwarding (Recommended for beginners):"
    echo "   kubectl port-forward svc/backend-service 3000:3000 -n $NAMESPACE"
    echo "   Then access: http://localhost:3000"
    echo
    
    print_status "2. MinIO Console (File Storage Web UI):"
    echo "   kubectl port-forward svc/minio-console-service 9001:9001 -n $NAMESPACE"
    echo "   Then access: http://localhost:9001"
    echo "   Login with: minioadmin / minioadmin"
    echo
    
    print_status "3. Ingress (if enabled):"
    echo "   Add to /etc/hosts: 127.0.0.1 social-chat.local"
    echo "   Then access: http://social-chat.local"
    echo
    
    print_status "Useful Commands:"
    echo "   - View pods: kubectl get pods -n $NAMESPACE"
    echo "   - View logs: kubectl logs <pod-name> -n $NAMESPACE"
    echo "   - Shell into pod: kubectl exec -it <pod-name> -n $NAMESPACE -- /bin/sh"
    echo "   - Delete deployment: ./cleanup.sh"
    echo
    
    print_success "Happy learning with Kubernetes! 🚀"
}

# Main deployment function
main() {
    print_success "==================================================================="
    print_success "        SOCIAL CHAT BACKEND - KUBERNETES DEPLOYMENT (NO SUDO)"
    print_success "==================================================================="
    echo
    
    # Pre-deployment checks
    check_kubectl
    check_cluster
    
    # Build and prepare
    build_docker_image
    load_image_to_cluster
    create_storage_dirs
    
    # Deploy
    apply_manifests
    
    # Wait and verify
    wait_for_deployments
    
    # Show results
    show_status
    show_access_info
}

# Handle script arguments
case "${1:-}" in
    "build")
        build_docker_image
        load_image_to_cluster
        ;;
    "apply")
        apply_manifests
        ;;
    "status")
        show_status
        ;;
    "wait")
        wait_for_deployments
        ;;
    "info")
        show_access_info
        ;;
    *)
        main
        ;;
esac 