// Login component migrated from Elm to ReScript
// Implements form state management with Redux integration

open Redux
open ReactRouter
open Materialize

// External binding for login action from authSlice
@module("../../features/auth/authSlice")
external login: {..} => {..} = "login"

// Component state for form inputs
type state = {
  email: string,
  password: string,
  loginAttempted: bool,
}

// Actions for state updates
type action =
  | UpdateEmail(string)
  | UpdatePassword(string)
  | Submit
  | LoginAttempted
  | ResetAttempt

// Reducer for managing form state
let reducer = (state, action) => {
  switch action {
  | UpdateEmail(email) => {...state, email}
  | UpdatePassword(password) => {...state, password}
  | Submit => state
  | LoginAttempted => {...state, loginAttempted: true}
  | ResetAttempt => {...state, loginAttempted: false}
  }
}

// Initial state
let initialState = {
  email: "",
  password: "",
  loginAttempted: false,
}

@react.component
let make = () => {
  // Local form state
  let (state, dispatch) = React.useReducer(reducer, initialState)

  // Redux hooks
  let reduxDispatch = useDispatch()
  let navigate = useNavigate()

  // Select auth state from Redux store
  let loginError = useSelector((store: {..}) => {
    store["auth"]["loginError"]
  })

  let token = useSelector((store: {..}) => {
    store["auth"]["token"]
  })

  let user = useSelector((store: {..}) => {
    store["auth"]["user"]
  })

  let session = useSelector((store: {..}) => {
    store["auth"]["session"]
  })

  // Handle form submission
  let handleSubmit = evt => {
    ReactEvent.Form.preventDefault(evt)
    dispatch(LoginAttempted)

    // Create login payload
    let credentials = {
      "username": state.email,
      "password": state.password,
    }

    // Dispatch Redux login action
    reduxDispatch(login(credentials))
  }

  // Effect to handle login success/error
  React.useEffect4(() => {
    if state.loginAttempted {
      // Handle login error
      switch loginError {
      | "" => ()
      | error => {
          showError(error)
          dispatch(ResetAttempt)
        }
      }

      // Handle login success
      switch (token, user, session) {
      | ("", _, _) => ()
      | (token, _user, session) => {
          // Check if session is valid
          let loggedIn = session["loggedIn"]

          if loggedIn {
            // Store token in localStorage
            LocalStorage.setItem("user", token)

            // Store user info in localStorage
            let userJson = %raw(`JSON.stringify(user)`)
            LocalStorage.setItem("userInfo", userJson)

            // Show success message
            showSuccess("Logged in Successfully!")

            // Navigate to dashboard
            navigate("/dashboard")

            // Reset attempt flag
            dispatch(ResetAttempt)
          }
        }
      }
    }

    None
  }, (loginError, token, user, state.loginAttempted))

  // Render form
  <div className="row">
    <form className="col s12" onSubmit={handleSubmit}>
      <div className="input-field col s12">
        <input
          id="email"
          className="validate"
          name="email"
          type_="text"
          required=true
          value={state.email}
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdateEmail(value))
          }}
        />
        <label htmlFor="email"> {React.string("Email Address")} </label>
      </div>
      <div className="input-field col s12">
        <input
          id="password"
          className="validate"
          name="password"
          type_="password"
          required=true
          value={state.password}
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdatePassword(value))
          }}
        />
        <label htmlFor="password"> {React.string("Password")} </label>
      </div>
      <div className="col s12">
        <div className="container center">
          <button className="btn waves-effect header-btn blue" name="action" type_="submit">
            {React.string("Login")}
          </button>
        </div>
      </div>
    </form>
  </div>
}

// Export for JavaScript interop
let default = make
