import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3010

app.use(cors())
app.use(express.json())

// Serve plugin files
app.use('/plugin', express.static(__dirname))

// Serve index.js
app.get('/index.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.js'))
})

// Serve index.css
app.get('/index.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.css'))
})

app.listen(PORT, () => {
  console.log(`AOS Cloud Deployment Plugin server running on http://localhost:${PORT}`)
  console.log(`Plugin URL: http://localhost:${PORT}/index.js`)
})
