const encoder = new TextEncoder();
const SESSION_DEFAULT_SECONDS = 8 * 60 * 60;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000;
const MAX_REGISTRATIONS_PER_WINDOW = 3;
const VOTER_VERIFICATION_WINDOW_MS = 15 * 60 * 1000;
const MAX_VOTER_VERIFICATION_ATTEMPTS = 12;
const MAX_PROFILE_ROWS = 5000;
const MAX_JSON_BODY_BYTES = 500_000;
const MAX_CITIZEN_PHOTO_BYTES = 240_000;
const VALID_STATUSES = new Set(["active", "pending", "suspended", "resigned", "rejected"]);
const VALID_CITIES = new Set(["新阿谢市", "阿浩市", "明辉市", "阿陈市", "立京市", "新桃市"]);
const VALID_DISTRICT_TYPES = new Set(["区", "镇", "郡", "村"]);
const VALID_STREET_TYPES = new Set(["街道", "乡"]);
const VALID_ROAD_TYPES = new Set(["路", "大道"]);
const VALID_SIDES = new Set(["东", "西", "南", "北"]);
const STATUS_LABELS = {
  active: "在籍",
  pending: "待审核",
  suspended: "暂停",
  resigned: "已退籍",
  rejected: "未通过",
};

function responseJson(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowedOrigins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return { headers, origin, allowed: !origin || allowedOrigins.includes(origin) };
}

function jsonWithCors(payload, status, cors, extraHeaders = {}) {
  return responseJson(payload, status, { ...cors.headers, ...extraHeaders });
}

function constantTimeEqual(left, right) {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    difference |= (a[i] || 0) ^ (b[i] || 0);
  }
  return difference === 0;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function randomId() {
  return crypto.randomUUID();
}

async function readJson(request) {
  try {
    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > MAX_JSON_BODY_BYTES) return null;
    const text = await request.text();
    if (encoder.encode(text).byteLength > MAX_JSON_BODY_BYTES) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function cleanString(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function getEraBaseYear(env) {
  const value = Number(env.AXIE_ERA_BASE_GREGORIAN_YEAR || 2024);
  return Number.isInteger(value) && value >= 1 && value <= 9999 ? value : 2024;
}

function eraDateToGregorianYear(birthDate, baseYear) {
  return birthDate.era === "before"
    ? baseYear - birthDate.year
    : baseYear + birthDate.year - 1;
}

function formatEraBirthDate(birthDate) {
  if (!birthDate) return "未填写";
  const yearLabel = birthDate.year === 1
    ? "元年"
    : `${birthDate.year}年`;
  const eraLabel = birthDate.era === "before"
    ? `阿谢纪年前${birthDate.year === 1 ? "一年" : `${birthDate.year}年`}`
    : `阿谢${yearLabel}`;
  return `${eraLabel}${birthDate.month}月${birthDate.day}日`;
}

function validateAddress(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "请按表单填写阿谢国住址。" };
  }
  const parts = {
    city: cleanString(value.city, 40),
    district: cleanString(value.district, 50),
    district_type: cleanString(value.district_type, 10),
    street: cleanString(value.street, 50),
    street_type: cleanString(value.street_type, 10),
    road: cleanString(value.road, 50),
    road_type: cleanString(value.road_type, 10),
    side: cleanString(value.side, 4),
    number: cleanString(value.number, 24),
    apartment: cleanString(value.apartment, 80),
  };
  if (!VALID_CITIES.has(parts.city)) return { error: "请选择有效的阿谢国城市。" };
  if (!parts.district) return { error: "请填写区、镇、郡或村的名称。" };
  if (!VALID_DISTRICT_TYPES.has(parts.district_type)) return { error: "请选择有效的区划类型。" };
  if (!parts.street) return { error: "请填写街道或乡的名称。" };
  if (!VALID_STREET_TYPES.has(parts.street_type)) return { error: "请选择街道或乡。" };
  if (!parts.road) return { error: "请填写道路名称。" };
  if (!VALID_ROAD_TYPES.has(parts.road_type)) return { error: "请选择路或大道。" };
  if (!VALID_SIDES.has(parts.side)) return { error: "请选择道路方位。" };
  if (!parts.number || !/^[\p{L}\p{N}-]{1,24}$/u.test(parts.number)) {
    return { error: "请填写有效门牌号（可使用数字、文字和连字符）。" };
  }
  const formatted = `${parts.city}${parts.district}${parts.district_type}${parts.street}${parts.street_type}${parts.road}${parts.road_type}${parts.side}侧${parts.number}号${parts.apartment ? `·${parts.apartment}` : ""}`;
  return { value: { parts, formatted } };
}

