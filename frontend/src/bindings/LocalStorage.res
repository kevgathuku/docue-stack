// ReScript bindings for localStorage
// These bindings provide type-safe access to browser localStorage

// Set item in localStorage
@scope("localStorage") @val
external setItem: (string, string) => unit = "setItem"

// Remove item from localStorage
@scope("localStorage") @val
external removeItem: string => unit = "removeItem"

// Clear all localStorage
@scope("localStorage") @val
external clear: unit => unit = "clear"

// Helper to get item as option - uses raw JS to avoid runtime dependencies
// Note: _key is prefixed with _ to silence "unused variable" warning
// The variable IS used inside the raw JS, but compiler can't see it
let getItemOption = (_key: string): option<string> => {
  let value = %raw(`localStorage.getItem(_key)`)
  if %raw(`value === null || value === undefined`) {
    None
  } else {
    Some(value)
  }
}

// Example usage:
// LocalStorage.setItem("token", "abc123")
// let token = LocalStorage.getItemOption("token")
