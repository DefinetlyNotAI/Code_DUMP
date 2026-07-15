import os
from PIL import Image

MAX_WIDTH = 1280
MAX_HEIGHT = 740
IMAGE_EXTENSIONS = ('.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.tiff')

def resize_image(filepath):
    try:
        with Image.open(filepath) as img:
            orig_w, orig_h = img.size

            scale_w = MAX_WIDTH / orig_w
            scale_h = MAX_HEIGHT / orig_h
            scale = min(scale_w, scale_h)

            # Compute new size
            new_w = int(orig_w * scale)
            new_h = int(orig_h * scale)

            if (new_w, new_h) != (orig_w, orig_h):
                resized = img.resize((new_w, new_h), Image.LANCZOS)
                resized.save(filepath, format=img.format)
                print(f"Resized: {filepath} -> {new_w}x{new_h}")
            else:
                print(f"Skipped (already sized): {filepath}")

    except Exception as e:
        print(f"Error with {filepath}: {e}")

def recursively_resize_images(root_dir):
    for root, _, files in os.walk(root_dir):
        for file in files:
            if file.lower().endswith(IMAGE_EXTENSIONS):
                resize_image(os.path.join(root, file))

if __name__ == "__main__":
    target_dir = input("Enter directory path: ").strip()
    if os.path.isdir(target_dir):
        recursively_resize_images(target_dir)
        print("Done.")
    else:
        print("Invalid directory.")
    input()