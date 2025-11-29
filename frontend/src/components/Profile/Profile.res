// Profile.res - ReScript Profile component with view/edit toggle and validation

// Profile-specific user type (simpler than AuthTypes.user)
type profileUser = {
  id: string,
  email: string,
  firstName: string,
  lastName: string,
  role: option<string>,
}

// View mode type
type viewMode = ProfileView | EditView

// Password validation state
type passwordState = Empty | Valid | Invalid(string)

// Component state
type state = {
  viewMode: viewMode,
  user: profileUser,
  email: string,
  firstName: string,
  lastName: string,
  password: string,
  passwordConfirm: string,
  isSubmitting: bool,
  updateError: option<string>,
}

// Actions
type action =
  | ToggleEdit
  | UpdateEmail(string)
  | UpdateFirstName(string)
  | UpdateLastName(string)
  | UpdatePassword(string)
  | UpdatePasswordConfirm(string)
  | Submit
  | SubmitSuccess(profileUser)
  | SubmitError(string)
  | CancelEdit

// Validate password
let validatePassword = (password: string, passwordConfirm: string): passwordState => {
  if password == "" && passwordConfirm == "" {
    Empty
  } else if password != passwordConfirm {
    Invalid("Passwords don't match")
  } else if String.length(password) <= 6 {
    Invalid("Passwords should be > 6 characters")
  } else {
    Valid
  }
}

// Reducer
let reducer = (state: state, action: action): state => {
  switch action {
  | ToggleEdit => {
      ...state,
      viewMode: state.viewMode == ProfileView ? EditView : ProfileView,
      password: "",
      passwordConfirm: "",
      updateError: None,
    }
  | UpdateEmail(email) => {...state, email}
  | UpdateFirstName(firstName) => {...state, firstName}
  | UpdateLastName(lastName) => {...state, lastName}
  | UpdatePassword(password) => {...state, password}
  | UpdatePasswordConfirm(confirm) => {...state, passwordConfirm: confirm}
  | Submit => {...state, isSubmitting: true}
  | SubmitSuccess(user) => {
      viewMode: ProfileView,
      user,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: "",
      passwordConfirm: "",
      isSubmitting: false,
      updateError: None,
    }
  | SubmitError(error) => {...state, isSubmitting: false, updateError: Some(error)}
  | CancelEdit => {
      ...state,
      viewMode: ProfileView,
      email: state.user.email,
      firstName: state.user.firstName,
      lastName: state.user.lastName,
      password: "",
      passwordConfirm: "",
      updateError: None,
    }
  }
}

// Get base URL from environment
let getBaseUrl = (): string => {
  let nodeEnv = %raw(`process.env.NODE_ENV`)
  if nodeEnv == "development" {
    "http://localhost:8000"
  } else {
    "https://docue.herokuapp.com"
  }
}

// Decode profile user from JSON
let decodeProfileUser = (json: JSON.t): result<profileUser, string> => {
  switch JSON.Decode.object(json) {
  | Some(obj) => {
      let id = Dict.get(obj, "_id")
      let email = Dict.get(obj, "email")
      let name = Dict.get(obj, "name")
      let role = Dict.get(obj, "role")

      switch (id, email, name) {
      | (Some(idJson), Some(emailJson), Some(nameJson)) =>
        switch (
          JSON.Decode.string(idJson),
          JSON.Decode.string(emailJson),
          JSON.Decode.object(nameJson),
        ) {
        | (Some(idStr), Some(emailStr), Some(nameObj)) => {
            let firstName = switch Dict.get(nameObj, "first") {
            | Some(firstJson) => JSON.Decode.string(firstJson)
            | None => None
            }
            let lastName = switch Dict.get(nameObj, "last") {
            | Some(lastJson) => JSON.Decode.string(lastJson)
            | None => None
            }

            switch (firstName, lastName) {
            | (Some(first), Some(last)) => {
                // Decode optional role
                let roleTitle = switch role {
                | Some(roleJson) =>
                  switch JSON.Decode.object(roleJson) {
                  | Some(roleObj) =>
                    switch Dict.get(roleObj, "title") {
                    | Some(titleJson) => JSON.Decode.string(titleJson)
                    | None => None
                    }
                  | None => None
                  }
                | None => None
                }

                Ok({
                  id: idStr,
                  email: emailStr,
                  firstName: first,
                  lastName: last,
                  role: roleTitle,
                })
              }
            | _ => Error("Missing name fields")
            }
          }
        | _ => Error("Invalid user field types")
        }
      | _ => Error("Missing required user fields")
      }
    }
  | None => Error("Invalid user object")
  }
}

// Decode user update response
let decodeUserUpdateResponse = (json: JSON.t): result<profileUser, string> => {
  decodeProfileUser(json)
}

