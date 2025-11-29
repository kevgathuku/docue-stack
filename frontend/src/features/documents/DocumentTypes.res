// DocumentTypes.res - Type definitions for documents state

// Document type matching backend Document model
type document = {
  @as("_id") id: string,
  title: string,
  content: option<string>,
  ownerId: string,
  role: option<string>, // Role ID reference
  dateCreated: option<string>,
  lastModified: option<string>,
}

// Document list type
type documentList = array<document>

// Document operation result (for edit/delete operations)
type documentOperationResult = {
  data: option<Js.Json.t>,
  statusCode: int,
}

// Documents state matching documentsSlice structure
type documentsState = {
  doc: option<document>,
  docs: option<documentList>,
  docCreateResult: option<document>,
  docDeleteResult: option<documentOperationResult>,
  docEditResult: option<documentOperationResult>,
  loading: bool,
  error: option<string>,
}

// JSON Decoders

// Decode document from JSON
let decodeDocument: Js.Json.t => result<document, string> = json => {
  switch Js.Json.decodeObject(json) {
  | Some(obj) => {
      let id = Js.Dict.get(obj, "_id")
      let title = Js.Dict.get(obj, "title")
      let content = Js.Dict.get(obj, "content")
      let ownerId = Js.Dict.get(obj, "ownerId")
      let role = Js.Dict.get(obj, "role")
      let dateCreated = Js.Dict.get(obj, "dateCreated")
      let lastModified = Js.Dict.get(obj, "lastModified")
      
      switch (id, title, ownerId) {
      | (Some(idJson), Some(titleJson), Some(ownerIdJson)) => {
          switch (
            Js.Json.decodeString(idJson),
            Js.Json.decodeString(titleJson),
            Js.Json.decodeString(ownerIdJson)
          ) {
          | (Some(idStr), Some(titleStr), Some(ownerIdStr)) => {
              // Decode optional content
              let contentOpt = switch content {
              | Some(contentJson) => Js.Json.decodeString(contentJson)
              | None => None
              }
              
              // Decode optional role
              let roleOpt = switch role {
              | Some(roleJson) => {
                  switch Js.Json.decodeNull(roleJson) {
                  | Some(_) => None
                  | None => Js.Json.decodeString(roleJson)
                  }
                }
              | None => None
              }
              
              // Decode optional dateCreated
              let dateCreatedOpt = switch dateCreated {
              | Some(dateJson) => Js.Json.decodeString(dateJson)
              | None => None
              }
              
              // Decode optional lastModified
              let lastModifiedOpt = switch lastModified {
              | Some(dateJson) => Js.Json.decodeString(dateJson)
              | None => None
              }
              
              Ok({
                id: idStr,
                title: titleStr,
                content: contentOpt,
                ownerId: ownerIdStr,
                role: roleOpt,
                dateCreated: dateCreatedOpt,
                lastModified: lastModifiedOpt,
              })
            }
          | _ => Error("Invalid document field types")
          }
        }
      | _ => Error("Missing required document fields")
      }
    }
  | None => Error("Invalid document object")
  }
}

// Decode document list from JSON
let decodeDocumentList: Js.Json.t => result<documentList, string> = json => {
  switch Js.Json.decodeArray(json) {
  | Some(arr) => {
      let results = arr->Belt.Array.map(decodeDocument)
      let errors = results->Belt.Array.keep(result => {
        switch result {
        | Error(_) => true
        | Ok(_) => false
        }
      })
      
      if Belt.Array.length(errors) > 0 {
        Error("Failed to decode some documents")
      } else {
        let documents = results->Belt.Array.keepMap(result => {
          switch result {
          | Ok(doc) => Some(doc)
          | Error(_) => None
          }
        })
        Ok(documents)
      }
    }
  | None => Error("Invalid document list array")
  }
}

// Encode document to JSON (for API requests)
let encodeDocument: document => Js.Json.t = doc => {
  let dict = Js.Dict.empty()
  
  Js.Dict.set(dict, "_id", Js.Json.string(doc.id))
  Js.Dict.set(dict, "title", Js.Json.string(doc.title))
  Js.Dict.set(dict, "ownerId", Js.Json.string(doc.ownerId))
  
  // Encode optional content
  switch doc.content {
  | Some(content) => Js.Dict.set(dict, "content", Js.Json.string(content))
  | None => Js.Dict.set(dict, "content", Js.Json.null)
  }
  
  // Encode optional role
  switch doc.role {
  | Some(role) => Js.Dict.set(dict, "role", Js.Json.string(role))
  | None => Js.Dict.set(dict, "role", Js.Json.null)
  }
  
  // Encode optional dateCreated
  switch doc.dateCreated {
  | Some(date) => Js.Dict.set(dict, "dateCreated", Js.Json.string(date))
  | None => ()
  }
  
  // Encode optional lastModified
  switch doc.lastModified {
  | Some(date) => Js.Dict.set(dict, "lastModified", Js.Json.string(date))
  | None => ()
  }
  
  Js.Json.object_(dict)
}

// Encode document creation data to JSON (without _id, timestamps)
let encodeDocumentCreateData: (~title: string, ~content: option<string>, ~role: option<string>) => Js.Json.t = 
  (~title, ~content, ~role) => {
    let dict = Js.Dict.empty()
    Js.Dict.set(dict, "title", Js.Json.string(title))
    
    switch content {
    | Some(c) => Js.Dict.set(dict, "content", Js.Json.string(c))
    | None => ()
    }
    
    switch role {
    | Some(r) => Js.Dict.set(dict, "role", Js.Json.string(r))
    | None => ()
    }
    
    Js.Json.object_(dict)
  }

// Encode document update data to JSON
let encodeDocumentUpdateData: (~title: option<string>, ~content: option<string>, ~role: option<string>) => Js.Json.t = 
  (~title, ~content, ~role) => {
    let dict = Js.Dict.empty()
    
    switch title {
    | Some(t) => Js.Dict.set(dict, "title", Js.Json.string(t))
    | None => ()
    }
    
    switch content {
    | Some(c) => Js.Dict.set(dict, "content", Js.Json.string(c))
    | None => ()
    }
    
    switch role {
    | Some(r) => Js.Dict.set(dict, "role", Js.Json.string(r))
    | None => ()
    }
    
    Js.Json.object_(dict)
  }
