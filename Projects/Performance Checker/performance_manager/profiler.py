import time
import tracemalloc
import psutil
import subprocess


def profile_script(script_path):
    start = time.time()
    tracemalloc.start()
    with open(script_path) as f:
        code = compile(f.read(), script_path, 'exec')
        exec(code, {})
    current, peak = tracemalloc.get_traced_memory()
    end = time.time()
    tracemalloc.stop()
    print(f"Execution time: {end - start:.2f}s")
    print(f"Peak memory usage: {peak / 10**6:.2f}MB")


def cpu_gpu_usage():
    print(f"CPU Usage: {psutil.cpu_percent(interval=1)}%")
    # GPU placeholder
    try:
        out = subprocess.check_output("nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits", shell=True)
        print(f"GPU Usage: {out.decode().strip()}%")
    except Exception:
        print("GPU Usage: [!] Could not determine GPU usage (nvidia-smi missing?)")
