import React from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import config from '../config';

const Settings = ({ selectedBackend, onBackendChange }) => {
  const handleBackendChange = (event) => {
    onBackendChange(event.target.value);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Backend Configuration
        </Typography>
        
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="backend-select-label">Backend Server</InputLabel>
          <Select
            labelId="backend-select-label"
            id="backend-select"
            value={selectedBackend}
            label="Backend Server"
            onChange={handleBackendChange}
          >
            {Object.entries(config.backends).map(([key, value]) => (
              <MenuItem key={key} value={key}>
                {key} ({value})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
    </Box>
  );
};

export default Settings; 