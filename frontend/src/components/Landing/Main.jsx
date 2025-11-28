import React from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import Provider from './Provider';

import NavBar from '../NavBar/NavBar.jsx';

export const DefaultLayout = ({ component: Component }) => {
  const location = useLocation();
  
  return (
    <Provider>
      <NavBar pathname={location.pathname} />
      <Component />
    </Provider>
  );
};

DefaultLayout.propTypes = {
  component: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
};
