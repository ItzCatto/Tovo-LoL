import { Router, Request, Response } from 'express';

const router = Router();

// Mapping exact anomalies sent by the unmodified frontend script block
const REWRITE_MAP: Record<string, string> = {
  'vidsrc.to': 'https://vidsrc.to',
  '1embed.cc': 'https://1embed.cc',
  'embed.su': 'https://embed.su'
};

// Catch-all route to intercept exact absolute paths emitted by the client
router.get('*', (req: Request, res: Response): any => {
  // Extract destination targets dynamically from request hostname and paths
  const fullPath = req.originalUrl; // e.g., "/https://vidsrc.to272" or "/https://1embed.cc272"

  // Clean up leading slashes if they exist from local asset routing
  const normalizedPath = fullPath.replace(/^\//, ''); 

  // Match which provider the unmodified HTML is trying to call
  const matchedKey = Object.keys(REWRITE_MAP).find(key => normalizedPath.includes(key));

  if (!matchedKey) {
    return res.status(404).json({ 
      error: "Engine Routing Error: Unrecognized source stream format configuration." 
    });
  }

  // Extract the trailing numeric TMDB ID directly from the string
  const tmdbIdMatch = normalizedPath.match(/\d+\$/);
  if (!tmdbIdMatch) {
    return res.status(400).json({ error: "Missing required numeric asset validation string identifier." });
  }

  const tmdbId = tmdbIdMatch[0];
  const secureBase = REWRITE_MAP[matchedKey];

  // Construct destination securely server-side without altering front-end source values
  const directDestinationUrl = `${secureBase}${tmdbId}`;

  // Redirect the viewscreen iframe smoothly to the functional stream target
  return res.redirect(307, directDestinationUrl);
});

export default router;
