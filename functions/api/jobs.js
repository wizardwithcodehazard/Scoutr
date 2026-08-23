/**
 * Cloudflare Pages Function: /api/jobs
 * Serves live startup job feed on Cloudflare's Edge Network
 */

export async function onRequestGet(context) {
  try {
    // Attempt to fetch from static asset or pre-warmed feed
    const assetUrl = new URL('/jobs_feed.json', context.request.url);
    const assetRes = await context.env.ASSETS.fetch(assetUrl);
    
    if (assetRes.ok) {
      const data = await assetRes.json();
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60, s-maxage=300'
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
