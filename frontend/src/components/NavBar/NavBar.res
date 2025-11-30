// NavBar.res - Navigation bar with authentication state

open Redux
open ReactRouter
open LocalStorage
open Materialize

// External binding for logout action from authSlice
@module("../../features/auth/authSlice")
external logout: string => {..} = "logout"

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
    // Render navbar - use raw function to pass variables into JSX scope
    let renderNav = %raw(`
      function(loggedIn, userFirstName, isAdmin, handleLogout) {
        return (
          <nav className="transparent black-text" role="navigation">
            <div className="nav-wrapper container">
              <a 
                className="brand-logo brand-logo-small"
                href={loggedIn ? "/dashboard" : "/"}
              >
                <img alt="Docue Logo" id="header-logo" src="/favicon.png" />
                {"      Docue"}
              </a>
              <a 
                href="#" 
                data-activates="mobile-demo" 
                className="button-collapse"
              >
                <i className="material-icons" style={{color: 'grey'}}>
                  menu
                </i>
              </a>
              
              <ul className="side-nav" id="mobile-demo">
                <li>
                  <a href="/">Home</a>
                </li>
                <li>
                  {loggedIn ? (
                    <a href="/profile">Profile</a>
                  ) : (
                    <a href="/auth">Login</a>
                  )}
                </li>
                <li>
                  {loggedIn ? (
                    <a href="#" onClick={handleLogout}>Logout</a>
                  ) : (
                    <a href="/auth">Sign Up</a>
                  )}
                </li>
              </ul>
              
              <ul className="right hide-on-med-and-down" id="nav-mobile">
                <li>
                  {loggedIn ? (
                    <div>
                      <ul id="dropdown" className="dropdown-content">
                        <li>
                          <a href="/profile">My Profile</a>
                        </li>
                        <li>
                          <a href="/dashboard">All Documents</a>
                        </li>
                        {isAdmin ? (
                          <li>
                            <a href="/admin">Settings</a>
                          </li>
                        ) : null}
                        <li className="divider"></li>
                        <li>
                          <a href="#" id="logout-btn" onClick={handleLogout}> Logout</a>
                        </li>
                      </ul>
                      <a 
                        className="dropdown-button"
                        data-activates="dropdown"
                        data-beloworigin="true"
                        data-constrainwidth="false"
                      >
                        {userFirstName}
                        <i className="material-icons right">arrow_drop_down</i>
                      </a>
                    </div>
                  ) : null}
                </li>
              </ul>
            </div>
          </nav>
        );
      }
    `)
    
    renderNav(loggedIn, userFirstName, isAdmin, handleLogout)
  }
}

// Export for JavaScript interop
let default = make
