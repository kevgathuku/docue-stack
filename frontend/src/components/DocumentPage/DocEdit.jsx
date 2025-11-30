import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { editDocument, selectDocEditResult } from '../../features/documents/documentsSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { handleFieldChange } from '../../utils/componentHelpers';

const DocEdit = ({ doc, roles, updateDoc }) => {
  const dispatch = useAppDispatch();
  const editResult = useAppSelector(selectDocEditResult);

  const [token] = useState(localStorage.getItem('user'));
  const [title, setTitle] = useState(doc.title);
  const [content, setContent] = useState(doc.content);
  const [role, setRole] = useState(doc.role);

  useEffect(() => {
    if (editResult && editResult.data._id === doc._id) {
      if (editResult.statusCode === 200) {
        updateDoc(editResult.data);
        window.Materialize.toast('Document Updated!', 4000);
      } else {
        window.Materialize.toast(editResult.error, 2000, 'error-toast');
      }
    }
  }, [editResult, doc._id, updateDoc]);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    const documentPayload = {
      title,
      content,
      role,
    };
    dispatch(editDocument({ docId: doc._id, updatedDoc: documentPayload, token }));
  };

  const handleSelectChange = (val) => {
    setRole(val);
  };

  return (
    <div>
      <div className="modal-content">
        <h4 className="center-align">Edit Document</h4>
        <div className="row">
          <form className="col s12">
            <div className="input-field col s6">
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
            <div className="input-field col s6">
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
                options={roles}
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
          </form>
        </div>
      </div>
      <div className="modal-footer">
        <div className="container">
          <button
            className="btn modal-action modal-close waves-effect blue right"
            onClick={handleSubmit}
          >
            update
          </button>
          <button className="btn modal-action modal-close waves-effect red accent-2 left">
            cancel
          </button>
        </div>
      </div>
    </div>
  );
};

DocEdit.propTypes = {
  doc: PropTypes.object,
  roles: PropTypes.arrayOf(PropTypes.object),
  updateDoc: PropTypes.func,
};

export default DocEdit;
