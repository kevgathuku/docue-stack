'use strict';

import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DocList from '../DocList.jsx';

describe('DocList', function() {
  let mockDocs;

  beforeEach(function() {
    // Mock jQuery tooltip functions
    const tooltipMock = jest.fn();
    window.$ = jest.fn((selector) => ({
      tooltip: tooltipMock,
    }));
    window.$.tooltipMock = tooltipMock;

    mockDocs = [
      {
        _id: 2,
        title: 'Test Document',
        content: 'Hello from the other side',
        dateCreated: '2016-02-15T15:10:34.000Z',
        ownerId: {
          _id: 3,
          name: {
            first: 'Kevin',
            last: 'Gathuku'
          }
        }
      },
      {
        _id: 3,
        title: 'Another Document',
        content: 'More content here',
        dateCreated: '2016-02-16T10:20:30.000Z',
        ownerId: {
          _id: 4,
          name: {
            first: 'Jane',
            last: 'Doe'
          }
        }
      }
    ];
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {component}
      </BrowserRouter>
    );
  };

  describe('Component Rendering', function() {
    it('displays the correct contents', function() {
      renderWithRouter(<DocList docs={mockDocs} />);
      
      // It should find the owner's first name
      expect(screen.getByText(/Kevin/i)).toBeInTheDocument();
      expect(screen.getByText(/Jane/i)).toBeInTheDocument();
    });

    it('should activate the materialize tooltips', function() {
      renderWithRouter(<DocList docs={mockDocs} />);
      
      // The tooltips should be activated once after the component is mounted
      expect(window.$).toHaveBeenCalledWith('.tooltipped');
      expect(window.$.tooltipMock).toHaveBeenCalled();
    });

    it('renders the correct component structure', function() {
      const { container } = renderWithRouter(<DocList docs={mockDocs} />);
      
      // Should render one card per document
      const cards = container.querySelectorAll('.card-image');
      expect(cards.length).toEqual(mockDocs.length);
      
      // Should render one button per document
      const buttons = container.querySelectorAll('.btn-floating');
      expect(buttons.length).toEqual(mockDocs.length);
    });

    it('renders document titles', function() {
      renderWithRouter(<DocList docs={mockDocs} />);
      
      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('Another Document')).toBeInTheDocument();
    });

    it('renders owner information for each document', function() {
      renderWithRouter(<DocList docs={mockDocs} />);
      
      // Check first document owner
      expect(screen.getByText(/By:\s+Kevin Gathuku/i)).toBeInTheDocument();
      
      // Check second document owner
      expect(screen.getByText(/By:\s+Jane Doe/i)).toBeInTheDocument();
    });

    it('renders view links for each document', function() {
      const { container } = renderWithRouter(<DocList docs={mockDocs} />);
      
      // Should have links to view each document
      const links = container.querySelectorAll('a[href^="/documents/"]');
      expect(links.length).toEqual(mockDocs.length);
      
      // Check that links point to correct document IDs
      expect(links[0].getAttribute('href')).toBe('/documents/2');
      expect(links[1].getAttribute('href')).toBe('/documents/3');
    });

    it('renders with empty docs array', function() {
      const { container } = renderWithRouter(<DocList docs={[]} />);
      
      // Should render without errors
      expect(container.firstChild).toBeInTheDocument();
      
      // Should not render any cards
      const cards = container.querySelectorAll('.card');
      expect(cards.length).toEqual(0);
    });
  });
});
