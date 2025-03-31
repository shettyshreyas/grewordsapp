from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import pandas as pd
import requests
from datetime import datetime
from config import config
import os
import time

app = Flask(__name__)
CORS(app)

# Load configuration
config_name = os.getenv('FLASK_ENV', 'development')
app.config.from_object(config[config_name])

db = SQLAlchemy(app)

# Database Models
class Word(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(100), nullable=False)
    group = db.Column(db.String(100), nullable=False)
    meaning = db.Column(db.Text)
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

def get_word_meaning(word, retries=3, backoff=1):
    url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    
    for attempt in range(retries):
        try:
            response = requests.get(url)
            response.raise_for_status()  # Raise an error for bad responses
            data = response.json()
            # Assuming the meaning is in the first entry
            meaning = data[0]['meanings'][0]['definitions'][0]['definition']
            return meaning
        except requests.exceptions.RequestException as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            time.sleep(backoff)  # Wait before retrying
            backoff *= 2  # Exponential backoff
    return None  # Return None if all retries fail

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
    meaning = get_word_meaning(word.word)
    if meaning:
        word.meaning = meaning
        db.session.commit()
        return jsonify({'message': 'Word meaning refreshed successfully'})
    return jsonify({'error': 'Could not fetch meaning'}), 400

@app.route('/api/words/<int:word_id>', methods=['DELETE'])
def delete_word(word_id):
    word = Word.query.get_or_404(word_id)
    db.session.delete(word)
    db.session.commit()
    return jsonify({'message': 'Word deleted successfully'})

@app.route('/api/words/refresh-all', methods=['POST'])
def refresh_all_words():
    words = Word.query.all()
    updated_count = 0
    for word in words:
        meaning = get_word_meaning(word.word)
        if meaning:
            word.meaning = meaning
            updated_count += 1
    db.session.commit()
    return jsonify({'message': f'Refreshed {updated_count} words successfully'})

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
        # Read the Excel file
        df = pd.read_excel(file)
        
        # Validate required columns
        required_columns = ['word', 'group']
        if not all(col in df.columns for col in required_columns):
            return jsonify({'error': f'Excel file must contain columns: {", ".join(required_columns)}'}), 400
        
        # Process each row
        processed_count = 0
        skipped_count = 0
        updated_count = 0
        
        for _, row in df.iterrows():
            word_text = str(row['word']).strip().lower()
            group = str(row['group']).strip()
            
            if not word_text or not group:
                continue
                
            # Check if word exists
            existing_word = Word.query.filter_by(word=word_text).first()
            
            if existing_word:
                # If word exists in the same group, skip it
                if existing_word.group == group:
                    skipped_count += 1
                    continue
                # If word exists in a different group, update the group
                existing_word.group = group
                updated_count += 1
            else:
                # Create new word
                meaning = get_word_meaning(word_text)
                new_word = Word(
                    word=word_text,
                    group=group,
                    meaning=meaning
                )
                db.session.add(new_word)
                processed_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'File processed successfully',
            'stats': {
                'processed': processed_count,
                'skipped': skipped_count,
                'updated': updated_count
            }
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

if __name__ == '__main__':
    app.run(debug=True) 