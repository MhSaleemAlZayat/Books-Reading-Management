function ProgressBar({ value }) {
  return (
    <div className="mt-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
      <div
        className="h-2 rounded-full bg-brand-700 transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export default ProgressBar
