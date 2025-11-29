import React from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import Provider from './Provider';

import NavBar from '../NavBar/NavBar.jsx';

export const DefaultLayout = ({ component: Component }) => {
  const location = useLocation();
  
  // Handle both direct exports and module objects with default property
  const ActualComponent = Component?.default || Component;
  
  return (
    <Provider>
      <NavBar pathname={location.pathname} />
      <ActualComponent />
    </Provider>
  );
};

DefaultLayout.propTypes = {
  component: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.object, // Allow module objects with default export
  ]).isRequired,
};
