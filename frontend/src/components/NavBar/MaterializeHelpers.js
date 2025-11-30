// Helper functions for creating Materialize elements with data-* attributes
// ReScript doesn't support data-* attributes in JSX, so we use JS helpers

import React from 'react';

export const createDropdownButton = (userName, onClick) => {
  return React.createElement(
    'a',
    {
      className: 'dropdown-button',
      href: '#',
      'data-activates': 'dropdown',
      'data-beloworigin': 'true',
      'data-constrainwidth': 'false',
      onClick: onClick,
    },
    userName,
    React.createElement('i', { className: 'material-icons right' }, 'arrow_drop_down')
  );
};

export const createMobileMenuButton = (onClick) => {
  return React.createElement(
    'a',
    {
      href: '#',
      'data-activates': 'mobile-demo',
      className: 'button-collapse',
      onClick: onClick,
    },
    React.createElement('i', { className: 'material-icons', style: { color: 'grey' } }, 'menu')
  );
};
