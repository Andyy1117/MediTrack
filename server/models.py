from datetime import datetime, date
import json
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event, inspect
from flask_jwt_extended import get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100))
    target_table = db.Column(db.String(100))
    target_id = db.Column(db.String(100))
    action = db.Column(db.String(20)) # INSERT, UPDATE, DELETE
    old_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False) # Reception, Technician, Admin

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Patient(db.Model):
    __tablename__ = 'patients'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    national_id = db.Column(db.String(50), unique=True, nullable=False)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    phone = db.Column(db.String(50))
    email = db.Column(db.String(100))
    address = db.Column(db.Text)
    emergency_contact = db.Column(db.String(200))
    exams = db.relationship('Exam', backref='patient', lazy=True)

class Doctor(db.Model):
    __tablename__ = 'doctors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    hospital = db.Column(db.String(200))
    phone = db.Column(db.String(50))
    license_no = db.Column(db.String(50), unique=True)
    role = db.Column(db.String(50))  # Referring, Reporting
    exams = db.relationship('Exam', backref='referring_doctor', lazy=True)

class Exam(db.Model):
    __tablename__ = 'exams'
    id = db.Column(db.String(100), primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    
    # Reception Input
    exam_type = db.Column(db.String(100), nullable=False)
    exam_date = db.Column(db.Date)
    time_slot = db.Column(db.String(50))
    has_contrast = db.Column(db.Boolean, default=False)
    price = db.Column(db.Float)
    discount = db.Column(db.Float, default=0)
    payment_status = db.Column(db.String(50)) # Paid, Partial, Unpaid
    payment_method = db.Column(db.String(50)) # Cash, Card, Transfer
    info_source = db.Column(db.String(100)) # Referred, Facebook, Walk-in, etc.
    
    # Technician Input
    assigned_tech = db.Column(db.String(100))
    mri_machine_id = db.Column(db.String(100))
    scan_start = db.Column(db.DateTime)
    scan_end = db.Column(db.DateTime)
    status = db.Column(db.String(50), default='Pending') # Pending, Completed, Cancelled, Rescheduled
    
    # Radiologist Assignment
    radiologist_name = db.Column(db.String(100))
    radiologist_license = db.Column(db.String(100))
    report_status = db.Column(db.String(50), default='Draft') # Draft, Final
    internal_notes = db.Column(db.Text)
    file_url = db.Column(db.String(255)) # PDF/Link
    
    # Referral (Admin Only)
    referring_doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'))
    incentive_status = db.Column(db.String(50), default='Pending') # Pending, Approved, Paid
    incentive_amount = db.Column(db.Float, default=50000.0)
    
    is_locked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, role=None):
        data = {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": f"{self.patient.first_name} {self.patient.last_name}",
            "national_id": self.patient.national_id,
            "exam_type": self.exam_type,
            "exam_date": self.exam_date.isoformat() if self.exam_date else None,
            "time_slot": self.time_slot,
            "has_contrast": self.has_contrast,
            "payment_status": self.payment_status,
            "payment_method": self.payment_method,
            "info_source": self.info_source,
            "assigned_tech": self.assigned_tech,
            "mri_machine_id": self.mri_machine_id,
            "scan_start": self.scan_start.isoformat() if self.scan_start else None,
            "scan_end": self.scan_end.isoformat() if self.scan_end else None,
            "status": self.status,
            "radiologist_name": self.radiologist_name,
            "radiologist_license": self.radiologist_license,
            "report_status": self.report_status,
            "internal_notes": self.internal_notes,
            "file_url": self.file_url,
            "is_locked": self.is_locked,
            "created_at": self.created_at.isoformat()
        }
        
        # Financial Masking Logic
        if role == 'Admin':
            data.update({
                "price": self.price,
                "discount": self.discount,
                "incentive_amount": self.incentive_amount,
                "incentive_status": self.incentive_status,
                "referring_doctor": self.referring_doctor.name if self.referring_doctor else None
            })
            
        return data

# --- Audit Trail Listener ---

def get_current_user():
    try:
        # This will only work if we are inside a request context with a JWT
        return get_jwt_identity()
    except:
        return "System/Worker"

@event.listens_for(db.Session, 'after_flush')
def receive_after_flush(session, flush_context):
    user_id = get_current_user()
    
    for obj in session.new:
        if isinstance(obj, AuditLog): continue
        log = AuditLog(
            user_id=user_id,
            target_table=obj.__tablename__,
            target_id=str(getattr(obj, 'id', 'N/A')),
            action='INSERT',
            new_value=json.dumps(object_to_dict(obj)),
            timestamp=datetime.utcnow()
        )
        session.add(log)

    for obj in session.dirty:
        if isinstance(obj, AuditLog): continue
        state = inspect(obj)
        changes = {}
        old_values = {}
        for attr in state.attrs:
            hist = attr.history
            if hist.has_changes():
                changes[attr.key] = serialize_value(hist.added[0] if hist.added else None)
                old_values[attr.key] = serialize_value(hist.deleted[0] if hist.deleted else None)
        
        if changes:
            log = AuditLog(
                user_id=user_id,
                target_table=obj.__tablename__,
                target_id=str(getattr(obj, 'id', 'N/A')),
                action='UPDATE',
                old_value=json.dumps(old_values),
                new_value=json.dumps(changes),
                timestamp=datetime.utcnow()
            )
            session.add(log)

    for obj in session.deleted:
        if isinstance(obj, AuditLog): continue
        log = AuditLog(
            user_id=user_id,
            target_table=obj.__tablename__,
            target_id=str(getattr(obj, 'id', 'N/A')),
            action='DELETE',
            old_value=json.dumps(object_to_dict(obj)),
            timestamp=datetime.utcnow()
        )
        session.add(log)

def serialize_value(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return value

def object_to_dict(obj):
    return {c.key: serialize_value(getattr(obj, c.key)) for c in inspect(obj).mapper.column_attrs}

