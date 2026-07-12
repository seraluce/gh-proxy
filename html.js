const INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub 代理加速 · Geist 风格</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/geist@1.2.1/dist/geist.min.css">
    <style>
        /* ========== CSS Variables (主题) ========== */
        :root {
            --font-sans: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            --font-mono: 'Geist Mono', 'Fira Code', monospace;
            --bg: #ffffff;
            --bg-secondary: #fafafa;
            --bg-tertiary: #f0f0f0;
            --fg: #000000;
            --fg-secondary: #666666;
            --fg-tertiary: #888888;
            --border: #eaeaea;
            --accent: #0070f3;
            --accent-hover: #0761d1;
            --accent-foreground: #ffffff;
            --shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            --radius: 8px;
            --transition: 0.2s ease;
        }

        [data-theme="dark"] {
            --bg: #000000;
            --bg-secondary: #111111;
            --bg-tertiary: #1a1a1a;
            --fg: #ffffff;
            --fg-secondary: #888888;
            --fg-tertiary: #666666;
            --border: #333333;
            --accent: #3291ff;
            --accent-hover: #4a9eff;
            --accent-foreground: #000000;
            --shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: var(--font-sans);
            background: var(--bg);
            color: var(--fg);
            transition: background var(--transition), color var(--transition);
            line-height: 1.6;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* ========== 导航栏 ========== */
        .navbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            border-bottom: 1px solid var(--border);
            background: var(--bg-secondary);
            backdrop-filter: blur(8px);
            position: sticky;
            top: 0;
            z-index: 10;
            transition: background var(--transition), border-color var(--transition);
            flex-wrap: wrap;
            gap: 12px;
        }

        .nav-brand {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            font-size: 18px;
            letter-spacing: -0.02em;
            color: var(--fg);
            text-decoration: none;
        }

        .nav-brand svg {
            width: 24px;
            height: 24px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        .nav-links {
            display: flex;
            align-items: center;
            gap: 20px;
            list-style: none;
            font-size: 14px;
            flex-wrap: wrap;
        }

        .nav-links a {
            color: var(--fg-secondary);
            text-decoration: none;
            transition: color var(--transition);
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .nav-links a:hover { color: var(--fg); }

        .nav-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .theme-toggle {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 6px 10px;
            cursor: pointer;
            color: var(--fg-secondary);
            transition: all var(--transition);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .theme-toggle:hover {
            background: var(--border);
            color: var(--fg);
        }

        .theme-toggle svg {
            width: 18px;
            height: 18px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        /* ========== 主容器 ========== */
        .container {
            max-width: 720px;
            margin: 0 auto;
            padding: 40px 24px;
            flex: 1;
            width: 100%;
        }

        .card {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 32px;
            box-shadow: var(--shadow);
            transition: background var(--transition), border-color var(--transition), box-shadow var(--transition);
        }

        .card-header { margin-bottom: 24px; }
        .card-header h1 {
            font-size: 28px;
            font-weight: 600;
            letter-spacing: -0.03em;
            line-height: 1.2;
            margin-bottom: 8px;
        }
        .card-header p {
            color: var(--fg-secondary);
            font-size: 15px;
        }

        /* ========== 输入框 ========== */
        .input-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 24px;
        }

        .input-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .input-row input {
            flex: 1;
            min-width: 200px;
            padding: 12px 16px;
            font-family: var(--font-mono);
            font-size: 14px;
            background: var(--bg);
            color: var(--fg);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            outline: none;
            transition: border-color var(--transition), box-shadow var(--transition);
        }

        .input-row input:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.15);
        }

        .input-row input::placeholder { color: var(--fg-tertiary); }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 24px;
            font-family: var(--font-sans);
            font-size: 14px;
            font-weight: 500;
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--bg-tertiary);
            color: var(--fg);
            cursor: pointer;
            transition: all var(--transition);
            text-decoration: none;
            white-space: nowrap;
            min-height: 48px;
        }

        .btn:hover {
            background: var(--border);
            transform: translateY(-1px);
        }

        .btn-primary {
            background: var(--accent);
            color: var(--accent-foreground);
            border-color: var(--accent);
        }

        .btn-primary:hover {
            background: var(--accent-hover);
            border-color: var(--accent-hover);
            color: var(--accent-foreground);
        }

        .btn svg {
            width: 18px;
            height: 18px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        /* ========== 下载按钮组 ========== */
        .download-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 8px;
            padding-top: 20px;
            border-top: 1px solid var(--border);
        }

        .download-group .btn { flex: 1; min-width: 100px; }

        /* ========== 示例链接 ========== */
        .examples {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid var(--border);
        }

        .examples-title {
            font-size: 13px;
            font-weight: 500;
            color: var(--fg-secondary);
            margin-bottom: 10px;
        }

        .examples-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .examples-list code {
            display: block;
            padding: 8px 12px;
            font-family: var(--font-mono);
            font-size: 13px;
            background: var(--bg-tertiary);
            border-radius: 4px;
            color: var(--fg-secondary);
            cursor: pointer;
            transition: all var(--transition);
            border: 1px solid transparent;
            word-break: break-all;
        }

        .examples-list code:hover {
            background: var(--border);
            color: var(--fg);
            border-color: var(--border);
        }

        /* ========== 页脚 ========== */
        .footer {
            text-align: center;
            padding: 24px;
            font-size: 13px;
            color: var(--fg-tertiary);
            border-top: 1px solid var(--border);
            background: var(--bg-secondary);
            transition: all var(--transition);
        }

        .footer a {
            color: var(--fg-secondary);
            text-decoration: none;
        }
        .footer a:hover { color: var(--fg); }

        /* ========== 响应式 ========== */
        @media (max-width: 640px) {
            .navbar {
                padding: 12px 16px;
                flex-direction: column;
                align-items: stretch;
                gap: 8px;
            }
            .nav-links {
                justify-content: center;
                gap: 14px;
                font-size: 13px;
            }
            .nav-actions { justify-content: center; }
            .container { padding: 20px 16px; }
            .card { padding: 20px; }
            .card-header h1 { font-size: 24px; }
            .input-row { flex-direction: column; }
            .input-row input { min-width: unset; width: 100%; }
            .btn { width: 100%; justify-content: center; }
            .download-group .btn { min-width: unset; }
            .theme-toggle span { display: none; }
        }

        @media (max-width: 480px) {
            .nav-links a span { display: none; }
            .download-group { flex-direction: column; }
        }

        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
        }
    </style>
