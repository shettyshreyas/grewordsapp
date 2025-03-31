from app import app, db, Word
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

if __name__ == '__main__':
    with app.app_context():
        excel_path = input("Enter the path to your Excel file: ")
        populate_database(excel_path) 