import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import App from '../App';

// Mock AuthContext to avoid real network calls and force authenticated state
jest.mock('../contexts/AuthContext', () => {
  const React = require('react');
  const Ctx = React.createContext({ isAuthenticated: true, loading: false, user: { role: 'admin' } });
  return {
    AuthProvider: ({ children }) => <>{children}</>,
    useAuth: () => React.useContext(Ctx)
  };
});

// Silence window.alert during tests
window.alert = () => {};

const renderAt = (path) => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
};

describe('Dashboard route smoke tests', () => {
  const routes = [
    '/',
    '/media-browser',
    '/platform-analytics',
    '/upload-manager',
    '/wallets',
    '/users',
    '/products',
    '/stores',
    '/orders',
    '/coins',
    '/levels',
    '/tags',
    '/explorer',
    '/featured',
  ];

  it.each(routes)("renders route %s without crashing", (route) => {
    const { container } = renderAt(route);
    expect(container).toBeTruthy();
  });
});
