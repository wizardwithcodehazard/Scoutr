/**
 * Cloudflare Pages Function: /api/jobs
 * Serves the live startup job feed on Cloudflare's Edge Network.
 * Applies the same weighted relevance scoring as the local server.
 */

export async function onRequestGet(context) {
  try {
    const reqUrl = new URL(context.request.url);
    const query = reqUrl.searchParams.get('q') || reqUrl.searchParams.get('query') || '';

    // Load the pre-built feed from static assets (populated by build pipeline)
    const assetUrl = new URL('/jobs_feed.json', context.request.url);
    const assetRes = await context.env.ASSETS.fetch(assetUrl);

    if (assetRes.ok) {
      let data = await assetRes.json();

      if (Array.isArray(data)) {
        // Filter stale jobs (>90 days old) from Wellfound/Remotive stream
        const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
        data = data.filter(j => {
          if (!j.postedDate) return true;
          const posted = new Date(j.postedDate).getTime();
          return isNaN(posted) || posted >= cutoff;
        });

        if (query && query.trim().length > 0) {
          const stopWords = new Set(['and', 'for', 'the', 'with', 'in', 'at', 'to', 'of', 'a', 'an']);
          const qWords = query.toLowerCase().trim().split(/[\s,+/]+/)
            .filter(w => w.length >= 2 && !stopWords.has(w));

          if (qWords.length > 0) {
            // Weighted relevance: title=4x, company=2x, description/stack=1x
            const scored = data.map(j => {
              const titleLower = (j.title || '').toLowerCase();
              const companyLower = (j.company || '').toLowerCase();
              const descLower = (j.description || '').toLowerCase();
              const stackStr = (j.techStack || []).join(' ').toLowerCase();

              let score = 0;
              qWords.forEach(w => {
                if (titleLower.includes(w))   score += 4;
                if (companyLower.includes(w)) score += 2;
                if (descLower.includes(w))    score += 1;
                if (stackStr.includes(w))     score += 1;
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
