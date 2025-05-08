import ctypes
import threading
import time
import random
import os
import string
from pathlib import Path
import pyautogui

# Optional: install these dependencies via pip install pygetwindow
try:
    import pygetwindow as gw
except ImportError:
    gw = None

active_threads = {}
created_files = []


def main_glitch(effect_name):
    effects.get(effect_name, lambda: None)()[0]()


def main_cure(effect_name):
    effects.get(effect_name, lambda: None)()[1]()


# -------- GLITCH DEFINITIONS --------

def screen_flicker():
    stop_flag = {'stop': False}

    def flick():
        while not stop_flag['stop']:
            pyautogui.hotkey('win', 'd')
            time.sleep(0.2)
            pyautogui.hotkey('win', 'd')
            time.sleep(0.3)

    thread = threading.Thread(target=flick)
    thread.start()
    active_threads['screen_flicker'] = (thread, stop_flag)

    def cure():
        stop_flag['stop'] = True

    return lambda: None, cure


def phantom_typing():
    stop_flag = {'stop': False}

    def phantom():
        while not stop_flag['stop']:
            time.sleep(random.uniform(0.3, 1.2))
            pyautogui.typewrite(random.choice(list("THE SYSTEM IS BROKEN...")))

    thread = threading.Thread(target=phantom)
    thread.start()
    active_threads['phantom_typing'] = (thread, stop_flag)

    def cure():
        stop_flag['stop'] = True

    return lambda: None, cure


def taskbar_hide():
    def glitch():
        ctypes.windll.user32.ShowWindow(ctypes.windll.user32.FindWindowW("Shell_TrayWnd", None), 0)

    def cure():
        ctypes.windll.user32.ShowWindow(ctypes.windll.user32.FindWindowW("Shell_TrayWnd", None), 5)

    return glitch, cure


def invert_colors():
    def toggle():
        for key in [0x11, 0x14, 0x5B, 0x43]:  # Ctrl+Alt+Win+C
            ctypes.windll.user32.keybd_event(key, 0, 0, 0)
        time.sleep(0.1)
        for key in [0x11, 0x14, 0x5B, 0x43]:
            ctypes.windll.user32.keybd_event(key, 0, 2, 0)

    return toggle, toggle


def ghost_cursor():
    stop_flag = {'stop': False}

    def move():
        while not stop_flag['stop']:
            x, y = pyautogui.position()
            pyautogui.moveTo(x + 5, y + 5, duration=0.3)
            time.sleep(0.1)

    thread = threading.Thread(target=move)
    thread.start()
    active_threads['ghost_cursor'] = (thread, stop_flag)

    def cure():
        stop_flag['stop'] = True

    return lambda: None, cure


def sound_glitch():
    import winsound
    stop_flag = {'stop': False}

    def loop():
        while not stop_flag['stop']:
            winsound.Beep(random.randint(400, 800), random.randint(50, 200))
            time.sleep(random.uniform(0.2, 0.8))

    thread = threading.Thread(target=loop)
    thread.start()
    active_threads['sound_glitch'] = (thread, stop_flag)

    def cure():
        stop_flag['stop'] = True

    return lambda: None, cure


def file_creation():
    def glitch():
        desktop = Path(os.path.join(os.environ["USERPROFILE"], "Desktop"))
        for _ in range(5):
            name = "GLITCH_" + ''.join(random.choices(string.ascii_uppercase, k=5)) + ".txt"
            file_path = desktop / name
            with open(file_path, 'w') as f:
                f.write("???\nThe system is unstable...\n")
            created_files.append(file_path)

    def cure():
        for f in created_files:
            try:
                os.remove(f)
            except Exception:
                pass
        created_files.clear()

    return glitch, cure


def popup_spam():
    stop_flag = {'stop': False}

    def spam():
        while not stop_flag['stop']:
            ctypes.windll.user32.MessageBoxW(0, "Something went wrong.", "GL!TCH", 0)
            time.sleep(0.5)

    thread = threading.Thread(target=spam)
    thread.start()
    active_threads['popup_spam'] = (thread, stop_flag)

    def cure():
        stop_flag['stop'] = True

    return lambda: None, cure


def window_resize_loop():
    if gw is None:
        return lambda: print("pygetwindow not installed"), lambda: None
    stop_flag = {'stop': False}

    def resize():
        win = gw.getActiveWindow()
        if not win:
            return
        while not stop_flag['stop']:
            win.resizeTo(300, 300)
            time.sleep(0.2)
            win.resizeTo(600, 600)
            time.sleep(0.2)

    thread = threading.Thread(target=resize)
    thread.start()
    active_threads['window_resize_loop'] = (thread, stop_flag)

    def cure():
        stop_flag['stop'] = True

    return lambda: None, cure


def alt_tab_flash():
    def glitch():
        for _ in range(5):
            ctypes.windll.user32.keybd_event(0x12, 0, 0, 0)  # Alt down
            ctypes.windll.user32.keybd_event(0x09, 0, 0, 0)  # Tab down
            time.sleep(0.1)
            ctypes.windll.user32.keybd_event(0x09, 0, 2, 0)  # Tab up
            ctypes.windll.user32.keybd_event(0x12, 0, 2, 0)  # Alt up
            time.sleep(0.3)

    return glitch, lambda: None


