import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import pandas as pd
import requests
from datetime import datetime, timedelta
from config import config
import time
import json
from nltk.corpus import wordnet
import nltk
from sqlalchemy import func, desc
import logging
from logging.handlers import RotatingFileHandler
import sys
from functools import wraps
from sqlalchemy import text 

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('app.log', maxBytes=10240000, backupCount=10),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def log_db_commit(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            result = func(*args, **kwargs)
            db.session.commit()
            logger.info(f"Database commit successful in {func.__name__}")
            return result
        except Exception as e:
            logger.error(f"Database commit failed in {func.__name__}: {str(e)}", exc_info=True)
            db.session.rollback()
            raise
    return wrapper

nltk.download('wordnet', quiet=True)

app = Flask(__name__)

# Configure CORS - more permissive for development
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # Allow all origins in development
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Load configuration
app.config.from_object(config['development'])
logger.info("Application configuration loaded")

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
logger.info("Database and migration extensions initialized")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Check database connection
        db.session.execute(text('SELECT 1'))
        db_status = "healthy"
        logger.info("Database health check passed")
    except Exception as e:
        db_status = "unhealthy"
        logger.error(f"Database health check failed: {str(e)}")
    
    return jsonify({
        'status': 'up',
        'timestamp': datetime.utcnow().isoformat(),
        'database': db_status,
        'environment': app.config['ENV']
    })

# Database Models
class Word(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(100), nullable=False)
    group = db.Column(db.String(100), nullable=False)
    meaning = db.Column(db.Text)
    synonyms = db.Column(db.Text)  # Store synonyms as JSON string
    incorrect_count = db.Column(db.Integer, default=0)
    last_incorrect = db.Column(db.DateTime)
    correct_count = db.Column(db.Integer, default=0)
    last_tested = db.Column(db.DateTime)

class WordProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    test_session_id = db.Column(db.Integer, db.ForeignKey('test_session.id', name='fk_word_progress_test_session'), nullable=True)

class TestSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    total_words = db.Column(db.Integer, default=0)
    correct_words = db.Column(db.Integer, default=0)
    groups = db.Column(db.Text)  # Store groups as JSON string
    progress_records = db.relationship('WordProgress', backref='test_session', lazy=True)

with app.app_context():
    db.create_all()


def get_word_meaning(word, max_retry_time=60):
    """
    Get the first available meaning and a list of synonyms for a word using WordNet.
    The return format matches the previous API-based implementation:
    
    {
        'meaning': str,
        'synonyms': list of str
    }
    """
    synsets = wordnet.synsets(word)
    if not synsets:
        print(f"Word '{word}' not found in WordNet.")
        return None

    # Get the first definition
    meaning = synsets[0].definition()

    # Collect synonyms from all synsets
    synonyms = set()
    for syn in synsets:
        for lemma in syn.lemmas():
            synonyms.add(lemma.name())

    return {
        'meaning': meaning,
        'synonyms': list(synonyms)
    }

@app.route('/api/groups', methods=['GET'])
def get_groups():
    groups = db.session.query(Word.group).distinct().all()
    return jsonify([group[0] for group in groups])

@app.route('/api/words', methods=['GET'])
def get_words():
    search = request.args.get('search', '').lower()
    group = request.args.get('group', '')
    
    logger.info(f"Fetching words with search='{search}' and group='{group}'")
    
    query = Word.query
    
    if search:
        query = query.filter(Word.word.ilike(f'%{search}%'))
    if group:
        query = query.filter(Word.group == group)
        
    words = query.order_by(Word.word).all()
    
    logger.info(f"Found {len(words)} words matching the criteria")
    
    return jsonify([{
        'id': word.id,
        'word': word.word,
        'group': word.group,
        'meaning': word.meaning,
        'correct_count': word.correct_count,
        'incorrect_count': word.incorrect_count
    } for word in words])

@app.route('/api/test', methods=['POST'])
def create_test():
    data = request.json
    groups = data.get('groups', [])
    word_count = data.get('word_count', 10)
    
    logger.info(f"Creating new test with groups={groups} and word_count={word_count}")
    
    # Create a new test session
    test_session = TestSession(
        groups=json.dumps(groups),
        total_words=word_count
    )
    db.session.add(test_session)
    db.session.commit()
    logger.info(f"Created test session with ID: {test_session.id}")
    
    # Query words with priority for incorrect ones
    query = Word.query.filter(Word.group.in_(groups))
    words = query.order_by(
        Word.incorrect_count.desc(),
        Word.last_incorrect.desc()
    ).limit(word_count).all()
    
    logger.info(f"Selected {len(words)} words for the test")
    
    # Update last_tested for all words in the test
    for word in words:
        word.last_tested = datetime.utcnow()
    
    db.session.commit()
    logger.info("Updated last_tested timestamp for all test words")
    
    test_words = [{
        'id': word.id,
        'word': word.word,
        'meaning': word.meaning,
        'test_session_id': test_session.id
    } for word in words]
    
    return jsonify(test_words)

@app.route('/api/answer', methods=['POST'])
@log_db_commit
def submit_answer():
    data = request.json
    word_id = data.get('word_id')
    is_correct = data.get('correct', False)
    test_session_id = data.get('test_session_id')
    
    word = Word.query.get_or_404(word_id)
    
    # Create progress record
    progress = WordProgress(
        word_id=word_id,
        is_correct=is_correct,
        test_session_id=test_session_id
    )
    db.session.add(progress)
    
    if is_correct:
        word.correct_count += 1
        if word.correct_count >= 3:
            word.incorrect_count = 0
            word.last_incorrect = None
    else:
        word.incorrect_count += 1
        word.last_incorrect = datetime.utcnow()
        word.correct_count = 0
    
    return jsonify({'message': 'Answer recorded successfully'})

@app.route('/api/test-complete', methods=['POST'])
@log_db_commit
def test_complete():
    data = request.json
    test_session_id = data.get('test_session_id')
    
    test_session = TestSession.query.get_or_404(test_session_id)
    test_session.end_time = datetime.utcnow()
    
    # Count correct answers
    correct_count = WordProgress.query.filter_by(
        test_session_id=test_session_id,
        is_correct=True
    ).count()
    
    test_session.correct_words = correct_count
    
    return jsonify({
        'message': 'Test completed successfully',
        'total_words': test_session.total_words,
        'correct_words': test_session.correct_words,
        'accuracy': (test_session.correct_words / test_session.total_words * 100) if test_session.total_words > 0 else 0
    })

@app.route('/api/progress', methods=['POST'])
def update_progress():
    data = request.json
    word_id = data.get('word_id')
    is_correct = data.get('is_correct')
    
    word = Word.query.get_or_404(word_id)
    
    # Update progress
    progress = WordProgress(word_id=word_id, is_correct=is_correct)
    db.session.add(progress)
    
    if is_correct:
        word.correct_count += 1
        if word.correct_count >= 3:
            word.incorrect_count = 0
            word.last_incorrect = None
    else:
        word.incorrect_count += 1
        word.last_incorrect = datetime.utcnow()
        word.correct_count = 0
    
    db.session.commit()
    return jsonify({'message': 'Progress updated successfully'})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    words = Word.query.all()
    
    # Calculate words mastered (words with correct_count >= 3)
    words_mastered = len([w for w in words if w.correct_count >= 3])
    
    # Calculate average accuracy from test sessions
    test_sessions = TestSession.query.filter(TestSession.end_time.isnot(None)).all()
    total_accuracy = 0
    total_sessions = len(test_sessions)
    
    for session in test_sessions:
        if session.total_words > 0:
            session_accuracy = (session.correct_words / session.total_words) * 100
            total_accuracy += session_accuracy
    
    average_accuracy = total_accuracy / total_sessions if total_sessions > 0 else 0
    
    stats = {
        'total_words': len(words),
        'words_to_review': len([w for w in words if w.incorrect_count > 0]),
        'groups': db.session.query(Word.group).distinct().count(),
        'words_mastered': words_mastered,
        'average_accuracy': average_accuracy
    }
    
    logger.info(f"Stats calculated: {stats}")
    return jsonify(stats)

@app.route('/api/words-to-review', methods=['GET'])
def get_words_to_review():
    words = Word.query.filter(Word.incorrect_count > 0).order_by(
        Word.incorrect_count.desc(),
        Word.last_incorrect.desc()
    ).all()
    
    return jsonify([{
        'id': word.id,
        'word': word.word,
        'group': word.group,
        'incorrect_count': word.incorrect_count
    } for word in words])

@app.route('/api/words/<int:word_id>/refresh', methods=['POST'])
@log_db_commit
def refresh_word_meaning(word_id):
    word = Word.query.get_or_404(word_id)
    result = get_word_meaning(word.word)
    
    if result:
        word.meaning = result['meaning']
        word.synonyms = json.dumps(result['synonyms'])
        return jsonify({
            'message': 'Word meaning refreshed successfully',
            'meaning': result['meaning'],
            'synonyms': result['synonyms']
        })
    else:
        # Keep the existing meaning if available, otherwise return an error
        if word.meaning:
            return jsonify({
                'message': 'Word not found in dictionary. Keeping existing meaning.',
                'meaning': word.meaning,
                'synonyms': json.loads(word.synonyms) if word.synonyms else []
            })
        return jsonify({'error': 'Word not found in dictionary and no existing meaning available'}), 400

@app.route('/api/words/<int:word_id>', methods=['DELETE'])
def delete_word(word_id):
    word = Word.query.get_or_404(word_id)
    db.session.delete(word)
    db.session.commit()
    return jsonify({'message': 'Word deleted successfully'})

@app.route('/api/words/refresh-all', methods=['POST'])
def refresh_all_words():
    try:
        words = Word.query.all()
        updated_count = 0
        failed_words = []

        for word in words:
            result = get_word_meaning(word.word)
            if result:
                word.meaning = result['meaning']
                word.synonyms = json.dumps(result['synonyms'])
                updated_count += 1
            else:
                # Only add to failed_words if the word doesn't have a meaning yet
                if not word.meaning:
                    failed_words.append(word.word)

        db.session.commit()
        
        if failed_words:
            return jsonify({
                'message': f'Refreshed {updated_count} words successfully. {len(failed_words)} words not found in dictionary.',
                'failed_words': failed_words
            })
        else:
            return jsonify({
                'message': f'Successfully refreshed all {updated_count} words.'
            })
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset-stats', methods=['POST'])
def reset_stats():
    try:
        # Reset all word progress
        Word.query.update({
            Word.incorrect_count: 0,
            Word.last_incorrect: None,
            Word.correct_count: 0
        })
        
        # Clear all progress records
        WordProgress.query.delete()
        
        db.session.commit()
        return jsonify({'message': 'Stats reset successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    logger.info("Starting file upload process")
    
    if 'file' not in request.files:
        logger.error("No file part in the request")
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        logger.error("No selected file")
        return jsonify({'error': 'No selected file'}), 400
    
    if not file.filename.endswith('.xlsx'):
        logger.error(f"Invalid file type: {file.filename}")
        return jsonify({'error': 'Please upload an Excel file (.xlsx)'}), 400
    
    try:
        logger.info(f"Processing Excel file: {file.filename}")
        df = pd.read_excel(file)
        required_columns = ['word', 'group_name']
        if not all(col in df.columns for col in required_columns):
            logger.error(f"Missing required columns. Found columns: {df.columns.tolist()}")
            return jsonify({'error': f'Excel file must contain columns: {", ".join(required_columns)}'}), 400
        
        processed_count = 0
        skipped_count = 0
        updated_count = 0
        failed_words = []
        batch_size = 30
        current_batch = []
        
        logger.info(f"Starting to process {len(df)} rows from Excel file")
        
        for index, row in df.iterrows():
            word_text = str(row['word']).strip().lower()
            group = str(row['group_name']).strip()
            
            if not word_text or not group:
                logger.warning(f"Skipping row {index + 2}: Empty word or group")
                continue
                
            existing_word = Word.query.filter_by(word=word_text).first()
            
            if existing_word:
                if existing_word.group == group:
                    logger.debug(f"Skipping existing word '{word_text}' with same group")
                    skipped_count += 1
                    continue
                logger.info(f"Updating group for word '{word_text}' from '{existing_word.group}' to '{group}'")
                existing_word.group = group
                updated_count += 1
            else:
                logger.info(f"Processing new word: '{word_text}' for group '{group}'")
                result = get_word_meaning(word_text)
                new_word = Word(
                    word=word_text,
                    group=group,
                    meaning=result['meaning'] if result else None,
                    synonyms=json.dumps(result['synonyms']) if result else json.dumps([])
                )
                current_batch.append(new_word)
                processed_count += 1
                
                if not result:
                    logger.warning(f"Failed to get meaning for word: '{word_text}'")
                    failed_words.append(word_text)
            
            # Commit batch if it reaches the batch size
            if len(current_batch) >= batch_size:
                logger.info(f"Committing batch of {len(current_batch)} words")
                db.session.bulk_save_objects(current_batch)
                db.session.commit()
                logger.info("Batch commit successful")
                current_batch = []
        
        # Commit any remaining words in the last batch
        if current_batch:
            logger.info(f"Committing final batch of {len(current_batch)} words")
            db.session.bulk_save_objects(current_batch)
            db.session.commit()
            logger.info("Final batch commit successful")
        
        logger.info(f"File processing completed. Stats: processed={processed_count}, skipped={skipped_count}, updated={updated_count}, failed={len(failed_words)}")
        
        return jsonify({
            'message': 'File processed successfully',
            'stats': {
                'processed': processed_count,
                'skipped': skipped_count,
                'updated': updated_count,
                'failed': len(failed_words)
            },
            'failed_words': failed_words
        })
        
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}", exc_info=True)
        db.session.rollback()
        logger.info("Database transaction rolled back due to error")
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@app.route('/api/words/delete-all', methods=['DELETE'])
def delete_all_words():
    try:
        Word.query.delete()  # Delete all words
        db.session.commit()
        return jsonify({'message': 'All words deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/words/<int:word_id>', methods=['PUT'])
def update_word(word_id):
    word = Word.query.get_or_404(word_id)
    data = request.json
    
    if 'meaning' in data:
        word.meaning = data['meaning']
    if 'synonyms' in data:
        word.synonyms = json.dumps(data['synonyms'])
    if 'group' in data:
        word.group = data['group']
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Word updated successfully',
            'word': {
                'id': word.id,
                'word': word.word,
                'group': word.group,
                'meaning': word.meaning,
                'synonyms': json.loads(word.synonyms) if word.synonyms else []
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    # Get all test sessions
    test_sessions = TestSession.query.filter(TestSession.end_time.isnot(None)).order_by(TestSession.end_time.desc()).all()
    
    if not test_sessions:
        return jsonify({
            'total_tests': 0,
            'average_accuracy': 0,
            'words_mastered': 0,
            'recent_activity': [],
            'accuracy_trend': [],
            'words_per_day': []
        })
    
    # Calculate total tests and average accuracy
    total_tests = len(test_sessions)
    total_accuracy = sum((session.correct_words / session.total_words * 100) for session in test_sessions if session.total_words > 0)
    average_accuracy = total_accuracy / total_tests if total_tests > 0 else 0
    
    # Count words mastered (correct 3 times in a row)
    words_mastered = Word.query.filter(Word.correct_count >= 3).count()
    
    # Get recent activity (last 10 tests)
    recent_activity = []
    for session in test_sessions[:10]:
        recent_activity.append({
            'date': session.end_time.isoformat(),
            'words_tested': session.total_words,
            'correct': session.correct_words,
            'accuracy': (session.correct_words / session.total_words * 100) if session.total_words > 0 else 0
        })
    
    # Get accuracy trend (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_sessions = TestSession.query.filter(
        TestSession.end_time >= thirty_days_ago
    ).order_by(TestSession.end_time).all()
    
    # Group by date
    accuracy_by_date = {}
    words_by_date = {}
    
    for session in recent_sessions:
        date_str = session.end_time.strftime('%Y-%m-%d')
        accuracy = (session.correct_words / session.total_words * 100) if session.total_words > 0 else 0
        
        if date_str in accuracy_by_date:
            # Average the accuracy for the day
            accuracy_by_date[date_str] = (accuracy_by_date[date_str] + accuracy) / 2
            words_by_date[date_str] += session.total_words
        else:
            accuracy_by_date[date_str] = accuracy
            words_by_date[date_str] = session.total_words
    
    # Convert to lists for the chart
    accuracy_trend = [{'date': date, 'accuracy': acc} for date, acc in accuracy_by_date.items()]
    words_per_day = [{'date': date, 'words': words} for date, words in words_by_date.items()]
    
    return jsonify({
        'total_tests': total_tests,
        'average_accuracy': average_accuracy,
        'words_mastered': words_mastered,
        'recent_activity': recent_activity,
        'accuracy_trend': accuracy_trend,
        'words_per_day': words_per_day
    })

@app.route('/api/problematic-words', methods=['GET'])
def get_problematic_words():
    # Get words that have been answered incorrectly multiple times
    problematic_words = Word.query.filter(Word.incorrect_count > 0).order_by(
        Word.incorrect_count.desc(),
        Word.last_tested.desc()
    ).limit(20).all()
    
    result = []
    for word in problematic_words:
        # Calculate accuracy for this word
        total_attempts = word.correct_count + word.incorrect_count
        accuracy = (word.correct_count / total_attempts * 100) if total_attempts > 0 else 0
        
        result.append({
            'id': word.id,
            'word': word.word,
            'group': word.group,
            'incorrect_count': word.incorrect_count,
            'last_tested': word.last_tested.isoformat() if word.last_tested else None,
            'accuracy': accuracy
        })
    
    return jsonify(result)

if __name__ == '__main__':
    try:
        logger.info("Starting GRE Words application...")
        # Test database connection
        with app.app_context():
            db.session.execute(text('SELECT 1'))
            logger.info("Database connection successful")
        
        # Log environment and configuration
        logger.info(f"Running in {app.config['ENV']} mode")
        logger.info(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # Start the application
        port = int(os.environ.get('PORT', 5000))
        logger.info(f"Starting server on port {port}")
        app.run(host='0.0.0.0', port=port)
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        raise