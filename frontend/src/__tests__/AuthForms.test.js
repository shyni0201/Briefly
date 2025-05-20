import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import AuthForms from '../AuthForms';
import { useAuth } from '../App';

// Mock `useAuth` from the App context
jest.mock('../App', () => ({
  useAuth: jest.fn(),
}));

describe('AuthForms Component', () => {
  const mockLogin = jest.fn();
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      isAuthenticated: false,
      error: null,
    });
  });

  test('renders login form by default', () => {
    render(
      <Router>
        <AuthForms />
      </Router>
    );

    expect(screen.getByRole('heading', { name: /briefly/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
        screen.getByLabelText(/password/i, { selector: 'input[name="password"]' })
      ).toBeInTheDocument();
  });

  test('switches to register form when toggled', () => {
    render(
      <Router>
        <AuthForms />
      </Router>
    );

    const toggleButton = screen.getByRole('button', { name: /don't have an account\? sign up/i });
    fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    // expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });

  test('validates email and password during login', async () => {
    render(
      <Router>
        <AuthForms />
      </Router>
    );

    const loginButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(loginButton);

    await waitFor(() =>
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    );
  });

  test('calls login function with correct credentials', async () => {
    render(
      <Router>
        <AuthForms />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change( screen.getByLabelText(/password/i, { selector: 'input[name="password"]' }), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password123!')
    );
  });

  test('calls register function with correct details', async () => {
    render(
      <Router>
        <AuthForms />
      </Router>
    );

    fireEvent.click(screen.getByRole('button', { name: /don't have an account\? sign up/i }));
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john.doe@example.com' } });
    fireEvent.change( screen.getByLabelText(/password/i, { selector: 'input[name="password"]' }), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123!' },
    });
     // Handle PhoneInput
     const phoneInput = document.querySelector('.phone-input'); // Use the class name assigned to PhoneInput
     fireEvent.change(phoneInput, { target: { value: '1234567890' } });


    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '+1234567890',
      })
    );
  });

  test('displays error when passwords do not match during registration', async () => {
    render(
      <Router>
        <AuthForms />
      </Router>
    );

    fireEvent.click(screen.getByRole('button', { name: /don't have an account\? sign up/i }));
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input[name="password"]' }), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    );
  });

  test('shows loading spinner while submitting form', () => {
    useAuth.mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      isAuthenticated: false,
      error: null,
      loading: true,
    });

    render(
      <Router>
        <AuthForms />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input[name="password"]' }), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message from auth context', async () => {
    useAuth.mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      isLogin: false,
      error: 'Authentication failed',
    });
  
    render(
      <Router>
        <AuthForms />
      </Router>
    );
  
    screen.debug();
  });
});
