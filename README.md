# GRE Words App

A web application to help you learn and test GRE vocabulary words using flashcards.

## Features

- Import word groups from Excel
- Create customized tests with specified number of words
- Interactive flashcard interface
- Dictionary integration for word meanings
- Progress tracking for incorrect words
- Priority testing for words you need to improve on

## Setup

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file with:
```
FLASK_APP=app.py
FLASK_ENV=development
```

4. Run the backend:
```bash
flask run
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm start
```

## Usage

1. Upload your Excel file containing word groups
2. Select the groups you want to test
3. Choose the number of words for the test
4. Start the test and flip through flashcards
5. Mark words as correct/incorrect
6. View your progress and focus on words you need to improve

## Data Format

Your Excel file should have the following columns:
- word: The vocabulary word
- group: The group/category the word belongs to 