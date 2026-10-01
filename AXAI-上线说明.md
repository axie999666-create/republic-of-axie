# AXAI 维护说明

官网 https://republic-of-axie.org/ 已加入 AXAI 窗口，12 个公开页面共用助手。后端部署在 https://axai-api.axie999666.workers.dev/ ，使用 Cloudflare Workers AI。

## 文件

- axai-config.js：后端地址，不包含任何密钥。
- axai-widget.js：聊天窗口、快捷问题、来源链接。
- axai-knowledge.json：官方知识库，收录于 2026-10-01。
- axai-worker.mjs：与已部署版本对应的单文件后端。
- axai-wrangler.toml：可从仓库根目录用 Wrangler 部署的配置。

## Cloudflare 配置

AI 绑定：Workers AI，名称 AI。默认模型 @cf/meta/llama-3.1-8b-instruct-fp8-fast。

限流绑定：RATE_LIMITER，命名空间 20261001，每 60 秒最多 10 次，按访问 IP 使用限流 key。Cloudflare 原生限流按数据中心计数，属于基础防刷，不能视为全球精确配额。输入上限 500 字，输出 max_tokens 600。

变量 ALLOWED_ORIGIN：https://republic-of-axie.org 。浏览器 CORS 限制只允许官网，但不替代身份认证。

不需要额外模型 API Key。也保留外部 chat/completions 兼容接口支持；切换时在后端设置 AI_API_URL、AI_MODEL 和密钥 AI_API_KEY，并移除 AI 绑定。不要把密钥写入前端或仓库。

## 资料维护

修改 axai-knowledge.json 后，需要同步更新 axai-worker.mjs 中的 knowledge 常量并部署，否则模型会继续读取旧资料。单文件方案适合第一版；后续可改为自动构建同步。

助手已加入通用问答，默认简短回答；没有搜索引擎接入。阿谢国问题根据收录资料与成功读取的官网回答，通用问题不附虚假的阿谢国来源。助手不具备修改法律、新闻、投票或行政操作的权限。正式与规划内容应分开标记。来源链接为检索依据，模型输出仍应核查。

新闻和选举页面通过服务器浏览器读取实际显示内容。网页与法律或其他公告冲突时不能擅自认定，以来源和读取时间帮助用户核实。

## 验证

已通过前端语法、输入长度、来源限制、模型缺失处理、限流、模型接口响应与密钥不返回的验证。官网窗口通过桌面及手机尺寸检查，并已在官网实际提问，验证 AI 回答与官方来源链接。助手名称统一为 AXAI；候选人英文名统一为 Axie，总统资料原本已为 Axie。

## 额度

Workers AI 免费计划有每日免费额度；额度用尽后需等待重置，不要为零成本项目启用付费升级。参考 https://developers.cloudflare.com/workers-ai/platform/pricing/ 。

## 法律知识更新（2026-10-01）

刑法与总统法各194条，共388条全文，来源为用户提供文本。保留条号及原文，支持中文和数字条号查询。无已核验公开网页的条文显示文本来源标签。总统法与官网宪法有关行政权的表述差异保留原文并提示以宪法为准。

导入和本地检查：388条原文完整、条号检索、不存在条文拒答、冲突上下文、来源标记、通用问答模式均已验证。知识库共546条记录。

## 网页读取（2026-10-01）

AXAI 可按问题选择官方网站，也可读取问题中最多两个 HTTPS 公开网址。外部网址及新闻/选举动态页通过 Cloudflare Browser Run 渲染，普通官网页面直接读取正文以节省浏览器额度。没有搜索引擎接入；不会遍历网页内所有链接，不携带用户浏览器登录状态。

后端已新增浏览器绑定 BROWSER；原 AI、RATE_LIMITER、ALLOWED_ORIGIN 保留。控制台部署根目录 axai-worker.mjs；源码在 axai/backend/worker.mjs 与 web-reader.mjs。浏览器返回 JSON 后提取 Markdown，用作不可信资料；来源与北京时间读取时间由服务器与小组件显示。

限每次两个网页、三次 HTTP 跳转，检查公网域名/DNS，拒绝内网地址、HTTP、凭据网址和不支持的文件类型；正文有大小与长度限制。无法读取、登录/验证码、额度耗尽时明确提示，不伪称已读取。浏览器保持免费计划，额度限制详见 Cloudflare 官方文档，不自动升级付费。

浏览器免费额度参考：https://developers.cloudflare.com/browser-run/pricing/ 。截至本次部署未启用付费升级。
