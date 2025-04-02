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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';

const Words = ({ apiUrl }) => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchGroups();
  }, [apiUrl]);

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

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchWords();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedGroup]);

  const columns = [
    { field: 'word', headerName: 'Word', width: 200 },
    { 
        field: 'meaning', 
        headerName: 'Meaning', 
        width: 400,
        renderCell: (params) => (
            <Box>
                <Typography>{params.value}</Typography>
                {params.row.synonyms && (
                    <Typography variant="body2" color="textSecondary">
                        Synonyms: {JSON.parse(params.row.synonyms).join(', ')}
                    </Typography>
                )}
            </Box>
        )
    },
    { field: 'group', headerName: 'Group', width: 150 },
    { 
      field: 'correct_count', 
      headerName: 'Correct', 
      width: 100,
      valueGetter: (params) => params.value || 0
    },
    { 
      field: 'incorrect_count', 
      headerName: 'Incorrect', 
      width: 100,
      valueGetter: (params) => params.value || 0
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleRefreshWord(params.row.id)}
            title="Refresh meaning"
          >
            <RefreshIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteWord(params.row.id)}
            title="Delete word"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];


  const handleDeleteAllWords = async () => {
    if (!window.confirm('Are you sure you want to delete all words? This action cannot be undone.')) return;

    try {
        const response = await fetch(`${apiUrl}/api/words/delete-all`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete all words');
        showSnackbar('All words deleted successfully');
        fetchWords(); // Refresh the word list
    } catch (error) {
        console.error('Error deleting all words:', error);
        showSnackbar('Failed to delete all words', 'error');
    }
};

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Words List</Typography>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteAllWords}
                    >
                        Delete All Words
                    </Button>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Words List
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshAll}
            disabled={loading}
          >
            Refresh All Meanings
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Group</InputLabel>
            <Select
              value={selectedGroup}
              label="Group"
              onChange={(e) => setSelectedGroup(e.target.value)}
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

        <Box sx={{ height: 600, width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : words.length === 0 ? (
            <Typography variant="body1" align="center" sx={{ mt: 4 }}>
              No words found. Try adjusting your search or filters.
            </Typography>
          ) : (
            <DataGrid
              rows={words}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              disableSelectionOnClick
              autoHeight
              getRowId={(row) => row.id}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
            />
          )}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Box>
  );
};

export default Words; 