import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import handlebars from 'handlebars'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const templateReader = (templateName, data) => {
    const templatePath = path.join(__dirname, `../templates/${templateName}.html`)
    const templateSource = fs.readFileSync(templatePath, 'utf-8')

    return handlebars.compile(templateSource)(data)
}
