from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import pandas as pd
import requests
from datetime import datetime
from config import config
import os

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

def get_word_meaning(word):
    """Fetch word meaning from Free Dictionary API"""
    try:
        response = requests.get(f'https://api.dictionaryapi.dev/api/v2/entries/en/{word}')
        if response.status_code == 200:
            data = response.json()
            meanings = data[0].get('meanings', [])
            if meanings:
                return meanings[0].get('definitions', [{}])[0].get('definition', '')
    except:
        pass
    return None

@app.route('/api/groups', methods=['GET'])
def get_groups():
    groups = db.session.query(Word.group).distinct().all()
    return jsonify([group[0] for group in groups])

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

if __name__ == '__main__':
    app.run(debug=True) 