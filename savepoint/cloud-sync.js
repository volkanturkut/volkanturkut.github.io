(function () {
  "use strict";

  var CONFIG_KEY = "savepoint-cloud-config-v1";
  var SESSION_PREFIX = "savepoint-cloud-session-v1:";
  var RULES = "rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /savepointBacklogs/{syncId} {\n      allow get, create, update: if request.auth != null;\n      allow list, delete: if false;\n    }\n  }\n}";
  var state = { busy: false, pending: false, applyingRemote: false, timer: null };

  function el(id) { return document.getElementById(id); }
  function validConfig(c) {
    return !!(c && c.projectId && c.apiKey && c.syncCode && c.syncCode.length >= 20);
  }
  function readConfig() {
    try {
      var c = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null");
      return validConfig(c) ? c : null;
    } catch (_) { return null; }
  }
  function status(message) {
    if (el("syncStateTop")) el("syncStateTop").textContent = message;
    if (el("syncStatus")) el("syncStatus").textContent = message;
  }
  function openPanel() {
    var c = readConfig();
    if (c) {
      el("syncProjectId").value = c.projectId;
      el("syncApiKey").value = c.apiKey;
      el("syncCode").value = c.syncCode;
    }
    el("syncBg").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closePanel() {
    el("syncBg").classList.remove("open");
    document.body.style.overflow = "";
  }
  function getFields() {
    return {
      projectId: el("syncProjectId").value.trim(),
      apiKey: el("syncApiKey").value.trim(),
      syncCode: el("syncCode").value.trim()
    };
  }
  function saveConfig() {
    var c = getFields();
    if (!c.projectId || !c.apiKey) {
      status("Firebase Project ID ve Web API Key alanlarını doldur.");
      return null;
    }
    if (c.syncCode.length < 20) {
      status("Eşitleme kodu en az 20 karakter olmalı. Güvenli kod üret düğmesini kullanabilirsin.");
      return null;
    }
    try { localStorage.setItem(CONFIG_KEY, JSON.stringify(c)); }
    catch (_) { status("Ayarlar bu tarayıcıya kaydedilemedi."); return null; }
    status("Ayarlar bu cihaza kaydedildi. Eşitlemeyi başlatmak için “Eşitle şimdi”ye bas.");
    return c;
  }
  function generateCode() {
    var bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    el("syncCode").value = Array.from(bytes).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
    status("Güvenli kod üretildi. Ayarları kaydettikten sonra kodu diğer cihazda da aynen kullan.");
  }
  function copyText(text, success) {
    function fallback() {
      var input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (_) {}
      input.remove();
      status(ok ? success : "Kopyalama başarısız. Metni seçip elle kopyala.");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { status(success); }).catch(fallback);
    } else fallback();
  }
  async function requestJson(url, options) {
    var response = await fetch(url, options || {});
    var raw = await response.text();
    var data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}
    if (!response.ok) {
      var message = data && data.error && (data.error.message || data.error.status) || ("HTTP " + response.status);
      var err = new Error(message);
      err.status = response.status;
      throw err;
    }
    return data;
  }
  async function getToken(c) {
    var sessionKey = SESSION_PREFIX + c.projectId;
    var session = null;
    try { session = JSON.parse(localStorage.getItem(sessionKey) || "null"); } catch (_) {}
    if (session && session.idToken && session.expiresAt > Date.now() + 30000) return session.idToken;
    if (session && session.refreshToken) {
      try {
        var refreshed = await requestJson("https://securetoken.googleapis.com/v1/token?key=" + encodeURIComponent(c.apiKey), {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: session.refreshToken })
        });
        session = {
          idToken: refreshed.id_token,
          refreshToken: refreshed.refresh_token || session.refreshToken,
          expiresAt: Date.now() + Number(refreshed.expires_in || 3600) * 1000
        };
        localStorage.setItem(sessionKey, JSON.stringify(session));
        return session.idToken;
      } catch (_) { session = null; }
    }
    var created = await requestJson("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + encodeURIComponent(c.apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnSecureToken: true })
    });
    session = {
      idToken: created.idToken,
      refreshToken: created.refreshToken,
      expiresAt: Date.now() + Number(created.expiresIn || 3600) * 1000
    };
    localStorage.setItem(sessionKey, JSON.stringify(session));
    return session.idToken;
  }
  function encodeBase64(bytes) {
    var binary = "";
    for (var i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 0x8000, bytes.length)));
    }
    return btoa(binary);
  }
  function decodeBase64(text) {
    var binary = atob(text), bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  async function cryptoKey(code) {
    var material = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({
      name: "PBKDF2",
      salt: new TextEncoder().encode("savepoint-cloud-sync-v1"),
      iterations: 180000,
      hash: "SHA-256"
    }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function encrypt(value, code) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var key = await cryptoKey(code);
    var cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(JSON.stringify(value)));
    var bytes = new Uint8Array(iv.length + cipher.byteLength);
    bytes.set(iv);
    bytes.set(new Uint8Array(cipher), iv.length);
    return encodeBase64(bytes);
  }
  async function decrypt(value, code) {
    var bytes = decodeBase64(value);
    if (bytes.length < 29) throw new Error("Bulut kaydı bozuk.");
    var key = await cryptoKey(code);
    var plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12));
    return JSON.parse(new TextDecoder().decode(plain));
  }
  async function syncDocumentId(code) {
    var digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("savepoint-document-v1:" + code));
    return Array.from(new Uint8Array(digest)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  function baseUrl(c) {
    return "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(c.projectId) + "/databases/(default)/documents";
  }
  async function readCloud(c, token, id) {
    var response = await fetch(baseUrl(c) + "/savepointBacklogs/" + id, {
      headers: { Authorization: "Bearer " + token, Accept: "application/json" }
    });
    if (response.status === 404) return null;
    var raw = await response.text(), doc = {};
    try { doc = raw ? JSON.parse(raw) : {}; } catch (_) {}
    if (!response.ok) {
      var err = new Error(doc && doc.error && (doc.error.message || doc.error.status) || ("HTTP " + response.status));
      err.status = response.status;
      throw err;
    }
    var payload = doc.fields && doc.fields.payload && doc.fields.payload.stringValue;
    if (!payload) throw new Error("Bulut belgesinde oyun verisi bulunamadı.");
    return decrypt(payload, c.syncCode);
  }
  async function writeCloud(c, token, id, data) {
    var body = { fields: {
      payload: { stringValue: await encrypt(data, c.syncCode) },
      updatedAt: { timestampValue: new Date().toISOString() }
    }};
    var url = baseUrl(c), current = await fetch(url + "/savepointBacklogs/" + id, {
      headers: { Authorization: "Bearer " + token, Accept: "application/json" }
    });
    var response;
    if (current.status === 404) {
      response = await fetch(url + "/savepointBacklogs?documentId=" + id, {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } else {
      if (!current.ok) {
        var currentText = await current.text(), currentData = {};
        try { currentData = JSON.parse(currentText); } catch (_) {}
        throw new Error(currentData && currentData.error && (currentData.error.message || currentData.error.status) || ("HTTP " + current.status));
      }
      response = await fetch(url + "/savepointBacklogs/" + id + "?updateMask.fieldPaths=payload&updateMask.fieldPaths=updatedAt", {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    }
    var raw = await response.text(), parsed = {};
    try { parsed = raw ? JSON.parse(raw) : {}; } catch (_) {}
    if (!response.ok) throw new Error(parsed && parsed.error && (parsed.error.message || parsed.error.status) || ("HTTP " + response.status));
  }
  function normalizeTitle(text) {
    return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[™®©]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function latestObject(a, b) {
    if (!a) return b || null;
    if (!b) return a;
    return Number(b.updatedAt || 0) > Number(a.updatedAt || 0) ? b : a;
  }
  function mergeGames(localGames, remoteGames) {
    var remoteMap = new Map();
    (Array.isArray(remoteGames) ? remoteGames : []).forEach(function (g) {
      if (g && g.title) remoteMap.set(normalizeTitle(g.title), g);
    });
    var used = new Set(), merged = (Array.isArray(localGames) ? localGames : []).map(function (local) {
      var key = normalizeTitle(local.title), remote = remoteMap.get(key);
      if (!remote) return local;
      used.add(key);
      var localWins = Number(local.updatedAt || 0) > Number(remote.updatedAt || 0);
      var newer = localWins ? local : remote;
      var out = Object.assign({}, local, remote, newer);
      out.title = local.title;
      out.order = local.order;
      out.phase = local.phase || remote.phase;
      out.group = local.group || remote.group;
      out.hltb = latestObject(local.hltb, remote.hltb);
      out.beforeIPlay = latestObject(local.beforeIPlay, remote.beforeIPlay);
      return out;
    });
    var occupied = new Set(merged.map(function (g) { return Number(g.order); }));
    var nextOrder = Math.max(0, ...Array.from(occupied).filter(Number.isFinite)) + 1;
    (Array.isArray(remoteGames) ? remoteGames : []).forEach(function (remote) {
      var key = normalizeTitle(remote && remote.title);
      if (!remote || !remote.title || used.has(key) || merged.some(function (g) { return normalizeTitle(g.title) === key; })) return;
      var extra = Object.assign({}, remote);
      if (occupied.has(Number(extra.order))) extra.order = nextOrder++;
      occupied.add(Number(extra.order));
      merged.push(extra);
    });
    return merged.sort(function (a, b) { return Number(a.order) - Number(b.order); });
  }
  function explainError(error) {
    var message = String(error && error.message || error || "Bilinmeyen hata");
    if (/API_KEY_INVALID|API key not valid/i.test(message)) return "Firebase Web API Key hatalı.";
    if (/OPERATION_NOT_ALLOWED|ADMIN_ONLY_OPERATION/i.test(message)) return "Firebase Authentication içinde Anonymous giriş yöntemini etkinleştir.";
    if (/PERMISSION_DENIED|Missing or insufficient permissions/i.test(message)) return "Firestore Rules kurallarını aşağıdaki örnekle güncelle ve Anonymous Authentication'ı aç.";
    if (/NOT_FOUND|database.*not found|does not exist/i.test(message)) return "Firestore veritabanı henüz oluşturulmamış.";
    if (/Failed to fetch|NetworkError|Load failed/i.test(message)) return "Firebase bağlantısı kurulamadı. İnterneti ve proje ayarlarını kontrol et.";
    if (/OperationError|decrypt|authentication tag/i.test(message)) return "Eşitleme kodu diğer cihazdakiyle aynı değil.";
    return "Eşitleme başarısız: " + message;
  }
  async function synchronize(openOnMissing) {
    var c = readConfig();
    if (!c) {
      status("Bulut eşitlemesi henüz kurulmadı. Firebase ayarlarını bu cihazda kaydet.");
      if (openOnMissing) openPanel();
      return;
    }
    if (state.busy) { state.pending = true; return; }
    state.busy = true;
    status("Bulut kaydı okunuyor…");
    try {
      if (!window.crypto || !crypto.subtle) throw new Error("Bu tarayıcı AES-GCM şifrelemesini desteklemiyor; güncel Safari/Chrome kullan.");
      var token = await getToken(c);
      var id = await syncDocumentId(c.syncCode);
      var remote = await readCloud(c, token, id);
      var remoteGames = remote && Array.isArray(remote.games) ? remote.games : null;
      var merged = remoteGames ? mergeGames(games, remoteGames) : games.slice();
      state.applyingRemote = true;
      try {
        games = merged;
        persist();
      } finally { state.applyingRemote = false; }
      if (typeof updateStats === "function") updateStats();
      if (typeof render === "function") render(false);
      await writeCloud(c, token, id, { version: 1, games: games, savedAt: Date.now() });
      try { localStorage.setItem("savepoint-cloud-last-sync-v1", String(Date.now())); } catch (_) {}
      status("✓ Eşitlendi · " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      status(explainError(error));
    } finally {
      state.busy = false;
      if (state.pending) {
        state.pending = false;
        clearTimeout(state.timer);
        state.timer = setTimeout(function () { synchronize(false); }, 900);
      }
    }
  }
  function scheduleSync() {
    if (!readConfig()) return;
    clearTimeout(state.timer);
    state.timer = setTimeout(function () { synchronize(false); }, 1400);
  }
  function setup() {
    var c = readConfig();
    if (c) {
      el("syncProjectId").value = c.projectId;
      el("syncApiKey").value = c.apiKey;
      el("syncCode").value = c.syncCode;
      status("Bulut ayarları bulundu; eşitleme başlatılıyor…");
    } else status("Bulut eşitlemesi ayarlanmamış · yerel kayıt çalışıyor.");

    el("cloudSyncBtn").addEventListener("click", openPanel);
    el("syncClose").addEventListener("click", closePanel);
    el("syncBg").addEventListener("click", function (event) {
      if (event.target === el("syncBg")) closePanel();
    });
    el("syncSaveConfig").addEventListener("click", saveConfig);
    el("syncNow").addEventListener("click", function () {
      if (!readConfig() && !saveConfig()) return;
      synchronize(false);
    });
    el("syncGenerateCode").addEventListener("click", generateCode);
    el("syncCopyCode").addEventListener("click", function () {
      var code = el("syncCode").value.trim();
      if (code) copyText(code, "Eşitleme kodu kopyalandı; diğer cihazda aynı kodu kullan.");
      else status("Önce güvenli kod üret.");
    });
    el("syncCopyRules").addEventListener("click", function () { copyText(RULES, "Firestore kuralları kopyalandı."); });
    el("syncResetConfig").addEventListener("click", function () {
      if (!confirm("Bu cihazdaki Firebase ayarları silinsin mi? Buluttaki kayıt silinmez.")) return;
      localStorage.removeItem(CONFIG_KEY);
      el("syncProjectId").value = "";
      el("syncApiKey").value = "";
      el("syncCode").value = "";
      status("Bu cihazdaki bulut ayarları silindi; yerel oyun kaydın duruyor.");
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && el("syncBg").classList.contains("open")) closePanel();
    });
    window.savepointCloudSync = {
      get applyingRemote() { return state.applyingRemote; },
      schedule: scheduleSync,
      syncNow: function () { return synchronize(false); }
    };
    if (c) setTimeout(function () { synchronize(false); }, 1200);
  }
  setup();
})();