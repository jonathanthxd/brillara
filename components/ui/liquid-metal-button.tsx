"use client";

import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, useEffect, useState } from "react";

const LiquidMetalCanvas = dynamic(() => import("./liquid-metal-canvas").then((module) => module.LiquidMetalCanvas), { ssr: false });

type BaseProps = { children: ReactNode; icon?: ReactNode; className?: string; size?: "sm" | "md" | "lg" };
const sizes = { sm: "min-h-10 px-5 text-sm", md: "min-h-12 px-6 text-sm", lg: "min-h-14 px-7 text-base" };

function useMetalMotion() {
  const [state, setState] = useState({ enabled: false, dark: false });
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setState({ enabled: !media.matches, dark: document.documentElement.classList.contains("dark") });
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    media.addEventListener("change", update);
    return () => { observer.disconnect(); media.removeEventListener("change", update); };
  }, []);
  return state;
}

function MetalInner({ children, icon, size = "md" }: Omit<BaseProps, "className">) {
  const { enabled, dark } = useMetalMotion();
  return <span className="liquid-metal-frame"><span className="liquid-metal-fallback" aria-hidden />{enabled && <span className="liquid-metal-canvas" aria-hidden><LiquidMetalCanvas dark={dark} /></span>}<span className={cn("liquid-metal-body", sizes[size])}>{icon && <span className="liquid-metal-icon">{icon}</span>}<span>{children}</span></span></span>;
}

export function LiquidMetalButton({ children, icon, size, className, disabled, ...props }: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} disabled={disabled} className={cn("liquid-metal-button", className)}><MetalInner icon={icon} size={size}>{children}</MetalInner></button>;
}

export function LiquidMetalLink({ children, icon, size, className, ...props }: BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link {...props} className={cn("liquid-metal-button", className)}><MetalInner icon={icon} size={size}>{children}</MetalInner></Link>;
}