async function getPiiKey(env) {
  if (!env.PII_ENCRYPTION_KEY || env.PII_ENCRYPTION_KEY.length < 32) {
    throw new Error("PII encryption key is missing or too short");
  }
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(env.PII_ENCRYPTION_KEY));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function encryptProfile(profile, env) {
  const key = await getPiiKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(profile)),
  );
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

async function decryptProfile(ciphertext, env, cachedKey = null) {
  if (!ciphertext || !ciphertext.startsWith("v1.")) throw new Error("Unsupported encrypted profile format");
  const [, encodedIv, encodedCiphertext] = ciphertext.split(".");
  const cleartext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(encodedIv) },
    cachedKey || await getPiiKey(env),
    base64ToBytes(encodedCiphertext),
  );
  return JSON.parse(new TextDecoder().decode(cleartext));
}

function validatePhotoDataUrl(value) {
  if (value === undefined || value === null || value === "") return { value: "" };
  if (typeof value !== "string" || value.length > Math.ceil(MAX_CITIZEN_PHOTO_BYTES * 4 / 3) + 64) {
    return { error: "照片过大，请选择较小的图片。" };
  }
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return { error: "照片格式无效，请重新选择图片。" };
  let bytes;
  try {
    bytes = base64ToBytes(match[1]);
  } catch {
    return { error: "照片数据无效，请重新选择图片。" };
  }
  if (bytes.length < 4 || bytes.length > MAX_CITIZEN_PHOTO_BYTES) {
    return { error: "照片压缩后仍然过大，请选择其他图片。" };
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    return { error: "照片内容无效，请重新选择图片。" };
  }
  return { value };
}

async function encryptPhoto(dataUrl, env) {
  const encoded = dataUrl.slice("data:image/jpeg;base64,".length);
  const key = await getPiiKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    base64ToBytes(encoded),
  );
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}

async function decryptPhoto(ciphertext, env) {
  if (!ciphertext || !ciphertext.startsWith("v1.")) throw new Error("Unsupported encrypted photo format");
  const [, encodedIv, encodedCiphertext] = ciphertext.split(".");
  const cleartext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(encodedIv) },
    await getPiiKey(env),
    base64ToBytes(encodedCiphertext),
  );
  return `data:image/jpeg;base64,${bytesToBase64(new Uint8Array(cleartext))}`;
}

async function preparePhotoUpsert(env, citizenId, dataUrl, updatedAt) {
  const encryptedPhoto = await encryptPhoto(dataUrl, env);
  return env.DB.prepare(
    `INSERT INTO citizen_photos (citizen_id, photo_ciphertext, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(citizen_id) DO UPDATE SET
       photo_ciphertext = excluded.photo_ciphertext,
       updated_at = excluded.updated_at`,
  ).bind(citizenId, encryptedPhoto, updatedAt);
}

