# WESMUN 2026 Delegate Email Sender

A Python script to send personalized committee allocation emails to Model United Nations (MUN) delegates for WESMUN 2026.

## 📋 Overview

This tool automates the process of sending allocation emails to delegates, including:
- Personalized email content with delegate name and country/portfolio allocation
- Committee-specific information (agendas, group chat links)
- PDF attachments (Code of Conduct, Delegate Handbook, Schedule, Waiver Form)
- Committee-specific Background Guide PDFs

## 📁 Project Structure

```
wesmun_del_email/
├── sendMail.py              # Main email sending script
├── body.txt                 # Email body template with placeholders
├── bodyReplacements.csv     # Committee-specific data (agendas, GC links)
├── chairsEmailLogin.csv     # Committee chair email credentials
├── countryMatrixCSV/        # Delegate allocation CSVs (one per committee)
│   ├── AL.csv
│   ├── ECOSOC.csv
│   ├── GA1.csv
│   └── ... (other committees)
├── allAttachments/          # PDF attachments sent to all delegates
│   ├── Code Of Conduct.pdf
│   ├── Delegate Handbook.pdf
│   ├── Schedule.pdf
│   ├── Waiver Consent Form.pdf
│   └── BackGroundGuide/     # Committee-specific background guides
│       ├── AL.pdf
│       ├── ECOSOC.pdf
│       └── ... (other committees)
├── backup/                  # Backup of original country matrix files
└── scripts/                 # Utility scripts
    └── csvStripper.py
```

## 📝 File Formats

### `countryMatrixCSV/*.csv` (Delegate Data)
Each committee has a CSV with delegate allocations:
```csv
Allocation,Delegate Name,Email
Bahrain,John doe,email@example.com
Jordan,Doe John,example@email.com
```

### `chairsEmailLogin.csv` (Chair Credentials)
Email credentials for sending from committee chairs:
```csv
name,email,password
AL,al@wesmun.com,password123
ECOSOC,ecosoc@wesmun.com,password456
```
> ⚠️ **Important**: The `name` column must match the CSV filename in `countryMatrixCSV/` (e.g., `AL` for `AL.csv`)

### `bodyReplacements.csv` (Committee Info)
Committee-specific details for email body:
```csv
name,Agenda1,Agenda2,GCLink
AL,Strengthening Regional Peacekeeping,Enhancing Humanitarian Aid,https://gc.link/al
ECOSOC,Global Economic Recovery,Sustainable Development Goals Review,https://gc.link/ecosoc
```

### `body.txt` (Email Template)
Template with placeholders that get replaced:
- `[[name]]` - Committee name
- `[[delegateName]]` - Delegate's name
- `[[allocation]]` - Country/Portfolio assignment
- `[[Agenda1]]` - First agenda topic
- `[[Agenda2]]` - Second agenda topic
- `[[GCLink]]` - Group chat link
- `[[name.lower]]` - Committee name in lowercase

## Usage

### Prerequisites
- Python 3.6+
- PurelyMail accounts for `@wesmun.com` email addresses
  - **⚠️ IMPORTANT**: All sender emails MUST be `@wesmun.com` addresses
  - You need the PurelyMail passwords for each committee email account
  - The script validates that all emails are from the `@wesmun.com` domain

### Run Modes

```bash
# Test run - validates everything without sending emails
python sendMail.py --testRun

# Fake run - sends all emails to it@wesmun.com (for testing)
python sendMail.py --fakeRun

# Real run - sends emails to actual delegates with CC to staff
python sendMail.py --run
```

### Command Line Options

| Flag        | Description                                                  |
|-------------|--------------------------------------------------------------|
| `--testRun` | Dry run - logs what would be sent without actually sending   |
| `--fakeRun` | Sends emails to `it@wesmun.com` instead of actual recipients |
| `--run`     | Production mode - sends to real recipients with CC to staff  |

### CC Recipients (Production Mode Only)
When using `--run`, emails are CC'd to:
- it@wesmun.com
- secretariat@wesmun.com
- chiefofstaff@wesmun.com

## Email Details

- **From**: Committee chair email (e.g., `ecosoc@wesmun.com`)
- **Subject**: "WESMUN 2026 - Committee Allocation"
- **Attachments**: 
  - Code Of Conduct.pdf
  - Delegate Handbook.pdf
  - Schedule.pdf
  - Waiver Consent Form.pdf
  - Committee Background Guide (e.g., `ECOSOC.pdf`)

## Logging

All activity is logged to:
- **Console**: Real-time status messages
- **File**: `email_sender.log` (persistent log)

## ⚠️ Important Notes

1. **PurelyMail Setup**: All committee email addresses must be `@wesmun.com` addresses hosted on PurelyMail. The script validates this before sending.

2. **Committee Name Matching**: The committee name in `chairsEmailLogin.csv` and `bodyReplacements.csv` must **exactly match** the CSV filename in `countryMatrixCSV/` (without `.csv` extension).

3. **Email Validation**: The script automatically validates that all sender emails are `@wesmun.com` before processing. If any invalid emails are found, it will exit with an error.

4. **Test First**: Always run with `--testRun` or `--fakeRun` before using `--run` to verify everything is configured correctly.

## 🔧 Troubleshooting

| Issue                                  | Solution                                                                 |
|----------------------------------------|--------------------------------------------------------------------------|
| "Chair info not found for committee X" | Ensure committee name in `chairsEmailLogin.csv` matches the CSV filename |
| "Replacement info not found"           | Ensure committee name in `bodyReplacements.csv` matches the CSV filename |
| "Invalid sender email"                 | Ensure all emails in `chairsEmailLogin.csv` end with `@wesmun.com`       |
| Authentication failed                  | Verify the PurelyMail password is correct for that email address         |
| Connection timeout                     | Check that PurelyMail SMTP (smtp.purelymail.com:587) is accessible       |

## 📜 License

Internal tool for WESMUN 2026 conference organization.
