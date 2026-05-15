import { Antigravity } from "@/components/antigravity"

export default function Page() {
  return (
    <main className="ag-stage" style={{ width: "100vw", height: "100vh", minHeight: "100vh" }}>
      <div className="ag-stage-canvas" style={{ width: "100%", height: "100%", minHeight: "100vh" }}>
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
    </main>
  )
}
