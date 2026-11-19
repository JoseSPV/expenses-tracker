/** Privacy keeps its own title. Every other screen uses the section name. */
export function shellTitle(input: {
  privacy: boolean;
  privacyTitle: string;
  sectionTitle: string | null;
  appName: string;
}): string {
  if (input.privacy) return input.privacyTitle;
  return input.sectionTitle ?? input.appName;
}
