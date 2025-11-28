import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Higher-Order Component to provide React Router v6's navigate function
 * to class components that previously used history.push()
 * 
 * Usage:
 * export default withNavigate(YourClassComponent);
 * 
 * Then in your component, use:
 * this.props.navigate('/path') instead of this.props.history.push('/path')
 */
export function withNavigate(Component) {
  return function WrappedComponent(props) {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  };
}
