import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center p-6">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Rubik&apos;s Cube Solver - Level 0</h1>
        <p className="mt-3 text-slate-600">
          Capture six faces of your cube in order: Front, Right, Back, Left, Up, Down.
        </p>
        <Link
          href="/scan"
          className="mt-6 inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-700"
        >
          Start Scan
        </Link>
      </section>
    </main>
  );
}
