import React from 'react';
import PropTypes from 'prop-types';

import { handleFieldChange } from '../../utils/componentHelpers';
import { signup, selectSignupError, selectToken, selectUser, selectSession } from '../../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { withNavigate } from '../../utils/withNavigate';

class SignupForm extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    navigate: PropTypes.func,
    signupError: PropTypes.any,
    token: PropTypes.string,
    user: PropTypes.object,
    session: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      username: null,
      firstname: null,
      lastname: null,
      email: null,
      password: null,
      passwordConfirm: null,
      result: null,
      signupAttempted: false,
    };
  }

  componentDidUpdate(prevProps) {
    let { signupError, user, token, session } = this.props;
    if (signupError && prevProps.signupError !== this.props.signupError) {
      const errorMessage = typeof signupError === 'object' && signupError.error 
        ? signupError.error 
        : signupError;
      window.Materialize.toast(errorMessage, 2000, 'error-toast');
      return;
    }

    // The signup was successful - token changed indicates a fresh signup
    // Only handle if this component initiated the signup
    if (this.state.signupAttempted && token && prevProps.token !== token) {
      localStorage.setItem('user', token);
      
      // Only redirect and show toast if session is valid and we have user data
      if (user && session.loggedIn) {
        localStorage.setItem('userInfo', JSON.stringify(user));
        window.Materialize.toast(
          'Your Account has been created successfully!',
          2000,
          'success-toast'
        );
        this.props.navigate('/dashboard');
      }
      
      // Reset the flag
      this.setState({ signupAttempted: false });
    }
  }

  comparePassword = (password, confirmPassword) => {
    if (password !== confirmPassword) {
      window.Materialize.toast("passwords don't match", 2000, 'error-toast');
      return false;
    } else if (password.length >= 1 && password.length < 6) {
      window.Materialize.toast(
        'passwords should be > 6 characters ',
        2000,
        'error-toast'
      );
      return false;
    } else {
      return true;
    }
  };

  handleSubmit = (event) => {
    event.preventDefault();
    if (this.comparePassword(this.state.password, this.state.passwordConfirm)) {
      let userPayload = {
        firstname: this.state.firstname,
        lastname: this.state.lastname,
        username: this.state.email,
        email: this.state.email,
        password: this.state.password,
      };
      // Set flag before dispatching signup
      this.setState({ signupAttempted: true });
      this.props.dispatch(signup(userPayload));
    }
  };

  handleFieldChange = (event) => {
    if (event.target.name === 'password-confirm') {
      this.setState({ passwordConfirm: event.target.value });
    } else {
      let stateObject = handleFieldChange(event);
      this.setState(stateObject);
    }
  };

  render() {
    return (
      <div className="row">
        <form className="col s12" onSubmit={this.handleSubmit}>
          <div className="input-field col m6 s12">
            <input
              className="validate"
              id="firstname"
              name="firstname"
              onChange={this.handleFieldChange}
              required
              type="text"
            />
            <label htmlFor="firstname">First Name</label>
          </div>
          <div className="input-field col m6 s12">
            <input
              className="validate"
              id="lastname"
              name="lastname"
              onChange={this.handleFieldChange}
              required
              type="text"
            />
            <label htmlFor="lastname">Last Name</label>
          </div>
          <div className="input-field col s12">
            <input
              className="validate"
              id="email"
              name="email"
              onChange={this.handleFieldChange}
              required
              type="email"
            />
            <label htmlFor="email">Email</label>
          </div>
          <div className="input-field col s12">
            <input
              className="validate"
              id="password"
              name="password"
              onChange={this.handleFieldChange}
              required
              type="password"
            />
            <label htmlFor="password">Password</label>
          </div>
          <div className="input-field col s12">
            <input
              className="validate"
              id="password-confirm"
              name="password-confirm"
              onChange={this.handleFieldChange}
              required
              type="password"
            />
            <label htmlFor="password-confirm">Confirm Password</label>
          </div>
          <div className="col s12">
            <div className="center">
              <button
                className="btn waves-effect waves-light blue"
                name="action"
                type="submit"
              >
                Sign up
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

// Wrapper component to use hooks with class component
function SignupFormWithRedux(props) {
  const dispatch = useAppDispatch();
  const signupError = useAppSelector(selectSignupError);
  const token = useAppSelector(selectToken);
  const user = useAppSelector(selectUser);
  const session = useAppSelector(selectSession);

  return (
    <SignupForm
      {...props}
      dispatch={dispatch}
      signupError={signupError}
      token={token}
      user={user}
      session={session}
    />
  );
}

export default withNavigate(SignupFormWithRedux);
