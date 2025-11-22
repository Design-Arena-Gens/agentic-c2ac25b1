"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./capture.module.css";

type CaptureState = "idle" | "preparing" | "recording" | "finalizing" | "done" | "error";

export function CaptureControls() {
  const [state, setState] = useState<CaptureState>("idle");
  const [status, setStatus] = useState<string>("");
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [durationSec, setDurationSec] = useState<number>(10);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const startCapture = useCallback(async () => {
    try {
      setState("preparing");
      setStatus("Preparing 4K 24fps capture...");
      const canvas = document.querySelector("canvas");
      if (!canvas) throw new Error("Canvas not found");

      // Target 4K offscreen size for capture; scale preview container visually
      const targetW = 3840;
      const targetH = 2160;
      const ctx = (canvas as HTMLCanvasElement).getContext("2d");
      // Resize canvas backing store to 4K
      const gl = (canvas as any).__webglcontext || (canvas as any).getContext?.("webgl2") || (canvas as any).getContext?.("webgl");
      (canvas as HTMLCanvasElement).width = targetW;
      (canvas as HTMLCanvasElement).height = targetH;

      const stream = (canvas as HTMLCanvasElement).captureStream(24);

      // Audio: synthesize distant siren using WebAudio and mix to MediaStream
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const destination = audioCtx.createMediaStreamDestination();
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.25;
      masterGain.connect(destination);

      // Low rumble
      const noise = audioCtx.createOscillator();
      noise.type = "sine";
      noise.frequency.value = 60;
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.value = 0.02;
      noise.connect(noiseGain).connect(masterGain);
      noise.start();

      // Siren: two oscillators with slow LFO for doppler-like shift
      const siren1 = audioCtx.createOscillator();
      siren1.type = "sine";
      const siren2 = audioCtx.createOscillator();
      siren2.type = "triangle";
      const sirenGain = audioCtx.createGain();
      sirenGain.gain.value = 0.06;
      // LFO
      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.25;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 80;
      lfo.connect(lfoGain);
      lfoGain.connect(siren1.frequency);
      lfoGain.connect(siren2.frequency);
      siren1.frequency.value = 720;
      siren2.frequency.value = 880;
      siren1.connect(sirenGain);
      siren2.connect(sirenGain);
      sirenGain.connect(masterGain);
      siren1.start();
      siren2.start();
      lfo.start();

      // Merge streams
      destination.stream.getAudioTracks().forEach((t) => stream.addTrack(t));

      // Recorder
      const options: MediaRecorderOptions = {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond: 16_000_000 // high bitrate for 4K
      };
      const recorder = new MediaRecorder(stream, options);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setState("done");
        setStatus("Capture complete");
        // Stop audio
        audioCtx.close();
      };

      setState("recording");
      setStatus(`Recording ${durationSec}s at 24 fps...`);
      recorder.start();
      await new Promise((r) => setTimeout(r, durationSec * 1000));
      setState("finalizing");
      setStatus("Finalizing...");
      recorder.stop();
    } catch (e) {
      console.error(e);
      setState("error");
      setStatus("Capture failed");
    }
  }, [durationSec]);

  const download = useCallback(() => {
    if (linkRef.current && blobUrl) {
      linkRef.current.href = blobUrl;
      linkRef.current.download = "noir-city-4k-24fps.webm";
      linkRef.current.click();
    }
  }, [blobUrl]);

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <label className={styles.label}>
          Duration
          <input
            type="number"
            min={3}
            max={30}
            step={1}
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value))}
          />
          <span>s</span>
        </label>
        <button onClick={startCapture} disabled={state === "recording" || state === "finalizing"}>
          {state === "recording" ? "Recording..." : "Render Video (4K ? 24 fps)"}
        </button>
        <button onClick={download} disabled={!blobUrl || state !== "done"}>
          Download
        </button>
      </div>
      <div className={styles.status}>{status}</div>
      <a ref={linkRef} style={{ display: "none" }} />
    </div>
  );
}

