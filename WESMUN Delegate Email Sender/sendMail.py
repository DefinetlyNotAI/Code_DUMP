import csv
import argparse
import smtplib
from email.message import EmailMessage
from email.utils import formataddr
from pathlib import Path
import logging
import sys

# --- Setup logging ---
logging.basicConfig(
    filename='email_sender.log',
    filemode='a',
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.DEBUG
)
console = logging.StreamHandler()
console.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(levelname)s - %(message)s')
console.setFormatter(formatter)
logging.getLogger('').addHandler(console)

# --- Paths ---
CSV_DIR = Path("./countryMatrixCSV")
CHAIRS_CSV = Path("./chairsEmailLogin.csv")
REPLACEMENTS_CSV = Path("./bodyReplacements.csv")
BODY_FILE = Path("./body.txt")
ATTACHMENTS_DIR = Path("./allAttachments")
BGG_DIR = ATTACHMENTS_DIR / "BackGroundGuide"

# --- Command line arguments ---
parser = argparse.ArgumentParser(description="WESMUN 2026 Email Sender")
parser.add_argument("--testRun", action="store_true", help="Do everything except send emails")
parser.add_argument("--run", action="store_true", help="Send emails after validation")
parser.add_argument("--fakeRun", action="store_true", help="Send emails to it@wesmun.com instead of actual TO")
args = parser.parse_args()

if not any([args.testRun, args.run, args.fakeRun]):
    logging.error("You must specify --testRun, --run, or --fakeRun")
    sys.exit(1)


# --- Helper functions ---
def load_csv_dict(path, key_field):
    data = {}
    if not path.exists():
        logging.error(f"CSV file not found: {path}")
        return data
    with open(path, newline='', encoding='utf-8') as _f:
        _reader = csv.DictReader(_f)
        for row in _reader:
            key = row.get(key_field)
            if key:
                data[key] = row
    return data


def build_body(template, replacements):
    _body = template
    for k, v in replacements.items():
        _body = _body.replace(f"[[{k}]]", v)
        _body = _body.replace(f"[[{k}.lower]]", v.lower())
    return _body


def send_email_with_smtp(smtp, _from_email, _from_name, _to_email, subject, _body, _attachments=None, real_run=False):
    """Send email using an existing SMTP connection."""
    msg = EmailMessage()
    msg['From'] = formataddr((_from_name, _from_email))
    msg['To'] = _to_email
    msg['Subject'] = subject

    cc_emails = ["it@wesmun.com", "secretariat@wesmun.com", "chiefofstaff@wesmun.com"]
    msg['Cc'] = ", ".join(cc_emails)
    msg.set_content(_body)

    if _attachments:
        for _f in _attachments:
            msg.add_attachment(_f['content'], maintype='application', subtype='pdf', filename=_f['filename'])

    smtp.send_message(msg)
    logging.info(f"✓ Email sent to {_to_email}" + (f" CC: {msg['Cc']}" if real_run else ""))


def get_smtp_connection(_from_email, password):
    """Create and authenticate an SMTP connection."""
    # Validate sender email is from wesmun.com
    if not _from_email.endswith('@wesmun.com'):
        raise ValueError(f"Invalid sender email: {_from_email}. Only @wesmun.com emails are allowed.")

    smtp = smtplib.SMTP('smtp.purelymail.com', 587)
    smtp.ehlo()
    smtp.starttls()
    smtp.ehlo()
    smtp.login(_from_email, password)
    return smtp


def load_attachments_once(attachments_dir):
    """Preload all common attachments into memory."""
    attachments = []
    for f in attachments_dir.iterdir():
        if f.is_file():
            with open(f, "rb") as fp:
                attachments.append({"filename": f.name, "content": fp.read()})
    logging.info(f"✓ Loaded {len(attachments)} common attachments into memory")
    return attachments


def load_committee_guide(committee_name, bgg_dir):
    """Load committee-specific background guide if it exists."""
    guide_path = bgg_dir / f"{committee_name}.pdf"
    if guide_path.exists():
        with open(guide_path, "rb") as fp:
            return {"filename": guide_path.name, "content": fp.read()}
    return None


