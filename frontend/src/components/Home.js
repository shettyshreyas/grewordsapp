import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

const Home = ({ onStartTest, apiUrl }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [wordCount, setWordCount] = useState(10);
  const [stats, setStats] = useState({
    total_words: 0,
    words_tested: 0,
    correct_answers: 0,
    accuracy: 0
  });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchStats();
  }, [apiUrl]);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/groups`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleResetStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/reset-stats`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to reset stats');
      await fetchStats();
      setResetDialogOpen(false);
    } catch (error) {
      console.error('Error resetting stats:', error);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        GRE Words App
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: { xs: 2, sm: 0 } }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Start New Test
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Groups</InputLabel>
                    <Select
                      multiple
                      value={selectedGroups}
                      onChange={(e) => setSelectedGroups(e.target.value)}
                      label="Select Groups"
                    >
                      {groups.map((group) => (
                        <MenuItem key={group} value={group}>
                          {group}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Number of Words"
                    value={wordCount}
                    onChange={(e) => setWordCount(parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => onStartTest(selectedGroups, wordCount)}
                    disabled={selectedGroups.length === 0}
                  >
                    Start Test
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Statistics</Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setResetDialogOpen(true)}
                >
                  Reset Stats
                </Button>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2">Total Words</Typography>
                  <Typography variant="h6">{stats.total_words}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2">Words Tested</Typography>
                  <Typography variant="h6">{stats.words_tested}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2">Correct Answers</Typography>
                  <Typography variant="h6">{stats.correct_answers}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2">Accuracy</Typography>
                  <Typography variant="h6">{stats.accuracy}%</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset Statistics</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all statistics? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResetStats} color="error" variant="contained">
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home; 