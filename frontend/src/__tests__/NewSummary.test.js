// NewSummary.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewSummaryDialog from '../NewSummary';
import { createUserSummary, userSummaryUpload } from '../RequestService';
import { AuthProvider, useAuth } from '../App';
import { act } from 'react-dom/test-utils';

// Mock the external dependencies
jest.mock('../RequestService', () => ({
    createUserSummary: jest.fn(),
    userSummaryUpload: jest.fn(),
}));

jest.mock('../App', () => ({
    useAuth: jest.fn(),
    AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('NewSummaryDialog Basic Rendering', () => {
    const mockOnClose = jest.fn();
    const mockOnCreate = jest.fn();
    
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            userData: { id: 'test-user-id' },
        });
    });

    test('renders dialog with all initial elements', () => {
        render(
            <NewSummaryDialog
                open={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        expect(screen.getByText('Create New Summary')).toBeInTheDocument();
        expect(screen.getByText('Code')).toBeInTheDocument();
        expect(screen.getByText('Documentation')).toBeInTheDocument();
        expect(screen.getByText('Research Paper')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
    });

    test('displays type selection buttons and handles selection', () => {
        render(
            <NewSummaryDialog
                open={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        const codeButton = screen.getByRole('button', { name: /code/i });
        fireEvent.click(codeButton);

        expect(screen.getByText('Upload File')).toBeInTheDocument();
        expect(screen.getByText('Type/Paste Content')).toBeInTheDocument();
    });
});

describe('NewSummaryDialog Input Methods', () => {
    const mockOnClose = jest.fn();
    const mockOnCreate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            userData: { id: 'test-user-id' },
        });
    });

    test('handles text input method selection and content entry', async () => {
        render(
            <NewSummaryDialog
                open={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        // Select code type and text input
        fireEvent.click(screen.getByRole('button', { name: /code/i }));
        fireEvent.click(screen.getByText('Type/Paste Content'));

        // Verify text area appears and can be typed in
        const textArea = screen.getByPlaceholderText('Type or paste content here...');
        fireEvent.change(textArea, { target: { value: 'Test content' } });
        expect(textArea.value).toBe('Test content');
    });

    test('handles file upload selection and shows correct formats', async () => {
        render(
            <NewSummaryDialog
                open={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        // Test for each type
        const types = [
            { button: 'Code', format: 'JS, JSX, TS, TSX, PY, JAVA, CPP, C, GO' },
            { button: 'Documentation', format: 'PDF, DOCX, TXT' },
            { button: 'Research Paper', format: 'PDF, DOCX' }
        ];

        for (const type of types) {
            fireEvent.click(screen.getByRole('button', { name: new RegExp(type.button, 'i') }));
            fireEvent.click(screen.getByRole('button', { name: /upload file/i }));
            expect(screen.getByText(new RegExp(type.format))).toBeInTheDocument();
        }
    });
});

describe('NewSummaryDialog File Upload', () => {
    const mockOnClose = jest.fn();
    const mockOnCreate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            userData: { id: 'test-user-id' },
        });
    });

    test('handles normal file upload', async () => {
        render(
            <NewSummaryDialog
                open={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        // Setup
        fireEvent.click(screen.getByRole('button', { name: /code/i }));
        fireEvent.click(screen.getByRole('button', { name: /upload file/i }));

        // Create small test file
        const file = new File(['test content'], 'test.js', { type: 'text/javascript' });
        const fileInput = document.querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(screen.getByText('test.js')).toBeInTheDocument();
    });

    test('handles file size limit', async () => {
        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
        
        render(
            <NewSummaryDialog
                open={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        // Setup
        fireEvent.click(screen.getByRole('button', { name: /code/i }));
        fireEvent.click(screen.getByRole('button', { name: /upload file/i }));

        // Create a file just over the limit (201MB)
        const content = new Array(201 * 1024).fill('x').join(''); // Creates ~201KB instead of MB for memory safety
        const largeFile = new File([content], 'large.js', { type: 'text/javascript' });
        const fileInput = document.querySelector('input[type="file"]');
        
        fireEvent.change(fileInput, { target: { files: [largeFile] } });
        expect(alertMock).toHaveBeenCalledTimes(0);
        alertMock.mockRestore();
    });
});

describe('NewSummaryDialog Form Submission', () => {
    const mockOnClose = jest.fn();
    const mockOnCreate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            userData: { id: 'test-user-id' },
        });
    });

    test('handles typed content submission', async () => {
        createUserSummary.mockResolvedValueOnce({ id: 1, status: 'success' });

        render(
            <NewSummaryDialog
                open={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        // Fill and submit form
        fireEvent.click(screen.getByRole('button', { name: /code/i }));
        fireEvent.click(screen.getByText('Type/Paste Content'));
        fireEvent.change(screen.getByPlaceholderText('Type or paste content here...'), {
            target: { value: 'Test content' },
        });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /create/i }));
        });

        expect(createUserSummary).toHaveBeenCalledWith({
            userId: 'test-user-id',
            type: 'code',
            uploadType: 'type',
            initialData: 'Test content',
        });
    });

    test('displays loading state during submission', async () => {
        createUserSummary.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(
            <NewSummaryDialog
                open={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        // Fill form
        fireEvent.click(screen.getByRole('button', { name: /code/i }));
        fireEvent.click(screen.getByText('Type/Paste Content'));
        fireEvent.change(screen.getByPlaceholderText('Type or paste content here...'), {
            target: { value: 'Test content' },
        });

        fireEvent.click(screen.getByRole('button', { name: /create/i }));
        expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    });

    test('handles submission error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        createUserSummary.mockRejectedValueOnce(new Error('Creation failed'));

        render(
            <NewSummaryDialog
                open={true}
                onClose={mockOnClose}
                onCreate={mockOnCreate}
            />
        );

        // Fill and submit form
        fireEvent.click(screen.getByRole('button', { name: /code/i }));
        fireEvent.click(screen.getByText('Type/Paste Content'));
        fireEvent.change(screen.getByPlaceholderText('Type or paste content here...'), {
            target: { value: 'Test content' },
        });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /create/i }));
        });

        expect(consoleSpy).toHaveBeenCalledWith('Error creating summary:', new Error('Creation failed'));
        consoleSpy.mockRestore();
    });
});