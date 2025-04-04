import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';

const FlaggedWords = ({ apiUrl }) => {
  const [flaggedWords, setFlaggedWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedMeaning, setEditedMeaning] = useState('');

  // ✅ Wrap fetchFlaggedWords in useCallback to stabilize reference
  const fetchFlaggedWords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/flagged-words`);
      if (!response.ok) {
        throw new Error('Failed to fetch flagged words');
      }
      const data = await response.json();
      setFlaggedWords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchFlaggedWords();
  }, [fetchFlaggedWords]); // ✅ No more ESLint errors

  const handleEditClick = (word) => {
    setSelectedWord(word);
    setEditedMeaning(word.meaning);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/words/${selectedWord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meaning: editedMeaning,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update word');
      }

      // Mark the flag as resolved
      await fetch(`${apiUrl}/api/flagged-words/${selectedWord.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setEditDialogOpen(false);
      fetchFlaggedWords(); // ✅ Safe to call here
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Flagged Words
      </Typography>

      {flaggedWords.length === 0 ? (
        <Alert severity="info">
          No words have been flagged for review.
        </Alert>
      ) : (
        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Word</TableCell>
                  <TableCell>Group</TableCell>
                  <TableCell>Current Meaning</TableCell>
                  <TableCell>Flagged On</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flaggedWords.map((word) => (
                  <TableRow key={word.id}>
                    <TableCell>{word.word}</TableCell>
                    <TableCell>{word.group}</TableCell>
                    <TableCell>{word.meaning}</TableCell>
                    <TableCell>
                      {new Date(word.flagged_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleEditClick(word)}
                      >
                        Edit Meaning
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Word Meaning</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedWord?.word}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Meaning"
              value={editedMeaning}
              onChange={(e) => setEditedMeaning(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FlaggedWords;