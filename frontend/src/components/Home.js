import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import axios from 'axios';
import config from '../config';

function Home() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [wordCount, setWordCount] = useState(10);
  const [stats, setStats] = useState(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchStats();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/groups`);
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const startTest = () => {
    if (selectedGroups.length === 0) {
      alert('Please select at least one group');
      return;
    }

    navigate('/test', {
      state: { groups: selectedGroups, wordCount }
    });
  };

  const handleResetStats = async () => {
    try {
      await axios.post(`${config.apiUrl}/api/reset-stats`);
      fetchStats();
      setResetDialogOpen(false);
    } catch (error) {
      console.error('Error resetting stats:', error);
      alert('Failed to reset stats. Please try again.');
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        GRE Words App
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: { xs: 2, sm: 0 } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Start New Test
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Groups</InputLabel>
                <Select
                  multiple
                  value={selectedGroups}
                  onChange={(e) => setSelectedGroups(e.target.value)}
                  label="Select Groups"
                  sx={{ mb: 2 }}
                >
                  {groups.map((group) => (
                    <MenuItem key={group} value={group}>
                      {group}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                type="number"
                label="Number of Words"
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={startTest}
                disabled={selectedGroups.length === 0}
                size="large"
              >
                Start Test
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            {stats && (
              <>
                <Typography variant="body1" gutterBottom>
                  Total Words: {stats.total_words}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Words to Review: {stats.words_to_review}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Total Groups: {stats.groups}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => setResetDialogOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Reset Stats
                </Button>
              </>
            )}
          </Paper>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How to Use
              </Typography>
              <Typography variant="body2" paragraph>
                1. Select one or more word groups
              </Typography>
              <Typography variant="body2" paragraph>
                2. Choose how many words you want to test
              </Typography>
              <Typography variant="body2" paragraph>
                3. Start the test and flip cards to see meanings
              </Typography>
              <Typography variant="body2" paragraph>
                4. Mark words as correct or incorrect
              </Typography>
              <Typography variant="body2">
                5. Review your progress in the Stats section
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
      >
        <DialogTitle>Reset Statistics</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all your progress? This action cannot be undone.
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
}

export default Home; 