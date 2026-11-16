import type { Metadata } from "next";
import { getDictionary } from "./get-dictionary";
import type { Dictionary } from "./types";

/** `generateMetadata` for a section page, titled with its navigation label. */
export const navTitle = (key: Exclude<keyof Dictionary["nav"], "label">) =>
  async function generateMetadata(): Promise<Metadata> {
    const { nav, meta } = await getDictionary();
    return { title: { absolute: `${nav[key]} · ${meta.appName}` } };
  };
