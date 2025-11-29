import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import PropTypes from 'prop-types';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchRoles, selectRoles } from '../../features/roles/rolesSlice';
import { fetchUsers, updateProfile, selectUsers } from '../../features/auth/authSlice';

function UsersAdmin() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectUsers);
  const roles = useAppSelector(selectRoles);
  
  const [token] = useState(localStorage.getItem('user'));
  const [selectedRoles, setSelectedRoles] = useState({});
  const access = {
    viewer: 'Public Documents',
    staff: 'Staff and Public Documents',
    admin: 'All Documents',
  };

  useEffect(() => {
    dispatch(fetchRoles(token));
    dispatch(fetchUsers(token));
  }, [dispatch, token]);

  // Prepend the user object to the function arguments through bind
  const handleSelectChange = (user, val) => {
    setSelectedRoles(prev => ({
      ...prev,
      [user._id]: val
    }));
    
    // Update the user's Role
    // Don't update if the already existing role is the one chosen
    if (user.role._id !== val._id) {
      user.role = val;
      dispatch(updateProfile({ userId: user._id, user, token }));
    }
  };

  const renderUser = (user) => {
    let accessRole = selectedRoles[user._id]
      ? selectedRoles[user._id].title
      : user.role.title;
    let description = access[accessRole];
    return (
      <tr key={user._id}>
        <td>{`${user.name.first} ${user.name.last}`}</td>
        <td>{user.email}</td>
        <td>
          <Select
            getOptionLabel={(option) => {
              return option.title;
            }}
            getOptionValue={(option) => {
              return option._id;
            }}
            styles={{ control: (base) => ({ ...base, maxHeight: '50px' }) }}
            name="role"
            options={roles || []}
            onChange={(val) => handleSelectChange(user, val)}
            placeholder="Select Role"
            value={user.role}
            isSearchable={false}
          />
        </td>
        <td>{description}</td>
      </tr>
    );
  };

  return (
    <div className="container">
      <div className="card-panel">
        <h2 className="header center-align">Manage Users</h2>
        <div className="row">
          <div className="col s10 offset-s1 center-align">
            <table className="centered">
              <thead>
                <tr>
                  <th data-field="id">Name</th>
                  <th data-field="name">Email</th>
                  <th data-field="role">Role</th>
                  <th data-field="role">Access</th>
                </tr>
              </thead>
              <tbody>{(users || []).map(renderUser)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

UsersAdmin.propTypes = {
  users: PropTypes.array,
};

export default UsersAdmin;
