import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import axios from 'axios';

function Stats() {
  const [stats, setStats] = useState(null);
  const [wordsToReview, setWordsToReview] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchWordsToReview();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchWordsToReview = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/words-to-review');
      setWordsToReview(response.data);
    } catch (error) {
      console.error('Error fetching words to review:', error);
    }
  };

  if (!stats) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5">Loading stats...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Your Progress
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Words
              </Typography>
              <Typography variant="h3">
                {stats.total_words}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Words to Review
              </Typography>
              <Typography variant="h3" color="error">
                {stats.words_to_review}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Word Groups
              </Typography>
              <Typography variant="h3">
                {stats.groups}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Words to Review
        </Typography>
        <List>
          {wordsToReview.map((word, index) => (
            <React.Fragment key={word.id}>
              <ListItem>
                <ListItemText
                  primary={word.word}
                  secondary={`Group: ${word.group} | Incorrect attempts: ${word.incorrect_count}`}
                />
              </ListItem>
              {index < wordsToReview.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          {wordsToReview.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No words to review!"
                secondary="Great job! You've mastered all the words."
              />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
}

export default Stats; 