import React from 'react';
import PropTypes from 'prop-types';

import Elm from '../../utils/ReactElm';
import * as ElmLogin from '../Login.elm';
import { login, selectLoginError, selectToken, selectUser, selectSession } from '../../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { withNavigate } from '../../utils/withNavigate';

class Login extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    navigate: PropTypes.func,
    loginError: PropTypes.string,
    token: PropTypes.string,
    user: PropTypes.object,
    session: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.setupPorts = this.setupPorts.bind(this);
  }

  componentDidUpdate(prevProps) {
    const { loginError, user, token, session } = this.props;

    if (loginError) {
      this.showLoginError();
    }

    // The login was successful. Store user data in localStorage
    if (token && prevProps.token !== this.props.token) {
      localStorage.setItem('user', token);
    }

    // Only redirect if user changed AND session is valid
    // This prevents redirect loops when session is invalid but user object still exists in Redux
    if (user && prevProps.user !== this.props.user && session.loggedIn) {
      // The login was successful. Save user's info in localStorage
      localStorage.setItem('userInfo', JSON.stringify(user));
      window.Materialize.toast(
        'Logged in Successfully!',
        2000,
        'success-toast'
      );
      this.props.navigate('/dashboard');
    }
  }

  showLoginError = () => {
    const { loginError } = this.props;
    return window.Materialize.toast(loginError, 2000, 'error-toast');
  };

  setupPorts(ports) {
    const component = this;
    // Receives a record from Elm, which comes in as a JS obect
    ports.handleSubmit.subscribe(function(model) {
      let loginPayload = {
        username: model.email,
        password: model.password,
      };
      component.props.dispatch(login(loginPayload));
    });
  }

  render() {
    return <Elm src={ElmLogin} ports={this.setupPorts} />;
  }
}

// Wrapper component to use hooks with class component
function LoginWithRedux(props) {
  const dispatch = useAppDispatch();
  const loginError = useAppSelector(selectLoginError);
  const token = useAppSelector(selectToken);
  const user = useAppSelector(selectUser);
  const session = useAppSelector(selectSession);

  return (
    <Login
      {...props}
      dispatch={dispatch}
      loginError={loginError}
      token={token}
      user={user}
      session={session}
    />
  );
}

export default withNavigate(LoginWithRedux);
