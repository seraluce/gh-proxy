// ============================================================
// GitHub Proxy - Cloudflare Workers 优化版
// 功能：加速 GitHub 文件下载
// ============================================================

'use strict'

// ==================== 配置 ====================
const CONFIG = {
    PREFIX: '/',
    JSDELIVR: 1,
    ENABLE_KV_CACHE: true,
    CACHE_TTL: 7200,
    MAX_CACHE_SIZE: 8 * 1024 * 1024
}

// ==================== 路由规则 ====================
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

// ==================== 引入 HTML（从外部文件） ====================
// 部署时，HTML 会通过 wrangler 的 vars 或 assets 注入
// 这里使用环境变量读取，或直接使用内联版本
const INDEX_HTML = typeof INDEX_HTML_STR !== 'undefined' 
    ? INDEX_HTML_STR 
    : `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub 代理加速</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;display:flex;justify-content:center;align-items:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px}
        .container{background:#fff;padding:40px;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3);max-width:600px;width:100%}
        h1{color:#333;margin-bottom:8px;font-size:28px}
        .subtitle{color:#666;margin-bottom:30px;font-size:14px}
        .input-group{display:flex;gap:10px;margin-bottom:20px}
        input{flex:1;padding:12px 16px;border:2px solid #e0e0e0;border-radius:8px;font-size:14px;transition:border-color .3s}
        input:focus{outline:none;border-color:#667eea}
        button{padding:12px 24px;background:#667eea;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:transform .1s,background .3s}
        button:hover{background:#5a67d8}
        button:active{transform:scale(.95)}
        .examples{background:#f7f7f7;border-radius:8px;padding:16px;margin-top:20px}
        .examples p{color:#555;font-size:13px;margin-bottom:8px}
        .examples code{display:block;background:#e8e8e8;padding:6px 10px;border-radius:4px;margin:4px 0;font-size:12px;word-break:break-all;cursor:pointer}
        .examples code:hover{background:#ddd}
        .footer{margin-top:24px;text-align:center;color:#999;font-size:12px}
        .toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;opacity:0;transition:opacity .3s;pointer-events:none}
        .toast.show{opacity:1}
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 GitHub 代理加速</h1>
        <p class="subtitle">输入 GitHub 链接，快速下载文件</p>
        <div class="input-group">
            <input id="input" placeholder="https://github.com/user/repo/releases/download/v1.0/file.zip" />
            <button id="btn">🚀 加速</button>
        </div>
        <div class="examples">
            <p>📌 支持以下类型：</p>
            <code>https://github.com/user/repo/releases/download/v1.0/file.zip</code>
            <code>https://github.com/user/repo/blob/main/file.js</code>
            <code>https://raw.githubusercontent.com/user/repo/main/file.txt</code>
        </div>
        <div class="footer">⚡ Cloudflare Workers 加速 · 开源免费</div>
    </div>
    <div id="toast" class="toast">✅ 已复制</div>
    <script>
        const input=document.getElementById('input'),btn=document.getElementById('btn'),toast=document.getElementById('toast');
        function buildUrl(original){
            const prefix=window.location.pathname.replace(/\\/+$/,'')||'';
            return window.location.origin+prefix+'/'+original;
        }
        btn.addEventListener('click',()=>{
            let url=input.value.trim();
            if(!url)return;
            if(!/^https?:\\/\\//i.test(url))url='https://'+url;
            window.open(buildUrl(url),'_blank');
        });
        input.addEventListener('keydown',e=>{if(e.key==='Enter')btn.click()});
        document.querySelectorAll('.examples code').forEach(el=>{
            el.addEventListener('click',()=>{
                input.value=el.textContent.trim();
                btn.click();
            });
        });
        input.focus();
    </script>
</body>
</html>`

// ==================== 主处理函数 ====================
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

// ==================== 大文件处理 ====================
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

// ==================== 普通代理 ====================
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

// ==================== 入口 ====================
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})