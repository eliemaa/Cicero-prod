"use client";
import { useEffect } from "react";
import type { Locale } from "@/lib/types";
export default function SiteBehavior({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    const site = document.createElement("script");
    site.src = "/js/site.js";
    const ui = document.createElement("script");
    ui.src = "/js/ui.js";
    site.onload = () => document.body.appendChild(ui);
    document.body.appendChild(site);
    return () => {
      site.remove();
      ui.remove();
    };
  }, [locale]);
  return null;
}
