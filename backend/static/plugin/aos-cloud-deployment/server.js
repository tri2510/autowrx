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

// Serve index.js at root for plugin loading
app.get('/index.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.js'))
})

// Serve test page
app.get('/test.html', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>AOS Cloud Deployment Plugin - Test</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; }
    #root { height: 100vh; width: 100vw; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="/index.js"></script>
  <script>
    const { mount } = window.DAPlugins['page-plugin'];
    mount(document.getElementById('root'), {
      data: {
        model: { vehicle_category: 'Test Vehicle' },
        prototype: { name: 'Test Prototype', apis: { VSS: [] } }
      }
    });
  </script>
</body>
</html>
  `)
})

app.listen(PORT, () => {
  console.log(`AOS Cloud Deployment Plugin server running on http://localhost:${PORT}`)
  console.log(`Test page: http://localhost:${PORT}/test.html`)
  console.log(`Plugin URL: http://localhost:${PORT}/index.js`)
})
