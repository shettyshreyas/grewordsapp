import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import config from '../config';

const BackendSelector = ({ selectedBackend, onBackendChange }) => {
  return (
    <Box sx={{ minWidth: 200, mb: 2 }}>
      <FormControl fullWidth>
        <InputLabel>Backend Server</InputLabel>
        <Select
          value={selectedBackend}
          label="Backend Server"
          onChange={(e) => onBackendChange(e.target.value)}
        >
          {Object.entries(config.backends).map(([key, url]) => (
            <MenuItem key={key} value={key}>
              {key.charAt(0).toUpperCase() + key.slice(1)} ({url})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default BackendSelector; 