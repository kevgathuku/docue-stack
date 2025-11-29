// ReScript bindings for Materialize CSS
// These bindings provide type-safe access to Materialize toast notifications

// Toast options type
type toastOptions = {
  html: string,
  displayLength: int,
  classes: string,
}

// External binding to Materialize toast
@scope("M") @val
external toast: toastOptions => unit = "toast"

// Helper to show success toast
let showSuccess = (message: string): unit => {
  toast({
    html: message,
    displayLength: 2000,
    classes: "green rounded",
  })
}

// Helper to show error toast
let showError = (message: string): unit => {
  toast({
    html: message,
    displayLength: 3000,
    classes: "red rounded",
  })
}

// Helper to show info toast
let showInfo = (message: string): unit => {
  toast({
    html: message,
    displayLength: 2000,
    classes: "blue rounded",
  })
}

// Example usage:
// Materialize.showSuccess("Login successful!")
// Materialize.showError("Invalid credentials")
