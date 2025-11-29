import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { 
  getSession, 
  logout, 
  selectToken, 
  selectUser, 
  selectLogoutResult, 
  selectSession 
} from '../../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import logoSrc from '../../images/favicon.png';
import { withNavigate } from '../../utils/withNavigate';

class NavBar extends React.Component {
  // Receive the current pathname as a prop
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    navigate: PropTypes.func,
    loggedIn: PropTypes.bool,
    logoutResult: PropTypes.string,
    session: PropTypes.shape({
      loggedIn: PropTypes.bool,
      loading: PropTypes.bool,
    }),
    token: PropTypes.string,
    user: PropTypes.object,
  };

  componentDidMount() {
    const token = localStorage.getItem('user');
    const { session } = this.props;
    
    // Only check session if we have a token but don't know the session state yet
    // If session.loggedIn is already true, we don't need to check again
    // If there's no token, no need to check
    if (token && !session.loggedIn && !session.loading) {
      this.props.dispatch(getSession(token));
    }

    window.$('.dropdown-button').dropdown();
    window.$('.button-collapse').sideNav();
  }

  componentDidUpdate(prevProps) {
    window.$('.dropdown-button').dropdown();
    // window.$('.button-collapse').sideNav();

    const { logoutResult, session } = this.props;

    if (logoutResult && prevProps.logoutResult !== logoutResult) {
      // Remove the user's token and info
      localStorage.removeItem('user');
      localStorage.removeItem('userInfo');

      this.props.navigate('/');
    }

    // Use deep comparison to check if session actually changed
    const sessionChanged =
      prevProps.session.loggedIn !== session.loggedIn ||
      prevProps.session.loading !== session.loading;

    // Handle session invalidation - clear state only
    // PrivateRoute will handle redirects
    if (sessionChanged && !session.loading && session.loggedIn === false) {
      const hadToken = !!localStorage.getItem('user');
      
      if (hadToken) {
        // Token was invalid, clear it
        localStorage.removeItem('user');
        localStorage.removeItem('userInfo');
        
        // Note: PrivateRoute will handle redirect to /auth
        // NavBar only clears localStorage, doesn't dispatch actions or navigate
        // The Redux state will be cleared naturally when user logs in again
      }
    }
  }

  handleLogoutSubmit = (event) => {
    event.preventDefault();
    const token = localStorage.getItem('user');
    this.props.dispatch(logout(token));
  };

  render() {
    return this.props.pathname === '/' ? null : (
      <nav className="transparent black-text" role="navigation">
        <div className="nav-wrapper container">
          <Link className="brand-logo brand-logo-small" to="/">
            <img alt="Docue Logo" id="header-logo" src={logoSrc} />
            {'      Docue'}
          </Link>
          <a href="#" data-activates="mobile-demo" className="button-collapse">
            <i className="material-icons" style={{ color: 'grey' }}>
              menu
            </i>
          </a>
          <ul className="side-nav" id="mobile-demo">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              {this.props.loggedIn ? (
                <Link to="/profile">Profile</Link>
              ) : (
                <Link to="/auth">Login</Link>
              )}
            </li>
            <li>
              {this.props.loggedIn ? (
                <a href="#" onClick={this.handleLogoutSubmit}>
                  Logout
                </a>
              ) : (
                <Link to="/auth">Sign Up</Link>
              )}
            </li>
          </ul>
          <ul className="right hide-on-med-and-down" id="nav-mobile">
            <li>
              {this.props.loggedIn ? (
                <div>
                  <ul id="dropdown" className="dropdown-content">
                    <li>
                      <Link to="/profile">My Profile</Link>
                    </li>
                    <li>
                      <Link to="/dashboard">All Documents</Link>
                    </li>
                    {this.props.user.role &&
                    this.props.user.role.title === 'admin' ? (
                      <li>
                        <Link to="/admin">Settings</Link>
                      </li>
                    ) : null}
                    <li className="divider" />
                    <li>
                      <a
                        href="#"
                        id="logout-btn"
                        onClick={this.handleLogoutSubmit}
                      >
                        {' '}
                        Logout
                      </a>
                    </li>
                  </ul>
                  <a
                    className="dropdown-button"
                    data-activates="dropdown"
                    data-beloworigin="true"
                    data-constrainwidth="false"
                  >
                    {this.props.user.name.first}
                    <i className="material-icons right">arrow_drop_down</i>
                  </a>
                </div>
              ) : null}
            </li>
          </ul>
        </div>
      </nav>
    );
  }
}

// Wrapper component to use hooks with class component
function NavBarWithRedux(props) {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const user = useAppSelector(selectUser);
  const logoutResult = useAppSelector(selectLogoutResult);
  const session = useAppSelector(selectSession);
  const loggedIn = user._id && session.loggedIn;

  return (
    <NavBar
      {...props}
      dispatch={dispatch}
      token={token}
      user={user}
      loggedIn={loggedIn}
      logoutResult={logoutResult}
      session={session}
    />
  );
}

export default withNavigate(NavBarWithRedux);