function validateBirthDate(value, env) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "请选择出生日期。" };
  }
  const era = value.era;
  const year = Number(value.year);
  const month = Number(value.month);
  const day = Number(value.day);
  if (!new Set(["axie", "before"]).has(era)) return { error: "纪年格式无效。" };
  if (!Number.isInteger(year) || year < 1 || year > 9999) return { error: "纪年年份须为 1 至 9999。" };
  if (!Number.isInteger(month) || month < 1 || month > 12) return { error: "出生月份无效。" };
  if (!Number.isInteger(day) || day < 1 || day > 31) return { error: "出生日期无效。" };
  const birthDate = { era, year, month, day };
  const gregorianYear = eraDateToGregorianYear(birthDate, getEraBaseYear(env));
  const leapYear = gregorianYear % 4 === 0 && (gregorianYear % 100 !== 0 || gregorianYear % 400 === 0);
  const daysInMonth = month === 2
    ? leapYear ? 29 : 28
    : [4, 6, 9, 11].includes(month) ? 30 : 31;
  if (day > daysInMonth) {
    return { error: "这个月份没有对应的日期。" };
  }
  // Allow the site's UTC+8 day boundary when checking dates submitted to the Worker.
  const today = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const current = [today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate()];
  const submitted = [gregorianYear, month, day];
  if (submitted[0] > current[0] ||
      (submitted[0] === current[0] && submitted[1] > current[1]) ||
      (submitted[0] === current[0] && submitted[1] === current[1] && submitted[2] > current[2])) {
    return { error: "出生日期不能晚于今天。" };
  }
  return { value: birthDate };
}

function validateCitizen(input, env) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "请求数据格式不正确。" };
  }
  const fullName = cleanString(input.full_name, 100);
  const displayName = cleanString(input.display_name, 80);
  const address = validateAddress(input.address);
  const joinDate = cleanString(input.join_date, 10);
  const notes = cleanString(input.notes, 500);
  const status = cleanString(input.status || "active", 20);
  const photo = validatePhotoDataUrl(input.photo_data_url);

  if (!fullName) return { error: "请填写姓名。" };
  if (address.error) return address;
  if (photo.error) return photo;
  if (input.full_name && input.full_name.length > 100) {
    return { error: "姓名不能超过 100 个字符。" };
  }
  if (input.display_name && input.display_name.length > 80) {
    return { error: "称呼不能超过 80 个字符。" };
  }
  if (input.notes && input.notes.length > 500) {
    return { error: "备注不能超过 500 个字符。" };
  }
  if (!VALID_STATUSES.has(status)) return { error: "国民状态无效。" };
  const birthDate = validateBirthDate(input.birth_date, env);
  if (birthDate.error) return birthDate;
  if (joinDate && !/^\d{4}-\d{2}-\d{2}$/.test(joinDate)) {
    return { error: "加入日期格式应为 YYYY-MM-DD。" };
  }
  if (joinDate) {
    const [year, month, day] = joinDate.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      return { error: "加入日期不是有效日期。" };
    }
  }

  return {
    value: {
      full_name: fullName,
      display_name: displayName,
      birth_date: birthDate.value,
      address: address.value.formatted,
      address_parts: address.value.parts,
      status,
      join_date: joinDate,
      notes,
      photo_data_url: photo.value,
    },
  };
}

async function getSession(request, env) {
  const match = /^Bearer\s+([A-Za-z0-9_-]{40,80})$/i.exec(
    request.headers.get("Authorization") || "",
  );
  if (!match) return null;
  const tokenHash = await sha256Hex(match[1]);
  const now = Date.now();
  const session = await env.DB.prepare(
    "SELECT token_hash, expires_at FROM admin_sessions WHERE token_hash = ? AND expires_at > ?",
  )
    .bind(tokenHash, now)
    .first();
  return session ? { tokenHash, expiresAt: session.expires_at } : null;
}