// Update user profile via API
let updateUserProfile = async (
  userId: string,
  token: string,
  email: string,
  firstName: string,
  lastName: string,
  password: option<string>,
): result<profileUser, string> => {
  let baseUrl = getBaseUrl()
  let url = `${baseUrl}/api/users/${userId}`

  // Create request body
  let body = Dict.make()
  Dict.set(body, "email", JSON.Encode.string(email))
  Dict.set(body, "firstname", JSON.Encode.string(firstName))
  Dict.set(body, "lastname", JSON.Encode.string(lastName))

  // Add password if provided
  switch password {
  | Some(pwd) => Dict.set(body, "password", JSON.Encode.string(pwd))
  | None => ()
  }

  let bodyJson = JSON.Encode.object(body)

  try {
    let response = await Fetch.put(url, bodyJson, Some(token))

    if Fetch.ok(response) {
      let data = await Fetch.json(response)
      decodeUserUpdateResponse(data)
    } else {
      let status = Fetch.status(response)
      Error(`Update failed with status ${Belt.Int.toString(status)}`)
    }
  } catch {
  | JsExn(obj) =>
    switch JsExn.message(obj) {
    | Some(msg) => Error(msg)
    | None => Error("Unknown error occurred")
    }
  }
}

// Save user info to localStorage
let saveUserInfo = (user: profileUser): unit => {
  let dict = Dict.make()
  Dict.set(dict, "_id", JSON.Encode.string(user.id))
  Dict.set(dict, "email", JSON.Encode.string(user.email))

  let nameDict = Dict.make()
  Dict.set(nameDict, "first", JSON.Encode.string(user.firstName))
  Dict.set(nameDict, "last", JSON.Encode.string(user.lastName))
  Dict.set(dict, "name", JSON.Encode.object(nameDict))

  switch user.role {
  | Some(roleTitle) => {
      let roleDict = Dict.make()
      Dict.set(roleDict, "title", JSON.Encode.string(roleTitle))
      Dict.set(dict, "role", JSON.Encode.object(roleDict))
    }
  | None => Dict.set(dict, "role", JSON.Encode.null)
  }

  let userInfoJson = JSON.Encode.object(dict)
  LocalStorage.setItem("userInfo", JSON.stringify(userInfoJson))
}

