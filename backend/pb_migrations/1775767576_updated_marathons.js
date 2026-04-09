/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_136927820")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id = mentorId || @request.auth.id != \"\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_136927820")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id = mentorId"
  }, collection)

  return app.save(collection)
})
