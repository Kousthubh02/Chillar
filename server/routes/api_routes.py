
from flask import Blueprint, request, jsonify, current_app
from models import Person, Event, Transaction, db
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_bp = Blueprint('api', __name__)

# Debug endpoint to list all transaction IDs and details
@api_bp.route('/transactions/debug/all', methods=['GET'])
def debug_list_transactions():
    transactions = Transaction.query.all()
    result = []
    for t in transactions:
        result.append({
            'transaction_id': t.transaction_id,
            'person_id': t.person_id,
            'event_id': t.event_id,
            'amount': t.amount,
            'paid_amount': t.paid_amount,
            'reason': t.reason,
            'due_date': t.due_date.strftime('%d-%m-%Y'),
            'status': t.status,
            'created_date': t.created_date.strftime('%d-%m-%Y') if t.created_date else '',
        })
    return jsonify(result)

# Update transaction status
@api_bp.route('/transactions/<int:transaction_id>', methods=['PATCH'])
def update_transaction_status(transaction_id):
    import logging
    data = request.json
    status = data.get('status')
    logging.warning(f"PATCH /transactions/{transaction_id} called with status={status}")
    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        logging.error(f"Transaction {transaction_id} not found for PATCH")
        return jsonify({'msg': 'Transaction not found'}), 404
    transaction.status = bool(status)
    db.session.commit()
    logging.info(f"Transaction {transaction_id} status updated to {transaction.status}")
    return jsonify({'msg': 'Transaction status updated', 'transaction_id': transaction_id, 'status': transaction.status})

# People CRUD
@api_bp.route('/people', methods=['GET'])
def get_people():
    people = Person.query.all()
    return jsonify([{'person_id': p.person_id, 'person_name': p.person_name} for p in people])

@api_bp.route('/people', methods=['POST'])
def add_person():
    data = request.json
    name = data.get('person_name')
    if not name:
        return jsonify({'msg': 'Name required'}), 400
    person = Person(person_name=name)
    db.session.add(person)
    db.session.commit()
    return jsonify({'person_id': person.person_id, 'person_name': person.person_name}), 201

# Events CRUD
@api_bp.route('/events', methods=['GET'])
def get_events():
    events = Event.query.all()
    return jsonify([{'event_id': e.event_id, 'event_name': e.event_name} for e in events])

@api_bp.route('/events', methods=['POST'])
def add_event():
    data = request.json
    name = data.get('event_name')
    if not name:
        return jsonify({'msg': 'Name required'}), 400
    event = Event(event_name=name)
    db.session.add(event)
    db.session.commit()
    return jsonify({'event_id': event.event_id, 'event_name': event.event_name}), 201

# Transactions CRUD & History
@api_bp.route('/transactions', methods=['GET'])
def get_transactions():
    transactions = Transaction.query.all()
    result = []
    for t in transactions:
        result.append({
            'transaction_id': t.transaction_id,
            'person_id': t.person_id,
            'person_name': t.person.person_name,
            'event_id': t.event_id,
            'event_name': getattr(t.event, 'event_name', 'N/A'),
            'amount': t.amount,
            'paid_amount': getattr(t, 'paid_amount', 0.0),
            'reason': t.reason,
            'due_date': t.due_date.strftime('%d-%m-%Y'),
            'status': t.status,
            'created_date': t.created_date.strftime('%d-%m-%Y') if hasattr(t, 'created_date') and t.created_date else '',
        })
    return jsonify(result)

@api_bp.route('/transactions', methods=['POST'])
def add_transaction():
    try:
        data = request.json
        if not data:
            return jsonify({'msg': 'No data provided'}), 400
            
        logger.info(f"Received transaction data: {data}")
        
        # Extract and validate fields
        person_id = data.get('person_id')
        event_id = data.get('event_id')
        amount = data.get('amount')
        reason = data.get('reason')
        due_date = data.get('due_date')
        status = data.get('status', False)
        paid_amount = data.get('paid_amount', 0.0)
        
        logger.info(f"Parsed fields: person_id={person_id}, event_id={event_id}, amount={amount}, due_date={due_date}")
        
        # Validate required fields
        required_fields = {
            'person_id': person_id,
            'amount': amount,
            'reason': reason,
            'due_date': due_date
        }
        
        missing_fields = [field for field, value in required_fields.items() if not value and value != 0]
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            logger.error(error_msg)
            return jsonify({'msg': error_msg}), 400

        try:
            person_id = int(person_id)
        except (TypeError, ValueError):
            error_msg = f"Invalid person_id: {person_id}"
            logger.error(error_msg)
            return jsonify({'msg': error_msg}), 400
        
        # Validate person exists
        person = Person.query.get(person_id)
        if not person:
            error_msg = f"No person found with person_id: {person_id}"
            logger.error(error_msg)
            return jsonify({'msg': error_msg}), 404

        # Validate event if provided
        if event_id is not None:
            try:
                event_id = int(event_id)
                event = Event.query.get(event_id)
                if not event:
                    error_msg = f"No event found with event_id: {event_id}"
                    logger.error(error_msg)
                    return jsonify({'msg': error_msg}), 404
            except (TypeError, ValueError):
                error_msg = f"Invalid event_id: {event_id}"
                logger.error(error_msg)
                return jsonify({'msg': error_msg}), 400

        # Validate amount
        try:
            amount = float(amount)
            if amount <= 0:
                error_msg = "Amount must be greater than 0"
                logger.error(error_msg)
                return jsonify({'msg': error_msg}), 400
        except (TypeError, ValueError):
            error_msg = f"Invalid amount: {amount}"
            logger.error(error_msg)
            return jsonify({'msg': error_msg}), 400

        # Validate due_date
        try:
            due_date = datetime.strptime(due_date, '%d-%m-%Y')
        except (ValueError, TypeError):
            error_msg = f"Invalid due_date format. Use DD-MM-YYYY"
            logger.error(error_msg)
            return jsonify({'msg': error_msg}), 400

        # Create transaction
        transaction = Transaction(
            person_id=person_id,
            event_id=event_id,
            amount=amount,
            reason=reason.strip(),
            due_date=due_date,
            status=bool(status),
            paid_amount=float(paid_amount),
            created_date=datetime.utcnow()
        )

        db.session.add(transaction)
        db.session.commit()
        
        logger.info(f"Transaction created successfully: {transaction.transaction_id}")
        return jsonify({
            'transaction_id': transaction.transaction_id,
            'msg': 'Transaction created successfully'
        }), 201

    except Exception as e:
        error_msg = f"Error creating transaction: {str(e)}"
        logger.error(error_msg)
        db.session.rollback()
        return jsonify({'msg': error_msg}), 500

# Partial Payment
@api_bp.route('/transactions/<int:transaction_id>/pay', methods=['POST'])
def partial_payment(transaction_id):
    import logging
    data = request.json
    amount = data.get('amount')
    logging.warning(f"POST /transactions/{transaction_id}/pay called with amount={amount}")
    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        logging.error(f"Transaction {transaction_id} not found for partial payment")
        return jsonify({'msg': 'Transaction not found'}), 404
    transaction.paid_amount = getattr(transaction, 'paid_amount', 0.0) + amount
    if transaction.paid_amount >= transaction.amount:
        transaction.status = True
    db.session.commit()
    logging.info(f"Transaction {transaction_id} paid_amount updated to {transaction.paid_amount}, status={transaction.status}")
    return jsonify({'msg': 'Payment updated', 'paid_amount': transaction.paid_amount, 'status': transaction.status})
