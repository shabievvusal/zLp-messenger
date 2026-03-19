export function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex justify-center my-4 select-none">
      <span className="text-xs text-gray-500 dark:text-gray-400
        bg-black/10 dark:bg-white/10 backdrop-blur-sm
        rounded-full px-3 py-1">
        {date}
      </span>
    </div>
  )
}
