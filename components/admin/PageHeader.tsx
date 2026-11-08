export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-[#6b6b6b]">{description}</p>}
      </div>
      {action}
    </div>
  )
}