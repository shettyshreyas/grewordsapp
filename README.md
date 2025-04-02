# GRE Words App

A web application for managing and learning GRE vocabulary words.

## Project Structure

```
grewordsapp/
├── backend/               # Backend Flask application
│   ├── app.py            # Main application file
│   ├── config.py         # Configuration settings
│   └── requirements.txt  # Python dependencies
├── frontend/             # Frontend React application
│   ├── public/           # Static files
│   └── src/              # React source code
└── README.md            # This file
```

## Setup Instructions

### Backend Setup

1. Create and activate a virtual environment:
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Set up the database:

#### Development (SQLite)
- No additional setup required. The application will automatically create a SQLite database file (`grewords.db`) in the backend directory.
- This database file is ignored by git (see `.gitignore`).

#### Production (PostgreSQL)
1. Install PostgreSQL
2. Create a database:
```bash
createdb grewords
```
3. Set environment variables:
```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/grewords"
export FLASK_ENV=production
```

4. Run the backend:
```bash
# Development
flask --app backend/app.py run

# Production
flask --app backend/app.py run --host=0.0.0.0
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000` and communicate with the backend at `http://localhost:5000`.

## Features

- Upload Excel files containing GRE words and their groups
- View and manage words in a tabular format
- Flashcards for learning words
- Track correct and incorrect answers
- Automatic fetching of word meanings and synonyms
- Group-based organization of words

## API Endpoints

- `POST /api/upload`: Upload Excel file with words
- `GET /api/words`: Get all words (with optional search and group filters)
- `POST /api/words/<id>/refresh`: Refresh meaning for a specific word
- `POST /api/words/refresh-all`: Refresh meanings for all words
- `DELETE /api/words/<id>`: Delete a specific word
- `DELETE /api/words/delete-all`: Delete all words

## Development Notes

- The application uses SQLite in development mode for simplicity
- CORS is enabled for local development
- Word meanings are fetched from the Free Dictionary API
- The frontend uses Material-UI for styling

## Production Deployment

For production deployment:
1. Set up a PostgreSQL database
2. Configure environment variables
3. Use a production-grade WSGI server (e.g., Gunicorn)
4. Set up proper CORS configuration
5. Use environment variables for sensitive information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 