from __future__ import annotations

import datetime


# TPrintColors contains the ANSI color codes and additional highlights
class TPrintColors:
    # Basic Colors
    WHITE = '\033[97m'
    BLACK = '\033[30m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    _RESET = '\033[0m'

    # Bright Colors
    BRIGHT_WHITE = '\033[97;1m'
    BRIGHT_BLACK = '\033[30;1m'
    BRIGHT_RED = '\033[91;1m'
    BRIGHT_GREEN = '\033[92;1m'
    BRIGHT_YELLOW = '\033[93;1m'
    BRIGHT_BLUE = '\033[94;1m'
    BRIGHT_MAGENTA = '\033[95;1m'
    BRIGHT_CYAN = '\033[96;1m'

    # Background Colors
    BG_WHITE = '\033[47m'
    BG_BLACK = '\033[40m'
    BG_RED = '\033[41m'
    BG_GREEN = '\033[42m'
    BG_YELLOW = '\033[43m'
    BG_BLUE = '\033[44m'
    BG_MAGENTA = '\033[45m'
    BG_CYAN = '\033[46m'

    # Text Styles
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    REVERSED = '\033[7m'


# TPrint class handles the printing mechanism
class TPrint:
    def __init__(self,
                 color_scheme: dict[str, str] = None,
                 debug_mode: bool = False,
                 log_file: str | None = None,
                 use_timestamps: bool = False,
                 purge_old_logs: bool = False
                 ):

        self.default_colors = {
            'info': TPrintColors.WHITE,
            'warning': TPrintColors.YELLOW,
            'error': TPrintColors.RED,
            'debug': TPrintColors.CYAN,
            'input': TPrintColors.GREEN,
            'critical': TPrintColors.RED,
            'success': TPrintColors.GREEN
        }

        unknown_keys = set(color_scheme) - set(self.default_colors)
        if unknown_keys:
            raise ValueError(f"Unknown keys in color_scheme: {unknown_keys}")

        # Use user-supplied scheme or merge it with defaults
        self.color_scheme = {**self.default_colors, **(color_scheme or {})}
        self.debug_mode = debug_mode
        self.log_file = log_file
        self.use_timestamps = use_timestamps
        self.purge_old_logs = purge_old_logs

    # noinspection PyProtectedMember
    @staticmethod
    def __print_message(message, color: TPrintColors, symbol: str, timestamp: str = None, style=None):
        # Apply style (bold, underline, reversed) if provided
        styled_message = f"{style}{message}" if style else message
        # Print the formatted message with the correct color and timestamp
        if timestamp:
            print(f"{color}[{symbol}][{timestamp}] {styled_message}{TPrintColors._RESET}")
        else:
            print(f"{color}[{symbol}] {styled_message}{TPrintColors._RESET}")

    def __log_message(self, message, symbol: str, timestamp=None):
        # Optionally log messages to a file
        if self.log_file:
            with open(self.log_file, 'a', encoding='utf-8') as log:
                if timestamp:
                    log.write(f"[{symbol}][{timestamp}] {message}\n")
                else:
                    log.write(f"[{symbol}] {message}\n")

    # Log levels
    def info(self, message, log: bool = None, style: TPrintColors = None):
        if log is None:
            log = self.log_file
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S') if self.use_timestamps else None
        self.__print_message(message, self.color_scheme['info'], "*", timestamp, style)
        if log:
            self.__log_message(message, "*", timestamp)

    def warning(self, message, log: bool = False, style: TPrintColors = None):
        if log is None:
            log = self.log_file
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S') if self.use_timestamps else None
        self.__print_message(message, self.color_scheme['warning'], "!", timestamp, style)
        if log:
            self.__log_message(message, "!", timestamp)

    def error(self, message, log: bool = False, style: TPrintColors = None):
        if log is None:
            log = self.log_file
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S') if self.use_timestamps else None
        self.__print_message(message, self.color_scheme['error'], "x", timestamp, style)
        if log:
            self.__log_message(message, "x", timestamp)

    def debug(self, message, log: bool = False, style: TPrintColors = None):
        if log is None:
            log = self.log_file
        if self.debug_mode:  # Only print debug messages if debug mode is enabled
            timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S') if self.use_timestamps else None
            self.__print_message(message, self.color_scheme['debug'], "-", timestamp, style)
            if log:
                self.__log_message(message, "-", timestamp)

    def critical(self, message, log: bool = False, style: TPrintColors = None):
        if log is None:
            log = self.log_file
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S') if self.use_timestamps else None
        self.__print_message(message, self.color_scheme['critical'], "x", timestamp, style)
        if log:
            self.__log_message(message, "x", timestamp)

    def success(self, message, log: bool = False, style: TPrintColors = None):
        if log is None:
            log = self.log_file
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S') if self.use_timestamps else None
        self.__print_message(message, self.color_scheme['success'], "✓", timestamp, style)
        if log:
            self.__log_message(message, "✓", timestamp)

    def input(self, message):
        # For input, use input() instead of print
        return input(f"{self.color_scheme['input']}[?] {message}: ")

    # Setting dynamic updates
    def set_color_scheme(self, color_scheme: dict[str, str]):
        # Allows for dynamic color updates
        self.color_scheme.update(color_scheme)
        unknown_keys = set(color_scheme) - set(self.default_colors)
        if unknown_keys:
            raise ValueError(f"Unknown keys in color_scheme: {unknown_keys}")

    def set_debug_mode(self, debug_mode: bool):
        # Dynamically enable/disable debug mode
        self.debug_mode = debug_mode

    def set_timestamp_usage(self, use_timestamps: bool):
        # Dynamically enable/disable timestamp usage
        self.use_timestamps = use_timestamps

    def set_log_file(self, log_file: str | None):
        # Dynamically change log file name or just disable logging with None
        self.log_file = log_file

    def set_purge_old_logs(self, purge_old_logs: bool):
        # Dynamically change log file name or just disable logging with None
        self.purge_old_logs = purge_old_logs


# noinspection PyProtectedMember
def separator(title):
    print(f"\n{TPrintColors.BOLD}{TPrintColors.MAGENTA}--- {title} ---{TPrintColors._RESET}\n")
