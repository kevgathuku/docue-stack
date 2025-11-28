import React from 'react';
import DocActions from '../../actions/DocActions';
import DocStore from '../../stores/DocStore';
import DocList from './DocList.jsx';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      docs: null,
      error: null
    };
  }

  componentDidMount() {
    // Get the token from localStorage
    let token = localStorage.getItem('user');
    
    if (!token) {
      this.setState({ error: 'No authentication token found' });
      return;
    }
    
    DocActions.getDocs(token);
    DocStore.addChangeListener(this.handleDocsResult, 'fetchDocs');
  }

  componentWillUnmount() {
    DocStore.removeChangeListener(this.handleDocsResult, 'fetchDocs');
  }

  handleDocsResult = () => {
    let docs = DocStore.getDocs();
    if (docs && !docs.error) {
      this.setState({
        docs: docs
      });
    }
  };

  render() {
    const { docs, error } = this.state;
    
    if (error) {
      return (
        <div className="container">
          <div className="row">
            <div className="col s12">
              <div className="card-panel red lighten-4">
                <span className="red-text text-darken-4">
                  <i className="material-icons left">error</i>
                  {error}
                </span>
              </div>
              <p className="center-align">
                <a href="/auth" className="btn blue">
                  Go to Login
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="container">
        <div className="row">
          <h2 className="header center-align">All Documents</h2>
        </div>
        <div className="row">
          {docs ? <DocList docs={docs} /> : <p>Loading...</p>}
        </div>
        <div className="fixed-action-btn" style={{bottom: 45, right: 24}}>
          <a
            className="btn-floating btn-large tooltipped pink"
            data-delay="50"
            data-position="left"
            data-tooltip="Create Document"
            href="/documents/create"
          >
            <i className="material-icons">add</i>
          </a>
        </div>
      </div>
    );
  }
}

export default Dashboard;
