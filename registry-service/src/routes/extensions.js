import express from 'express'
import {
  listExtensions,
  getExtension,
  getVersion,
  createExtension,
  addDraftVersion,
  releaseVersion
} from '../data/mockExtensions.js'

const router = express.Router()

router.get('/', (req, res) => {
  const { tag, name, provider } = req.query
  const entries = listExtensions({ tag, name, provider })
  res.json({ items: entries })
})

router.get('/:extensionId', (req, res) => {
  const extension = getExtension(req.params.extensionId)
  if (!extension) {
    return res.status(404).json({ error: 'Extension not found' })
  }
  res.json(extension)
})

router.get('/:extensionId/versions/:version', (req, res) => {
  const version = getVersion(req.params.extensionId, req.params.version)
  if (!version) {
    return res.status(404).json({ error: 'Version not found' })
  }
  res.json(version)
})

// Draft creation endpoint (no auth for MVP mock)
router.post('/:extensionId/versions', (req, res) => {
  try {
    const draft = addDraftVersion(req.params.extensionId, req.body || {})
    res.status(201).json(draft)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/', (req, res) => {
  try {
    const extension = createExtension(req.body)
    res.status(201).json(extension)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/:extensionId/versions/:version/release', (req, res) => {
  try {
    const entry = releaseVersion(req.params.extensionId, req.params.version)
    res.json(entry)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
