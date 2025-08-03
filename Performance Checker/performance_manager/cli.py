import argparse
import os
import sys

from performance_manager import analyzer, profiler, coverage


def run_cli():
    parser = argparse.ArgumentParser(description="Performance Manager CLI")
    parser.add_argument("script", nargs='?', help="Python script to analyze")
    parser.add_argument("--no-time-coverage", action='store_true')
    parser.add_argument("--no-cpu", action='store_true')
    parser.add_argument("--no-line-coverage", action='store_true')

    args = parser.parse_args()

    if not args.script:
        parser.print_help()
        sys.exit(0)

    if not os.path.isfile(args.script):
        print(f"Script '{args.script}' not found.")
        sys.exit(1)

    with open(args.script, "r") as file:
        code = file.read()

    print("[*] Static Analysis:")
    analyzer.analyze_code(code)

    print("\n[*] Profiling:")
    if not args.no_time_coverage:
        profiler.profile_script(args.script)

    if not args.no_cpu:
        profiler.cpu_gpu_usage()

    if not args.no_line_coverage:
        print("\n[*] Line Coverage in a .cover file")
        coverage.run_coverage(args.script)
