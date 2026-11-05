function LoadingPanel({ title, lines = [], className = '' }) {
  return (
    <div className={`panel ${className}`} role="status">
      <div className="panel-head">
        <h2>{title}</h2>
      </div>
      <div className="loading-bar" />
      {lines.length > 0 && (
        <ul className="list-disc space-y-1 py-4 pr-4 pl-9 text-sm text-stone-600">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LoadingPanel
