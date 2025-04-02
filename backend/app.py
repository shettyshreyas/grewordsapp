import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import pandas as pd
import requests
from datetime import datetime
from config import config
import time
import json

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

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)

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

class WordProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

def get_word_meaning(word, max_retry_time=60):  # 1 minute max retry time
    url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    start_time = time.time()
    backoff = 1  # Start with 1 second backoff
    
    while True:
        try:
            response = requests.get(url)
            if response.status_code == 404:
                print(f"Word '{word}' not found in dictionary")
                return None
            response.raise_for_status()
            data = response.json()
            
            # Extract meaning and synonyms
            meaning = data[0]['meanings'][0]['definitions'][0]['definition']
            
            # Extract synonyms from all definitions
            synonyms = set()
            for meaning_data in data[0]['meanings']:
                for definition in meaning_data['definitions']:
                    if 'synonyms' in definition:
                        synonyms.update(definition['synonyms'])
            
            return {
                'meaning': meaning,
                'synonyms': list(synonyms)
            }
            
        except requests.exceptions.RequestException as e:
            elapsed_time = time.time() - start_time
            if elapsed_time >= max_retry_time:
                print(f"Failed to fetch meaning for {word} after {max_retry_time} seconds")
                return None
                
            print(f"Attempt failed for {word}: {e}. Retrying in {backoff} seconds...")
            time.sleep(backoff)
            backoff = min(backoff * 2, 30)  # Cap backoff at 30 seconds

@app.route('/api/groups', methods=['GET'])
def get_groups():
    groups = db.session.query(Word.group).distinct().all()
    return jsonify([group[0] for group in groups])

@app.route('/api/words', methods=['GET'])
def get_words():
    search = request.args.get('search', '').lower()
    group = request.args.get('group', '')
    
    query = Word.query
    
    if search:
        query = query.filter(Word.word.ilike(f'%{search}%'))
    if group:
        query = query.filter(Word.group == group)
        
    words = query.order_by(Word.word).all()
    
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
    
    # Query words with priority for incorrect ones
    query = Word.query.filter(Word.group.in_(groups))
    words = query.order_by(
        Word.incorrect_count.desc(),
        Word.last_incorrect.desc()
    ).limit(word_count).all()
    
    test_words = [{
        'id': word.id,
        'word': word.word,
        'meaning': word.meaning
    } for word in words]
    
    return jsonify(test_words)

@app.route('/api/answer', methods=['POST'])
def submit_answer():
    data = request.json
    word_id = data.get('word_id')
    is_correct = data.get('correct', False)
    
    word = Word.query.get_or_404(word_id)
    
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
    return jsonify({'message': 'Answer recorded successfully'})

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
    stats = {
        'total_words': len(words),
        'words_to_review': len([w for w in words if w.incorrect_count > 0]),
        'groups': db.session.query(Word.group).distinct().count()
    }
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
def refresh_word_meaning(word_id):
    word = Word.query.get_or_404(word_id)
    result = get_word_meaning(word.word)
    
    if result:
        word.meaning = result['meaning']
        word.synonyms = json.dumps(result['synonyms'])
        db.session.commit()
        return jsonify({
            'message': 'Word meaning refreshed successfully',
            'meaning': result['meaning'],
            'synonyms': result['synonyms']
        })
    return jsonify({'error': 'Could not fetch meaning'}), 400

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
                failed_words.append(word.word)

        db.session.commit()
        
        if failed_words:
            return jsonify({
                'message': f'Refreshed {updated_count} words successfully. Failed to refresh {len(failed_words)} words.',
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
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not file.filename.endswith('.xlsx'):
        return jsonify({'error': 'Please upload an Excel file (.xlsx)'}), 400
    
    try:
        df = pd.read_excel(file)
        required_columns = ['word', 'group_name']
        if not all(col in df.columns for col in required_columns):
            return jsonify({'error': f'Excel file must contain columns: {", ".join(required_columns)}'}), 400
        
        processed_count = 0
        skipped_count = 0
        updated_count = 0
        failed_words = []
        batch_size = 30
        current_batch = []
        
        for _, row in df.iterrows():
            word_text = str(row['word']).strip().lower()
            group = str(row['group_name']).strip()
            
            if not word_text or not group:
                continue
                
            existing_word = Word.query.filter_by(word=word_text).first()
            
            if existing_word:
                if existing_word.group == group:
                    skipped_count += 1
                    continue
                existing_word.group = group
                updated_count += 1
            else:
                result = get_word_meaning(word_text)
                if result:
                    new_word = Word(
                        word=word_text,
                        group=group,
                        meaning=result['meaning'],
                        synonyms=json.dumps(result['synonyms'])
                    )
                    current_batch.append(new_word)
                    processed_count += 1
                else:
                    failed_words.append(word_text)
            
            # Commit batch if it reaches the batch size
            if len(current_batch) >= batch_size:
                db.session.bulk_save_objects(current_batch)
                db.session.commit()
                current_batch = []
        
        # Commit any remaining words in the last batch
        if current_batch:
            db.session.bulk_save_objects(current_batch)
            db.session.commit()
        
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
        db.session.rollback()
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

if __name__ == '__main__':
    app.run(debug=True) 