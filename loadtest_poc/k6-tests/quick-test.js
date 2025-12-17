import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import exec from 'k6/execution';

// Metrics
const totalLatency = new Trend('latency_total_ms');
const cpuTimeTrend = new Trend('custom_cpu_time_ms');
const ioTimeTrend = new Trend('custom_io_time_ms');
const throttled = new Counter('throttled_requests');
const serverErrors = new Counter('server_errors');
const successfulRequests = new Counter('successful_requests');

export const options = {
    scenarios: {
        quick_load: {
            executor: 'ramping-vus',
            startVUs: 10,
            stages: [
                { duration: '15s', target: 10 },   // Ramp up
                { duration: '30s', target: 20 },    // Peak load
                { duration: '30s', target: 0 },     // Ramp down
            ],
        },
    },

    thresholds: {
        latency_total_ms: ['p(95)<5000'],
        'http_req_failed': ['rate<0.01'],
        'http_reqs': ['rate>20'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export function setup() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         🚀 K6 QUICK LOAD TEST - 2 MINUTES                    ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📍 Target: ${BASE_URL}/heavy/cpu-io-no-db/`);
    console.log(`⏱️  Duration: 2 minutes`);
    console.log(`👥 Max VUs: 200`);
    console.log('');
    console.log('📈 Stages:');
    console.log('   1. Ramp up (30s): 10 → 20 VUs');
    console.log('   2. Peak load (30s): 20 → 20 VUs');
    console.log('   3. Ramp down (30s): 20 → 0 VUs');
    console.log('');

    console.log('🏥 Health check...');
    const healthRes = http.get(`${BASE_URL}/heavy/health/`);
    if (healthRes.status === 200) {
        console.log('✅ Server ready!\n');
    } else {
        console.log('❌ Server not ready!\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 Starting test...\n');

    return { startTime: new Date().toISOString() };
}

export default function () {
    const url = `${BASE_URL}/heavy/cpu-io-no-db/?prime_limit=500000&hash_rounds=1000000&io_kb=128`;
    const res = http.get(url, { timeout: '120s' });

    totalLatency.add(res.timings.duration);

    if (res.status === 429) {
        throttled.add(1);
        console.log(`⚠️  Throttled (429)`);
    }

    if (res.status >= 500) {
        serverErrors.add(1);
        console.log(`❌ Server error (${res.status})`);
    }

    check(res, {
        'status ok or throttled': (r) => r.status === 200 || r.status === 429,
    });

    if (res.status === 200) {
        successfulRequests.add(1);

        try {
            const body = JSON.parse(res.body);
            cpuTimeTrend.add(body.cpu_time_sec * 1000);
            ioTimeTrend.add(body.io_time_sec * 1000);

            if (successfulRequests.value % 25 === 0) {
                console.log(`📊 [#${successfulRequests.value}] VUs: ${exec.instance.vusActive} | ` +
                    `Response: ${Math.round(res.timings.duration)}ms | ` +
                    `CPU: ${body.cpu_time_sec}s`);
            }
        } catch (e) {
            console.log(`⚠️  Parse error: ${e.message}`);
        }
    }

    sleep(1);
}

export function teardown(data) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 Test Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Started: ${data.startTime}`);
    console.log(`⏱️  Ended: ${new Date().toISOString()}`);
    console.log('');
}
