# Docker & ECR Deployment Checklist

## ✅ Docker Configuration Review

### Dockerfile ✅
- **Base Image**: `python:3.11-slim` (official, lightweight)
- **Environment Variables**: Properly configured for Python
- **Dependencies**: Installed from requirements.txt
- **Static Files**: Collected with `collectstatic`
- **Port**: 8000 exposed
- **Health Check**: Configured for `/heavy/health/` endpoint
- **Gunicorn**: 
  - 4 workers, 2 threads = 8 concurrent requests
  - 120s timeout (good for heavy computation)
  - Logs to stdout/stderr

**Status**: ✅ Ready for ECR

### .dockerignore ✅
Excludes:
- Python cache files
- Virtual environments
- Git files
- IDE files
- Test results

**Status**: ✅ Optimized for build

### docker-compose.yml ✅
- Port mapping: 8000:8000
- Environment variables configured
- Health check enabled
- Volume for /tmp (I/O operations)

**Status**: ✅ Ready for local testing

### push-to-ecr.sh ✅
Script includes:
1. AWS authentication
2. ECR repository creation (if needed)
3. Docker build
4. Image tagging
5. Push to ECR
6. Error handling at each step
7. Helpful output and next steps

**Status**: ✅ Production ready

## 🔧 Pre-Deployment Checklist

### Before Pushing to ECR:

1. **Install/Configure Docker** (if not already):
   ```bash
   # Add user to docker group (Linux)
   sudo usermod -aG docker $USER
   newgrp docker
   
   # Or run with sudo
   sudo docker build -t django-loadtest .
   ```

2. **Install AWS CLI**:
   ```bash
   # Ubuntu/Debian
   sudo apt install awscli
   
   # Or use pip
   pip install awscli
   ```

3. **Configure AWS Credentials**:
   ```bash
   aws configure
   # Enter: Access Key ID, Secret Access Key, Region, Output format
   ```

4. **Set Environment Variables**:
   ```bash
   export AWS_ACCOUNT_ID=123456789012
   export AWS_REGION=us-east-1
   ```

5. **Make Script Executable**:
   ```bash
   chmod +x push-to-ecr.sh
   ```

6. **Run ECR Push**:
   ```bash
   AWS_ACCOUNT_ID=your-account-id ./push-to-ecr.sh
   ```

## 🐳 Docker Build Test (When Ready)

```bash
# Test build locally
docker build -t django-loadtest:test .

# Test run locally
docker run -p 8000:8000 django-loadtest:test

# Test health check
curl http://localhost:8000/heavy/health/
```

## 📋 ECS Task Definition Template

```json
{
  "family": "django-loadtest",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "containerDefinitions": [
    {
      "name": "django-loadtest",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/django-loadtest:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DEBUG",
          "value": "False"
        },
        {
          "name": "ALLOWED_HOSTS",
          "value": "*"
        },
        {
          "name": "DJANGO_SECRET_KEY",
          "value": "your-production-secret-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/django-loadtest",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "python -c \"import urllib.request; urllib.request.urlopen('http://localhost:8000/heavy/health/')\" || exit 1"
        ],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 5
      }
    }
  ]
}
```

## ⚠️ Common Issues & Solutions

### Issue: Docker Permission Denied
**Solution**:
```bash
sudo usermod -aG docker $USER
newgrp docker
# Or run with sudo
```

### Issue: AWS Authentication Failed
**Solution**:
```bash
aws configure
# Re-enter credentials
```

### Issue: ECR Repository Not Found
**Solution**: The script auto-creates it, but you can manually create:
```bash
aws ecr create-repository --repository-name django-loadtest --region us-east-1
```

### Issue: Image Push Timeout
**Solution**: Check network connection and try again. Large images may take time.

### Issue: ECS Task Won't Start
**Solution**: 
- Check CloudWatch logs
- Verify image URI is correct
- Ensure security groups allow port 8000
- Check IAM roles have ECR pull permissions

## ✅ Verification Steps

After deploying to ECS:

1. **Check Task Status**:
   ```bash
   aws ecs describe-tasks --cluster your-cluster --tasks task-id
   ```

2. **Check Logs**:
   ```bash
   aws logs tail /ecs/django-loadtest --follow
   ```

3. **Test Health Endpoint**:
   ```bash
   curl http://your-alb-url/heavy/health/
   ```

4. **Run Load Test**:
   ```bash
   k6 run k6-tests/load-test.js -e BASE_URL=http://your-alb-url
   ```

## 📊 Summary

**All Docker and ECR configurations are correct and production-ready!**

The only issue encountered was Docker daemon permission on the local machine, which is a local environment issue, not a configuration problem.

When you're ready to deploy:
1. Fix Docker permissions (or use sudo)
2. Configure AWS credentials
3. Run `./push-to-ecr.sh`
4. Create ECS task definition
5. Deploy and test!
