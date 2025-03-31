# GRE Words App

A web application to help users learn and practice GRE vocabulary words.

## Local Development

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- PostgreSQL (for local database)

### Database Setup

#### macOS

1. Install PostgreSQL using Homebrew:
   ```bash
   brew install postgresql@14
   ```

2. Start the PostgreSQL service:
   ```bash
   brew services start postgresql@14
   ```

3. Create the database:
   ```bash
   createdb grewords
   ```

#### Linux

1. Install PostgreSQL:
   ```bash
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   ```

2. Start the PostgreSQL service:
   ```bash
   sudo service postgresql start
   ```

3. Create the database:
   ```bash
   sudo -u postgres createdb grewords
   ```

#### Windows

1. Download and install PostgreSQL from the [official website](https://www.postgresql.org/download/windows/)
2. During installation, note down the password you set for the postgres user
3. Open pgAdmin 4 (installed with PostgreSQL)
4. Right-click on "Databases" and select "Create" > "Database"
5. Enter "grewords" as the database name and click "Save"

### Backend Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your local database credentials and other settings.

4. Initialize the database:
   ```bash
   python init_db.py
   ```

5. Run the Flask development server:
   ```bash
   python app.py
   ```
   The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   echo "REACT_APP_API_URL=http://localhost:5000" > .env
   ```

4. Start the development server:
   ```bash
   npm start
   ```
   The frontend will be available at `http://localhost:3000`

### Testing

#### Backend Tests

Run tests from the root directory:
```bash
python -m pytest
```

#### Frontend Tests

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Run tests:
   ```bash
   npm test
   ```

### Database Management

To manage the database locally:

1. Create a new database:
   ```bash
   createdb grewords
   ```

2. Run migrations:
   ```bash
   python init_db.py
   ```

3. To reset the database:
   ```bash
   dropdb grewords
   createdb grewords
   python init_db.py
   ```

## Project Structure

```
grewordsapp/
├── frontend/          # React frontend
│   ├── src/          # Source code
│   ├── public/       # Static files
│   └── package.json  # Frontend dependencies
├── .env.example      # Example environment variables
├── requirements.txt  # Python dependencies
├── app.py           # Flask application
├── config.py        # Flask configuration
├── init_db.py       # Database initialization
├── populate_db.py   # Database population script
└── .github/         # GitHub Actions workflows
```

## Deployment

The application is automatically deployed using GitHub Actions:

- Production: Deploys to GitHub Pages (frontend) and Render (backend) on pushes to main
- Preview: Deploys preview builds for pull requests

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests locally
4. Create a pull request
5. Wait for the preview deployment
6. Get code review
7. Merge to main

## License

MIT 