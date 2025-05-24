from extensions import db, bcrypt
from datetime import datetime, timedelta



class User(db.Model):
    id=db.Column(db.Integer,primary_key=True)
    username=db.Column(db.String(50),unique=True,nullable=True)
    email=db.Column(db.String(120),unique=True,nullable=False)
    mPin_hash=db.Column(db.String(60),nullable=False)
    otp = db.Column(db.String(6), nullable=True)
    otp_expiry = db.Column(db.DateTime, nullable=True)
    otp_verified = db.Column(db.Boolean, default=False)  
    
    
    def set_otp(self, otp):
        self.otp = otp
        self.otp_expiry = datetime.utcnow() + timedelta(minutes=5)

    def verify_otp(self, otp):
        return self.otp == otp and self.otp_expiry and datetime.utcnow() < self.otp_expiry
    def set_mPin(self,mPin):
        self.mPin_hash=bcrypt.generate_password_hash(mPin).decode('utf-8')
        
    def check_mPin(self,mPin):
        return bcrypt.check_password_hash(self.mPin_hash,mPin)
    
    
    
class Person(db.Model):
    person_id=db.Column(db.Integer,primary_key=True,autoincrement=True)
    person_name=db.Column(db.String(50),nullable=False,unique=True)
    
    def __repr__(self):
        return f"<Person {self.person_name}>"



class Event(db.Model):
    event_id=db.Column(db.Integer,primary_key=True,autoincrement=True)
    event_name=db.Column(db.String(50),nullable=False,unique=True)
    
    def __repr__(self):
        return f"<Event {self.event_name}>"
    
    

class Transaction(db.Model):
    transaction_id=db.Column(db.Integer,primary_key=True,autoincrement=True)
    person_id=db.Column(db.Integer,db.ForeignKey('person.person_id'),nullable=False)
    event_id=db.Column(db.Integer,db.ForeignKey('event.event_id'),nullable=True)
    amount=db.Column(db.Float,nullable=False)
    reason=db.Column(db.String(500),nullable=False)
    due_date=db.Column(db.DateTime,nullable=False)
    status=db.Column(db.Boolean,nullable=False,default=False)
    
    
    person = db.relationship('Person', backref=db.backref('transactions', lazy=True))
     
     
    def __repr__(self):
        return f"<Transaction {self.transaction_id} - {self.amount} - {'Paid' if self.status else 'Pending'}>"
