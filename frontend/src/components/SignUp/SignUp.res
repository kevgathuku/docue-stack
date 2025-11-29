// SignUp component migrated from React to ReScript
// Implements form state management with Redux integration and password validation

open Redux
open ReactRouter
open Materialize

// External binding for signup action from authSlice
@module("../../features/auth/authSlice")
external signup: {..} => {..} = "signup"

// Form state for all signup fields
type state = {
  firstname: string,
  lastname: string,
  email: string,
  password: string,
  passwordConfirm: string,
  signupAttempted: bool,
}

// Actions for state updates
type action =
  | UpdateFirstname(string)
  | UpdateLastname(string)
  | UpdateEmail(string)
  | UpdatePassword(string)
  | UpdatePasswordConfirm(string)
  | Submit
  | SignupAttempted
  | ResetAttempt

// Password validation result
type passwordValidation =
  | Valid
  | Mismatch
  | TooShort

// Validate password - checks match and length
let validatePassword = (password, passwordConfirm) => {
  if password != passwordConfirm {
    Mismatch
  } else if String.length(password) >= 1 && String.length(password) < 6 {
    TooShort
  } else {
    Valid
  }
}

// Reducer for managing form state
let reducer = (state, action) => {
  switch action {
  | UpdateFirstname(value) => {...state, firstname: value}
  | UpdateLastname(value) => {...state, lastname: value}
  | UpdateEmail(value) => {...state, email: value}
  | UpdatePassword(value) => {...state, password: value}
  | UpdatePasswordConfirm(value) => {...state, passwordConfirm: value}
  | Submit => state
  | SignupAttempted => {...state, signupAttempted: true}
  | ResetAttempt => {...state, signupAttempted: false}
  }
}

// Initial state
let initialState = {
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  passwordConfirm: "",
  signupAttempted: false,
}

@react.component
let make = () => {
  // Local form state
  let (state, dispatch) = React.useReducer(reducer, initialState)

  // Redux hooks
  let reduxDispatch = useDispatch()
  let navigate = useNavigate()

  // Select auth state from Redux store
  let signupError = useSelector((store: {..}) => {
    store["auth"]["signupError"]
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

    // Validate password before submitting
    switch validatePassword(state.password, state.passwordConfirm) {
    | Mismatch => showError("passwords don't match")
    | TooShort => showError("passwords should be > 6 characters")
    | Valid => {
        dispatch(SignupAttempted)

        // Create signup payload
        let payload = {
          "firstname": state.firstname,
          "lastname": state.lastname,
          "username": state.email,
          "email": state.email,
          "password": state.password,
        }

        // Dispatch Redux signup action
        reduxDispatch(signup(payload))
      }
    }
  }

  // Effect to handle signup success/error
  // Dependencies: signupError, token, user, session, signupAttempted
  React.useEffect5(() => {
    // Only process if user attempted to signup
    if state.signupAttempted {
      // Handle signup error
      let errorIsNull = %raw(`signupError === null || signupError === undefined`)

      if !errorIsNull {
        // Extract error message from object or use as string
        let isObject = %raw(`typeof signupError === "object"`)
        let errorMessage = if isObject {
          let errorObj = signupError->Obj.magic
          let hasErrorProp = %raw(`errorObj.error !== null && errorObj.error !== undefined`)
          if hasErrorProp {
            errorObj["error"]
          } else {
            signupError->Obj.magic
          }
        } else {
          signupError->Obj.magic
        }
        showError(errorMessage)
        dispatch(ResetAttempt)
      }

      // Handle signup success - MUST check session.loggedIn
      let loggedIn = session["loggedIn"]

      switch (token, loggedIn) {
      | ("", _) => () // No token, do nothing
      | (_, false) => () // Token exists but session not validated, wait
      | (token, true) => {
          // Token exists AND session is validated - safe to redirect

          // Store token in localStorage
          LocalStorage.setItem("user", token)

          // Store user info in localStorage
          let userJson = %raw(`JSON.stringify(user)`)
          LocalStorage.setItem("userInfo", userJson)

          // Show success message
          showSuccess("Your Account has been created successfully!")

          // Navigate to dashboard
          navigate("/dashboard")

          // Reset attempt flag
          dispatch(ResetAttempt)
        }
      }
    }

    None
  }, (signupError, token, user, session, state.signupAttempted))

  // Render form
  <div className="row">
    <form className="col s12" onSubmit={handleSubmit}>
      <div className="input-field col m6 s12">
        <input
          id="firstname"
          className="validate"
          name="firstname"
          type_="text"
          required=true
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdateFirstname(value))
          }}
        />
        <label htmlFor="firstname"> {React.string("First Name")} </label>
      </div>
      <div className="input-field col m6 s12">
        <input
          id="lastname"
          className="validate"
          name="lastname"
          type_="text"
          required=true
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdateLastname(value))
          }}
        />
        <label htmlFor="lastname"> {React.string("Last Name")} </label>
      </div>
      <div className="input-field col s12">
        <input
          id="email"
          className="validate"
          name="email"
          type_="email"
          required=true
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdateEmail(value))
          }}
        />
        <label htmlFor="email"> {React.string("Email")} </label>
      </div>
      <div className="input-field col s12">
        <input
          id="password"
          className="validate"
          name="password"
          type_="password"
          required=true
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdatePassword(value))
          }}
        />
        <label htmlFor="password"> {React.string("Password")} </label>
      </div>
      <div className="input-field col s12">
        <input
          id="password-confirm"
          className="validate"
          name="password-confirm"
          type_="password"
          required=true
          onChange={evt => {
            let value = ReactEvent.Form.target(evt)["value"]
            dispatch(UpdatePasswordConfirm(value))
          }}
        />
        <label htmlFor="password-confirm"> {React.string("Confirm Password")} </label>
      </div>
      <div className="col s12">
        <div className="center">
          <button className="btn waves-effect waves-light blue" name="action" type_="submit">
            {React.string("Sign up")}
          </button>
        </div>
      </div>
    </form>
  </div>
}

// Export for JavaScript interop
let default = make
