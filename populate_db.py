from app import app, db, Word, get_word_meaning
import pandas as pd
import requests
from tqdm import tqdm

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

def populate_database(excel_path):
    """Populate the database with words from Excel file"""
    print("Reading Excel file...")
    df = pd.read_excel(excel_path)
    
    print("Populating database...")
    for _, row in tqdm(df.iterrows(), total=len(df)):
        word = Word.query.filter_by(word=row['word']).first()
        if not word:
            meaning = get_word_meaning(row['word'])
            word = Word(
                word=row['word'],
                group=str(row['group']),  # Convert group number to string
                meaning=meaning
            )
            db.session.add(word)
    
    db.session.commit()
    print("Database populated successfully!")

test_words = [
    {"word": "ubiquitous", "group": "Common GRE Words"},
    {"word": "ephemeral", "group": "Common GRE Words"},
    {"word": "pragmatic", "group": "Common GRE Words"},
    {"word": "esoteric", "group": "Advanced Words"},
    {"word": "sycophant", "group": "Advanced Words"},
]

def populate_test_data():
    with app.app_context():
        # Clear existing data
        Word.query.delete()
        db.session.commit()
        
        # Add test words
        for word_data in test_words:
            meaning = get_word_meaning(word_data["word"])
            word = Word(
                word=word_data["word"],
                group=word_data["group"],
                meaning=meaning,
                correct_count=0,
                incorrect_count=0
            )
            db.session.add(word)
        
        db.session.commit()
        print("Test data populated successfully!")

if __name__ == "__main__":
    populate_test_data() 