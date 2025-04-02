import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
  CircularProgress,
} from '@mui/material';
import config from '../config';

const Home = ({ onStartTest }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [wordCount, setWordCount] = useState(10);
  const [stats, setStats] = useState({
    total_words: 0,
    words_to_review: 0,
    groups: 0,
    words_mastered: 0,
    average_accuracy: 0,
  });
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { apiUrl } = config;

  useEffect(() => {
    const fetchGroupsAndStats = async () => {
      try {
        const groupsRes = await fetch(`${apiUrl}/api/groups`);
        if (!groupsRes.ok) throw new Error('Failed to fetch groups');
        const groupsData = await groupsRes.json();
        setGroups(groupsData);

        setLoading(true);
        const statsRes = await fetch(`${apiUrl}/api/stats`);
        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        const statsData = await statsRes.json();
        setStats(statsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupsAndStats();
  }, [apiUrl]);

  const handleResetStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/reset-stats`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to reset stats');
      // Re-fetch stats after reset
      const statsRes = await fetch(`${apiUrl}/api/stats`);
      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsRes.json();
      setStats(statsData);
      setResetDialogOpen(false);
    } catch (err) {
      console.error('Error resetting stats:', err);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        GRE Words App
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
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
                  onChange={(e) => setWordCount(parseInt(e.target.value, 10))}
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
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">Statistics</Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setResetDialogOpen(true)}
              >
                Reset Stats
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Total Words</Typography>
                  <Typography variant="h6">{stats.total_words}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Words to Review</Typography>
                  <Typography variant="h6" color="error">
                    {stats.words_to_review}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Words Mastered</Typography>
                  <Typography variant="h6" color="success.main">
                    {stats.words_mastered}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Average Accuracy</Typography>
                  <Typography variant="h6">
                    {stats.average_accuracy.toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset Statistics</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all statistics? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResetStats}
            color="error"
            variant="contained"
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;