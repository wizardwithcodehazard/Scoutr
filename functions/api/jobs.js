/**
 * Cloudflare Pages Function: /api/jobs
 * Serves the live startup job feed on Cloudflare's Edge Network.
 * Uses strict word-boundary token matching to avoid false positives.
 */

function testTokenMatch(text, token) {
  if (!text || !token) return false;
  const t = token.toLowerCase().trim();
  if (t === 'ai' || t === 'ml' || t === 'llm' || t === 'nlp' || t === 'yc' || t === 'hn') {
    return new RegExp(`\\b${t}\\b`, 'i').test(text);
  }
  if (t === 'intern') {
    return /\b(intern|internship|interns)\b/i.test(text);
  }
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}`, 'i').test(text);
}

export async function onRequestGet(context) {
  try {
    const reqUrl = new URL(context.request.url);
    const query = reqUrl.searchParams.get('q') || reqUrl.searchParams.get('query') || '';

    // Load pre-built feed from Cloudflare static assets
    const assetUrl = new URL('/jobs_feed.json', context.request.url);
    const assetRes = await context.env.ASSETS.fetch(assetUrl);

    if (assetRes.ok) {
      let data = await assetRes.json();

      if (Array.isArray(data)) {
        // Filter stale jobs (>30 days old)
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        data = data.filter(j => {
          if (!j.postedDate) return true;
          const posted = new Date(j.postedDate).getTime();
          return isNaN(posted) || posted >= cutoff;
        });

        if (query && query.trim().length > 0) {
          const stopWords = new Set(['and', 'for', 'the', 'with', 'in', 'at', 'to', 'of', 'a', 'an', 'on', 'by']);
          const qWords = query.toLowerCase().trim().split(/[\s,+/]+/)
            .filter(w => w.length >= 2 && !stopWords.has(w));

          if (qWords.length > 0) {
            // Strict word-boundary scoring: title=6x, company=3x, stack=2x, desc=1x
            const scored = data.map(j => {
              const titleStr = j.title || '';
              const companyStr = j.company || '';
              const descStr = j.description || '';
              const stackStr = (j.techStack || []).join(' ');

              let score = 0;
              qWords.forEach(w => {
                if (testTokenMatch(titleStr, w)) score += 6;
                if (testTokenMatch(companyStr, w)) score += 3;
                if (testTokenMatch(stackStr, w)) score += 2;
                if (testTokenMatch(descStr, w)) score += 1;
              });
              return { job: j, score };
            });

            const matched = scored
              .filter(s => s.score > 0)
              .sort((a, b) => b.score - a.score)
              .map(s => s.job);

            data = matched.length > 0 ? matched : data;
          }
        }
      }

      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=30, s-maxage=60'
        }
      });
    }

    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
