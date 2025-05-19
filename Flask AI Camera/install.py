import os
import requests

# URLs for YOLOv3 files
urls = {
    "coco.names": "https://github.com/pjreddie/darknet/blob/master/data/coco.names?raw=true",
    "yolov3.cfg": "https://github.com/pjreddie/darknet/blob/master/cfg/yolov3.cfg?raw=true",
    "yolov3.weights": "https://pjreddie.com/media/files/yolov3.weights"
}

# Function to download files
def download_file(url, filename):
    try:
        # Send a GET request to the URL
        response = requests.get(url, stream=True)
        response.raise_for_status()  # Raise an HTTPError for bad responses (4xx, 5xx)

        # Write the file to disk
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"Downloaded: {filename}")
        return True

    except requests.exceptions.RequestException as e:
        print(f"Error downloading {filename}: {e}")
        return False

# Download each file
for file_name, file_url in urls.items():
    success = download_file(file_url, file_name)
    if not success:
        print(f"Failed to download {file_name}. Please check the URL or your network connection.")
