const VIDEO_ID_PATTERN = /[a-zA-Z0-9]+/;

const URL_PATTERN =
  /kinescope\.io\/(?:embed\/)?([a-zA-Z0-9]+)/;

export function parseKinescopeVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();

  const srcMatch = trimmed.match(
    /src=["']([^"']*)["']/i
  );
  const candidate = srcMatch ? srcMatch[1] : trimmed;

  const match = candidate.match(URL_PATTERN);
  if (!match) {
    return null;
  }

  const videoId = match[1];
  if (!VIDEO_ID_PATTERN.test(videoId)) {
    return null;
  }

  return videoId;
}

export function buildEmbedUrl(videoId: string): string {
  return `https://kinescope.io/embed/${videoId}`;
}
