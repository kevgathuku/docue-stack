import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Higher-Order Component to provide React Router v6's navigate function
 * and route params to components that previously used React Router v5
 * 
 * Usage:
 * export default withNavigate(YourComponent);
 * 
 * Then in your component, use:
 * - this.props.navigate('/path') instead of this.props.history.push('/path')
 * - this.props.match.params for route parameters
 */
export function withNavigate(Component) {
  return function WrappedComponent(props) {
    const navigate = useNavigate();
    const params = useParams();
    
    // Create a match object similar to React Router v5 for backward compatibility
    const match = {
      params,
    };
    
    return <Component {...props} navigate={navigate} match={match} />;
  };
}
