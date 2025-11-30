// CreateRole component
// Implements role creation form with Redux integration

open Redux
open ReactRouter
open Materialize

// External binding for createRole action from rolesSlice
@module("../../features/roles/rolesSlice")
external createRole: {..} => {..} = "createRole"

// Component state for form input
type state = {
  title: string,
  createAttempted: bool,
}

// Actions for state updates
type action =
  | UpdateTitle(string)
  | Submit
  | CreateAttempted
  | ResetAttempt

// Reducer for managing form state
let reducer = (state, action) => {
  switch action {
  | UpdateTitle(title) => {...state, title}
  | Submit => state
  | CreateAttempted => {...state, createAttempted: true}
  | ResetAttempt => {...state, createAttempted: false}
  }
}

// Initial state
let initialState = {
  title: "",
  createAttempted: false,
}

@react.component
let make = () => {
  // Local form state
  let (state, dispatch) = React.useReducer(reducer, initialState)

  // Redux hooks
  let reduxDispatch = useDispatch()
  let navigate = useNavigate()

  // Get token from localStorage
  let token = switch LocalStorage.getItemOption("user") {
  | Some(t) => t
  | None => ""
  }

  // Select roles state from Redux store
  let createdRole = useSelector((store: {..}) => {
    store["roles"]["createdRole"]
  })

  let error = useSelector((store: {..}) => {
    store["roles"]["error"]
  })

  // Handle form submission
  let handleSubmit = evt => {
    ReactEvent.Form.preventDefault(evt)

    // Validate title is not empty
    if state.title == "" {
      showError("Please Provide a Role Title")
    } else {
      dispatch(CreateAttempted)

      // Create role payload
      let roleData = {
        "title": state.title,
      }

      // Create payload with data and token
      let payload = {
        "data": roleData,
        "token": token,
      }

      // Dispatch Redux createRole action
      reduxDispatch(createRole(payload))
    }
  }

  // Effect to handle role creation success
  React.useEffect2(() => {
    if state.createAttempted {
      // Handle creation success - check if createdRole is not null
      let isNull = %raw(`createdRole === null`)
      if !isNull {
        showSuccess("Role created successfully!")
        navigate("/admin/roles")
        dispatch(ResetAttempt)
      }
    }

    None
  }, (createdRole, state.createAttempted))

  // Effect to handle role creation error
  React.useEffect2(() => {
    if state.createAttempted {
      // Check if error exists and is not empty
      let hasError = %raw(`error && error !== ""`)
      if hasError {
        showError(error)
        dispatch(ResetAttempt)
      }
    }

    None
  }, (error, state.createAttempted))

  // Render form
  <div className="container">
    <div className="row">
      <h2 className="header center-align"> {React.string("Create Role")} </h2>
    </div>
    <div className="row">
      <form className="col s12" onSubmit={handleSubmit}>
        <div className="input-field col s4 offset-s2">
          <input
            id="title"
            className="validate"
            name="title"
            type_="text"
            value={state.title}
            onChange={evt => {
              let value = ReactEvent.Form.target(evt)["value"]
              dispatch(UpdateTitle(value))
            }}
          />
          <label className="active" htmlFor="title"> {React.string("Title")} </label>
        </div>
        <div className="col s6">
          <button
            className="btn waves-effect header-btn blue"
            name="action"
            type_="submit"
            style={%raw(`{top: "25px", position: "relative"}`)}
          >
            {React.string("submit")}
            <i className="material-icons right"> {React.string("send")} </i>
          </button>
        </div>
      </form>
    </div>
  </div>
}

// Export for JavaScript interop
let default = make
