import re
import sys
import time
import uuid as uid
from datetime import datetime, timedelta
import os

import psycopg2
from flask import Flask, request, render_template, jsonify, session, redirect, url_for, Response
from waitress import serve

app = Flask(__name__)

app.secret_key = os.getenv('FLASK_SECRET_KEY') 
USERNAME = os.getenv('USERNAME') 
PASSWORD = os.getenv('PASSWORD') 
DB_URL = os.getenv('DB_URL') 

# Maximum number of database connection retries
MAX_DB_RETRIES = 3
# Delay between retries (in seconds)
DB_RETRY_DELAY = 2


# --- DATABASE CONNECTION ---
def get_db():
    """ Establish a database connection and return it with retry mechanism. """
    retries = 0
    last_error = None

    while retries < MAX_DB_RETRIES:
        try:
            conn = psycopg2.connect(DB_URL)
            conn.autocommit = True
            return conn
        except psycopg2.OperationalError as e:
            last_error = e
            error_msg = str(e)

            # Check if this is the specific DNS resolution error
            if "could not translate host name" in error_msg and "to address" in error_msg:
                print(f"Critical database connection error: {error_msg}")
                # This will be caught by the server wrapper and trigger a restart
                sys.exit(1)

            # For other operational errors, retry
            retries += 1
            print(f"Database connection error (attempt {retries}/{MAX_DB_RETRIES}): {error_msg}")

            if retries < MAX_DB_RETRIES:
                time.sleep(DB_RETRY_DELAY)

    # If we've exhausted retries, re-raise the last error
    print(f"Failed to connect to database after {MAX_DB_RETRIES} attempts")
    raise last_error


# --- ROOT ROUTE ---
@app.route("/", methods=["GET"])
def home():
    uuid = request.args.get("uuid")  # Get the UUID from query parameters

    if session.get("logged_in"):
        if uuid:
            return redirect(f"/admin?uuid={uuid}")
        return redirect(f"/admin")
    if uuid:
        try:
            # Convert string to UUID object for validation
            uuid_obj = uid.UUID(uuid)
            # Convert back to string for database query
            uuid_str = str(uuid_obj)
        except ValueError:
            # Return a proper error page for invalid UUID format
            return render_template(
                "error.html",
                icon="fa-exclamation-triangle",
                title="Invalid UUID Format",
                message="The UUID you entered is not in a valid format.",
                error_details="Please check the UUID and try again. A valid UUID should look like: 123e4567-e89b-12d3-a456-426614174000",
                show_retry=True
            ), 400

        try:
            with get_db() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT name, scraps FROM credit_card WHERE uuid = %s", (uuid_str,))
                    user = cur.fetchone()

            if user:
                return render_template("balance.html", name=user[0], scraps=user[1], uuid=uuid_str)
            else:
                # Return a proper error page for user not found
                return render_template(
                    "error.html",
                    icon="fa-user-slash",
                    title="User Not Found",
                    message="We couldn't find a user with the provided UUID.",
                    error_details="Please check if you entered the correct UUID or contact an administrator for assistance.",
                    show_retry=True
                ), 404
        except Exception as e:
            print(f"Error in home route: {str(e)}")
            return render_template(
                "error.html",
                icon="fa-exclamation-circle",
                title="Server Error",
                message="An error occurred while processing your request.",
                error_details=f"Error details: {str(e)}",
                show_retry=True
            ), 500

    return render_template("index.html")


# --- ADMIN PANEL ---
@app.route("/admin", methods=["GET"])
def admin_panel():
    if not session.get("logged_in"):
        return redirect(url_for("login"))
    return render_template("admin.html")


# --- LOGS PAGE ---
@app.route("/admin/logs", methods=["GET", "POST"])
def admin_logs():
    if not session.get("logged_in"):
        return redirect(url_for("login"))
    search_query = request.form.get("search", "")
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT uuid, name, reason, timestamp FROM transaction_logs WHERE name ILIKE %s ORDER BY timestamp DESC",
                    ('%' + search_query + '%',))
                logs = cur.fetchall()
        return render_template("logs.html", logs=logs, search_query=search_query)
    except Exception as e:
        print(f"Error in admin_logs: {str(e)}")
        return render_template(
            "error.html",
            icon="fa-exclamation-circle",
            title="Server Error",
            message="An error occurred while retrieving logs.",
            error_details=f"Error details: {str(e)}",
            show_retry=True
        ), 500


