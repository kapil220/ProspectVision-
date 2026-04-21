export const metadata = {
  title: 'Removed from mailing list',
  robots: 'noindex',
}

export default function OptOutConfirmationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
          ✓
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          You have been removed from our mailing list.
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          You will not receive future mail about this property.
        </p>
      </div>
    </main>
  )
}
