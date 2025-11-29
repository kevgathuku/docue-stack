// Test ReScript component to verify compilation and HMR
// This is a simple component to test the ReScript infrastructure

@react.component
let make = () => {
  let (count, setCount) = React.useState(() => 0)
  
  <div className="rescript-test-component">
    <h2> {React.string("ReScript Test Component - HMR Test")} </h2>
    <p> {React.string("Count: " ++ Belt.Int.toString(count))} </p>
    <button
      onClick={_ => setCount(prev => prev + 1)}
      className="btn waves-effect blue">
      {React.string("Increment")}
    </button>
    <p className="green-text">
      {React.string("✓ ReScript compilation working!")}
    </p>
    <p className="blue-text">
      {React.string("✓ Hot Module Replacement working!")}
    </p>
  </div>
}

let default = make
