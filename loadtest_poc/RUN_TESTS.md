# 🚀 Load Testing Commands - Quick Reference

## Prerequisites

1. **Django API must be running:**
```bash
cd loadtest_poc
source venv/bin/activate
python manage.py runserver 8000
```

## 📊 Run Load Tests

### Option 1: Smoke Test (Quick - 30 seconds)
**Purpose:** Quick validation before full test

```bash
cd loadtest_poc
k6 run k6-tests/smoke-test.js
```

**What you'll see:**
- Test configuration
- Health check
- Progress every 10 requests
- Final metrics summary

---

### Option 2: Quick Test (75 seconds)
**Purpose:** Quick load test with ramping VUs

```bash
cd loadtest_poc
k6 run k6-tests/quick-test.js
```

**What you'll see:**
- Test configuration with ramping stages
- Health check
- Progress every 25 requests
- Metrics for latency, CPU, and I/O
- Final summary with thresholds

---

### Option 3: Production Load Test (3 minutes)
**Purpose:** Simulate 350k DAU production traffic

```bash
cd loadtest_poc
k6 run k6-tests/load-test.js
```

**What you'll see:**
- 🚀 Production scale configuration (350k DAU)
- 📈 10 stages ramping from 10 → 500 VUs
- 📊 Progress updates every 50 requests showing:
  - Active VUs
  - Response time
  - CPU time
  - I/O time
  - Primes found
  - Throttling alerts
  - Error alerts

---

### Option 4: Test Remote Deployment

**ECS + EC2:**
```bash
k6 run k6-tests/load-test.js -e BASE_URL=http://your-ec2-alb.amazonaws.com
```

**Fargate:**
```bash
k6 run k6-tests/load-test.js -e BASE_URL=http://your-fargate-alb.amazonaws.com
```

---

## 📈 Understanding the Metrics

### During the Test (Real-time Logs)

You'll see progress updates like:
```
📊 Progress Update [Request #50]
   • Active VUs: 100
   • Response Time: 1234ms
   • CPU Time: 1.19s | I/O Time: 0.01s
   • Primes Found: 41538
```

### After the Test (Final Summary)

k6 will show comprehensive metrics:

#### 1. **Latency Metrics** (Response Time)
```
http_req_duration..............: avg=1234ms  p(50)=1200ms  p(95)=2500ms  p(99)=4000ms
```
- `avg` = Average response time
- `p(50)` = 50% of requests faster than this (median)
- `p(95)` = 95% of requests faster than this
- `p(99)` = 99% of requests faster than this

#### 2. **Custom CPU/IO Metrics**
```
custom_cpu_time_ms.............: avg=1190ms  p(90)=1250ms  p(95)=1300ms
custom_io_time_ms..............: avg=10ms    p(90)=15ms    p(95)=20ms
```
- Shows breakdown of computation vs I/O time

#### 3. **Throughput Metrics**
```
http_reqs......................: 12500  52.5/s
iterations.....................: 12500  52.5/s
```
- Total requests and requests per second

#### 4. **Error Metrics**
```
http_req_failed................: 0.50%  62 out of 12500
throttled_requests.............: 25
server_errors..................: 5
```
- Failure rate and error counts

#### 5. **Machine Performance** (from CloudWatch when deployed)
- CPU utilization %
- Memory utilization %
- Network I/O

#### 6. **Checks** (Pass/Fail)
```
✓ status ok or throttled
checks.........................: 100.00%  12500 out of 12500
```

---

## 🎯 Production Scale Test Details

**For 350k DAU:**
- Peak concurrent users: ~14,500 (4% of DAU at peak hour)
- Test simulates: Up to 500 VUs
- Duration: ~3 minutes (COMPRESSED)
- Stages:
  1. Warmup (10s): 10 → 50 VUs
  2. Morning ramp (15s): 50 → 100 VUs
  3. Traffic increase (15s): 100 → 200 VUs
  4. Pre-peak (20s): 200 → 300 VUs
  5. Peak ramp (20s): 300 → 400 VUs
  6. Maximum load (20s): 400 → 500 VUs
  7. Sustained peak (30s): 500 VUs
  8. Evening decline (15s): 500 → 300 VUs
  9. Wind down (15s): 300 → 150 VUs
  10. Cooldown (10s): 150 → 0 VUs

**Performance Thresholds:**
- ✅ P50 < 2000ms
- ✅ P90 < 3000ms
- ✅ P95 < 5000ms
- ✅ P99 < 8000ms
- ✅ Error rate < 1%
- ✅ Throughput > 20 req/s
- ✅ Throttled requests < 100
- ✅ Server errors < 50

---

## 📊 Comparing ECS+EC2 vs Fargate

Run the same test on both platforms and compare:

### Metrics to Compare:

1. **Latency:**
   - P50, P95, P99 response times
   - Which platform is faster?

2. **Throughput:**
   - Requests per second
   - Which handles more load?

3. **Stability:**
   - Error rate
   - Throttling count
   - Which is more stable?

4. **Resource Usage (CloudWatch):**
   - CPU utilization
   - Memory utilization
   - Which is more efficient?

5. **Cost:**
   - Calculate cost per 1000 requests
   - Which is more cost-effective?

---

## 💡 Tips

1. **Start with smoke test** to validate setup
2. **Monitor CloudWatch** during full load test
3. **Save k6 output** for comparison:
   ```bash
   k6 run k6-tests/load-test.js | tee ec2-results.txt
   k6 run k6-tests/load-test.js -e BASE_URL=http://fargate | tee fargate-results.txt
   ```
4. **Adjust VUs** if needed based on your server capacity

---

## 🚨 What to Watch For

**Good Signs:**
- ✅ P95 latency stays under threshold
- ✅ Error rate < 1%
- ✅ Steady throughput
- ✅ No throttling

**Warning Signs:**
- ⚠️ Increasing latency over time
- ⚠️ Rising error rate
- ⚠️ Throttling occurring
- ⚠️ CPU/Memory maxing out

---

## 📝 Example Output

```
╔════════════════════════════════════════════════════════════════╗
║      🚀 K6 PRODUCTION LOAD TEST - 350K DAU SIMULATION        ║
╚════════════════════════════════════════════════════════════════╝

📍 Target URL: http://localhost:8000/heavy/cpu-io-no-db/
👥 Production Scale: 350,000 Daily Active Users
⚡ Peak Concurrent: ~14,500 users (4% of DAU)
🧪 Test Scale: Up to 500 Virtual Users
⏱️  Total Duration: ~43 minutes

... test runs ...

✅ Smoke Test Completed!

CUSTOM
custom_cpu_time_ms.............: avg=1190ms  p(95)=1300ms
custom_io_time_ms..............: avg=10ms    p(95)=20ms

HTTP
http_req_duration..............: avg=1234ms  p(95)=2500ms
http_req_failed................: 0.50%

EXECUTION
http_reqs......................: 12500  52.5/s
```
