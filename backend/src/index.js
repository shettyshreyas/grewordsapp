// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Update CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://shreyasshetty.github.io',
    'https://shreyasshetty.github.io/grewordsapp'
  ],
  credentials: true
})); 