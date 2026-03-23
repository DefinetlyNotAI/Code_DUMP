# Terminal ASCII Renderer

Render images, GIFs, and videos directly in the terminal using high-detail ASCII, Unicode braille, and full 24-bit RGB color. Supports smart edge-based rendering and auto-scaling to your terminal size.

---

## Features

- Render **images, GIFs, and videos** in the terminal
- Real-time video playback with frame timing from metadata
- Smart rendering pipeline:
  - Sobel edge detection for detailed regions
  - Braille characters for high-frequency detail
  - Half-block Unicode for vertical contrast
  - ASCII fallback for smooth regions
- Full 24-bit ANSI color support
- Auto-resize to terminal resolution (Windows only)
- Multi-file drag-and-drop support, opening each file in a separate terminal
- Optional frame export as plain ASCII text

---

## Supported Formats

**Images:** `png`, `jpg`, `jpeg`, `bmp`
**Animated:** `gif`
**Videos:** `mp4`, `avi`, `mkv`, `mov` (and most OpenCV-supported formats, though this has some limitations)

---

## Requirements

- Python 3.8 or newer

Install dependencies:

```bash
pip install opencv-python numpy pillow
```

---

## How It Works

Each frame is processed as follows:

1. Resize to terminal resolution (or user-specified width/height)
2. Convert to grayscale
3. Apply Sobel edge detection
4. Render each pixel block based on detail:
   - High edge → braille
   - High contrast → half-block Unicode
   - Low detail → ASCII mapping
5. Apply foreground and background RGB color using ANSI codes

When saving frames, ANSI formatting is stripped to provide raw ASCII output.

---

## Usage

### Drag and Drop (Windows)

1. Place `script.py` somewhere accessible
2. Drag supported file(s) onto the script
3. Each file opens in a separate terminal and renders automatically

---

### Command Line

```bash
python script.py [--save-file] [--width <WIDTH>] [--height <HEIGHT>] <file> [<file2> ...]
```

Examples:

```bash
python script.py video.mp4
python script.py image.png --width 120 --height 40 --save-file
python script.py video.mp4 gif.gif image.jpg
```

- `--save-file` saves each frame as a `.txt` file in a folder named after the media file
- `--width` and `--height` specify terminal dimensions (Windows only)

---

## Notes on Terminal Compatibility

- Works best in:
  - Windows Terminal
  - CMD with ANSI enabled
  - Linux terminals with truecolor support
- Recommended minimum terminal size: 120x40
- Larger terminal → higher resolution output

---

## Performance Considerations

- Playback depends on CPU and terminal rendering speed
- High-resolution videos are downscaled to fit terminal
- GIFs respect embedded frame durations
- Real-time rendering may stutter on slower terminals

---

## Known Limitations

- Terminal rendering can bottleneck FPS
- Colors may vary across terminals
- No audio support for videos
- Braille rendering requires a Unicode-compatible font
- Video rendering may stutter or flicker due to clearing and frame timing