async function recordAudit(env, session, action, citizenId = null) {
  try {
    await env.DB.prepare(
      "INSERT INTO audit_logs (id, action, citizen_id, session_fingerprint, occurred_at) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(randomId(), action, citizenId, session.tokenHash.slice(0, 16), Date.now())
      .run();
  } catch (error) {
    // Keep the primary record operation successful if audit storage has a transient issue.
    console.error("Audit log write failed", error);
  }
}

function createLoginFingerprint(secret, request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  return hmacHex(secret, ip);
}

async function login(request, env, cors) {
  if (!env.DB) return jsonWithCors({ error: "D1 数据库尚未绑定。" }, 503, cors);
  if (!env.ADMIN_PASSWORD) {
    return jsonWithCors({ error: "管理员密码尚未配置。" }, 503, cors);
  }
  const body = await readJson(request);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || password.length > 256) {
    return jsonWithCors({ error: "请输入有效的管理员密码。" }, 400, cors);
  }

  const fingerprint = await createLoginFingerprint(env.ADMIN_PASSWORD, request);
  const now = Date.now();
  await env.DB.prepare("DELETE FROM login_attempts WHERE window_started_at < ?")
    .bind(now - 4 * LOGIN_WINDOW_MS)
    .run();
  const attempt = await env.DB.prepare(
    "SELECT failure_count, window_started_at, locked_until FROM login_attempts WHERE ip_hash = ?",
  )
    .bind(fingerprint)
    .first();
  if (attempt?.locked_until > now) {
    return jsonWithCors(
      { error: "登录尝试过多，请 15 分钟后重试。" },
      429,
      cors,
      { "Retry-After": String(Math.ceil((attempt.locked_until - now) / 1000)) },
    );
  }

  if (!constantTimeEqual(password, env.ADMIN_PASSWORD)) {
    const windowIsCurrent = attempt && now - attempt.window_started_at < LOGIN_WINDOW_MS;
    const failureCount = windowIsCurrent ? attempt.failure_count + 1 : 1;
    const windowStartedAt = windowIsCurrent ? attempt.window_started_at : now;
    const lockedUntil = failureCount >= MAX_LOGIN_FAILURES ? now + LOGIN_LOCK_MS : 0;
    await env.DB.prepare(
      `INSERT INTO login_attempts (ip_hash, failure_count, window_started_at, locked_until)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(ip_hash) DO UPDATE SET
         failure_count = excluded.failure_count,
         window_started_at = excluded.window_started_at,
         locked_until = excluded.locked_until`,
    )
      .bind(fingerprint, failureCount, windowStartedAt, lockedUntil)
      .run();
    return jsonWithCors(
      { error: lockedUntil ? "登录尝试过多，请 15 分钟后重试。" : "管理员密码不正确。" },
      lockedUntil ? 429 : 401,
      cors,
      lockedUntil ? { "Retry-After": "900" } : {},
    );
  }

  await env.DB.prepare("DELETE FROM login_attempts WHERE ip_hash = ?").bind(fingerprint).run();
  await env.DB.prepare("DELETE FROM admin_sessions WHERE expires_at <= ?").bind(now).run();
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const requestedTtl = Number(env.SESSION_TTL_SECONDS);
  const ttlSeconds = Number.isFinite(requestedTtl)
    ? Math.min(Math.max(requestedTtl, 900), 86400)
    : SESSION_DEFAULT_SECONDS;
  const expiresAt = now + ttlSeconds * 1000;
  await env.DB.prepare(
    "INSERT INTO admin_sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)",
  )
    .bind(tokenHash, now, expiresAt)
    .run();
  return jsonWithCors({ token, expires_at: expiresAt }, 200, cors);
}

function makeFilters(url) {
  const status = url.searchParams.get("status") || "";
  const search = cleanString(url.searchParams.get("q") || "", 120);
  if (status && status !== "all") {
    if (!VALID_STATUSES.has(status)) return { error: "国民状态筛选值无效。" };
  }
  return { status: status && status !== "all" ? status : "", search };
}

async function filteredProfiles(url, env) {
  const filters = makeFilters(url);
  if (filters.error) return filters;
  const where = filters.status ? "WHERE status = ?" : "";
  const count = await env.DB.prepare(`SELECT COUNT(*) AS total FROM citizens ${where}`)
    .bind(...(filters.status ? [filters.status] : []))
    .first();
  const rows = await env.DB.prepare(
    `SELECT id, citizen_no, profile_ciphertext, status, created_at, updated_at,
       EXISTS (SELECT 1 FROM citizen_photos AS photo WHERE photo.citizen_id = citizens.id) AS has_photo
     FROM citizens ${where}
     ORDER BY updated_at DESC, id ASC
     LIMIT ?`,
  )
    .bind(...(filters.status ? [filters.status, MAX_PROFILE_ROWS] : [MAX_PROFILE_ROWS]))
    .all();
  const piiKey = await getPiiKey(env);
  const profiles = await Promise.all((rows.results || []).map(async (row) => ({
    id: row.id,
    citizen_no: row.citizen_no,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    has_photo: Number(row.has_photo) === 1,
    ...await decryptProfile(row.profile_ciphertext, env, piiKey),
  })));
  const needle = filters.search.toLocaleLowerCase("zh-CN");
  const matches = needle
    ? profiles.filter((profile) => [
      profile.citizen_no,
      profile.full_name,
      profile.display_name,
      profile.address,
      formatEraBirthDate(profile.birth_date),
    ].some((value) => String(value || "").toLocaleLowerCase("zh-CN").includes(needle)))
    : profiles;
  return { profiles: matches, totalBeforeSearch: count?.total || 0, truncated: (count?.total || 0) > MAX_PROFILE_ROWS };
}

