# 🚀 QUICK START - Run Load Tests Now!

## ✅ Start the Django API

```bash
cd loadtest_poc
source venv/bin/activate
python manage.py runserver 8000
```

---

## 📊 Option 1: SMOKE TEST (30 seconds - Start Here!)

```bash
cd loadtest_poc
k6 run k6-tests/smoke-test.js
```

**You'll see:**
```
🚀 Starting k6 Smoke Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Target URL: http://localhost:8000
👥 Virtual Users: 10
⏱️  Duration: 30 seconds
📊 Test Parameters: prime_limit=200000, hash_rounds=500000, io_kb=64
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏥 Performing health check...
✅ Health check passed - Server is ready!

📈 Request #10 | Primes: 18000 | CPU: 0.65s | I/O: 0.01s | Total: 0.66s
📈 Request #20 | Primes: 18000 | CPU: 0.64s | I/O: 0.01s | Total: 0.65s
...

✅ Smoke Test Completed!

CUSTOM METRICS (Your Machine Performance):
custom_cpu_time_ms.............: avg=650ms   p(90)=700ms   p(95)=750ms
custom_io_time_ms..............: avg=10ms    p(90)=15ms    p(95)=20ms

HTTP METRICS (Latency & Response Time):
http_req_duration..............: avg=720ms   p(50)=700ms   p(95)=850ms   p(99)=900ms
http_req_failed................: 0.00%       ← Error rate
http_reqs......................: 244 (7.9/s) ← Throughput

THROTTLING & ERRORS:
throttled_requests.............: 0           ← No throttling
server_errors..................: 0           ← No errors

✓ status is 200
✓ response has primes_found
checks.........................: 100.00%     ← Success rate
```

---

## 🔥 Option 2: PRODUCTION LOAD TEST (43 minutes - 350k DAU Scale!)

```bash
cd loadtest_poc
k6 run k6-tests/load-test.js
```

**You'll see:**
```
╔════════════════════════════════════════════════════════════════╗
║      🚀 K6 PRODUCTION LOAD TEST - 350K DAU SIMULATION        ║
╚════════════════════════════════════════════════════════════════╝

📍 Target URL: http://localhost:8000/heavy/cpu-io-no-db/
👥 Production Scale: 350,000 Daily Active Users
⚡ Peak Concurrent: ~14,500 users (4% of DAU)
🧪 Test Scale: Up to 500 Virtual Users
⏱️  Total Duration: ~43 minutes

📊 API Load Parameters:
   • Prime Limit: 500,000
   • Hash Rounds: 1,000,000
   • I/O Size: 128 KB
   • Expected Response Time: ~1.2s per request

📈 Load Test Stages (Production Traffic Pattern):
    1. Warmup (10→50)                → 50 VUs (2m)
    2. Morning Ramp (50→100)         → 100 VUs (3m)
    3. Traffic Increase (100→200)    → 200 VUs (3m)
    4. Pre-Peak (200→300)            → 300 VUs (5m)
    5. Peak Ramp (300→400)           → 400 VUs (5m)
    6. Maximum Load (400→500)        → 500 VUs (5m)
    7. Sustained Peak (500 VUs)      → 500 VUs (10m)
    8. Evening Decline (500→300)     → 300 VUs (3m)
    9. Wind Down (300→150)           → 150 VUs (3m)
   10. Cooldown (150→0)              → 0 VUs (2m)

🎯 Production Performance Thresholds:
   • P50 Latency: < 2000ms
   • P90 Latency: < 3000ms
   • P95 Latency: < 5000ms
   • P99 Latency: < 8000ms
   • Request Rate: > 50 req/s
   • Error Rate: < 1%
   • Throttled Requests: < 100
   • Server Errors: < 50

🏥 Performing health check...
✅ Health check passed - Server is ready!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏁 Starting Load Test...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

... test runs with progress updates every 50 requests ...

📊 Progress Update [Request #50]
   • Active VUs: 100
   • Response Time: 1234ms
   • CPU Time: 1.19s | I/O Time: 0.01s
   • Primes Found: 41538

📊 Progress Update [Request #100]
   • Active VUs: 200
   • Response Time: 1456ms
   • CPU Time: 1.21s | I/O Time: 0.02s
   • Primes Found: 41538

... continues for 43 minutes ...

🏁 Load Test Completed!

⏱️  Started: 2025-12-17T18:00:00
⏱️  Ended: 2025-12-17T18:43:00

FINAL METRICS:

CUSTOM (Machine Performance):
custom_cpu_time_ms.............: avg=1190ms  p(90)=1250ms  p(95)=1300ms  p(99)=1400ms
custom_io_time_ms..............: avg=10ms    p(90)=15ms    p(95)=20ms    p(99)=30ms

HTTP (Latency & Response Time):
http_req_duration..............: avg=1234ms  p(50)=1200ms  p(90)=2500ms  p(95)=3200ms  p(99)=4500ms
http_req_failed................: 0.50%       ← 0.5% error rate (GOOD!)
http_reqs......................: 15000 (58/s) ← 58 requests/second

THROTTLING:
throttled_requests.............: 25          ← Some throttling occurred
server_errors..................: 5           ← 5 server errors

CHECKS:
✓ status ok or throttled
checks.........................: 99.50%      ← 99.5% success rate

THRESHOLDS:
✓ latency_total_ms..............: p(50)<2000ms ✅
✓ latency_total_ms..............: p(95)<5000ms ✅
✓ http_req_failed...............: rate<0.01 ✅
✓ http_reqs.....................: rate>50 ✅
```

---

## 📊 What Each Metric Means

### 🖥️ Machine Performance
- `custom_cpu_time_ms` = How long CPU computation takes
- `custom_io_time_ms` = How long file I/O takes
- Shows if bottleneck is CPU or I/O

### ⏱️ Latency (Response Time)
- `http_req_duration` = Total time from request to response
- `p(50)` = Median (50% faster than this)
- `p(95)` = 95th percentile (95% faster than this)
- `p(99)` = 99th percentile (only 1% slower)

### 🚦 Throttling
- `throttled_requests` = How many requests got 429 status
- Indicates if server is rate-limiting

### ❌ Errors
- `http_req_failed` = Percentage of failed requests
- `server_errors` = Count of 5xx errors
- Lower is better!

### 📈 Throughput
- `http_reqs` = Total requests and rate (req/s)
- Higher is better!

---

## 🎯 What to Look For

### ✅ GOOD Signs:
- P95 latency stays consistent
- Error rate < 1%
- No throttling
- Throughput stays steady

### ⚠️ WARNING Signs:
- Latency increasing over time
- Error rate > 1%
- Throttling occurring
- Throughput dropping

---

## 💡 Pro Tips

1. **Start with smoke test** to validate everything works
2. **Monitor CloudWatch** during production load test (when deployed to AWS)
3. **Save results** for comparison:
   ```bash
   k6 run k6-tests/load-test.js | tee results-local.txt
   ```
4. **Compare platforms:**
   ```bash
   # Test EC2
   k6 run k6-tests/load-test.js -e BASE_URL=http://ec2-alb | tee results-ec2.txt
   
   # Test Fargate
   k6 run k6-tests/load-test.js -e BASE_URL=http://fargate-alb | tee results-fargate.txt
   ```

---

## 🚀 Ready? Run This Now:

```bash
cd loadtest_poc
k6 run k6-tests/smoke-test.js
```

This will show you ALL the metrics in action! 🎉
