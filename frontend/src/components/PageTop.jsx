function PageTop({ title, text, children }) {
  return (
    <div className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-6 sm:px-6">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {text && <p className="mt-1.5 text-stone-600">{text}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

export default PageTop
