/**
 * Entry point for the React application.
 * Renders the root component (`App`) into the DOM.
 * Utilizes React 18's `ReactDOM.createRoot` API for concurrent rendering.
 */
import React from 'react'; // Core React library for building UI components
import ReactDOM from 'react-dom/client'; // ReactDOM for rendering components into the DOM
import './index.css'; // Global CSS styles for the application
import App from './App'; // Root component of the application

/**
 * Creates a root DOM node for rendering the React application.
 * The `#root` element is defined in the `public/index.html` file.
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * Renders the React application using `React.StrictMode`.
 * `React.StrictMode` is a development-only feature that highlights potential problems in the application.
 * The `App` component serves as the root of the component tree.
 */
root.render(
<React.StrictMode>
  <App /> 
</React.StrictMode>
);