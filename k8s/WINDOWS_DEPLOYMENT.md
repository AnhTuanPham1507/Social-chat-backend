# 🪟 Windows Deployment Guide for Social Chat Backend

This guide provides multiple solutions for deploying the Social Chat Backend on Windows when encountering sudo permission errors.

## 🚨 The Problem

When running the original `deploy.sh` script on Windows, you may encounter this error:
```
Sudo is disabled on this machine. To enable it, go to the Developer Settings page in the Settings app
```

This happens because the script tries to create storage directories using `sudo`, which is either disabled or works differently on Windows.

## 🛠️ Solutions (Choose One)

### Solution 1: Use Windows-Compatible Scripts (Recommended)

We've created Windows-compatible versions of the deployment script:

#### Option A: Bash Script (Git Bash/WSL)
```bash
# Make executable and run
chmod +x deploy-windows.sh
./deploy-windows.sh
```

#### Option B: PowerShell Script
```powershell
# In PowerShell
.\deploy-windows.ps1
```

#### Option C: No-Sudo Script (Quick Fix)
```bash
# Modified original script without sudo
chmod +x deploy-no-sudo.sh
./deploy-no-sudo.sh
```

### Solution 2: Enable WSL and Use Original Script

If you prefer to use the original Linux-based script:

1. **Install WSL**:
   ```powershell
   # In PowerShell as Administrator
   wsl --install
   ```

2. **Install Ubuntu**:
   ```powershell
   wsl --install -d Ubuntu
   ```

3. **Set up the environment in WSL**:
   ```bash
   # In WSL terminal
   sudo apt update
   sudo apt install docker.io kubectl
   ```

4. **Run the original script**:
   ```bash
   cd /mnt/c/path/to/your/project/k8s
   ./deploy.sh
   ```

### Solution 3: Manual Directory Creation

If you want to use the original script but avoid sudo issues:

1. **Create directories manually** (in Git Bash or WSL):
   ```bash
   # Try these paths (one should work)
   mkdir -p /tmp/k8s-data/{postgres,redis,kafka,minio}
   # OR
   mkdir -p /c/tmp/k8s-data/{postgres,redis,kafka,minio}
   ```

2. **Set permissions**:
   ```bash
   chmod 777 /tmp/k8s-data/* 2>/dev/null || chmod 777 /c/tmp/k8s-data/* 2>/dev/null
   ```

3. **Run the original script**:
   ```bash
   ./deploy.sh
   ```

### Solution 4: Use Docker Desktop Volumes

For Docker Desktop users, you can skip directory creation entirely:

1. **Modify the persistent volume manifests** to use Docker Desktop volumes instead of hostPath
2. **Or use the Windows-compatible scripts** which handle this automatically

## 🎯 Which Solution Should You Choose?

| Solution | Best For | Pros | Cons |
|----------|----------|------|------|
| **Windows Scripts** | Most users | ✅ Easy setup<br/>✅ No additional software<br/>✅ Works immediately | ⚠️ Different from original |
| **WSL** | Linux lovers | ✅ Full Linux experience<br/>✅ Use original script<br/>✅ Better for learning | ❌ Requires WSL setup<br/>❌ More complex |
| **Manual Creation** | Quick fix | ✅ Use original script<br/>✅ Minimal changes | ❌ Manual work required<br/>❌ May need troubleshooting |
| **Docker Desktop** | Docker Desktop users | ✅ Automatic storage<br/>✅ No directory issues | ❌ Requires Docker Desktop<br/>❌ Different storage behavior |

## 📋 Prerequisites for Windows

Before using any solution, ensure you have:

1. **Docker Desktop** with Kubernetes enabled
   - Download from: https://www.docker.com/products/docker-desktop
   - Enable Kubernetes in settings

2. **kubectl** installed
   - Download from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
   - Or install via Chocolatey: `choco install kubernetes-cli`

3. **Git Bash** (for bash scripts) or **PowerShell** (for PowerShell scripts)

## 🚀 Quick Start (Recommended)

1. **Choose your preferred script**:
   ```bash
   # For Git Bash users
   ./deploy-windows.sh
   
   # For PowerShell users
   .\deploy-windows.ps1
   
   # For quick fix
   ./deploy-no-sudo.sh
   ```

2. **Access your application**:
   ```bash
   # Port forward to access the backend
   kubectl port-forward svc/backend-service 3000:3000 -n social-chat
   ```

3. **Open in browser**: http://localhost:3000

## 🐛 Common Windows-Specific Issues

### Issue: "docker: command not found"
**Solution**: Ensure Docker Desktop is running and added to PATH

### Issue: "kubectl: command not found"  
**Solution**: Install kubectl and add to PATH

### Issue: Permission denied on scripts
**Solution**: 
```bash
chmod +x deploy-windows.sh
# OR in PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Path not found errors
**Solution**: Ensure you're in the `k8s` directory:
```bash
cd k8s
pwd  # Should show .../Social-chat-backend/k8s
```

## 🛡️ Security Notes for Windows

- The Windows scripts avoid sudo to prevent permission issues
- Storage directories are created with user permissions only
- For production use, consider proper Windows ACLs

## 📞 Need Help?

If you encounter issues:

1. **Check cluster status**:
   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```

2. **Verify Docker**:
   ```bash
   docker --version
   docker ps
   ```

3. **Check script permissions**:
   ```bash
   ls -la deploy-*.sh
   ```

4. **View deployment status**:
   ```bash
   kubectl get pods -n social-chat
   kubectl get services -n social-chat
   ```

## 🎉 Success!

Once deployed successfully, you should see:
- All pods running: `kubectl get pods -n social-chat`
- Services available: `kubectl get services -n social-chat`
- Backend accessible via port-forward

Happy Kubernetes learning on Windows! 🚀 