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
- 每份已批准档案可生成阿谢国国民纪念卡，卡片包括出生日期和阿谢国住址；可打印或下载 SVG。
- 姓名、称呼、出生日期、结构化地址和备注以 AES-GCM 密文写入 D1；API 仅允许配置的前端来源，不公开名册或个人记录查询接口。

自助登记页面为 https://republic-of-axie.org/admin/citizen-registration.html。本系统用于架空世界观资料；请填写设定中的姓名、住址，不要填写现实住址、证件号、金融资料或其他不必要的真实个人信息。身份卡和管理员导出的 CSV 会包含出生日期与住址，需作为内部资料妥善保管。

## 当前部署状态

- Cloudflare D1 数据库 axie-citizens 已创建在 APAC，初始化迁移已应用；数据库 ID 已写入 wrangler.jsonc。
- Worker 已部署到 https://axie-citizens-admin-api.axie999666.workers.dev，/api/health 返回正常。
- ADMIN_PASSWORD 和 PII_ENCRYPTION_KEY 已由管理员通过 Wrangler 上传；不会在仓库或文档中保存密钥值。
- 国民管理页面仍在 codex/citizen-management 功能分支；合并到 main 并由 Pages 发布前，正式站的登记页面不会出现。

## 部署后检查

执行 curl https://axie-citizens-admin-api.axie999666.workers.dev/api/health 检查 Worker。然后访问自助登记页，或在 https://republic-of-axie.org/admin/citizens.html 登录。Worker 使用的 ALLOWED_ORIGINS 已允许正式站和 Wrangler 本地预览地址。
