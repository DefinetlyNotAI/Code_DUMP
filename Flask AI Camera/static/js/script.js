document.addEventListener("DOMContentLoaded", function () {
    const cameraFeed = document.getElementById("camera-feed");

    // Ensure connection is active
    cameraFeed.onerror = function () {
        console.error("Camera feed disconnected. Retrying...");
        setTimeout(() => {
            cameraFeed.src = "{{ url_for('video_feed') }}?t=" + new Date().getTime(); // Bypass cache
        }, 1000);
    };
});
