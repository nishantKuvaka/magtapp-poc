# Django Load Testing POC

A comprehensive load testing project using Django and k6 to measure API performance under heavy computational load. Designed for deployment on AWS ECS (EC2 and Fargate) for performance comparison.

## 🎯 Project Overview

This project provides:
- **Django API** with CPU-intensive and I/O-intensive operations
- **k6 load testing** scripts with detailed metrics
- **Docker support** for containerized deployment
- **ECR-ready** configuration for AWS deployment

## 📊 API Endpoint

### `/heavy/cpu-io-no-db/`

Performs heavy computation without database operations to isolate CPU and I/O performance.

**Query Parameters:**
- `prime_limit` (default: 500,000) - Upper limit for prime number calculation
- `hash_rounds` (default: 1,000,000) - Number of SHA-256 hashing iterations
- `io_kb` (default: 128) - Size of file I/O operations in KB

**Response Time:** ~1.2 seconds per request with default parameters

**Example:**
```bash
curl "http://localhost:8000/heavy/cpu-io-no-db/?prime_limit=500000&hash_rounds=1000000&io_kb=128"
```

**Response:**
```json
{
  "primes_found": 41538,
  "prime_limit": 500000,
  "hash_rounds": 1000000,
  "io_kb": 128,
  "cpu_time_sec": 1.19,
  "total_time_sec": 1.2,
  "io_time_sec": 0.01
}
```

## 🚀 Quick Start

> **📖 For detailed setup instructions, see [SETUP.md](SETUP.md)**

### Local Development

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd loadtest_poc
```

2. **Create virtual environment:**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Run Django server:**
```bash
python manage.py runserver 8000
```

5. **Test the API:**
```bash
curl http://localhost:8000/heavy/health/
curl "http://localhost:8000/heavy/cpu-io-no-db/"
```

### Docker Deployment

1. **Build the image:**
```bash
docker build -t django-loadtest .
```

2. **Run with Docker Compose:**
```bash
docker-compose up
```

3. **Test the containerized API:**
```bash
curl http://localhost:8000/heavy/health/
```

## 📈 Load Testing with k6

### Install k6

```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# macOS
brew install k6

# Windows
choco install k6
```

### Run Tests

**Smoke Test** (30 seconds, 10 VUs):
```bash
k6 run k6-tests/smoke-test.js
```

**Full Load Test** (10 minutes, ramping 1→150 VUs):
```bash
k6 run k6-tests/load-test.js
```

**Custom Target URL:**
```bash
k6 run k6-tests/load-test.js -e BASE_URL=http://your-server:8000
```

### Test Stages

The full load test ramps through these stages:
1. **Warmup** (1m): 1 → 5 VUs
2. **Ramp to 20** (2m): 5 → 20 VUs
3. **Ramp to 50** (2m): 20 → 50 VUs
4. **Ramp to 100** (2m): 50 → 100 VUs
5. **Peak Load** (2m): 100 → 150 VUs
6. **Cooldown** (1m): 150 → 0 VUs

### Performance Thresholds

- **P50 Latency:** < 1000ms
- **P95 Latency:** < 3000ms
- **P99 Latency:** < 6000ms
- **Throttled Requests:** < 50
- **Server Errors:** < 10

## 🐳 AWS ECR & ECS Deployment

### Push to ECR

1. **Authenticate Docker to ECR:**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

2. **Create ECR repository:**
```bash
aws ecr create-repository --repository-name django-loadtest --region us-east-1
```

3. **Tag and push image:**
```bash
docker tag django-loadtest:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/django-loadtest:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/django-loadtest:latest
```

### Deploy to ECS

#### Option 1: ECS with EC2

1. Create ECS cluster with EC2 instances
2. Create task definition using the ECR image
3. Configure service with desired task count
4. Set environment variables:
   - `DEBUG=False`
   - `DJANGO_SECRET_KEY=<your-secret>`
   - `ALLOWED_HOSTS=*`

#### Option 2: ECS with Fargate

1. Create ECS cluster (Fargate)
2. Create task definition with Fargate launch type
3. Configure CPU/Memory (recommended: 2 vCPU, 4GB RAM)
4. Deploy service with desired task count

### Load Testing Remote Deployments

```bash
# Test ECS+EC2 deployment
k6 run k6-tests/load-test.js -e BASE_URL=http://your-ec2-alb.amazonaws.com

