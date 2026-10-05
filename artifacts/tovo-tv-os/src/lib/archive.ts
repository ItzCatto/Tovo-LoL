export type Movie = {
  id: string;
  title: string;
  genre: string;
  runtime: string;
  runtimeSeconds?: number;
  year: string;
  image: string;
  synopsis: string;
  videoUrl: string;
  sourceUrl: string;
  licenseName: string;
  captionUrl?: string;
};

export type MoviePage = {
  movies: Movie[];
  total: number;
  pageSize: number;
};

type SearchDocument = {
  identifier?: string;
  title?: string;
  year?: string | number;
  licenseurl?: string;
};

type SearchResponse = {
  response?: {
    docs?: SearchDocument[];
    numFound?: number;
  };
};

type ArchiveFile = {
  name?: string;
  format?: string;
  size?: string;
  length?: string;
};

type ArchiveItem = {
  metadata?: {
    title?: string;
    year?: string | number;
    date?: string;
    licenseurl?: string;
    description?: string | string[];
    subject?: string | string[];
  };
  files?: ArchiveFile[];
};

const pageSize = 18;
const publicDomainLicenses = [
  'http://creativecommons.org/licenses/publicdomain/',
  'https://creativecommons.org/publicdomain/mark/1.0/',
  'https://creativecommons.org/publicdomain/zero/1.0/',
] as const;

const licenseNames: Record<string, string> = {
  'http://creativecommons.org/licenses/publicdomain/': 'Public-domain declaration',
  'https://creativecommons.org/publicdomain/mark/1.0/': 'Public Domain Mark 1.0',
  'https://creativecommons.org/publicdomain/zero/1.0/': 'CC0 1.0',
};

function decodeDescription(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value.join(' ') : value ?? '';
  const text = new DOMParser().parseFromString(raw, 'text/html').body.textContent ?? '';
  return text.replace(/\s+/g, ' ').trim().slice(0, 520) || 'No description was provided for this film.';
}

function getVideoFile(files: ArchiveFile[]): ArchiveFile | undefined {
  const candidates = files.filter((file) => {
    const name = file.name?.toLowerCase() ?? '';
    const format = file.format?.toLowerCase() ?? '';
    return /\.(mp4|m4v|webm|ogv)$/.test(name) &&
      (format.includes('mpeg4') || format.includes('h.264') || format.includes('webm') || format.includes('ogg video'));
  });

  return candidates.sort((a, b) => {
    const score = (file: ArchiveFile) => {
      const name = file.name?.toLowerCase() ?? '';
      const format = file.format?.toLowerCase() ?? '';
      let value = 0;
      if (name.includes('512kb') || format.includes('512kb')) value -= 30;
      if (name.endsWith('.mp4')) value -= 10;
      if (format.includes('mpeg4') || format.includes('h.264')) value -= 5;
      const size = Number(file.size ?? 0);
      if (size > 1_500_000_000) value += 12;
      if (size > 3_000_000_000) value += 30;
      return value;
    };
    return score(a) - score(b);
  })[0];
}

function formatRuntime(value: string | undefined): { label: string; seconds?: number } {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return { label: 'Runtime not listed' };
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return {
    label: hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`,
    seconds,
  };
}

function getGenre(subject: string | string[] | undefined): string {
  const values = (Array.isArray(subject) ? subject : subject?.split(/[,;]/) ?? [])
    .map((item) => item.trim())
    .filter((item) => item && !/public domain|film|movie|feature/i.test(item));
  return values.slice(0, 2).join(' · ') || 'Feature film';
}

function getTitleQuery(search: string): string {
  const terms = search
    .trim()
    .split(/\s+/)
    .map((term) => term.replace(/[^a-z0-9'-]/gi, ''))
    .filter(Boolean);
  return terms.length ? ` AND title:(${terms.map((term) => `"${term}"`).join(' AND ')})` : '';
}

async function getMovie(document: SearchDocument, signal?: AbortSignal): Promise<Movie | null> {
  const id = document.identifier;
  if (!id) return null;

  const response = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, { signal });
  if (!response.ok) return null;
  const item = (await response.json()) as ArchiveItem;
  const metadata = item.metadata;
  const licenseUrl = metadata?.licenseurl ?? document.licenseurl ?? '';
  const licenseName = licenseNames[licenseUrl];
  const file = getVideoFile(item.files ?? []);
  if (!metadata?.title || !licenseName || !file?.name) return null;

  const runtime = formatRuntime(file.length);
  const captionFile = item.files?.find((candidate) => candidate.name?.toLowerCase().endsWith('.vtt'));
  const yearValue = metadata.year ?? document.year ?? metadata.date?.slice(0, 4);

  return {
    id,
    title: metadata.title,
    genre: getGenre(metadata.subject),
    runtime: runtime.label,
    runtimeSeconds: runtime.seconds,
    year: yearValue ? String(yearValue).slice(0, 4) : 'Year not listed',
    image: `https://archive.org/services/img/${encodeURIComponent(id)}`,
    synopsis: decodeDescription(metadata.description),
    videoUrl: `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(file.name)}`,
    sourceUrl: `https://archive.org/details/${encodeURIComponent(id)}`,
    licenseName,
    captionUrl: captionFile?.name
      ? `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(captionFile.name)}`
      : undefined,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const output = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      output[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return output;
}

export async function getPublicDomainMovies(options: {
  search?: string;
  page?: number;
  signal?: AbortSignal;
} = {}): Promise<MoviePage> {
  const page = Math.max(1, options.page ?? 1);
  const licenseQuery = publicDomainLicenses.map((license) => `licenseurl:"${license}"`).join(' OR ');
  const query = `collection:feature_films AND mediatype:movies AND format:MPEG4 AND (${licenseQuery})${getTitleQuery(options.search ?? '')}`;
  const searchUrl = new URL('https://archive.org/advancedsearch.php');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('rows', String(pageSize));
  searchUrl.searchParams.set('start', String((page - 1) * pageSize));
  searchUrl.searchParams.set('sort[]', 'downloads desc');
  searchUrl.searchParams.set('output', 'json');
  for (const field of ['identifier', 'title', 'year', 'licenseurl']) {
    searchUrl.searchParams.append('fl[]', field);
  }

  const response = await fetch(searchUrl, { signal: options.signal });
  if (!response.ok) throw new Error(`Internet Archive search failed (${response.status}).`);
  const data = (await response.json()) as SearchResponse;
  const documents = data.response?.docs ?? [];
  const total = Number(data.response?.numFound ?? 0);
  const results = await mapWithConcurrency(documents, 5, async (document) => {
    try {
      return await getMovie(document, options.signal);
    } catch (error) {
      if (options.signal?.aborted) throw error;
      return null;
    }
  });

  return {
    movies: results.filter((movie): movie is Movie => movie !== null),
    total,
    pageSize,
  };
}
