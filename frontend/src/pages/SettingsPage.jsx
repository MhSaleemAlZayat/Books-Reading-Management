import PageHeader from '../components/common/PageHeader'

function SettingsPage() {
  return (
    <div>
      <PageHeader subtitle="Local server configuration and maintenance" title="Settings" />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-900">Server</h3>
          <p className="mt-2 text-sm text-slate-700">Host: 192.168.1.8:5173 (example)</p>
          <p className="text-sm text-slate-700">Mode: Local network only</p>
          <button className="mt-3 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            Copy Access URL
          </button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-900">Storage</h3>
          <p className="mt-2 text-sm text-slate-700">Library path: `/library/files`</p>
          <p className="text-sm text-slate-700">Used: 32.6 GB / 200 GB</p>
          <button className="mt-3 rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-900">
            Run Backup
          </button>
        </section>
      </div>
    </div>
  )
}

export default SettingsPage
