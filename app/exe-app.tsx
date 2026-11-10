"use client";

import { useEffect, useRef, useState } from "react";
import type { Diagnostico } from "@/lib/store";

type Msg = { role: "user" | "assistant"; content: string };
type Diag = Diagnostico & { titulo: string; video: string };
type State = {
  nombre: string;
  chat: Msg[];
  diagnostico: Diag | null;
  cerrado: boolean;
  puedeRehacer: boolean;
  quedan: number;
};

const LISTA_ESPERA = "https://emmallensa.com/diffuze-inside/";

function vimeoEmbed(url: string) {
  if (!url) return "";
  if (url.includes("player.vimeo.com")) return url;
  const m = url.match(/vimeo\.com\/(\d+)(?:\/([a-z0-9]+))?/i);
  if (!m) return url;
  return `https://player.vimeo.com/video/${m[1]}${m[2] ? `?h=${m[2]}` : ""}`;
}

function fecha(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function ExeApp() {
  const [st, setSt] = useState<State | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const diagRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/state")
      .then(async (r) => {
        if (r.status === 401) {
          location.href = "/";
          return;
        }
        if (!r.ok) throw new Error();
        setSt(await r.json());
      })
      .catch(() => setError("Emma.exe se ha colgado un momento. Recarga la página en un minuto."));
  }, []);

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: "smooth" });
  }, [st?.chat.length, busy]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy || !st) return;
    setInput("");
    setError("");
    setSt({ ...st, chat: [...st.chat, { role: "user", content: text }] });
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Algo ha fallado. Prueba otra vez.");
      setSt((s) =>
        s
          ? {
              ...s,
              chat: [...s.chat, { role: "assistant", content: j.reply }],
              quedan: j.quedan,
              diagnostico: j.diagnostico ?? s.diagnostico,
              cerrado: !!j.diagnostico || s.cerrado,
              puedeRehacer: j.diagnostico ? j.puedeRehacer : s.puedeRehacer,
            }
          : s,
      );
      if (j.diagnostico) setTimeout(() => diagRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } catch (err) {
      setError((err as Error).message);
      setSt((s) => (s ? { ...s, chat: s.chat.slice(0, -1) } : s));
      setInput(text);
    } finally {
      setBusy(false);
    }
  }

  async function rehacer() {
    if (busy || !st) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rehacer: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No se ha podido.");
      setSt({ ...st, chat: j.chat, cerrado: false, puedeRehacer: false, quedan: j.quedan });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function salir() {
    await fetch("/api/logout", { method: "POST" });
    location.href = "/";
  }

  async function copiar(t: string) {
    try {
      await navigator.clipboard.writeText(t);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("No he podido copiarlo. Selecciónalo y cópialo a mano.");
    }
  }

  if (!st) {
    return (
      <main className="bsod">
        <div className="wrap">
          <p className="bar">
            [<b>████████████████████</b>] cargando a Emma…
          </p>
          {error && <div className="alert bad">{error}</div>}
        </div>
      </main>
    );
  }

  const d = st.diagnostico;
  const embed = d ? vimeoEmbed(d.video) : "";

  return (
    <main className="bsod">
      <div className="wrap">
        <div className="top no-print">
          <span className="tag">EMMA.EXE</span>
          <button className="link-btn" onClick={salir}>
            [ salir ]
          </button>
        </div>

        <section className="term no-print" aria-label="Conversación con Emma.exe">
          <div className="term-head">
            <span>C:\&gt; emma.exe --diagnostico</span>
            {!st.cerrado && <span>{st.quedan} mensajes</span>}
          </div>
          <div className="msgs" ref={msgsRef} aria-live="polite">
            {st.chat.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                <span className="who">{m.role === "user" ? "> tú" : "> emma.exe"}</span>
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="msg assistant">
                <span className="who">&gt; emma.exe</span>
                pensando <span className="cursor" />
              </div>
            )}
          </div>
          {!st.cerrado && (
            <form className="composer" onSubmit={send}>
              <textarea
                value={input}
                placeholder="Escribe aquí…"
                aria-label="Tu respuesta"
                maxLength={2000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button className="btn" disabled={busy || !input.trim()}>
                Enviar &gt;
              </button>
            </form>
          )}
          {error && <div className="alert bad">{error}</div>}
        </section>

        {d && st.cerrado && (
          <div className="diag" ref={diagRef}>
            <section className="panel white">
              <p className="perfil">
                PERFIL DETECTADO: <b>{d.perfil.toUpperCase()}</b> · {fecha(d.fecha)}
              </p>
              <h2 className="h-term" style={{ fontSize: "clamp(38px,6vw,64px)" }}>
                {d.titulo}
              </h2>
              <p className="txt" style={{ fontWeight: 600 }}>
                {d.frase_espejo}
              </p>
            </section>

            <section className="panel">
              <div className="cols">
                <div>
                  <p className="k">LO QUE ME HAS CONTADO</p>
                  <ul>
                    {d.lo_que_se.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
                {d.lo_que_supongo.length > 0 && (
                  <div>
                    <p className="k">LO QUE ESTOY SUPONIENDO</p>
                    <ul>
                      {d.lo_que_supongo.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                    <p className="note">Si algo de esto no es así, el diagnóstico cambia.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="panel">
              <h3 className="h-sec">Lo que te está frenando de verdad</h3>
              <p className="txt" style={{ whiteSpace: "pre-wrap" }}>
                {d.causa_real}
              </p>
            </section>

            <section className="panel">
              <h3 className="h-sec">Lo primero que haría yo esta semana</h3>
              <p className="txt">{d.accion_semana}</p>
              <p className="k" style={{ marginTop: 16 }}>
                COPIA ESTO EN {d.herramienta.toUpperCase()}:
              </p>
              <pre className="prompt">{d.prompt}</pre>
              <div className="actions no-print">
                <button className="btn btn-sm" onClick={() => copiar(d.prompt)}>
                  {copiado ? "¡Copiado!" : "Copiar el prompt"}
                </button>
              </div>
            </section>

            <section className="panel">
              <h3 className="h-sec">El vídeo que grabé para tu perfil</h3>
              <div className="video">
                {embed ? (
                  <iframe
                    src={embed}
                    title={`Vídeo de Emma: ${d.titulo}`}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="ph">
                    VÍDEO EN CAMINO <br />
                    Vuelve en unos días: aquí aparecerá el vídeo de tu perfil.
                  </div>
                )}
              </div>
            </section>

            <section className="panel white">
              <h3 className="h-sec">Lo siguiente que te recomiendo</h3>
              <p className="txt" style={{ fontWeight: 800, fontSize: 21 }}>
                {d.recomendacion.nombre}
              </p>
              <p className="txt">{d.recomendacion.por_que}</p>
              <div className="actions">
                <a className="btn btn-sm" href={d.recomendacion.url} target="_blank" rel="noopener">
                  {d.recomendacion.id === "diffuze_inside" ? "Apuntarme a la lista de espera >" : "Ver el curso >"}
                </a>
              </div>
            </section>

            {d.recomendacion.id !== "diffuze_inside" && (
              <p className="cierre">
                Esto es justo lo que trabajamos cada semana dentro de Diffuze Inside. Ahora está cerrada: si quieres
                entrar en la próxima apertura, <a href={LISTA_ESPERA}>apúntate a la lista de espera</a>.
              </p>
            )}

            <div className="actions no-print">
              <button className="btn btn-sm" onClick={() => window.print()}>
                Guardar en PDF
              </button>
              {st.puedeRehacer && (
                <button className="link-btn" onClick={rehacer} disabled={busy}>
                  [ rehacer mi diagnóstico (solo una vez) ]
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
