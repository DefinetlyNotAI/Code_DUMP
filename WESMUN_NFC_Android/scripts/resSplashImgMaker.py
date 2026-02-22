import os
from PIL import Image

# Input file
SOURCE = "splash.png"

# Android density specs you actually have
OUTPUTS = {
    "drawable-land-mdpi":     (320, 480),
    "drawable-land-hdpi":     (480, 800),
    "drawable-land-xhdpi":    (720, 1280),
    "drawable-land-xxhdpi":   (960, 1600),
    "drawable-land-xxxhdpi":  (1280, 1920),

    "drawable-port-mdpi":     (320, 480),
    "drawable-port-hdpi":     (480, 800),
    "drawable-port-xhdpi":    (720, 1280),
    "drawable-port-xxhdpi":   (960, 1600),
    "drawable-port-xxxhdpi":  (1280, 1920),

    "drawable":               (1280, 1920)   # default backup splash
}

DEST_ROOT = "app/src/main/res"

def generate():
    if not os.path.exists(SOURCE):
        raise FileNotFoundError("Missing splash.png")

    original = Image.open(SOURCE).convert("RGBA")

    for folder, size in OUTPUTS.items():
        target_w, target_h = size

        # Create black background
        bg = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 255))

        # Scale while keeping aspect
        ratio = min(target_w / original.width, target_h / original.height)
        new_w = int(original.width * ratio)
        new_h = int(original.height * ratio)

        resized = original.resize((new_w, new_h), Image.LANCZOS)

        # Center it
        x = (target_w - new_w) // 2
        y = (target_h - new_h) // 2
        bg.paste(resized, (x, y), resized)

        folder_path = os.path.join(DEST_ROOT, folder)
        os.makedirs(folder_path, exist_ok=True)

        out_path = os.path.join(folder_path, "splash.png")
        bg.save(out_path, "PNG")

        print("created", out_path)


if __name__ == "__main__":
    generate()
