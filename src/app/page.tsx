export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-bold">Webapp Hafalan Santri</h1>
      <p className="text-muted-foreground">
        Sistem pencatatan hafalan &amp; murajaah santri.
      </p>
      <a
        href="/login"
        className="rounded-md bg-black px-4 py-2 text-white hover:bg-neutral-800"
      >
        Masuk
      </a>
    </main>
  );
}
