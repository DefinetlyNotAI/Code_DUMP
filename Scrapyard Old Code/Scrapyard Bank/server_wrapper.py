#!/usr/bin/env python3
import signal
import subprocess
import sys
import time

# Maximum number of restarts before giving up
MAX_RESTARTS = 10
# Time to wait between restarts (in seconds)
RESTART_DELAY = 5
# Time window for restart counting (in seconds)
RESTART_WINDOW = 300  # 5 minutes

# Track restarts
restart_times = []


def signal_handler(sig):
    """Handle termination signals by cleaning up the child process."""
    print(f"Received signal {sig}, shutting down...")
    if current_process:
        print("Terminating Flask server...")
        try:
            current_process.terminate()
            current_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            print("Flask server did not terminate gracefully, killing...")
            current_process.kill()
    else:
        print("No running process to terminate.")
    sys.exit(0)


# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def monitor_output(process):
    """Monitor the process output for specific error messages."""
    while True:
        # Read a line from stderr
        line = process.stderr.readline()
        if not line and process.poll() is not None:
            break

        if line:
            # Log
            print(f"{line.strip().replace('INFO:werkzeug:', '').replace('INFO:__main__:', '')}")

            # Check for the specific database connection error
            if "psycopg2.OperationalError" in line and "could not translate host name" in line:
                print("Database connection error detected! Restarting server...")
                return True  # Signal that we need to restart

            # Check for other critical errors that might require restart
            if "Error in database connection" in line:
                print("Database connection error detected! Restarting server...")
                return True

    # If we get here, the process exited without the specific error
    exit_code = process.poll()
    print(f"Flask server exited with code {exit_code}")
    return exit_code != 0  # Restart if exit code is non-zero


if __name__ == "__main__":
    print("Server wrapper starting...")
    restart_count = 0

    while True:
        # Clean up old restart times
        current_time = time.time()
        restart_times = [t for t in restart_times if current_time - t < RESTART_WINDOW]

        # Check if we've restarted too many times
        if len(restart_times) >= MAX_RESTARTS:
            print(
                f"Too many restarts ({len(restart_times)}) in the last {RESTART_WINDOW} seconds. Giving up.")
            sys.exit(1)

        # Start the server
        print("Starting Flask server...")

        # Use sys.executable to ensure we use the same Python interpreter
        current_process = subprocess.Popen(
            [sys.executable, "app.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
            bufsize=1  # Line buffered
        )

        # Record the restart time
        restart_times.append(time.time())
        restart_count += 1

        # Monitor the server output
        needs_restart = monitor_output(current_process)

        # If the server doesn't need to restart, we're done
        if not needs_restart:
            break

        print(f"Waiting {RESTART_DELAY} seconds before restarting...")
        time.sleep(RESTART_DELAY)

        # Try to terminate the process if it's still running
        if current_process.poll() is None:
            print("Terminating Flask server...")
            current_process.terminate()
            try:
                current_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print("Flask server did not terminate gracefully, killing...")
                current_process.kill()
