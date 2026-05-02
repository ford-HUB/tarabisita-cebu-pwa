import './configs/load-env.js'
import app from './app.js'
import { dbConnection } from './configs/db.config.js'
import { startPaymongoLedgerReconcileJob } from './jobs/paymongoLedgerReconcile.job.js'

app.listen(process.env.PORT, async () => {
  await dbConnection()
  await startPaymongoLedgerReconcileJob()
  console.log(`Server is running at http://localhost:${process.env.PORT}/api/v1`)
})
