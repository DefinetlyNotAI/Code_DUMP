# G2C Performance Tuning Guide

This guide provides detailed instructions for optimizing G2C performance across different
hardware configurations and use cases.

## Table of Contents

1. [Quick Performance Presets](#quick-performance-presets)
2. [Understanding the Pipeline](#understanding-the-pipeline)
3. [Capture Optimization](#capture-optimization)
4. [Scaling Optimization](#scaling-optimization)
5. [Rendering Optimization](#rendering-optimization)
6. [Terminal-Specific Tuning](#terminal-specific-tuning)
7. [Memory Optimization](#memory-optimization)
8. [Benchmarking Your Setup](#benchmarking-your-setup)

---

## Quick Performance Presets

### Low-End Hardware / Remote Sessions

```bash
g2c --preset=low
# Equivalent to:
g2c --fps=15 --scale=0.5 --capture=gdi --color=256 --no-diff
```

### Balanced (Default)

```bash
g2c --preset=medium
# Equivalent to:
g2c --fps=24 --scale=1.0 --capture=auto --color=truecolor
```

### High-End Hardware / Local Display

```bash
g2c --preset=high
# Equivalent to:
g2c --fps=60 --scale=1.0 --capture=dxgi --color=truecolor --scaling=bicubic
```

---

## Understanding the Pipeline

Each frame goes through these stages. Bottlenecks in any stage limit overall FPS:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE        │ TYPICAL TIME │ BOTTLENECK INDICATORS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Capture      │ 0.5-15 ms    │ High if GPU busy or using GDI fallback        │
│ Scale        │ 1-5 ms       │ High if using bicubic/lanczos algorithms      │
│ Diff         │ 0.2-2 ms     │ High if screen mostly static (no benefit)     │
│ Render       │ 0.5-3 ms     │ High if many cells change each frame          │
│ Output       │ 1-20 ms      │ High if terminal is slow or over SSH          │
└─────────────────────────────────────────────────────────────────────────────┘

Use --debug to see per-stage timing:

[DEBUG] Frame 1234: capture=1.2ms scale=2.1ms diff=0.4ms render=1.8ms output=3.2ms total=8.7ms
```

---

## Capture Optimization

### DXGI vs GDI Performance

| Method | FPS Potential | CPU Usage | GPU Usage | Compatibility |
|--------|---------------|-----------|-----------|---------------|
| DXGI   | 60+ FPS       | Low       | Low       | Windows 8+    |
| GDI    | 15-30 FPS     | High      | None      | All Windows   |

### When DXGI Falls Back to GDI

DXGI capture may fail in these scenarios:

- Remote Desktop (RDP) sessions
- Virtual machines without GPU passthrough
- Secure desktop (UAC prompts, login screen)
- Some full-screen exclusive games
- Older Windows versions (7 and below)

### Force Specific Capture Method

```bash
# Force DXGI (fail if unavailable)
g2c --capture=dxgi

# Force GDI (always works but slower)
g2c --capture=gdi

# Auto-select (default, recommended)
g2c --capture=auto
```

### Multi-Monitor Setup

```bash
# Capture specific monitor (0-indexed)
g2c --monitor=0    # Primary monitor
g2c --monitor=1    # Second monitor

# Capture all monitors (stitched)
g2c --monitor=-1
```

### Capture Region (Reduce Data Volume)

```bash
# Capture specific region (x,y,width,height)
g2c --region=0,0,1280,720

# Capture active window only
g2c --capture-window="Calculator"
```

---

## Scaling Optimization

### Algorithm Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ALGORITHM        │ QUALITY │ SPEED    │ BEST FOR                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Nearest Neighbor │ Low     │ Fastest  │ Pixel art, retro look               │
│ Bilinear         │ Good    │ Fast     │ General use (default)               │
│ Bicubic          │ Better  │ Medium   │ Photos, gradients                   │
│ Lanczos          │ Best    │ Slow     │ Maximum quality, still content      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Choose Scaling Algorithm

```bash
g2c --scaling=nearest     # Fastest, pixelated
g2c --scaling=bilinear    # Default, good balance
g2c --scaling=bicubic     # Higher quality
g2c --scaling=lanczos     # Best quality, slowest
```

### Scaling Factor

Lower scaling = fewer pixels to process = faster:

```bash
g2c --scale=0.5    # Half resolution (4x faster)
g2c --scale=0.75   # 75% resolution
g2c --scale=1.0    # Full terminal resolution (default)
```

### Effective Resolution Calculation

```
Terminal: 160 columns x 48 rows
Pixel resolution: 160 x 96 (half-block doubles vertical)

With --scale=0.5:
Effective: 80 x 48 pixels
Speedup: ~4x fewer pixels to process
```

---

## Rendering Optimization

### Color Mode Performance

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MODE       │ BYTES/CELL │ QUALITY     │ TERMINAL SUPPORT                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ TrueColor  │ ~24 bytes  │ 16.7M colors│ Modern terminals                    │
│ 256-color  │ ~12 bytes  │ 256 colors  │ Most terminals                      │
│ 16-color   │ ~6 bytes   │ 16 colors   │ All terminals                       │
│ Grayscale  │ ~12 bytes  │ 24 shades   │ Most terminals                      │
│ ASCII      │ ~1 byte    │ 10 shades   │ All terminals (no color)            │
└─────────────────────────────────────────────────────────────────────────────┘
```

```bash
g2c --color=truecolor   # Best quality
g2c --color=256         # Good balance
g2c --color=16          # Fastest color mode
g2c --grayscale         # Artistic effect
g2c --ascii             # Maximum compatibility
```

### Diff Engine Tuning

The diff engine skips unchanged cells. Effectiveness varies by content:

| Content Type | Diff Effectiveness | Recommendation        |
|--------------|--------------------|-----------------------|
| Text editor  | 95%+ cells skipped | Enable diff (default) |
| Video        | 10-30% skipped     | Consider --no-diff    |
| Gaming       | 30-70% skipped     | Default usually fine  |
| Static image | 99%+ skipped       | Diff essential        |

```bash
# Disable diff (faster for video/games)
g2c --no-diff

# Adjust diff threshold (ignore minor color changes)
g2c --diff-threshold=5    # Ignore RGB changes <= 5
g2c --diff-threshold=10   # More aggressive
```

### Output Buffering

```bash
# Sync output with terminal refresh (reduces tearing)
g2c --vsync

# Batch output writes
g2c --output-buffer=65536    # 64KB buffer (default)
g2c --output-buffer=131072   # 128KB buffer (smoother)
```

---

## Terminal-Specific Tuning

### Windows Terminal

Excellent performance, use aggressive settings:

```bash
g2c --fps=60 --color=truecolor --scaling=bilinear
```

Enable GPU acceleration in Windows Terminal settings:

```json
{
    "useAtlasEngine": true,
    "experimental.rendering.forceFullRepaint": false
}
```

### Alacritty

GPU-accelerated, very fast:

```bash
g2c --fps=60 --color=truecolor
```

Recommended alacritty.toml:

```toml
[terminal]
osc52 = "CopyPaste"

[scrolling]
history = 0  # Disable scrollback for performance
```

### Kitty

Excellent performance with image protocol support:

```bash
g2c --fps=60 --color=truecolor
```

### iTerm2 (macOS via SSH)

Good performance, but SSH adds latency:

```bash
g2c --fps=30 --color=truecolor
```

Enable "GPU Renderer" in iTerm2 preferences.

### tmux

Adds overhead due to buffer copying:

```bash
g2c --fps=24 --color=256
```

Optimize tmux.conf:

```bash
set -g default-terminal "tmux-256color"
set -ga terminal-overrides ",*256col*:Tc"
set -g escape-time 0
```

### SSH Sessions

Network latency dominates; reduce data volume:

```bash
# Local network
g2c --fps=24 --color=256 --scale=0.75

# Internet (high latency)
g2c --fps=15 --color=16 --scale=0.5

# Use compression
ssh -C user@host "g2c --fps=15"
```

---

## Memory Optimization

### Buffer Sizes

```bash
# Reduce memory footprint
g2c --capture-buffer=4194304   # 4MB (vs 8MB default)
g2c --output-buffer=32768      # 32KB (vs 64KB default)
```

### Memory Usage by Resolution

| Screen Resolution | Capture Buffer | Cell Buffer | Total (~) |
|-------------------|----------------|-------------|-----------|
| 1920x1080         | 8.3 MB         | 60 KB       | ~10 MB    |
| 2560x1440         | 14.7 MB        | 80 KB       | ~16 MB    |
| 3840x2160         | 33.2 MB        | 120 KB      | ~35 MB    |

### Low Memory Mode

```bash
g2c --low-memory
# Reduces buffer sizes, disables some optimizations
# Useful for constrained environments
```

---

## Benchmarking Your Setup

### Built-in Benchmark

```bash
# Run performance benchmark
g2c --benchmark

# Output:
# ┌─────────────────────────────────────────────────────────────────┐
# │ G2C Performance Benchmark                                       │
# ├─────────────────────────────────────────────────────────────────┤
# │ Capture Method: DXGI Desktop Duplication                        │
# │ Screen Resolution: 1920x1080                                    │
# │ Terminal Size: 160x48                                           │
# ├─────────────────────────────────────────────────────────────────┤
# │ Capture:   1.24 ms avg (806 FPS theoretical)                    │
# │ Scale:     2.15 ms avg (bilinear)                               │
# │ Diff:      0.41 ms avg (92% cells skipped)                      │
# │ Render:    1.67 ms avg                                          │
# │ Output:    3.82 ms avg                                          │
# ├─────────────────────────────────────────────────────────────────┤
# │ Total:     9.29 ms avg (107 FPS max)                            │
# │ Target:    41.67 ms (24 FPS) - OK                               │
# └─────────────────────────────────────────────────────────────────┘
```

### Debug Mode

```bash
# Show real-time performance stats
g2c --debug

# Output includes:
# - Per-frame timing breakdown
# - FPS counter
# - Diff efficiency (% cells skipped)
# - Memory usage
# - Dropped frames
```

### Performance Logging

```bash
# Log performance data to file
g2c --perf-log=performance.csv

# CSV columns:
# timestamp,frame,capture_ms,scale_ms,diff_ms,render_ms,output_ms,total_ms,cells_changed,fps
```

---

## Optimization Checklist

### Before Running

- [ ] Close unnecessary applications
- [ ] Disable desktop animations (Windows: Performance Options)
- [ ] Use a modern terminal emulator
- [ ] If using SSH, enable compression (`ssh -C`)

### G2C Settings

- [ ] Start with a preset (`--preset=medium`)
- [ ] Adjust `--fps` to match your needs
- [ ] Use `--debug` to identify bottlenecks
- [ ] If output is slow, try `--color=256` or lower
- [ ] If capture is slow, check if GDI fallback is active
- [ ] For video content, consider `--no-diff`

### Terminal Settings

- [ ] Enable GPU acceleration if available
- [ ] Disable scrollback buffer or limit it
- [ ] Use a monospace font with good Unicode support
- [ ] Increase terminal window size for more detail

### System Settings

- [ ] Keep GPU drivers updated
- [ ] Ensure adequate RAM (8GB+ recommended)
- [ ] Use SSD for any logging/caching
- [ ] On laptops, use "High Performance" power plan

---

## Troubleshooting Performance Issues

### Symptom: Low FPS Despite Fast Hardware

**Check capture method:**

```bash
g2c --debug 2>&1 | grep "Capture method"
```

If showing GDI, DXGI may have failed. Check:

- Running elevated (some games require admin)
- GPU driver is up to date
- Not in a remote session

### Symptom: High CPU Usage

Likely causes:

1. GDI capture (CPU-intensive) - try forcing DXGI
2. Complex scaling algorithm - use `--scaling=nearest`
3. Large terminal - reduce window size

### Symptom: Stuttering/Dropped Frames

```bash
# Reduce target FPS
g2c --fps=20

# Enable frame dropping (maintain timing)
g2c --allow-frame-drop

# Increase output buffer
g2c --output-buffer=131072
```

### Symptom: Slow Over SSH

```bash
# Aggressive optimization for SSH
g2c --fps=15 --color=16 --scale=0.5 --diff-threshold=10

# Use SSH compression
ssh -C user@host

# Consider using mosh for better latency handling
mosh user@host -- g2c --fps=24
```

---

*For additional help, run `g2c --help` or visit the GitHub repository.*
