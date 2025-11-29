import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Elm from '../../utils/ReactElm';
import * as ElmCreateRole from '../CreateRole.elm';
import { withNavigate } from '../../utils/withNavigate';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { createRole, selectCreatedRole, selectRolesError } from '../../features/roles/rolesSlice';

const token = localStorage.getItem('user');

function Main({ navigate }) {
  const dispatch = useAppDispatch();
  const createdRole = useAppSelector(selectCreatedRole);
  const error = useAppSelector(selectRolesError);

  useEffect(() => {
    if (createdRole) {
      window.Materialize.toast(
        'Role created successfully!',
        2000,
        'success-toast'
      );
      navigate('/admin/roles');
    }
  }, [createdRole, navigate]);

  useEffect(() => {
    if (error) {
      window.Materialize.toast(error, 2000, 'error-toast');
    }
  }, [error]);

  const flags = {
    token: token
  };

  const setupPorts = (ports) => {
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
      dispatch(createRole({ data: role, token }));
    });
  };

  return <Elm src={ElmCreateRole} flags={flags} ports={setupPorts} />;
}

Main.propTypes = {
  navigate: PropTypes.func,
};

export default withNavigate(Main);
