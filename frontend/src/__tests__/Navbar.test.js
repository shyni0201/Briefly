import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';
import Navbar from '../Navbar';
import { useAuth } from '../App';

// Mock `useAuth` for authentication context
jest.mock('../App', () => ({
  useAuth: jest.fn(),
}));

describe('Navbar Component', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUseAuth = (isAuthenticated = false) => {
    useAuth.mockReturnValue({
      isAuthenticated,
      userData: { id: 'user-id', email: 'test@example.com' },
      logout: mockLogout,
    });
  };
 
  test('renders the navbar with links when unauthenticated', () => {
    mockUseAuth(false);

    render(
      <Router>
        <Navbar />
      </Router>
    );

    // Query links by accessible role
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  
  }); 


  test('renders the navbar with links and logout button when authenticated', () => {
    mockUseAuth(true);

    render(
      <Router>
        <Navbar />
      </Router>
    );

    // Check user-specific links
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  test('calls logout function when logout button is clicked', () => {
    mockUseAuth(true);

    render(
      <Router>
        <Navbar />
      </Router>
    );

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  }); 

  test('navigates to home page when logo is clicked', () => {
    mockUseAuth(false);

    render(
      <Router>
        <Navbar />
      </Router>
    );

    const logo = screen.getByText('Briefly');
    fireEvent.click(logo);

    expect(window.location.pathname).toBe('/');
  });

  test('displays the correct navigation links based on authentication state', () => {
    mockUseAuth(false);
  
    render(
      <Router>
        <Navbar />
      </Router>
    );
  
    // Ensure Dashboard is not visible for unauthenticated users
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  test('renders responsive navbar for small screens', () => {
    mockUseAuth(false);
  
    // Simulate a small screen
    window.innerWidth = 500;
  
    render(
      <Router>
        <Navbar />
      </Router>
    );
  
    // Query for the mobile menu or other responsive elements
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  test('navbar has accessible elements', () => {
    mockUseAuth(true);
  
    render(
      <Router>
        <Navbar />
      </Router>
    );
  
    // Check for accessibility roles and labels
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toHaveAttribute('aria-label', 'Logout');
  });
});