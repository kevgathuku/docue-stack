// Admin component - displays system statistics
// Migrated from Elm to ReScript

open Fetch
open LocalStorage
open Api

// Stats type matching backend response
type stats = {
  documents: int,
  users: int,
  roles: int,
}

// Component state
type state =
  | Loading
  | Loaded(stats)
  | Error(string)

// Decode stats from JSON using raw JavaScript
let decodeStats = (_json: JSON.t): result<stats, string> => {
  try {
    let documents = %raw(`_json.documents || 0`)
    let users = %raw(`_json.users || 0`)
    let roles = %raw(`_json.roles || 0`)

    Ok({documents, users, roles})
  } catch {
  | _ => Error("Failed to decode stats")
  }
}

// Fetch stats from API
let fetchStats = async (token: string): result<stats, string> => {
  try {
    let url = baseUrl ++ "/api/stats"
    let response = await get(url, Some(token))

    if ok(response) {
      let data = await json(response)
      decodeStats(data)
    } else {
      Error("Failed to fetch stats: HTTP " ++ Int.toString(status(response)))
    }
  } catch {
  | _ => Error("Network error occurred")
  }
}

@react.component
let make = () => {
  let (state, setState) = React.useState(() => Loading)

  // Fetch stats on component mount
  React.useEffect0(() => {
    let token = getItemOption("user")

    switch token {
    | Some(t) => {
        let loadStats = async () => {
          let result = await fetchStats(t)
          switch result {
          | Ok(stats) => setState(_ => Loaded(stats))
          | Error(msg) => setState(_ => Error(msg))
          }
        }
        let _ = loadStats()
      }
    | None => setState(_ => Error("No authentication token found"))
    }

    None
  })

  // Render based on state
  switch state {
  | Loading =>
    <div className="container">
      <div className="card-panel">
        <h2 className="header center-align"> {React.string("Admin Panel")} </h2>
        <div className="row">
          <div className="col s12 center-align">
            <p className="flow-text"> {React.string("Loading statistics...")} </p>
          </div>
        </div>
      </div>
    </div>

  | Error(msg) =>
    <div className="container">
      <div className="card-panel">
        <h2 className="header center-align"> {React.string("Admin Panel")} </h2>
        <div className="row">
          <div className="col s12 center-align">
            <p className="flow-text red-text"> {React.string("Error: " ++ msg)} </p>
          </div>
        </div>
      </div>
    </div>

  | Loaded(stats) =>
    <div className="container">
      <div className="card-panel">
        <h2 className="header center-align"> {React.string("Admin Panel")} </h2>
        <div className="row">
          <div className="col s4 center-align">
            <h5> {React.string("Total Users")} </h5>
            <p id="users-count" className="flow-text">
              {React.string(Int.toString(stats.users))}
            </p>
            <a className="waves-effect waves-light btn blue" href="/admin/users">
              <i className="material-icons left"> {React.string("face")} </i>
              {React.string("Manage Users")}
            </a>
          </div>
          <div className="col s4 center-align">
            <h5> {React.string("Total Documents")} </h5>
            <p id="docs-count" className="flow-text">
              {React.string(Int.toString(stats.documents))}
            </p>
            <a className="waves-effect waves-light btn blue" href="/dashboard">
              <i className="material-icons left"> {React.string("drafts")} </i>
              {React.string("Manage Docs")}
            </a>
          </div>
          <div className="col s4 center-align">
            <h5> {React.string("Total Roles")} </h5>
            <p id="roles-count" className="flow-text">
              {React.string(Int.toString(stats.roles))}
            </p>
            <a className="waves-effect waves-light btn blue" href="/admin/roles">
              <i className="material-icons left"> {React.string("settings")} </i>
              {React.string("Manage Roles")}
            </a>
          </div>
        </div>
      </div>
    </div>
  }
}

// Export for JavaScript interop
let default = make
