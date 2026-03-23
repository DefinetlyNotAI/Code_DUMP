import sys
import cv2
import numpy as np
from PIL import Image, ImageSequence
import os
import shutil
import time
import subprocess
import re
import msvcrt

ASCII = " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"

ANSI_ESCAPE = re.compile(r'\x1b\[[0-9;]*m')


# ---------------- ARG PARSER ----------------
def parse_args(argv):
    flags = {
        "save": False,
        "width": None,
        "height": None
    }

    files = []
    seen_file = False

    i = 0
    while i < len(argv):
        arg = argv[i]

        if arg.startswith("--"):
            if seen_file:
                raise ValueError("Flags cannot appear after files start, please start with the flags!")

            if arg == "--save-file":
                flags["save"] = True

            elif arg == "--width":
                i += 1
                flags["width"] = int(argv[i])

            elif arg == "--height":
                i += 1
                flags["height"] = int(argv[i])

            else:
                raise ValueError(f"Unknown flag: {arg}")

        else:
            seen_file = True
            files.append(arg)

        i += 1

    return flags, files


# ---------------- UTILS ----------------
def strip_ansi(text):
    return ANSI_ESCAPE.sub('', text)


def get_terminal_size():
    size = shutil.get_terminal_size((120, 40))
    return size.columns, size.lines


def resize_terminal(width=None, height=None):
    if os.name != "nt":
        return

    # Do nothing if user did not explicitly request sizing
    if width is None and height is None:
        return

    try:
        term_w, term_h = shutil.get_terminal_size((120, 40))

        target_w = width if width else term_w
        target_h = height if height else term_h

        # Prevent vertical scrolling
        target_h = min(target_h, term_h)

        os.system(f"mode con: cols={target_w} lines={target_h}")
    except:
        pass


def prepare_output_dir(path):
    base = os.path.splitext(os.path.basename(path))[0]
    out_dir = os.path.join(os.getcwd(), base)

    if os.path.exists(out_dir):
        shutil.rmtree(out_dir)

    os.makedirs(out_dir)
    return out_dir


def user_requested_exit():
    if os.name == "nt":
        if msvcrt.kbhit():
            msvcrt.getch()  # consume input
            return True
    return False


# ---------------- IMAGE PROCESSING ----------------
def luminance(px):
    return 0.2126*px[2] + 0.7152*px[1] + 0.0722*px[0]


def sobel(gray):
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, 3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, 3)
    mag = cv2.magnitude(gx, gy)
    return cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX)


def ascii_char(val):
    idx = int(val / 255 * (len(ASCII) - 1))
    return ASCII[idx]


def braille_from_block(block):
    dots = 0
    threshold = block.mean()

    mapping = [
        (0,0,1),(1,0,2),(2,0,4),(0,1,8),
        (1,1,16),(2,1,32),(3,0,64),(3,1,128)
    ]

    for y,x,bit in mapping:
        if block[y,x] > threshold:
            dots |= bit

    return chr(0x2800 + dots)


def frame_to_ascii(frame, width=None, height=None):
    term_w, term_h = get_terminal_size()

    target_w = width if width else term_w
    target_h = height if height else term_h * 2

    resized = cv2.resize(frame, (target_w, target_h))
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    edges = sobel(gray)

    lines = []
    y = 0

    while y < target_h - 4:
        line = []
        for x in range(target_w - 1):
            block2x2 = gray[y:y+2, x:x+1]
            block2x4 = gray[y:y+4, x:x+2]

            edge_strength = edges[y, x]
            contrast = np.std(block2x2)

            top = resized[y, x]
            bottom = resized[y+1, x]

            if edge_strength > 120:
                if block2x4.shape == (4,2):
                    ch = braille_from_block(block2x4)
                else:
                    ch = ascii_char(gray[y,x])
                fg = top
                bg = top

            elif contrast > 25:
                lum_top = luminance(top)
                lum_bot = luminance(bottom)

                if lum_top > lum_bot:
                    ch = "▀"
                    fg, bg = top, bottom
                else:
                    ch = "▄"
                    fg, bg = bottom, top

            else:
                val = gray[y, x]
                ch = ascii_char(val)
                fg = top
                bg = top

            r1,g1,b1 = int(fg[2]), int(fg[1]), int(fg[0])
            r2,g2,b2 = int(bg[2]), int(bg[1]), int(bg[0])

            line.append(f"\x1b[38;2;{r1};{g1};{b1}m\x1b[48;2;{r2};{g2};{b2}m{ch}")

        lines.append(''.join(line))
        y += 2

    return "\n".join(lines)


