import smtplib

email = "email here"
password = "app password here - not login password"  # app password

try:
    with smtplib.SMTP('smtp.purelymail.com', 587) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(email, password)
        print("Login successful")
except smtplib.SMTPAuthenticationError as e:
    print("Authentication failed:", e)
except Exception as e:
    print("Other error:", e)
