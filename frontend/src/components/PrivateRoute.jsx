import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession, selectSession } from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

/**
 * PrivateRoute - Protects routes that require authentication
 *
 * Uses the /api/users/session endpoint as the definitive source of truth
 * Triggers session validation and waits for response before making redirect decisions
 */
export default function PrivateRoute({ children }) {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const location = useLocation();
  const token = localStorage.getItem('user');

  // Trigger session validation when component mounts with a token
  useEffect(() => {
    if (token && !session.loading && !session.loggedIn) {
      console.log('[PrivateRoute] Triggering session validation');
      dispatch(getSession(token));
    }
  }, [token, session.loading, session.loggedIn, dispatch]);

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[PrivateRoute] Session state:',
      JSON.stringify(session),
      'Token:',
      !!token,
      'Location:',
      location.pathname
    );
  }

  // If no token in localStorage, redirect immediately
  if (!token) {
    console.log('[PrivateRoute] No token found, redirecting to /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If session check is in progress, show loading
  // This prevents premature redirects while waiting for /api/users/session
  if (session.loading) {
    console.log('[PrivateRoute] Session loading, showing spinner');
    return (
      <div className="container">
        <div className="progress">
          <div className="indeterminate" />
        </div>
        <p className="center-align">Checking authentication...</p>
      </div>
    );
  }

  // If session validation completed and user IS logged in, allow access
  if (session.loggedIn) {
    console.log('[PrivateRoute] Session validated, rendering protected content');
    return children;
  }

  // If we have a token but session is not validated yet, wait
  // The useEffect above will call getSession() which will update session.loading to true
  // This handles the initial page load case
  if (token && !session.loading && !session.loggedIn) {
    console.log('[PrivateRoute] Token exists but session not validated, showing loading');
    return (
      <div className="container">
        <div className="progress">
          <div className="indeterminate" />
        </div>
        <p className="center-align">Validating session...</p>
      </div>
    );
  }

  // Fallback: redirect to auth
  console.log('[PrivateRoute] Fallback redirect to /auth');
  return <Navigate to="/auth" state={{ from: location }} replace />;
}
