import app from "./app.js";
import { dbConnection } from "./configs/db.config.js";
import 'dotenv/config'

app.listen(process.env.PORT, () => {
    dbConnection()
    console.log(`Server is running at http://localhost:${process.env.PORT}/api/v1`)
})