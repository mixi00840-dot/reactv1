import React from 'react';
import { Box, Button, Typography, Card, CardContent, Alert } from '@mui/material';
import { RefreshOutlined, BugReport } from '@mui/icons-material';

/**
 * Enhanced Error Boundary with better UX
 * Catches React errors and displays user-friendly messages
 */
class ErrorBoundaryEnhanced extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('🚨 Error Boundary Caught:', error);
    console.error('Component Stack:', errorInfo.componentStack);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // TODO: Send to error tracking service (Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message?.includes('Network Error') ||
                            this.state.error?.message?.includes('401') ||
                            this.state.error?.message?.includes('404') ||
                            this.state.error?.message?.includes('500');

      const isDataError = this.state.error?.message?.includes('undefined') ||
                         this.state.error?.message?.includes('null') ||
                         this.state.error?.message?.includes('Cannot read');

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            p: 3
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Box textAlign="center" mb={3}>
                <BugReport sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom fontWeight="bold">
                  Something went wrong
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {isNetworkError && 'There was a problem connecting to the server. Please check your internet connection and try again.'}
                  {isDataError && 'We encountered an error while loading this page. The data might be missing or in an unexpected format.'}
                  {!isNetworkError && !isDataError && 'An unexpected error occurred. Our team has been notified.'}
                </Typography>
              </Box>

              {process.env.NODE_ENV === 'development' && (
                <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Error Details (Development Mode):
                  </Typography>
                  <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.error?.toString()}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Alert>
              )}

              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<RefreshOutlined />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleGoHome}
                >
                  Go to Dashboard
                </Button>
              </Box>

              {this.state.errorCount > 3 && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  This error has occurred {this.state.errorCount} times. 
                  Please contact support if the problem persists.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryEnhanced;

