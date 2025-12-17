# Setup Guide for Developers

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+**
- **pip** (Python package manager)
- **k6** (Load testing tool)
- **Docker** (optional, for containerized deployment)
- **AWS CLI** (optional, for ECR deployment)

### Install k6

**Ubuntu/Debian:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**macOS:**
```bash
brew install k6
```

**Windows:**
```bash
choco install k6
```

## 🚀 Quick Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd loadtest_poc
```

### 2. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Start Django Server

```bash
python manage.py runserver 8000
```

The API will be available at `http://localhost:8000`

### 5. Verify Installation

In a new terminal:

```bash
# Test health endpoint
curl http://localhost:8000/heavy/health/

# Test heavy computation endpoint
curl "http://localhost:8000/heavy/cpu-io-no-db/"
```

## 🧪 Running Load Tests

### Smoke Test (30 seconds)

Quick validation test with 10 virtual users:

```bash
k6 run k6-tests/smoke-test.js
```

### Production Load Test (43 minutes)

Full production-scale test simulating 350k DAU:

```bash
k6 run k6-tests/load-test.js
```

### Test Remote Deployment

```bash
k6 run k6-tests/load-test.js -e BASE_URL=http://your-server-url
```

## 🐳 Docker Setup

### Build Image

```bash
docker build -t django-loadtest .
```

### Run with Docker Compose

```bash
docker-compose up
```

### Test Containerized API

```bash
curl http://localhost:8000/heavy/health/
```

## ☁️ AWS Deployment

### Push to ECR

1. Set your AWS account ID:
```bash
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=us-east-1
```

2. Run the push script:
```bash
./push-to-ecr.sh
```

### Deploy to ECS

See [README.md](README.md) for detailed ECS deployment instructions.

## 📊 Understanding the API

### Endpoint: `/heavy/cpu-io-no-db/`

Performs heavy computation without database operations.

**Query Parameters:**
- `prime_limit` (default: 500,000) - Prime number calculation limit
- `hash_rounds` (default: 1,000,000) - SHA-256 hashing iterations
- `io_kb` (default: 128) - File I/O size in KB

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

## 🔧 Configuration

### Adjusting Load Parameters

Edit `heavy_api/views.py` to change default parameters:

```python
prime_limit = int(request.GET.get("prime_limit", 500_000))
hash_rounds = int(request.GET.get("hash_rounds", 1_000_000))
io_kb = int(request.GET.get("io_kb", 128))
```

### Adjusting Load Test Stages

Edit `k6-tests/load-test.js` to modify the ramping pattern:

```javascript
stages: [
  { duration: '2m', target: 50 },
  { duration: '3m', target: 100 },
  // ... add more stages
]
```

### Adjusting Performance Thresholds

Edit `k6-tests/load-test.js` thresholds:

```javascript
thresholds: {
  latency_total_ms: [
    'p(50)<2000',
    'p(95)<5000',
  ],
  'http_req_failed': ['rate<0.01'],
}
```

## 📁 Project Structure

```
loadtest_poc/
├── loadtest_project/          # Django project settings
├── heavy_api/                 # Heavy computation API
├── k6-tests/                  # Load testing scripts
│   ├── load-test.js          # Full production test
│   └── smoke-test.js         # Quick validation test
├── Dockerfile                 # Production Docker image
├── docker-compose.yml         # Local Docker setup
├── push-to-ecr.sh            # ECR deployment script
├── requirements.txt           # Python dependencies
├── README.md                  # Main documentation
├── QUICK_START.md            # Quick reference guide
├── RUN_TESTS.md              # Detailed testing guide
└── SETUP.md                  # This file
```

## 🐛 Troubleshooting

### Port Already in Use

If port 8000 is already in use:

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
python manage.py runserver 8080
```

### k6 Not Found

Make sure k6 is installed and in your PATH:

```bash
which k6
```

If not found, reinstall k6 using the instructions above.

### Virtual Environment Issues

If you have issues with the virtual environment:

```bash
# Remove old venv
rm -rf venv

# Create new venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Docker Build Fails

Ensure Docker is running:

```bash
docker --version
docker ps
```

## 💡 Tips for Developers

1. **Start with smoke test** before running the full load test
2. **Monitor system resources** during load tests (CPU, memory, network)
3. **Save test results** for comparison:
   ```bash
   k6 run k6-tests/load-test.js | tee results.txt
   ```
4. **Use environment variables** for configuration:
   ```bash
   export DEBUG=True
   export DJANGO_SECRET_KEY=your-secret-key
   ```

## 📚 Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [k6 Documentation](https://k6.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This is a POC project for load testing purposes.
