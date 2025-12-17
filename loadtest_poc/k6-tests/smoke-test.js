import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics for better visibility
const requestCounter = new Counter('custom_requests_total');
const cpuTimeTrend = new Trend('custom_cpu_time_ms');
const ioTimeTrend = new Trend('custom_io_time_ms');

export const options = {
    vus: 10,
    duration: '30s',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// Setup function - runs once before test starts
export function setup() {
    console.log('🚀 Starting k6 Smoke Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Target URL: ${BASE_URL}`);
    console.log(`👥 Virtual Users: 10`);
    console.log(`⏱️  Duration: 30 seconds`);
    console.log(`📊 Test Parameters: prime_limit=200000, hash_rounds=500000, io_kb=64`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Health check before starting
    console.log('🏥 Performing health check...');
    const healthRes = http.get(`${BASE_URL}/heavy/health/`);
    if (healthRes.status === 200) {
        console.log('✅ Health check passed - Server is ready!\n');
    } else {
        console.log('❌ Health check failed - Server may not be ready!\n');
    }
}

export default function () {
    const startTime = new Date().getTime();
    const res = http.get(`${BASE_URL}/heavy/cpu-io-no-db/?prime_limit=200000&hash_rounds=500000&io_kb=64`);

    requestCounter.add(1);

    const checksOk = check(res, {
        'status is 200': (r) => r.status === 200,
        'response has primes_found': (r) => {
            try {
                return JSON.parse(r.body).primes_found !== undefined;
            } catch (e) {
                return false;
            }
        },
    });

    if (res.status === 200) {
        try {
            const body = JSON.parse(res.body);

            // Track custom metrics
            cpuTimeTrend.add(body.cpu_time_sec * 1000);
            ioTimeTrend.add(body.io_time_sec * 1000);

            // Log every 10th request for visibility
            if (requestCounter.value % 10 === 0) {
                console.log(`📈 Request #${requestCounter.value} | ` +
                    `Primes: ${body.primes_found} | ` +
                    `CPU: ${body.cpu_time_sec}s | ` +
                    `I/O: ${body.io_time_sec}s | ` +
                    `Total: ${body.total_time_sec}s`);
            }
        } catch (e) {
            console.log(`⚠️  Failed to parse response: ${e.message}`);
        }
    } else {
        console.log(`❌ Request failed with status: ${res.status}`);
    }

    sleep(0.5);
}

// Teardown function - runs once after test completes
export function teardown(data) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Smoke Test Completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}
