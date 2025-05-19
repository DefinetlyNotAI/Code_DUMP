import base64
import io
import cv2
import numpy as np
from flask import Flask, render_template, Response
from waitress import serve

# ---------------------------------------------------------- GLOBAL VARIABLES ---------------------------------------------------------- #

CONFIDENCE_THRESHOLD = 0.5  # Minimum confidence score to consider detection valid
NMS_THRESHOLD = 0.4  # Non-maximum suppression threshold to filter overlapping boxes
FRAME_WIDTH, FRAME_HEIGHT = 416, 416  # YOLO model input dimensions
CAMERA_INDEX = 0  # Index of the camera to use (0 = default webcam)
JPEG_QUALITY = 80  # JPEG compression quality (1-100, higher means better quality but larger size)

YOLO_WEIGHTS = 'yolov3.weights'  # Path to YOLO weights file
YOLO_CONFIG = 'yolov3.cfg'  # Path to YOLO configuration file
COCO_NAMES = 'coco.names'  # Path to file containing class labels

PORT_NUM = 5000  # Port number to use for flask web server
IP_NUM = "0.0.0.0"  # IP to use, (0.0.0.0 allows anyone in local network to access it via your IP)
DEBUG = False  # Use debug? (If True will use native run for flask, if False will use waitress to serve the application

# ------------------------------------------------------------- CODE START ------------------------------------------------------------- #

# Load YOLO model
net = cv2.dnn.readNet(YOLO_WEIGHTS, YOLO_CONFIG)
layer_names = net.getLayerNames()
output_layers = [layer_names[i - 1] for i in net.getUnconnectedOutLayers()]

# Load class labels
with open(COCO_NAMES, 'r') as f:
    classes = [line.strip() for line in f.readlines()]

# Initialize camera
cap = cv2.VideoCapture(CAMERA_INDEX)

app = Flask(__name__)

def detect_objects(frame):
    height, width, _ = frame.shape
    blob = cv2.dnn.blobFromImage(frame, 0.00392, (FRAME_WIDTH, FRAME_HEIGHT), (0, 0, 0), True, crop=False)
    net.setInput(blob)
    outs = net.forward(output_layers)

    class_ids, confidences, boxes = [], [], []
    for out in outs:
        for detection in out:
            scores = detection[5:]
            class_id = np.argmax(scores)
            confidence = scores[class_id]
            if confidence > CONFIDENCE_THRESHOLD:
                center_x, center_y = int(detection[0] * width), int(detection[1] * height)
                w, h = int(detection[2] * width), int(detection[3] * height)
                x, y = center_x - w // 2, center_y - h // 2
                boxes.append([x, y, w, h])
                confidences.append(float(confidence))
                class_ids.append(class_id)

    indexes = cv2.dnn.NMSBoxes(boxes, confidences, CONFIDENCE_THRESHOLD, NMS_THRESHOLD)
    for i in indexes.flatten():
        x, y, w, h = boxes[i]
        label = f"{classes[class_ids[i]]} {confidences[i]:.2f}"
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    return frame

def generate():
    while True:
        ret, frame = cap.read()
        if not ret:
            continue  # Skip frame if capture fails

        frame = detect_objects(frame)  # Process frame
        _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY])  # Optimize quality

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/shutdown', methods=['POST'])
def shutdown():
    cap.release()
    return "Camera released. Server shutting down."

if __name__ == '__main__':
    try:
        if DEBUG:
            app.run(host=IP_NUM, port=PORT_NUM, debug=True)
        else:
            serve(app, host=IP_NUM, port=PORT_NUM)
    except KeyboardInterrupt:
        cap.release()
