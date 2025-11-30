// ReScript bindings for Materialize CSS
// These bindings provide type-safe access to Materialize toast notifications

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

// Example usage:
// Materialize.showSuccess("Login successful!")
// Materialize.showError("Invalid credentials")
