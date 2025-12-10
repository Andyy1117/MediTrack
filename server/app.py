import os
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
import gspread
from oauth2client.service_account import ServiceAccountCredentials

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Google Sheets Configuration
SCOPE = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive"
]

def get_db_connection():
    """
    Establishes a connection to the Google Sheet.
    Uses GOOGLE_CREDENTIALS env var if available (production),
    otherwise falls back to credentials.json (local).
    """
    try:
        if os.environ.get("GOOGLE_CREDENTIALS"):
            creds_dict = json.loads(os.environ["GOOGLE_CREDENTIALS"])
            creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, SCOPE)
        else:
            creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", SCOPE)
            
        client = gspread.authorize(creds)
        # Open the spreadsheet
        sheet = client.open("Medical_Referrals")
        return sheet
    except Exception as e:
        print(f"Error connecting to Google Sheets: {e}")
        return None

@app.route('/api/add-patient', methods=['POST'])
def add_patient():
    data = request.json
    
    # Extract data with defaults
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    patient_id = data.get('id', '')
    name = data.get('name', '')
    age = data.get('age', '')
    gender = data.get('gender', '')
    patient_phone = data.get('patient_phone', '')
    clinical_info = data.get('clinical_info', '')
    scan_type = data.get('scan_type', '')
    contrast = data.get('contrast', 'No')
    technician = data.get('technician', '')
    cd_status = data.get('cd_status', 'No')
    result_status = data.get('result_status', 'No')
    source = data.get('source', 'Self')
    
    # Conditional logic for doctor details
    if source in ["Facebook", "Self", "Өөрөө"]:
        doctor = "N/A"
        department = "N/A"
        doctor_phone = "N/A"
        hospital = "N/A"
    else:
        doctor = data.get('doctor', '')
        department = data.get('department', '')
        doctor_phone = data.get('phone', '') # This comes from frontend as 'phone' but is doctor's phone
        hospital = data.get('hospital', '')
        
    status = "Pending" # Default status
    notes = data.get('notes', '')

    # New Column Structure:
    # Date, ID, Name, Age, Gender, Patient_Phone, Clinical_Info, Scan_Type, 
    # Contrast, Technician, CD_Taken, Result_Out, Source, Hospital, Department, Doctor, Doctor_Phone, Status, Notes

    row = [
        date_str, patient_id, name, age, gender, patient_phone, clinical_info,
        scan_type, contrast, technician, cd_status, result_status,
        source, hospital, department, doctor, doctor_phone, status, notes
    ]

    try:
        sheet = get_db_connection()
        if not sheet:
            return jsonify({"error": "Database connection failed"}), 500
            
        worksheet = sheet.worksheet("Records")
        worksheet.append_row(row)
        return jsonify({"message": "Patient added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-records', methods=['GET'])
def get_records():
    try:
        sheet = get_db_connection()
        if not sheet:
            return jsonify({"error": "Database connection failed"}), 500
            
        worksheet = sheet.worksheet("Records")
        records = worksheet.get_all_records() # Assumes first row is header
        return jsonify(records), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/calculate-bonus', methods=['GET'])
def calculate_bonus():
    try:
        sheet = get_db_connection()
        if not sheet:
            return jsonify({"error": "Database connection failed"}), 500
            
        records_ws = sheet.worksheet("Records")
        bonus_ws = sheet.worksheet("Weekly_Bonuses")
        
        all_records = records_ws.get_all_records()
        
        # Filter for last 7 days and valid sources
        valid_records = []
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        doctor_stats = {}
        
        for record in all_records:
            # Parse date - assuming format YYYY-MM-DD HH:MM:SS from add_patient
            # If manually entered, format might vary, so we wrap in try-except or handle strictly
            try:
                record_date = datetime.strptime(record['Date'], "%Y-%m-%d %H:%M:%S")
            except ValueError:
                # Fallback if date format doesn't match or is missing, skip or log
                continue

            if record_date >= seven_days_ago:
                source = record.get('Source', '')
                if source not in ["Facebook", "Self", "Unknown", "Өөрөө"]:
                    doctor = record.get('Doctor')
                    if doctor and doctor != "N/A":
                        if doctor not in doctor_stats:
                            doctor_stats[doctor] = 0
                        doctor_stats[doctor] += 1

        # Calculate bonuses
        results = []
        current_date_str = datetime.now().strftime("%Y-%m-%d")
        
        for doctor, count in doctor_stats.items():
            bonus_amount = count * 50000
            results.append({
                "Doctor": doctor,
                "Count": count,
                "Bonus": bonus_amount
            })
            
            # Append to Weekly_Bonuses sheet
            bonus_ws.append_row([current_date_str, doctor, count, bonus_amount])
            
        return jsonify(results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

