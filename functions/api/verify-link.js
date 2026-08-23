/**
 * Cloudflare Pages Function: /api/verify-link
 * Edge Sentinel Health Check for Application URLs
 */

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ active: false, error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const headRes = await fetch(targetUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const isAlive = headRes.status < 400 || headRes.status === 403; // 403 often means alive behind Cloudflare/WAF

    return new Response(JSON.stringify({
      url: targetUrl,
      active: isAlive,
      status: headRes.status,
      timestamp: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      url: targetUrl,
      active: false,
      error: e.message,
      timestamp: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
