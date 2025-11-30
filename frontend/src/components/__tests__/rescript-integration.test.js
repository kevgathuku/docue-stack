/**
 * Integration test for ReScript components
 * Verifies that ReScript components can be imported and rendered
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import TestReScript from '../TestReScript.res.js';

describe('ReScript Integration', () => {
  it('should render ReScript component', () => {
    render(<TestReScript />);

    expect(screen.getByText(/ReScript Test Component/i)).toBeInTheDocument();
    expect(screen.getByText(/Count: 0/i)).toBeInTheDocument();
    expect(screen.getByText(/ReScript compilation working!/i)).toBeInTheDocument();
  });

  it('should handle state updates', () => {
    render(<TestReScript />);

    const button = screen.getByRole('button', { name: /increment/i });

    // Initial state
    expect(screen.getByText(/Count: 0/i)).toBeInTheDocument();

    // Click button
    fireEvent.click(button);

    // State should update
    expect(screen.getByText(/Count: 1/i)).toBeInTheDocument();

    // Click again
    fireEvent.click(button);
    expect(screen.getByText(/Count: 2/i)).toBeInTheDocument();
  });
});
