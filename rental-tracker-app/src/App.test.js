import { render, screen } from '@testing-library/react';
// We need to wrap App in BrowserRouter because it now uses Routing
import { BrowserRouter } from 'react-router-dom'; 
import App from './App';

test('renders dashboard heading', () => {
  // Wrap the App component just like in index.js (if applicable) or handle internal routing
  // Since your App.js handles the Router internally, we can just render <App />
  render(<App />);
  
  // Use getAllByText because "RentalTracker" appears in both the header and the sidebar
  // We check that at least one instance exists.
  const linkElements = screen.getAllByText(/RentalTracker/i);
  expect(linkElements[0]).toBeInTheDocument();
});