from .profiler import profile_script, cpu_gpu_usage
from .analyzer import analyze_code
from .coverage import run_coverage
import time
import inspect
import tracemalloc


def test(function: callable, *, cover_time=True, cover_cpu=True, cover_lines=True):
    print(f"[+] Testing function: {function.__name__}")

    if cover_time:
        start = time.time()
        tracemalloc.start()

    result = function()

    if cover_time:
        current, peak = tracemalloc.get_traced_memory()
        end = time.time()
        tracemalloc.stop()
        print(f"Execution time: {end - start:.2f}s")
        print(f"Memory usage: {peak / 10 ** 6:.2f}MB")

    if cover_cpu:
        cpu_gpu_usage()

    if cover_lines:
        lines = inspect.getsourcelines(function)[0]
        print(f"Executed {len(lines)} lines in function `{function.__name__}`")

    return result
