"""
scripts/benchmark_predict.py - Latency benchmark for /api/predict endpoint.
Measures wall-clock latency over 50 calls to verify the < 300 ms SLA requirement.
"""
import time
import warnings
warnings.filterwarnings("ignore")
import numpy as np
from fastapi.testclient import TestClient
from backend.app.main import app


def run_benchmark(num_calls: int = 50):
    client = TestClient(app)
    payload = {
        "title": "Interstellar: The Horizon",
        "budget": 165000000,
        "genres": ["Adventure", "Drama", "Science Fiction"],
        "release_date": "2014-11-05",
        "runtime": 169,
        "original_language": "en",
        "production_companies": ["Paramount Pictures", "Legendary Entertainment", "Syncopy"],
        "cast": ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
        "director": "Christopher Nolan",
        "franchise": 0,
        "vote_average": 8.1,
        "vote_count": 10867,
        "popularity": 72.4
    }

    # Warmup call
    warmup_res = client.post("/api/predict", json=payload)
    assert warmup_res.status_code == 200, f"Warmup failed with code {warmup_res.status_code}"

    latencies_ms = []
    print(f"Executing {num_calls} calls against /api/predict...")

    for i in range(num_calls):
        t0 = time.perf_counter()
        res = client.post("/api/predict", json=payload)
        t1 = time.perf_counter()
        assert res.status_code == 200, f"Call {i+1} failed"
        latencies_ms.append((t1 - t0) * 1000.0)

    p50 = float(np.percentile(latencies_ms, 50))
    p90 = float(np.percentile(latencies_ms, 90))
    p95 = float(np.percentile(latencies_ms, 95))
    p99 = float(np.percentile(latencies_ms, 99))
    min_l = float(np.min(latencies_ms))
    max_l = float(np.max(latencies_ms))
    mean_l = float(np.mean(latencies_ms))

    print("\n=======================================================")
    print("        BoxOffice Oracle /predict Latency Report        ")
    print("=======================================================")
    print(f"Total Requests:     {num_calls}")
    print(f"Minimum Latency:    {min_l:.2f} ms")
    print(f"Mean Latency:       {mean_l:.2f} ms")
    print(f"p50 (Median):       {p50:.2f} ms")
    print(f"p90 Latency:        {p90:.2f} ms")
    print(f"p95 Latency:        {p95:.2f} ms")
    print(f"p99 Latency:        {p99:.2f} ms")
    print(f"Maximum Latency:    {max_l:.2f} ms")
    print(f"SLA Target (<300ms): {'PASSED [OK]' if p95 < 300 else 'FAILED'}")
    print("=======================================================\n")

    return {
        "num_calls": num_calls,
        "min_ms": round(min_l, 2),
        "mean_ms": round(mean_l, 2),
        "p50_ms": round(p50, 2),
        "p90_ms": round(p90, 2),
        "p95_ms": round(p95, 2),
        "p99_ms": round(p99, 2),
        "max_ms": round(max_l, 2),
        "sla_passed": p95 < 300,
    }

if __name__ == "__main__":
    run_benchmark(50)
