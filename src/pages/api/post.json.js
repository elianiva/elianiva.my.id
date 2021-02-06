// TODO(elianiva): fix this stupid path later
import { getResources } from "../../utils/fetch-all.js"

export async function get(req, res, next) {
  const { limit, title } = req.query

  let result = getResources("post")

  if (limit) result = result.slice(0, limit)
  if (title) result = result.filter(item => item.title === title)

  if (result !== null) {
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify(result))
    return
  }

  next()
}
