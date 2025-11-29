// ReScript bindings for localStorage
// These bindings provide type-safe access to browser localStorage

// Get item from localStorage (returns nullable)
@scope("localStorage") @val
external getItem: string => Nullable.t<string> = "getItem"

// Set item in localStorage
@scope("localStorage") @val
external setItem: (string, string) => unit = "setItem"

// Remove item from localStorage
@scope("localStorage") @val
external removeItem: string => unit = "removeItem"

// Clear all localStorage
@scope("localStorage") @val
external clear: unit => unit = "clear"

// Helper to get item as option
let getItemOption = (key: string): option<string> => {
  getItem(key)->Nullable.toOption
}

// Example usage:
// LocalStorage.setItem("token", "abc123")
// let token = LocalStorage.getItemOption("token")
