# 🚀 Social Chat Backend - Kubernetes Learning Guide

Welcome to your Kubernetes learning journey! This guide will help you deploy the Social Chat Backend application to Kubernetes and learn core concepts along the way.

## 📋 Table of Contents

- [🎯 Prerequisites](#-prerequisites)
- [🛠️ Setup Local Kubernetes](#️-setup-local-kubernetes)
- [📦 Quick Start](#-quick-start)
- [🔍 Understanding the Architecture](#-understanding-the-architecture)
- [📚 Learning Path](#-learning-path)
- [🛡️ Security Considerations](#️-security-considerations)
- [🔧 Troubleshooting](#-troubleshooting)
- [📖 Additional Resources](#-additional-resources)

## 🎯 Prerequisites

Before starting, ensure you have:

### Required Tools
- **Docker**: For building container images
- **kubectl**: Kubernetes command-line tool
- **A Kubernetes cluster**: minikube, kind, or Docker Desktop

### Knowledge Prerequisites (Beginner-friendly)
- Basic understanding of Docker containers
- Familiarity with command line/terminal
- Basic understanding of web applications
- No prior Kubernetes experience needed! 

## 🛠️ Setup Local Kubernetes

Choose one of these options based on your preference:

### Option 1: Docker Desktop (Recommended for Windows/Mac)

1. **Install Docker Desktop**
   ```bash
   # Download from: https://www.docker.com/products/docker-desktop
   ```

2. **Enable Kubernetes**
   - Open Docker Desktop
   - Go to Settings → Kubernetes
   - Check "Enable Kubernetes"
   - Click "Apply & Restart"

3. **Verify Installation**
   ```bash
   kubectl cluster-info
   ```

### Option 2: minikube (Cross-platform)

1. **Install minikube**
   ```bash
   # macOS
   brew install minikube
   
   # Windows (using Chocolatey)
   choco install minikube
   
   # Linux
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube
   ```

2. **Start minikube**
   ```bash
   minikube start
   minikube addons enable ingress  # For Ingress controller
   ```

### Option 3: kind (Kubernetes in Docker)

1. **Install kind**
   ```bash
   # macOS
   brew install kind
   
   # Windows
   choco install kind
   
   # Linux
   curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
   chmod +x ./kind
   sudo mv ./kind /usr/local/bin/kind
   ```

2. **Create cluster**
   ```bash
   kind create cluster --name social-chat
   ```

## 📦 Quick Start

### 1. Deploy the Application

Navigate to the `k8s` directory and run the deployment script:

```bash
cd k8s
./deploy.sh
```

This script will:
- ✅ Build the Docker image
- ✅ Load it into your cluster
- ✅ Create all Kubernetes resources
- ✅ Wait for everything to be ready
- ✅ Show you how to access the application

### 2. Access Your Application

**Option A: Port Forwarding (Recommended)**
```bash
kubectl port-forward svc/backend-service 3000:3000 -n social-chat
```
Then access: http://localhost:3000

**Option B: MinIO Console (File Storage)**
```bash
kubectl port-forward svc/minio-console-service 9001:9001 -n social-chat
```
Then access: http://localhost:9001 (Login: minioadmin/minioadmin)

### 3. Explore Your Deployment

```bash
# View all pods
kubectl get pods -n social-chat

# View services
kubectl get services -n social-chat

# View detailed pod information
kubectl describe pod <pod-name> -n social-chat

# View logs
kubectl logs <pod-name> -n social-chat
```

## 🔍 Understanding the Architecture

### What You've Deployed

Your Social Chat Backend now runs on Kubernetes with:

```
┌─────────────────── Kubernetes Cluster ───────────────────┐
│                                                           │
│  ┌─── Frontend Access ───┐    ┌─── Backend App ───┐      │
│  │   Ingress/Service     │────│   NestJS (x2)     │      │
│  │   Port: 3000         │    │   Port: 3000       │      │
│  └──────────────────────┘    └────────────────────┘      │
│                                         │                │
│  ┌─── Data Layer ─────────────────────────────────────┐  │
│  │                                                     │  │
│  │  PostgreSQL    Redis       Kafka      MinIO        │  │
│  │  (Database)    (Cache)     (Messages) (Files)      │  │
│  │  Port: 5432    Port: 6379  Port: 9092 Port: 9000   │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─── Storage ───┐                                        │
│  │ Persistent    │                                        │
│  │ Volumes       │                                        │
│  └───────────────┘                                        │
└───────────────────────────────────────────────────────────┘
```

### Key Kubernetes Resources Created

1. **Namespace**: `social-chat` - Isolates your application
2. **ConfigMap**: `app-config` - Non-sensitive configuration
3. **Secret**: `app-secrets` - Sensitive data (passwords, keys)
4. **PersistentVolumes**: Data storage for databases
5. **Deployments**: Manage your application pods
6. **Services**: Network access to your applications
7. **Ingress**: HTTP routing (optional)

## 📚 Learning Path

### Week 1: Kubernetes Basics

#### Day 1-2: Understand Pods and Deployments
```bash
# View your pods
kubectl get pods -n social-chat

# Get detailed information about a pod
kubectl describe pod postgres-<tab-to-complete> -n social-chat

# Check logs
kubectl logs postgres-<tab-to-complete> -n social-chat

# Shell into a pod (explore the container)
kubectl exec -it postgres-<tab-to-complete> -n social-chat -- /bin/bash
```

**📝 Learning Exercise**: Understand what each pod does and how they're connected.

#### Day 3-4: Services and Networking
```bash
# View services
kubectl get services -n social-chat

# Test internal connectivity
kubectl exec -it backend-<tab-to-complete> -n social-chat -- nslookup postgres-service

# Port forward to different services
kubectl port-forward svc/postgres-service 5432:5432 -n social-chat
```

**📝 Learning Exercise**: Connect to PostgreSQL from your local machine using port forwarding.

#### Day 5-7: Storage and Configuration
```bash
# View persistent volumes
kubectl get pv

# View persistent volume claims
kubectl get pvc -n social-chat

# View ConfigMaps and Secrets
kubectl get configmap -n social-chat
kubectl get secrets -n social-chat

# Decode a secret
kubectl get secret app-secrets -n social-chat -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

**📝 Learning Exercise**: Modify the ConfigMap and see how it affects the application.

### Week 2: Advanced Concepts

#### Day 1-3: Scaling and Updates
```bash
# Scale your backend application
kubectl scale deployment backend --replicas=3 -n social-chat

# Watch the scaling process
kubectl get pods -n social-chat -w

# Update your application (build new image and update deployment)
./deploy.sh build
kubectl set image deployment/backend backend=social-chat-backend:latest -n social-chat
```

#### Day 4-5: Monitoring and Debugging
```bash
# Monitor resource usage
kubectl top pods -n social-chat

# Check deployment status
kubectl rollout status deployment/backend -n social-chat

# View events
kubectl get events -n social-chat --sort-by='.metadata.creationTimestamp'
```

#### Day 6-7: Security and Best Practices
- Review the security contexts in the YAML files
- Understand RBAC (Role-Based Access Control)
- Learn about network policies

## 🛡️ Security Considerations

### Production Security Checklist

- [ ] **Remove default passwords** from secrets
- [ ] **Use external secret management** (HashiCorp Vault, AWS Secrets Manager)
- [ ] **Enable RBAC** and create service accounts
- [ ] **Use network policies** to restrict traffic
- [ ] **Scan images** for vulnerabilities
- [ ] **Update base images** regularly
- [ ] **Use admission controllers** (OPA Gatekeeper, Pod Security Standards)

### Current Security Features

✅ **Non-root containers**: All containers run as non-root users  
✅ **Resource limits**: CPU and memory limits set  
✅ **Secrets for sensitive data**: Passwords stored in Kubernetes Secrets  
✅ **Namespace isolation**: Application isolated in its own namespace  

⚠️ **Development Only**: Current setup uses basic authentication and local storage

## 🔧 Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed debugging guide.

### Quick Fixes

**Pod won't start?**
```bash
kubectl describe pod <pod-name> -n social-chat
kubectl logs <pod-name> -n social-chat
```

**Service not accessible?**
```bash
kubectl get endpoints -n social-chat
kubectl port-forward svc/<service-name> <local-port>:<service-port> -n social-chat
```

**Storage issues?**
```bash
kubectl get pv
kubectl get pvc -n social-chat
kubectl describe pvc <pvc-name> -n social-chat
```

## 📖 Additional Resources

### Documentation
- [Kubernetes Official Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/)

### Interactive Learning
- [Kubernetes Tutorials](https://kubernetes.io/docs/tutorials/)
- [Play with Kubernetes](https://labs.play-with-k8s.com/)
- [Katacoda Kubernetes Scenarios](https://www.katacoda.com/courses/kubernetes)

### Books (Recommended)
- "Kubernetes Up & Running" by Kelsey Hightower
- "Kubernetes in Action" by Marko Luksa
- "Programming Kubernetes" by Michael Hausenblas

### Video Courses
- [Kubernetes for Beginners](https://www.youtube.com/playlist?list=PLF3s2WICJlqOiymMaTLjwwHz-MSVbtJPQ)
- [TechWorld with Nana - Kubernetes](https://www.youtube.com/watch?v=X48VuDVv0do)

## 🎯 Next Steps

1. **Experiment**: Try modifying the YAML files and see what happens
2. **Add features**: Create new services or modify existing ones
3. **Learn Helm**: Package your application with Helm charts
4. **CI/CD**: Set up automated deployments with GitLab CI or GitHub Actions
5. **Production**: Learn about cloud-managed Kubernetes (EKS, GKE, AKS)

## 🤝 Contributing

Found an issue or want to improve this guide? Please:
1. Create an issue describing the problem
2. Submit a pull request with improvements
3. Share your learning experience!

---

**Happy Learning!** 🚀

Remember: The best way to learn Kubernetes is by doing. Don't be afraid to break things in your local environment - that's how you learn!

*This guide is designed for educational purposes. For production deployments, always follow your organization's security and operational guidelines.* 