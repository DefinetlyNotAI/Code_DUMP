import os

from tprint import TPrint, TPrintColors, separator

log_file = "tprint_demo_log.txt"

# Ensure clean state
if os.path.exists(log_file):
    os.remove(log_file)

colors = {
    'info': TPrintColors.BRIGHT_BLUE,
    'warning': TPrintColors.BRIGHT_YELLOW,
    'error': TPrintColors.BRIGHT_RED,
    'debug': TPrintColors.BRIGHT_CYAN,
    'critical': TPrintColors.BRIGHT_MAGENTA,
    'success': TPrintColors.BRIGHT_GREEN,
    'input': TPrintColors.BRIGHT_WHITE
}

printer = TPrint(
    color_scheme=colors,
    debug_mode=True,
    log_file=log_file,
    use_timestamps=True,
    purge_old_logs=True
)

# Full style and message types
separator("1. Initial Setup with Custom Color Scheme and All Flags Enabled")
printer.info("Informational message", log=True, style=TPrintColors.BOLD)
printer.warning("Warning message", log=True, style=TPrintColors.UNDERLINE)
printer.error("Error message", log=True, style=TPrintColors.REVERSED)
printer.success("Success achieved!", log=True, style=f"{TPrintColors.BOLD}{TPrintColors.UNDERLINE}")
printer.critical("System has crashed!", log=True, style=TPrintColors.BRIGHT_RED)
printer.debug("Debugging trace enabled!", log=True, style=TPrintColors.BOLD)

separator("2. Input Handling")
name = printer.input("Enter your name")
printer.info(f"Nice to meet you, {name}!", style=TPrintColors.BRIGHT_GREEN)

separator("3. Toggling Timestamp and Debug Mode Off")
printer.set_timestamp_usage(False)
printer.set_debug_mode(False)

printer.info("This message has NO timestamp", log=True)
printer.debug("This debug message SHOULD NOT appear", log=True)

separator("4. Resetting Log File and Logging OFF")
printer.set_log_file(None)
printer.info("This message won't be logged", log=False)

separator("5. Changing Color Scheme Dynamically")
printer.set_color_scheme({'info': TPrintColors.CYAN})
printer.info("Color changed to cyan")

separator("6. Manual Log Purging Check")
# Should not purge old logs this time
printer.set_log_file(log_file)
printer.set_purge_old_logs(False)
printer.info("This message should append to existing log", log=True)

separator("7. Edge Case: Unknown Color Key (Should Raise Error)")
try:
    printer.set_color_scheme({'nonexistent_level': TPrintColors.RED})
except ValueError as e:
    printer.error(f"Caught expected exception: {e}")

separator("8. Mixed Styles and Complex Chaining")
printer.success("Styled success", style=f"{TPrintColors.UNDERLINE}{TPrintColors.BRIGHT_GREEN}")
printer.critical("Styled critical", style=f"{TPrintColors.REVERSED}{TPrintColors.BRIGHT_RED}")

separator("9. Final Debug Enable")
printer.set_debug_mode(True)
printer.debug("Debugging is back!")

separator("10. Log File Contents")
with open(log_file, 'r') as f:
    print(f"{TPrintColors.BRIGHT_BLACK}--- Log File Output ---\n{f.read()}{TPrintColors._RESET}")
