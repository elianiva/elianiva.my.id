import sirv from "sirv"
import polka from "polka"
import compression from "compression"
import * as sapper from "@sapper/server"

const { PORT, NODE_ENV } = process.env
const dev = NODE_ENV === "development"

const app = polka()

app
  .use(
    compression({ threshold: 0 }),
    sirv("static", { dev }),
    sapper.middleware()
  )
  .listen(PORT, err => err && console.error("error", err))

module.exports = app
