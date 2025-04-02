import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
} from '@mui/material';

function Navigation() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          GRE Words App
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation; 