import os
import json
import uuid
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
import gspread
from oauth2client.service_account import ServiceAccountCredentials

app = Flask(__name__)

# Security & Config
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secret-dev-key")
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

# Global GSpread Client
GSPREAD_CLIENT = None

def get_db_connection():
    global GSPREAD_CLIENT
    if GSPREAD_CLIENT:
        try:
            GSPREAD_CLIENT.open("Medical_Referrals")
            return GSPREAD_CLIENT
        except Exception:
            GSPREAD_CLIENT = None

    try:
        if os.environ.get("GOOGLE_CREDENTIALS"):
            creds_dict = json.loads(os.environ["GOOGLE_CREDENTIALS"])
            creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, SCOPE)
        else:
            creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", SCOPE)
        
        client = gspread.authorize(creds)
        return client.open("Medical_Referrals")
    except Exception as e:
        print(f"Error connecting to Google Sheets: {e}")
        return None

def get_worksheet(sheet_name):
    conn = get_db_connection()
    if not conn:
        raise Exception("Database connection failed")
    try:
        return conn.worksheet(sheet_name)
    except gspread.exceptions.WorksheetNotFound:
        # Auto-create logic could go here, but setup_db.py handles it.
        raise Exception(f"Worksheet {sheet_name} not found")

# --- Helper: Dynamic Column Index ---
def get_col_map(worksheet):
    headers = worksheet.row_values(1)
    return {name: idx + 1 for idx, name in enumerate(headers)}

# --- Auth Routes ---

@app.route('/api/auth/login', methods=['POST'])
def login():
    username = request.json.get("username")
    password = request.json.get("password")

    # Hardcoded Admin Fallback
    if username == "admin" and password == "admin123":
         access_token = create_access_token(identity="admin", additional_claims={"role": "admin"})
         return jsonify(access_token=access_token, role="admin")

    try:
        ws = get_worksheet("Users")
        users = ws.get_all_records()
        
        user = next((u for u in users if str(u.get("Username")) == username and str(u.get("Password")) == password), None)
        
        if not user:
            return jsonify({"msg": "Invalid credentials"}), 401

        access_token = create_access_token(identity=username, additional_claims={"role": user["Role"]})
        return jsonify(access_token=access_token, role=user["Role"])

    except Exception as e:
        return jsonify({"msg": str(e)}), 500

# --- Doctor Management (Admin/Technician) ---

@app.route('/api/doctors', methods=['GET'])
@jwt_required()
def get_doctors():
    try:
        ws = get_worksheet("Doctors_Master")
        doctors = ws.get_all_records()
        return jsonify(doctors), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/doctors', methods=['POST'])
@jwt_required()
def add_doctor():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"msg": "Admin only"}), 403
        
    data = request.json
    try:
        ws = get_worksheet("Doctors_Master")
        # Generate simple ID if not provided
        doc_id = str(uuid.uuid4())[:8]
        
        row = [
            doc_id,
            data.get("name"),
            data.get("hospital"),
            data.get("department"),
            data.get("phone"),
            data.get("role") # Referring or Reporting
        ]
        ws.append_row(row)
        return jsonify({"message": "Doctor added", "id": doc_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- User Management (Admin Only) ---

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_users():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"msg": "Admin only"}), 403

    try:
        ws = get_worksheet("Users")
        users = ws.get_all_records()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/users', methods=['POST'])
