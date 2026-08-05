"use client";

import { LiquidMetal } from "@paper-design/shaders-react";

export function LiquidMetalCanvas({ dark }: { dark: boolean }) {
  return <LiquidMetal colorBack={dark ? "#2b5377" : "#9b6918"} colorTint={dark ? "#eff6ff" : "#fff2bb"} speed={0.72} repetition={6} distortion={0.3} softness={0} shiftRed={0.3} shiftBlue={-0.3} angle={45} shape="none" scale={1.35} fit="cover" style={{ width: "100%", height: "100%" }} />;
}
