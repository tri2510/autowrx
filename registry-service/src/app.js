import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import extensionsRouter from './routes/extensions.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 4400

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', service: 'autowrx-extension-registry' })
})

app.use('/v1/extensions', extensionsRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  })
})

app.listen(port, () => {
  console.log(`🔌 Extension registry listening on port ${port}`)
})
