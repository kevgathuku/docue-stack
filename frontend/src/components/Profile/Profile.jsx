import React from 'react';
import Elm from '../../utils/ReactElm';
import * as ElmProfile from '../Profile.elm';

// Base URL configuration
const BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : 'https://docue.herokuapp.com';

// Helper to safely get user info from localStorage
const getUserInfo = () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('Error parsing userInfo from localStorage:', error);
    return null;
  }
};

export default class Main extends React.PureComponent {
  constructor(props) {
    super(props);
    const user = getUserInfo();
    
    // If no user info, redirect to login
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    
    this.flags = {
      token: localStorage.getItem('user'),
      baseURL: BASE_URL,
      user: {
        id_: user._id,
        email: user.email,
        firstName: user.name.first,
        lastName: user.name.last,
        role: user.role ? user.role.title : ''
      },
    };
  }

  setupPorts(ports) {
    // Receives tuple from Elm of message, displayLength, className
    // tuple converted to fixed-length, mixed JS array
    ports.materializeToast.subscribe(function(toastParams) {
      window.Materialize.toast.apply(null, toastParams);
    });

    ports.updateCachedUserInfo.subscribe(function(userInfo) {
      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          _id: userInfo.id_,
          email: userInfo.email,
          name: {
            first: userInfo.firstName,
            last: userInfo.lastName,
          },
          role: {
            title: userInfo.role,
          },
        })
      );
      window.Materialize.toast('Profile Info Updated!', 2000, 'success-toast');
    });
  }

  render() {
    return <Elm src={ElmProfile} flags={this.flags} ports={this.setupPorts} />;
  }
}
