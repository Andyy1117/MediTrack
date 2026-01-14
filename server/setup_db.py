import os
import json
import gspread
from oauth2client.service_account import ServiceAccountCredentials

SCOPE = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive"
]

def setup_database():
    print("Connecting to Google Sheets...")
    try:
        if os.environ.get("GOOGLE_CREDENTIALS"):
            creds_dict = json.loads(os.environ["GOOGLE_CREDENTIALS"])
            creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, SCOPE)
        else:
            creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", SCOPE)
        
        client = gspread.authorize(creds)
        spreadsheet = client.open("Medical_Referrals")
        
        # Define Schemas
        schemas = {
            "Exams": [
                "ID", "Status", "Patient_Name", "National_ID", "Phone", 
                "Date_Registered", "Date_of_Scan", "Exam_Type", 
                "Referring_Doctor_ID", "Reporting_Radiologist_ID", "Created_By"
            ],
            "Doctors_Master": [
                "Doctor_ID", "Name", "Hospital", "Department", "Phone", "Role"
            ],
            "Weekly_Bonuses": [
                "Week_Start", "Week_End", "Doctor_ID", "Doctor_Name", 
                "Exam_Count", "Total_Bonus", "Calculated_At"
            ],
            "Users": ["Username", "Password", "Role"]
        }
        
        for sheet_name, headers in schemas.items():
            try:
                ws = spreadsheet.worksheet(sheet_name)
                print(f"Sheet '{sheet_name}' exists. Checking headers...")
                existing_headers = ws.row_values(1)
                if not existing_headers:
                    print(f"Sheet '{sheet_name}' is empty. Adding headers.")
                    ws.append_row(headers)
                elif existing_headers != headers:
                    print(f"WARNING: Sheet '{sheet_name}' headers do not match expected schema.")
                    print(f"Expected: {headers}")
                    print(f"Found: {existing_headers}")
                    # Optional: Force update headers? For now, just warn.
            except gspread.exceptions.WorksheetNotFound:
                print(f"Sheet '{sheet_name}' not found. Creating...")
                ws = spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=len(headers))
                ws.append_row(headers)
                
        print("Database setup complete!")
        
    except Exception as e:
        print(f"Error setting up database: {e}")

if __name__ == "__main__":
    setup_database()


