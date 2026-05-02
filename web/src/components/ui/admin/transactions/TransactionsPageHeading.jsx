import { Link } from 'react-router-dom'
import { toEncryptedRoute } from '../../../../shared/utils/direct.utils'

const TransactionsPageHeading = () => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <h1 className="text-2xl font-semibold tracking-tight text-[#1f1f1f] md:text-3xl">Transactions</h1>
    <nav className="text-sm text-[#7a7066]" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            to={`/${toEncryptedRoute('admin/dashboard')}`}
            className="font-medium text-[#9b5a2c] transition hover:text-[#7a4522]"
          >
            Home
          </Link>
        </li>
        <li className="text-[#c4b8a8]" aria-hidden>
          /
        </li>
        <li className="font-medium text-[#3f3a35]">Transactions</li>
      </ol>
    </nav>
  </div>
)

export default TransactionsPageHeading
