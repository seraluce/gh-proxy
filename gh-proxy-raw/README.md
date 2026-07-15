# gh-proxy 原始代码

这是 [seraluce/gh-proxy](https://github.com/seraluce/gh-proxy) 项目的原始代码，作为参考保留。

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.js` | Worker 主逻辑 (476 行) |
| `renderHtml.js` | 前端 HTML 渲染 (1082 行) |
| `main.py` | Python/Flask 版本 (195 行) |
| `Dockerfile` | Docker 部署配置 |
| `wrangler.toml` | Wrangler CLI 配置 |
| `package.json` | Node.js 依赖配置 |

## 与 proxy-hub 的区别

proxy-hub 的 `worker.js` 是重新编写的精简版本，整合了 gh-proxy 的核心功能：

- ✅ GitHub 加速代理
- ✅ 域名白名单校验
- ✅ CORS 支持
- ❌ 未包含：jsDelivr 跳转、KV 缓存、Cache API、完整 UI

如需完整功能，请参考原始代码或使用原项目部署。

## 原项目地址

https://github.com/seraluce/gh-proxy
