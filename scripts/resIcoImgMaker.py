from PIL import Image
import os

# Source image
source_file = "splash.png"

# Base output directory
res_dir = "app/src/main/res"

# Launcher icon sizes for different densities
icon_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

# Load source image
src_img = Image.open(source_file).convert("RGBA")

def resize_and_center(img, size):
    # Create black background
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    img_ratio = img.width / img.height
    if img_ratio > 1:
        # wider than tall
        new_width = size
        new_height = round(size / img_ratio)
    else:
        new_height = size
        new_width = round(size * img_ratio)
    resized_img = img.resize((new_width, new_height), Image.LANCZOS)
    x_offset = (size - new_width) // 2
    y_offset = (size - new_height) // 2
    canvas.paste(resized_img, (x_offset, y_offset), resized_img)
    return canvas

for folder, size in icon_sizes.items():
    out_dir = os.path.join(res_dir, folder)
    os.makedirs(out_dir, exist_ok=True)
    
    # Foreground
    fg_file = os.path.join(out_dir, "ic_launcher_foreground.png")
    resize_and_center(src_img, size).save(fg_file)
    
    # Normal launcher
    normal_file = os.path.join(out_dir, "ic_launcher.png")
    resize_and_center(src_img, size).save(normal_file)
    
    # Round launcher
    round_file = os.path.join(out_dir, "ic_launcher_round.png")
    resize_and_center(src_img, size).save(round_file)
    
    print(f"Generated icons in {out_dir}")