@jwt_required()
def create_user():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"msg": "Admin only"}), 403
        
    data = request.json
    try:
        ws = get_worksheet("Users")
        users = ws.get_all_records()
        
        # Check if exists
        if any(u['Username'] == data['username'] for u in users):
            return jsonify({"msg": "User already exists"}), 400
            
        row = [
            data.get("username"),
            data.get("password"),
            data.get("role")
        ]
        ws.append_row(row)
        return jsonify({"message": "User created"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/users', methods=['DELETE'])
@jwt_required()
def delete_user():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"msg": "Admin only"}), 403
        
    username = request.json.get("username")
    if username == "admin":
        return jsonify({"msg": "Cannot delete root admin"}), 400

    try:
        ws = get_worksheet("Users")
        cell = ws.find(username)
        if not cell:
            return jsonify({"msg": "User not found"}), 404
            
        ws.delete_rows(cell.row)
        return jsonify({"message": "User deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Exam Workflow ---

@app.route('/api/exams/register', methods=['POST'])
@jwt_required()
def register_exam():
    claims = get_jwt()
    if claims["role"] not in ["receptionist", "admin"]: # "Registrar" in requirements, mapping to receptionist role
        return jsonify({"msg": "Unauthorized"}), 403

    data = request.json
    current_user = get_jwt_identity()
    
    exam_id = str(uuid.uuid4())
    date_registered = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Schema: ID, Status, Patient_Name, National_ID, Phone, Date_Registered, Date_of_Scan, Exam_Type, Referring_Doctor_ID, Reporting_Radiologist_ID, Created_By
    row = [
        exam_id,
        "Pending",
        data.get("patient_name"),
        data.get("national_id"),
        data.get("phone"),
        date_registered,
        "", # Date_of_Scan (empty initially)
        data.get("exam_type"),
        "", # Referring_Doctor_ID
        "", # Reporting_Radiologist_ID
        current_user
    ]

    try:
        ws = get_worksheet("Exams")
        ws.append_row(row)
        return jsonify({"message": "Exam registered", "id": exam_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/exams/pending', methods=['GET'])
@jwt_required()
def get_pending_exams():
    claims = get_jwt()
    if claims["role"] not in ["technician", "admin"]:
        return jsonify({"msg": "Unauthorized"}), 403

    try:
        ws = get_worksheet("Exams")
        records = ws.get_all_records()
        pending = [r for r in records if r.get("Status") == "Pending"]
        return jsonify(pending), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/exams/complete', methods=['PATCH'])
@jwt_required()
def complete_exam():
    claims = get_jwt()
    if claims["role"] not in ["technician", "admin"]:
        return jsonify({"msg": "Unauthorized"}), 403

    data = request.json
    exam_id = data.get("exam_id")
    ref_doc_id = data.get("referring_doctor_id")
    rep_rad_id = data.get("reporting_radiologist_id")
    
    if not all([exam_id, ref_doc_id, rep_rad_id]):
        return jsonify({"msg": "Missing fields"}), 400

    try:
        ws = get_worksheet("Exams")
        col_map = get_col_map(ws)
        
        cell = ws.find(exam_id)
        if not cell:
            return jsonify({"msg": "Exam not found"}), 404
        
        row = cell.row
        date_now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        updates = [
            {'range': gspread.utils.rowcol_to_a1(row, col_map["Status"]), 'values': [["Completed"]]},
            {'range': gspread.utils.rowcol_to_a1(row, col_map["Referring_Doctor_ID"]), 'values': [[ref_doc_id]]},
            {'range': gspread.utils.rowcol_to_a1(row, col_map["Reporting_Radiologist_ID"]), 'values': [[rep_rad_id]]},
            {'range': gspread.utils.rowcol_to_a1(row, col_map["Date_of_Scan"]), 'values': [[date_now]]}
        ]
        
        ws.batch_update(updates)
        return jsonify({"message": "Exam completed"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Admin Reports ---

@app.route('/api/admin/bonus-report', methods=['GET'])
@jwt_required()
def bonus_report():
    claims = get_jwt()
    if claims["role"] != "admin":
        return jsonify({"msg": "Admin only"}), 403

    try:
        exams_ws = get_worksheet("Exams")
        doctors_ws = get_worksheet("Doctors_Master")
        
        exams = exams_ws.get_all_records()
        doctors = doctors_ws.get_all_records()
        
        # Create Doctor Lookup Map
        doc_map = {d["Doctor_ID"]: d for d in doctors}
        
        # Filter for "Completed"
        # Filter for Current Week (Mon-Sun)
        now = datetime.now()
        start_of_week = now - timedelta(days=now.weekday()) # Monday 00:00
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59)
        
        report_data = {}
        
        for ex in exams:
            if ex.get("Status") != "Completed":
                continue
                
            scan_date_str = ex.get("Date_of_Scan")
            if not scan_date_str: continue
            
            try:
                scan_date = datetime.strptime(scan_date_str, "%Y-%m-%d %H:%M:%S")
            except:
                continue
                
            if start_of_week <= scan_date <= end_of_week:
                doc_id = str(ex.get("Referring_Doctor_ID"))
                if doc_id in doc_map:
                    if doc_id not in report_data:
                        report_data[doc_id] = {
                            "doctor_name": doc_map[doc_id]["Name"],
                            "hospital": doc_map[doc_id]["Hospital"],
                            "exam_count": 0,
                            "total_bonus": 0
                        }
                    report_data[doc_id]["exam_count"] += 1
                    report_data[doc_id]["total_bonus"] += 50000

        results = [
            {"doctor_id": k, **v} for k, v in report_data.items()
        ]
        
        return jsonify({
            "period": f"{start_of_week.strftime('%Y-%m-%d')} to {end_of_week.strftime('%Y-%m-%d')}",
            "data": results
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', debug=False, port=port)
