// src/app/capture/page.tsx
"use client";

import { useState } from "react";
import CaptureControls, { type CaptureSettings } from "@/components/CaptureControls";

export default function CapturePage() {
  if (process.env.NEXT_PUBLIC_ENABLE_CAPTURE !== "true") {
    return <div className="p-8 text-slate-300">Capture mode is disabled.</div>;
  }

  const [settings, setSettings] = useState<CaptureSettings>({
    family: "pushup",
    variation: "standard",
    subject: "team_A",
    quality: "good",
    defects: [],
  });
  const [recording, setRecording] = useState(false);
  const [capturedReps] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <h1 className="text-xl font-bold mb-4">Capture Mode (dev only)</h1>
      <CaptureControls
        value={settings}
        onChange={setSettings}
        recording={recording}
        onToggleRecord={() => setRecording(!recording)}
        capturedReps={capturedReps}
        onDownload={() => alert("download not yet implemented")}
      />
      <div className="mt-4 aspect-video bg-black rounded-xl flex items-center justify-center text-slate-500">
        (camera + landmarks land in Task 20)
      </div>
    </div>
  );
}
