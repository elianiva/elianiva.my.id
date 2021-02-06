// TODO(elianiva): fix this stupid path later
import { getResources } from "../../../utils/fetch-all.js"

export async function get(req, res, next) {
  const { path } = req.params
  const { limit } = req.query

  let result = getResources("project")

  if (path && path !== "all") {
    result = result.find(item => item.slug === path)
  }

  if (limit) result = result.slice(0, limit)

  if (result !== null) {
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify(result))
    return
  }

  next()
}
