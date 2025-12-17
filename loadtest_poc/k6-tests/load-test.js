import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import exec from 'k6/execution';

// Explicit metrics
const totalLatency = new Trend('latency_total_ms');
const serverTime = new Trend('latency_server_ms');
const queueTime = new Trend('latency_queue_ms');
const cpuTimeTrend = new Trend('custom_cpu_time_ms');
const ioTimeTrend = new Trend('custom_io_time_ms');

const throttled = new Counter('throttled_requests');
const serverErrors = new Counter('server_errors');
const successfulRequests = new Counter('successful_requests');

export const options = {
    scenarios: {
        // Production Load Test - Simulating 350k DAU (COMPRESSED to 3 minutes)
        // Peak concurrent users: ~14,500 (assuming 4% concurrent at peak hour)
        // Testing up to 500 VUs to stress test the system
        production_load: {
            executor: 'ramping-vus',
            startVUs: 10,
            stages: [
                // Warmup phase
                { duration: '10s', target: 50 },

                // Morning traffic ramp
                { duration: '15s', target: 100 },
                { duration: '15s', target: 200 },

                // Peak hours simulation
                { duration: '20s', target: 300 },
                { duration: '20s', target: 400 },
                { duration: '20s', target: 500 },  // Peak load

                // Sustained peak
                { duration: '30s', target: 500 },

                // Evening decline
                { duration: '15s', target: 300 },
                { duration: '15s', target: 150 },

                // Cooldown
                { duration: '10s', target: 0 },
            ],
        },
    },

    thresholds: {
        // Production-grade thresholds for 350k DAU
        latency_total_ms: [
            'p(50)<2000',   // 50% of requests under 2s
            'p(90)<3000',   // 90% of requests under 3s
            'p(95)<5000',   // 95% of requests under 5s
            'p(99)<8000',   // 99% of requests under 8s
        ],
        'http_req_failed': ['rate<0.01'],  // Less than 1% failure rate
        throttled_requests: ['count<100'],
        server_errors: ['count<50'],
        'http_reqs': ['rate>20'],  // Minimum 20 requests/sec
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// Production load stages for logging
const stages = [
    { name: 'Warmup (10→50)', target: 50, duration: '10s' },
    { name: 'Morning Ramp (50→100)', target: 100, duration: '15s' },
    { name: 'Traffic Increase (100→200)', target: 200, duration: '15s' },
    { name: 'Pre-Peak (200→300)', target: 300, duration: '20s' },
    { name: 'Peak Ramp (300→400)', target: 400, duration: '20s' },
    { name: 'Maximum Load (400→500)', target: 500, duration: '20s' },
    { name: 'Sustained Peak (500 VUs)', target: 500, duration: '30s' },
    { name: 'Evening Decline (500→300)', target: 300, duration: '15s' },
    { name: 'Wind Down (300→150)', target: 150, duration: '15s' },
    { name: 'Cooldown (150→0)', target: 0, duration: '10s' },
];

// Setup function - runs once before test starts
export function setup() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║      🚀 K6 PRODUCTION LOAD TEST - 350K DAU SIMULATION        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📍 Target URL: ${BASE_URL}/heavy/cpu-io-no-db/`);
    console.log(`👥 Production Scale: 350,000 Daily Active Users`);
    console.log(`⚡ Peak Concurrent: ~14,500 users (4% of DAU)`);
    console.log(`🧪 Test Scale: Up to 500 Virtual Users`);
    console.log(`⏱️  Total Duration: ~3 minutes (COMPRESSED)`);
    console.log('');
    console.log(`📊 API Load Parameters:`);
    console.log(`   • Prime Limit: 500,000`);
    console.log(`   • Hash Rounds: 1,000,000`);
    console.log(`   • I/O Size: 128 KB`);
    console.log(`   • Expected Response Time: ~1.2s per request`);
    console.log('');
    console.log('📈 Load Test Stages (Production Traffic Pattern):');
    stages.forEach((stage, idx) => {
        console.log(`   ${String(idx + 1).padStart(2)}. ${stage.name.padEnd(30)} → ${String(stage.target).padStart(3)} VUs (${stage.duration})`);
    });
    console.log('');
    console.log('🎯 Production Performance Thresholds:');
    console.log('   • P50 Latency: < 2000ms');
    console.log('   • P90 Latency: < 3000ms');
    console.log('   • P95 Latency: < 5000ms');
    console.log('   • P99 Latency: < 8000ms');
    console.log('   • Request Rate: > 20 req/s');
    console.log('   • Error Rate: < 1%');
    console.log('   • Throttled Requests: < 100');
    console.log('   • Server Errors: < 50');
    console.log('');

    // Health check before starting
    console.log('🏥 Performing health check...');
    const healthRes = http.get(`${BASE_URL}/heavy/health/`);
    if (healthRes.status === 200) {
        console.log('✅ Health check passed - Server is ready!');
    } else {
        console.log('❌ Health check failed - Server may not be ready!');
        console.log(`   Status: ${healthRes.status}`);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 Starting Load Test...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    return { startTime: new Date().toISOString() };
}

export default function () {
    const url =
        `${BASE_URL}/heavy/cpu-io-no-db/` +
        `?prime_limit=500000&hash_rounds=1000000&io_kb=128`;

    const res = http.get(url, { timeout: '120s' });

    // Explicit metric capture
    totalLatency.add(res.timings.duration);
    serverTime.add(res.timings.waiting);
    queueTime.add(
        res.timings.blocked + res.timings.connect
    );

    if (res.status === 429) {
        throttled.add(1);
        console.log(`⚠️  Request throttled (429) - VUs: ${exec.vu.idInTest}`);
    }

    if (res.status >= 500) {
        serverErrors.add(1);
        console.log(`❌ Server error (${res.status}) - VUs: ${exec.vu.idInTest}`);
    }

    const checksOk = check(res, {
        'status ok or throttled': (r) =>
            r.status === 200 || r.status === 429,
    });

    if (res.status === 200) {
        successfulRequests.add(1);

        try {
            const body = JSON.parse(res.body);
            cpuTimeTrend.add(body.cpu_time_sec * 1000);
            ioTimeTrend.add(body.io_time_sec * 1000);

            // Log every 50th successful request
            if (successfulRequests.value % 50 === 0) {
                console.log(`📊 Progress Update [Request #${successfulRequests.value}]`);
                console.log(`   • Active VUs: ${exec.instance.vusActive}`);
                console.log(`   • Response Time: ${Math.round(res.timings.duration)}ms`);
                console.log(`   • CPU Time: ${body.cpu_time_sec}s | I/O Time: ${body.io_time_sec}s`);
                console.log(`   • Primes Found: ${body.primes_found}`);
                if (throttled.value > 0) {
                    console.log(`   ⚠️  Throttled: ${throttled.value} requests`);
                }
                if (serverErrors.value > 0) {
                    console.log(`   ❌ Errors: ${serverErrors.value} requests`);
                }
                console.log('');
            }
        } catch (e) {
            console.log(`⚠️  Failed to parse response body: ${e.message}`);
        }
    }

    sleep(1);
}

// Teardown function - runs once after test completes
export function teardown(data) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 Load Test Completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`⏱️  Started: ${data.startTime}`);
    console.log(`⏱️  Ended: ${new Date().toISOString()}`);
    console.log('');
    console.log('📋 Check the summary above for detailed metrics and threshold results.');
    console.log('');
    console.log('💡 Tip: Look for the following in the results:');
    console.log('   • http_req_duration - Response time metrics');
    console.log('   • custom_cpu_time_ms - CPU computation time');
    console.log('   • custom_io_time_ms - I/O operation time');
    console.log('   • checks - Success rate of requests');
    console.log('');
}
