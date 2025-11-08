import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Skeleton,
  Grid,
  Card,
  CardContent
} from '@mui/material';

/**
 * Reusable loading state components
 */

// Full page loading
export const PageLoading = ({ message = 'Loading...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 2
    }}
  >
    <CircularProgress size={60} />
    <Typography variant="h6" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Inline loading
export const InlineLoading = ({ size = 24 }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <CircularProgress size={size} />
    <Typography variant="body2" color="text.secondary">
      Loading...
    </Typography>
  </Box>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="rectangular" height={40} sx={{ flex: 1 }} />
        ))}
      </Box>
    ))}
  </Box>
);

// Card skeleton
export const CardSkeleton = ({ count = 4 }) => (
  <Grid container spacing={3}>
    {Array.from({ length: count }).map((_, index) => (
      <Grid item xs={12} sm={6} md={3} key={index}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="60%" height={30} />
            <Skeleton variant="text" width="40%" height={50} sx={{ mt: 2 }} />
            <Skeleton variant="rectangular" height={20} sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

// Chart skeleton
export const ChartSkeleton = ({ height = 300 }) => (
  <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
);

// List skeleton
export const ListSkeleton = ({ items = 5 }) => (
  <Box>
    {Array.from({ length: items }).map((_, index) => (
      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="40%" />
        </Box>
      </Box>
    ))}
  </Box>
);

// Button loading
export const ButtonLoading = () => (
  <CircularProgress size={20} color="inherit" />
);

export default {
  PageLoading,
  InlineLoading,
  TableSkeleton,
  CardSkeleton,
  ChartSkeleton,
  ListSkeleton,
  ButtonLoading
};

