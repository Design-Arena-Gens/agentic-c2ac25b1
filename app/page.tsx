/* eslint-disable @next/next/no-head-element */
"use client";
import dynamic from "next/dynamic";
import React from "react";
import styles from "./page.module.css";

const Scene = dynamic(() => import("@/components/Scene").then(m => m.Scene), { ssr: false });
const CaptureControls = dynamic(
  () => import("@/components/CaptureControls").then(m => m.CaptureControls),
  { ssr: false }
);

export default function Page() {
  return (
    <>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>Noir City</h1>
          <p>4K cinematic scene at 24 fps ? capture ready</p>
        </div>
        <div className={styles.canvasWrap}>
          <Scene />
        </div>
        <CaptureControls />
        <div className={styles.footer}>
          <span>Colors: #003049, #6639a6, #a2d2ff, #ffb703</span>
        </div>
      </main>
    </>
  );
}

