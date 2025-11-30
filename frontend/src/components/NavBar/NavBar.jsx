import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { 
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
    // Initialize Materialize components
    window.$('.dropdown-button').dropdown();
    window.$('.button-collapse').sideNav();
    
    // Note: Session validation is now handled by PrivateRoute
    // PrivateRoute triggers getSession() when it mounts with a token
  }

  componentDidUpdate(prevProps) {
    window.$('.dropdown-button').dropdown();
    // window.$('.button-collapse').sideNav();

    const { logoutResult } = this.props;

    // Handle logout - clear localStorage and redirect to home
    if (logoutResult && prevProps.logoutResult !== logoutResult) {
      localStorage.removeItem('user');
      localStorage.removeItem('userInfo');
      this.props.navigate('/');
    }

    // Note: Session invalidation is now handled by PrivateRoute
    // PrivateRoute waits for /api/users/session response before redirecting
    // This prevents race conditions and infinite redirect loops
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
          <Link 
            className="brand-logo brand-logo-small" 
            to={this.props.loggedIn ? "/dashboard" : "/"}
          >
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
                    {this.props.user &&
                    this.props.user.role &&
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