@react.component
let make = () => {
  // Get user from localStorage
  let initialUser = React.useMemo0(() => {
    switch LocalStorage.getItemOption("userInfo") {
    | Some(userInfoStr) =>
      try {
        let json = JSON.parseExn(userInfoStr)
        switch decodeProfileUser(json) {
        | Ok(user) => Some(user)
        | Error(_) => None
        }
      } catch {
      | _ => None
      }
    | None => None
    }
  })

  // Get token from localStorage
  let token = React.useMemo0(() => {
    LocalStorage.getItemOption("user")
  })

  // If no user, show loading
  let (hasUser, user) = switch initialUser {
  | Some(u) => (true, u)
  | None => (
      false,
      {
        id: "",
        email: "",
        firstName: "",
        lastName: "",
        role: None,
      },
    )
  }

  // Initialize state
  let initialState = {
    viewMode: ProfileView,
    user,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    password: "",
    passwordConfirm: "",
    isSubmitting: false,
    updateError: None,
  }

  let (state, dispatch) = React.useReducer(reducer, initialState)

  // Handle form submission
  let handleSubmit = (evt: ReactEvent.Form.t) => {
    ReactEvent.Form.preventDefault(evt)

    switch validatePassword(state.password, state.passwordConfirm) {
    | Empty => {
        // Submit without password
        dispatch(Submit)

        switch token {
        | Some(t) => {
            let updatePromise = async () => {
              let result = await updateUserProfile(
                state.user.id,
                t,
                state.email,
                state.firstName,
                state.lastName,
                None,
              )

              switch result {
              | Ok(updatedUser) => {
                  saveUserInfo(updatedUser)
                  dispatch(SubmitSuccess(updatedUser))
                  Materialize.showSuccess("Profile Info Updated!")
                }
              | Error(error) => {
                  dispatch(SubmitError(error))
                  Materialize.showError(error)
                }
              }
            }
            let _ = updatePromise()
          }
        | None => {
            dispatch(SubmitError("No authentication token found"))
            Materialize.showError("No authentication token found")
          }
        }
      }
    | Valid => {
        // Submit with password
        dispatch(Submit)

        switch token {
        | Some(t) => {
            let updatePromise = async () => {
              let result = await updateUserProfile(
                state.user.id,
                t,
                state.email,
                state.firstName,
                state.lastName,
                Some(state.password),
              )

              switch result {
              | Ok(updatedUser) => {
                  saveUserInfo(updatedUser)
                  dispatch(SubmitSuccess(updatedUser))
                  Materialize.showSuccess("Profile Info Updated!")
                }
              | Error(error) => {
                  dispatch(SubmitError(error))
                  Materialize.showError(error)
                }
              }
            }
            let _ = updatePromise()
          }
        | None => {
            dispatch(SubmitError("No authentication token found"))
            Materialize.showError("No authentication token found")
          }
        }
      }
    | Invalid(message) => Materialize.showError(message)
    }
  }

  // Render profile view
  let renderProfileView = () => {
    <div>
      <div className="row">
        <h2 className="header center-align"> {React.string("My Profile")} </h2>
      </div>
      <div className="row">
        <div className="col s8 offset-s2">
          <div className="card">
            <div className="card-image waves-effect waves-block waves-light">
              <img className="activator" alt="Profile logo" src="mountain.jpg" />
              <span className="card-title activator">
                {React.string(state.firstName ++ " " ++ state.lastName)}
              </span>
            </div>
            <div className="card-action">
              <a className="btn-floating" onClick={_ => dispatch(ToggleEdit)}>
                <i className="material-icons cyan lighten-1"> {React.string("edit")} </i>
              </a>
              <span className="card-title activator grey-text text-darken-4">
                <i className="material-icons right icon-align"> {React.string("more_vert")} </i>
              </span>
            </div>
            <div className="card-reveal">
              <span className="card-title grey-text text-darken-4 center">
                {React.string("Full Profile")}
                <i className="material-icons right"> {React.string("close")} </i>
              </span>
              <p className="flow-text">
                <i className="material-icons left icon-align"> {React.string("face")} </i>
                {React.string("Name: " ++ state.firstName ++ " " ++ state.lastName)}
              </p>
              <p className="flow-text">
                <i className="material-icons left icon-align"> {React.string("email")} </i>
                {React.string("Email: " ++ state.email)}
              </p>
              {switch state.user.role {
              | Some(roleTitle) =>
                <p className="flow-text">
                  <i className="material-icons left icon-align"> {React.string("settings")} </i>
                  {React.string("Role: " ++ roleTitle)}
                </p>
              | None => React.null
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  }

  // Render edit form
  let renderEditForm = () => {
    <div className="card-panel">
      <div className="row">
        <h2 className="header center-align"> {React.string("Edit Profile")} </h2>
      </div>
      <form className="col s10 offset-s1" onSubmit={handleSubmit}>
        <div className="row">
          <div className="col s4 offset-s4">
            <label htmlFor="email"> {React.string("Email")} </label>
            <input
              id="email"
              name="email"
              type_="text"
              value={state.email}
              onChange={evt => {
                let value = ReactEvent.Form.target(evt)["value"]
                dispatch(UpdateEmail(value))
              }}
            />
          </div>
        </div>
        <div className="row">
          <div className="col s4 offset-s4">
            <label htmlFor="firstname"> {React.string("First Name")} </label>
            <input
              id="firstname"
              name="firstname"
              type_="text"
              value={state.firstName}
              onChange={evt => {
                let value = ReactEvent.Form.target(evt)["value"]
                dispatch(UpdateFirstName(value))
              }}
            />
          </div>
        </div>
        <div className="row">
          <div className="col s4 offset-s4">
            <label htmlFor="lastname"> {React.string("Last Name")} </label>
            <input
              id="lastname"
              name="lastname"
              type_="text"
              value={state.lastName}
              onChange={evt => {
                let value = ReactEvent.Form.target(evt)["value"]
                dispatch(UpdateLastName(value))
              }}
            />
          </div>
        </div>
        <div className="row">
          <div className="col s4 offset-s4">
            <label htmlFor="password"> {React.string("New Password")} </label>
            <input
              id="password"
              name="password"
              type_="password"
              value={state.password}
              onChange={evt => {
                let value = ReactEvent.Form.target(evt)["value"]
                dispatch(UpdatePassword(value))
              }}
            />
          </div>
        </div>
        <div className="row">
          <div className="col s4 offset-s4">
            <label htmlFor="confirm-password"> {React.string("Confirm Password")} </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type_="password"
              value={state.passwordConfirm}
              onChange={evt => {
                let value = ReactEvent.Form.target(evt)["value"]
                dispatch(UpdatePasswordConfirm(value))
              }}
            />
          </div>
        </div>
        <div className="row">
          <div className="col s2 offset-s4">
            <button
              className="btn waves-effect red accent-2 center"
              onClick={evt => {
                ReactEvent.Mouse.preventDefault(evt)
                dispatch(CancelEdit)
              }}
            >
              {React.string("cancel")}
            </button>
          </div>
          <div className="col s2">
            <button
              className="btn waves-effect blue center" type_="submit" disabled={state.isSubmitting}
            >
              {React.string("update")}
            </button>
          </div>
        </div>
      </form>
    </div>
  }

  // Main render
  if !hasUser {
    <div className="container">
      <div className="progress">
        <div className="indeterminate" />
      </div>
      <p className="center-align"> {React.string("Loading profile...")} </p>
    </div>
  } else {
    <div className="container">
      {switch state.viewMode {
      | ProfileView => renderProfileView()
      | EditView => renderEditForm()
      }}
    </div>
  }
}

// Export for JavaScript interop
let default = make
