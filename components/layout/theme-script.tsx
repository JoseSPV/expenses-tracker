"use client";

import { useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { themeInitScript } from "./theme";

/** Inserts the theme script into the first HTML document only, so React does not render a script on the client. */
export function ThemeScript() {
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />;
  });

  return null;
}
