import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import config from '../config';

const Test = () => {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const { apiUrl } = config;

  const currentWord = words[currentIndex];

  useEffect(() => {
    const fetchTestWords = async (groups, wordCount) => {
      try {
        const response = await fetch(`${apiUrl}/api/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ groups, word_count: wordCount }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch test words');
        }

        const data = await response.json();
        setWords(data);
      } catch (err) {
        console.error('Failed to fetch test words:', err);
      }
    };

    const testData = JSON.parse(localStorage.getItem('testData'));
    if (testData) {
      fetchTestWords(testData.selectedGroups, testData.wordCount);
    }
  }, [apiUrl]);

  const handleFlip = () => {
    setShowMeaning(!showMeaning);
  };

  const handleAnswer = async (isCorrect) => {
    const currentWord = words[currentIndex];

    try {
      await fetch(`${apiUrl}/api/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word_id: currentWord.id,
          correct: isCorrect,
        }),
      });

      if (currentIndex < words.length - 1) {
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        setShowMeaning(false);
        setProgress(((newIndex) / words.length) * 100);
      } else {
        await completeTest();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const completeTest = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/test-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error('Failed to complete test');

      const results = await response.json();
      setTestResults(results);
      setTestComplete(true);
      setShowResultsDialog(true);
    } catch (error) {
      console.error('Error completing test:', error);
      setTestComplete(true);
    }
  };

  const handleCloseResults = () => {
    setShowResultsDialog(false);
    localStorage.removeItem('testData');
    window.location.reload();
  };

  if (words.length === 0) {
    return (
      <Typography variant="h6" align="center">
        No words available for testing. Please select groups and start a new test.
      </Typography>
    );
  }

  if (testComplete && !showResultsDialog) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Test Complete!
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            localStorage.removeItem('testData');
            window.location.reload();
          }}
        >
          Start New Test
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <LinearProgress variant="determinate" value={progress} sx={{ mb: 3 }} />

      <Card
        sx={{
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={handleFlip}
      >
        <CardContent sx={{ textAlign: 'center' }}>
          {!showMeaning ? (
            <Typography variant="h4" gutterBottom>
              {currentWord.word}
            </Typography>
          ) : (
            <Typography variant="h6" color="text.secondary">
              {currentWord.meaning}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
        <IconButton color="error" size="large" onClick={() => handleAnswer(false)}>
          <CloseIcon />
        </IconButton>
        <IconButton color="success" size="large" onClick={() => handleAnswer(true)}>
          <CheckIcon />
        </IconButton>
      </Box>

      <Typography variant="body2" align="center" sx={{ mt: 2 }}>
        Click the card to flip, or use the buttons to mark as correct/incorrect
      </Typography>

      <Dialog open={showResultsDialog} onClose={handleCloseResults}>
        <DialogTitle>Test Results</DialogTitle>
        <DialogContent>
          {testResults && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" align="center" gutterBottom>
                  {testResults.accuracy.toFixed(1)}% Accuracy
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Words Tested:</Typography>
                <Typography variant="h5">{testResults.total_words}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Correct Answers:</Typography>
                <Typography variant="h5">{testResults.correct_words}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResults}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Test;