</head>
<body>

    <!-- ==================== 导航栏 ==================== -->
    <nav class="navbar" role="navigation" aria-label="主导航">
        <a href="/" class="nav-brand">
            <svg viewBox="0 0 24 24">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            <span>GH Proxy</span>
        </a>

        <ul class="nav-links">
            <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                <span>GitHub</span>
            </a></li>
            <li><a href="https://github.com/hunshcn/gh-proxy" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 4v16h16"></path><polyline points="20 10 12 18 8 14"></polyline></svg>
                <span>Source</span>
            </a></li>
        </ul>

        <div class="nav-actions">
            <button class="theme-toggle" id="themeToggle" aria-label="切换深色/浅色模式">
                <svg id="themeIcon" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                <span id="themeLabel">浅色</span>
            </button>
        </div>
    </nav>

    <!-- ==================== 主内容 ==================== -->
    <main class="container">
        <div class="card">
            <div class="card-header">
                <h1>GitHub 资源加速</h1>
                <p>输入 GitHub 链接，快速下载 Release、代码或 Raw 文件。</p>
            </div>

            <div class="input-group">
                <div class="input-row">
                    <input type="url" id="inputUrl" placeholder="https://github.com/user/repo/releases/download/v1.0/file.zip" autofocus spellcheck="false">
                    <button class="btn btn-primary" id="goBtn">
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                        打开
                    </button>
                </div>
                <div class="download-group">
                    <button class="btn" id="wgetBtn">
                        <svg viewBox="0 0 24 24"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg>
                        wget 命令
                    </button>
                    <button class="btn" id="curlBtn">
                        <svg viewBox="0 0 24 24"><polyline points="7 13 12 18 17 13"></polyline><polyline points="7 6 12 11 17 6"></polyline></svg>
                        curl 命令
                    </button>
                    <button class="btn" id="downloadBtn">
                        <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        直接下载
                    </button>
                </div>
            </div>

            <div class="examples">
                <p class="examples-title">📋 快速示例 (点击填充)</p>
                <div class="examples-list">
                    <code>https://github.com/hunshcn/gh-proxy/blob/master/index.js</code>
                    <code>https://github.com/facebook/react/releases</code>
                    <code>https://raw.githubusercontent.com/nodejs/node/main/README.md</code>
                </div>
            </div>
        </div>
    </main>

    <!-- ==================== 页脚 ==================== -->
    <footer class="footer">
        <p>
            <a href="/">GH Proxy</a> · 
            基于 <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer">Cloudflare Workers</a> 构建 · 
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">开源</a>
        </p>
    </footer>

    <!-- ==================== 引用 JS ==================== -->
    <script src="/app.js"></script>
</body>
</html>`

export default INDEX_HTML