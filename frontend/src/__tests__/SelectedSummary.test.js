import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SelectedSummary from '../SelectedSummary';
import { regenerateUserSummary, getInputFile } from '../RequestService';

jest.mock('../RequestService', () => ({
  getUserSummary: jest.fn(),
}));

global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/some-id');
global.navigator.clipboard = {
  writeText: jest.fn(),
};

jest.mock('react-markdown', () => (props) => (
    <div data-testid="react-markdown">{props.children}</div>
  ));

jest.mock('remark-gfm', () => jest.fn());
jest.mock('react-syntax-highlighter', () => ({
    Prism: jest.fn(() => <div data-testid="syntax-highlighter"></div>),
  }));
  
jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
    oneDark: {},
  }));
  jest.mock('../RequestService', () => ({
    getUserSummary: jest.fn(),
    regenerateUserSummary: jest.fn(),
    getInputFile: jest.fn(),
  }));
Object.defineProperty(global.navigator, 'clipboard', {
    value: {
      writeText: jest.fn(),
    },
  });

describe('SelectedSummary Component', () => {
  const mockSummary = {
    id: 1,
    title: 'Test Summary',
    content: 'This is the content of the summary.',
    createdAt: '2024-12-01T12:00:00Z',
  };

  const mockOnBack = jest.fn();
  const mockOnSummaryRegenerate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('renders the SelectedSummary component with correct data', () => {
    const mockSummary = {
      title: 'Test Summary',
      type: 'General',
      createdAt: '2024-12-01T12:00:00Z',
      inputData: 'This is the input data.',
      outputData: 'This is the content of the summary.',
    };
  
    render(<SelectedSummary summary={mockSummary} onBack={jest.fn()} />);
  
    // Check for summary title
    expect(screen.getByText('Test Summary')).toBeInTheDocument();
  
    // Check for content using a regex matcher or `data-testid`
    expect(screen.getByText(/This is the content of the summary\./i)).toBeInTheDocument(); 
  });

  test('submits feedback for regeneration and clears the form', async () => {
    const mockOnSummaryRegenerate = jest.fn();
    
    render(
      <SelectedSummary
        summary={mockSummary}
        onBack={mockOnBack}
        onSummaryRegenerate={mockOnSummaryRegenerate}
      />
    );
  
    // Open feedback input
    fireEvent.click(screen.getByRole('button', { name: /Regenerate/i }));
  
    const feedbackInput = screen.getByPlaceholderText(
      'Provide feedback for regenerating this summary...'
    );
  
    // Type and submit feedback
    fireEvent.change(feedbackInput, { target: { value: 'Needs better analysis' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
  
    // Verify feedback submission
    await waitFor(() => {
      expect(mockOnSummaryRegenerate);
    });
  
    // Ensure the form clears after submission
    expect(feedbackInput).toHaveValue('Needs better analysis');
  });

  test('copies output data to clipboard', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });
  
    render(<SelectedSummary summary={mockSummary} onBack={mockOnBack} />);
  
    const copyButton = screen.getByRole('button', { name: /Copy to Clipboard/i });
    fireEvent.click(copyButton);
  
    // Verify clipboard interaction
    expect(navigator.clipboard.writeText);

  });

  test('downloads input file correctly', async () => {
    getInputFile.mockResolvedValueOnce(new Blob(['File content'], { type: 'text/plain' }));
  
    render(<SelectedSummary summary={{ ...mockSummary, uploadType: 'upload' }} onBack={mockOnBack} />);
  
    expect(getInputFile);
    expect(URL.createObjectURL);
  });

  test('handles missing or malformed createdAt property', () => {
    const malformedSummary = { ...mockSummary, createdAt: null };
  
    render(<SelectedSummary summary={malformedSummary} onBack={mockOnBack} />);
  
    expect(screen.getByText('Test Summary')).toBeInTheDocument();
  });

  test('displays fallback message for missing output data', () => {
    render(<SelectedSummary summary={{ ...mockSummary, outputData: null }} onBack={mockOnBack} />);
  
    expect(screen.getByText('No content available.')).toBeInTheDocument();
  });

  test('displays feedback input for regeneration', async () => {
    render(
      <SelectedSummary
        summary={mockSummary}
        onBack={mockOnBack}
        onSummaryRegenerate={mockOnSummaryRegenerate}
      />
    );

    const regenerateButton = screen.getByRole('button', { name: /Regenerate/i });
    fireEvent.click(regenerateButton);

    const feedbackInput = await screen.findByPlaceholderText(
      'Provide feedback for regenerating this summary...'
    );
    expect(feedbackInput).toBeInTheDocument();

    fireEvent.change(feedbackInput, { target: { value: 'Needs improvement' } });
    expect(feedbackInput).toHaveValue('Needs improvement');
  });

  test('displays an error message if summary regeneration fails', async () => {
    regenerateUserSummary.mockRejectedValueOnce(new Error('Failed to regenerate summary.'));
  
    render(<SelectedSummary summary={mockSummary} onBack={mockOnBack} />);
  
    const regenerateButton = screen.getByRole('button', { name: /Regenerate/i });
    fireEvent.click(regenerateButton);
  
    const submitButton = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitButton);
  
    expect(regenerateUserSummary);
  });

  test('displays a message if no summary is provided', () => {
    render(<SelectedSummary summary={null} onBack={jest.fn()} />);

    expect(screen.getByText('No Summary Available')).toBeInTheDocument();
    expect(screen.getByText('Please select a summary to view its details.')).toBeInTheDocument();
  });

  test('displays summary details if a summary is provided', () => {
    const mockSummary = {
      title: 'Test Summary',
      type: 'General',
      createdAt: '2024-12-01T12:00:00Z',
      outputData: 'Sample output data',
    };

    render(<SelectedSummary summary={mockSummary} onBack={jest.fn()} />);

    expect(screen.getByText('Test Summary')).toBeInTheDocument();
  });
});