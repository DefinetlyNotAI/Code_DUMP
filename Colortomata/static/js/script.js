// noinspection JSUnresolvedReference

document.getElementById('settings-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Show loading indication
    const button = event.target.querySelector('button');
    button.disabled = true;
    button.textContent = 'Generating...';

    const gridSize = document.getElementById('grid_size').value;
    const theta = document.getElementById('theta').value;
    const delta = document.getElementById('delta').value;
    const lambda = document.getElementById('lambda_').value;
    const seed = document.getElementById('seed').value;
    const customRuleOrder = document.getElementById('custom_rule_order').value;
    const evolveForOneMin = document.getElementById('evolve-checkbox').checked;  // Check if the evolve checkbox is checked

    const formData = new FormData();
    formData.append('grid_size', gridSize);
    formData.append('theta', theta);
    formData.append('delta', delta);
    formData.append('lambda_', lambda);
    formData.append('seed', seed);
    formData.append('custom_rule_order', customRuleOrder);

    fetch('/generate', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            // Reset button after response is received
            button.disabled = false;
            button.textContent = 'Generate';

            if (data.error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: data.error,
                });
            } else {
                const imageContainer = document.getElementById('image-container');
                const generatedImage = document.getElementById('generated-image');
                generatedImage.src = data.image_base64;
                imageContainer.style.display = 'block';

                // Check if evolution is enabled before starting the evolution process
                if (evolveForOneMin) {
                    // Start the grid evolution for 1 minute
                    const evolveDuration = 60 * 1000; // 1 minute in milliseconds
                    const endTime = Date.now() + evolveDuration;

                    // Start evolving grid once
                    fetch('/evolve', { method: 'POST' })
                        .then(response => response.json())
                        .then(() => {
                            // Set interval to continuously update the image every second
                            const interval = setInterval(() => {
                                if (Date.now() < endTime) {
                                    fetch('/generate', {
                                        method: 'POST',
                                        body: new URLSearchParams({ 'grid_size': gridSize })
                                    })
                                        .then(response => response.json())
                                        .then(data => {
                                            if (data.image_base64) {
                                                generatedImage.src = data.image_base64;
                                            }
                                        });
                                } else {
                                    clearInterval(interval); // Clear interval after 1 minute
                                }
                            });  // Update every second
                        })
                        .catch(error => {
                            Swal.fire({
                                icon: 'error',
                                title: 'Oops...',
                                text: 'Failed to start evolution!',
                            });
                            console.error('Error:', error);
                        });
                }

                // Optionally reset the form
                document.getElementById('settings-form').reset();
            }
        })
        .catch(error => {
            button.disabled = false;
            button.textContent = 'Generate';

            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong!',
            });
            console.error('Error:', error);
        });
});
