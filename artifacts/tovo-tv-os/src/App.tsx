import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Accessibility, ArrowLeft, Bookmark, Check, ChevronDown, Clapperboard,
  Film, Headphones, Home, Info, Keyboard, Monitor, Play, Search, Settings2,
  ShieldCheck, SlidersHorizontal, Volume2, X,
} from 'lucide-react';

type Movie = {
  id: string;
  title: string;
  genre: string;
  runtime: string;
  rating: string;
  year: string;
  image: string;
  synopsis: string;
  progress?: number;
  featured?: boolean;
};

type Settings = {
  playbackUrl: string;
  captions: boolean;
  autoplay: boolean;
  reducedMotion: boolean;
  volume: number;
};

const catalog: Movie[] = [
  {
    id: 'echoes-orbit',
    title: 'Echoes of Orbit',
    genre: 'Science Fiction',
    runtime: '2h 12m',
    rating: 'PG-13',
    year: '2026',
    image: 'https://images.pexels.com/photos/2150/sky-space-dark-galaxy.jpg?auto=compress&cs=tinysrgb&w=1920',
    synopsis: 'When a celestial anomaly bends the edge of time, a solitary navigator races to bring her crew home before the stars go dark.',
    featured: true,
  },
  {
    id: 'long-way-home',
    title: 'The Long Way Home',
    genre: 'Adventure · Drama',
    runtime: '2h 04m',
    rating: 'PG-13',
    year: '2025',
    image: 'https://images.pexels.com/photos/4355348/pexels-photo-4355348.jpeg?auto=compress&cs=tinysrgb&w=800',
    synopsis: 'A pilot stranded at the edge of a quiet planet finds a reason to chart the impossible route back.',
    progress: 68,
  },
  {
    id: 'neon-district',
    title: 'Neon District',
    genre: 'Thriller',
    runtime: '1h 48m',
    rating: 'R',
    year: '2025',
    image: 'https://images.pexels.com/photos/104707/pexels-photo-104707.jpeg?auto=compress&cs=tinysrgb&w=800',
    synopsis: 'One last night shift in a rain-soaked city turns into a pursuit through the places nobody remembers.',
    progress: 34,
  },
  {
    id: 'high-country',
    title: 'High Country',
    genre: 'Documentary',
    runtime: '1h 31m',
    rating: 'G',
    year: '2024',
    image: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800',
    synopsis: 'A patient portrait of the mountain communities who live by the changing light of the high alpine.',
    progress: 81,
  },
  {
    id: 'signal-meridian',
    title: 'Signal Meridian',
    genre: 'Science Fiction',
    runtime: '2h 12m',
    rating: 'PG-13',
    year: '2026',
    image: 'https://images.pexels.com/photos/7170769/pexels-photo-7170769.jpeg?auto=compress&cs=tinysrgb&w=800',
    synopsis: 'A deep-space signal carries a voice no one expected to hear again.',
  },
  {
    id: 'second-exposure',
    title: 'Second Exposure',
    genre: 'Drama',
    runtime: '1h 54m',
    rating: 'PG-13',
    year: '2025',
    image: 'https://images.pexels.com/photos/9589958/pexels-photo-9589958.jpeg?auto=compress&cs=tinysrgb&w=800',
    synopsis: 'An archival photographer returns to her hometown and discovers the image that changed everything.',
  },
  {
    id: 'after-midnight',
    title: 'After Midnight',
    genre: 'Mystery · Thriller',
    runtime: '1h 46m',
    rating: 'R',
    year: '2024',
    image: 'https://images.pexels.com/photos/104707/pexels-photo-104707.jpeg?auto=compress&cs=tinysrgb&w=800',
    synopsis: 'A radio host takes a call from a missing caller, live, three years after the line went quiet.',
  },
  {
    id: 'summit',
    title: 'Summit',
    genre: 'Documentary',
    runtime: '1h 31m',
    rating: 'G',
    year: '2024',
    image: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800',
    synopsis: 'A small team makes one final ascent to document a glacier before the season changes.',
  },
];

