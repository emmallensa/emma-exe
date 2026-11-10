"use client";

import { useState } from "react";

const DISQUETE =
  "https://res.cloudinary.com/deoshjcej/image/upload/w_760,f_auto,q_auto/emma-exe/disquete-emma-exe.png";

const MOTIVOS: Record<string, string> = {
  caducado: "Ese enlace ha caducado. Pide uno nuevo.",
  usado: "Ese enlace ya se ha usado. Pide uno nuevo.",
};

export default function LoginForm({ motivo }: { motivo?: string }) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const [error, setError] = useState(motivo ? MOTIVOS[motivo] ?? "" : "");
  const [titulo, setTitulo] = useState(motivo ? "Ese enlace ya no funciona." : "");
  const [link, setLink] = useState<{ texto: string; url: string } | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setTitulo("");
    setLink(null);
    setEstado("enviando");
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (j.link) setLink(j.link);
        setTitulo(j.titulo || "Emma.exe se ha colgado un momento.");
        throw new Error(j.error || "Sí, como los ordenadores de antes. Prueba otra vez en un minuto.");
      }
      setEstado("enviado");
    } catch (err) {
      setTitulo((t) => t || "Emma.exe se ha colgado un momento.");
      setError((err as Error).message === "Failed to fetch" ? "Parece que no hay conexión. Prueba otra vez." : (err as Error).message);
      setEstado("idle");
    }
  }

  return (
    <main className="bsod">
      <div className="wrap">
        <div className="hero">
          <div>
            <span className="tag">EMMA.EXE</span>
            <p className="err-line">Se ha detectado un problema en tu estrategia y tu negocio no puede avanzar.</p>
            <h1 className="h-term">
              ERROR 404: <span>estrategia</span> no encontrada
            </h1>
            <p className="txt">
              Cuéntame cómo está tu negocio. Te hago las preguntas que te haría yo en una sesión y te digo qué te está
              frenando de verdad, lo primero que haría esta semana y el vídeo que grabé para tu perfil.
            </p>

            {estado === "enviado" ? (
              <div className="alert">
                Te acabo de mandar un enlace a <b>{email}</b>. Ábrelo desde el correo para arrancar. Si no lo ves en un
                minuto, mira en promociones o spam.
              </div>
            ) : (
              <form onSubmit={enviar}>
                <div className="form-row">
                  <input
                    className="field"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="C:\> el email de tu compra"
                    aria-label="El email con el que compraste"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button className="btn" disabled={estado === "enviando"}>
                    {estado === "enviando" ? "Cargando…" : "Ejecutar >"}
                  </button>
                </div>
                <p className="note">Gratis con cualquier compra de Black Friday. Te mando un enlace al correo para entrar.</p>
              </form>
            )}
            {error && (
              <div className="alert-box" role="alert">
                <p className="alert-k">ERROR</p>
                {titulo && <p className="alert-t">{titulo}</p>}
                <p className="alert-p">{error}</p>
                {link && (
                  <a className="btn btn-sm" href={link.url}>
                    {link.texto} &gt;
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="drive">
            <img src={DISQUETE} alt="Disquete magenta con la foto de Emma y la etiqueta EMMA.EXE" width={760} height={760} />
            <div className="slot" aria-hidden="true" />
            <p className="bar" aria-hidden="true">
              [<b>████████████████████</b>] cargando a Emma…
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
