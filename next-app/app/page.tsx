import { Antigravity } from "@/components/antigravity"

export default function Page() {
  return (
    <main className="ag-page">
      <header className="ag-header">
        <div className="ag-brand">
          <span className="ag-google">
            <span className="blue">G</span>
            <span className="red">o</span>
            <span className="yellow">o</span>
            <span className="blue">g</span>
            <span className="green">l</span>
            <span className="red">e</span>
          </span>
          <span className="ag-divider" />
          <span className="ag-product">Antigravity</span>
        </div>
        <a className="ag-pill" href="#hero">
          Download
        </a>
      </header>

      <section className="ag-hero" id="hero">
        <div className="ag-copy">
          <span className="ag-kicker">Particle field study</span>
          <h1>Cursor-driven antigravity field using the React Bits implementation.</h1>
          <p>
            This pass switches the hero background over to the open-source Antigravity component
            and leaves video/media surfaces out of scope. The component drives the whole first
            viewport.
          </p>
          <div className="ag-actions">
            <a className="ag-pill ag-pill-dark" href="#field">
              Explore field
            </a>
            <a className="ag-pill ag-pill-light" href="#notes">
              Implementation notes
            </a>
          </div>
        </div>

        <div className="ag-field" id="field">
          <div className="ag-field-frame">
            <Antigravity
              count={460}
              magnetRadius={14}
              ringRadius={8}
              waveSpeed={2}
              waveAmplitude={4.9}
              particleSize={0.5}
              lerpSpeed={0.4}
              color="#FF9FFC"
              autoAnimate={false}
              particleVariance={0.1}
              rotationSpeed={0}
              depthFactor={2}
              pulseSpeed={0}
              particleShape="capsule"
              fieldStrength={9}
            />
          </div>
        </div>
      </section>

      <section className="ag-notes" id="notes">
        <div className="ag-note-card">
          <span className="ag-kicker">Open-source basis</span>
          <h2>React Bits Antigravity component</h2>
          <p>
            The `shadcn add` path was blocked by the local certificate chain, so the registry
            source was integrated manually into this Next app with its real runtime dependencies.
          </p>
        </div>
      </section>
    </main>
  )
}
