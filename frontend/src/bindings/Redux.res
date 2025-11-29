// ReScript bindings for Redux Toolkit
// These bindings provide type-safe access to Redux from ReScript components

// Type for Redux dispatch function
type dispatch<'action> = 'action => unit

// Hook to get dispatch function from Redux
@module("react-redux")
external useDispatch: unit => dispatch<'action> = "useDispatch"

// Hook to select from Redux store
@module("react-redux")
external useSelector: ('store => 'selected) => 'selected = "useSelector"

// Example usage:
// let dispatch = Redux.useDispatch()
// let user = Redux.useSelector(store => store.auth.user)
