/**
 * RolesAdminContainer - Redux-connected wrapper for RolesAdmin ReScript component
 * Handles Redux state management and passes props to the ReScript component
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRoles, selectRoles, selectRolesLoading, selectRolesError } from '../../features/roles/rolesSlice.js';
import RolesAdmin from './RolesAdmin.res.js';

export default function RolesAdminContainer() {
  const dispatch = useDispatch();
  const roles = useSelector(selectRoles);
  const loading = useSelector(selectRolesLoading);
  const error = useSelector(selectRolesError);

  useEffect(() => {
    const token = localStorage.getItem('user');
    if (token) {
      dispatch(fetchRoles(token));
    }
  }, [dispatch]);

  return (
    <RolesAdmin
      roles={roles}
      loading={loading}
      error={error}
    />
  );
}
