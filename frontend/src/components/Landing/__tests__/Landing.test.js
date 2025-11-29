/**
 * Tests for Landing ReScript component
 * 
 * Requirements tested:
 * - 6.1: Landing page displays hero section with title and CTA
 * - 6.2: "Get Started" button links to authentication page
 * - 6.3: Component renders without external data fetching
 * - 11.1: Unit tests for rendering
 * - 12.1: CSS classes match original Elm version
 */

import { render, screen } from '@testing-library/react';
import Landing from '../Landing.res.js';

describe('Landing ReScript Component', () => {
  it('renders the hero section', () => {
    const { container } = render(<Landing />);
    
    // Check for hero container
    const hero = container.querySelector('#hero');
    expect(hero).toBeInTheDocument();
    
    // Check for hero text container
    const heroTextContainer = container.querySelector('#hero-text-container');
    expect(heroTextContainer).toBeInTheDocument();
    expect(heroTextContainer).toHaveClass('container');
  });

  it('renders the hero title with correct text', () => {
    const { container } = render(<Landing />);
    
    // Check for hero title
    const heroTitle = container.querySelector('#hero-title');
    expect(heroTitle).toBeInTheDocument();
    
    // Check for "Docue" text with bold class
    const boldSpan = heroTitle.querySelector('.bold');
    expect(boldSpan).toBeInTheDocument();
    expect(boldSpan).toHaveTextContent('Docue');
    
    // Check for descriptive text with thin class
    const thinSpans = heroTitle.querySelectorAll('.thin');
    expect(thinSpans).toHaveLength(2);
    expect(thinSpans[0]).toHaveTextContent('is the simplest way for');
    expect(thinSpans[1]).toHaveTextContent('you to manage your documents online');
  });

  it('renders "Get Started" button with correct href', () => {
    render(<Landing />);
    
    // Find the "Get Started" link
    const getStartedButton = screen.getByText('Get Started');
    expect(getStartedButton).toBeInTheDocument();
    
    // Verify it's an anchor tag with correct href
    expect(getStartedButton.tagName).toBe('A');
    expect(getStartedButton).toHaveAttribute('href', '/auth');
  });

  it('has correct CSS classes matching original Elm version', () => {
    const { container } = render(<Landing />);
    
    // Check hero section classes
    const hero = container.querySelector('#hero');
    expect(hero).toBeInTheDocument();
    
    // Check container classes
    const heroContainer = container.querySelector('.container');
    expect(heroContainer).toHaveClass('container');
    expect(heroContainer).toHaveAttribute('id', 'hero-text-container');
    
    // Check row classes
    const rows = container.querySelectorAll('.row');
    expect(rows.length).toBeGreaterThanOrEqual(2);
    
    // Check column classes
    const col = container.querySelector('.col.s12.center-align');
    expect(col).toBeInTheDocument();
    
    // Check button classes
    const button = screen.getByText('Get Started');
    expect(button).toHaveClass('btn');
    expect(button).toHaveClass('btn-large');
    expect(button).toHaveClass('create-list-link');
    expect(button).toHaveClass('hero-btn');
    
    // Check center-align class
    const centerAlign = container.querySelector('.center-align');
    expect(centerAlign).toBeInTheDocument();
  });

  it('renders without requiring external data fetching', () => {
    // This test verifies the component is purely static
    // No props needed, no API calls, no state management
    const { container } = render(<Landing />);
    
    // Component should render successfully
    expect(container.querySelector('#hero')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('has proper structure with nested divs', () => {
    const { container } = render(<Landing />);
    
    // Verify the structure: hero > container > rows > cols
    const hero = container.querySelector('#hero');
    const heroContainer = hero.querySelector('.container#hero-text-container');
    expect(heroContainer).toBeInTheDocument();
    
    const rows = heroContainer.querySelectorAll('.row');
    expect(rows.length).toBe(2);
    
    // First row contains the title
    const firstRow = rows[0];
    const titleCol = firstRow.querySelector('.col.s12.center-align');
    expect(titleCol).toBeInTheDocument();
    expect(titleCol.querySelector('#hero-title')).toBeInTheDocument();
    
    // Second row contains the button
    const secondRow = rows[1];
    const buttonCol = secondRow.querySelector('.col.s12');
    expect(buttonCol).toBeInTheDocument();
    expect(buttonCol.querySelector('.center-align')).toBeInTheDocument();
  });
});
