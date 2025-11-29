import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  createDocument,
  selectDocCreateResult,
  selectDocumentsError,
} from '../../features/documents/documentsSlice';
import { fetchRoles, selectRoles } from '../../features/roles/rolesSlice';
import { handleFieldChange } from '../../utils/componentHelpers';
import { withNavigate } from '../../utils/withNavigate';

const CreateDocument = ({ navigate }) => {
  const dispatch = useAppDispatch();
  const roles = useAppSelector(selectRoles);
  const createResult = useAppSelector(selectDocCreateResult);
  const error = useAppSelector(selectDocumentsError);

  const [token] = useState(localStorage.getItem('user'));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (token) {
      dispatch(fetchRoles(token));
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (createResult) {
      window.Materialize.toast(
        'Document created successfully!',
        2000,
        'success-toast'
      );
      navigate('/dashboard');
    }
  }, [createResult, navigate]);

  useEffect(() => {
    if (error) {
      window.Materialize.toast(error, 2000, 'error-toast');
    }
  }, [error]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!role) {
      window.Materialize.toast('Please Select a Role', 2000, 'error-toast');
      return;
    }
    const documentPayload = {
      title,
      content,
      role: role.title,
    };
    dispatch(createDocument({ body: documentPayload, token }));
  };

  const handleFieldChangeLocal = (event) => {
    const stateObject = handleFieldChange(event);
    const key = Object.keys(stateObject)[0];
    const value = stateObject[key];
    
    if (key === 'title') {
      setTitle(value);
    } else if (key === 'content') {
      setContent(value);
    }
  };

  const handleSelectChange = (val) => {
    setRole(val);
  };

  return (
    <div className="container">
      <div className="row">
        <h2 className="header center-align">Create Document</h2>
      </div>
      <div className="row">
        <form className="col s12" onSubmit={handleSubmit}>
          <div className="input-field col s12 m6">
            <input
              className="validate"
              id="title"
              name="title"
              value={title}
              onChange={handleFieldChangeLocal}
              type="text"
            />
            <label className="active" htmlFor="title">
              Title
            </label>
          </div>
          <div className="input-field col s12 m6">
            <Select
              getOptionLabel={(option) => {
                return option.title;
              }}
              getOptionValue={(option) => {
                return option._id;
              }}
              styles={{
                control: (base) => ({
                  ...base,
                  color: 'white',
                  maxHeight: '50px',
                }),
              }}
              name="role"
              options={roles || []}
              onChange={handleSelectChange}
              placeholder="Select Role"
              value={role}
              isSearchable={false}
            />
          </div>
          <div className="input-field col s12">
            <textarea
              className="validate materialize-textarea"
              id="content"
              name="content"
              value={content}
              onChange={handleFieldChangeLocal}
            />
            <label className="active" htmlFor="content">
              Content
            </label>
          </div>
          <div className="col s12">
            <div className="container center">
              <button
                className="btn waves-effect header-btn blue"
                name="action"
                type="submit"
              >
                {' '}
                submit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateDocument.propTypes = {
  navigate: PropTypes.func,
};

export default withNavigate(CreateDocument);
