import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  NavigateNext as NextIcon,
} from '@mui/icons-material';
import axios from 'axios';

function Test() {
  const location = useLocation();
  const navigate = useNavigate();
  const { groups, wordCount } = location.state || { groups: [], wordCount: 10 };
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (groups.length === 0) {
      navigate('/');
      return;
    }
    fetchWords();
  }, [groups, wordCount, navigate]);

  const fetchWords = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/test', {
        groups,
        word_count: wordCount,
      });
      setWords(response.data);
      setProgress(0);
    } catch (error) {
      console.error('Error fetching words:', error);
    }
  };

  const handleResponse = async (isCorrect) => {
    if (currentIndex >= words.length) return;

    try {
      await axios.post('http://localhost:5000/api/progress', {
        word_id: words[currentIndex].id,
        is_correct: isCorrect,
      });

      setProgress(((currentIndex + 1) / words.length) * 100);
      setCurrentIndex(currentIndex + 1);
      setShowMeaning(false);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  if (words.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5">Loading words...</Typography>
      </Box>
    );
  }

  if (currentIndex >= words.length) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Test Complete!
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          startIcon={<NextIcon />}
        >
          Start New Test
        </Button>
      </Box>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <Box>
      {/* Progress bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Progress
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {currentIndex + 1} of {words.length} words
        </Typography>
      </Paper>

      {/* Flip card */}
      <Box
        sx={{
          perspective: '1000px',
          width: '100%',
          maxWidth: 400,
          height: 250,
          margin: '0 auto',
        }}
      >
        <Box
          onClick={() => setShowMeaning(!showMeaning)}
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s',
            transform: showMeaning ? 'rotateY(180deg)' : 'rotateY(0deg)',
            cursor: 'pointer',
          }}
        >
          {/* Front Side */}
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2,
            }}
          >
            <Typography variant="h4" gutterBottom>
              {currentWord.word}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Click to see meaning
            </Typography>
          </Box>

          {/* Back Side */}
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Meaning
            </Typography>
            <Typography variant="body1" paragraph>
              {currentWord.meaning}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click to see word again
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
        <IconButton
          color="error"
          size="large"
          onClick={() => handleResponse(false)}
          sx={{ bgcolor: 'error.light', '&:hover': { bgcolor: 'error.main' } }}
        >
          <CloseIcon />
        </IconButton>
        <IconButton
          color="success"
          size="large"
          onClick={() => handleResponse(true)}
          sx={{ bgcolor: 'success.light', '&:hover': { bgcolor: 'success.main' } }}
        >
          <CheckIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export default Test;