@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        # Check the credentials
        if username == USERNAME and password == PASSWORD:
            session["logged_in"] = True
            return redirect(url_for("admin_panel"))
        else:
            error = "Invalid username or password. Please try again."

    return render_template("login.html", error=error)


# --- LOGOUT ROUTE ---
@app.route("/logout", methods=["GET"])
def logout():
    # Clear the session
    session.clear()
    # Redirect to home page
    return redirect(url_for("home"))


# --- USERS PAGE ---
@app.route("/admin/users", methods=["GET", "POST"])
def admin_users():
    if not session.get("logged_in"):
        return redirect(url_for("login"))
    search_query = request.form.get("search", "")
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT uuid, name, scraps FROM credit_card WHERE name ILIKE %s ORDER BY name ASC",
                            ('%' + search_query + '%',))
                users = cur.fetchall()
        return render_template("users.html", users=users, search_query=search_query)
    except Exception as e:
        print(f"Error in admin_users: {str(e)}")
        return render_template(
            "error.html",
            icon="fa-exclamation-circle",
            title="Server Error",
            message="An error occurred while retrieving users.",
            error_details=f"Error details: {str(e)}",
            show_retry=True
        ), 500


@app.route("/admin/add_user", methods=["POST"])
def add_user():
    if not session.get("logged_in"):
        return redirect(url_for("login"))

    data = request.json
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                # Insert the new user and get the UUID of the newly added user
                cur.execute("INSERT INTO credit_card (name, scraps) VALUES (%s, %s) RETURNING uuid",
                            (data["name"], data["scraps"]))
                new_uuid = cur.fetchone()[0]  # Get the first column of the first row (the UUID)
                conn.commit()

        # Return the success message with the newly created UUID
        return jsonify({
            "success": True,
            "message": "✅ User added successfully!",
            "uuid": str(new_uuid)
        })

    except Exception as e:
        print(f"Error adding user: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"❌ Error adding user: {str(e)}"
        })


@app.route("/admin/purchase", methods=["POST"])
def purchase():
    if not session.get("logged_in"):
        return redirect(url_for("login"))
    data = request.json
    try:
        scraps_amount = int(data["scraps"])
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE credit_card SET scraps = scraps - %s WHERE uuid = %s AND scraps >= %s RETURNING scraps",
                    (scraps_amount, data["uuid"], scraps_amount))

                if not cur.rowcount:
                    return jsonify({"message": "❌ Not enough scraps!"})

                # Include the amount in the reason for better tracking
                reason = f"{data['reason']} (-{scraps_amount} scraps)"

                cur.execute("INSERT INTO transaction_logs (uuid, name, reason) VALUES (%s, %s, %s)",
                            (data["uuid"], "Purchase", reason))
                conn.commit()
        return jsonify({"message": "💸 Purchase successful!"})
    except Exception as e:
        print(f"Error in purchase: {str(e)}")
        return jsonify({"message": f"❌ Error processing purchase: {str(e)}"})


@app.route("/admin/reimbursement", methods=["POST"])
def reimbursement():
    if not session.get("logged_in"):
        return redirect(url_for("login"))
    data = request.json
    try:
        scraps_amount = int(data["scraps"])
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE credit_card SET scraps = scraps + %s WHERE uuid = %s RETURNING scraps",
                            (scraps_amount, data["uuid"]))

                if not cur.rowcount:
                    return jsonify({"message": "❌ User not found!"})

                # Include the amount in the reason for better tracking
                reason = f"{data['reason']} (+{scraps_amount} scraps)"

                cur.execute("INSERT INTO transaction_logs (uuid, name, reason) VALUES (%s, %s, %s)",
                            (data["uuid"], "Reimbursement", reason))
                conn.commit()
        return jsonify({"message": "🔁 Reimbursement successful!"})
    except Exception as e:
        print(f"Error in reimbursement: {str(e)}")
        return jsonify({"message": f"❌ Error processing reimbursement: {str(e)}"})


