import os
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
import gspread
from oauth2client.service_account import ServiceAccountCredentials

app = Flask(__name__)

# Security & Config
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secret-dev-key")  # Change in production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)
jwt = JWTManager(app)
CORS(app)

# Google Sheets Config
SCOPE = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive"
]

# Hardcoded Users (For Prototype) - NOW DEPRECATED in favor of Sheet
# USERS = {
#     "reception": {"password": "pass", "role": "receptionist"},
#     "tech": {"password": "pass", "role": "technician"},
#     "admin": {"password": "admin", "role": "admin"}
# }

# Global GSpread Client
GSPREAD_CLIENT = None

def get_db_connection():
    global GSPREAD_CLIENT
    
    # Return existing client if valid
    if GSPREAD_CLIENT:
        try:
            # Test connection
            GSPREAD_CLIENT.open("Medical_Referrals")
            return GSPREAD_CLIENT
        except Exception:
            # Reconnect if session expired
            GSPREAD_CLIENT = None

    try:
        if os.environ.get("GOOGLE_CREDENTIALS"):
            creds_dict = json.loads(os.environ["GOOGLE_CREDENTIALS"])
            creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, SCOPE)
        else:
            creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", SCOPE)
        
        client = gspread.authorize(creds)
        # Return the Spreadsheet object, not the Client
        return client.open("Medical_Referrals")
    except Exception as e:
        print(f"Error connecting to Google Sheets: {e}")
        return None

# --- Auth Routes ---

@app.route('/api/login', methods=['POST'])
def login():
    username = request.json.get("username", None)
    password = request.json.get("password", None)

    # Hardcoded fallback for Admin bootstrapping
    if username == "admin" and password == "admin123":
         access_token = create_access_token(identity="admin", additional_claims={"role": "admin"})
         return jsonify(access_token=access_token, role="admin")

    try:
        sheet = get_db_connection()
        if not sheet:
             return jsonify({"msg": "Database error"}), 500
        
        # Verify against Users sheet
        # Expected Columns: Username, Password, Role
        try:
            users_ws = sheet.worksheet("Users")
        except gspread.exceptions.WorksheetNotFound:
            # Create if not exists
            users_ws = sheet.add_worksheet(title="Users", rows=100, cols=3)
            users_ws.append_row(["Username", "Password", "Role"])
        
        users = users_ws.get_all_records()
        
        user_found = None
        for u in users:
            if str(u.get("Username")) == username and str(u.get("Password")) == password:
                user_found = u
                break
        
        if not user_found:
             return jsonify({"msg": "Bad username or password"}), 401

        # Create token
        additional_claims = {"role": user_found["Role"]}
        access_token = create_access_token(identity=username, additional_claims=additional_claims)
        return jsonify(access_token=access_token, role=user_found["Role"])

    except Exception as e:
        return jsonify({"msg": str(e)}), 500

@app.route('/api/admin/create-user', methods=['POST'])
@jwt_required()
def create_user():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"msg": "Access forbidden: Admin only"}), 403

    data = request.json
    new_username = data.get("username")
    new_password = data.get("password")
    new_role = data.get("role") # receptionist, technician, admin

    if not all([new_username, new_password, new_role]):
        return jsonify({"msg": "Missing fields"}), 400

    try:
        sheet = get_db_connection()
        try:
            users_ws = sheet.worksheet("Users")
        except:
             users_ws = sheet.add_worksheet(title="Users", rows=100, cols=3)
             users_ws.append_row(["Username", "Password", "Role"])

        # Check if user exists
        existing_users = users_ws.col_values(1) # Column A is Username
        if new_username in existing_users:
             return jsonify({"msg": "Username already exists"}), 400

        users_ws.append_row([new_username, new_password, new_role])
        return jsonify({"message": "User created successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/get-users', methods=['GET'])
@jwt_required()
def get_users():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"msg": "Access forbidden"}), 403
    
    try:
        sheet = get_db_connection()
        users_ws = sheet.worksheet("Users")
        users = users_ws.get_all_records()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/delete-user', methods=['POST'])
