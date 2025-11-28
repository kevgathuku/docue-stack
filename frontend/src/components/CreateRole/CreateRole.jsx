import React from 'react';
import PropTypes from 'prop-types';
import Elm from '../../utils/ReactElm';
import RoleActions from '../../actions/RoleActions';
import RoleStore from '../../stores/RoleStore';
import ElmComponents from '../CreateRole.elm';
import { withNavigate } from '../../utils/withNavigate';

const token = localStorage.getItem('user');

class Main extends React.Component {
  static propTypes = {
    navigate: PropTypes.func,
  };

  componentDidMount() {
    RoleStore.addChangeListener(this.handleRoleCreateResult);
  }

  componentWillUnmount() {
    RoleStore.removeChangeListener(this.handleRoleCreateResult);
  }

  flags = {
    token: token
  };

  setupPorts(ports) {
    ports.handleSubmit.subscribe(function(title) {
      if (!title) {
        return window.Materialize.toast(
          'Please Provide a Role Title',
          2000,
          'error-toast'
        );
      }
      let role = {
        title: title
      };
      RoleActions.create(role, token);
    });
  }

  handleRoleCreateResult = () => {
    let data = RoleStore.getCreatedRole();
    if (data) {
      if (data.error) {
        window.Materialize.toast(data.error, 2000, 'error-toast');
      } else {
        window.Materialize.toast(
          'Role created successfully!',
          2000,
          'success-toast'
        );
        this.props.navigate('/admin/roles');
      }
    }
  };

  render() {
    return <Elm src={ElmComponents.Elm.CreateRole} flags={this.flags} ports={this.setupPorts} />;
  }
}

export default withNavigate(Main);
