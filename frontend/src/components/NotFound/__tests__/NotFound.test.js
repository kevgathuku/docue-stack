/**
 * Tests for NotFound ReScript component
 * 
 * Requirements tested:
 * - 7.1: NotFound page displays "Not Found" message
 * - 7.2: Error page shows user-friendly explanatory text
 * - 7.3: Component uses consistent styling with the application
 * - 11.1: Unit tests for rendering
 * - 12.1: CSS classes match original Elm version
 */

import { render, screen } from '@testing-library/react';
import NotFound from '../NotFound.res.js';

describe('NotFound ReScript Component', () => {
  it('renders "Not Found" message', () => {
    render(<NotFound />);
    
    // Check for "Not Found" heading
    const heading = screen.getByRole('heading', { name: /not found/i });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
  });

  it('displays explanatory text', () => {
    render(<NotFound />);
    
    // Check for explanatory message
    const explanatoryText = screen.getByText(/sorry\. this is not the page you were looking for/i);
    expect(explanatoryText).toBeInTheDocument();
    expect(explanatoryText.tagName).toBe('P');
  });

  it('has correct CSS classes matching original Elm version', () => {
    const { container } = render(<NotFound />);
    
    // Check container class
    const containerDiv = container.querySelector('.container');
    expect(containerDiv).toBeInTheDocument();
    
    // Check card-panel class
    const cardPanel = container.querySelector('.card-panel');
    expect(cardPanel).toBeInTheDocument();
    
    // Check row classes
    const rows = container.querySelectorAll('.row');
    expect(rows.length).toBe(2);
    
    // Check heading classes
    const heading = screen.getByRole('heading', { name: /not found/i });
    expect(heading).toHaveClass('header');
    expect(heading).toHaveClass('center-align');
    
    // Check paragraph classes
    const paragraph = screen.getByText(/sorry\. this is not the page you were looking for/i);
    expect(paragraph).toHaveClass('flow-text');
    expect(paragraph).toHaveClass('center-align');
  });

  it('has proper structure with nested divs', () => {
    const { container } = render(<NotFound />);
    
    // Verify the structure: container > card-panel > rows
    const containerDiv = container.querySelector('.container');
    const cardPanel = containerDiv.querySelector('.card-panel');
    expect(cardPanel).toBeInTheDocument();
    
    const rows = cardPanel.querySelectorAll('.row');
    expect(rows.length).toBe(2);
    
    // First row contains the heading
    const firstRow = rows[0];
    const heading = firstRow.querySelector('h2.header.center-align');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Not Found');
    
    // Second row contains the explanatory text
    const secondRow = rows[1];
    const paragraph = secondRow.querySelector('p.flow-text.center-align');
    expect(paragraph).toBeInTheDocument();
    expect(paragraph).toHaveTextContent('Sorry. This is not the page you were looking for');
  });

  it('renders without requiring props or external data', () => {
    // This test verifies the component is purely static
    // No props needed, no API calls, no state management
    const { container } = render(<NotFound />);
    
    // Component should render successfully
    expect(container.querySelector('.container')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /not found/i })).toBeInTheDocument();
  });

  it('uses consistent Materialize CSS styling', () => {
    const { container } = render(<NotFound />);
    
    // Verify Materialize CSS classes are used
    expect(container.querySelector('.card-panel')).toBeInTheDocument();
    expect(container.querySelector('.flow-text')).toBeInTheDocument();
    expect(container.querySelector('.center-align')).toBeInTheDocument();
    
    // Verify the component follows Materialize grid system
    const rows = container.querySelectorAll('.row');
    expect(rows.length).toBeGreaterThan(0);
  });
});
