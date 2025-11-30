/**
 * Test for ReScript test component
 * Verifies ReScript compilation and React integration
 */

import { fireEvent, render, screen } from '@testing-library/react';
import TestReScript from '../TestReScript.res.js';

describe('TestReScript Component', () => {
  it('renders the component', () => {
    render(<TestReScript />);
    expect(screen.getByText(/ReScript Test Component/i)).toBeInTheDocument();
  });

  it('displays initial count', () => {
    render(<TestReScript />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('increments count on button click', () => {
    render(<TestReScript />);
    const button = screen.getByText('Increment');

    fireEvent.click(button);
    expect(screen.getByText('Count: 1')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText('Count: 2')).toBeInTheDocument();
  });

  it('shows compilation success message', () => {
    render(<TestReScript />);
    expect(screen.getByText('✓ ReScript compilation working!')).toBeInTheDocument();
  });

  it('shows HMR success message', () => {
    render(<TestReScript />);
    expect(screen.getByText('✓ Hot Module Replacement working!')).toBeInTheDocument();
  });
});
