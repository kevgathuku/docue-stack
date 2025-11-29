// AuthTypes.res - Type definitions for authentication state

// User name structure
type userName = {
  first: string,
  last: string,
}

// Role structure (populated from Role reference)
type userRole = {
  @as("_id") id: string,
  title: string,
  accessLevel: int,
}

// User type matching backend User model
type user = {
  @as("_id") id: string,
  username: string,
  name: userName,
  email: string,
  role: option<userRole>,
  loggedIn: option<bool>,
}

// Login credentials
type loginCredentials = {
  username: string,
  password: string,
}

// Signup data
type signupData = {
  firstname: string,
  lastname: string,
  username: string,
  email: string,
  password: string,
}

// Session state
type session = {
  loggedIn: bool,
  loading: bool,
}

// Auth state matching authSlice structure
type authState = {
  users: option<array<user>>,
  usersError: option<string>,
  session: session,
  sessionError: string,
  loginError: string,
  logoutResult: string,
  logoutError: string,
  signupError: option<string>,
  profileUpdateResult: option<user>,
  profileUpdateError: string,
  token: string,
  user: option<user>,
  loggedIn: option<user>,
}

// JSON Decoders

// Decode user name from JSON
let decodeUserName: JSON.t => result<userName, string> = json => {
  switch JSON.Decode.object(json) {
  | Some(obj) => {
      let first = Dict.get(obj, "first")
      let last = Dict.get(obj, "last")

      switch (first, last) {
      | (Some(firstJson), Some(lastJson)) => switch (
          JSON.Decode.string(firstJson),
          JSON.Decode.string(lastJson),
        ) {
        | (Some(firstStr), Some(lastStr)) => Ok({first: firstStr, last: lastStr})
        | _ => Error("Invalid name fields")
        }
      | _ => Error("Missing name fields")
      }
    }
  | None => Error("Invalid name object")
  }
}

// Decode user role from JSON
let decodeUserRole: JSON.t => result<userRole, string> = json => {
  switch JSON.Decode.object(json) {
  | Some(obj) => {
      let id = Dict.get(obj, "_id")
      let title = Dict.get(obj, "title")
      let accessLevel = Dict.get(obj, "accessLevel")

      switch (id, title, accessLevel) {
      | (Some(idJson), Some(titleJson), Some(accessLevelJson)) => switch (
          JSON.Decode.string(idJson),
          JSON.Decode.string(titleJson),
          JSON.Decode.float(accessLevelJson),
        ) {
        | (Some(idStr), Some(titleStr), Some(accessLevelNum)) =>
          Ok({
            id: idStr,
            title: titleStr,
            accessLevel: accessLevelNum->Belt.Float.toInt,
          })
        | _ => Error("Invalid role field types")
        }
      | _ => Error("Missing role fields")
      }
    }
  | None => Error("Invalid role object")
  }
}

// Decode user from JSON
let decodeUser: JSON.t => result<user, string> = json => {
  switch JSON.Decode.object(json) {
  | Some(obj) => {
      let id = Dict.get(obj, "_id")
      let username = Dict.get(obj, "username")
      let name = Dict.get(obj, "name")
      let email = Dict.get(obj, "email")
      let role = Dict.get(obj, "role")
      let loggedIn = Dict.get(obj, "loggedIn")

      switch (id, username, name, email) {
      | (Some(idJson), Some(usernameJson), Some(nameJson), Some(emailJson)) => switch (
          JSON.Decode.string(idJson),
          JSON.Decode.string(usernameJson),
          decodeUserName(nameJson),
          JSON.Decode.string(emailJson),
        ) {
        | (Some(idStr), Some(usernameStr), Ok(nameObj), Some(emailStr)) => {
            // Decode optional role
            let roleOpt = switch role {
            | Some(roleJson) => switch JSON.Decode.null(roleJson) {
              | Some(_) => None
              | None => switch decodeUserRole(roleJson) {
                | Ok(r) => Some(r)
                | Error(_) => None
                }
              }
            | None => None
            }

            // Decode optional loggedIn
            let loggedInOpt = switch loggedIn {
            | Some(loggedInJson) => JSON.Decode.bool(loggedInJson)
            | None => None
            }

            Ok({
              id: idStr,
              username: usernameStr,
              name: nameObj,
              email: emailStr,
              role: roleOpt,
              loggedIn: loggedInOpt,
            })
          }
        | _ => Error("Invalid user field types")
        }
      | _ => Error("Missing required user fields")
      }
    }
  | None => Error("Invalid user object")
  }
}

// Decode array of users from JSON
let decodeUsers: JSON.t => result<array<user>, string> = json => {
  switch JSON.Decode.array(json) {
  | Some(arr) => {
      let results = arr->Belt.Array.map(decodeUser)
      let errors = results->Belt.Array.keep(result => {
        switch result {
        | Error(_) => true
        | Ok(_) => false
        }
      })

      if Belt.Array.length(errors) > 0 {
        Error("Failed to decode some users")
      } else {
        let users = results->Belt.Array.keepMap(result => {
          switch result {
          | Ok(user) => Some(user)
          | Error(_) => None
          }
        })
        Ok(users)
      }
    }
  | None => Error("Invalid users array")
  }
}

// Encode user to JSON (for API requests)
let encodeUser: user => JSON.t = user => {
  let dict = Dict.make()

  Dict.set(dict, "_id", JSON.Encode.string(user.id))
  Dict.set(dict, "username", JSON.Encode.string(user.username))
  Dict.set(dict, "email", JSON.Encode.string(user.email))

  // Encode name
  let nameDict = Dict.make()
  Dict.set(nameDict, "first", JSON.Encode.string(user.name.first))
  Dict.set(nameDict, "last", JSON.Encode.string(user.name.last))
  Dict.set(dict, "name", JSON.Encode.object(nameDict))

  // Encode optional role
  switch user.role {
  | Some(role) => {
      let roleDict = Dict.make()
      Dict.set(roleDict, "_id", JSON.Encode.string(role.id))
      Dict.set(roleDict, "title", JSON.Encode.string(role.title))
      Dict.set(roleDict, "accessLevel", JSON.Encode.float(Belt.Int.toFloat(role.accessLevel)))
      Dict.set(dict, "role", JSON.Encode.object(roleDict))
    }
  | None => Dict.set(dict, "role", JSON.Encode.null)
  }

  // Encode optional loggedIn
  switch user.loggedIn {
  | Some(loggedIn) => Dict.set(dict, "loggedIn", JSON.Encode.bool(loggedIn))
  | None => ()
  }

  JSON.Encode.object(dict)
}

// Encode login credentials to JSON
let encodeLoginCredentials: loginCredentials => JSON.t = credentials => {
  let dict = Dict.make()
  Dict.set(dict, "username", JSON.Encode.string(credentials.username))
  Dict.set(dict, "password", JSON.Encode.string(credentials.password))
  JSON.Encode.object(dict)
}

// Encode signup data to JSON
let encodeSignupData: signupData => JSON.t = data => {
  let dict = Dict.make()
  Dict.set(dict, "firstname", JSON.Encode.string(data.firstname))
  Dict.set(dict, "lastname", JSON.Encode.string(data.lastname))
  Dict.set(dict, "username", JSON.Encode.string(data.username))
  Dict.set(dict, "email", JSON.Encode.string(data.email))
  Dict.set(dict, "password", JSON.Encode.string(data.password))
  JSON.Encode.object(dict)
}