async function listCitizens(url, env, cors) {
  const result = await filteredProfiles(url, env);
  if (result.error) return jsonWithCors({ error: result.error }, 400, cors);
  const page = Math.max(1, Math.min(Number(url.searchParams.get("page")) || 1, 100000));
  const pageSize = Math.max(1, Math.min(Number(url.searchParams.get("page_size")) || 20, 100));
  const total = result.profiles.length;
  return jsonWithCors({
    citizens: result.profiles.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    page_size: pageSize,
    truncated: result.truncated,
  }, 200, cors);
}

async function citizenStats(env, cors) {
  const result = await env.DB.prepare(
    "SELECT status, COUNT(*) AS count FROM citizens GROUP BY status",
  ).all();
  const counts = { active: 0, pending: 0, suspended: 0, resigned: 0, rejected: 0 };
  for (const row of result.results || []) counts[row.status] = row.count;
  return jsonWithCors({
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    counts,
    labels: STATUS_LABELS,
  }, 200, cors);
}

function csvCell(value) {
  let text = value == null ? "" : String(value);
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

async function exportCitizens(url, env, session, cors) {
  const result = await filteredProfiles(url, env);
  if (result.error) return jsonWithCors({ error: result.error }, 400, cors);
  const header = ["国民编号", "姓名", "称呼", "出生日期（阿谢纪年）", "阿谢国住址", "状态", "加入日期", "备注", "创建时间", "更新时间"];
  const lines = [header, ...result.profiles.map((row) => [
    row.citizen_no,
    row.full_name,
    row.display_name,
    formatEraBirthDate(row.birth_date),
    row.address,
    STATUS_LABELS[row.status] || row.status,
    row.join_date,
    row.notes,
    new Date(row.created_at).toISOString(),
    new Date(row.updated_at).toISOString(),
  ])].map((line) => line.map(csvCell).join(","));
  await recordAudit(env, session, "export_csv");
  return new Response(`\uFEFF${lines.join("\r\n")}`, {
    status: 200,
    headers: {
      ...cors.headers,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="axie-citizens.csv"',
      "Cache-Control": "no-store",
    },
  });
}

function makeCitizenNo(now) {
  return `AX-${new Date(now).getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function checkRegistrationRate(request, env) {
  if (!env.PII_ENCRYPTION_KEY) return { error: "登记服务尚未完成加密配置。", status: 503 };
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const fingerprint = await hmacHex(env.PII_ENCRYPTION_KEY, ip);
  const now = Date.now();
  await env.DB.prepare("DELETE FROM registration_limits WHERE window_started_at < ?")
    .bind(now - 24 * REGISTRATION_WINDOW_MS)
    .run();
  const record = await env.DB.prepare(
    "SELECT submission_count, window_started_at FROM registration_limits WHERE ip_hash = ?",
  ).bind(fingerprint).first();
  const sameWindow = record && now - record.window_started_at < REGISTRATION_WINDOW_MS;
  if (sameWindow && record.submission_count >= MAX_REGISTRATIONS_PER_WINDOW) {
    return { error: "提交次数过多，请一小时后再试。", status: 429 };
  }
  const count = sameWindow ? record.submission_count + 1 : 1;
  const startedAt = sameWindow ? record.window_started_at : now;
  await env.DB.prepare(
    `INSERT INTO registration_limits (ip_hash, submission_count, window_started_at)
     VALUES (?, ?, ?)
     ON CONFLICT(ip_hash) DO UPDATE SET
       submission_count = excluded.submission_count,
       window_started_at = excluded.window_started_at`,
  ).bind(fingerprint, count, startedAt).run();
  return { fingerprint };
}

async function verifyVoterIdentity(request, env, cors) {
  if (!env.VOTER_VERIFY_SECRET || !env.PII_ENCRYPTION_KEY) {
    return jsonWithCors({ error: "投票身份核验服务尚未配置。" }, 503, cors);
  }

  const authorization = request.headers.get("Authorization") || "";
  if (!constantTimeEqual(authorization, `Bearer ${env.VOTER_VERIFY_SECRET}`)) {
    return jsonWithCors({ error: "投票身份核验凭证无效。" }, 401, cors);
  }

  const body = await readJson(request);
  const suppliedName = cleanString(body?.full_name, 100)
    .normalize("NFKC")
    .replace(/\s+/g, " ");
  const citizenNo = cleanString(body?.citizen_no, 40).toUpperCase();
  if (!suppliedName || !citizenNo) {
    return jsonWithCors({ error: "请输入姓名和国民 ID。" }, 400, cors);
  }

  const clientIp = cleanString(
    request.headers.get("X-Client-IP") || request.headers.get("CF-Connecting-IP"),
    128,
  ) || "unknown";
  const ipHash = await hmacHex(env.PII_ENCRYPTION_KEY, `voter-verification:${clientIp}`);
  const now = Date.now();
  await env.DB.prepare("DELETE FROM voter_verification_limits WHERE window_started_at < ?")
    .bind(now - 24 * VOTER_VERIFICATION_WINDOW_MS)
    .run();

  const previous = await env.DB.prepare(
    "SELECT attempt_count, window_started_at FROM voter_verification_limits WHERE ip_hash = ?",
  ).bind(ipHash).first();
  const sameWindow = previous && now - previous.window_started_at < VOTER_VERIFICATION_WINDOW_MS;
  const attemptCount = sameWindow ? previous.attempt_count + 1 : 1;
  const windowStartedAt = sameWindow ? previous.window_started_at : now;
  await env.DB.prepare(
    `INSERT INTO voter_verification_limits (ip_hash, attempt_count, window_started_at)
     VALUES (?, ?, ?)
     ON CONFLICT(ip_hash) DO UPDATE SET
       attempt_count = excluded.attempt_count,
       window_started_at = excluded.window_started_at`,
  ).bind(ipHash, attemptCount, windowStartedAt).run();
  if (attemptCount > MAX_VOTER_VERIFICATION_ATTEMPTS) {
    return jsonWithCors({ error: "尝试次数过多，请稍后再试。" }, 429, cors);
  }

  const record = await env.DB.prepare(
    "SELECT profile_ciphertext FROM citizens WHERE citizen_no = ? AND status = 'active' LIMIT 1",
  ).bind(citizenNo).first();
  if (!record) {
    return jsonWithCors({ error: "姓名或国民 ID 不匹配，或国民资格未生效。" }, 401, cors);
  }

  const profile = await decryptProfile(record.profile_ciphertext, env);
  const storedName = cleanString(profile.full_name, 100)
    .normalize("NFKC")
    .replace(/\s+/g, " ");
  if (storedName !== suppliedName) {
    return jsonWithCors({ error: "姓名或国民 ID 不匹配，或国民资格未生效。" }, 401, cors);
  }

  return jsonWithCors({ eligible: true }, 200, cors);
}

async function registerCitizen(request, env, cors) {
  if (!env.DB) return jsonWithCors({ error: "登记服务暂不可用。" }, 503, cors);
  const rate = await checkRegistrationRate(request, env);
  if (rate.error) return jsonWithCors({ error: rate.error }, rate.status, cors);
  const body = await readJson(request);
  if (body?.website) return jsonWithCors({ error: "申请提交失败。" }, 400, cors);
  if (body?.privacy_acknowledged !== true) {
    return jsonWithCors({ error: "请先阅读并同意资料使用说明。" }, 400, cors);
  }
  const validated = validateCitizen({
    ...body,
    status: "pending",
    join_date: "",
    notes: "",
    display_name: "",
  }, env);
  if (validated.error) return jsonWithCors({ error: validated.error }, 400, cors);
  const now = Date.now();
  const id = randomId();
  const { status, photo_data_url: photoDataUrl, ...profile } = validated.value;
  const ciphertext = await encryptProfile(profile, env);
  const statements = [env.DB.prepare(
    "INSERT INTO citizens (id, citizen_no, profile_ciphertext, status, created_at, updated_at) VALUES (?, NULL, ?, 'pending', ?, ?)",
  ).bind(id, ciphertext, now, now)];
  if (photoDataUrl) statements.push(await preparePhotoUpsert(env, id, photoDataUrl, now));
  await env.DB.batch(statements);
  await recordAudit(env, { tokenHash: rate.fingerprint }, "public_registration", id);
  return jsonWithCors({
    ok: true,
    message: "申请已提交，当前状态为待审核。审核通过后管理员将发放国民编号。",
  }, 201, cors);
}

async function createCitizen(request, env, session, cors) {
  const body = await readJson(request);
  const validated = validateCitizen(body, env);
  if (validated.error) return jsonWithCors({ error: validated.error }, 400, cors);
  const now = Date.now();
  const id = randomId();
  const status = validated.value.status;
  const citizenNo = status === "active" ? makeCitizenNo(now) : null;
  const { status: ignoredStatus, photo_data_url: photoDataUrl, ...profile } = validated.value;
  const ciphertext = await encryptProfile(profile, env);
  try {
    const statements = [env.DB.prepare(
      `INSERT INTO citizens (id, citizen_no, profile_ciphertext, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(
        id,
        citizenNo,
        ciphertext,
        status,
        now,
        now,
      )];
    if (photoDataUrl) statements.push(await preparePhotoUpsert(env, id, photoDataUrl, now));
    await env.DB.batch(statements);
  } catch (error) {
    console.error("Citizen create failed", error);
    return jsonWithCors({ error: "保存国民档案失败，请稍后重试。" }, 500, cors);
  }
  await recordAudit(env, session, "create_citizen", id);
  const row = await env.DB.prepare("SELECT * FROM citizens WHERE id = ?").bind(id).first();
  const citizen = { ...row, ...await decryptProfile(row.profile_ciphertext, env), has_photo: Boolean(photoDataUrl) };
  return jsonWithCors({ citizen }, 201, cors);
}

