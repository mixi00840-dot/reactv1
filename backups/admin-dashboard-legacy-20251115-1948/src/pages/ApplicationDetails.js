import React from 'react';
import { Typography, Box } from '@mui/material';

function ApplicationDetails() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Application Details
      </Typography>
      <Typography>
        This page will show detailed seller application information with document preview.
      </Typography>
    </Box>
  );
}

export default ApplicationDetails;