@jwt_required()
def delete_user():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"msg": "Access forbidden"}), 403
        
    username_to_delete = request.json.get("username")
    if not username_to_delete:
        return jsonify({"msg": "Missing username"}), 400
        
    if username_to_delete == "admin":
        return jsonify({"msg": "Cannot delete root admin"}), 400

    try:
        sheet = get_db_connection()
        users_ws = sheet.worksheet("Users")
        cell = users_ws.find(username_to_delete)
        
        if cell:
            users_ws.delete_rows(cell.row)
            return jsonify({"message": "User deleted successfully"}), 200
        else:
            return jsonify({"msg": "User not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/update-user', methods=['POST'])
@jwt_required()
def update_user():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"msg": "Access forbidden"}), 403
        
    data = request.json
    username = data.get("username")
    new_password = data.get("password")
    new_role = data.get("role")
    
    if not username:
        return jsonify({"msg": "Missing username"}), 400

    try:
        sheet = get_db_connection()
        users_ws = sheet.worksheet("Users")
        cell = users_ws.find(username)
        
        if cell:
            row_idx = cell.row
            if new_password:
                users_ws.update_cell(row_idx, 2, new_password) # Column B
            if new_role:
                users_ws.update_cell(row_idx, 3, new_role) # Column C
            return jsonify({"message": "User updated successfully"}), 200
        else:
            return jsonify({"msg": "User not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Reception Routes ---

@app.route('/api/reception/add-record', methods=['POST'])
@jwt_required()
def add_record():
    claims = get_jwt()
    if claims["role"] != "receptionist":
        return jsonify({"msg": "Access forbidden: Receptionist only"}), 403

    data = request.json
    current_user = get_jwt_identity()
    
    # Timestamp
    created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Extract Reception Data
    row = [
        data.get('full_name', ''),              # 0 Full Name
        data.get('national_id', ''),            # 1 National ID
        data.get('age', ''),                    # 2 Age
        data.get('gender', ''),                 # 3 Gender
        data.get('patient_phone', ''),          # 4 Phone Number (Patient)
        data.get('emergency_contact', ''),      # 5 Emergency Contact
        data.get('email', ''),                  # 6 Email
        data.get('scan_type', ''),              # 7 Scan Type
        data.get('contrast', 'No'),             # 8 Contrast?
        data.get('date_booking', ''),           # 9 Date of Booking
        data.get('date_scan', ''),              # 10 Date of Scan
        data.get('cancellation_info', ''),      # 11 Cancellation Info
        data.get('referral_source', ''),        # 12 Referral Source
        data.get('hospital', ''),               # 13 Hospital
        data.get('doctor_name', ''),            # 14 Doctor Name
        data.get('department', ''),             # 15 Department
        data.get('doctor_phone', ''),           # 16 Phone Number (Doctor)
        "",                                     # 17 Clinical Notes (Tech)
        "",                                     # 18 Technician Name (Tech)
        "",                                     # 19 Scan Quality (Tech)
        "",                                     # 20 Image Release Date (Tech)
        "Pending",                              # 21 Result Status (Tech)
        "",                                     # 22 Radiologist Name (Tech)
        current_user,                           # 23 Receptionist ID (Audit)
        "",                                     # 24 Technician ID (Audit)
        created_at,                             # 25 Created At
        ""                                      # 26 Updated At
    ]

    try:
        sheet = get_db_connection()
        if not sheet:
            return jsonify({"error": "Database connection failed"}), 500
        
        ws = sheet.worksheet("Records")
        ws.append_row(row)
        return jsonify({"message": "Record created successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Technician Routes ---

@app.route('/api/technician/update-record', methods=['POST'])
@jwt_required()
def update_record():
    claims = get_jwt()
    if claims["role"] != "technician":
        return jsonify({"msg": "Access forbidden: Technician only"}), 403

    data = request.json
    current_user = get_jwt_identity()
    target_id = data.get('national_id') # Using National ID to find row
    
    if not target_id:
        return jsonify({"error": "National ID is required to update record"}), 400

    updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        sheet = get_db_connection()
        if not sheet:
            return jsonify({"error": "Database connection failed"}), 500
        
        ws = sheet.worksheet("Records")
        
        # --- ROBUST COLUMN FINDING ---
        # Instead of hardcoded indices, we find the column index by Header Name.
        # This prevents bugs if columns are reordered in the Sheet.
        
        headers = ws.row_values(1) # Get first row
        
        def get_col_idx(header_name):
            try:
                # Add 1 because gspread is 1-indexed, Python list is 0-indexed
                return headers.index(header_name) + 1
            except ValueError:
                return None

        # Find specific column indices based on your exact Sheet headers
        # Adjust these strings if your Sheet headers are slightly different!
        col_clinical = get_col_idx("Clinical Notes") or get_col_idx("Эмнэлзүйн мэдээлэл")
        col_tech = get_col_idx("Technician Name") or get_col_idx("Техникчийн нэр")
        col_quality = get_col_idx("Scan Quality/Notes") or get_col_idx("Шинжилгээний Чанар/Тэмдэглэл")
        col_release = get_col_idx("Image/CD Release Date") or get_col_idx("Зураг/CD-г Гаргаж Өгсөн Огноо/Цаг")
        col_status = get_col_idx("Result Status") or get_col_idx("Хариу гарсан эсэх") or get_col_idx("Result Out")
        col_radiologist = get_col_idx("Radiologist Name") or get_col_idx("Дүгнэлт гаргах эмчийн нэр")
        
        col_tech_id = get_col_idx("Technician ID")
        col_updated = get_col_idx("Updated At")

        # Find the row by National ID
        cell = ws.find(target_id)
        if not cell:
            return jsonify({"error": "Record not found"}), 404
            
        row_idx = cell.row
        
        updates = []
        if col_clinical: updates.append({'range': f'{gspread.utils.rowcol_to_a1(row_idx, col_clinical)}', 'values': [[data.get('clinical_notes', '')]]})
        if col_tech: updates.append({'range': f'{gspread.utils.rowcol_to_a1(row_idx, col_tech)}', 'values': [[data.get('technician_name', '')]]})
        if col_quality: updates.append({'range': f'{gspread.utils.rowcol_to_a1(row_idx, col_quality)}', 'values': [[data.get('scan_quality', '')]]})
        if col_release: updates.append({'range': f'{gspread.utils.rowcol_to_a1(row_idx, col_release)}', 'values': [[data.get('image_release_date', '')]]})
        if col_status: updates.append({'range': f'{gspread.utils.rowcol_to_a1(row_idx, col_status)}', 'values': [[data.get('result_status', '')]]})
        if col_radiologist: updates.append({'range': f'{gspread.utils.rowcol_to_a1(row_idx, col_radiologist)}', 'values': [[data.get('radiologist_name', '')]]})
        
        if col_tech_id: updates.append({'range': f'{gspread.utils.rowcol_to_a1(row_idx, col_tech_id)}', 'values': [[current_user]]})
        if col_updated: updates.append({'range': f'{gspread.utils.rowcol_to_a1(row_idx, col_updated)}', 'values': [[updated_at]]})
        
        if updates:
            ws.batch_update(updates)
            return jsonify({"message": "Record updated successfully"}), 200
        else:
            return jsonify({"error": "Could not find target columns in Sheet header"}), 500

    except gspread.exceptions.CellNotFound:
        return jsonify({"error": "Record not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- General Routes ---

@app.route('/api/general/get-records', methods=['GET'])
@jwt_required()
def get_all_records():
    try:
        sheet = get_db_connection()
        if not sheet:
            return jsonify({"error": "Database connection failed - Check server logs"}), 500
            
        ws = sheet.worksheet("Records")
        records = ws.get_all_records()
        return jsonify(records), 200
    except Exception as e:
        print(f"GET RECORDS ERROR: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/calculate-bonus', methods=['GET'])
@jwt_required()
def calculate_bonus():
    # Bonus Logic: Fixed Weekly Cycle (Friday 17:00 to Friday 17:00)
    # Accepts optional 'date' parameter to calculate for a specific past week.
    
    target_date_str = request.args.get('date')
    
    try:
        sheet = get_db_connection()
        if not sheet:
            return jsonify({"error": "Database connection failed"}), 500
            
        records_ws = sheet.worksheet("Records")
        bonus_ws = sheet.worksheet("Weekly_Bonuses")
        
        all_records = records_ws.get_all_records()
        
        doctor_stats = {}
        
        # --- Time Window Calculation ---
        if target_date_str:
            # If date provided, use it as the reference point (End of Day)
            now = datetime.strptime(target_date_str, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        else:
            now = datetime.now()
        
        # Find the most recent Friday 17:00
        # Weekday: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
        days_ahead = 4 - now.weekday()
        if days_ahead > 0: 
            # It's Mon-Thu. Target is Last Friday.
             days_ahead -= 7
        elif days_ahead == 0:
            # It's Friday. Check time.
            if now.hour < 17:
                days_ahead -= 7
        
        # Calculate the End Date of the period (Friday 17:00)
        end_date = now + timedelta(days=days_ahead)
        end_date = end_date.replace(hour=17, minute=0, second=0, microsecond=0)
        
        # Start Date is 7 days before End Date
        start_date = end_date - timedelta(days=7)

        # Format for display
        period_str = f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
        
        for record in all_records:
            # 1. Try to use 'Created At' for precise timestamp filtering
            timestamp_str = record.get('Created At') or record.get('Updated At')
            record_dt = None
            
            if timestamp_str:
                try:
                    record_dt = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    pass
            
            # 2. Fallback to 'Date of Scan' (Treat as 00:00 on that day)
            if not record_dt:
                date_str = record.get('Date of Scan') or record.get('Шинжилгээнд орох огноо') or record.get('Шинжилгээ өгөх огноо')
                if date_str:
                    try:
                        record_dt = datetime.strptime(date_str, "%Y-%m-%d")
                    except ValueError:
                        continue
            
            if not record_dt: continue

            # Check if record falls within the fixed weekly window
            if start_date < record_dt <= end_date:
                source = record.get('Referral Source', '') or record.get('Илгээсэн эх сурвалж', '') or record.get('Эх сурвалж', '')
                if source not in ["Facebook", "Self", "Unknown", "Өөрөө", "Self/Facebook"]:
                    doctor = record.get('Doctor Name') or record.get('Эмчийн нэр')
                    patient_name = record.get('Full Name') or record.get('Name') or record.get('Овог Нэр') or "Unknown"
                    
                    if doctor and doctor != "N/A":
                        if doctor not in doctor_stats:
                            doctor_stats[doctor] = []
                        doctor_stats[doctor].append(patient_name)
        
        results = []
        current_date_str = datetime.now().strftime("%Y-%m-%d")
        
        for doctor, patients in doctor_stats.items():
            count = len(patients)
            bonus_amount = count * 50000
            patients_str = ", ".join(patients)
            
            results.append({
                "Doctor": doctor,
                "Count": count,
                "Bonus": bonus_amount,
                "Patients": patients,
                "Period": period_str
            })
            
            # Only append to sheet if we are calculating for the CURRENT cycle or if specifically requested to save history?
            # For now, let's always append so there is a record of the calculation being run.
            # But duplicate checks might be good? Skipping for simplicity/flexibility.
            bonus_ws.append_row([current_date_str, doctor, count, bonus_amount, patients_str, period_str])
            
        return jsonify(results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/bonus-history', methods=['GET'])
@jwt_required()
def get_bonus_history():
    try:
        sheet = get_db_connection()
        if not sheet:
             return jsonify({"error": "Database connection failed"}), 500
        
        bonus_ws = sheet.worksheet("Weekly_Bonuses")
        records = bonus_ws.get_all_records()
        # If sheet is empty or only headers, this works.
        # But if headers are missing, might fail. Assuming headers exist:
        # Date Calculated, Doctor, Count, Bonus, Patients, Period
        
        return jsonify(records), 200
    except gspread.exceptions.WorksheetNotFound:
         return jsonify([]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', debug=False, port=port)
