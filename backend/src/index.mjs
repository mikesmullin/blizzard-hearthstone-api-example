import express from 'express'
import BattleNet from './lib/BattleNet.mjs'
import Hearthstone from './lib/Hearthstone.mjs'

try {
  // initialize API client
  const bnet = new BattleNet()
  await bnet.auth()
  const hs = new Hearthstone(bnet)

  // initialize web service
  const app = express()

  app.use('/', (req, res, next) => {
    // public-facing API (also shared across different port numbers)
    res.set('Access-Control-Allow-Origin', '*')
    next()
  })

  app.get('/metadata', async (req, res) => {
    try {
      const metadata = await hs.Metadata__list()
      res.json(metadata)
    }
    catch(e) {
      res.status(500)
      res.json({ error: "Internal server error"})
      console.error(e)
    }
  })

  app.get('/cards', async (req, res) => {
    try {
      const cards = await hs.Cards__list({ 
        ...req.query, 
        sort: "id:asc",
      })
      res.json(cards)
    }
    catch(e) {
      res.status(500)
      res.json({ error: "Internal server error"})
      console.error(e)
    }
  })

  // begin listening
  const server = app.listen(3001, '127.0.0.1', () => {
    const addr = server.address();
    console.log(`Web service listening on http://${addr.address}:${addr.port}`)
  })
}
catch(e) {
  // unhandled errors
  process.stdout.write(`Fatal: ${e}\n`)
  process.exit(1)
}