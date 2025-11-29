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
  data: option<JSON.t>,
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
let decodeDocument: JSON.t => result<document, string> = json => {
  switch JSON.Decode.object(json) {
  | Some(obj) => {
      let id = Dict.get(obj, "_id")
      let title = Dict.get(obj, "title")
      let content = Dict.get(obj, "content")
      let ownerId = Dict.get(obj, "ownerId")
      let role = Dict.get(obj, "role")
      let dateCreated = Dict.get(obj, "dateCreated")
      let lastModified = Dict.get(obj, "lastModified")

      switch (id, title, ownerId) {
      | (Some(idJson), Some(titleJson), Some(ownerIdJson)) =>
        switch (
          JSON.Decode.string(idJson),
          JSON.Decode.string(titleJson),
          JSON.Decode.string(ownerIdJson),
        ) {
        | (Some(idStr), Some(titleStr), Some(ownerIdStr)) => {
            // Decode optional content
            let contentOpt = switch content {
            | Some(contentJson) => JSON.Decode.string(contentJson)
            | None => None
            }

            // Decode optional role
            let roleOpt = switch role {
            | Some(roleJson) =>
              switch JSON.Decode.null(roleJson) {
              | Some(_) => None
              | None => JSON.Decode.string(roleJson)
              }
            | None => None
            }

            // Decode optional dateCreated
            let dateCreatedOpt = switch dateCreated {
            | Some(dateJson) => JSON.Decode.string(dateJson)
            | None => None
            }

            // Decode optional lastModified
            let lastModifiedOpt = switch lastModified {
            | Some(dateJson) => JSON.Decode.string(dateJson)
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
      | _ => Error("Missing required document fields")
      }
    }
  | None => Error("Invalid document object")
  }
}

// Decode document list from JSON
let decodeDocumentList: JSON.t => result<documentList, string> = json => {
  switch JSON.Decode.array(json) {
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
let encodeDocument: document => JSON.t = doc => {
  let dict = Dict.make()

  Dict.set(dict, "_id", JSON.Encode.string(doc.id))
  Dict.set(dict, "title", JSON.Encode.string(doc.title))
  Dict.set(dict, "ownerId", JSON.Encode.string(doc.ownerId))

  // Encode optional content
  switch doc.content {
  | Some(content) => Dict.set(dict, "content", JSON.Encode.string(content))
  | None => Dict.set(dict, "content", JSON.Encode.null)
  }

  // Encode optional role
  switch doc.role {
  | Some(role) => Dict.set(dict, "role", JSON.Encode.string(role))
  | None => Dict.set(dict, "role", JSON.Encode.null)
  }

  // Encode optional dateCreated
  switch doc.dateCreated {
  | Some(date) => Dict.set(dict, "dateCreated", JSON.Encode.string(date))
  | None => ()
  }

  // Encode optional lastModified
  switch doc.lastModified {
  | Some(date) => Dict.set(dict, "lastModified", JSON.Encode.string(date))
  | None => ()
  }

  JSON.Encode.object(dict)
}

// Encode document creation data to JSON (without _id, timestamps)
let encodeDocumentCreateData: (
  ~title: string,
  ~content: option<string>,
  ~role: option<string>,
) => JSON.t = (~title, ~content, ~role) => {
  let dict = Dict.make()
  Dict.set(dict, "title", JSON.Encode.string(title))

  switch content {
  | Some(c) => Dict.set(dict, "content", JSON.Encode.string(c))
  | None => ()
  }

  switch role {
  | Some(r) => Dict.set(dict, "role", JSON.Encode.string(r))
  | None => ()
  }

  JSON.Encode.object(dict)
}

// Encode document update data to JSON
let encodeDocumentUpdateData: (
  ~title: option<string>,
  ~content: option<string>,
  ~role: option<string>,
) => JSON.t = (~title, ~content, ~role) => {
  let dict = Dict.make()

  switch title {
  | Some(t) => Dict.set(dict, "title", JSON.Encode.string(t))
  | None => ()
  }

  switch content {
  | Some(c) => Dict.set(dict, "content", JSON.Encode.string(c))
  | None => ()
  }

  switch role {
  | Some(r) => Dict.set(dict, "role", JSON.Encode.string(r))
  | None => ()
  }

  JSON.Encode.object(dict)
}
