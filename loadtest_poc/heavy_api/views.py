import math
import hashlib
import time
import os
import threading
from django.http import JsonResponse

# ---------------------------
# Configuration
# ---------------------------
IO_FILE = "/tmp/django_load_test_io.bin"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB cap
io_lock = threading.Lock()


def _ensure_file():
    """Create file once to avoid cold-start skew"""
    if not os.path.exists(IO_FILE):
        with open(IO_FILE, "wb") as f:
            f.write(os.urandom(1024 * 1024))  # 1 MB initial file


def health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({
        "status": "healthy",
        "timestamp": time.time()
    })


def heavy_cpu_io_no_db(request):
    """
    Heavy computation endpoint with configurable CPU and I/O operations.
    
    Query Parameters:
    - prime_limit: Upper limit for prime number calculation (default: 500,000)
    - hash_rounds: Number of SHA-256 hashing rounds (default: 1,000,000)
    - io_kb: Size of I/O operations in KB (default: 128)
    
    Returns:
    JSON response with computation results and timing metrics
    """
    # Parse query parameters with HEAVY defaults for real load testing
    prime_limit = int(request.GET.get("prime_limit", 500_000))
    hash_rounds = int(request.GET.get("hash_rounds", 1_000_000))
    io_kb = int(request.GET.get("io_kb", 128))

    _ensure_file()
    start = time.time()

    # ---------------------------
    # 1️⃣ CPU: Prime computation
    # ---------------------------
    primes_count = 0
    for num in range(2, prime_limit):
        is_prime = True
        limit = int(math.sqrt(num)) + 1
        for i in range(2, limit):
            if num % i == 0:
                is_prime = False
                break
        if is_prime:
            primes_count += 1

    # ---------------------------
    # 2️⃣ CPU: Hashing
    # ---------------------------
    value = b"django-load-test"
    for _ in range(hash_rounds):
        value = hashlib.sha256(value).digest()

    cpu_end = time.time()

    # ---------------------------
    # 3️⃣ I/O: File write + lock
    # ---------------------------
    data = os.urandom(io_kb * 1024)

    with io_lock:
        if os.path.getsize(IO_FILE) < MAX_FILE_SIZE:
            with open(IO_FILE, "ab") as f:
                f.write(data)
                f.flush()
                os.fsync(f.fileno())

    # ---------------------------
    # 4️⃣ I/O: File read
    # ---------------------------
    with io_lock:
        with open(IO_FILE, "rb") as f:
            _ = f.read(io_kb * 1024)

    end = time.time()

    return JsonResponse({
        "primes_found": primes_count,
        "prime_limit": prime_limit,
        "hash_rounds": hash_rounds,
        "io_kb": io_kb,
        "cpu_time_sec": round(cpu_end - start, 2),
        "total_time_sec": round(end - start, 2),
        "io_time_sec": round(end - cpu_end, 2),
    })
