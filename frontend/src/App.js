import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Navigation from './components/Navigation';
import Home from './components/Home';
import Test from './components/Test';
import Upload from './components/Upload';
import Words from './components/Words';
import History from './components/History';
import FlaggedWords from './components/FlaggedWords';
import Settings from './components/Settings';
import { Tab, Tabs, Typography } from '@mui/material';
import config from './config';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedBackend, setSelectedBackend] = useState(
    localStorage.getItem('selectedBackend') || config.defaultBackend
  );
  const [apiUrl, setApiUrl] = useState(config.backends[selectedBackend]);

  useEffect(() => {
    localStorage.setItem('selectedBackend', selectedBackend);
    setApiUrl(config.backends[selectedBackend]);
  }, [selectedBackend]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleStartTest = (selectedGroups, wordCount) => {
    localStorage.setItem('testData', JSON.stringify({ selectedGroups, wordCount }));
    setCurrentTab(1);
  };

  const handleBackendChange = (newBackend) => {
    setSelectedBackend(newBackend);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navigation />
        <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            GRE Words App
          </Typography>
          
          <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="scrollable auto tabs"
              sx={{ mb: 4 }}
            >
              <Tab label="Home" />
              <Tab label="Test" />
              <Tab label="Upload" />
              <Tab label="Words" />
              <Tab label="History" />
              <Tab label="Flagged Words" />
              <Tab label="Settings" />
            </Tabs>
          </Box>

          {currentTab === 0 && <Home onStartTest={handleStartTest} apiUrl={apiUrl} />}
          {currentTab === 1 && <Test apiUrl={apiUrl} />}
          {currentTab === 2 && <Upload apiUrl={apiUrl} />}
          {currentTab === 3 && <Words apiUrl={apiUrl} />}
          {currentTab === 4 && <History apiUrl={apiUrl} />}
          {currentTab === 5 && <FlaggedWords apiUrl={apiUrl} />}
          {currentTab === 6 && (
            <Settings
              selectedBackend={selectedBackend}
              onBackendChange={handleBackendChange}
            />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