const defaultSettings: Settings = {
  playbackUrl: '',
  captions: false,
  autoplay: true,
  reducedMotion: false,
  volume: 72,
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

const settingCategories = [
  { id: 'Display', icon: Monitor, description: 'Picture and on-screen preferences' },
  { id: 'Audio', icon: Volume2, description: 'Sound and listening preferences' },
  { id: 'Playback', icon: Clapperboard, description: 'Your playback source and controls' },
  { id: 'Accessibility', icon: Accessibility, description: 'Make the experience yours' },
  { id: 'About', icon: Info, description: 'About this Tovo prototype' },
];

function App() {
  const [view, setView] = useState('Home');
  const [previousView, setPreviousView] = useState('Home');
  const [selected, setSelected] = useState<Movie | null>(null);
  const [playing, setPlaying] = useState<Movie | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(() => readStorage('tovo-watchlist', []));
  const [settings, setSettings] = useState<Settings>(() => ({ ...defaultSettings, ...readStorage('tovo-settings', defaultSettings) }));
  const [category, setCategory] = useState('Display');
  const [search, setSearch] = useState('');
  const [urlDraft, setUrlDraft] = useState(settings.playbackUrl);
  const [toast, setToast] = useState('');
  const [playerControls, setPlayerControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2300);
  }, []);

  useEffect(() => {
    localStorage.setItem('tovo-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);
  useEffect(() => {
    localStorage.setItem('tovo-settings', JSON.stringify(settings));
    document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion);
  }, [settings]);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const setPage = (page: string) => {
    setSelected(null);
    setView(page);
    if (page === 'Search') window.setTimeout(() => searchRef.current?.focus(), 80);
    window.scrollTo({ top: 0, behavior: settings.reducedMotion ? 'auto' : 'smooth' });
  };

  const toggleWatchlist = (movie: Movie) => {
    const saved = watchlist.includes(movie.id);
    setWatchlist((items) => saved ? items.filter((id) => id !== movie.id) : [...items, movie.id]);
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
  };

  const goBack = useCallback(() => {
    if (playing) {
      setPlaying(null);
      setView(previousView === 'Details' ? 'Home' : previousView);
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
      if (event.key === 'Escape' || event.key === 'Backspace') {
        if ((event.target as HTMLElement)?.tagName === 'INPUT' && event.key === 'Backspace') return;
        event.preventDefault();
        goBack();
        return;
      }
      if (playing && event.key === ' ') {
        event.preventDefault();
        const video = document.querySelector<HTMLVideoElement>('[data-testid="native-player"]');
        if (video) {
          if (video.paused) void video.play();
          else video.pause();
        } else setPlayerControls((open) => !open);
        return;
      }
      if (event.key === '/' && !playing) {
        event.preventDefault();
        setPage('Search');
        return;
      }
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const focusable = Array.from(document.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [tabindex="0"]',
      )).filter((el) => el.getClientRects().length && !el.closest('[hidden]'));
      const current = document.activeElement as HTMLElement;
      if (!focusable.includes(current)) {
        focusable[0]?.focus();
        event.preventDefault();
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
        event.preventDefault();
        candidates[0].el.focus();
        candidates[0].el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: settings.reducedMotion ? 'auto' : 'smooth' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goBack, playing, settings.reducedMotion]);

  const filteredMovies = useMemo(() => catalog.filter((movie) =>
    `${movie.title} ${movie.genre} ${movie.year}`.toLowerCase().includes(search.trim().toLowerCase()),
  ), [search]);
  const featured = catalog[0];
  const continueWatching = catalog.filter((movie) => movie.progress);
  const savedMovies = catalog.filter((movie) => watchlist.includes(movie.id));

  const movieCard = (movie: Movie, progress = false) => (
    <button className="movie-card" key={movie.id} data-testid={`card-movie-${movie.id}`} onClick={() => openDetails(movie)} aria-label={`View ${movie.title}`}>
      <img src={movie.image} alt="" loading="lazy" />
      <span className="movie-info">
        <span className="movie-name">{movie.title}</span>
        <span className="movie-type">{movie.genre} <span aria-hidden="true">·</span> {movie.runtime}</span>
        {progress && movie.progress && <span className="progress-track" aria-label={`${movie.progress}% watched`}><span className="progress-fill" style={{ width: `${movie.progress}%` }} /></span>}
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
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  const selectedCategory = settingCategories.find((item) => item.id === category) ?? settingCategories[0];
  const CategoryIcon = selectedCategory.icon;

  const renderSettings = () => {
    if (category === 'Playback') return (
      <>
        <div className="setting-row">
          <div><h3>Direct video URL</h3><p>Use a video URL you have permission to play. No third-party stream sources are included.</p></div>
          <div className="setting-input">
            <input aria-label="Direct video URL" data-testid="input-playback-url" type="url" placeholder="https://example.com/movie.mp4" value={urlDraft} onChange={(event) => setUrlDraft(event.target.value)} />
            <button data-testid="button-save-playback-url" onClick={() => {
              const trimmed = urlDraft.trim();
              if (trimmed && !/^https?:\/\//i.test(trimmed)) { notify('Enter a complete http or https URL'); return; }
              updateSetting('playbackUrl', trimmed);
              notify(trimmed ? 'Playback source saved' : 'Playback source cleared');
            }}>Save</button>
          </div>
        </div>
        <div className="setting-row"><div><h3>Autoplay</h3><p>Start configured video as soon as playback opens.</p></div><button className={`toggle ${settings.autoplay ? 'on' : ''}`} aria-label="Toggle autoplay" aria-pressed={settings.autoplay} data-testid="toggle-autoplay" onClick={() => updateSetting('autoplay', !settings.autoplay)}><i /></button></div>
        <div className="setting-row"><div><h3>Current source</h3><p>{settings.playbackUrl ? settings.playbackUrl : 'No video source configured'}</p></div><span className="source-status">{settings.playbackUrl ? <><Check size={16} /> Ready</> : 'Not set'}</span></div>
      </>
    );
    if (category === 'Audio') return (
      <>
        <div className="setting-row"><div><h3>Volume</h3><p>Default playback level · {settings.volume}%</p></div><input className="range" data-testid="input-volume" aria-label="Default volume" type="range" min="0" max="100" value={settings.volume} onChange={(event) => updateSetting('volume', Number(event.target.value))} /></div>
        <div className="setting-row"><div><h3>Dialogue enhancement</h3><p>Keep spoken-word settings in one place.</p></div><span className="source-status">Native player</span></div>
        <div className="setting-row"><div><h3>Audio output</h3><p>Output is controlled by this browser and your device.</p></div><span className="source-status"><Headphones size={16} /> Device</span></div>
      </>
    );
    if (category === 'Accessibility') return (
      <>
        <div className="setting-row"><div><h3>Reduced motion</h3><p>Reduce animated transitions and smooth scrolling.</p></div><button className={`toggle ${settings.reducedMotion ? 'on' : ''}`} aria-label="Toggle reduced motion" aria-pressed={settings.reducedMotion} data-testid="toggle-reduced-motion" onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}><i /></button></div>
        <div className="setting-row"><div><h3>Captions preference</h3><p>Request captions when the configured video provides a caption track.</p></div><button className={`toggle ${settings.captions ? 'on' : ''}`} aria-label="Toggle captions preference" aria-pressed={settings.captions} data-testid="toggle-captions" onClick={() => updateSetting('captions', !settings.captions)}><i /></button></div>
        <div className="setting-row"><div><h3>Remote navigation</h3><p>Use arrow keys to move focus, Enter to select, Escape or Backspace to go back.</p></div><Keyboard size={19} color="#cf9278" /></div>
      </>
    );
    if (category === 'About') return (
      <>
        <div className="setting-row"><div><h3>Tovo TV</h3><p>A living-room browsing prototype built for the web.</p></div><span className="source-status">Preview</span></div>
        <div className="setting-row"><div><h3>Playback is yours</h3><p>This prototype does not include licensed titles or a content delivery service. Add a direct video URL you are authorized to use.</p></div><ShieldCheck size={20} color="#cf9278" /></div>
        <div className="setting-row"><div><h3>Platform note</h3><p>This is a browser experience, not a bootable TV operating system.</p></div><Monitor size={20} color="#cf9278" /></div>
      </>
    );
    return (
      <>
        <div className="setting-row"><div><h3>Interface motion</h3><p>Use the reduced-motion preference set on your device.</p></div><span className="source-status">{settings.reducedMotion ? 'Reduced' : 'Standard'}</span></div>
        <div className="setting-row"><div><h3>Browse layout</h3><p>Poster rails adapt to your screen size, from a television to a phone.</p></div><SlidersHorizontal size={19} color="#cf9278" /></div>
        <div className="setting-row"><div><h3>Display mode</h3><p>Graphite, warm neutral, and copper. Tuned for a dim room.</p></div><span className="source-status">Cinema</span></div>
      </>
    );
  };

  return (
    <div className="app-shell grain" data-testid="tovo-app">
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
            <section className="hero" aria-label="Featured title">
              <img className="hero-image" src={featured.image} alt="" />
              <div className="hero-shade" />
              <div className="hero-content">
                <div className="eyebrow">The Tovo premiere · Featured</div>
                <h1 className="hero-title">{featured.title}</h1>
                <div className="meta"><span>{featured.year}</span><span className="meta-dot">•</span><span>{featured.runtime}</span><span className="meta-dot">•</span><span>{featured.rating}</span><span className="meta-dot">•</span><span>{featured.genre}</span></div>
                <p className="synopsis">{featured.synopsis}</p>
                <div className="action-row">
                  <button className="action-button primary" data-testid="button-featured-play" onClick={() => startPlayback(featured)}><Play size={18} fill="currentColor" /> Play</button>
                  <button className="action-button secondary" data-testid="button-featured-details" onClick={() => openDetails(featured)}><Info size={18} /> Details</button>
                  <button className="action-button secondary" data-testid="button-featured-list" onClick={() => toggleWatchlist(featured)}><Bookmark size={17} fill={watchlist.includes(featured.id) ? 'currentColor' : 'none'} /> {watchlist.includes(featured.id) ? 'In My List' : 'My List'}</button>
                </div>
              </div>
              <span className="feature-index">01 / 08 · TONIGHT'S PICK</span>
            </section>
            <div className="content-area">
              {rail('Continue Watching', continueWatching, true, 'Pick up where you left off')}
              {rail('Made for your evening', [catalog[4], catalog[5], catalog[6], catalog[7], catalog[1]], false, 'A few good places to begin')}
              {rail('Recently added', [catalog[2], catalog[3], catalog[0], catalog[5]], false)}
            </div>
          </div>
        )}

        {view === 'Search' && (
          <section className="view-fade" data-testid="screen-search">
            <div className="page-heading"><div className="eyebrow">Find your next watch</div><h1>Search</h1><p>Titles, genres, a mood. Start anywhere.</p></div>
            <div className="search-panel">
              <label className="sr-only" htmlFor="title-search">Search titles and genres</label>
              <div className="search-input-wrap"><Search size={22} /><input ref={searchRef} id="title-search" className="search-input" type="search" placeholder="Search titles and genres" value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-search" /><button className="icon-button" aria-label="Clear search" data-testid="button-clear-search" onClick={() => { setSearch(''); searchRef.current?.focus(); }}><X size={18} /></button></div>
              <div className="keyboard" aria-label="On-screen keyboard" data-testid="on-screen-keyboard">
                {onScreenKeys.map((key) => <button className="keyboard-key" key={key} data-testid={`keyboard-key-${key.toLowerCase()}`} onClick={() => setSearch((query) => query + key.toLowerCase())}>{key}</button>)}
                <button className="keyboard-key wide" data-testid="keyboard-space" onClick={() => setSearch((query) => `${query} `)}>Space</button>
                <button className="keyboard-key wide" data-testid="keyboard-backspace" onClick={() => setSearch((query) => query.slice(0, -1))}>Delete</button>
              </div>
              <div className="catalog-grid search-results" data-testid="search-results">
                {filteredMovies.map((movie) => movieCard(movie))}
              </div>
              {filteredMovies.length === 0 && <div className="empty-state" data-testid="empty-search"><Search size={25} /><h2>Nothing in the frame</h2><p>Try a different title or genre. Your search stays on this device.</p></div>}
            </div>
          </section>
        )}

        {view === 'My List' && (
          <section className="view-fade" data-testid="screen-my-list">
            <div className="page-heading"><div className="eyebrow">Saved for later</div><h1>My List</h1><p>Your shortlist, ready when you are.</p></div>
            {savedMovies.length > 0 ? <div className="catalog-grid" data-testid="my-list-grid">{savedMovies.map((movie) => movieCard(movie))}</div> : (
              <div className="empty-state" data-testid="empty-my-list"><Bookmark size={26} /><h2>Your list is a blank canvas.</h2><p>Save a title from its details or the featured story and it will be waiting here.</p><button className="action-button secondary" data-testid="button-explore-catalog" onClick={() => setPage('Home')}>Explore titles</button></div>
            )}
          </section>
        )}

        {view === 'Details' && selected && (
          <section className="details view-fade" data-testid={`screen-details-${selected.id}`}>
            <img className="details-backdrop" src={selected.image} alt="" />
            <div className="details-content">
              <button className="back-link" aria-label="Back" data-testid="button-details-back" onClick={goBack}><ArrowLeft size={20} /></button>
              <div className="eyebrow">{selected.genre}</div>
              <h1>{selected.title}</h1>
              <div className="detail-facts"><span>{selected.year}</span><span>{selected.runtime}</span><span>{selected.rating}</span><span>Feature film</span></div>
              <p>{selected.synopsis}</p>
              <div className="action-row">
                <button className="action-button primary" data-testid="button-details-play" onClick={() => startPlayback(selected)}><Play size={18} fill="currentColor" /> Play</button>
                <button className="action-button secondary" data-testid="button-details-list" onClick={() => toggleWatchlist(selected)}><Bookmark size={17} fill={watchlist.includes(selected.id) ? 'currentColor' : 'none'} /> {watchlist.includes(selected.id) ? 'In My List' : 'Add to My List'}</button>
              </div>
              <div className="detail-note">Available to browse in this prototype. Playback requires a direct video URL you are authorized to use.</div>
            </div>
          </section>
        )}

        {view === 'Settings' && (
          <section className="view-fade" data-testid="screen-settings">
            <div className="page-heading"><div className="eyebrow">Make it yours</div><h1>Settings</h1><p>Thoughtful defaults for the room you're in.</p></div>
            <div className="settings-layout">
              <div className="settings-list" role="tablist" aria-label="Settings categories">
                {settingCategories.map(({ id, icon: Icon, description }) => (
                  <button key={id} role="tab" aria-selected={category === id} className={`setting-tile ${category === id ? 'active' : ''}`} data-testid={`settings-tab-${id.toLowerCase()}`} onClick={() => setCategory(id)}>
                    <Icon size={19} /><span>{id}</span><small>{description}</small>
                  </button>
                ))}
              </div>
              <article className="settings-panel" role="tabpanel" data-testid={`settings-panel-${category.toLowerCase()}`}>
                <div className="panel-kicker"><CategoryIcon size={17} /> PREFERENCES</div>
                <h2>{category}</h2><p>{selectedCategory.description}</p>
                {renderSettings()}
                <div className="settings-footer">Settings and your list are saved on this device only.</div>
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
            {settings.playbackUrl ? (
              <video
                data-testid="native-player"
                src={settings.playbackUrl}
                controls
                autoPlay={settings.autoplay}
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={(event) => event.stopPropagation()}
                onError={() => { setIsPlaying(false); notify('This video could not be loaded. Check the URL and format in Settings.'); }}
              >This browser cannot play this video.</video>
            ) : (
              <div className="player-setup" data-testid="player-setup-state">
                <span className="setup-icon"><Film size={25} /></span>
                <div className="eyebrow">Playback setup</div>
                <h1>Ready when you are.</h1>
                <p>Tovo doesn't bundle streams. Add a direct video URL you are authorized to play in Settings, then come back here to watch it in the native player.</p>
                <div className="action-row" style={{ justifyContent: 'center' }}>
                  <button className="action-button primary" data-testid="button-configure-playback" onClick={(event) => { event.stopPropagation(); setPlaying(null); setCategory('Playback'); setPage('Settings'); }}>Configure playback</button>
                  <button className="action-button secondary" data-testid="button-player-back" onClick={(event) => { event.stopPropagation(); goBack(); }}>Back to browsing</button>
                </div>
              </div>
            )}
          </div>
          {settings.playbackUrl && (
            <div className="player-controls" onClick={(event) => event.stopPropagation()}>
              <div className="player-bottom"><span>{isPlaying ? 'Playing' : 'Paused'} · {playing.title}</span><div className="player-control-buttons"><button className="icon-button" aria-label="Back to browsing" data-testid="button-player-exit" onClick={goBack}><ArrowLeft size={18} /></button></div></div>
            </div>
          )}
        </section>
      )}
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite" data-testid="status-toast">{toast}</div>
    </div>
  );
}

export default App;