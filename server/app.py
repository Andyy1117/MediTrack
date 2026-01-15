import os
import json
import uuid
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from models import db, User, Patient, Exam, Doctor, AuditLog
from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Security & Config
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secret-dev-key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///scanapp.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
jwt = JWTManager(app)
CORS(app)

# --- Role Decorator ---
def role_required(roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            claim_role = (claims.get("role") or "").lower()
            allowed_roles = {r.lower() for r in roles}
            if claim_role not in allowed_roles:
                return jsonify({"msg": "Forbidden: Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# --- Auth Routes ---

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()
    
    if user and user.check_password(password):
        access_token = create_access_token(identity=username, additional_claims={"role": user.role})
        return jsonify(access_token=access_token, role=user.role)

    # Hardcoded Admin Fallback for initial setup (insecure, but useful for first run)
    if username == "admin" and password == "admin123":
         access_token = create_access_token(identity="admin", additional_claims={"role": "Admin"})
         return jsonify(access_token=access_token, role="Admin")

    return jsonify({"msg": "Invalid credentials"}), 401

# --- Patient Management (Reception) ---

@app.route('/api/patients', methods=['POST'])
@role_required(['Reception', 'Admin'])
def add_patient():
    data = request.json
    try:
        patient = Patient(
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            national_id=data.get('national_id'),
            age=data.get('age'),
            gender=data.get('gender'),
            phone=data.get('phone'),
            email=data.get('email'),
            address=data.get('address'),
            emergency_contact=data.get('emergency_contact')
        )
        db.session.add(patient)
        db.session.commit()
        return jsonify({"message": "Patient added", "id": patient.id}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "National ID already exists"}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": str(e)}), 500

@app.route('/api/patients/by-national-id', methods=['GET'])
@role_required(['Reception', 'Admin'])
def get_patient_by_national_id():
    national_id = request.args.get('national_id')
    if not national_id:
        return jsonify({"msg": "Missing national_id"}), 400

    patient = Patient.query.filter_by(national_id=national_id).first()
    if not patient:
        return jsonify({"msg": "Patient not found"}), 404

    return jsonify({
        "id": patient.id,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "national_id": patient.national_id
    }), 200

# --- Exam Workflow ---

@app.route('/api/exams/register', methods=['POST'])
@role_required(['Reception', 'Admin'])
def register_exam():
    data = request.json
    try:
        def to_float(value):
            if value is None or value == "":
                return None
            try:
                return float(value)
            except (TypeError, ValueError):
                return None

        exam_id = str(uuid.uuid4())
        exam = Exam(
            id=exam_id,
            patient_id=data.get('patient_id'),
            exam_type=data.get('exam_type'),
            exam_date=datetime.strptime(data.get('exam_date'), '%Y-%m-%d').date() if data.get('exam_date') else None,
            time_slot=data.get('time_slot'),
            has_contrast=data.get('has_contrast', False),
            price=to_float(data.get('price')),
            discount=to_float(data.get('discount')) or 0,
            payment_status=data.get('payment_status'),
            payment_method=data.get('payment_method'),
            info_source=data.get('info_source')
        )
        db.session.add(exam)
        db.session.commit()
        return jsonify({"message": "Exam registered", "id": exam_id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": str(e)}), 500

@app.route('/api/exams/today', methods=['GET'])
@role_required(['Reception', 'Admin'])
def get_today_exams():
    today = datetime.now().date()
    exams = Exam.query.filter(Exam.exam_date == today).all()
    role = get_jwt().get('role')
    return jsonify([e.to_dict(role=role) for e in exams]), 200

@app.route('/api/exams/pending', methods=['GET'])
@role_required(['Technician', 'Admin'])
def get_pending_exams():
    exams = Exam.query.filter_by(status='Pending').all()
    role = get_jwt().get('role')
    return jsonify([e.to_dict(role=role) for e in exams]), 200

@app.route('/api/exams/complete', methods=['PATCH'])
@role_required(['Technician', 'Admin'])
def complete_exam():
    data = request.json
    exam_id = data.get("exam_id")
    
    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({"msg": "Exam not found"}), 404
        
    if exam.is_locked and get_jwt().get('role') != 'Admin':
        return jsonify({"msg": "Record is locked"}), 403

    def parse_datetime(value):
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None

    def to_int(value):
        if value is None or value == "":
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    scan_start = parse_datetime(data.get("scan_start"))
    scan_end = parse_datetime(data.get("scan_end"))
    if data.get("scan_start") and not scan_start:
        return jsonify({"msg": "Invalid scan_start format"}), 400
    if data.get("scan_end") and not scan_end:
        return jsonify({"msg": "Invalid scan_end format"}), 400

    try:
        exam.assigned_tech = data.get("assigned_tech")
        exam.mri_machine_id = data.get("mri_machine_id")
        exam.scan_start = scan_start
        exam.scan_end = scan_end
        exam.status = 'Completed'
        exam.referring_doctor_id = to_int(data.get("referring_doctor_id"))
        exam.radiologist_name = data.get("radiologist_name")
        exam.radiologist_license = data.get("radiologist_license")
        
        db.session.commit()
        return jsonify({"message": "Exam completed"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": str(e)}), 500

@app.route('/api/exams/reports', methods=['GET'])
@role_required(['Technician', 'Admin'])
def get_report_queue():
    exams = Exam.query.filter_by(status='Completed').order_by(Exam.scan_end.desc()).all()
    role = get_jwt().get('role')
    return jsonify([e.to_dict(role=role) for e in exams]), 200

@app.route('/api/exams/report', methods=['PATCH'])
@role_required(['Technician', 'Admin'])
def update_report():
    data = request.json
    exam_id = data.get("exam_id")
    if not exam_id:
        return jsonify({"msg": "Missing exam_id"}), 400

    exam = Exam.query.get(exam_id)
    if not exam:
        return jsonify({"msg": "Exam not found"}), 404

    if exam.is_locked and get_jwt().get('role') != 'Admin':
        return jsonify({"msg": "Record is locked"}), 403

    try:
        exam.report_status = data.get("report_status", exam.report_status)
        exam.internal_notes = data.get("internal_notes", exam.internal_notes)
        exam.file_url = data.get("file_url", exam.file_url)
        exam.radiologist_name = data.get("radiologist_name", exam.radiologist_name)
        exam.radiologist_license = data.get("radiologist_license", exam.radiologist_license)
        db.session.commit()
        return jsonify({"message": "Report updated"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- Doctor Management ---

@app.route('/api/doctors', methods=['GET'])
@jwt_required()
def get_doctors():
    doctors = Doctor.query.all()
    return jsonify([{
        "id": d.id,
        "name": d.name,
        "hospital": d.hospital,
        "phone": d.phone,
        "license_no": d.license_no,
        "role": d.role
    } for d in doctors]), 200

@app.route('/api/doctors', methods=['POST'])
@role_required(['Admin'])
def add_doctor():
    data = request.json
    try:
        doctor = Doctor(
            name=data.get("name"),
            hospital=data.get("hospital"),
            phone=data.get("phone"),
            license_no=data.get("license_no"),
            role=data.get("role")
        )
        db.session.add(doctor)
        db.session.commit()
        return jsonify({"message": "Doctor added", "id": doctor.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- User Management (Admin Only) ---

@app.route('/api/admin/users', methods=['GET'])
@role_required(['Admin'])
def get_users():
    users = User.query.all()
    return jsonify([{
        "username": u.username,
        "role": u.role
    } for u in users]), 200

@app.route('/api/admin/users', methods=['POST'])
@role_required(['Admin'])
def create_user():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")

    if not all([username, password, role]):
        return jsonify({"msg": "Missing fields"}), 400

    existing = User.query.filter_by(username=username).first()
    if existing:
        return jsonify({"msg": "User already exists"}), 400

    try:
        user = User(username=username, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": "User created"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/users', methods=['DELETE'])
@role_required(['Admin'])
def delete_user():
    username = request.json.get("username")
    if username == "admin":
        return jsonify({"msg": "Cannot delete root admin"}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- Admin Reports & Business Logic ---

@app.route('/api/admin/audit-logs', methods=['GET'])
@role_required(['Admin'])
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(200).all()
    return jsonify([{
        "user_id": l.user_id,
        "action": l.action,
        "table": l.target_table,
        "target_id": l.target_id,
        "old": l.old_value,
        "new": l.new_value,
        "timestamp": l.timestamp.isoformat()
    } for l in logs]), 200

@app.route('/api/admin/bonus-report', methods=['GET'])
@role_required(['Admin'])
def bonus_report():
    try:
        # Cycle: Monday to Sunday
        now = datetime.now()
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59)
        
        exams = Exam.query.filter(
            and_(
                Exam.status == 'Completed',
                or_(
                    and_(Exam.scan_end >= start_of_week, Exam.scan_end <= end_of_week),
                    and_(
                        Exam.scan_end == None,
                        Exam.exam_date >= start_of_week.date(),
                        Exam.exam_date <= end_of_week.date()
                    )
                )
            )
        ).all()
        
        report_data = {}
        for ex in exams:
            doc_id = ex.referring_doctor_id
            if not doc_id: continue
            
            if doc_id not in report_data:
                doc = Doctor.query.get(doc_id)
                report_data[doc_id] = {
                    "doctor_name": doc.name if doc else "Unknown",
                    "hospital": doc.hospital if doc else "Unknown",
                    "exam_count": 0,
                    "total_bonus": 0
                }
            report_data[doc_id]["exam_count"] += 1
            report_data[doc_id]["total_bonus"] += 50000

        return jsonify({
            "period": f"{start_of_week.strftime('%Y-%m-%d')} to {end_of_week.strftime('%Y-%m-%d')}",
            "data": [{"doctor_id": k, **v} for k, v in report_data.items()]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/revenue-week', methods=['GET'])
@role_required(['Admin'])
def revenue_week():
    """
    Weekly revenue from completed exams (Mon-Sun).
    Revenue = max(price - discount, 0) when payment_status is Paid/Partial.
    """
    try:
        now = datetime.now()
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = start_of_week + timedelta(days=6, hours=23, minutes=59, seconds=59)

        exams = Exam.query.filter(
            and_(
                Exam.status == 'Completed',
                Exam.scan_end >= start_of_week,
                Exam.scan_end <= end_of_week
            )
        ).all()

        daily_totals = {}
        total_revenue = 0.0
        paid_count = 0
        partial_count = 0
        unpaid_count = 0

        for ex in exams:
            payment_status = (ex.payment_status or '').lower()
            if payment_status == 'paid':
                paid_count += 1
            elif payment_status == 'partial':
                partial_count += 1
            else:
                unpaid_count += 1

            if payment_status in ['paid', 'partial']:
                price = ex.price or 0
                discount = ex.discount or 0
                amount = max(price - discount, 0)
            else:
                amount = 0

            total_revenue += amount
            exam_date = ex.scan_end.date() if ex.scan_end else ex.exam_date
            day_key = exam_date.isoformat() if exam_date else start_of_week.date().isoformat()
            daily_totals[day_key] = daily_totals.get(day_key, 0) + amount

        # Build Mon-Sun series
        series = []
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            key = day.date().isoformat()
            series.append({
                "date": key,
                "label": day.strftime("%a"),
                "total": round(daily_totals.get(key, 0), 2)
            })

        return jsonify({
            "period": f"{start_of_week.strftime('%Y-%m-%d')} to {end_of_week.strftime('%Y-%m-%d')}",
            "total_revenue": round(total_revenue, 2),
            "paid_count": paid_count,
            "partial_count": partial_count,
            "unpaid_count": unpaid_count,
            "series": series
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/lock-previous-week', methods=['POST'])
@role_required(['Admin'])
def lock_records():
    """
    Manually trigger or call via cron: 
    On Thursday (Day 4) at 23:59, lock records from previous Mon-Sun cycle.
    """
    try:
        now = datetime.now()
        # Find last Monday of the previous week
        last_monday = now - timedelta(days=now.weekday() + 7)
        last_monday = last_monday.replace(hour=0, minute=0, second=0, microsecond=0)
        last_sunday = last_monday + timedelta(days=6, hours=23, minutes=59, seconds=59)
        
        updated_count = Exam.query.filter(
            and_(
                Exam.scan_end >= last_monday,
                Exam.scan_end <= last_sunday,
                Exam.is_locked == False
            )
        ).update({"is_locked": True}, synchronize_session=False)
        
        db.session.commit()
        return jsonify({"message": f"Locked {updated_count} records from previous week."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

_tables_initialized = False

@app.before_request
def create_tables_once():
    global _tables_initialized
    if _tables_initialized:
        return
    db.create_all()
    _tables_initialized = True

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', debug=False, port=port)
