/**
 * Cloudflare Pages Function: /api/jobs
 * Serves live startup job feed on Cloudflare's Edge Network
 */

export async function onRequestGet(context) {
  try {
    const reqUrl = new URL(context.request.url);
    const query = reqUrl.searchParams.get('q') || reqUrl.searchParams.get('query') || '';

    // Attempt to fetch from static asset or pre-warmed feed
    const assetUrl = new URL('/jobs_feed.json', context.request.url);
    const assetRes = await context.env.ASSETS.fetch(assetUrl);
    
    if (assetRes.ok) {
      let data = await assetRes.json();
      if (query && Array.isArray(data)) {
        const qWords = query.toLowerCase().split(/[\s,+/]+/).filter(w => w.length > 1);
        if (qWords.length > 0) {
          data = data.filter(j => {
            const title = (j.title || '').toLowerCase();
            const comp = (j.company || '').toLowerCase();
            const desc = (j.description || '').toLowerCase();
            const stack = (j.techStack || []).map(t => t.toLowerCase());
            return qWords.some(w => title.includes(w) || comp.includes(w) || desc.includes(w) || stack.some(st => st.includes(w)));
          });
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
