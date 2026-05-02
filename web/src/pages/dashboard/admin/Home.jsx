import { useAuth } from '../../../hooks/useAuth.hook'

const Home = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e7dfd5] bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-[#1f1f1f]">Welcome, {user?.name || 'Administrator'}</h1>
        <p className="mt-2 text-sm text-[#4f4f4f]">
          Manage platform operations from one workspace, including business reviews and system reporting.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-[#e7dfd5] bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Businesses</p>
          <p className="mt-2 text-xl font-semibold">Monitoring</p>
          <p className="mt-1 text-sm text-[#5b5b5b]">Review active business submissions and account states.</p>
        </article>
        <article className="rounded-2xl border border-[#e7dfd5] bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Reports</p>
          <p className="mt-2 text-xl font-semibold">Queue Ready</p>
          <p className="mt-1 text-sm text-[#5b5b5b]">Check flagged platform data and generate admin insights.</p>
        </article>
        <article className="rounded-2xl border border-[#e7dfd5] bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">System</p>
          <p className="mt-2 text-xl font-semibold">Healthy</p>
          <p className="mt-1 text-sm text-[#5b5b5b]">Core admin controls are now available in this module.</p>
        </article>
      </section>
    </div>
  )
}

export default Home
