import React from 'react';
import { Typography, Box } from '@mui/material';

function CreateUser() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create User
      </Typography>
      <Typography>
        This page will allow manual user creation and bulk import via CSV.
      </Typography>
    </Box>
  );
}

export default CreateUser;