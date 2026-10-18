# 阿谢国国民管理 Worker

独立的 Cloudflare Worker + D1 后端。管理页面为仓库内的 `admin/citizens.html`，由 GitHub Pages 提供；API 使用 `workers.dev`，不改动现有 AXNews Worker，也不依赖目前待修复的自定义 Worker 域名。

## 功能

- 管理员密码登录，服务端校验，登录失败后按 IP 指纹限速。部署时将 `ADMIN_PASSWORD` 设置为与 AXNews 管理后台相同的密码；两个 Worker 各自签发自己的 8 小时 Bearer 会话。
- 8 小时 Bearer 会话，退出时立即撤销；会话只放在当前浏览器标签的 `sessionStorage`。
- 国民自助登记姓名、阿谢纪年出生日期和结构化阿谢国住址；申请进入待审核状态，管理员可批准或标记未通过；批准后发放国民编号。
- 自助登记按来源 IP 指纹限制为每小时最多 3 次提交；原始 IP 不写入数据库。
- 纪年以 2024 年为阿谢元年；2023 年显示为“阿谢纪年前一年”，2026 年显示为“阿谢三年”。住址先选新阿谢市、阿浩市、明辉市、阿陈市、立京市或新桃市，再填写区/镇/郡/村、街道/乡、路/大道、东/西/南/北侧和门牌号；公寓楼栋/室号可选填。
- 管理员可新建、编辑、审核、搜索、筛选和分页浏览国民档案。
- 导出当前筛选结果 CSV，并在 D1 审计表记录创建、登记、编辑、状态变更和导出操作。
- 每份已批准档案可生成阿谢国国民纪念卡，卡片包括出生日期和阿谢国住址；可打印或下载 SVG。
- 姓名、称呼、出生日期、结构化地址和备注以 AES-GCM 密文写入 D1；API 仅允许配置的前端来源，不公开名册或个人记录查询接口。

自助登记页面为 `https://republic-of-axie.org/admin/citizen-registration.html`。本系统用于架空世界观资料；请填写设定中的姓名、住址，不要填写现实住址、证件号、金融资料或其他不必要的真实个人信息。身份卡和管理员导出的 CSV 会包含出生日期与住址，需作为内部资料妥善保管。

## 部署前提

需要 Node.js、Wrangler 及有权在目标 Cloudflare 账户创建 Worker 和 D1 数据库的登录。当前项目在 `wrangler.jsonc` 中预留了 D1 ID；创建数据库后需填入该 ID。

```sh
cd citizens/worker
npx wrangler login
npx wrangler d1 create axie-citizens
```

将 D1 命令返回的 UUID 写入 `wrangler.jsonc` 的 `d1_databases[0].database_id`，随后执行：

```sh
npx wrangler d1 migrations apply axie-citizens --remote
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put PII_ENCRYPTION_KEY
npx wrangler deploy
```

在 `ADMIN_PASSWORD` 的交互提示中，由管理员本人输入与 AXNews 管理后台相同的管理员密码。此 Worker 的登录会话独立于 AXNews。随后由管理员输入单独的 `PII_ENCRYPTION_KEY`；可用 `openssl rand -hex 32` 生成，并保存在密码管理器中，不要写入代码、聊天或仓库。**丢失加密密钥后，D1 中已有的个人资料将无法解密；轮换密钥前必须先对现有档案重新加密。**

部署后检查：

```sh
curl https://axie-citizens-admin-api.axie999666.workers.dev/api/health
```

预期返回 `{"ok":true,"service":"axie-citizens-admin-api"}`。然后访问自助登记页，或在 `https://republic-of-axie.org/admin/citizens.html` 登录。Worker 使用的 `ALLOWED_ORIGINS` 已允许正式站和 Wrangler 本地预览地址。

> 远程创建 D1、写入管理员密码与个人资料加密密钥、发布 Worker 及网站页面尚未执行。需要 Cloudflare 账户授权和管理员本人设置密钥后才能启用生产登记。
