import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  Alert,
} from '@mui/material';

const WordEdit = ({ word, open, onClose, onSave, apiUrl }) => {
  const [meaning, setMeaning] = useState(word?.meaning || '');
  const [synonyms, setSynonyms] = useState(word?.synonyms || []);
  const [newSynonym, setNewSynonym] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleAddSynonym = () => {
    if (newSynonym.trim() && !synonyms.includes(newSynonym.trim())) {
      setSynonyms([...synonyms, newSynonym.trim()]);
      setNewSynonym('');
    }
  };

  const handleRemoveSynonym = (synonym) => {
    setSynonyms(synonyms.filter(s => s !== synonym));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/words/${word.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meaning,
          synonyms,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update word');
      }

      const data = await response.json();
      onSave(data.word);
      onClose();
    } catch (error) {
      console.error('Error updating word:', error);
      setError('Failed to update word. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Word: {word?.word}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Meaning"
            multiline
            rows={4}
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle1" gutterBottom>
            Synonyms
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              label="Add Synonym"
              value={newSynonym}
              onChange={(e) => setNewSynonym(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSynonym();
                }
              }}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleAddSynonym}
              disabled={!newSynonym.trim()}
            >
              Add
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {synonyms.map((synonym) => (
              <Chip
                key={synonym}
                label={synonym}
                onDelete={() => handleRemoveSynonym(synonym)}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WordEdit; 