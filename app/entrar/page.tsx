export default async function Entrar({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = "" } = await searchParams;
  return (
    <main className="bsod center">
      <div className="box narrow">
        <span className="tag">EMMA.EXE</span>
        <h1 className="h-term">Ya casi estás.</h1>
        <p className="txt">Pulsa para arrancar tu diagnóstico.</p>
        <form method="post" action="/api/auth">
          <input type="hidden" name="t" value={t} />
          <button className="btn" type="submit">Ejecutar Emma.exe &gt;</button>
        </form>
      </div>
    </main>
  );
}
