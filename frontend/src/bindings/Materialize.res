// ReScript bindings for Materialize CSS
// These bindings provide type-safe access to Materialize toast notifications and component initialization

// External binding to Materialize toast (uses window.Materialize.toast)
@scope(("window", "Materialize")) @val
external toast: (string, int, string) => unit = "toast"

// Helper to show success toast
let showSuccess = (message: string): unit => {
  toast(message, 2000, "success-toast")
}

// Helper to show error toast
let showError = (message: string): unit => {
  toast(message, 2000, "error-toast")
}

// Helper to show info toast
let showInfo = (message: string): unit => {
  toast(message, 2000, "info-toast")
}

// Initialize Materialize dropdown components
let initDropdown = (): unit => {
  try {
    %raw(`window.$('.dropdown-button').dropdown()`)
  } catch {
  | _ => () // Silently fail if jQuery/Materialize not loaded
  }
}

// Initialize Materialize sidenav components
let initSideNav = (): unit => {
  try {
    %raw(`window.$('.button-collapse').sideNav()`)
  } catch {
  | _ => () // Silently fail if jQuery/Materialize not loaded
  }
}

// Initialize Materialize tooltips
let initTooltips = (): unit => {
  try {
    %raw(`window.$('.tooltipped').tooltip()`)
  } catch {
  | _ => () // Silently fail if jQuery/Materialize not loaded
  }
}

// Example usage:
// Materialize.showSuccess("Login successful!")
// Materialize.showError("Invalid credentials")
// Materialize.initDropdown()
// Materialize.initSideNav()
