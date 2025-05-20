import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';

jest.mock('remark-gfm', () => jest.fn());

jest.mock('react-syntax-highlighter', () => ({
  Prism: jest.fn(() => <div data-testid="syntax-highlighter"></div>),
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {},
}));

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('react-markdown', () => (props) => (
  <div data-testid="react-markdown">{props.children}</div>
));

jest.mock('../App', () => () => <div>Mocked App</div>);

describe('index.js', () => {
  let root;

  beforeEach(() => {
    // Set up a mock DOM for the root element
    document.body.innerHTML = '<div id="root"></div>';
    root = document.getElementById('root');
    jest.clearAllMocks();
  });

  it('renders the App component without crashing', () => {
    // Mock the root element
    const root = document.createElement('div');
    root.id= 'root';
    document.body.appendChild(root);
  
    // Set up spies
    const createRootSpy = jest.spyOn(ReactDOM, 'createRoot');
    const mockRender = jest.fn();
    createRootSpy.mockReturnValue({ render: mockRender });
  
    // Trigger the index.js logic
    require('../index');
  
    // Assert `createRoot` was called with the correct element
    expect(createRootSpy).toHaveBeenCalledWith(root);
  
    // Assert `render` was called with the expected component tree
    expect(mockRender).toHaveBeenCalledWith(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });

});