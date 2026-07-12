// ============================================================
// GitHub Proxy - Cloudflare Workers 优化版
// ============================================================

import INDEX_HTML from './html.js'

'use strict'

const CONFIG = {
    PREFIX: '/',
    JSDELIVR: 1,
    ENABLE_KV_CACHE: true,
    CACHE_TTL: 7200,
    MAX_CACHE_SIZE: 8 * 1024 * 1024
}

const ROUTES = {
    LARGE: /^(?:https?:\/\/)?(?:github\.com\/.+?\/.+?\/(?:releases|archive)\/|gist\.github\.com\/.+?\/.+?\/.+)/i,
    CODE: /^(?:https?:\/\/)?(?:github\.com\/.+?\/.+?\/(?:blob|raw)\/|raw\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+?\/.+)/i,
    OTHER: /^(?:https?:\/\/)?(?:github\.com\/.+?\/.+?\/(?:info|git-|tags).*)/i
}

const CORS_HEADERS = {
    'access-control-allow-origin': '*',
    'access-control-expose-headers': '*',
    'access-control-allow-methods': 'GET,HEAD,OPTIONS',
    'access-control-max-age': '86400'
}

function getRouteType(path) {
    if (ROUTES.LARGE.test(path)) return 'large'
    if (ROUTES.CODE.test(path)) return 'code'
    if (ROUTES.OTHER.test(path)) return 'other'
    return null
}

function fastResponse(body, status = 200, headers = {}) {
    return new Response(body, {
        status,
        headers: { ...CORS_HEADERS, ...headers }
    })
}

function isGitHubUrl(url) {
    return /github\.com|githubusercontent\.com/i.test(url)
}

async function handleRequest(request) {
    const url = new URL(request.url)
    let path = url.pathname + url.search

    if (path === '/' || path === '') {
        return fastResponse(INDEX_HTML, 200, { 'content-type': 'text/html;charset=UTF-8' })
    }

    const queryUrl = url.searchParams.get('q')
    if (queryUrl) {
        return Response.redirect(url.origin + CONFIG.PREFIX + queryUrl, 301)
    }

    if (request.method === 'OPTIONS') {
        return fastResponse(null, 204)
    }

    let target = path.slice(CONFIG.PREFIX.length)
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = 'https://' + target
    }

    const routeType = getRouteType(target)
    if (!routeType) {
        return fastResponse('Not Found', 404)
    }

    if (routeType === 'code' && CONFIG.JSDELIVR) {
        let cdnUrl = target
            .replace(/\/blob\//, '@')
            .replace(/^(?:https?:\/\/)?(?:github\.com|raw\.(?:githubusercontent|github)\.com)/, 'https://cdn.jsdelivr.net/gh')
            .replace(/(?<=com\/.+?\/.+?)\/(.+?\/)/, '@$1')
        return Response.redirect(cdnUrl, 302)
    }

    if (routeType === 'large') {
        return await handleLargeFile(target, request)
    }

    return await proxyRequest(target, request)
}

async function handleLargeFile(url, request) {
    if (CONFIG.ENABLE_KV_CACHE) {
        try {
            const cacheKey = `file:${url}`
            const cached = await GH_CACHE.get(cacheKey, 'arrayBuffer')
            if (cached) {
                return fastResponse(cached, 200, {
                    'content-type': 'application/octet-stream',
                    'cache-control': `public, max-age=${CONFIG.CACHE_TTL}`,
                    'x-cache': 'HIT'
                })
            }
        } catch (e) {}
    }

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip',
            'Range': request.headers.get('range') || '',
        },
        cf: { http2: true }
    })

    if (!response.ok) {
        return fastResponse('Fetch failed', response.status)
    }

    const contentLength = response.headers.get('content-length')
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    if (CONFIG.ENABLE_KV_CACHE && contentLength && parseInt(contentLength) < CONFIG.MAX_CACHE_SIZE) {
        const clonedResponse = response.clone()
        const cacheKey = `file:${url}`
        event.waitUntil(
            clonedResponse.arrayBuffer()
                .then(data => GH_CACHE.put(cacheKey, data, { expirationTtl: CONFIG.CACHE_TTL }))
                .catch(() => {})
        )
    }

    const headers = {
        'content-type': contentType,
        'cache-control': 'public, max-age=3600',
        'x-cache': 'MISS',
        'accept-ranges': 'bytes',
    }
    if (contentLength) {
        headers['content-length'] = contentLength
    }

    return new Response(response.body, {
        status: response.status,
        headers: { ...CORS_HEADERS, ...headers }
    })
}

async function proxyRequest(url, request) {
    const response = await fetch(url, {
        method: request.method,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': request.headers.get('accept') || '*/*',
            'Accept-Encoding': 'gzip',
            'Range': request.headers.get('range') || '',
        },
        redirect: 'manual',
        cf: { http2: true }
    })

    if (response.status === 302 || response.status === 301) {
        const location = response.headers.get('location')
        if (location && isGitHubUrl(location)) {
            return Response.redirect(CONFIG.PREFIX + location, response.status)
        }
        if (location) {
            return Response.redirect(location, response.status)
        }
    }

    const headers = {
        'content-type': response.headers.get('content-type') || 'application/octet-stream',
        'cache-control': 'public, max-age=300',
        'accept-ranges': 'bytes',
    }
    const contentLength = response.headers.get('content-length')
    if (contentLength) {
        headers['content-length'] = contentLength
    }

    return new Response(response.body, {
        status: response.status,
        headers: { ...CORS_HEADERS, ...headers }
    })
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})