async function updateCitizen(request, env, session, cors, citizenId) {
  const existing = await env.DB.prepare("SELECT * FROM citizens WHERE id = ?")
    .bind(citizenId)
    .first();
  if (!existing) return jsonWithCors({ error: "没有找到该国民档案。" }, 404, cors);
  const body = await readJson(request);
  const validated = validateCitizen(body, env);
  if (validated.error) return jsonWithCors({ error: validated.error }, 400, cors);
  const updatedAt = Date.now();
  const status = validated.value.status;
  const citizenNo = existing.citizen_no || (status === "active" ? makeCitizenNo(updatedAt) : null);
  const approvedProfile = { ...validated.value };
  const photoWasSubmitted = Object.hasOwn(body, "photo_data_url");
  const photoDataUrl = approvedProfile.photo_data_url;
  if (existing.status === "pending" && status === "active" && !approvedProfile.join_date) {
    approvedProfile.join_date = new Date(updatedAt).toISOString().slice(0, 10);
  }
  const { status: ignoredStatus, photo_data_url: ignoredPhoto, ...profile } = approvedProfile;
  const ciphertext = await encryptProfile(profile, env);
  const statements = [env.DB.prepare(
    `UPDATE citizens
     SET citizen_no = ?, profile_ciphertext = ?, status = ?, updated_at = ?
     WHERE id = ?`,
  ).bind(
      citizenNo,
      ciphertext,
      status,
      updatedAt,
      citizenId,
    )];
  if (photoWasSubmitted) {
    if (photoDataUrl) {
      statements.push(await preparePhotoUpsert(env, citizenId, photoDataUrl, updatedAt));
    } else {
      statements.push(env.DB.prepare("DELETE FROM citizen_photos WHERE citizen_id = ?").bind(citizenId));
    }
  }
  await env.DB.batch(statements);
  await recordAudit(env, session, existing.status === status ? "update_citizen" : "change_status", citizenId);
  const row = await env.DB.prepare("SELECT * FROM citizens WHERE id = ?")
    .bind(citizenId)
    .first();
  const citizen = { ...row, ...await decryptProfile(row.profile_ciphertext, env) };
  return jsonWithCors({ citizen }, 200, cors);
}

