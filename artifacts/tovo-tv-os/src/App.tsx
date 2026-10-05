import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Accessibility, ArrowLeft, Bookmark, Check, ChevronDown, Clapperboard,
  Home, Info, Keyboard, Monitor, Play, Search, Settings2, ShieldCheck,
  Volume2, VolumeX, X,
} from 'lucide-react';
import { getPublicDomainMovies, type Movie } from './lib/archive';

type Settings = {
  playbackUrl: string;
  captions: boolean;
  autoplay: boolean;
  reducedMotion: boolean;
  volume: number;
  muted: boolean;
  resumePlayback: boolean;
  theme: 'cinema' | 'warm' | 'high-contrast';
  posterSize: 'regular' | 'large';
  largerText: boolean;
};

const defaultSettings: Settings = {
  playbackUrl: '',
  captions: false,
  autoplay: true,
  reducedMotion: false,
  volume: 72,
  muted: false,
  resumePlayback: true,
  theme: 'cinema',
  posterSize: 'regular',
  largerText: false,
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatPlayerTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;
  const hours = Math.floor(minutes / 60);
  return hours > 0
    ? `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
    : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

const settingCategories = [
  { id: 'Display', icon: Monitor, description: 'Theme and poster size' },
  { id: 'Audio', icon: Volume2, description: 'Volume and mute' },
  { id: 'Playback', icon: Clapperboard, description: 'Autoplay, resume, and source' },
  { id: 'Accessibility', icon: Accessibility, description: 'Motion, captions, and text size' },
  { id: 'About', icon: Info, description: 'Film sources and rights' },
];

function App() {
  const [view, setView] = useState('Home');
  const [previousView, setPreviousView] = useState('Home');
  const [selected, setSelected] = useState<Movie | null>(null);
  const [playing, setPlaying] = useState<Movie | null>(null);
  const [catalog, setCatalog] = useState<Movie[]>(() => readStorage('tovo-public-domain-catalog', [] as Movie[]));
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogLoadingMore, setCatalogLoadingMore] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [watchlist, setWatchlist] = useState<string[]>(() => readStorage('tovo-watchlist', []));
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>(() => readStorage('tovo-watchlist-movies', []));
  const [watchProgress, setWatchProgress] = useState<Record<string, number>>(() => readStorage('tovo-watch-progress', {}));
  const [settings, setSettings] = useState<Settings>(() => ({ ...defaultSettings, ...readStorage('tovo-settings', defaultSettings) }));
  const [category, setCategory] = useState('Display');
  const [search, setSearch] = useState('');
  const [urlDraft, setUrlDraft] = useState(settings.playbackUrl);
  const [toast, setToast] = useState('');
  const [playerControls, setPlayerControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerTime, setPlayerTime] = useState(0);
  const [playerDuration, setPlayerDuration] = useState(0);
  const toastTimer = useRef<number | undefined>(undefined);
  const searchRequestRef = useRef<AbortController | null>(null);
  const playerVideoRef = useRef<HTMLVideoElement>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2300);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setCatalogLoading(true);
      setCatalogError('');
      try {
        const result = await getPublicDomainMovies({ page: 1, signal: controller.signal });
        setCatalog(result.movies);
        setCatalogTotal(result.total);
        setCatalogPage(1);
        localStorage.setItem('tovo-public-domain-catalog', JSON.stringify(result.movies));
      } catch (error) {
        if (!controller.signal.aborted) {
          setCatalogError(error instanceof Error ? error.message : 'The film catalog could not be loaded.');
        }
      } finally {
        if (!controller.signal.aborted) setCatalogLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    localStorage.setItem('tovo-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);
  useEffect(() => {
    localStorage.setItem('tovo-watchlist-movies', JSON.stringify(watchlistMovies));
  }, [watchlistMovies]);
  useEffect(() => {
    localStorage.setItem('tovo-watch-progress', JSON.stringify(watchProgress));
  }, [watchProgress]);
  useEffect(() => {
    localStorage.setItem('tovo-settings', JSON.stringify(settings));
    document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion);
  }, [settings]);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    const video = playerVideoRef.current;
    if (!video) return;
    video.volume = settings.muted ? 0 : settings.volume / 100;
    for (const track of Array.from(video.textTracks)) {
      track.mode = settings.captions ? 'showing' : 'disabled';
    }
  }, [settings.volume, settings.muted, settings.captions, playing]);

  useEffect(() => {
    if (view !== 'Search') return;
    const term = search.trim();
    if (!term) {
      searchRequestRef.current?.abort();
      setSearchResults([]);
      setSearchError('');
      setSearchLoading(false);
      setSearchHasMore(false);
      setSearchPage(1);
      return;
    }

    setSearchLoading(true);
    setSearchResults([]);
    setSearchTotal(0);
    setSearchHasMore(false);
    const controller = new AbortController();
    searchRequestRef.current?.abort();
    searchRequestRef.current = controller;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      setSearchError('');
      try {
        const result = await getPublicDomainMovies({ search: term, page: 1, signal: controller.signal });
        if (!controller.signal.aborted) {
          setSearchResults(result.movies);
          setSearchTotal(result.total);
          setSearchPage(1);
          setSearchHasMore(result.pageSize < result.total);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchError(error instanceof Error ? error.message : 'The title search could not be completed.');
        }
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, view]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[data-remote-start]')?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view, category, selected, playing]);

  useEffect(() => {
    if (view !== 'Home' || catalog.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[data-remote-start]')?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [catalog.length > 0, view]);

  const setPage = (page: string) => {
    setSelected(null);
    setView(page);
    if (page === 'Search') setSearch('');
    window.scrollTo({ top: 0, behavior: settings.reducedMotion ? 'auto' : 'smooth' });
  };

  const toggleWatchlist = (movie: Movie) => {
    const saved = watchlist.includes(movie.id);
    setWatchlist((items) => saved ? items.filter((id) => id !== movie.id) : [...items, movie.id]);
    if (!saved) {
      setWatchlistMovies((items) => items.some((item) => item.id === movie.id) ? items : [...items, movie]);
    }
    notify(saved ? 'Removed from My List' : 'Added to My List');
  };

  const openDetails = (movie: Movie) => {
    setPreviousView(view);
    setSelected(movie);
    setView('Details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startPlayback = (movie: Movie) => {
    if (view !== 'Details') setPreviousView(view);
    setPlaying(movie);
    setView('Player');
    setPlayerControls(true);
    setIsPlaying(false);
    setPlayerTime(0);
    setPlayerDuration(movie.runtimeSeconds ?? 0);
  };

  const goBack = useCallback(() => {
    if (playing) {
      setPlaying(null);
      setView(selected ? 'Details' : previousView);
      setIsPlaying(false);
      return;
    }
    if (selected) {
      setSelected(null);
      setView(previousView);
      return;
    }
    if (view !== 'Home') {
      setPage('Home');
      return;
    }
  }, [playing, previousView, selected, view]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const supportedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'];
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || !supportedKeys.includes(event.key)) {
        event.preventDefault();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        goBack();
        return;
      }
      if (event.key === 'Enter') {
        const target = event.target;
        if (target instanceof HTMLElement && target.matches('button:not(:disabled), a[href]')) {
          event.preventDefault();
          target.click();
        }
        return;
      }
      if (event.target instanceof HTMLInputElement && event.target.type === 'range' &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' ||
        event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
      }
      const focusable = Array.from(document.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled):not([readonly]), a[href], [tabindex="0"]',
      )).filter((el) => el.getClientRects().length && !el.closest('[hidden]'));
      const current = document.activeElement as HTMLElement;
      if (!focusable.includes(current)) {
        document.querySelector<HTMLElement>('[data-remote-start]')?.focus();
        return;
      }
      const currentBox = current.getBoundingClientRect();
      const cx = currentBox.left + currentBox.width / 2;
      const cy = currentBox.top + currentBox.height / 2;
      const direction = event.key.slice(5).toLowerCase();
      const candidates = focusable.filter((el) => el !== current).map((el) => {
        const box = el.getBoundingClientRect();
        const dx = box.left + box.width / 2 - cx;
        const dy = box.top + box.height / 2 - cy;
        const primary = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy;
        const cross = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
        return { el, primary, cross };
      }).filter((candidate) => candidate.primary > 1)
        .sort((a, b) => (a.primary + a.cross * 2.5) - (b.primary + b.cross * 2.5));
      if (candidates[0]) {
        candidates[0].el.focus();
        candidates[0].el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: settings.reducedMotion ? 'auto' : 'smooth' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goBack, playing, settings.reducedMotion]);

  const filteredMovies = search.trim() ? searchResults : catalog;
  const featured = catalog[0];
  const continueWatching = catalog.filter((movie) => {
    const progress = watchProgress[movie.id] ?? 0;
    return movie.runtimeSeconds && progress > 0 && progress < movie.runtimeSeconds * 0.97;
  });
  const savedMovies = useMemo(() => {
    const movies = new Map([...watchlistMovies, ...catalog].map((movie) => [movie.id, movie]));
    return watchlist.flatMap((id) => movies.has(id) ? [movies.get(id)!] : []);
  }, [catalog, watchlist, watchlistMovies]);

  const loadMoreCatalog = async () => {
    if (catalogLoadingMore) return;
    setCatalogLoadingMore(true);
    setCatalogError('');
    try {
      const nextPage = catalogPage + 1;
      const result = await getPublicDomainMovies({ page: nextPage });
      setCatalog((movies) => {
        const merged = [...movies, ...result.movies.filter((movie) => !movies.some((item) => item.id === movie.id))];
        localStorage.setItem('tovo-public-domain-catalog', JSON.stringify(merged));
        return merged;
      });
      setCatalogTotal(result.total);
      setCatalogPage(nextPage);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'More films could not be loaded.');
    } finally {
      setCatalogLoadingMore(false);
    }
  };

  const loadMoreSearch = async () => {
    if (searchLoading) return;
    const controller = new AbortController();
    searchRequestRef.current?.abort();
    searchRequestRef.current = controller;
    setSearchLoading(true);
    setSearchError('');
    try {
      const nextPage = searchPage + 1;
      const result = await getPublicDomainMovies({ search, page: nextPage, signal: controller.signal });
      setSearchResults((movies) => {
        return [...movies, ...result.movies.filter((movie) => !movies.some((item) => item.id === movie.id))];
      });
      setSearchTotal(result.total);
      setSearchPage(nextPage);
      setSearchHasMore(nextPage * result.pageSize < result.total);
    } catch (error) {
      if (!controller.signal.aborted) {
        setSearchError(error instanceof Error ? error.message : 'More matching films could not be loaded.');
      }
    } finally {
      if (!controller.signal.aborted) setSearchLoading(false);
    }
  };

  const movieCard = (movie: Movie, progress = false, remoteStart = false) => (
    <button className="movie-card" key={movie.id} data-testid={`card-movie-${movie.id}`} data-remote-start={remoteStart ? '' : undefined} onClick={() => openDetails(movie)} aria-label={`View ${movie.title}`}>
      <img src={movie.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
      <span className="movie-info">
        <span className="movie-name">{movie.title}</span>
        <span className="movie-type">{movie.genre} <span aria-hidden="true">·</span> {movie.runtime}</span>
        {progress && movie.runtimeSeconds && watchProgress[movie.id] > 0 && (
          <span className="progress-track" aria-label={`${Math.round((watchProgress[movie.id] / movie.runtimeSeconds) * 100)}% watched`}>
            <span className="progress-fill" style={{ width: `${Math.min(100, Math.round((watchProgress[movie.id] / movie.runtimeSeconds) * 100))}%` }} />
          </span>
        )}
      </span>
    </button>
  );

  const rail = (title: string, movies: Movie[], showProgress = false, note?: string) => movies.length > 0 && (
    <section className="rail-section" aria-label={title} data-testid={`section-${title.toLowerCase().replaceAll(' ', '-')}`}>
      <div className="section-heading"><h2>{title}</h2>{note && <p>{note}</p>}</div>
      <div className="movie-rail">{movies.map((movie) => movieCard(movie, showProgress))}</div>
    </section>
  );

  const onScreenKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const urlKeyboardRows = [
    ['https://', 'www.', '.com', '.net', '.org'],
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    [':', '/', '.', '-', '_', '?', '&', '=', '%', '#', '@'],
  ];
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  const selectedCategory = settingCategories.find((item) => item.id === category) ?? settingCategories[0];
  const CategoryIcon = selectedCategory.icon;

  const renderSettings = () => {
    if (category === 'Display') return (
      <>
        <div className="setting-row setting-choice-row">
          <div><h3>Color theme</h3><p>Change the app colors and contrast.</p></div>
          <div className="setting-options" role="group" aria-label="Color theme">
            {([
              ['cinema', 'Cinema'],
              ['warm', 'Warm'],
              ['high-contrast', 'High contrast'],
            ] as const).map(([value, label]) => (
              <button key={value} className={`setting-option ${settings.theme === value ? 'selected' : ''}`} aria-pressed={settings.theme === value} data-testid={`theme-${value}`} onClick={() => updateSetting('theme', value)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="setting-row setting-choice-row">
          <div><h3>Poster size</h3><p>Choose the size of movie covers while browsing.</p></div>
          <div className="setting-options" role="group" aria-label="Poster size">
            <button className={`setting-option ${settings.posterSize === 'regular' ? 'selected' : ''}`} aria-pressed={settings.posterSize === 'regular'} data-testid="poster-size-regular" onClick={() => updateSetting('posterSize', 'regular')}>Regular</button>
            <button className={`setting-option ${settings.posterSize === 'large' ? 'selected' : ''}`} aria-pressed={settings.posterSize === 'large'} data-testid="poster-size-large" onClick={() => updateSetting('posterSize', 'large')}>Large</button>
          </div>
        </div>
      </>
    );
    if (category === 'Playback') return (
      <>
        <div className="setting-row">
          <div><h3>Custom video override</h3><p>Optional. When saved, this direct video URL is used instead of each film’s Archive copy.</p></div>
          <div className="setting-input">
            <input aria-label="Custom video URL" data-testid="input-playback-url" type="url" placeholder="Blank uses the selected film’s video" value={urlDraft} readOnly tabIndex={-1} />
            <button data-testid="button-save-playback-url" onClick={() => {
              const trimmed = urlDraft.trim();
              if (trimmed && !/^https?:\/\/\S+$/i.test(trimmed)) { notify('Enter a complete http or https URL'); return; }
              updateSetting('playbackUrl', trimmed);
              notify(trimmed ? 'Custom video override saved' : 'Using each film’s Archive video');
            }}>Save</button>
          </div>
        </div>
        <div className="remote-url-keyboard" aria-label="On-screen playback URL keyboard" data-testid="playback-url-keyboard">
          <p className="keyboard-hint">Choose characters with the arrows, then press Enter. Select Save when the URL is complete.</p>
          {urlKeyboardRows.map((row, rowIndex) => (
            <div className="remote-url-keyboard-row" key={rowIndex}>
              {row.map((key, keyIndex) => (
                <button
                  className={`keyboard-key ${key.length > 1 ? 'shortcut' : ''}`}
                  key={key}
                  type="button"
                  data-testid={`url-key-row-${rowIndex}-item-${keyIndex}`}
                  data-remote-start={category === 'Playback' && rowIndex === 0 && key === 'https://' ? '' : undefined}
                  onClick={() => setUrlDraft((draft) => draft + (key.length > 1 ? key.toLowerCase() : key.toLowerCase()))}
                >{key}</button>
              ))}
            </div>
          ))}
          <div className="remote-url-keyboard-row url-edit-keys">
            <button className="keyboard-key wide" type="button" data-testid="url-key-delete" onClick={() => setUrlDraft((draft) => draft.slice(0, -1))}>Delete</button>
            <button className="keyboard-key wide" type="button" data-testid="url-key-clear" onClick={() => setUrlDraft('')}>Clear</button>
          </div>
        </div>
        <div className="setting-row"><div><h3>Autoplay</h3><p>Start the video automatically when you open a film.</p></div><button className={`toggle ${settings.autoplay ? 'on' : ''}`} aria-label="Toggle autoplay" aria-pressed={settings.autoplay} data-testid="toggle-autoplay" onClick={() => updateSetting('autoplay', !settings.autoplay)}><i /></button></div>
        <div className="setting-row"><div><h3>Resume playback</h3><p>Continue from the saved position when you reopen a film.</p></div><button className={`toggle ${settings.resumePlayback ? 'on' : ''}`} aria-label="Toggle resume playback" aria-pressed={settings.resumePlayback} data-testid="toggle-resume-playback" onClick={() => updateSetting('resumePlayback', !settings.resumePlayback)}><i /></button></div>
        <div className="setting-row"><div><h3>Playback source</h3><p>{settings.playbackUrl ? 'Your saved custom video URL overrides the catalog source.' : 'Each film uses its own playable video file from Internet Archive.'}</p></div><span className="source-status">{settings.playbackUrl ? <><Check size={16} /> Custom</> : 'Film source'}</span></div>
      </>
    );
    if (category === 'Audio') return (
      <>
        <div className="setting-row"><div><h3>Volume</h3><p>Default playback level · {settings.volume}%</p></div><input className="range" data-testid="input-volume" aria-label="Default volume" type="range" min="0" max="100" value={settings.volume} onChange={(event) => updateSetting('volume', Number(event.target.value))} /></div>
        <div className="setting-row"><div><h3>{settings.muted ? <><VolumeX size={17} aria-hidden="true" /> Muted</> : <><Volume2 size={17} aria-hidden="true" /> Sound on</>}</h3><p>{settings.muted ? 'Player audio is muted.' : 'Player audio uses the volume level above.'}</p></div><button className={`toggle ${settings.muted ? 'on' : ''}`} aria-label="Toggle mute" aria-pressed={settings.muted} data-testid="toggle-mute" onClick={() => updateSetting('muted', !settings.muted)}><i /></button></div>
      </>
    );
    if (category === 'Accessibility') return (
      <>
        <div className="setting-row"><div><h3>Reduced motion</h3><p>Reduce animated transitions and smooth scrolling.</p></div><button className={`toggle ${settings.reducedMotion ? 'on' : ''}`} aria-label="Toggle reduced motion" aria-pressed={settings.reducedMotion} data-testid="toggle-reduced-motion" onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}><i /></button></div>
        <div className="setting-row"><div><h3>Captions</h3><p>Turn on a film’s English captions when an Archive VTT track is available.</p></div><button className={`toggle ${settings.captions ? 'on' : ''}`} aria-label="Toggle captions" aria-pressed={settings.captions} data-testid="toggle-captions" onClick={() => updateSetting('captions', !settings.captions)}><i /></button></div>
        <div className="setting-row"><div><h3>Larger text</h3><p>Increase the interface text size for easier reading.</p></div><button className={`toggle ${settings.largerText ? 'on' : ''}`} aria-label="Toggle larger text" aria-pressed={settings.largerText} data-testid="toggle-larger-text" onClick={() => updateSetting('largerText', !settings.largerText)}><i /></button></div>
        <div className="setting-row"><div><h3>Remote navigation</h3><p>Move with the arrows, select with Enter, and return with Escape.</p></div><Keyboard size={19} color="#cf9278" /></div>
      </>
    );
    if (category === 'About') return (
      <>
        <div className="setting-row"><div><h3>Real film catalog</h3><p>Titles and video files are loaded live from Internet Archive’s feature-film collection.</p></div><span className="source-status">{catalogTotal.toLocaleString()} records</span></div>
        <div className="setting-row"><div><h3>Rights information</h3><p>Only items whose Archive metadata declares a public-domain license are listed. Check each source record for rights details.</p></div><ShieldCheck size={20} color="#cf9278" /></div>
        <div className="setting-row"><div><h3>Catalog source</h3><p>Internet Archive hosts these films. Commercial subscription catalogs and new releases are not included.</p></div><a className="source-link" href="https://archive.org/details/feature_films" target="_blank" rel="noreferrer">Open collection</a></div>
        <div className="setting-row"><div><h3>App data</h3><p>Your settings, saved list, and viewing positions are stored in this browser.</p></div><Monitor size={20} color="#cf9278" /></div>
      </>
    );
    return null;
  };

  return (
    <div className={`app-shell grain theme-${settings.theme} poster-${settings.posterSize} ${settings.largerText ? 'larger-text' : ''}`} data-testid="tovo-app">
      {view !== 'Player' && (
        <>
          <header className="topbar">
            <button className="brand" data-testid="button-home-brand" onClick={() => setPage('Home')} aria-label="Tovo home">
              <span className="brand-mark"><Play size={14} fill="currentColor" /></span><span>TOVO</span>
            </button>
            <div className="top-actions">
              <button className="icon-button" aria-label="Search titles" data-testid="button-open-search" onClick={() => setPage('Search')}><Search size={19} /></button>
              <button className="profile-chip" data-testid="button-profile" onClick={() => { setCategory('About'); setPage('Settings'); }}><span className="profile-dot">T</span><span>Living room</span><ChevronDown size={14} /></button>
            </div>
          </header>
          <nav className="side-rail" aria-label="Main navigation" data-testid="navigation">
            {[
              { label: 'Home', icon: Home },
              { label: 'Search', icon: Search },
              { label: 'My List', icon: Bookmark },
              { label: 'Settings', icon: Settings2 },
            ].map(({ label, icon: Icon }) => (
              <button key={label} className={`nav-item ${view === label ? 'active' : ''}`} aria-current={view === label ? 'page' : undefined} data-testid={`nav-${label.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setPage(label)}>
                <Icon size={21} strokeWidth={1.7} /><span>{label}</span>
              </button>
            ))}
            <div className="nav-spacer" />
            <button className="nav-item" data-testid="button-nav-about" onClick={() => { setCategory('About'); setPage('Settings'); }} aria-label="About Tovo"><Info size={20} /><span>About</span></button>
          </nav>
        </>
      )}

      <main>
        {view === 'Home' && (
          <div className="view-fade" data-testid="screen-home">
            {featured ? (
              <section className="hero" aria-label="Featured public-domain film">
                <img className="hero-image" src={featured.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                <div className="hero-shade" />
                <div className="hero-content">
                  <div className="eyebrow">Internet Archive · Public-domain film</div>
                  <h1 className="hero-title">{featured.title}</h1>
                  <div className="meta"><span>{featured.year}</span><span className="meta-dot">•</span><span>{featured.runtime}</span><span className="meta-dot">•</span><span>{featured.genre}</span></div>
                  <p className="synopsis">{featured.synopsis}</p>
                  <div className="action-row">
                    <button className="action-button primary" data-testid="button-featured-play" data-remote-start="" onClick={() => startPlayback(featured)}><Play size={18} fill="currentColor" /> Play film</button>
                    <button className="action-button secondary" data-testid="button-featured-details" onClick={() => openDetails(featured)}><Info size={18} /> Details</button>
                    <button className="action-button secondary" data-testid="button-featured-list" onClick={() => toggleWatchlist(featured)}><Bookmark size={17} fill={watchlist.includes(featured.id) ? 'currentColor' : 'none'} /> {watchlist.includes(featured.id) ? 'In My List' : 'My List'}</button>
                  </div>
                  <a className="hero-source-link" href={featured.sourceUrl} target="_blank" rel="noreferrer">Source & rights: {featured.licenseName}</a>
                </div>
                <span className="feature-index">01 / {catalog.length.toString().padStart(2, '0')} · ARCHIVE FILM</span>
              </section>
            ) : (
              <section className="hero hero-empty" aria-label="Film catalog status">
                <div className="hero-content">
                  <div className="eyebrow">Internet Archive · Feature films</div>
                  <h1 className="hero-title">{catalogLoading ? 'Loading real films…' : 'The catalog is not available.'}</h1>
                  <p className="synopsis">{catalogError || 'Loading titles and playable video files from the public-domain collection.'}</p>
                  {!catalogLoading && <button className="action-button primary" data-remote-start="" onClick={() => window.location.reload()}>Try again</button>}
                </div>
              </section>
            )}
            <div className="content-area">
              {rail('Continue Watching', continueWatching, true, 'Pick up where you left off')}
              {rail('Popular public-domain films', catalog.slice(1, 7), false, 'Playable titles from Internet Archive')}
              {rail('More from the collection', catalog.slice(7, 13), false)}
              {catalogError && catalog.length > 0 && <p className="catalog-message error-message" role="alert">{catalogError}</p>}
              {catalogPage * 18 < catalogTotal ? (
                <button className="action-button secondary load-more-button" data-testid="button-load-more-films" disabled={catalogLoadingMore} onClick={() => void loadMoreCatalog()}>{catalogLoadingMore ? 'Loading films…' : 'Load more films'}</button>
              ) : null}
            </div>
          </div>
        )}

        {view === 'Search' && (
          <section className="view-fade" data-testid="screen-search">
            <div className="page-heading"><div className="eyebrow">Search the real catalog</div><h1>Search</h1><p>Search public-domain feature-film titles hosted by Internet Archive.</p></div>
            <div className="search-panel">
              <label className="sr-only" htmlFor="title-search">Search public-domain film titles</label>
              <div className="search-input-wrap"><Search size={22} /><input id="title-search" className="search-input" type="search" placeholder="Choose letters below" value={search} readOnly tabIndex={-1} data-testid="input-search" /><button className="icon-button" aria-label="Clear search" data-testid="button-clear-search" onClick={() => setSearch('')}><X size={18} /></button></div>
              <div className="keyboard" aria-label="On-screen keyboard" data-testid="on-screen-keyboard">
                {onScreenKeys.map((key, index) => <button className="keyboard-key" key={key} data-testid={`keyboard-key-${key.toLowerCase()}`} data-remote-start={index === 0 ? '' : undefined} onClick={() => setSearch((query) => query + key.toLowerCase())}>{key}</button>)}
                <button className="keyboard-key wide" data-testid="keyboard-space" onClick={() => setSearch((query) => `${query} `)}>Space</button>
                <button className="keyboard-key wide" data-testid="keyboard-backspace" onClick={() => setSearch((query) => query.slice(0, -1))}>Delete</button>
              </div>
              <div className="catalog-result-status" role="status" aria-live="polite">
                {searchLoading ? 'Searching Internet Archive…' : search.trim() ? `${searchTotal.toLocaleString()} matching catalog records` : `${catalog.length} films loaded · enter a title to search the full collection`}
              </div>
              {searchError && <p className="catalog-message error-message" role="alert">{searchError}</p>}
              <div className="catalog-grid search-results" data-testid="search-results">
                {filteredMovies.map((movie) => movieCard(movie))}
              </div>
              {(searchLoading || (!search.trim() && catalogLoading)) && filteredMovies.length === 0 && <div className="empty-state"><Search size={25} /><h2>Looking through the collection</h2><p>Matching films and their playable video files are being checked.</p></div>}
              {!searchLoading && !catalogLoading && filteredMovies.length === 0 && <div className="empty-state" data-testid="empty-search"><Search size={25} /><h2>{search.trim() ? 'No playable film found' : 'No films loaded yet'}</h2><p>{search.trim() ? 'Try another title. Only films with public-domain metadata and a playable video file are shown.' : catalogError || 'Check your connection and try again.'}</p></div>}
              {search.trim() && searchHasMore && <button className="action-button secondary load-more-button" data-testid="button-search-more" disabled={searchLoading} onClick={() => void loadMoreSearch()}>{searchLoading ? 'Loading…' : 'More matching films'}</button>}
            </div>
          </section>
        )}

        {view === 'My List' && (
          <section className="view-fade" data-testid="screen-my-list">
            <div className="page-heading"><div className="eyebrow">Saved for later</div><h1>My List</h1><p>Your shortlist, ready when you are.</p></div>
            {savedMovies.length > 0 ? <div className="catalog-grid" data-testid="my-list-grid">{savedMovies.map((movie, index) => movieCard(movie, false, index === 0))}</div> : (
              <div className="empty-state" data-testid="empty-my-list"><Bookmark size={26} /><h2>Your list is a blank canvas.</h2><p>Save a title from its details or the featured story and it will be waiting here.</p><button className="action-button secondary" data-testid="button-explore-catalog" data-remote-start="" onClick={() => setPage('Home')}>Explore titles</button></div>
            )}
          </section>
        )}

        {view === 'Details' && selected && (
          <section className="details view-fade" data-testid={`screen-details-${selected.id}`}>
            <img className="details-backdrop" src={selected.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
            <div className="details-content">
              <button className="back-link" aria-label="Back" data-testid="button-details-back" onClick={goBack}><ArrowLeft size={20} /></button>
              <div className="eyebrow">{selected.genre}</div>
              <h1>{selected.title}</h1>
              <div className="detail-facts"><span>{selected.year}</span><span>{selected.runtime}</span><span>Feature film</span></div>
              <p>{selected.synopsis}</p>
              <div className="action-row">
                <button className="action-button primary" data-testid="button-details-play" data-remote-start="" onClick={() => startPlayback(selected)}><Play size={18} fill="currentColor" /> Play film</button>
                <button className="action-button secondary" data-testid="button-details-list" onClick={() => toggleWatchlist(selected)}><Bookmark size={17} fill={watchlist.includes(selected.id) ? 'currentColor' : 'none'} /> {watchlist.includes(selected.id) ? 'In My List' : 'Add to My List'}</button>
              </div>
              <div className="detail-note">Rights metadata: {selected.licenseName}. This title’s video is hosted by Internet Archive.</div>
              <a className="source-link detail-source-link" href={selected.sourceUrl} target="_blank" rel="noreferrer">View original film and rights record</a>
            </div>
          </section>
        )}

        {view === 'Settings' && (
          <section className="view-fade" data-testid="screen-settings">
            <div className="page-heading"><div className="eyebrow">Make it yours</div><h1>Settings</h1><p>Thoughtful defaults for the room you're in.</p></div>
            <div className="settings-layout">
              <div className="settings-list" role="tablist" aria-label="Settings categories">
                {settingCategories.map(({ id, icon: Icon, description }) => (
                  <button key={id} role="tab" aria-selected={category === id} className={`setting-tile ${category === id ? 'active' : ''}`} data-testid={`settings-tab-${id.toLowerCase()}`} data-remote-start={category === id ? '' : undefined} onClick={() => setCategory(id)}>
                    <Icon size={19} /><span>{id}</span><small>{description}</small>
                  </button>
                ))}
              </div>
              <article className="settings-panel" role="tabpanel" data-testid={`settings-panel-${category.toLowerCase()}`}>
                <div className="panel-kicker"><CategoryIcon size={17} /> PREFERENCES</div>
                <h2>{category}</h2><p>{selectedCategory.description}</p>
                {renderSettings()}
                <div className="settings-footer">Your choices are saved in this browser. Arrow keys move focus; Enter selects; Escape goes back.</div>
              </article>
            </div>
          </section>
        )}
      </main>

      {view === 'Player' && playing && (
        <section className={`player-view ${playerControls ? 'controls-open' : ''}`} aria-label={`Playback: ${playing.title}`} data-testid="screen-player" onMouseMove={() => setPlayerControls(true)} onClick={() => setPlayerControls((visible) => !visible)}>
          <header className="player-top">
            <div className="player-title">{playing.title}<small>{playing.year} <span aria-hidden="true">·</span> {playing.runtime}</small></div>
            <button className="icon-button" aria-label="Close player" data-testid="button-close-player" onClick={(event) => { event.stopPropagation(); goBack(); }}><X size={21} /></button>
          </header>
          <div className="player-box">
            <video
              ref={playerVideoRef}
              data-testid="native-player"
              src={settings.playbackUrl || playing.videoUrl}
              poster={playing.image}
              autoPlay={settings.autoplay}
              muted={settings.muted}
              playsInline
              preload="metadata"
              tabIndex={-1}
              onLoadedMetadata={(event) => {
                const video = event.currentTarget;
                const duration = Number.isFinite(video.duration) ? video.duration : playing.runtimeSeconds ?? 0;
                setPlayerDuration(duration);
                if (settings.resumePlayback) {
                  const saved = watchProgress[playing.id] ?? 0;
                  if (saved > 0 && (!duration || saved < duration - 10)) video.currentTime = saved;
                }
                video.volume = settings.muted ? 0 : settings.volume / 100;
                for (const track of Array.from(video.textTracks)) track.mode = settings.captions ? 'showing' : 'disabled';
              }}
              onTimeUpdate={(event) => {
                const video = event.currentTarget;
                const currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
                setPlayerTime(currentTime);
                if (Math.floor(currentTime) !== Math.floor(watchProgress[playing.id] ?? -1)) {
                  setWatchProgress((progress) => ({ ...progress, [playing.id]: currentTime }));
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={(event) => {
                setIsPlaying(false);
                if (event.currentTarget.currentTime > 0) {
                  setWatchProgress((progress) => ({ ...progress, [playing.id]: event.currentTarget.currentTime }));
                }
              }}
              onEnded={() => {
                setIsPlaying(false);
                setWatchProgress((progress) => {
                  const next = { ...progress };
                  delete next[playing.id];
                  return next;
                });
              }}
              onClick={(event) => event.stopPropagation()}
              onError={() => { setIsPlaying(false); notify('This video could not be loaded. Open its Archive record to check availability.'); }}
            >
              {playing.captionUrl && <track kind="captions" src={playing.captionUrl} srcLang="en" label="English" default={settings.captions} />}
              This browser cannot play this video. Open the film’s Archive record for alternate formats.
            </video>
          </div>
          <div className="player-controls" onClick={(event) => event.stopPropagation()}>
            <label className="sr-only" htmlFor="player-seek">Seek through film</label>
            <input id="player-seek" className="player-progress" data-testid="player-seek" type="range" min="0" max={playerDuration || 1} step="1" value={Math.min(playerTime, playerDuration || playerTime)} onChange={(event) => {
              const time = Number(event.target.value);
              if (playerVideoRef.current) playerVideoRef.current.currentTime = time;
              setPlayerTime(time);
            }} />
            <div className="player-bottom">
              <span>{formatPlayerTime(playerTime)} / {formatPlayerTime(playerDuration)} · {isPlaying ? 'Playing' : 'Paused'}{playing.captionUrl ? '' : ' · No captions file'}</span>
              <div className="player-control-buttons">
                <button className="icon-button" aria-label="Rewind 10 seconds" data-testid="button-player-rewind" onClick={() => { if (playerVideoRef.current) playerVideoRef.current.currentTime = Math.max(0, playerVideoRef.current.currentTime - 10); }}>−10s</button>
                <button className="action-button primary" aria-label={isPlaying ? 'Pause playback' : 'Start playback'} data-testid="button-player-toggle" data-remote-start="" onClick={() => {
                  const video = playerVideoRef.current;
                  if (video?.paused) void video.play().catch(() => notify('Playback could not start. Use Enter to try again or check the Archive source.'));
                  else video?.pause();
                }}>{isPlaying ? 'Pause' : 'Play'}</button>
                <button className="icon-button" aria-label="Skip ahead 10 seconds" data-testid="button-player-forward" onClick={() => { if (playerVideoRef.current) playerVideoRef.current.currentTime = Math.min(playerVideoRef.current.duration || Infinity, playerVideoRef.current.currentTime + 10); }}>+10s</button>
                <button className="icon-button" aria-label="Back to browsing" data-testid="button-player-exit" onClick={goBack}><ArrowLeft size={18} /></button>
              </div>
            </div>
          </div>
        </section>
      )}
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite" data-testid="status-toast">{toast}</div>
    </div>
  );
}

export default App;