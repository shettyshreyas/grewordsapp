import React, { useState, useEffect } from 'react';
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
  Divider,
} from '@mui/material';

const WordEdit = ({ word, open, onClose, onSave, apiUrl }) => {
  const [meaning, setMeaning] = useState('');
  const [synonyms, setSynonyms] = useState([]);
  const [newSynonym, setNewSynonym] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Update state when word changes
  useEffect(() => {
    if (word) {
      setMeaning(word.meaning || '');
      setSynonyms(word.synonyms ? JSON.parse(word.synonyms) : []);
    }
  }, [word]);

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

  const handleRefreshMeaning = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/words/${word.id}/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh meaning');
      }

      const data = await response.json();
      setMeaning(data.meaning);
      setSynonyms(data.synonyms);
    } catch (error) {
      console.error('Error refreshing meaning:', error);
      setError(error.message || 'Failed to refresh meaning. Please try again.');
    } finally {
      setLoading(false);
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Meaning</Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleRefreshMeaning}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh from Dictionary'}
            </Button>
          </Box>
          
          <TextField
            label="Meaning"
            multiline
            rows={4}
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            placeholder="Enter the meaning of the word..."
          />

          <Divider sx={{ my: 2 }} />

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