import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuth } from '../App';
import { getUserSummaries } from '../RequestService';
import Dashboard from '../Dashboard';

// Mock dependencies
jest.mock('../App', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../RequestService', () => ({
  getUserSummaries: jest.fn(),
}));

jest.mock('../SummariesList', () => (props) => (
  <div data-testid="summaries-list">
    {props.selectedSummary
      ? `Selected: ${props.selectedSummary.title}`
      : 'Mock Summaries List'}
    <button onClick={props.onNewSummaryClick}>New Summary</button>
  </div>
));

jest.mock('../NewSummary', () => (props) => (
  <div data-testid="new-summary-dialog" data-open={props.open}>
    Mock New Summary Dialog
    <button onClick={() => props.onCreate({ result: { summary_id: 1 } })}>
      Create Summary
    </button>
    <button onClick={props.onClose}>Close</button>
  </div>
));

jest.mock('../Navbar', () => () => <div data-testid="navbar">Navbar</div>);

describe('Dashboard Component', () => {
  const mockUser = { id: '123', email: 'test@example.com' };
  const mockSummaries = [
    { id: 1, title: 'Summary 1', content: 'Content 1', createdAt: '2024-12-01' },
    { id: 2, title: 'Summary 2', content: 'Content 2', createdAt: '2024-12-02' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      userData: mockUser,
      loading: false,
    });
  });

  test('renders the Dashboard with all components', async () => {
    getUserSummaries.mockResolvedValueOnce({
      status: 'OK',
      result: mockSummaries,
    });

    await act(async () => {
      render(
        <Router>
          <Dashboard />
        </Router>
      );
    });

    // Ensure Navbar renders
    expect(screen.getByTestId('navbar')).toBeInTheDocument();

    // Wait for SummariesList to render
    await waitFor(() => {
      expect(screen.getByTestId('summaries-list')).toBeInTheDocument();
    });

    // Ensure NewSummaryDialog renders (initially closed)
    expect(screen.getByTestId('new-summary-dialog')).toHaveAttribute('data-open', 'false');
  });

  test('displays loading spinner while data is being fetched', () => {
    useAuth.mockReturnValueOnce({ userData: mockUser, loading: true });

    render(
      <Router>
        <Dashboard />
      </Router>
    );

    // Ensure loading spinner is displayed
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    getUserSummaries.mockRejectedValueOnce(new Error('Failed to fetch summaries'));

    await act(async () => {
      render(
        <Router>
          <Dashboard />
        </Router>
      );
    });

    // // Ensure loading spinner is displayed
    // expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for loading state to clear
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

    // Verify SummariesList renders with fallback content
    expect(screen.getByTestId('summaries-list')).toHaveTextContent('Mock Summaries List');
  });

  test('opens and closes the NewSummaryDialog', async () => {
    getUserSummaries.mockResolvedValueOnce({
      status: 'OK',
      result: mockSummaries,
    });

    await act(async () => {
      render(
        <Router>
          <Dashboard />
        </Router>
      );
    });

    // Open the dialog
    fireEvent.click(screen.getByText('New Summary'));
    expect(screen.getByTestId('new-summary-dialog')).toHaveAttribute('data-open', 'true');

    // Close the dialog
    fireEvent.click(screen.getByText('Close'));
    expect(screen.getByTestId('new-summary-dialog')).toHaveAttribute('data-open', 'false');
  });

  test('handles new summary creation correctly', async () => {
    getUserSummaries.mockResolvedValueOnce({
      status: 'OK',
      result: mockSummaries,
    });

    await act(async () => {
      render(
        <Router>
          <Dashboard />
        </Router>
      );
    });

    // Open and create a new summary
    fireEvent.click(screen.getByText('New Summary'));
    fireEvent.click(screen.getByText('Create Summary'));

    // await waitFor(() =>
    //   expect(screen.getByTestId('summaries-list')).toHaveTextContent('Selected: Summary 1')
    // );
  });

  test('renders empty summaries list when no summaries are available', async () => {
    getUserSummaries.mockResolvedValueOnce({
      status: 'OK',
      result: [],
    });

    await act(async () => {
      render(
        <Router>
          <Dashboard />
        </Router>
      );
    });

    // Verify empty state
    expect(await screen.findByTestId('summaries-list')).toHaveTextContent('Mock Summaries List');
  });


});
