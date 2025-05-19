# Flask Object Detection

## Overview

This is a Flask-based application that uses OpenCV and YOLO (You Only Look Once) for real-time object detection via a webcam. The application streams video frames with detected objects highlighted and labelled.

## Features

- Real-time object detection using YOLOv3.
- Web-based video streaming.
- Non-Maximum Suppression (NMS) for better detection accuracy.
- Optimized camera handling with proper resource release.
- Flask server for easy deployment.

## Requirements

Ensure you have the following dependencies installed:

```shell
pip install flask opencv-python numpy waitress
```

Also, make sure you have:

- `yolov3.weights` (YOLO model weights)
- `yolov3.cfg` (YOLO model configuration)
- `coco.names` (Class labels for YOLO)

To get those files, ensure a solid network connection and run the following code after doing the first step in [usage](#usage)

```shell
python install.py
```

## Usage

1. Clone the repository

2. Run the Flask app:

   ```shell
   python camera.py
   ```

3. Open your browser and navigate to:

   ```
   http://localhost:5000
   ```

## API Endpoints

- `/` - Serves the web interface.
- `/video_feed` - Streams real-time video with object detection.
- `/shutdown` - Releases the camera and shuts down the server.

## Notes

- Ensure your camera is connected and accessible.
- Modify `yolov3.cfg` and `yolov3.weights` if using a different YOLO model.
- Adjust confidence thresholds in `detect_objects()` if needed.
- Play around with the values in GLOBAL section of the code to suit your use case