def clear():
    os.system("cls" if os.name == "nt" else "clear")


# ---------------- MEDIA HANDLERS ----------------
def play_gif(path, flags):
    img = Image.open(path)

    width = flags["width"]
    height = flags["height"]
    save = flags["save"]

    loop_count = img.info.get("loop", 0)
    if save:
        # disable infinite loop when saving
        loop_count = 1

    # prepare output directory if saving
    out_dir = prepare_output_dir(path) if save else None

    frames = []
    durations = []

    for frame in ImageSequence.Iterator(img):
        duration = frame.info.get("duration", img.info.get("duration", 100))
        durations.append(duration / 1000)

        f = frame.convert("RGB")
        f = np.array(f)
        f = cv2.cvtColor(f, cv2.COLOR_RGB2BGR)

        frames.append(f)

    total_frames = len(frames)
    loop_iter = 0

    while True:
        start_time = time.perf_counter()
        next_frame_time = start_time

        for i in range(total_frames):
            # EXIT CHECK (before wait)
            if user_requested_exit():
                return

            now = time.perf_counter()
            # wait loop with exit responsiveness
            while now < next_frame_time:
                if user_requested_exit():
                    return
                time.sleep(0.001)
                now = time.perf_counter()

            frame_start = time.perf_counter()
            ascii_frame = frame_to_ascii(frames[i], width, height)

            clear()
            print(ascii_frame)

            # save frame if requested
            if save:
                filename = f"frame_{i+1}.delay_{int(durations[i]*1000)}.txt"
                with open(os.path.join(out_dir, filename), "w", encoding="utf-8") as f:
                    f.write(strip_ansi(ascii_frame))

            # EXIT CHECK (after render)
            if user_requested_exit():
                clear()
                exit(0)

            next_frame_time += durations[i]
            after = time.perf_counter()
            # drift correction
            if after > next_frame_time:
                next_frame_time = after

        loop_iter += 1
        if loop_count != 0 and loop_iter >= loop_count:
            break


def show_image(path, flags):
    frame = cv2.imread(path)
    if frame is None:
        print("Invalid image")
        return

    ascii_frame = frame_to_ascii(frame, flags["width"], flags["height"])
    print(ascii_frame)

    if flags["save"]:
        base = os.path.splitext(os.path.basename(path))[0]
        filename = f"{base}.txt"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(strip_ansi(ascii_frame))


def play_video(path, flags):
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        print("Failed to open")
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    delay = 1 / fps if fps > 0 else 0.03

    save = flags["save"]
    width = flags["width"]
    height = flags["height"]

    out_dir = prepare_output_dir(path) if save else None

    frame_index = 1

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        ascii_frame = frame_to_ascii(frame, width, height)

        if save:
            filename = f"frame_{frame_index}.delay_{int(delay*1000)}.txt"
            with open(os.path.join(out_dir, filename), "w", encoding="utf-8") as f:
                f.write(strip_ansi(ascii_frame))
        else:
            clear()
            print(ascii_frame)
            time.sleep(delay)

        frame_index += 1


def handle_file(path, flags):
    resize_terminal(flags["width"], flags["height"])

    ext = path.lower().split('.')[-1]

    if ext in ["png","jpg","jpeg","bmp"]:
        show_image(path, flags)
    elif ext == "gif":
        play_gif(path, flags)
    else:
        play_video(path, flags)


# ---------------- MAIN ----------------
def build_flag_args(flags):
    args = []
    if flags["save"]:
        args.append("--save-file")
    if flags["width"]:
        args += ["--width", str(flags["width"])]
    if flags["height"]:
        args += ["--height", str(flags["height"])]
    return args


def main():
    if len(sys.argv) < 2:
        print("Drag file(s) onto script")
        return

    try:
        flags, files = parse_args(sys.argv[1:])
    except Exception as e:
        print(e)
        return

    if not files:
        print("No files provided")
        return

    if len(files) > 1:
        flag_args = build_flag_args(flags)

        for path in files:
            subprocess.Popen(
                ["cmd", "/c", "start", "cmd", "/k",
                 sys.executable, __file__, path] + flag_args
            )
        return

    handle_file(files[0], flags)


if __name__ == "__main__":
    main()
    input("Type anything to continue...")
    clear()
    exit()