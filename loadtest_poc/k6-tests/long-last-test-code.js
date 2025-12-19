import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import exec from 'k6/execution';

// =====================
// Metrics
// =====================
const totalLatency = new Trend('latency_total_ms');
const cpuTimeTrend = new Trend('custom_cpu_time_ms');
const ioTimeTrend = new Trend('custom_io_time_ms');

const throttled = new Counter('throttled_requests');
const serverErrors = new Counter('server_errors');
const successfulRequests = new Counter('successful_requests');

// =====================
// K6 OPTIONS (AUTOSCALING FRIENDLY)
// =====================
export const options = {
    scenarios: {
        autoscaling_test: {
            executor: 'ramping-vus',
            startVUs: 20,
            stages: [
                { duration: '1m', target: 30 },   // Warm-up
                { duration: '3m', target: 50 },   // Sustained pressure (TRIGGERS ECS scaling)
                { duration: '1m', target: 0 },    // Cool down
            ],
        },
    },

    thresholds: {
        latency_total_ms: ['p(95)<5000'],
        http_req_failed: ['rate<0.01'],
        http_reqs: ['rate>50'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// =====================
// SETUP
// =====================
export function setup() {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     🚀 K6 ECS FARGATE AUTOSCALING LOAD TEST                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📍 Target: ${BASE_URL}/heavy/cpu-io-no-db/`);
    console.log('⏱️  Total duration: ~5 minutes');
    console.log('👥 Peak VUs: 50');
    console.log('');
    console.log('📈 Load Pattern:');
    console.log('   • 1 min warm-up');
    console.log('   • 3 min sustained pressure (autoscaling window)');
    console.log('   • 1 min cool-down');
    console.log('');

    console.log('🏥 Health check...');
    const healthRes = http.get(`${BASE_URL}/heavy/health/`);
    if (healthRes.status === 200) {
        console.log('✅ Server is healthy\n');
    } else {
        console.log('❌ Server health check failed\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 Starting autoscaling test...\n');

    return { startTime: new Date().toISOString() };
}

// =====================
// MAIN LOAD FUNCTION
// =====================
export default function () {
    const url =
        `${BASE_URL}/heavy/cpu-io-no-db/` +
        `?prime_limit=500000&hash_rounds=1000000&io_kb=128`;

    const res = http.get(url, { timeout: '120s' });

    totalLatency.add(res.timings.duration);

    if (res.status === 429) {
        throttled.add(1);
    }

    if (res.status >= 500) {
        serverErrors.add(1);
    }

    check(res, {
        'status ok or throttled': (r) =>
            r.status === 200 || r.status === 429,
    });

    if (res.status === 200) {
        successfulRequests.add(1);

        try {
            const body = JSON.parse(res.body);
            cpuTimeTrend.add(body.cpu_time_sec * 1000);
            ioTimeTrend.add(body.io_time_sec * 1000);

            if (successfulRequests.value % 25 === 0) {
                console.log(
                    `📊 Requests: ${successfulRequests.value} | ` +
                    `VUs: ${exec.instance.vusActive} | ` +
                    `Latency: ${Math.round(res.timings.duration)}ms | ` +
                    `CPU: ${body.cpu_time_sec}s`
                );
            }
        } catch (e) {
            console.log(`⚠️  Response parse error: ${e.message}`);
        }
    }

    // 🔥 CRITICAL FOR AUTOSCALING
    // Keep CPU continuously busy
    sleep(0.1);
}

// =====================
// TEARDOWN
// =====================
export function teardown(data) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 Autoscaling Test Completed');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Started: ${data.startTime}`);
    console.log(`⏱️  Ended: ${new Date().toISOString()}`);
    console.log('');
}