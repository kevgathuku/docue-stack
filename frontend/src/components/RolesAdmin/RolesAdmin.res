// RolesAdmin component - displays roles table with management options
// Receives Redux state as props from RolesAdminContainer.jsx

open RoleTypes

// Initialize Materialize tooltips using external binding
@val @scope("window")
external jQueryExists: unit => bool = "$"

// External binding to jQuery tooltip
let initTooltips = (): unit => {
  try {
    %raw(`window.$('.tooltipped').tooltip()`)
  } catch {
  | _ => () // Silently fail if jQuery/Materialize not loaded
  }
}

@react.component
let make = (~roles: Nullable.t<roleList>, ~loading: bool, ~error: Nullable.t<string>) => {
  // Initialize tooltips after roles load
  React.useEffect1(() => {
    if !loading {
      initTooltips()
    }
    None
  }, [loading])

  // Render a single role row
  let renderRole = (role: role) => {
    <tr key={role.id}>
      <td> {React.string(role.title)} </td>
      <td> {React.string(Int.toString(role.accessLevel))} </td>
    </tr>
  }

  // Render based on props
  if loading {
    <div className="container">
      <div className="card-panel">
        <h2 className="header center-align"> {React.string("Manage Roles")} </h2>
        <div className="row">
          <div className="col s12 center-align">
            <p className="flow-text"> {React.string("Loading roles...")} </p>
          </div>
        </div>
      </div>
    </div>
  } else {
    switch (error->Nullable.toOption, roles->Nullable.toOption) {
    | (Some(errorMsg), _) =>
      <div className="container">
        <div className="card-panel">
          <h2 className="header center-align"> {React.string("Manage Roles")} </h2>
          <div className="row">
            <div className="col s12 center-align">
              <p className="flow-text red-text"> {React.string("Error: " ++ errorMsg)} </p>
            </div>
          </div>
        </div>
      </div>

    | (None, Some(rolesArray)) =>
      <div className="container">
        <div className="card-panel">
          <h2 className="header center-align"> {React.string("Manage Roles")} </h2>
          <div className="row">
            <div className="col s10 offset-s1 center-align">
              <table className="centered">
                <thead>
                  <tr>
                    <th> {React.string("Role")} </th>
                    <th> {React.string("Access Level")} </th>
                  </tr>
                </thead>
                <tbody> {rolesArray->Array.map(renderRole)->React.array} </tbody>
              </table>
            </div>
          </div>
          <div className="fixed-action-btn" style={%raw(`{bottom: "45px", right: "24px"}`)}>
            <a className="btn-floating btn-large tooltipped pink" href="/admin/roles/create">
              <i className="material-icons"> {React.string("edit")} </i>
            </a>
          </div>
        </div>
      </div>

    | (None, None) =>
      <div className="container">
        <div className="card-panel">
          <h2 className="header center-align"> {React.string("Manage Roles")} </h2>
          <div className="row">
            <div className="col s12 center-align">
              <p className="flow-text"> {React.string("No roles found")} </p>
            </div>
          </div>
        </div>
      </div>
    }
  }
}

// Export for JavaScript interop
let default = make
