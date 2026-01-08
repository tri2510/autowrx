import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve current directory
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`\n✅ Plugin server running at http://localhost:${PORT}/`);
  console.log(`📦 Plugin available at http://localhost:${PORT}/index.js`);
  console.log(`🔓 CORS enabled for all origins\n`);
});