# FIXME: This function is not implemented correctly
def task_switch_lock():
    # Briefly disables Alt+Tab and Ctrl+Esc by remapping keys
    user32 = ctypes.windll.user32

    def block_keys():
        # Simulate Alt+Tab and Ctrl+Esc blocking by sending dummy key events
        for key in [0x12, 0x1B]:  # Alt and Esc
            user32.keybd_event(key, 0, 0, 0)  # Key down
            user32.keybd_event(key, 0, 2, 0)  # Key up

    def restore_keys():
        # No actual restoration needed for simulated blocking
        pass

    return block_keys, restore_keys


def glitch_wallpaper():
    original_wallpaper = ctypes.create_unicode_buffer(260)
    ctypes.windll.user32.SystemParametersInfoW(0x0073, 260, original_wallpaper, 0)

    def glitch():
        path = os.path.abspath("fake_wallpaper.bmp")
        with open(path, 'wb') as f:
            f.write(os.urandom(1024 * 768))  # Fake BMP noise
        ctypes.windll.user32.SystemParametersInfoW(20, 0, path, 3)

    def cure():
        ctypes.windll.user32.SystemParametersInfoW(20, 0, original_wallpaper.value, 3)

    return glitch, cure


def fake_blue_screen():
    overlay = None

    def glitch():
        import tkinter as tk
        nonlocal overlay
        overlay = tk.Tk()
        overlay.attributes('-fullscreen', True)
        overlay.configure(bg='blue')
        tk.Label(overlay, text=":(\nYour PC ran into a problem...", fg="white", bg="blue", font=("Consolas", 28)).pack(
            expand=True)
        overlay.after(5000, overlay.destroy)
        overlay.mainloop()

    def cure():
        if overlay is not None:
            overlay.destroy()

    return glitch, cure


def mouse_shake():
    stop_flag = {'stop': False}

    def shake():
        while not stop_flag['stop']:
            x, y = pyautogui.position()
            pyautogui.moveTo(x + random.randint(-10, 10), y + random.randint(-10, 10), duration=0.05)
            time.sleep(0.05)

    thread = threading.Thread(target=shake)
    thread.start()
    active_threads['mouse_shake'] = (thread, stop_flag)

    def cure():
        stop_flag['stop'] = True

    return lambda: None, cure


def ghost_typing():
    stop_flag = {'stop': False}

    def type():
        while not stop_flag['stop']:
            pyautogui.press(random.choice("abcdefghijklmnopqrstuvwxyz"))
            time.sleep(0.1)

    thread = threading.Thread(target=type)
    thread.start()
    active_threads['ghost_typing'] = (thread, stop_flag)

    def cure():
        stop_flag['stop'] = True

    return lambda: None, cure


def keyboard_lock():
    # NOTE: Full keyboard locking requires a system hook – we simulate partial blocking
    stop_flag = {'stop': False}

    def glitch():
        print("[!] Keyboard locked (simulated)")
        time.sleep(3)

    def cure():
        print("[✓] Keyboard unlocked")

    return glitch, cure


def screenshot_loop():
    stop_flag = {'stop': False}

    def capture():
        desktop = Path(os.path.join(os.environ["USERPROFILE"], "Desktop"))
        while not stop_flag['stop']:
            ss_path = desktop / f"GLITCH_SCREEN_{random.randint(1000, 9999)}.png"
            pyautogui.screenshot(str(ss_path))
            created_files.append(ss_path)
            time.sleep(0.5)

    thread = threading.Thread(target=capture)
    thread.start()
    active_threads['screenshot_loop'] = (thread, stop_flag)

    def cure():
        stop_flag['stop'] = True

    return lambda: None, cure


def volume_spike():
    try:
        import pycaw  # If pycaw is installed
    except ImportError:
        return lambda: print("pycaw not installed"), lambda: None

    def glitch():
        # Real volume control requires pycaw/ctypes + COM interfaces
        pass

    return glitch, lambda: None


def fake_update():
    def glitch():
        import tkinter as tk
        root = tk.Tk()
        root.attributes("-fullscreen", True)
        root.configure(bg="black")
        tk.Label(root, text="Working on updates\n0% complete\nDon't turn off your computer",
                 fg="white", bg="black", font=("Segoe UI", 24)).pack(expand=True)
        root.after(6000, root.destroy)
        root.mainloop()

    return glitch, lambda: None


# -------- REGISTRY --------

effects = {
    "screen_flicker": screen_flicker,
    "phantom_typing": phantom_typing,
    "taskbar_hide": taskbar_hide,
    "invert_colors": invert_colors,
    "ghost_cursor": ghost_cursor,
    "sound_glitch": sound_glitch,
    "file_creation": file_creation,
    "popup_spam": popup_spam,
    "window_resize_loop": window_resize_loop,
    "alt_tab_flash": alt_tab_flash,

    "task_switch_lock": task_switch_lock,
    "glitch_wallpaper": glitch_wallpaper,
    "fake_blue_screen": fake_blue_screen,
    "mouse_shake": mouse_shake,
    "ghost_typing": ghost_typing,
    "keyboard_lock": keyboard_lock,
    "screenshot_loop": screenshot_loop,
    "volume_spike": volume_spike,
    "fake_update": fake_update,
}

# -------- MAIN --------
"""
for effect in effects:
    print(f"[*] Running effect: {effect}")
    try:
        main_glitch(effect)
        time.sleep(3)  # Duration of the glitch
        main_cure(effect)
        print(f"[✓] Cured: {effect}")
    except Exception as e:
        print(f"[!] Error with {effect}: {e}")
    time.sleep(1)  # Delay before next glitch
"""

main_glitch("task_switch_lock")
time.sleep(5)
main_cure("task_switch_lock")
