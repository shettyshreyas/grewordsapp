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
import config from '../config';

const History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [problematicWords, setProblematicWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const { apiUrl } = config;

  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/history`);
        if (!response.ok) {
          throw new Error('Failed to fetch history data');
        }
        const data = await response.json();
        setHistoryData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, [apiUrl]);

  useEffect(() => {
    const fetchProblematicWords = async () => {
      if (selectedTab === 2) { // Only fetch when Problematic Words tab is selected
        try {
          setLoading(true);
          const response = await fetch(`${apiUrl}/api/problematic-words`);
          if (!response.ok) {
            throw new Error('Failed to fetch problematic words');
          }
          const data = await response.json();
          setProblematicWords(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProblematicWords();
  }, [apiUrl, selectedTab]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
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
        value={selectedTab}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
      >
        <Tab label="Overview" />
        <Tab label="Accuracy Trends" />
        <Tab label="Problematic Words" />
      </Tabs>

      {selectedTab === 0 && (
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

      {selectedTab === 1 && (
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

      {selectedTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Words Needing Review
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
                    <TableCell>
                      {word.last_tested ? new Date(word.last_tested).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>{word.accuracy.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default History; 