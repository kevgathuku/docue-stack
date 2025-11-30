// NotFound.res - ReScript implementation of the NotFound error page component

@react.component
let make = () => {
  <div className="container">
    <div className="card-panel">
      <div className="row">
        <h2 className="header center-align"> {React.string("Not Found")} </h2>
      </div>
      <div className="row">
        <p className="flow-text center-align">
          {React.string("Sorry. This is not the page you were looking for")}
        </p>
      </div>
    </div>
  </div>
}

// Export for JavaScript interop
let default = make
