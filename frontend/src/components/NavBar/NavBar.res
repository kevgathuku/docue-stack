// NavBar.res - Navigation bar with authentication state

open Redux
open ReactRouter
open LocalStorage
open Materialize

// External binding for logout action from authSlice
@module("../../features/auth/authSlice")
external logout: string => {..} = "logout"

// External bindings for Materialize helpers (data-* attributes not supported in ReScript JSX)
@module("./MaterializeHelpers")
external createDropdownButton: (string, ReactEvent.Mouse.t => unit) => React.element = "createDropdownButton"

@module("./MaterializeHelpers")
external createMobileMenuButton: (ReactEvent.Mouse.t => unit) => React.element = "createMobileMenuButton"

@react.component
let make = (~pathname: string) => {
  // Redux hooks
  let reduxDispatch = useDispatch()
  let navigate = useNavigate()
  
  // Select auth state from Redux store (same pattern as Login component)
  let user = useSelector((store: {..}) => {
    store["auth"]["user"]
  })
  
  let session = useSelector((store: {..}) => {
    store["auth"]["session"]
  })
  
  let logoutResult = useSelector((store: {..}) => {
    store["auth"]["logoutResult"]
  })
  
  // Extract user data with memoization
  let (loggedIn, userFirstName, isAdmin) = React.useMemo2(() => {
    // Check if user has valid ID using dictionary access
    let userId = user["_id"]
    let hasId = switch Nullable.toOption(userId) {
    | Some(id) => id != ""
    | None => false
    }
    
    let sessionLoggedIn = session["loggedIn"]
    let loggedIn = hasId && sessionLoggedIn
    
    // Extract first name using nested dictionary access
    let firstName = switch Nullable.toOption(user["name"]) {
    | Some(name) =>
      switch Nullable.toOption(name["first"]) {
      | Some(first) => first
      | None => ""
      }
    | None => ""
    }
    
    // Extract role title using nested dictionary access
    let roleTitle = switch Nullable.toOption(user["role"]) {
    | Some(role) =>
      switch Nullable.toOption(role["title"]) {
      | Some(title) => title
      | None => ""
      }
    | None => ""
    }
    
    let isAdmin = roleTitle == "admin"
    
    (loggedIn, firstName, isAdmin)
  }, (user, session))
  
  // Initialize Materialize components on mount and when login state changes
  React.useEffect1(() => {
    initDropdown()
    initSideNav()
    None
  }, [loggedIn])
  
  // Handle logout result - redirect when logout completes
  // Note: localStorage cleanup is handled by the logout thunk in authSlice
  React.useEffect1(() => {
    if logoutResult != "" {
      navigate("/")
    }
    None
  }, [logoutResult])
  
  // Handle logout click
  let handleLogout = React.useCallback0((evt: ReactEvent.Mouse.t) => {
    ReactEvent.Mouse.preventDefault(evt)
    
    switch getItemOption("user") {
    | Some(token) => {
        // Dispatch logout action
        reduxDispatch(logout(token))
      }
    | None => ()
    }
  })
  
  // Don't render navbar on home page
  if pathname == "/" {
    React.null
  } else {
    // Render navbar with proper React Router Links for client-side navigation
    <nav className="transparent black-text" role="navigation">
      <div className="nav-wrapper container">
        <ReactRouter.Link
          to={loggedIn ? "/dashboard" : "/"}
          className="brand-logo brand-logo-small"
        >
          <img alt="Docue Logo" id="header-logo" src="/favicon.png" />
          {React.string("Docue")}
        </ReactRouter.Link>
        
        // Mobile menu button
        <React.Fragment>
          {createMobileMenuButton(evt => ReactEvent.Mouse.preventDefault(evt))}
        </React.Fragment>
        
        <ul className="side-nav" id="mobile-demo">
          <li>
            <ReactRouter.Link to="/">
              {React.string("Home")}
            </ReactRouter.Link>
          </li>
          <li>
            {loggedIn
              ? <ReactRouter.Link to="/profile">
                  {React.string("Profile")}
                </ReactRouter.Link>
              : <ReactRouter.Link to="/auth">
                  {React.string("Login")}
                </ReactRouter.Link>}
          </li>
          <li>
            {loggedIn
              ? <a href="#" onClick={handleLogout}>
                  {React.string("Logout")}
                </a>
              : <ReactRouter.Link to="/auth">
                  {React.string("Sign Up")}
                </ReactRouter.Link>}
          </li>
        </ul>
        
        // Desktop nav
        <ul className="right hide-on-med-and-down" id="nav-mobile">
          <li>
            {loggedIn
              ? <div>
                  <ul id="dropdown" className="dropdown-content">
                    <li>
                      <ReactRouter.Link to="/profile">
                        {React.string("My Profile")}
                      </ReactRouter.Link>
                    </li>
                    <li>
                      <ReactRouter.Link to="/dashboard">
                        {React.string("All Documents")}
                      </ReactRouter.Link>
                    </li>
                    {isAdmin
                      ? <li>
                          <ReactRouter.Link to="/admin">
                            {React.string("Settings")}
                          </ReactRouter.Link>
                        </li>
                      : React.null}
                    <li className="divider" />
                    <li>
                      <a href="#" id="logout-btn" onClick={handleLogout}>
                        {React.string(" Logout")}
                      </a>
                    </li>
                  </ul>
                  <React.Fragment>
                    {createDropdownButton(userFirstName, evt => ReactEvent.Mouse.preventDefault(evt))}
                  </React.Fragment>
                </div>
              : React.null}
          </li>
        </ul>
      </div>
    </nav>
  }
}

// Export for JavaScript interop
let default = make
