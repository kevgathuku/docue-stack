import { Navigate, useLocation } from 'react-router-dom';
import { selectSession } from '../features/auth/authSlice';
import { useAppSelector } from '../store/hooks';

/**
 * PrivateRoute - Protects routes that require authentication
 * 
 * Checks if user has a token in localStorage
 * If token exists, assumes logged in (NavBar will verify)
 * If no token, redirects to /auth immediately
 */
export default function PrivateRoute({ children }) {
  const session = useAppSelector(selectSession);
  const location = useLocation();
  const token = localStorage.getItem('user');

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[PrivateRoute] Session state:', JSON.stringify(session), 'Token:', !!token, 'Location:', location.pathname);
  }

  // If no token in localStorage, redirect immediately
  if (!token) {
    console.log('[PrivateRoute] No token found, redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If session check is in progress, show loading
  if (session.loading) {
    console.log('[PrivateRoute] Session loading, showing spinner');
    return (
      <div className="container">
        <div className="progress">
          <div className="indeterminate"></div>
        </div>
        <p className="center-align">Checking authentication...</p>
      </div>
    );
  }

  // If session check completed and user is not logged in, redirect
  // (This handles invalid/expired tokens)
  if (!session.loading && !session.loggedIn && token) {
    console.log('[PrivateRoute] Session check complete but not logged in, redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  console.log('[PrivateRoute] Rendering protected content');

  // User has token and either:
  // - Session check hasn't started yet (NavBar will handle it)
  // - Session check completed successfully
  // Render the protected content
  return children;
}
