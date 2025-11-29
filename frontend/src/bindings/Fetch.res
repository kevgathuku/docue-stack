// ReScript bindings for Fetch API
// These bindings provide type-safe HTTP requests

// HTTP methods
type method = 
  | GET
  | POST
  | PUT
  | DELETE
  | PATCH

// Convert method to string
let methodToString = (method: method): string => {
  switch method {
  | GET => "GET"
  | POST => "POST"
  | PUT => "PUT"
  | DELETE => "DELETE"
  | PATCH => "PATCH"
  }
}

// Request options
type requestOptions = {
  method: string,
  headers: dict<string>,
  body: option<string>,
}

// Response type
type response

// External fetch function
@val
external fetch: (string, requestOptions) => promise<response> = "fetch"

// Get response as JSON
@send
external json: response => promise<JSON.t> = "json"

// Get response as text
@send
external text: response => promise<string> = "text"

// Check if response is ok
@get
external ok: response => bool = "ok"

// Get response status
@get
external status: response => int = "status"

// Helper to create headers with auth token
let createAuthHeaders = (token: option<string>): dict<string> => {
  let headers = Dict.make()
  Dict.set(headers, "Content-Type", "application/json")
  
  switch token {
  | Some(t) => Dict.set(headers, "x-access-token", t)
  | None => ()
  }
  
  headers
}

// Helper to make GET request
let get = (url: string, token: option<string>): promise<response> => {
  fetch(url, {
    method: methodToString(GET),
    headers: createAuthHeaders(token),
    body: None,
  })
}

// Helper to make POST request
let post = (url: string, body: JSON.t, token: option<string>): promise<response> => {
  fetch(url, {
    method: methodToString(POST),
    headers: createAuthHeaders(token),
    body: Some(JSON.stringify(body)),
  })
}

// Helper to make PUT request
let put = (url: string, body: JSON.t, token: option<string>): promise<response> => {
  fetch(url, {
    method: methodToString(PUT),
    headers: createAuthHeaders(token),
    body: Some(JSON.stringify(body)),
  })
}

// Helper to make DELETE request
let delete = (url: string, token: option<string>): promise<response> => {
  fetch(url, {
    method: methodToString(DELETE),
    headers: createAuthHeaders(token),
    body: None,
  })
}

// Example usage:
// let response = await Fetch.get("/api/users", Some(token))
// let data = await Fetch.json(response)
