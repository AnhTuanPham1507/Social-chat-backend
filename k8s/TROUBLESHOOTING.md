# 🔧 Kubernetes Troubleshooting Guide

This guide helps you diagnose and fix common issues when running the Social Chat Backend on Kubernetes.

## 📋 Table of Contents

- [🔍 General Debugging Steps](#-general-debugging-steps)
- [🚫 Common Issues](#-common-issues)
- [📦 Pod Issues](#-pod-issues)
- [🌐 Service and Networking Issues](#-service-and-networking-issues)
- [💾 Storage Issues](#-storage-issues)
- [🔐 Configuration Issues](#-configuration-issues)
- [🎯 Application-Specific Issues](#-application-specific-issues)
- [📊 Monitoring and Logs](#-monitoring-and-logs)
- [🛠️ Useful Commands Reference](#️-useful-commands-reference)

## 🔍 General Debugging Steps

### Step 1: Check Overall Status
```bash
# Check if all pods are running
kubectl get pods -n social-chat

# Check services
kubectl get services -n social-chat

# Check recent events
kubectl get events -n social-chat --sort-by='.metadata.creationTimestamp'
```

### Step 2: Identify the Problem Component
```bash
# Check deployment status
kubectl get deployments -n social-chat

# Check persistent volume claims
kubectl get pvc -n social-chat

# Check ingress (if used)
kubectl get ingress -n social-chat
```

### Step 3: Deep Dive into Failing Components
```bash
# Describe the problematic resource
kubectl describe pod <pod-name> -n social-chat
kubectl describe deployment <deployment-name> -n social-chat
kubectl describe service <service-name> -n social-chat

# Check logs
kubectl logs <pod-name> -n social-chat
kubectl logs <pod-name> -n social-chat --previous  # Previous container logs
```

## 🚫 Common Issues

### Issue: "ImagePullBackOff" or "ErrImagePull"

**Symptoms:**
```
NAME      READY   STATUS             RESTARTS   AGE
backend   0/1     ImagePullBackOff   0          2m
```

**Diagnosis:**
```bash
kubectl describe pod backend-<pod-id> -n social-chat
```

**Solutions:**

1. **For local clusters (minikube/kind):**
   ```bash
   # Build and load the image
   cd .. && docker build -t social-chat-backend:latest .
   
   # For kind
   kind load docker-image social-chat-backend:latest
   
   # For minikube
   minikube image load social-chat-backend:latest
   ```

2. **Check image name in deployment:**
   ```bash
   kubectl get deployment backend -n social-chat -o yaml | grep image:
   ```

3. **Use imagePullPolicy: Never for local images:**
   ```yaml
   spec:
     containers:
     - name: backend
       image: social-chat-backend:latest
       imagePullPolicy: Never  # Add this line
   ```

### Issue: Pods Stuck in "Pending" State

**Symptoms:**
```
NAME         READY   STATUS    RESTARTS   AGE
postgres-0   0/1     Pending   0          5m
```

**Diagnosis:**
```bash
kubectl describe pod postgres-<pod-id> -n social-chat
```

**Common Causes & Solutions:**

1. **Insufficient resources:**
   ```bash
   # Check node resources
   kubectl top nodes
   kubectl describe nodes
   ```

2. **PVC not bound:**
   ```bash
   kubectl get pvc -n social-chat
   kubectl describe pvc postgres-pvc -n social-chat
   ```

3. **Node selector issues:**
   ```bash
   kubectl get nodes --show-labels
   ```

### Issue: "CrashLoopBackOff"

**Symptoms:**
```
NAME         READY   STATUS             RESTARTS   AGE
backend-0    0/1     CrashLoopBackOff   5          5m
```

**Diagnosis:**
```bash
kubectl logs backend-<pod-id> -n social-chat
kubectl logs backend-<pod-id> -n social-chat --previous
kubectl describe pod backend-<pod-id> -n social-chat
```

**Solutions:**

1. **Check application logs for errors**
2. **Verify environment variables:**
   ```bash
   kubectl exec -it backend-<pod-id> -n social-chat -- env | grep DB_
   ```

3. **Check health probes:**
   ```bash
   # Test health endpoint manually
   kubectl exec -it backend-<pod-id> -n social-chat -- curl localhost:3000/health
   ```

## 📦 Pod Issues

### Pod Won't Start

**Debug Steps:**
```bash
# Check pod status
kubectl get pod <pod-name> -n social-chat -o wide

# Get detailed information
kubectl describe pod <pod-name> -n social-chat

# Check logs
kubectl logs <pod-name> -n social-chat

# Check events
kubectl get events --field-selector involvedObject.name=<pod-name> -n social-chat
```

### Container Exits Immediately

**Debug Steps:**
```bash
# Check the container command
kubectl get pod <pod-name> -n social-chat -o yaml | grep -A 10 command

# Override entrypoint for debugging
kubectl run debug-pod --image=social-chat-backend:latest --rm -it --command -- /bin/sh
```

### Health Checks Failing

**Debug Steps:**
```bash
# Check health probe configuration
kubectl get pod <pod-name> -n social-chat -o yaml | grep -A 10 livenessProbe

# Test health endpoint manually
kubectl exec -it <pod-name> -n social-chat -- curl localhost:3000/health

# Disable health checks temporarily
kubectl patch deployment backend -n social-chat -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","livenessProbe":null,"readinessProbe":null}]}}}}'
```

## 🌐 Service and Networking Issues

### Service Not Accessible

**Debug Steps:**
```bash
# Check service configuration
kubectl get service <service-name> -n social-chat -o wide

# Check endpoints
kubectl get endpoints <service-name> -n social-chat

# Test service connectivity
kubectl run test-pod --image=busybox --rm -it -- nslookup <service-name>.social-chat.svc.cluster.local
```

### DNS Resolution Issues

**Debug Steps:**
```bash
# Test DNS from within a pod
kubectl exec -it <pod-name> -n social-chat -- nslookup postgres-service
kubectl exec -it <pod-name> -n social-chat -- nslookup postgres-service.social-chat.svc.cluster.local

# Check CoreDNS
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns
```

### Port Forwarding Issues

**Debug Steps:**
```bash
# Check if service is running
kubectl get service backend-service -n social-chat

# Check if pods are ready
kubectl get pods -n social-chat -l app=backend

# Try different port forwarding syntax
kubectl port-forward service/backend-service 3000:3000 -n social-chat
kubectl port-forward deployment/backend 3000:3000 -n social-chat
kubectl port-forward pod/<pod-name> 3000:3000 -n social-chat
```

## 💾 Storage Issues

### PVC Stuck in "Pending"

**Debug Steps:**
```bash
# Check PVC status
kubectl get pvc -n social-chat
kubectl describe pvc <pvc-name> -n social-chat

# Check available PVs
kubectl get pv

# Check storage class
kubectl get storageclass
```

**Solutions:**
```bash
# For local clusters, create storage directories
sudo mkdir -p /tmp/k8s-data/{postgres,redis,kafka,minio}
sudo chmod 777 /tmp/k8s-data/*

# Check if PV exists
kubectl get pv postgres-pv -o yaml
```

### Data Not Persisting

**Debug Steps:**
```bash
# Check if PVC is mounted
kubectl describe pod <pod-name> -n social-chat | grep -A 5 Mounts

# Check volume configuration
kubectl get pod <pod-name> -n social-chat -o yaml | grep -A 10 volumes

# Test writing to volume
kubectl exec -it <pod-name> -n social-chat -- touch /data/test-file
kubectl exec -it <pod-name> -n social-chat -- ls -la /data/
```

### Permission Issues

**Debug Steps:**
```bash
# Check file permissions in container
kubectl exec -it <pod-name> -n social-chat -- ls -la /data/

# Check security context
kubectl get pod <pod-name> -n social-chat -o yaml | grep -A 5 securityContext

# Fix permissions (if needed)
sudo chown -R 1001:1001 /tmp/k8s-data/<service>/
```

## 🔐 Configuration Issues

### ConfigMap/Secret Not Loading

**Debug Steps:**
```bash
# Check if ConfigMap exists
kubectl get configmap app-config -n social-chat -o yaml

# Check if Secret exists
kubectl get secret app-secrets -n social-chat -o yaml

# Verify environment variables in pod
kubectl exec -it <pod-name> -n social-chat -- env | grep DB_
```

### Environment Variables Missing

**Debug Steps:**
```bash
# Check deployment configuration
kubectl get deployment <deployment-name> -n social-chat -o yaml | grep -A 10 envFrom

# Test specific environment variable
kubectl exec -it <pod-name> -n social-chat -- echo $DB_HOST
```

**Solutions:**
```bash
# Update ConfigMap
kubectl patch configmap app-config -n social-chat -p '{"data":{"NEW_VAR":"new-value"}}'

# Restart deployment to pick up changes
kubectl rollout restart deployment/<deployment-name> -n social-chat
```

## 🎯 Application-Specific Issues

### Database Connection Issues

**Debug Steps:**
```bash
# Check if PostgreSQL is running
kubectl get pods -n social-chat -l app=postgres

# Test database connectivity
kubectl exec -it postgres-<pod-id> -n social-chat -- pg_isready -U postgres

# Connect to database
kubectl exec -it postgres-<pod-id> -n social-chat -- psql -U postgres -d social-chat-local

# Test from backend pod
kubectl exec -it backend-<pod-id> -n social-chat -- nslookup postgres-service
```

### Redis Connection Issues

**Debug Steps:**
```bash
# Check Redis status
kubectl exec -it redis-<pod-id> -n social-chat -- redis-cli ping

# Test with password
kubectl exec -it redis-<pod-id> -n social-chat -- redis-cli -a <password> ping

# Check Redis logs
kubectl logs redis-<pod-id> -n social-chat
```

### Kafka Connection Issues

**Debug Steps:**
```bash
# List Kafka topics
kubectl exec -it kafka-<pod-id> -n social-chat -- kafka-topics.sh --bootstrap-server localhost:9092 --list

# Check Kafka logs
kubectl logs kafka-<pod-id> -n social-chat

# Test broker connectivity
kubectl exec -it kafka-<pod-id> -n social-chat -- kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

### MinIO Access Issues

**Debug Steps:**
```bash
# Check MinIO health
kubectl exec -it minio-<pod-id> -n social-chat -- curl localhost:9000/minio/health/live

# Test MinIO client
kubectl exec -it minio-<pod-id> -n social-chat -- mc ls /data

# Access MinIO console
kubectl port-forward service/minio-console-service 9001:9001 -n social-chat
```

## 📊 Monitoring and Logs

### Viewing Logs

**Real-time logs:**
```bash
# Follow logs
kubectl logs -f <pod-name> -n social-chat

# Multiple pods
kubectl logs -f deployment/backend -n social-chat

# All containers in a pod
kubectl logs <pod-name> -n social-chat --all-containers=true
```

**Historical logs:**
```bash
# Previous container instance
kubectl logs <pod-name> -n social-chat --previous

# Logs from specific time
kubectl logs <pod-name> -n social-chat --since=1h
kubectl logs <pod-name> -n social-chat --since-time=2024-01-01T10:00:00Z
```

### Resource Monitoring

```bash
# Pod resource usage
kubectl top pods -n social-chat

# Node resource usage
kubectl top nodes

# Detailed resource usage
kubectl describe pod <pod-name> -n social-chat | grep -A 10 "Requests\|Limits"
```

### Events

```bash
# Recent events
kubectl get events -n social-chat --sort-by='.lastTimestamp'

# Events for specific resource
kubectl get events --field-selector involvedObject.name=<resource-name> -n social-chat

# Warning events only
kubectl get events -n social-chat --field-selector type=Warning
```

## 🛠️ Useful Commands Reference

### Quick Diagnostics
```bash
# One-liner to check everything
kubectl get all -n social-chat

# Check resource consumption
kubectl top pods -n social-chat && kubectl top nodes

# Check all events
kubectl get events -n social-chat --sort-by='.lastTimestamp' | tail -20
```

### Emergency Recovery
```bash
# Restart all deployments
kubectl rollout restart deployment -n social-chat

# Delete and recreate a problematic pod
kubectl delete pod <pod-name> -n social-chat

# Scale down and up
kubectl scale deployment <deployment-name> --replicas=0 -n social-chat
kubectl scale deployment <deployment-name> --replicas=1 -n social-chat
```

### Cleanup Commands
```bash
# Delete stuck pods
kubectl delete pod <pod-name> -n social-chat --force --grace-period=0

# Clean up completed pods
kubectl delete pods --field-selector=status.phase=Succeeded -n social-chat

# Remove all resources
./cleanup.sh
```

### Debug Pod
```bash
# Create debug pod with common tools
kubectl run debug --image=nicolaka/netshoot --rm -it -- /bin/bash

# Debug with your application image
kubectl run debug-app --image=social-chat-backend:latest --rm -it --command -- /bin/sh
```

## 🆘 Getting Help

### When to Ask for Help

1. **After trying the above steps** and the issue persists
2. **For production issues** that affect users
3. **For complex networking** or security problems
4. **When learning** - don't hesitate to ask questions!

### Information to Provide

When asking for help, include:

```bash
# System information
kubectl version
kubectl cluster-info

# Resource status
kubectl get all -n social-chat

# Problem details
kubectl describe pod <problematic-pod> -n social-chat
kubectl logs <problematic-pod> -n social-chat

# Recent events
kubectl get events -n social-chat --sort-by='.lastTimestamp' | tail -10
```

### Community Resources

- [Kubernetes Slack](https://kubernetes.slack.com/) - #kubernetes-users channel
- [Stack Overflow](https://stackoverflow.com/questions/tagged/kubernetes) - kubernetes tag
- [Kubernetes GitHub Discussions](https://github.com/kubernetes/kubernetes/discussions)
- [Reddit r/kubernetes](https://www.reddit.com/r/kubernetes/)

---

**Remember:** Debugging is a skill that improves with practice. Start with the simple checks and work your way up to more complex diagnostics. Most issues have simple solutions once you know where to look! 🔍 