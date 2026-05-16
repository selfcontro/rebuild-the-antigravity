import { Antigravity } from "@/components/antigravity"

export default function Page() {
  return (
    <main className="ag-stage" style={{ width: "100vw", height: "100vh", minHeight: "100vh" }}>
      <div className="ag-stage-canvas" style={{ width: "100%", height: "100%", minHeight: "100vh" }}>
        <Antigravity />
      </div>
    </main>
  )
}
