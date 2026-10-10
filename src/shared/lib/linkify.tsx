import { Fragment } from 'react';

// http(s) links typed or pasted into free text, e.g. a CV on Google Drive or
// a LinkedIn profile inside a cover letter. Trailing punctuation is not part
// of the link.
const URL_PATTERN = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/gi;

export const extractUrls = (text: string | null | undefined): string[] =>
  Array.from(new Set(text?.match(URL_PATTERN) ?? []));

/** Short label for a link button: the host without "www.", e.g. "drive.google.com". */
export const urlLabel = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/** Renders text with every http(s) link clickable (new tab, no referrer). */
export function LinkifiedText({ text }: Readonly<{ text: string }>) {
  const parts = text.split(URL_PATTERN);
  const links = text.match(URL_PATTERN) ?? [];
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {links[i] && (
            <a href={links[i]} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline">
              {links[i]}
            </a>
          )}
        </Fragment>
      ))}
    </>
  );
}
