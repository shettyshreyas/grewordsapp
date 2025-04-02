import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Snackbar,
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import WordEdit from './WordEdit';

const Words = ({ apiUrl }) => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editingWord, setEditingWord] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, [apiUrl, fetchGroups]);

  useEffect(() => {
    fetchWords();
  }, [apiUrl, fetchWords, selectedGroup, searchTerm]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/groups`);
      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.statusText}`);
      }
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to fetch groups. Please try again later.');
    }
  };

  const fetchWords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedGroup) params.append('group', selectedGroup);

      const response = await fetch(`${apiUrl}/api/words?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch words: ${response.statusText}`);
      }
      
      const data = await response.json();
      setWords(data);
    } catch (error) {
      console.error('Error fetching words:', error);
      setError('Failed to fetch words. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshWord = async (wordId) => {
    try {
      const response = await fetch(`${apiUrl}/api/words/${wordId}/refresh`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to refresh word');
      showSnackbar('Word meaning refreshed successfully');
      fetchWords();
    } catch (error) {
      console.error('Error refreshing word:', error);
      showSnackbar('Failed to refresh word meaning', 'error');
    }
  };

  const handleDeleteWord = async (wordId) => {
    if (!window.confirm('Are you sure you want to delete this word?')) return;
    
    try {
      const response = await fetch(`${apiUrl}/api/words/${wordId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete word');
      showSnackbar('Word deleted successfully');
      fetchWords();
    } catch (error) {
      console.error('Error deleting word:', error);
      showSnackbar('Failed to delete word', 'error');
    }
  };

  const handleEditWord = (word) => {
    setEditingWord(word);
  };

  const handleSaveWord = (updatedWord) => {
    setWords(words.map(w => w.id === updatedWord.id ? updatedWord : w));
    showSnackbar('Word updated successfully');
  };

  const handleRefreshAll = async () => {
    if (!window.confirm('Are you sure you want to refresh all word meanings? This may take a while.')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/words/refresh-all`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to refresh words');
      const data = await response.json();
      showSnackbar(data.message);
      fetchWords();
    } catch (error) {
      console.error('Error refreshing words:', error);
      showSnackbar('Failed to refresh word meanings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: 'word', headerName: 'Word', width: 150 },
    { field: 'group', headerName: 'Group', width: 150 },
    { 
      field: 'meaning', 
      headerName: 'Meaning', 
      width: 400,
      renderCell: (params) => (
        <Box>
          {params.value ? (
            <Typography>{params.value}</Typography>
          ) : (
            <Typography color="error" fontStyle="italic">
              No meaning available - click edit to add one
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <IconButton
            onClick={() => handleEditWord(params.row)}
            size="small"
            title="Edit"
            color={params.row.meaning ? "primary" : "error"}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => handleRefreshWord(params.row.id)}
            size="small"
            title="Refresh Meaning"
          >
            <RefreshIcon />
          </IconButton>
          <IconButton
            onClick={() => handleDeleteWord(params.row.id)}
            size="small"
            title="Delete"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Words List</Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshAll}
            disabled={loading}
          >
            Refresh All Meanings
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Search Words"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Group</InputLabel>
            <Select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              label="Group"
            >
              <MenuItem value="">All Groups</MenuItem>
              {groups.map((group) => (
                <MenuItem key={group} value={group}>
                  {group}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={words}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disableSelectionOnClick
            loading={loading}
          />
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />

      {editingWord && (
        <WordEdit
          word={editingWord}
          open={true}
          onClose={() => setEditingWord(null)}
          onSave={handleSaveWord}
          apiUrl={apiUrl}
        />
      )}
    </Box>
  );
};

export default Words; 