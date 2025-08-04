# 🚀 Quick Start Guide

## TL;DR - Deploy in 3 Steps

```bash
# 1. Navigate to k8s directory
cd k8s

# 2. Run deployment script
./deploy.sh

# 3. Access your application
kubectl port-forward svc/backend-service 3000:3000 -n social-chat
```

Then open: http://localhost:3000

## What You Get

✅ **Complete Social Chat Backend** running on Kubernetes  
✅ **PostgreSQL** database with persistent storage  
✅ **Redis** cache for high performance  
✅ **Kafka** message broker for real-time features  
✅ **MinIO** object storage for file uploads  
✅ **2 Backend replicas** for load balancing  
✅ **Educational comments** in every file  
✅ **Comprehensive documentation** for learning  

## File Structure

```
k8s/
├── 📋 README.md                 # Complete learning guide
├── 🔧 TROUBLESHOOTING.md        # Debug any issues
├── 🚀 GETTING_STARTED.md        # This file
├── 📜 deploy.sh                 # Deploy everything
├── 🗑️  cleanup.sh               # Clean up resources
├── 00-namespace.yaml            # Namespace isolation
├── 01-configmap.yaml            # App configuration
├── 02-secrets.yaml              # Sensitive data
├── 03-persistent-volumes.yaml   # Data storage
├── 04-postgres.yaml             # Database
├── 05-redis.yaml                # Cache
├── 06-kafka.yaml                # Message broker
├── 07-minio.yaml                # Object storage
├── 08-backend.yaml              # NestJS application
└── 09-ingress.yaml              # HTTP routing (optional)
```

## Prerequisites

- Docker Desktop with Kubernetes enabled, OR
- minikube (`minikube start`), OR  
- kind (`kind create cluster`)

## Next Steps

1. **Read the full guide**: [README.md](./README.md)
2. **Explore the pods**: `kubectl get pods -n social-chat`
3. **Check the logs**: `kubectl logs <pod-name> -n social-chat`
4. **Learn Kubernetes concepts** from the commented YAML files

## Need Help?

- 📖 **Full documentation**: [README.md](./README.md)
- 🔧 **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- 💬 **Quick questions**: Check the comments in YAML files

**Happy learning!** 🎓 