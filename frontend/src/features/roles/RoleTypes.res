// RoleTypes.res - Type definitions for roles state

// Role type matching backend Role model
type role = {
  @as("_id") id: string,
  title: string,
  accessLevel: int,
}

// Role list type
type roleList = array<role>

// Roles state matching rolesSlice structure
type rolesState = {
  createdRole: option<role>,
  roles: option<roleList>,
  loading: bool,
  error: option<string>,
}

// JSON Decoders

// Decode role from JSON
let decodeRole: Js.Json.t => result<role, string> = json => {
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

// Decode role list from JSON
let decodeRoleList: Js.Json.t => result<roleList, string> = json => {
  switch Js.Json.decodeArray(json) {
  | Some(arr) => {
      let results = arr->Belt.Array.map(decodeRole)
      let errors = results->Belt.Array.keep(result => {
        switch result {
        | Error(_) => true
        | Ok(_) => false
        }
      })
      
      if Belt.Array.length(errors) > 0 {
        Error("Failed to decode some roles")
      } else {
        let roles = results->Belt.Array.keepMap(result => {
          switch result {
          | Ok(role) => Some(role)
          | Error(_) => None
          }
        })
        Ok(roles)
      }
    }
  | None => Error("Invalid role list array")
  }
}

// Encode role to JSON (for API requests)
let encodeRole: role => Js.Json.t = role => {
  let dict = Js.Dict.empty()
  Js.Dict.set(dict, "_id", Js.Json.string(role.id))
  Js.Dict.set(dict, "title", Js.Json.string(role.title))
  Js.Dict.set(dict, "accessLevel", Js.Json.number(Belt.Int.toFloat(role.accessLevel)))
  Js.Json.object_(dict)
}

// Encode role creation data to JSON (without _id)
let encodeRoleCreateData: string => Js.Json.t = title => {
  let dict = Js.Dict.empty()
  Js.Dict.set(dict, "title", Js.Json.string(title))
  Js.Json.object_(dict)
}

// Access level constants matching backend
module AccessLevel = {
  let viewer = 0
  let staff = 1
  let admin = 2
  
  let toString = (level: int): string => {
    switch level {
    | 0 => "viewer"
    | 1 => "staff"
    | 2 => "admin"
    | _ => "unknown"
    }
  }
  
  let fromString = (str: string): option<int> => {
    switch str {
    | "viewer" => Some(0)
    | "staff" => Some(1)
    | "admin" => Some(2)
    | _ => None
    }
  }
}
