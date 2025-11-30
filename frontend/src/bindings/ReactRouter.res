// ReScript bindings for React Router
// These bindings provide type-safe access to React Router from ReScript components

// Type for navigate function
type navigate = string => unit

// Hook to get navigate function
@module("react-router-dom")
external useNavigate: unit => navigate = "useNavigate"

// Link component for client-side navigation
module Link = {
  @module("react-router-dom") @react.component
  external make: (
    ~to: string,
    ~className: string=?,
    ~id: string=?,
    ~onClick: ReactEvent.Mouse.t => unit=?,
    ~children: React.element=?,
  ) => React.element = "Link"
}

// Example usage:
// let navigate = ReactRouter.useNavigate()
// navigate("/dashboard")
//
// <ReactRouter.Link to="/profile">
//   {React.string("Profile")}
// </ReactRouter.Link>
