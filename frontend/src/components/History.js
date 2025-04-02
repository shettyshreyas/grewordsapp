import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const History = ({ apiUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [problematicWords, setProblematicWords] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchHistoryData();
  }, [apiUrl, fetchHistoryData]);

  const fetchHistoryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch history data
      const historyResponse = await fetch(`${apiUrl}/api/history`);
      if (!historyResponse.ok) {
        throw new Error('Failed to fetch history data');
      }
      const historyData = await historyResponse.json();
      setHistoryData(historyData);
      
      // Fetch problematic words
      const problematicResponse = await fetch(`${apiUrl}/api/problematic-words`);
      if (!problematicResponse.ok) {
        throw new Error('Failed to fetch problematic words');
      }
      const problematicData = await problematicResponse.json();
      setProblematicWords(problematicData);
    } catch (error) {
      console.error('Error fetching history data:', error);
      setError('Failed to fetch history data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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

  if (!historyData) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No history data available yet. Complete some tests to see your progress.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Learning History
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
      >
        <Tab label="Overview" />
        <Tab label="Accuracy Trends" />
        <Tab label="Problematic Words" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Tests
                </Typography>
                <Typography variant="h3">
                  {historyData.total_tests}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average Accuracy
                </Typography>
                <Typography variant="h3">
                  {historyData.average_accuracy.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Words Mastered
                </Typography>
                <Typography variant="h3">
                  {historyData.words_mastered}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Words Tested</TableCell>
                      <TableCell>Correct</TableCell>
                      <TableCell>Accuracy</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyData.recent_activity.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                        <TableCell>{activity.words_tested}</TableCell>
                        <TableCell>{activity.correct}</TableCell>
                        <TableCell>{activity.accuracy.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Box>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Accuracy Over Time
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={historyData.accuracy_trend}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy %" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Words Tested Per Day
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={historyData.words_per_day}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="words" fill="#82ca9d" name="Words Tested" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Words That Need Extra Attention
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              These words have been answered incorrectly multiple times and may need extra practice.
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Word</TableCell>
                    <TableCell>Group</TableCell>
                    <TableCell>Incorrect Count</TableCell>
                    <TableCell>Last Tested</TableCell>
                    <TableCell>Accuracy</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {problematicWords.map((word) => (
                    <TableRow key={word.id}>
                      <TableCell>{word.word}</TableCell>
                      <TableCell>{word.group}</TableCell>
                      <TableCell>{word.incorrect_count}</TableCell>
                      <TableCell>{new Date(word.last_tested).toLocaleDateString()}</TableCell>
                      <TableCell>{word.accuracy.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                  {problematicWords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No problematic words found. Great job!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default History; 