async function getCitizenPhoto(citizenId, env, cors) {
  const row = await env.DB.prepare(
    "SELECT photo_ciphertext FROM citizen_photos WHERE citizen_id = ?",
  )
    .bind(citizenId)
    .first();
  if (!row) return jsonWithCors({ error: "该档案没有上传照片。" }, 404, cors);
  return jsonWithCors({ photo_data_url: await decryptPhoto(row.photo_ciphertext, env) }, 200, cors);
}

async function handleRequest(request, env) {
  const cors = getCorsHeaders(request, env);
  if (!cors.allowed) return jsonWithCors({ error: "此来源不允许访问该接口。" }, 403, cors);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors.headers });
  }
  if (request.method === "GET" && new URL(request.url).pathname === "/api/health") {
    return jsonWithCors({ ok: true, service: "axie-citizens-admin-api" }, 200, cors);
  }
  if (request.method === "GET" && new URL(request.url).pathname === "/api/public-config") {
    return jsonWithCors({ era_base_gregorian_year: getEraBaseYear(env) }, 200, cors);
  }
  if (request.method === "POST" && new URL(request.url).pathname === "/api/auth/login") {
    return login(request, env, cors);
  }
  if (request.method === "POST" && new URL(request.url).pathname === "/api/registrations") {
    return registerCitizen(request, env, cors);
  }
  if (!env.DB) return jsonWithCors({ error: "D1 数据库尚未绑定。" }, 503, cors);

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  if (path === "/api/internal/verify-voter" && request.method === "POST") {
    return verifyVoterIdentity(request, env, cors);
  }
  if (path === "/api/auth/logout" && request.method === "POST") {
    const session = await getSession(request, env);
    if (session) {
      await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash = ?")
        .bind(session.tokenHash)
        .run();
    }
    return jsonWithCors({ ok: true }, 200, cors);
  }
  const session = await getSession(request, env);
  if (!session) return jsonWithCors({ error: "登录已失效，请重新登录。" }, 401, cors);
  if (path === "/api/auth/me" && request.method === "GET") {
    return jsonWithCors({ ok: true, expires_at: session.expiresAt }, 200, cors);
  }
  if (path === "/api/stats" && request.method === "GET") {
    return citizenStats(env, cors);
  }
  if (path === "/api/citizens/export.csv" && request.method === "GET") {
    return exportCitizens(url, env, session, cors);
  }
  if (path === "/api/citizens" && request.method === "GET") {
    return listCitizens(url, env, cors);
  }
  if (path === "/api/citizens" && request.method === "POST") {
    return createCitizen(request, env, session, cors);
  }
  const photoMatch = /^\/api\/citizens\/([0-9a-f-]{36})\/photo$/i.exec(path);
  if (photoMatch && request.method === "GET") {
    return getCitizenPhoto(photoMatch[1], env, cors);
  }
  const citizenMatch = /^\/api\/citizens\/([0-9a-f-]{36})$/i.exec(path);
  if (citizenMatch && request.method === "PUT") {
    return updateCitizen(request, env, session, cors, citizenMatch[1]);
  }
  return jsonWithCors({ error: "接口不存在。" }, 404, cors);
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error("Citizen API error", error);
      const cors = getCorsHeaders(request, env);
      return jsonWithCors({ error: "服务暂时不可用，请稍后重试。" }, 500, cors);
    }
  },
};
