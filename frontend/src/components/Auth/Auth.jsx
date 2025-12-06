import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getSession, selectSession } from '../../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

import Login from '../Login/Login.res.js';
import SignUp from '../SignUp/SignUp.res.js';

class Authenticate extends React.PureComponent {
  static propTypes = {
    history: PropTypes.object,
  };

  componentDidMount() {
    // Initialize Materialize tabs
    if (window.$) {
      window.$('.tabs').tabs();
    }
  }

  render() {
    return (
      <div className="container">
        <br />
        <div className="row">
          <div className="container">
            <div className="row">
              <div className="container">
                <div className="row card-panel hoverable">
                  <div className="col s12">
                    <ul className="tabs">
                      <li className="tab col s4">
                        <a className="active blue-text" href="#login">
                          Login
                        </a>
                      </li>
                      <li className="tab col s4">
                        <a className="blue-text" href="#signup">
                          Signup
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div id="login" className="col s12">
                    <Login history={this.props.history} />
                  </div>
                  <div id="signup" className="col s12">
                    <SignUp history={this.props.history} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Wrapper component that redirects logged-in users to dashboard
// This validates sessions to redirect already-logged-in users away from /auth
// NOTE: This is safe because authSlice clears localStorage on invalid tokens,
// preventing infinite loops (see INVALID_TOKEN_FIX.md)
function AuthWithRedirect(props) {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const token = localStorage.getItem('user');

  // Trigger session validation when component mounts with a token
  // This checks if the user is already logged in and should be redirected
  // Safe from infinite loops because invalid tokens are cleared from localStorage
  useEffect(() => {
    if (token && !session.loading && !session.loggedIn) {
      console.log('[Auth] Checking if user is already logged in');
      dispatch(getSession(token));
    }
  }, [token, session.loading, session.loggedIn, dispatch]);

  // If session check is in progress, show loading
  if (token && session.loading) {
    return (
      <div className="container">
        <div className="progress">
          <div className="indeterminate" />
        </div>
        <p className="center-align">Checking authentication...</p>
      </div>
    );
  }

  // If user is already logged in (session validated), redirect to dashboard
  if (token && session.loggedIn) {
    console.log('[Auth] User already logged in, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise, show the auth page
  return <Authenticate {...props} />;
}

export default AuthWithRedirect;
