// RolesAdmin component - displays roles table with management options
// Migrated from Elm to ReScript

open Fetch
open LocalStorage
open RoleTypes

// Component state
type state =
  | Loading
  | Loaded(roleList)
  | Error(string)

// Get base URL based on environment
let getBaseUrl = (): string => {
  switch %raw(`process.env.NODE_ENV`) {
  | "development" => "http://localhost:8000"
  | _ => "https://docue.herokuapp.com"
  }
}

// Fetch roles from API
let fetchRoles = async (token: string): result<roleList, string> => {
  try {
    let baseUrl = getBaseUrl()
    let url = baseUrl ++ "/api/roles"
    let response = await get(url, Some(token))

    if ok(response) {
      let data = await json(response)
      decodeRoleList(data)
    } else {
      Error("Failed to fetch roles: HTTP " ++ Int.toString(status(response)))
    }
  } catch {
  | _ => Error("Network error occurred")
  }
}

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
let make = () => {
  let (state, setState) = React.useState(() => Loading)

  // Fetch roles on component mount
  React.useEffect0(() => {
    let token = getItemOption("user")

    switch token {
    | Some(t) => {
        let loadRoles = async () => {
          let result = await fetchRoles(t)
          switch result {
          | Ok(roles) => setState(_ => Loaded(roles))
          | Error(msg) => setState(_ => Error(msg))
          }
        }
        let _ = loadRoles()
      }
    | None => setState(_ => Error("No authentication token found"))
    }

    None
  })

  // Initialize tooltips after render
  React.useEffect1(() => {
    initTooltips()
    None
  }, [state])

  // Render a single role row
  let renderRole = (role: role) => {
    <tr key={role.id}>
      <td> {React.string(role.title)} </td>
      <td> {React.string(Int.toString(role.accessLevel))} </td>
    </tr>
  }

  // Render based on state
  switch state {
  | Loading =>
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

  | Error(msg) =>
    <div className="container">
      <div className="card-panel">
        <h2 className="header center-align"> {React.string("Manage Roles")} </h2>
        <div className="row">
          <div className="col s12 center-align">
            <p className="flow-text red-text"> {React.string("Error: " ++ msg)} </p>
          </div>
        </div>
      </div>
    </div>

  | Loaded(roles) =>
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
              <tbody> {roles->Array.map(renderRole)->React.array} </tbody>
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
  }
}

// Export for JavaScript interop
let default = make
