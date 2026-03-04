export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-5 w-32 rounded-lg bg-muted" />
      <div className="h-3 w-48 rounded bg-muted" />
      <div className="mt-4 rounded-xl border p-6">
        <div className="flex flex-col gap-4">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-10 w-full rounded-xl bg-muted" />
          <div className="h-4 w-36 rounded bg-muted" />
          <div className="h-10 w-full rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
