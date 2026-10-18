(function () {
  var excelData = null;
  var deferredInstall = null;
  var standalone = !!(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || !!navigator.standalone;
  var nativeLegacy = {
    "super mario bros": "NES", "super mario bros 2": "NES", "super mario bros 3": "NES",
    "super mario world": "SNES", "super mario 64": "Nintendo 64",
    "donkey kong country": "SNES", "donkey kong country 2 diddy s kong quest": "SNES",
    "donkey kong country 3 dixie kong s double trouble": "SNES", "donkey kong 64": "Nintendo 64",
    "star fox": "SNES", "star fox 2": "SNES", "star fox 64": "Nintendo 64",
    "the legend of zelda a link to the past": "SNES",
    "the legend of zelda ocarina of time": "Nintendo 64",
    "the legend of zelda majora s mask": "Nintendo 64",
    "pokemon red version": "Game Boy", "pokemon blue version": "Game Boy",
    "pokemon yellow version": "Game Boy", "pokemon gold version": "Game Boy Color",
    "pokemon silver version": "Game Boy Color", "pokemon crystal version": "Game Boy Color",
    "pokemon firered version": "Game Boy Advance", "pokemon leafgreen version": "Game Boy Advance",
    "pokemon ruby version": "Game Boy Advance", "pokemon sapphire version": "Game Boy Advance",
    "pokemon emerald version": "Game Boy Advance", "rhythm tengoku": "Game Boy Advance",
    "shin megami tensei if": "Super Nintendo"
  };
  var phaseLabels = [
    "1 · Short / focused stories", "2 · Direct franchise story arcs",
    "3 · Nintendo / retro series", "4 · Long campaigns / RPGs",
    "5 · Run-based / replayable", "6 · Open-ended / evergreen"
  ];
  var phaseTr = [
    "Kısa ve odaklı hikâyeler", "Seri hikâyeleri", "Nintendo ve retro seriler",
    "Uzun oyunlar ve RPG", "Run tabanlı / tekrar oynanabilir", "Açık uçlu ve uzun soluklu"
  ];
  function el(id) { return document.getElementById(id); }
  function html(v) { return String(v == null ? "" : v).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function norm(v) {
    return String(v == null ? "" : v).toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/[™®©]/g, "")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }
  function notify(msg) { try { if (typeof toast === "function") toast(msg); } catch (_) {} }
  function setView(view) {
    var target = view === "library" ? "libraryPane" : view + "View";
    document.querySelectorAll(".appPane").forEach(function (p) {
      p.classList.toggle("activePane", p.id === target);
    });
    document.querySelectorAll("#appNav [data-app-view]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-app-view") === view);
    });
    if (view !== "library" && document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function currentMatch(title) { return games.find(function (g) { return norm(g.title) === norm(title); }); }
  function platformClassForGame(g) {
    var n = norm(g.title);
    if (n.indexOf("kingdom hearts hd 1 5 2 5") >= 0 || (n.indexOf("kingdom hearts") >= 0 && n.indexOf("cloud") >= 0)) {
      return { kind: "conditional", label: "Bulut / erişim şartlı", basis: "Switch 1 Cloud Version", note: "Bulut sürümü ve mağaza/ülke erişimi koşullu. Sahiplik, ağ ve güncel servis koşullarını ayrıca kontrol et." };
    }
    if (nativeLegacy[n]) {
      return { kind: "legacy", label: "Eski konsol ailesi", basis: nativeLegacy[n], note: "Bu oyun o konsol ailesi için yayımlandı. Konsol ailesi kuralına göre kapsamda; bu, oyunun bugün NSO kataloğunda bulunduğunu garanti etmez." };
    }
    if (n === "luigis mansion dark moon") {
      return { kind: "review", label: "Başlık düzeltmesi gerekli", basis: "3DS adı", note: "Switch 1 sürümü Luigi’s Mansion 2 HD'dir; Switch 3DS sürümüyle karıştırılmamalı." };
    }
    return { kind: "native", label: "Switch 1 sürümü / koleksiyon", basis: "Nintendo Switch", note: "Roadmap'de Switch 1 oynanabilir sürümü/koleksiyonu esas alındı. Çoklu sürüm veya bölgesel mağaza farkları olabilir." };
  }
  function platformClassForCandidate(r) {
    var existing = currentMatch(r.title);
    if (existing) return { kind: "eligible", label: "Zaten backlog’da", basis: "Mevcut oyun", note: "Bu başlık ana listede mevcut.", existing: existing };
    var p = String(r.platform || "").toLowerCase();
    if (/switch 1 yerel katalogunda kapsam sorunu|switch 2 sürümü switch 1 sayılmaz/.test(p)) {
      return { kind: "not", label: "Switch 1 uygunluğu doğrulanmadı", basis: "Switch 2 / bölgesel erişim istisnası", note: r.platform };
    }
    if (/switch 1/.test(p) && /(yerel|koleksiyon|ayrı dijital)/.test(p)) {
      return { kind: "eligible", label: "Switch 1 uygun", basis: "Yerel sürüm / koleksiyon", note: r.platform };
    }
    if (/nintendo switch online/.test(p) && /(game boy|nes|snes|super nintendo|nintendo 64|gba|mega drive|genesis|virtual boy|emülasyon|classics)/.test(p)) {
      return { kind: "eligible", label: "Konsol ailesi uygun", basis: r.platform, note: "Konsol ailesi kriteriyle kapsamda. Belirli oyunun NSO kataloğunda olduğu iddiası değildir." };
    }
    if (/switch 2/.test(p) && !/switch 1/.test(p)) {
      return { kind: "not", label: "Switch 2 kapsam dışı", basis: "Yalnız Switch 2 / uyumsuz", note: r.platform };
    }
    if (/bulut|cloud|bölge|bolge|erişimini|erisimi|satış durduruldu|satis durduruldu|kontrol et|teyit|doğrula|dogrula|mağaza|magaza|ana platform/.test(p)) {
      return { kind: "conditional", label: "Erişim doğrula", basis: r.platform, note: "Bölge, mağaza, bulut sürümü veya sahiplik koşulunu doğrulamadan ana backlog'a eklemiyorum." };
    }
    var legacy = nativeLegacy[norm(r.title)];
    if (legacy) return { kind: "eligible", label: "Konsol ailesi uygun", basis: legacy, note: "Konsol ailesi kriteriyle kapsamda; oyunun NSO kataloğunda bulunduğu garanti edilmez." };
    return { kind: "review", label: "Platformu doğrulanmalı", basis: r.platform || "Kesin eşleşme yok", note: "Güvenilir Switch 1 sürümü veya kabul edilen eski konsol ailesi netleşmeden otomatik eklenmez." };
  }
  function allowedToAdd(info) { return info.kind === "eligible" && !info.existing; }
  function guessPhase(title, group, relation) {
    var t = norm([title, group, relation].join(" "));
    if (/hades|roguelike|deckbuilder|vampire survivors|risk of rain|slay the spire|balatro|brotato|dead cells|cult of the lamb|powerwash|cozy|sandbox repeatable/.test(t)) return 4;
    if (/pokemon|super mario|mario|zelda|metroid|kirby|pikmin|star fox|splatoon|fire emblem|donkey kong|yoshi|wario|retro|rhythm heaven/.test(t)) return 2;
    if (/final fantasy|xenoblade|persona|shin megami|dragon quest|octopath|triangle strategy|bravely default|live a live|witcher|baldur|divinity|rpg|tactics|disco elysium|kingdom come|dragon dogma/.test(t)) return 3;
    if (/open world|open-world|evergreen|minecraft|terraria|stardew|animal crossing|no man s sky|skyrim|long term/.test(t)) return 5;
    if (/story|narrative|puzzle|ghost trick|another code|ace attorney|adventure/.test(t)) return 0;
    return 1;
  }
  function addGame(title, group, source, notes) {
    var existing = currentMatch(title);
    if (existing) {
      notify("Bu oyun zaten listede: " + existing.title);
      setView("library");
      if (typeof openGame === "function") {
        el("library").scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    var order = games.reduce(function (m, g) { return Math.max(m, +g.order || 0); }, 0) + 1;
    var idx = guessPhase(title, group, source);
    games.push({
      order: order, phase: PHASES[idx], group: group || "Franchise denetiminden eklenen",
      title: title, status: "Not started", rating: 0,
      notes: notes || ("Excel denetiminden eklendi. Platform kaynağı: " + (source || "manuel ekleme")),
      updatedAt: Date.now(), origin: "audit"
    });
    if (typeof persist === "function") persist();
    if (typeof updateStats === "function") updateStats();
    if (typeof render === "function") render();
    renderPlatform();
    renderAudit();
    renderExcluded();
    notify("Backlog'a eklendi: " + title);
    setView("library");
    el("library").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function renderSeries() {
    if (!excelData) return;
    var q = norm(el("seriesSearch").value);
    var phase = el("seriesPhase").value;
    var rows = excelData.seriesNotes.filter(function (r) {
      return (!phase || r.phase === phase) && (!q || norm([r.phase,r.group,r.sequence,r.note,r.count].join(" ")).includes(q));
    });
    el("seriesCount").textContent = rows.length + " / " + excelData.seriesNotes.length + " seri/evren notu";
    el("seriesCards").innerHTML = rows.map(function (r) {
      return '<article class="dataCard"><span class="pill tagLegacy">' + html(r.phase || "Seri notu") + '</span><h3>' + html(r.group) + '</h3>' +
        '<p><b>Önerilen sıra</b><br>' + html(r.sequence || "Belirtilmemiş") + '</p>' +
        '<p><b>Not / karar</b><br>' + html(r.note || "—") + '</p>' +
        '<div class="meta">Listedeki başlık sayısı: ' + html(r.count == null ? "—" : r.count) + '</div></article>';
    }).join("") || '<div class="dataCard">Bu aramayla eşleşen seri notu bulunamadı.</div>';
  }
  function excludedPhase(r) {
    var parts = String(r.group || "").split(" · ");
    return parts.length > 1 ? parts[0] : (r.group || "Diğer");
  }
  function candidateForTitle(title) {
    return excelData && excelData.audit.find(function (r) { return norm(r.title) === norm(title); });
  }
  function excludedEligibility(r) {
    var existing = currentMatch(r.title);
    if (existing) return { kind:"eligible", label:"Zaten backlog’da", basis:"Mevcut oyun", note:"Bu başlık ana listede mevcut.", existing:existing };
    var audit = candidateForTitle(r.title);
    if (audit) return platformClassForCandidate(audit);
    var legacy = nativeLegacy[norm(r.title)];
    if (legacy) return { kind:"eligible", label:"Konsol ailesi uygun", basis:legacy, note:"Konsol ailesi kriteriyle kapsamda; tam NSO kataloğu eşleşmesi ayrıca teyit edilmelidir." };
    var n = norm(r.title);
    var knownSwitch = /mario rabbids|kingdom eighties|monster hunter stories|digimon story cyber sleuth|south park snow day|yoshis crafted world|wario ware|lego|cadence of hyrule|hyrule warriors age of calamity|thronebreaker|ghost trick|dragon ball z kakarot|astral chain|wonderful 101|dragon quest xi|octopath traveler|triangle strategy|bravely default ii|live a live|paper mario|super mario rpg|mario luigi brothership|pikmin|kirby star allies|xenoblade chronicles|final fantasy pixel remaster|devil may cry|cadence of hyrule/.test(n);
    if (knownSwitch) return {kind:"eligible",label:"Switch 1 sürümü",basis:"Switch 1 / koleksiyon",note:"Switch 1 sürümü için güçlü eşleşme; istenirse ana listeye eklenebilir."};
    if (/cloud|bulut|switch 2|3ds|wii u only|only on/.test(n)) return {kind:"conditional",label:"Erişim doğrula",basis:"Platform koşulu",note:"Platform veya sürüm koşulunu kontrol etmeden eklenmez."};
    return {kind:"review",label:"Erişim doğrula",basis:"Otomatik doğrulama yok",note:"Dışarıda bırakılmış olmasının nedeni ve Switch 1/NSO konsol ailesi uygunluğu ayrıca gözden geçirilmeli."};
  }
  function renderExcluded() {
    if (!excelData) return;
    var q=norm(el("excludedSearch").value), phase=el("excludedFilter").value;
    var rows=excelData.excluded.filter(function(r){return (!phase||excludedPhase(r)===phase)&&(!q||norm([r.title,r.reason,r.group].join(" ")).includes(q));});
    el("excludedCount").textContent=rows.length+" / "+excelData.excluded.length+" hariç tutulan oyun";
    el("excludedCards").innerHTML=rows.map(function(r){
      var info=excludedEligibility(r), exists=currentMatch(r.title), btn=allowedToAdd(info)
        ? '<button class="btn primary" data-add-excluded="'+html(r.title)+'">İsteğe bağlı ekle +</button>'
        : (info.existing ? '<button class="btn" data-show-existing="'+html(info.existing.order)+'">Listede aç ↗</button>' : '');
      return '<article class="dataCard"><span class="pill '+(info.kind==="eligible"?"tagNative":info.kind==="conditional"?"tagConditional":info.kind==="not"?"tagNo":"tagLegacy")+'">'+html(info.label)+'</span><h3>'+html(r.title)+'</h3><div class="meta">'+html(r.group||"")+'</div><p>'+html(r.reason)+'</p><div class="meta">Platform kontrolü: '+html(info.basis||"")+'<br>'+html(info.note||"")+'</div><div class="actionLine">'+btn+'</div></article>';
    }).join("") || '<div class="dataCard">Bu aramayla eşleşen kayıt yok.</div>';
  }
  function renderAudit() {
    if (!excelData) return;
    var q=norm(el("auditSearch").value), priority=el("auditPriority").value, relation=el("auditRelation").value, eligibility=el("auditEligibility").value;
    var rows=excelData.audit.filter(function(r){
      var info=platformClassForCandidate(r);
      var statusGroup=info.kind==="eligible"?"eligible":(info.kind==="conditional"?"conditional":"not");
      return (!priority||r.priority===priority)&&(!relation||r.relation===relation)&&(!eligibility||statusGroup===eligibility)&&(!q||norm([r.title,r.franchise,r.relation,r.reason,r.platform,r.order,r.existing].join(" ")).includes(q));
    });
    el("auditCount").textContent=rows.length+" / "+excelData.audit.length+" franchise denetim kaydı · uygun olanlar otomatik eklenebilir";
    el("auditCards").innerHTML=rows.map(function(r){
      var info=platformClassForCandidate(r);
      var pillClass=info.kind==="eligible"?"tagNative":info.kind==="conditional"?"tagConditional":info.kind==="not"?"tagNo":"tagLegacy";
      var btn=allowedToAdd(info)?'<button class="btn primary" data-add-audit="'+html(r.title)+'">Backlog’a ekle +</button>':(info.existing?'<button class="btn" data-show-existing="'+html(info.existing.order)+'">Mevcut kaydı aç ↗</button>':'');
      var source=r.source&&/^https?:\/\//i.test(r.source)?'<a href="'+html(r.source)+'" target="_blank" rel="noreferrer">Kaynağı aç ↗</a>':'';
      return '<article class="dataCard"><span class="pill '+pillClass+'">'+html(r.priority||"Öneri")+'</span><span class="pill">'+html(info.label)+'</span><h3>'+html(r.title)+'</h3>'+
        '<div class="meta"><b>Franchise / evren:</b> '+html(r.franchise)+'<br><b>Bağlantı:</b> '+html(r.relation)+'<br><b>Excel’deki durum:</b> '+html(r.existing)+'<br><b>Güven:</b> '+html(r.confidence||"—")+'</div>'+
        '<p>'+html(r.reason)+'</p><p><b>Önerilen kullanım / sıra:</b> '+html(r.order||"—")+'</p>'+
        '<div class="ruleBox" style="margin:9px 0 0"><b>Platform</b><br>'+html(r.platform||"Belirtilmemiş")+'<br><span>'+html(info.note||"")+'</span></div>'+
        '<div class="actionLine">'+btn+source+'</div></article>';
    }).join("") || '<div class="dataCard">Bu filtrelerle eşleşen öneri yok.</div>';
  }
  function renderSummary() {
    if (!excelData) return;
    var fixed=[
      {key:"Ana backlog",value:"199 oyun",detail:"Excel’in Roadmap sayfasındaki mevcut sıra ve altı aşama korunur. Durum, puan ve kişisel notlar sitede yönetilir."},
      {key:"Hariç tutulanlar",value:"44 oyun",detail:"Excluded sayfasındaki oyunlar ve gerekçeleri ayrı görünümde yer alır; ana listeyi kendiliğinden şişirmez."},
      {key:"Nasıl kullanılır?",value:"Aşama içinde ruh hâline göre seç",detail:"Roadmap boyunca ilerle; ama o anki enerjine göre aynı aşama içinde oyun değiştirebilirsin."},
      {key:"Tamamlama ölçütü",value:"Ana hikâye / jenerik",detail:"%100 bitirme şart değil. Jeneriğe veya ana kampanya sonuna ulaşmak yeterli kabul edilir."},
      {key:"Tekrar oynanabilir oyunlar",value:"Küçük ve ölçülebilir hedef",detail:"Bir run, final boss, seçilmiş bir başarı veya tek bir clear gibi durma ölçütü belirle."},
      {key:"Açık uçlu oyunlar",value:"Bir hedef, az sayıda aktif oyun",detail:"Stardew Valley veya Minecraft benzeri oyunları bilinçli olarak geç aşamada tut; aynı anda çok fazla açık uçlu oyun başlatma."},
      {key:"Katalog farkı",value:"Konsol ailesi ≠ NSO kataloğu",detail:"Eski konsol ailesi kriteri uygunsa belirli oyunun NSO kütüphanesinde olduğu sonucu çıkarılmaz."},
      {key:"Cihazlar arası yedek",value:"JSON içe / dışa aktar",detail:"İlerleme bu tarayıcıda saklanır. Başka cihazda aynı kayıtları görmek için JSON yedeğini dışa aktar ve içe al."}
    ];
    el("summaryCards").innerHTML=fixed.map(function(r){return '<article class="summaryItem"><div class="label">'+html(r.key)+'</div><div class="value">'+html(r.value)+'</div><p>'+html(r.detail)+'</p></article>';}).join("")+
      excelData.summary.map(function(r){return '<article class="summaryItem"><div class="label">'+html(r.key)+'</div><div class="value">'+html(r.value)+'</div></article>';}).join("");
  }
  function renderPlatform() {
    var rows=games.map(function(g){
      var info=platformClassForGame(g);
      return {game:g,info:info};
    });
    var n=el("platformSearch")?norm(el("platformSearch").value):"";
    var filter=el("platformFilter")?el("platformFilter").value:"";
    var visible=rows.filter(function(r){
      var search=norm([r.game.title,r.game.group,r.info.basis,r.info.label,r.info.note].join(" ")).includes(n);
      var bucket=r.info.kind==="conditional"?"conditional":r.info.kind==="legacy"?"legacy":r.info.kind==="review"?"review":"native";
      return search&&(!filter||bucket===filter);
    });
    var counts=rows.reduce(function(a,r){a[r.info.kind]=(a[r.info.kind]||0)+1;return a;},{});
    if(el("platformStats")) el("platformStats").innerHTML=
      '<div class="platformStat"><strong>'+html(counts.native||0)+'</strong><span>Switch 1 sürümü / koleksiyonu</span></div>'+
      '<div class="platformStat"><strong>'+html(counts.legacy||0)+'</strong><span>Eski konsol ailesi kriteri</span></div>'+
      '<div class="platformStat"><strong>'+html(counts.conditional||0)+'</strong><span>Bulut / erişim şartlı</span></div>';
    if(el("platformCount")) el("platformCount").textContent=visible.length+" / "+rows.length+" backlog oyunu · Luigi’s Mansion kaydı Switch 1’deki Luigi’s Mansion 2 HD olarak düzeltildi.";
    if(el("platformCards")) el("platformCards").innerHTML=visible.map(function(r){
      var i=r.info, pill=i.kind==="native"?"tagNative":i.kind==="legacy"?"tagLegacy":i.kind==="conditional"?"tagConditional":"tagNo";
      var completion = r.game.phase===PHASES[4]?"Bir clear/final boss/seçilmiş başarı gibi bir durma hedefi belirle.":r.game.phase===PHASES[5]?"Açıkça bir hedef belirle; aynı anda çok sayıda uzun oyun aktif tutma.":"Ana kampanya/jenerik yeterli; %100 şart değil.";
      return '<article class="dataCard"><span class="pill '+pill+'">'+html(i.label)+'</span><h3>#'+html(r.game.order)+' · '+html(r.game.title)+'</h3><div class="meta">'+html(r.game.phase)+' · '+html(r.game.group)+'</div><p><b>Uygunluk dayanağı:</b> '+html(i.basis)+'</p><p>'+html(i.note)+'</p><div class="meta"><b>Excel tamamlama kuralı:</b> '+html(completion)+'</div></article>';
    }).join("")||'<div class="dataCard">Bu filtreyle eşleşen oyun yok.</div>';
  }
  function initViews() {
    var seriesPhases=Array.from(new Set(excelData.seriesNotes.map(function(r){return r.phase;}).filter(Boolean)));
    el("seriesPhase").innerHTML='<option value="">Tüm aşamalar</option>'+seriesPhases.map(function(p){return '<option value="'+html(p)+'">'+html(p)+'</option>';}).join("");
    var exPhases=Array.from(new Set(excelData.excluded.map(excludedPhase)));
    el("excludedFilter").innerHTML='<option value="">Tüm gerekçeler / aşamalar</option>'+exPhases.map(function(p){return '<option value="'+html(p)+'">'+html(p)+'</option>';}).join("");
    var priorities=Array.from(new Set(excelData.audit.map(function(r){return r.priority;}).filter(Boolean)));
    el("auditPriority").innerHTML='<option value="">Tüm öncelikler</option>'+priorities.map(function(p){return '<option value="'+html(p)+'">'+html(p)+'</option>';}).join("");
    var relations=Array.from(new Set(excelData.audit.map(function(r){return r.relation;}).filter(Boolean)));
    el("auditRelation").innerHTML='<option value="">Tüm bağlantı türleri</option>'+relations.map(function(p){return '<option value="'+html(p)+'">'+html(p)+'</option>';}).join("");
    ["seriesSearch","seriesPhase"].forEach(function(id){el(id).addEventListener("input",renderSeries);el(id).addEventListener("change",renderSeries);});
    ["excludedSearch","excludedFilter"].forEach(function(id){el(id).addEventListener("input",renderExcluded);el(id).addEventListener("change",renderExcluded);});
    ["auditSearch","auditPriority","auditRelation","auditEligibility"].forEach(function(id){el(id).addEventListener("input",renderAudit);el(id).addEventListener("change",renderAudit);});
    ["platformSearch","platformFilter"].forEach(function(id){el(id).addEventListener("input",renderPlatform);el(id).addEventListener("change",renderPlatform);});
    renderSeries();renderExcluded();renderAudit();renderPlatform();renderSummary();
  }
  async function loadExcelData() {
    var pieces = await Promise.all([1,2,3,4,5,6].map(function(i){
      return fetch("excel-data-"+i+".txt",{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("Excel verisi "+i+" yüklenemedi");return r.text();});
    }));
    var b64=pieces.join("").replace(/\s+/g,"");
    var binary=atob(b64);
    var bytes=new Uint8Array(binary.length);
    for(var i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
    if(typeof DecompressionStream==="undefined") throw new Error("Bu tarayıcı Excel ayrıntılarını açmak için güncel değil. Lütfen Safari/Chrome’u güncelle.");
    var stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    excelData=JSON.parse(await new Response(stream).text());
    if(!excelData.seriesNotes||!excelData.excluded||!excelData.audit||!excelData.summary) throw new Error("Excel verisi eksik");
    initViews();
  }
  function setupInstall() {
    var btn=el("installBtn"),help=el("installHelp");
    function openHelp() {
      if(standalone) { notify("Savepoint zaten uygulama görünümünde açık."); return; }
      var isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
      if(isiOS) {
        el("installMessage").textContent="iPhone/iPad’de yükleme menüsü otomatik açılmaz. Safari’nin Paylaş menüsünü kullan.";
        el("installSteps").innerHTML="<li>Bu sayfayı Safari’de aç (uygulama içi tarayıcı değil).</li><li>Alt kısımdaki Paylaş simgesine dokun.</li><li>Menüde “Ana Ekrana Ekle”yi seç; istersen “Web Uygulaması Olarak Aç” seçeneğini etkinleştir.</li><li>Sağ üstteki “Ekle”ye dokun.</li>";
      } else {
        el("installMessage").textContent="Tarayıcının yükleme penceresi açılmadıysa menüden uygulama yükleme seçeneğini kullan.";
        el("installSteps").innerHTML="<li>Chrome/Edge’de sağ üst menüyü aç.</li><li>“Uygulamayı yükle” veya “Ana ekrana ekle”yi seç.</li><li>Onayla. Simge ana ekranda/uygulama çekmecesinde görünür.</li>";
      }
      help.classList.add("open");
    }
    window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferredInstall=e;btn.textContent=window.matchMedia("(max-width:700px)").matches?"＋ Yükle":"＋ Uygulamayı yükle";});
    window.addEventListener("appinstalled",function(){standalone=true;deferredInstall=null;btn.textContent="✓ Yüklendi";notify("Savepoint ana ekrana eklendi.");});
    btn.addEventListener("click",async function(){
      if(deferredInstall){
        deferredInstall.prompt();
        try { var choice=await deferredInstall.userChoice; if(choice&&choice.outcome==="accepted")notify("Yükleme başlatıldı."); } catch(_){}
        deferredInstall=null;
      } else openHelp();
    });
    el("installClose").addEventListener("click",function(){help.classList.remove("open");});
    help.addEventListener("click",function(e){if(e.target===help)help.classList.remove("open");});
    el("installPromptBtn").addEventListener("click",async function(){if(deferredInstall){deferredInstall.prompt();deferredInstall=null;}});
    if(standalone)btn.textContent="✓ Yüklü"; else if(window.matchMedia("(max-width:700px)").matches)btn.textContent="＋ Yükle";
  }
  function setupNavigation() {
    el("appNav").addEventListener("click",function(e){var b=e.target.closest("[data-app-view]");if(!b)return;setView(b.getAttribute("data-app-view"));});
    document.addEventListener("click",function(e){
      var add=e.target.closest("[data-add-audit]");
      if(add&&excelData){var r=excelData.audit.find(function(x){return norm(x.title)===norm(add.getAttribute("data-add-audit"));});if(!r)return;var info=platformClassForCandidate(r);if(allowedToAdd(info))addGame(r.title,r.franchise,r.platform,r.reason);else notify(info.label);return;}
      var ex=e.target.closest("[data-add-excluded]");
      if(ex&&excelData){var title=ex.getAttribute("data-add-excluded"),r=excelData.excluded.find(function(x){return x.title===title;});if(!r)return;var info=excludedEligibility(r);if(info.kind==="eligible"&&!info.existing)addGame(r.title,r.group,info.basis,r.reason);else notify(info.label);return;}
      var show=e.target.closest("[data-show-existing]");
      if(show){setView("library");var order=show.getAttribute("data-show-existing");var g=games.find(function(x){return String(x.order)===String(order);});if(g&&typeof openGame==="function")openGame(g.order);}
    });
  }
  function setupPersistenceRule() {
    var oldOpen=openGame;
    if(typeof oldOpen==="function"){
      openGame=function(n){
        oldOpen(n);
        var g=games.find(function(x){return +x.order===+n;});
        var rule=el("mRule");
        if(g&&rule){
          var p=PHASES.indexOf(g.phase);
          var t=p===4?"Bir bitiş hedefi seç: tek bir clear, final boss veya seçilmiş bir başarı.":p===5?"Açık uçlu oyunlar için durma hedefi belirle; aynı anda çok sayıda uzun oyun aktif tutma.":"Ana kampanya/jenerik yeterli; %100 tamamlama şart değil.";
          rule.innerHTML="<b>EXCEL TAMAMLAMA KURALI</b><br>"+html(t);
        }
      };
    }
  }

  var activeSourceOrder=null;var hltbPending=new Map();var externalInFlight={hltb:new Set(),bip:new Set()};
  function gameHLTBUrl(title){return "https://howlongtobeat.com/?q="+encodeURIComponent(title)}
  function gameBIPUrl(title){return "https://beforeiplay.com/index.php?search="+encodeURIComponent(title)}
  function safeExternalUrl(raw,fallback){try{var u=new URL(raw);return(u.protocol==="https:"||u.protocol==="http:")?u.href:fallback}catch(_){return fallback}}
  function renderHLTB(g,message){var box=el("hltbStatus");if(!box)return;var h=g&&g.hltb;if(h&&h.times){var t=h.times;box.innerHTML='<div class="meta" style="margin-bottom:6px">Eşleşen kayıt: <b>'+html(h.title||g.title)+'</b>'+(h.updatedAt?'<br>Son sorgu: '+html(new Date(h.updatedAt).toLocaleDateString("tr-TR")):'')+'</div>'+'<div class="hltbMetrics"><div class="hltbMetric"><span>Ana hikâye</span><b>'+html(formatHLTBTime(t.main))+'</b></div><div class="hltbMetric"><span>Ana + ek içerik</span><b>'+html(formatHLTBTime(t.mainExtra))+'</b></div><div class="hltbMetric"><span>Tamamlama</span><b>'+html(formatHLTBTime(t.completionist))+'</b></div></div><div class="meta">Saatler HowLongToBeat topluluk verisinden gelir; farklı sürüm/oynama tarzı süreyi değiştirebilir.</div>';return}var candidates=hltbPending.get(g?+g.order:-1)||[];var choices=candidates.map(function(x,i){var t=x.times||{};return'<button class="hltbChoice" data-hltb-choice="'+i+'"><b>'+html(x.title)+'</b><br>Ana: '+html(formatHLTBTime(t.main))+' · Ek içerik: '+html(formatHLTBTime(t.mainExtra))+' · Tamamlama: '+html(formatHLTBTime(t.completionist))+'<br><span class="meta">Bu eşleşmeyi seç</span></button>'}).join("");box.innerHTML=html(message||"Henüz süre verisi yüklenmedi.")+choices}
  function normalizeHLTBRecord(row){var t=row.times||row.completionTimes||{};return{id:row.id||row.gameId||row.game_id||null,title:row.title||row.name||row.game_name||row.gameName||"Başlık bulunamadı",imageUrl:safeExternalUrl(row.imageUrl||row.image_url||row.image||"",""),times:{main:t.main!=null?t.main:(row.gameplayMain!=null?row.gameplayMain:row.comp_main!=null?Number(row.comp_main)/3600:null),mainExtra:t.mainExtra!=null?t.mainExtra:(t.extended!=null?t.extended:row.gameplayMainExtra!=null?row.gameplayMainExtra:row.gameplayExtended!=null?row.gameplayExtended:row.comp_plus!=null?Number(row.comp_plus)/3600:null),completionist:t.completionist!=null?t.completionist:(row.gameplayCompletionist!=null?row.gameplayCompletionist:row.comp_100!=null?Number(row.comp_100)/3600:null),allStyles:t.allStyles!=null?t.allStyles:(row.allStyles!=null?row.allStyles:null)},platforms:Array.isArray(row.platforms)?row.platforms:[],description:row.description||""}}
  function hltbSimilarity(a,b){a=norm(a);b=norm(b);if(a===b)return 100;if(a.startsWith(b)||b.startsWith(a))return 80;var aa=new Set(a.split(" ").filter(function(x){return x.length>1})),bb=new Set(b.split(" ").filter(function(x){return x.length>1})),hit=0;aa.forEach(function(w){if(bb.has(w))hit++});return aa.size?Math.round(hit/aa.size*60):0}
  async function getHLTB(g){if(!g)return;activeSourceOrder=g.order;var btn=el("loadHltb"),box=el("hltbStatus");el("hltbDirect").href=gameHLTBUrl(g.title);if(externalInFlight.hltb.has(+g.order))return;externalInFlight.hltb.add(+g.order);if(btn){btn.disabled=true;btn.textContent="Süre aranıyor…"}if(box)box.textContent="HowLongToBeat veri kaynağında oyun aranıyor…";try{var controller=new AbortController(),timer=setTimeout(function(){controller.abort()},12000);var response=await fetch("https://hltb-proxy.fly.dev/v1/query?title="+encodeURIComponent(g.title),{method:"GET",headers:{Accept:"application/json"},signal:controller.signal,cache:"no-store"});clearTimeout(timer);if(!response.ok)throw new Error("Kaynak "+response.status+" yanıtı verdi");var data=await response.json(),rows=(Array.isArray(data)?data:(data.results||data.data||data.games||[])).map(normalizeHLTBRecord).filter(function(x){return x.title&&x.title!=="Başlık bulunamadı"&&(x.times.main!=null||x.times.mainExtra!=null||x.times.completionist!=null)});rows.sort(function(a,b){return hltbSimilarity(b.title,g.title)-hltbSimilarity(a.title,g.title)});if(!rows.length)throw new Error("Süre kaydı bulunamadı");var exact=rows.find(function(x){return norm(x.title)===norm(g.title)});if(exact){g.hltb={id:exact.id,title:exact.title,imageUrl:exact.imageUrl,times:exact.times,platforms:exact.platforms,description:exact.description,updatedAt:Date.now(),provider:"HowLongToBeat"};hltbPending.delete(+g.order);persist();render(false);renderHLTB(g);notify("HowLongToBeat süreleri kaydedildi")}else{hltbPending.set(+g.order,rows.slice(0,5));renderHLTB(g,"Tam başlık eşleşmesi bulunamadı. Doğru sürümü seç; yanlış oyunun süresini otomatik kaydetmedim.")}}catch(err){renderHLTB(g,"Otomatik süre sorgusu şu an kullanılamadı. Bağlantıdan oyunu HowLongToBeat’te arayabilirsin.")}finally{externalInFlight.hltb.delete(+g.order);if(btn){btn.disabled=false;btn.textContent=g.hltb?"Süreleri yenile":"Yeniden dene"}}}
  function cleanWikiSnippet(source){try{var doc=new DOMParser().parseFromString("<div>"+String(source||"")+"</div>","text/html"),text=doc.body.textContent||"";return text.replace(/\s+/g," ").trim().split(" ").slice(0,25).join(" ")}catch(_){return""}}
  function renderBIP(g,message){var box=el("bipStatus");if(!box)return;var bip=g&&g.beforeIPlay;if(!bip||!Array.isArray(bip.matches)||!bip.matches.length){box.textContent=message||"Before I Play’de kısa ipuçları ara.";return}box.innerHTML=bip.matches.map(function(m){return'<div class="bipResult"><b>'+html(m.title)+'</b>'+(m.snippet?'<div class="bipExcerpt">'+html(m.snippet)+'</div>':'<div class="meta">Önizleme yok; yazıya git.</div>')+'<a href="'+html(safeExternalUrl(m.url,gameBIPUrl(g.title)))+'" target="_blank" rel="noreferrer">Kaynağı aç ↗</a></div>'}).join("")+'<div class="meta">Önizleme kısa bir alıntıdır; ayrıntılar ve olası spoilerler için yazının tamamını aç.</div>'}
  async function getBIP(g,force){if(!g)return;activeSourceOrder=g.order;var btn=el("loadBip");el("bipDirect").href=gameBIPUrl(g.title);if(!force&&g.beforeIPlay&&Array.isArray(g.beforeIPlay.matches)&&g.beforeIPlay.matches.length&&Date.now()-(g.beforeIPlay.updatedAt||0)<7*24*60*60*1000){renderBIP(g);return}if(externalInFlight.bip.has(+g.order))return;externalInFlight.bip.add(+g.order);if(btn){btn.disabled=true;btn.textContent="İpuçları aranıyor…"}el("bipStatus").textContent="Before I Play wiki’sinde bu oyun için kısa notlar aranıyor…";try{var url="https://beforeiplay.com/api.php?action=query&list=search&srsearch="+encodeURIComponent(g.title)+"&srlimit=5&srprop=snippet&format=json&origin=*";var controller=new AbortController(),timer=setTimeout(function(){controller.abort()},10000);var response=await fetch(url,{headers:{Accept:"application/json"},signal:controller.signal,cache:"no-store"});clearTimeout(timer);if(!response.ok)throw new Error("Wiki API yanıt vermedi");var data=await response.json(),rows=((data.query&&data.query.search)||[]).map(function(r){var title=String(r.title||"");return{title:title,url:"https://beforeiplay.com/index.php?title="+encodeURIComponent(title.replace(/ /g,"_")),snippet:cleanWikiSnippet(r.snippet),score:hltbSimilarity(title,g.title)}}).filter(function(r){return r.title}).sort(function(a,b){return b.score-a.score});if(!rows.length){g.beforeIPlay={matches:[],updatedAt:Date.now()};renderBIP(g,"Bu başlık için doğrudan wiki eşleşmesi bulunamadı. Arama bağlantısından başlığı kontrol edebilirsin.")}else{var exact=rows.find(function(r){return norm(r.title)===norm(g.title)}),matches=exact?[exact]:rows.slice(0,3);g.beforeIPlay={matches:matches.map(function(r){return{title:r.title,url:r.url,snippet:r.snippet}}),updatedAt:Date.now()};persist();renderBIP(g,exact?"":"Tam eşleşme bulunamadı; ilişkili sayfalardan doğru olanı seç.")}}catch(err){renderBIP(g,"Wiki önizlemesi bu tarayıcıdan yüklenemedi. Alttaki bağlantıdan Before I Play aramasını doğrudan açabilirsin.")}finally{externalInFlight.bip.delete(+g.order);if(btn){btn.disabled=false;btn.textContent="Notları yenile"}}}
  function setupGameSources(){var baseOpen=window.openGame;if(typeof baseOpen==="function"){window.openGame=function(order){baseOpen(order);var g=games.find(function(x){return +x.order===+order});if(!g)return;activeSourceOrder=+g.order;el("hltbDirect").href=gameHLTBUrl(g.title);el("bipDirect").href=gameBIPUrl(g.title);renderHLTB(g);renderBIP(g);el("loadHltb").textContent=g.hltb?"Süreleri yenile":"Süreleri getir";el("loadBip").textContent=g.beforeIPlay&&g.beforeIPlay.matches&&g.beforeIPlay.matches.length?"Notları yenile":"Notları getir"}}el("loadHltb").addEventListener("click",function(){var g=games.find(function(x){return +x.order===+activeSourceOrder});if(g)getHLTB(g)});el("loadBip").addEventListener("click",function(){var g=games.find(function(x){return +x.order===+activeSourceOrder});if(g)getBIP(g,true)});el("hltbStatus").addEventListener("click",function(e){var b=e.target.closest("[data-hltb-choice]");if(!b)return;var g=games.find(function(x){return +x.order===+activeSourceOrder}),choices=g&&hltbPending.get(+g.order);if(!g||!choices)return;var item=choices[+b.dataset.hltbChoice];if(!item)return;g.hltb={id:item.id,title:item.title,imageUrl:item.imageUrl,times:item.times,platforms:item.platforms,description:item.description,updatedAt:Date.now(),provider:"HowLongToBeat"};hltbPending.delete(+g.order);persist();render(false);renderHLTB(g);notify("Seçilen HowLongToBeat kaydı eklendi")})}

  setupNavigation();setupInstall();setupPersistenceRule();setupGameSources();
  if("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load",function(){navigator.serviceWorker.register("./sw.js").catch(function(){/* app still works online */});});
  }
  loadExcelData().catch(function(err){
    ["seriesCards","excludedCards","auditCards","summaryCards"].forEach(function(id){if(el(id))el(id).innerHTML='<div class="dataCard"><b>Excel bölümü açılamadı.</b><p>'+html(err&&err.message||"Veri yükleme hatası")+'</p><button class="btn" onclick="location.reload()">Yeniden dene ↻</button></div>';});
    if(el("platformCards"))renderPlatform();
  });
})();