# Test Fargate deployment
k6 run k6-tests/load-test.js -e BASE_URL=http://your-fargate-alb.amazonaws.com
```

## 📊 Performance Comparison Methodology

### Metrics to Compare

1. **Latency:**
   - P50, P95, P99 response times
   - CPU computation time
   - I/O operation time

2. **Throughput:**
   - Requests per second
   - Successful vs failed requests

3. **Resource Utilization:**
   - CPU usage
   - Memory usage
   - Network I/O

4. **Cost:**
   - EC2 instance costs
   - Fargate task costs
   - Data transfer costs

### Comparison Steps

1. **Deploy to both platforms** with identical configurations
2. **Run identical load tests** using k6
3. **Collect metrics** from CloudWatch and k6 output
4. **Compare results** across:
   - Machine performance (CPU/Memory)
   - Latency (response times)
   - Throttling (rate limiting)
   - Cost efficiency

## 🔧 Configuration

### Gunicorn Settings (Production)

The Dockerfile uses these Gunicorn settings:
- **Workers:** 4
- **Threads per worker:** 2
- **Timeout:** 120 seconds
- **Total capacity:** 8 concurrent requests

Adjust based on your container resources:
```dockerfile
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2", "--timeout", "120", "loadtest_project.wsgi:application"]
```

### Tuning Parameters

For lighter load (faster tests):
```bash
curl "http://localhost:8000/heavy/cpu-io-no-db/?prime_limit=100000&hash_rounds=200000&io_kb=64"
```

For heavier load (stress testing):
```bash
curl "http://localhost:8000/heavy/cpu-io-no-db/?prime_limit=1000000&hash_rounds=2000000&io_kb=256"
```

## 📁 Project Structure

```
loadtest_poc/
├── loadtest_project/          # Django project settings
│   ├── __init__.py
│   ├── settings.py           # Django configuration
│   ├── urls.py               # URL routing
│   └── wsgi.py               # WSGI application
├── heavy_api/                 # Heavy computation API app
│   ├── __init__.py
│   ├── apps.py
│   ├── urls.py
│   └── views.py              # API endpoints
├── k6-tests/                  # Load testing scripts
│   ├── load-test.js          # Full load test (43 min)
│   └── smoke-test.js         # Quick smoke test (30 sec)
├── Dockerfile                 # Production Docker image
├── docker-compose.yml         # Local Docker setup
├── push-to-ecr.sh            # ECR deployment script
├── requirements.txt           # Python dependencies
├── .gitignore                # Git ignore rules
├── .dockerignore             # Docker ignore rules
├── manage.py                  # Django management script
├── README.md                  # Main documentation (this file)
├── SETUP.md                  # Developer setup guide
├── QUICK_START.md            # Quick reference with examples
└── RUN_TESTS.md              # Detailed testing guide
```

## 🎯 Why k6 for Load Testing?

k6 is a modern load testing tool that:
- Uses JavaScript for test scripts (familiar and flexible)
- Provides detailed performance metrics
- Supports complex load patterns
- Works with any HTTP API (language-agnostic)
- Generates comprehensive reports

## 📝 Notes

- The API intentionally avoids database operations to isolate CPU/I/O performance
- Default parameters create ~1.2 second response time for realistic load testing
- File I/O operations use `/tmp` directory with 5MB cap
- Health check endpoint available at `/heavy/health/`

## 🤝 Contributing

Feel free to adjust parameters and configurations based on your specific load testing needs.

## 📄 License

This is a POC project for load testing purposes.
