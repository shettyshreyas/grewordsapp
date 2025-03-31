import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

const Words = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [meaningFilter, setMeaningFilter] = useState('');

  const columns = [
    { field: 'word', headerName: 'Word', width: 200 },
    { field: 'meaning', headerName: 'Meaning', width: 400, flex: 1 },
    { field: 'example', headerName: 'Example', width: 400, flex: 1 },
    { field: 'group_name', headerName: 'Group', width: 200 },
  ];

  const fetchWords = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (groupFilter) params.append('group', groupFilter);
      if (meaningFilter) params.append('meaning', meaningFilter);

      const response = await axios.get(`${config.apiUrl}/api/words?${params}`);
      setWords(response.data);
    } catch (err) {
      setError('Error fetching words');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, [searchTerm, groupFilter, meaningFilter]);

  return (
    <Container maxWidth="xl">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Words Database
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search (word or meaning)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Filter by Group"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Filter by Meaning"
              value={meaningFilter}
              onChange={(e) => setMeaningFilter(e.target.value)}
            />
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ height: 600, width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={words}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              autoHeight
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Words; 