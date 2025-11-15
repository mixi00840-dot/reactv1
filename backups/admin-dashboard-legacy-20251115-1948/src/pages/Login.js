import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
// MongoDB Migration - Use MongoDB auth instead of Firebase
import { useAuth } from '../contexts/AuthContextMongoDB';

function Login() {
  const { login, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setError('');
    // MongoDB uses 'identifier' instead of separate login field
    const result = await login(data.login, data.password);
    if (!result.success) {
      setError(result.message || 'Invalid credentials or insufficient privileges');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={3}>
              <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Mixillo Admin
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to access the admin dashboard (MongoDB)
              </Typography>
              <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>
                ✅ Now using MongoDB + JWT Authentication
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Email or Username"
                margin="normal"
                variant="outlined"
                {...register('login', {
                  required: 'Email or username is required',
                })}
                error={!!errors.login}
                helperText={errors.login?.message}
                autoComplete="username"
                autoFocus
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                variant="outlined"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        edge="end"
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>

            <Box mt={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Admin access only. Contact support if you need assistance.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Login;