# --- BATCH OPERATIONS ---
@app.route("/admin/batch-operation", methods=["POST"])
def batch_operation():
    if not session.get("logged_in"):
        return jsonify({"success": False, "message": "Not authorized"}), 403

    data = request.json
    operation_type = data.get("operation_type")
    filter_query = data.get("filter", "")
    amount = data.get("amount", 0)
    reason = data.get("reason", "Batch Operation")

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                if operation_type == "add_scraps":
                    # Add scraps to filtered users
                    if filter_query:
                        cur.execute(
                            "UPDATE credit_card SET scraps = scraps + %s WHERE name ILIKE %s RETURNING uuid, name",
                            (amount, '%' + filter_query + '%'))
                    else:
                        cur.execute("UPDATE credit_card SET scraps = scraps + %s RETURNING uuid, name",
                                    (amount,))

                    affected_users = cur.fetchall()
                    affected_count = len(affected_users)

                    # Log the batch transaction for each user
                    for user in affected_users:
                        cur.execute("INSERT INTO transaction_logs (uuid, name, reason) VALUES (%s, %s, %s)",
                                    (user[0], "Batch Add", f"{reason} (+{amount} scraps)"))

                    message = f"✅ Added {amount} scraps to {affected_count} users!"

                elif operation_type == "remove_scraps":
                    # Remove scraps from filtered users (only if they have enough)
                    if filter_query:
                        cur.execute(
                            "UPDATE credit_card SET scraps = scraps - %s WHERE name ILIKE %s AND scraps >= %s RETURNING uuid, name",
                            (amount, '%' + filter_query + '%', amount))
                    else:
                        cur.execute(
                            "UPDATE credit_card SET scraps = scraps - %s WHERE scraps >= %s RETURNING uuid, name",
                            (amount, amount))

                    affected_users = cur.fetchall()
                    affected_count = len(affected_users)

                    # Log the batch transaction for each user
                    for user in affected_users:
                        cur.execute("INSERT INTO transaction_logs (uuid, name, reason) VALUES (%s, %s, %s)",
                                    (user[0], "Batch Remove", f"{reason} (-{amount} scraps)"))

                    message = f"✅ Removed {amount} scraps from {affected_count} users!"

                else:
                    return jsonify({"success": False, "message": "Invalid operation type"})

                conn.commit()

        return jsonify({
            "success": True,
            "message": message,
            "affected_count": affected_count
        })
    except Exception as e:
        print(f"Error in batch operation: {str(e)}")
        return jsonify({"success": False, "message": f"❌ Error in batch operation: {str(e)}"})


