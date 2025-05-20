import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Provides custom matchers like toBeInTheDocument()
import SummaryToggle from '../SummaryToggle';

// Mock any external dependencies if required
jest.mock('../RequestService', () => ({
  getUserSummaries: jest.fn(),
}));

describe('SummaryToggle Component', () => {
  let mockToggleChange;

  beforeEach(() => {
    mockToggleChange = jest.fn();
  });

  test('renders SummaryToggle with default state', () => {
    render(<SummaryToggle onToggleChange={mockToggleChange} />);

    // Verify buttons are rendered
    expect(screen.getByRole('button', { name: /my summaries/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shared summaries/i })).toBeInTheDocument();

    // Verify default state
    expect(screen.getByRole('button', { name: /my summaries/i })).not.toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /shared summaries/i })).not.toHaveAttribute('aria-pressed', 'true');
  });

  test('calls onToggleChange when toggled to "My Summaries"', () => {
    render(<SummaryToggle onToggleChange={mockToggleChange} />);

    const mySummariesButton = screen.getByRole('button', { name: /my summaries/i });

    // Trigger the toggle action
    fireEvent.click(mySummariesButton);

    // Ensure callback is fired
    expect(mockToggleChange).toHaveBeenCalledWith('my-summaries');

    // Verify button states
    expect(mySummariesButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('calls onToggleChange when toggled to "Shared Summaries"', () => {
    render(<SummaryToggle onToggleChange={mockToggleChange} />);

    const sharedSummariesButton = screen.getByRole('button', { name: /shared summaries/i });

    // Trigger the toggle action
    fireEvent.click(sharedSummariesButton);

    // Ensure callback is fired
    expect(mockToggleChange).toHaveBeenCalledWith('shared-summaries');

    // Verify button states
    expect(sharedSummariesButton).toHaveAttribute('aria-pressed', 'false');
  });


  test('matches snapshot for default state', () => {
    const { container } = render(<SummaryToggle onToggleChange={mockToggleChange} />);
    expect(container).toMatchSnapshot();
  });

  test('matches snapshot for toggled state', () => {
    const { container } = render(<SummaryToggle onToggleChange={mockToggleChange} />);

    const mySummariesButton = screen.getByRole('button', { name: /my summaries/i });
    fireEvent.click(mySummariesButton);

    expect(container).toMatchSnapshot();
  });
});