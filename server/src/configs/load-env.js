import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Always load server/.env (not cwd), so PayMongo keys work when started from repo root.
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
