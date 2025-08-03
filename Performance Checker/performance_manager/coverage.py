import trace


def run_coverage(script_path):
    tracer = trace.Trace(count=True, trace=False)
    tracer.run(f"exec(open('{script_path}').read(), {{}})")
    results = tracer.results()
    results.write_results(show_missing=True, coverdir=".")
