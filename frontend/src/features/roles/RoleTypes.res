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
let decodeRole: JSON.t => result<role, string> = json => {
  switch JSON.Decode.object(json) {
  | Some(obj) => {
      let id = Dict.get(obj, "_id")
      let title = Dict.get(obj, "title")
      let accessLevel = Dict.get(obj, "accessLevel")

      switch (id, title, accessLevel) {
      | (Some(idJson), Some(titleJson), Some(accessLevelJson)) =>
        switch (
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

// Decode role list from JSON
let decodeRoleList: JSON.t => result<roleList, string> = json => {
  switch JSON.Decode.array(json) {
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
let encodeRole: role => JSON.t = role => {
  let dict = Dict.make()
  Dict.set(dict, "_id", JSON.Encode.string(role.id))
  Dict.set(dict, "title", JSON.Encode.string(role.title))
  Dict.set(dict, "accessLevel", JSON.Encode.float(Belt.Int.toFloat(role.accessLevel)))
  JSON.Encode.object(dict)
}

// Encode role creation data to JSON (without _id)
let encodeRoleCreateData: string => JSON.t = title => {
  let dict = Dict.make()
  Dict.set(dict, "title", JSON.Encode.string(title))
  JSON.Encode.object(dict)
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
