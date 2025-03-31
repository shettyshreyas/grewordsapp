import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Navigation from './components/Navigation';
import Home from './components/Home';
import Test from './components/Test';
import Stats from './components/Stats';
import Upload from './components/Upload';
import Words from './components/Words';
import { Tab, Tabs } from '@mui/material';

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

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation />
          <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              centered
              sx={{ mb: 4 }}
            >
              <Tab label="Home" />
              <Tab label="Test" />
              <Tab label="Upload" />
              <Tab label="Words" />
            </Tabs>

            {currentTab === 0 && <Home />}
            {currentTab === 1 && <Test />}
            {currentTab === 2 && <Upload />}
            {currentTab === 3 && <Words />}
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
