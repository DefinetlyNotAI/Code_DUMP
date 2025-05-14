import qrcode

# Read the HTML file content
with open("sneke.html", "r") as file:
    html_content = file.read()

# Generate the QR code
qr = qrcode.QRCode(
    version=40,  # controls the size of the QR code
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)

# Add the HTML content to the QR code
qr.add_data(html_content)
qr.make(fit=True)

# Create an image from the QR code
img = qr.make_image(fill='black', back_color='white')

# Save the image or display it
img.save("html_qr_code.png")
img.show()