# --- Main execution ---
def main():
    # Load chairs info
    chairs_data = load_csv_dict(CHAIRS_CSV, "name")

    # Validate all chair emails are @wesmun.com
    invalid_emails = []
    for committee, info in chairs_data.items():
        email = info.get('email', '')
        if not email.endswith('@wesmun.com'):
            invalid_emails.append(f"{committee}: {email}")

    if invalid_emails:
        logging.error("The following committee emails are NOT @wesmun.com addresses:")
        for invalid in invalid_emails:
            logging.error(f"  ✗ {invalid}")
        logging.error("Please update chairsEmailLogin.csv to use only @wesmun.com email addresses.")
        sys.exit(1)

    logging.info(f"✓ All {len(chairs_data)} committee emails validated as @wesmun.com")

    # Load body replacements
    replacements_data = load_csv_dict(REPLACEMENTS_CSV, "name")

    # Load email body template
    if not BODY_FILE.exists():
        logging.error(f"Email body template not found: {BODY_FILE}")
        sys.exit(1)

    with open(BODY_FILE, "r", encoding="utf-8") as f:
        body_template = f.read()

    # Preload all common attachments ONCE (major performance boost!)
    common_attachments = load_attachments_once(ATTACHMENTS_DIR)

    # Cache for committee-specific guides
    committee_guides = {}

    # Process each committee CSV
    for csv_file in CSV_DIR.glob("*.csv"):
        committee_name = csv_file.stem
        logging.info(f"Processing committee: {committee_name}")

        # Load delegates
        try:
            with open(csv_file, newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                delegates = list(reader)
        except Exception as e:
            logging.error(f"Failed to read {csv_file}: {e}")
            continue

        # Get chair info for this committee
        chair_info = chairs_data.get(committee_name)
        if not chair_info:
            logging.warning(f"Chair info not found for committee {committee_name}, skipping all delegates")
            continue

        from_name = chair_info['name']
        from_email = chair_info['email']
        from_password = chair_info['password']

        # Get replacements for this committee
        rep_info = replacements_data.get(committee_name)
        if not rep_info:
            logging.warning(f"Replacement info not found for committee {committee_name}, skipping")
            continue

        # Load committee-specific guide once per committee
        if committee_name not in committee_guides:
            guide = load_committee_guide(committee_name, BGG_DIR)
            committee_guides[committee_name] = guide

        committee_guide = committee_guides[committee_name]

        # Prepare attachments list for this committee (common + committee-specific)
        attachments = common_attachments.copy()
        if committee_guide:
            attachments.append(committee_guide)

        # Create SMTP connection once per committee (reuse for all delegates)
        smtp = None
        try:
            if not args.testRun:
                smtp = get_smtp_connection(from_email, from_password)
                logging.info(f"✓ SMTP connection established for {from_email}")

            # Process all delegates for this committee
            for delegate in delegates:
                try:
                    to_name = delegate.get("Delegate Name")
                    to_email = delegate.get("Email")
                    allocation = delegate.get("Allocation", "")

                    logging.info(f"Processing delegate: {to_name} ({allocation}) - {to_email}")

                    if args.fakeRun:
                        to_email = "it@wesmun.com"

                    # Build personalized email body
                    body_replacements = {
                        "name": committee_name,
                        "name.lowercase": committee_name.lower(),
                        "delegateName": to_name,
                        "allocation": allocation,
                        "Agenda1": rep_info.get("Agenda1", ""),
                        "Agenda2": rep_info.get("Agenda2", ""),
                        "GCLink": rep_info.get("GCLink", "")
                    }

                    body = build_body(body_template, body_replacements)

                    if args.testRun:
                        logging.info(
                            f"[TEST] Would send email to {to_email} with subject 'WESMUN 2026 - Committee Allocation' "
                            f"and {len(attachments)} attachments"
                        )
                    elif args.run:
                        send_email_with_smtp(smtp, from_email, from_name,
                                             to_email, "WESMUN 2026 - Committee Allocation", body,
                                             attachments, real_run=True)
                    elif args.fakeRun:
                        send_email_with_smtp(smtp, from_email, from_name,
                                             to_email, "WESMUN 2026 - Committee Allocation", body,
                                             attachments, real_run=False)

                except Exception as e:
                    logging.error(f"Failed processing delegate {delegate.get('Delegate Name')}: {e}")

        except smtplib.SMTPAuthenticationError as err:
            logging.error(f"✗ Authentication failed for {from_email}: {err}")
            logging.error(f"  → Check your PurelyMail password for {from_email}")
        except Exception as err:
            logging.error(f"✗ Error processing committee {committee_name}: {err}")
        finally:
            # Close SMTP connection after processing all delegates in committee
            if smtp:
                try:
                    smtp.quit()
                    logging.info(f"✓ SMTP connection closed for {from_email}")
                except Exception:
                    pass

    logging.info("Script finished.")


if __name__ == "__main__":
    main()
