import csv
import os

ALLOCATION_ALIASES = ["Allocation", "Delegation", "Country"]
INTEL_COL = "Intelligence Agency"
OUTPUT_COLS = ["Allocation", "Delegate Name", "Email"]

for filename in os.listdir("."):
    if not filename.lower().endswith(".csv"):
        continue

    with open(filename, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames

        if not headers:
            continue

        allocation_key = None
        for key in ALLOCATION_ALIASES:
            if key in headers:
                allocation_key = key
                break

        if allocation_key is None:
            raise ValueError(
                f"{filename} missing Allocation / Delegation / Country column"
            )

        for col in ["Delegate Name", "Email"]:
            if col not in headers:
                raise ValueError(f"{filename} missing required column: {col}")

        has_intel = INTEL_COL in headers
        rows = []

        for row in reader:
            allocation = row[allocation_key].strip()

            if has_intel:
                intel = row[INTEL_COL].strip()
                if intel:
                    allocation = f"{allocation} ({intel})"

            rows.append({
                "Allocation": allocation,
                "Delegate Name": row["Delegate Name"].strip(),
                "Email": row["Email"].strip()
            })

    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLS)
        writer.writeheader()
        writer.writerows(rows)

print("All CSV files processed.")
