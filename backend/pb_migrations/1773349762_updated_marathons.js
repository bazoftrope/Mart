/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_136927820")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"mentor\"",
    "deleteRule": "@request.auth.id = mentorId",
    "listRule": "@request.auth.id != \"\" ",
    "updateRule": "@request.auth.id = mentorId",
    "viewRule": "@request.auth.id != \"\" "
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_136927820")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
