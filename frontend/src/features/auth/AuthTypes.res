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
let decodeUserName: Js.Json.t => result<userName, string> = json => {
  switch Js.Json.decodeObject(json) {
  | Some(obj) => {
      let first = Js.Dict.get(obj, "first")
      let last = Js.Dict.get(obj, "last")
      
      switch (first, last) {
      | (Some(firstJson), Some(lastJson)) => {
          switch (Js.Json.decodeString(firstJson), Js.Json.decodeString(lastJson)) {
          | (Some(firstStr), Some(lastStr)) => 
              Ok({first: firstStr, last: lastStr})
          | _ => Error("Invalid name fields")
          }
        }
      | _ => Error("Missing name fields")
      }
    }
  | None => Error("Invalid name object")
  }
}

// Decode user role from JSON
let decodeUserRole: Js.Json.t => result<userRole, string> = json => {
  switch Js.Json.decodeObject(json) {
  | Some(obj) => {
      let id = Js.Dict.get(obj, "_id")
      let title = Js.Dict.get(obj, "title")
      let accessLevel = Js.Dict.get(obj, "accessLevel")
      
      switch (id, title, accessLevel) {
      | (Some(idJson), Some(titleJson), Some(accessLevelJson)) => {
          switch (
            Js.Json.decodeString(idJson),
            Js.Json.decodeString(titleJson),
            Js.Json.decodeNumber(accessLevelJson)
          ) {
          | (Some(idStr), Some(titleStr), Some(accessLevelNum)) =>
              Ok({
                id: idStr,
                title: titleStr,
                accessLevel: accessLevelNum->Belt.Float.toInt,
              })
          | _ => Error("Invalid role field types")
          }
        }
      | _ => Error("Missing role fields")
      }
    }
  | None => Error("Invalid role object")
  }
}

// Decode user from JSON
let decodeUser: Js.Json.t => result<user, string> = json => {
  switch Js.Json.decodeObject(json) {
  | Some(obj) => {
      let id = Js.Dict.get(obj, "_id")
      let username = Js.Dict.get(obj, "username")
      let name = Js.Dict.get(obj, "name")
      let email = Js.Dict.get(obj, "email")
      let role = Js.Dict.get(obj, "role")
      let loggedIn = Js.Dict.get(obj, "loggedIn")
      
      switch (id, username, name, email) {
      | (Some(idJson), Some(usernameJson), Some(nameJson), Some(emailJson)) => {
          switch (
            Js.Json.decodeString(idJson),
            Js.Json.decodeString(usernameJson),
            decodeUserName(nameJson),
            Js.Json.decodeString(emailJson)
          ) {
          | (Some(idStr), Some(usernameStr), Ok(nameObj), Some(emailStr)) => {
              // Decode optional role
              let roleOpt = switch role {
              | Some(roleJson) => {
                  switch Js.Json.decodeNull(roleJson) {
                  | Some(_) => None
                  | None => {
                      switch decodeUserRole(roleJson) {
                      | Ok(r) => Some(r)
                      | Error(_) => None
                      }
                    }
                  }
                }
              | None => None
              }
              
              // Decode optional loggedIn
              let loggedInOpt = switch loggedIn {
              | Some(loggedInJson) => Js.Json.decodeBoolean(loggedInJson)
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
        }
      | _ => Error("Missing required user fields")
      }
    }
  | None => Error("Invalid user object")
  }
}

// Decode array of users from JSON
let decodeUsers: Js.Json.t => result<array<user>, string> = json => {
  switch Js.Json.decodeArray(json) {
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
let encodeUser: user => Js.Json.t = user => {
  let dict = Js.Dict.empty()
  
  Js.Dict.set(dict, "_id", Js.Json.string(user.id))
  Js.Dict.set(dict, "username", Js.Json.string(user.username))
  Js.Dict.set(dict, "email", Js.Json.string(user.email))
  
  // Encode name
  let nameDict = Js.Dict.empty()
  Js.Dict.set(nameDict, "first", Js.Json.string(user.name.first))
  Js.Dict.set(nameDict, "last", Js.Json.string(user.name.last))
  Js.Dict.set(dict, "name", Js.Json.object_(nameDict))
  
  // Encode optional role
  switch user.role {
  | Some(role) => {
      let roleDict = Js.Dict.empty()
      Js.Dict.set(roleDict, "_id", Js.Json.string(role.id))
      Js.Dict.set(roleDict, "title", Js.Json.string(role.title))
      Js.Dict.set(roleDict, "accessLevel", Js.Json.number(Belt.Int.toFloat(role.accessLevel)))
      Js.Dict.set(dict, "role", Js.Json.object_(roleDict))
    }
  | None => Js.Dict.set(dict, "role", Js.Json.null)
  }
  
  // Encode optional loggedIn
  switch user.loggedIn {
  | Some(loggedIn) => Js.Dict.set(dict, "loggedIn", Js.Json.boolean(loggedIn))
  | None => ()
  }
  
  Js.Json.object_(dict)
}

// Encode login credentials to JSON
let encodeLoginCredentials: loginCredentials => Js.Json.t = credentials => {
  let dict = Js.Dict.empty()
  Js.Dict.set(dict, "username", Js.Json.string(credentials.username))
  Js.Dict.set(dict, "password", Js.Json.string(credentials.password))
  Js.Json.object_(dict)
}

// Encode signup data to JSON
let encodeSignupData: signupData => Js.Json.t = data => {
  let dict = Js.Dict.empty()
  Js.Dict.set(dict, "firstname", Js.Json.string(data.firstname))
  Js.Dict.set(dict, "lastname", Js.Json.string(data.lastname))
  Js.Dict.set(dict, "username", Js.Json.string(data.username))
  Js.Dict.set(dict, "email", Js.Json.string(data.email))
  Js.Dict.set(dict, "password", Js.Json.string(data.password))
  Js.Json.object_(dict)
}
