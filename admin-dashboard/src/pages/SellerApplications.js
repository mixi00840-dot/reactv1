import React from 'react';
import { Typography, Box } from '@mui/material';

function SellerApplications() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Seller Applications
      </Typography>
      <Typography>
        This page will show all seller applications with approval/rejection capabilities.
      </Typography>
    </Box>
  );
}

export default SellerApplications;