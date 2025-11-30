// ReScript bindings for React Router
// These bindings provide type-safe access to React Router from ReScript components

// Type for navigate function
type navigate = string => unit

// Hook to get navigate function
@module("react-router-dom")
external useNavigate: unit => navigate = "useNavigate"

// Example usage:
// let navigate = ReactRouter.useNavigate()
// navigate("/dashboard")
