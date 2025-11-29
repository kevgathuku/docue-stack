// Landing.res - ReScript implementation of the Landing page component

@react.component
let make = () => {
  <div id="hero">
    <div className="container" id="hero-text-container">
      <div className="row">
        <div className="col s12 center-align">
          <h1 id="hero-title">
            <span className="bold"> {React.string("Docue    ")} </span>
            <span className="thin"> {React.string("is the simplest way for")} </span>
            <br />
            <span className="thin"> {React.string("you to manage your documents online")} </span>
          </h1>
        </div>
      </div>
      <div className="row">
        <div className="col s12">
          <div className="center-align">
            <a className="btn btn-large create-list-link hero-btn" href="/auth">
              {React.string("Get Started")}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
}

// Export for JavaScript interop
let default = make
