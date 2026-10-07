import { Router, Request, Response } from 'express';
import healthRouter from './health';

const router = Router();

// Mount health routes
router.use('/', healthRouter);

// Internal infrastructure mappings hidden securely within your dedicated core server
const STREAM_PROVIDERS: Record<string, string> = {
  vidsrc: 'https://vidsrc.to',
  embedcc: 'https://1embed.cc',
  embedsu: 'https://embed.su'
};

// Map literal public-domain strings used by the unmodified index.html dropdown layout
const FRONTEND_DOMAINS_MAP: Record<string, string> = {
  'vidsrc.to': 'vidsrc',
  '1embed.cc': 'embedcc',
  'embed.su': 'embedsu'
};

// 1. Core API Endpoint specifically optimized for your custom Tovo TV-OS React architecture
router.get('/route-stream', (req: Request, res: Response): any => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  const { provider, id } = req.query;

  if (!provider || !id) {
    return res.status(400).json({ error: 'Required validation identifiers or provider mapping keys missing.' });
  }

  const baseTarget = STREAM_PROVIDERS[provider as string];
  if (!baseTarget) {
    return res.status(404).json({ error: 'Target alternative delivery configuration matches an invalid schema.' });
  }

  return res.json({ destination: `${baseTarget}${id}` });
});

// 2. Strict Interception Catch-All Route for the completely unmodified HTML/JS front-end
router.get('*', (req: Request, res: Response): any => {
  const rawPath = req.originalUrl.replace(/^\//, ''); // Clean prefix slash wrappers

  // Find the exact matching key layout built by the un-edited HTML dropdown choice
  const matchedDomain = Object.keys(FRONTEND_DOMAINS_MAP).find(domain => rawPath.includes(domain));

  if (!matchedDomain) {
    return res.status(404).send('Engine Router Error: Outbound target context unrecognized.');
  }

  // Extract the numeric TMDB asset payload identity value
  const tmdbIdMatch = rawPath.match(/\d+/);
  if (!tmdbIdMatch) {
    return res.status(400).send('Asset transaction token parsing structural anomaly.');
  }

  const providerKey = FRONTEND_DOMAINS_MAP[matchedDomain];
  const backendTargetBase = STREAM_PROVIDERS[providerKey];
  const finalStreamDestination = `${backendTargetBase}${tmdbIdMatch[0]}`;

  // Redirect the frame wrapper seamlessly behind the scenes using our backend system map rules
  return res.redirect(307, finalStreamDestination);
});

export default router;