# --- DATA EXPORT ---
@app.route("/admin/export-users", methods=["GET"])
def export_users():
    if not session.get("logged_in"):
        return redirect(url_for("login"))

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT uuid, name, scraps FROM credit_card ORDER BY name ASC")
                users = cur.fetchall()

        # Create CSV content
        csv_content = "UUID,Name,Scraps\n"
        for user in users:
            # Escape commas in names
            name = f'"{user[1]}"' if ',' in user[1] else user[1]
            csv_content += f"{user[0]},{name},{user[2]}\n"

        # Create response with CSV file
        response = Response(
            csv_content,
            mimetype="text/csv",
            headers={
                "Content-disposition": f"attachment; filename=users_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
        )
        return response
    except Exception as e:
        print(f"Error exporting users: {str(e)}")
        return f"Error exporting users: {str(e)}", 500


@app.route("/admin/export-transactions", methods=["GET"])
def export_transactions():
    if not session.get("logged_in"):
        return redirect(url_for("login"))

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT uuid, name, reason, timestamp FROM transaction_logs ORDER BY timestamp DESC")
                transactions = cur.fetchall()

        # Create CSV content
        csv_content = "UUID,Type,Reason,Timestamp\n"
        for transaction in transactions:
            # Escape commas in reason
            reason = f'"{transaction[2]}"' if ',' in transaction[2] else transaction[2]
            csv_content += f"{transaction[0]},{transaction[1]},{reason},{transaction[3]}\n"

        # Create response with CSV file
        response = Response(
            csv_content,
            mimetype="text/csv",
            headers={
                "Content-disposition": f"attachment; filename=transactions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
        )
        return response
    except Exception as e:
        print(f"Error exporting transactions: {str(e)}")
        return f"Error exporting transactions: {str(e)}", 500


# Helper function to extract amount from transaction reason
def extract_amount_from_reason(transaction_type, reason):
    try:
        # Log the input for debugging
        print(f"Extracting amount from: Type={transaction_type}, Reason={reason}")

        # Different patterns based on transaction type
        if transaction_type in ["Purchase", "Batch Remove"]:
            # Look for pattern like "(-X scraps)" or just numbers
            minus_pattern = r'$$-(\d+)\s*scraps$$'
            minus_match = re.search(minus_pattern, reason)
            if minus_match:
                amount = int(minus_match.group(1))
                print(f"Found amount with minus pattern: {amount}")
                return amount

            # Try another pattern like "- X scraps"
            alt_minus_pattern = r'-\s*(\d+)\s*scraps'
            alt_minus_match = re.search(alt_minus_pattern, reason)
            if alt_minus_match:
                amount = int(alt_minus_match.group(1))
                print(f"Found amount with alt minus pattern: {amount}")
                return amount

        elif transaction_type in ["Reimbursement", "Batch Add"]:
            # Look for pattern like "(+X scraps)" or just numbers
            plus_pattern = r'$$\+(\d+)\s*scraps$$'
            plus_match = re.search(plus_pattern, reason)
            if plus_match:
                amount = int(plus_match.group(1))
                print(f"Found amount with plus pattern: {amount}")
                return amount

            # Try another pattern like "+ X scraps"
            alt_plus_pattern = r'\+\s*(\d+)\s*scraps'
            alt_plus_match = re.search(alt_plus_pattern, reason)
            if alt_plus_match:
                amount = int(alt_plus_match.group(1))
                print(f"Found amount with alt plus pattern: {amount}")
                return amount

        # If specific patterns fail, try to find any number in the reason
        numbers = re.findall(r'\d+', reason)
        if numbers:
            amount = int(numbers[0])
            print(f"Found amount with generic number pattern: {amount}")
            return amount

        # If no amount found, log it and return default
        print(f"No amount found in reason: {reason}")
        return None
    except Exception as e:
        print(f"Error extracting amount: {str(e)}")
        return None


# --- USER TRANSACTIONS API ---
@app.route("/api/user-transactions", methods=["GET"])
def user_transactions():
    uuid = request.args.get("uuid")

    if not uuid:
        return jsonify({"success": False, "message": "UUID is required"}), 400

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                # Get user transactions
                cur.execute("""
                    SELECT name, reason, timestamp 
                    FROM transaction_logs 
                    WHERE uuid = %s 
                    ORDER BY timestamp DESC 
                    LIMIT 10
                """, (uuid,))

                transactions = []
                for row in cur.fetchall():
                    transaction_type = row[0]
                    reason = row[1]
                    timestamp = row[2]

                    transactions.append({
                        "type": transaction_type,
                        "reason": reason,
                        "timestamp": timestamp.isoformat()
                    })

                return jsonify({
                    "success": True,
                    "transactions": transactions
                })

    except Exception as e:
        print(f"Error in user_transactions: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


# --- TRANSACTION ANALYTICS ---
@app.route("/api/transaction-analytics", methods=["GET"])
def transaction_analytics():
    if not session.get("logged_in"):
        return jsonify({"success": False, "message": "Not authorized"}), 403

    hours = int(request.args.get("hours", 24))
    transaction_type = request.args.get("type", "all")

    try:
        # Calculate time range
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)

        with get_db() as conn:
            with conn.cursor() as cur:
                # Build query based on transaction type
                if transaction_type == "all":
                    query = """
                        SELECT 
                            DATE_TRUNC('hour', timestamp) as hour_timestamp,
                            name,
                            COUNT(*) as count
                        FROM transaction_logs
                        WHERE timestamp >= %s AND timestamp <= %s
                        GROUP BY DATE_TRUNC('hour', timestamp), name
                        ORDER BY hour_timestamp
                    """
                    cur.execute(query, (start_time, end_time))
                else:
                    query = """
                        SELECT 
                            DATE_TRUNC('hour', timestamp) as hour_timestamp,
                            name,
                            COUNT(*) as count
                        FROM transaction_logs
                        WHERE timestamp >= %s AND timestamp <= %s AND name = %s
                        GROUP BY DATE_TRUNC('hour', timestamp), name
                        ORDER BY hour_timestamp
                    """
                    cur.execute(query, (start_time, end_time, transaction_type))

                results = cur.fetchall()

        # Process results into a format suitable for charts
        hours_labels = []
        purchases = []
        reimbursements = []

        # Create a dictionary to store counts by hour
        hour_data = {}

        for row in results:
            hour_str = row[0].strftime("%Y-%m-%d %H:00")
            if hour_str not in hour_data:
                hour_data[hour_str] = {"Purchase": 0, "Reimbursement": 0}

            transaction_name = row[1]
            if transaction_name in ["Purchase", "Reimbursement"]:
                hour_data[hour_str][transaction_name] = row[2]

        # Fill in missing hours in the range
        current_hour = start_time.replace(minute=0, second=0, microsecond=0)
        while current_hour <= end_time:
            hour_str = current_hour.strftime("%Y-%m-%d %H:00")
            if hour_str not in hour_data:
                hour_data[hour_str] = {"Purchase": 0, "Reimbursement": 0}
            current_hour += timedelta(hours=1)

        # Sort hours and create final arrays
        sorted_hours = sorted(hour_data.keys())
        for hour in sorted_hours:
            hours_labels.append(hour)
            purchases.append(hour_data[hour]["Purchase"])
            reimbursements.append(hour_data[hour]["Reimbursement"])

        return jsonify({
            "success": True,
            "data": {
                "labels": hours_labels,
                "purchases": purchases,
                "reimbursements": reimbursements
            }
        })
    except Exception as e:
        print(f"Error in transaction_analytics: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


# --- DASHBOARD STATS ---
@app.route("/api/dashboard-stats", methods=["GET"])
def dashboard_stats():
    if not session.get("logged_in"):
        return jsonify({"success": False, "message": "Not authorized"}), 403

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                # Get total users
                cur.execute("SELECT COUNT(*) FROM credit_card")
                total_users = cur.fetchone()[0]

                # Get total transactions
                cur.execute("SELECT COUNT(*) FROM transaction_logs")
                total_transactions = cur.fetchone()[0]

                # Get total scraps
                cur.execute("SELECT SUM(scraps) FROM credit_card")
                total_scraps = cur.fetchone()[0] or 0

        return jsonify({
            "success": True,
            "totalUsers": total_users,
            "totalTransactions": total_transactions,
            "totalScraps": total_scraps
        })
    except Exception as e:
        print(f"Error in dashboard_stats: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


# --- FRAUD DETECTION ---
@app.route("/api/fraud-detection", methods=["GET"])
def fraud_detection():
    if not session.get("logged_in"):
        return jsonify({"success": False, "message": "Not authorized"}), 403

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                # Get time range (hours by default)
                hours = int(request.args.get("hours", 12))
                end_time = datetime.now()
                start_time = end_time - timedelta(hours=hours)

                # 1. Detect frequent transactions from same UUID
                cur.execute("""
                    SELECT uuid, COUNT(*) as transaction_count
                    FROM transaction_logs
                    WHERE timestamp >= %s
                    GROUP BY uuid
                    HAVING COUNT(*) > 5
                    ORDER BY transaction_count DESC
                    LIMIT 10
                """, (start_time,))

                frequent_users = []
                for row in cur.fetchall():
                    # Get username
                    cur.execute("SELECT name FROM credit_card WHERE uuid = %s", (row[0],))
                    user_name = cur.fetchone()[0] if cur.rowcount > 0 else "Unknown"

                    frequent_users.append({
                        "uuid": row[0],
                        "name": user_name,
                        "transaction_count": row[1],
                        "risk_level": "high" if row[1] > 30 else "medium"
                    })

                # 2. Detect duplicate reasons (same reason used multiple times)
                cur.execute("""
                    SELECT uuid, reason, COUNT(*) as reason_count
                    FROM transaction_logs
                    WHERE timestamp >= %s AND name = 'Purchase'
                    GROUP BY uuid, reason
                    HAVING COUNT(*) > 2
                    ORDER BY reason_count DESC
                    LIMIT 10
                """, (start_time,))

                duplicate_reasons = []
                for row in cur.fetchall():
                    # Get username
                    cur.execute("SELECT name FROM credit_card WHERE uuid = %s", (row[0],))
                    user_name = cur.fetchone()[0] if cur.rowcount > 0 else "Unknown"

                    duplicate_reasons.append({
                        "uuid": row[0],
                        "name": user_name,
                        "reason": row[1],
                        "count": row[2],
                        "risk_level": "high" if row[2] > 5 else "medium"
                    })

                # 3. Detect unusual transaction patterns (purchase followed by reimbursement)
                cur.execute("""
                    WITH user_transactions AS (
                        SELECT 
                            uuid, 
                            name as transaction_type, 
                            timestamp,
                            LAG(name) OVER (PARTITION BY uuid ORDER BY timestamp) as prev_type,
                            LAG(timestamp) OVER (PARTITION BY uuid ORDER BY timestamp) as prev_timestamp
                        FROM transaction_logs
                        WHERE timestamp >= %s
                    )
                    SELECT 
                        uuid, 
                        COUNT(*) as pattern_count
                    FROM user_transactions
                    WHERE 
                        transaction_type = 'Reimbursement' AND 
                        prev_type = 'Purchase' AND
                        timestamp - prev_timestamp < interval '1 hour'
                    GROUP BY uuid
                    HAVING COUNT(*) > 2
                    ORDER BY pattern_count DESC
                    LIMIT 10
                """, (start_time,))

                unusual_patterns = []
                for row in cur.fetchall():
                    # Get username
                    cur.execute("SELECT name FROM credit_card WHERE uuid = %s", (row[0],))
                    user_name = cur.fetchone()[0] if cur.rowcount > 0 else "Unknown"

                    unusual_patterns.append({
                        "uuid": row[0],
                        "name": user_name,
                        "pattern": "Purchase-Reimbursement cycle",
                        "count": row[1],
                        "risk_level": "high" if row[1] > 3 else "medium"
                    })

                # 4. Detect unusual transaction times (outside normal hours 8am-8pm)
                unusual_times = []  # Empty list since we're removing this risk factor

                # 5. Detect sudden balance changes
                cur.execute(r"""
                    WITH balance_changes AS (
    SELECT 
        tl.uuid,
        tl.name AS transaction_type,
        CASE 
            WHEN tl.name IN ('Purchase', 'Batch Remove') THEN -1
            WHEN tl.name IN ('Reimbursement', 'Batch Add') THEN 1
            ELSE 0
        END AS direction,
        tl.reason,
        tl.timestamp
    FROM transaction_logs tl
    WHERE timestamp >= %s
)
SELECT 
    uuid, 
    COUNT(*) AS large_changes
FROM balance_changes
WHERE 
    reason ~ '[-+]?\d{2,}'  -- Matches numbers 30 and above (positive or negative)
    AND ABS(CAST((regexp_match(reason, '[-+]?\d{2,}'))[1] AS INTEGER)) >= 30
GROUP BY uuid
HAVING COUNT(*) > 2
ORDER BY large_changes DESC
LIMIT 10;
                """, (start_time,))

                large_changes = []
                for row in cur.fetchall():
                    # Get username
                    cur.execute("SELECT name FROM credit_card WHERE uuid = %s", (row[0],))
                    user_name = cur.fetchone()[0] if cur.rowcount > 0 else "Unknown"

                    large_changes.append({
                        "uuid": row[0],
                        "name": user_name,
                        "count": row[1],
                        "risk_level": "high" if row[1] > 4 else "medium"
                    })

                # Calculate overall risk score for each user
                all_uuids = set()
                for item in frequent_users + duplicate_reasons + unusual_patterns + unusual_times + large_changes:
                    all_uuids.add(item["uuid"])

                risk_scores = {}
                for uuid in all_uuids:
                    risk_score = 0

                    # Add scores from frequent transactions
                    for item in frequent_users:
                        if item["uuid"] == uuid:
                            risk_score += 30 if item["risk_level"] == "high" else 15

                    # Add scores from duplicate reasons
                    for item in duplicate_reasons:
                        if item["uuid"] == uuid:
                            risk_score += 25 if item["risk_level"] == "high" else 10

                    # Add scores from unusual patterns
                    for item in unusual_patterns:
                        if item["uuid"] == uuid:
                            risk_score += 40 if item["risk_level"] == "high" else 20

                    # Add scores from large changes
                    for item in large_changes:
                        if item["uuid"] == uuid:
                            risk_score += 35 if item["risk_level"] == "high" else 15

                    # Get username
                    cur.execute("SELECT name FROM credit_card WHERE uuid = %s", (uuid,))
                    user_name = cur.fetchone()[0] if cur.rowcount > 0 else "Unknown"

                    risk_scores[uuid] = {
                        "uuid": uuid,
                        "name": user_name,
                        "score": risk_score,
                        "level": "high" if risk_score > 70 else "medium" if risk_score > 30 else "low"
                    }

                # Sort risk scores by score (descending)
                sorted_risk_scores = sorted(
                    risk_scores.values(),
                    key=lambda x: x["score"],
                    reverse=True
                )

                return jsonify({
                    "success": True,
                    "frequent_users": frequent_users,
                    "duplicate_reasons": duplicate_reasons,
                    "unusual_patterns": unusual_patterns,
                    "unusual_times": unusual_times,
                    "large_changes": large_changes,
                    "risk_scores": sorted_risk_scores[:10]  # Top 10 highest risk users
                })

    except Exception as e:
        print(f"Error in fraud_detection: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    print("Starting Flask application...")
    try:
        # Test database connection on startup
        with get_db() as conn_main:
            with conn_main.cursor() as cur_main:
                cur_main.execute("SELECT 1")
        print("Database connection successful")

        # Run with Waitress
        serve(app, host="0.0.0.0", port=5000)
    except Exception as err:
        print(f"Failed to start application: {str(err)}")
        sys.exit(1)
