# 阿谢国国民管理 Worker

独立的 Cloudflare Worker + D1 后端。管理页面为仓库内的 admin/citizens.html，由 GitHub Pages 提供；API 使用 workers.dev，不改动现有 AXNews Worker，也不依赖目前待修复的自定义 Worker 域名。

## 功能

- 管理员密码登录，服务端校验，登录失败后按 IP 指纹限速。管理员密码与 AXNews 相同；两个 Worker 各自签发自己的 8 小时 Bearer 会话。
- 8 小时 Bearer 会话，退出时立即撤销；会话只放在当前浏览器标签的 sessionStorage。
- 国民自助登记姓名、阿谢纪年出生日期和结构化阿谢国住址；申请进入待审核状态，管理员可批准或标记未通过；批准后发放国民编号。
- 自助登记按来源 IP 指纹限制为每小时最多 3 次提交；原始 IP 不写入数据库。
- 纪年以 2024 年为阿谢元年；2023 年显示为“阿谢纪年前一年”，2026 年显示为“阿谢三年”。住址先选新阿谢市、阿浩市、明辉市、阿陈市、立京市或新桃市，再填写区/镇/郡/村、街道/乡、路/大道、东/西/南/北侧和门牌号；公寓楼栋/室号可选填。
- 管理员可新建、编辑、审核、搜索、筛选和分页浏览国民档案。
- 导出当前筛选结果 CSV，并在 D1 审计表记录创建、登记、编辑、状态变更和导出操作。
- 每份已批准档案可生成阿谢国国民身份卡，卡片包括照片、出生日期和阿谢国住址；可打印或下载带照片的 SVG。
- 管理员可从在籍国民档案打开阿谢国国民护照，翻开封面查看阿谢国建国地点；护照图片仅用于架空世界观展示。
- 姓名、称呼、出生日期、结构化地址和备注以 AES-GCM 密文写入 D1；照片单独加密存储，只在管理员查看身份卡或编辑档案时按需读取。API 仅允许配置的前端来源，不公开名册或个人记录查询接口。
- 总统与副总统投票将校验在籍国民的姓名和国民 ID；投票文件只保存由共享密钥生成的不可逆标识，不保存姓名或原始 ID。
- 官网联系我们区提供访客在线留言；访客凭浏览器保存的随机会话密钥查看自己的对话，管理员用现有登录凭证在 `/admin/contact-messages.html` 回复。消息正文和可选称呼使用现有 AES-GCM 密钥加密，访客来源地址只以 HMAC 指纹用于限流；Worker 每日清理超过 180 天的对话和超过 24 小时的限流指纹。

自助登记页面为 https://republic-of-axie.org/admin/citizen-registration.html。本系统用于架空世界观资料；请填写设定中的姓名、住址，不要填写现实住址、证件号、金融资料或其他不必要的真实个人信息。身份卡和管理员导出的 CSV 会包含出生日期与住址，需作为内部资料妥善保管。

## 当前部署状态

- Cloudflare D1 数据库 axie-citizens 已创建在 APAC，初始化迁移已应用；数据库 ID 已写入 wrangler.jsonc。
- Worker 已部署到 https://axie-citizens-admin-api.axie999666.workers.dev，/api/health 返回正常。
- ADMIN_PASSWORD 和 PII_ENCRYPTION_KEY 已由管理员通过 Wrangler 上传；不会在仓库或文档中保存密钥值。
- 国民登记与管理页面已合并到 main 并由 GitHub Pages 发布。
- 迁移 `0003_citizen_photos.sql` 已应用到生产 D1；照片上传和身份卡展示已部署。
- 总统与副总统投票身份核验已部署；0002 迁移已应用，国民管理 Worker 与 AXNews 投票 Worker 已配置相同的 VOTER_VERIFY_SECRET。
- 网站访客在线留言 Worker 已部署到 `https://axie-citizens-admin-api.axie999666.workers.dev`，迁移 `0004_contact_chat.sql` 已应用；GitHub Pages 前端随 PR #30 发布。

## 部署后检查

执行 curl https://axie-citizens-admin-api.axie999666.workers.dev/api/health 检查 Worker。然后访问自助登记页，或在 https://republic-of-axie.org/admin/citizens.html 登录。Worker 使用的 ALLOWED_ORIGINS 已允许正式站和 Wrangler 本地预览地址。

## 网站访客在线留言

部署在线留言时，先应用 D1 迁移，再部署国民管理 Worker；随后通过 GitHub Pages 发布首页 `index.html` 与管理员收件箱 `admin/contact-messages.html`。管理员入口也显示在 AXNews 管理首页。

```sh
pnpm dlx wrangler d1 migrations apply axie-citizens --remote
pnpm dlx wrangler deploy
```

访客可以选填称呼，不需要注册或留下邮箱；请勿在对话中收集现实证件号、金融信息等敏感资料。

## 投票身份核验部署

投票验证接口只接受 AXNews 投票 Worker 的共享密钥。管理员须生成一个独立随机密钥并保存在密码管理器中，然后在两个 Worker 的 Wrangler secret 提示中输入完全相同的值；不要把密钥写入代码或聊天。

先对国民管理 D1 应用迁移，再在 citizens/worker 目录和 workers/axnews-admin-api 目录分别执行：

```sh
pnpm dlx wrangler secret put VOTER_VERIFY_SECRET
```

确认两个 Worker 都设置好该密钥后，先部署国民管理 Worker，再部署 workers/axnews-admin-api 中的投票 Worker。迁移命令为：

```sh
pnpm dlx wrangler d1 migrations apply axie-citizens --remote
```

部署时分别在各自目录执行：

```sh
pnpm dlx wrangler deploy
```

投票 Worker 原先接受浏览器生成的匿名 voterId；新版本会在服务端校验姓名、国民 ID 和在籍状态，并以不可逆 HMAC 标识做重复投票检查。身份核验 Worker 或共享密钥未就绪时，投票 API 会拒绝提交。

已有投票记录使用的是浏览器匿名 ID，无法反查到国民档案。新版本会尽量通过同一浏览器保存的旧 ID 拦截重复提交，但换设备或清除浏览器数据的旧投票者仍可能再次投票。正式启用前，需要决定如何处理当前已经进行中的副总统选举及其既有选票；代码不会自动删除或重置选票。
