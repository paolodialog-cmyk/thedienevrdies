/* The Die Never Dies — demo app (hash routing, plain #name) */
(function () {
  const D = window.TDND, POSTS = D.posts, VIDS = D.videos, THUMBS = new Set(D.ytThumbs);
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmt = d => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const k = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'K' : String(n);
  const thumb = id => THUMBS.has(id) ? `img/yt-${id}.jpg` : '';
  const bySlug = s => POSTS.find(p => p.slug === s);
  const VBYID = Object.fromEntries(VIDS.map(v => [v.id, v]));
  const IMG = {
    logo: 'img/2024-12-dadoda20gialloLOGO512x512_round.png',
    board: 'img/2025-02-Witcher-Cover-scaled.jpg',
    mini: 'img/2025-08-Screamer-Killer-Carnifex-Cover.jpg',
    rpg: 'img/2025-11-Fighter-Challenge-II-top.jpg',
    players: 'img/2025-11-568020208_122120837636993697_7415984420111636853_n-1024x769.jpg',
    room: 'img/2025-11-569382663_122120837318993697_5838863308937413785_n-1024x768.jpg',
    door: 'img/2025-11-IMG_4290-768x1024.jpg',
    projector: 'img/2026-06-Screenshot-2026-06-07-150511.jpg',
  };
  const CLUB = ['565814808_122120837210993697_5275591060756772568_n-576x1024', '566256955_122120837708993697_8917906895948661301_n-768x1024', '567501549_122120837720993697_431248494782322468_n-768x1024', '568020208_122120837636993697_7415984420111636853_n-1024x769', '568240027_122120837714993697_6469940940739442681_n-1024x768', '568619877_122120837312993697_8836523901605892928_n-1024x768', '569059194_122120837846993697_836958159235214819_n-768x1024', '569382663_122120837318993697_5838863308937413785_n-1024x768', '569847046_122120837324993697_2399393022670415849_n-1024x768', 'IMG_4290-768x1024', 'IMG_4291-768x1024', 'IMG_4294-768x1024'].map(n => 'img/2025-11-' + n + '.jpg');
  const CAT_GEM = { 'Board Games': '♟', 'Miniature Games': '⚔', 'Miniature Painting': '✎', 'Role Play Games': '✦', 'RPG Module': '☗', 'News': '!', '1-Minute Unboxing': '1' };
  const GAMES = ['The Witcher: Old World', 'Zombicide', 'Warhammer 40K', 'Kill Team', 'D&D 5e', 'Descent', 'BattleTech', 'A Song of Ice and Fire', "Zargo's Lords", 'Triumph & Tragedy', 'Tiny Epic Dungeons', 'Molly House', 'HeroQuest', 'Blood Bowl'];
  const SOCIAL = [
    ['YouTube', '1.01K subscribers', '169 videos', 'https://www.youtube.com/@TheDieNeverDies', '#E62117', '▶'],
    ['Facebook', '518 followers', 'Club news & photos', 'https://www.facebook.com/TheDieNeverDies/', '#1877F2', 'f'],
    ['Instagram', '782 posts', '149 followers', 'https://www.instagram.com/thedieneverdies/', '#C13584', '◎'],
    ['TikTok', '@theddieneverdies', 'Shorts & unboxings', 'https://www.tiktok.com/@theddieneverdies', '#111111', '♪'],
    ['X', '@TheDieNeverDies', 'Updates', 'https://x.com/TheDieNeverDies', '#000000', 'X'],
    ['Bluesky', '@glux71', 'Updates', 'https://bsky.app/profile/glux71.bsky.social', '#1185FE', '☁'],
    ['Patreon', 'Glux777', 'Support the channel', 'https://www.patreon.com/c/Glux777', '#FF424D', 'P'],
  ];
  const canEmbed = /^https?:$/.test(location.protocol) && !/claude|anthropic|usercontent/i.test(location.hostname);

  /* ---------- components ---------- */
  function tcg(p, extra = '') {
    const gem = CAT_GEM[p.cat] || '✦';
    const vid = p.yt ? '<span class="play" aria-hidden="true"></span>' : '';
    return `<a class="tcg ${extra}" data-c="${esc(p.cat)}" href="#post-${p.slug}">
      <div class="tt"><h3>${esc(p.title)}</h3><span class="gem">${gem}</span></div>
      <div class="art">${p.cover ? `<img src="${p.cover}" alt="" loading="lazy">` : ''}${vid}</div>
      <div class="type"><span>${esc(p.cat)}</span><span>${p.yt ? 'Video' : 'Read'}</span></div>
      <div class="text"><p>${esc(p.ex)}</p></div>
      <div class="foot"><span>${fmt(p.date)}</span><b>by GLux</b></div>
      <span class="holo"></span></a>`;
  }
  function vcard(v) {
    return `<div class="vcard" data-v="${v.id}" tabindex="0" role="button" aria-label="Play ${esc(v.t)}">
      <div class="th"><img src="${thumb(v.id)}" alt="" loading="lazy"><span class="play"></span><span class="dur">${v.dur}</span>${v.lang !== 'EN' ? `<span class="lng">${v.lang}</span>` : ''}</div>
      <div class="tx"><h4>${esc(v.t)}</h4><div class="meta">${k(v.v)} views · ${v.age}</div></div></div>`;
  }
  const marquee = (list, rev) => { const row = list.map(g => `<span>${esc(g)}</span><i>✦</i>`).join(''); return `<div class="marquee ${rev ? 'rev' : ''}" aria-hidden="true"><div>${row}${row}</div></div>`; };
  const head = (eb, h, lead) => `<div class="eyebrow">${eb}</div><h2>${h}</h2>${lead ? `<p class="lead" style="margin-top:18px">${lead}</p>` : ''}`;
  const phero = (eb, h, lead, ghost) => `<section class="phero"><div class="wrap"><div class="eyebrow">${eb}</div><h1>${h}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div>${ghost ? `<div class="ghost">${ghost}</div>` : ''}</section>`;
  const count = c => POSTS.filter(p => p.cat === c || p.cats.includes(c)).length;

  /* ---------- views ---------- */
  const V = {};
  V.home = () => {
    const top = [...VIDS].sort((a, b) => b.v - a.v).slice(0, 5);
    const feat = VBYID['3l8PYb1LLaQ'];
    return `
<section class="hero"><div class="wrap"><div class="grid">
  <div class="rv">
    <div class="eyebrow">Gaming club · Blog · YouTube — Bangkok</div>
    <h1><span class="l">Roll the</span><span class="l o">dice</span><span class="l f">once again.</span></h1>
    <p class="sub">Board games, miniature wargames and role-playing nights in the heart of Silom. Unboxings, crash courses and painting sessions for everyone who never stopped loving the hobby.</p>
    <div class="btns"><a class="btn fire" href="#book">Book a table</a><a class="btn" href="#videos">Watch the videos</a></div>
  </div>
  <div class="stage rv" id="stage">
    <div class="fallback"></div><div class="table"></div>
    <span class="corner tl">d20 · drag or tap</span><span class="corner tr">The die never dies</span>
    <div class="boom" id="boom"></div>
    <div class="rollbar"><div class="res" id="res">Tempt fate<small>Tap the die to roll</small></div><button class="btn fire small" id="rollbtn">Roll d20</button></div>
  </div>
</div>
<div class="hero-stats rv"><div><b>${POSTS.length}</b><span>Chronicles</span></div><div><b>169</b><span>YouTube videos</span></div><div><b>1K+</b><span>Subscribers</span></div><div><b>3</b><span>Rooms in Silom</span></div></div>
</div></section>
${marquee(GAMES)}
<section><div class="wrap">
  ${head('Choose your class', 'Three ways to <em>play</em>', 'Every post on the blog belongs to one of these paths. Pick yours.')}
  <div class="classes">
    <a class="klass rv" href="#chronicles" data-cat="Board Games"><div class="art"><img src="${IMG.board}" alt=""><span class="lvl">Class I</span></div><div class="body"><h3>Board gamer</h3><p>Unboxings, crash courses and FAQs: The Witcher Old World, Zombicide, Descent, Triumph &amp; Tragedy, Zargo's Lords.</p><div class="stats"><span>${count('Board Games')} chronicles</span><span>How to play</span></div><span class="go">Enter →</span></div></a>
    <a class="klass rv" href="#paint-desk"><div class="art"><img src="${IMG.mini}" alt=""><span class="lvl">Class II</span></div><div class="body"><h3>Painter &amp; general</h3><p>Retro Tyranids, Rackham ghosts, speed painting, Kill Team terrain and A Song of Ice and Fire armies.</p><div class="stats"><span>${count('Miniature Painting')} painting logs</span><span>${count('Miniature Games')} wargames</span></div><span class="go">Enter →</span></div></a>
    <a class="klass rv" href="#quests"><div class="art"><img src="${IMG.rpg}" alt=""><span class="lvl">Class III</span></div><div class="body"><h3>Adventurer</h3><p>Ready-to-play D&amp;D modules, house rules for 5e and long reads on old-school versus modern play.</p><div class="stats"><span>${count('RPG Module')} quests</span><span>${count('Role Play Games')} essays</span></div><span class="go">Enter →</span></div></a>
  </div>
</div></section>
<section class="brick" style="background:#2a120d url(${IMG.room}) center/cover"><div class="wrap tavern">
  <div class="rv">
    <div class="eyebrow" style="color:#FFC933">The tavern is open</div>
    <h2 style="color:#F6EEDC">A table is <em>waiting</em></h2>
    <p class="lead" style="margin-top:18px">A small, cozy gaming club in Thanon Pan, a short walk from Saint Louis and Surasak BTS. Bring your party, or find one.</p>
    <div class="rules">
      <div class="rule"><b>I</b><div><h4>No table fees</h4><p>The club is self-funded through voluntary donations. You pay what you feel is right.</p></div></div>
      <div class="rule"><b>II</b><div><h4>Two tables, three rooms</h4><p>One table for RPG sessions and Warhammer battles, one for board games of all kinds.</p></div></div>
      <div class="rule"><b>III</b><div><h4>11:00 AM – 11:00 PM</h4><p>Plenty of time for your next dungeon crawl or strategic showdown.</p></div></div>
    </div>
    <div class="btns" style="display:flex;gap:14px;flex-wrap:wrap"><a class="btn fire" href="#book">Book a table</a><a class="btn" href="#club">Visit the club</a></div>
  </div>
  <div class="polaroids rv">
    <figure class="pola"><span class="pin"></span><img class="zoom" src="${IMG.players}" alt="Players at the RPG table"><figcaption>Session night</figcaption></figure>
    <figure class="pola"><span class="pin"></span><img class="zoom land" src="${IMG.projector}" alt="Battle map projected on the table"><figcaption>Projector maps!</figcaption></figure>
    <figure class="pola"><span class="pin"></span><img class="zoom" src="${IMG.door}" alt="The club room"><figcaption>Room 103</figcaption></figure>
  </div>
</div></section>
<section><div class="wrap">
  ${head('Now showing', 'Fresh from the <em>channel</em>')}
  <div class="feature">
    <div class="vbig rv" data-v="${feat.id}"><img src="${thumb(feat.id)}" alt=""><span class="play"></span><div class="cap"><span class="badge">New · ${feat.dur}</span><h3>${esc(feat.t)}</h3></div></div>
    <div class="toplist rv"><h3>Most watched <small>ALL TIME</small></h3>${top.map((v, i) => `<div class="topitem" data-v="${v.id}"><b>${i + 1}</b><img src="${thumb(v.id)}" alt=""><span>${esc(v.t)}<em>${k(v.v)} views · ${v.dur}</em></span></div>`).join('')}</div>
  </div>
  <div style="margin-top:30px"><a class="btn" href="#videos">All ${VIDS.length} videos →</a></div>
</div></section>
${marquee(['Unboxing', 'Crash course', 'How to play', 'Speed painting', 'Homebrew rules', 'One-shots', 'Campaigns', 'FAQ', '1-Minute unboxing'], true)}
<section><div class="wrap">
  ${head('Draw a card', 'The latest <em>chronicles</em>', 'Every post is a card. Hover to see it shine, click to read it in full.')}
  <div class="hand">${POSTS.slice(0, 3).map(p => tcg(p)).join('')}</div>
  <div style="text-align:center"><a class="btn" href="#chronicles">Open the whole deck · ${POSTS.length} cards</a></div>
</div></section>
<section style="padding-top:0"><div class="wrap">
  ${head('Join the party', 'Follow, watch, <em>roll</em>')}
  <div class="tokens">${SOCIAL.slice(0, 4).map(tok).join('')}</div>
  <div style="margin-top:28px"><a class="btn" href="#party">All channels &amp; Patreon →</a></div>
</div></section>`;
  };
  function tok(s) { return `<a class="token rv" href="${s[3]}" target="_blank" rel="noopener"><span class="disc" style="background:${s[4]}">${s[5]}</span><b>${s[0]}</b><em>${s[1]}</em><span>${s[2]}</span></a>`; }

  V.club = () => `
<section class="phero img"><img class="bgimg" src="${IMG.players}" alt=""><div class="wrap"><div class="eyebrow" style="color:#FFC933">Silom · Sathorn · Bangkok</div><h1>The <em>Club</em></h1><p class="lead">A place where people who love RPGs, board games and miniature games come together, play and share great moments. Three rooms, intentionally small and cozy.</p><div style="margin-top:24px"><a class="btn fire" href="#book">Book a table</a></div></div></section>
<section><div class="wrap">
  ${head('House rules', 'How the club <em>works</em>')}
  <div class="howto">
    <div class="rv"><b>01</b><h4>Pay what you feel is right</h4><p>No charge for table time: the club is self-funded through voluntary donations.</p></div>
    <div class="rv"><b>02</b><h4>RPG &amp; Warhammer table</h4><p>One table is dedicated primarily to role-playing sessions and Warhammer battles.</p></div>
    <div class="rv"><b>03</b><h4>Board games table</h4><p>The other table is for board games of all kinds.</p></div>
    <div class="rv"><b>04</b><h4>Projector battle maps</h4><p>Dynamic, high-detail environments for D&amp;D: from crashing waves on a beach to the deep shadows of a forest.</p></div>
    <div class="rv"><b>05</b><h4>Props, snacks &amp; drinks</h4><p>Game props, non-alcoholic drinks and snacks available at the club.</p></div>
    <div class="rv"><b>06</b><h4>Open 11:00 – 23:00</h4><p>Perfect for late-night campaigns and weekend board game marathons.</p></div>
  </div>
</div></section>
<section style="padding-top:0"><div class="wrap">
  ${head('Inside', 'The <em>space</em>')}
  <div class="gallery">${CLUB.map((c, i) => `<img class="zoom ${/-(576|768)x1024/.test(c) ? 't' : (i === 3 ? 'w' : '')}" src="${c}" alt="The Die Never Dies club, photo ${i + 1}" loading="lazy">`).join('')}</div>
</div></section>
<section style="padding-top:0"><div class="wrap">
  ${head('Getting there', 'Find the <em>tavern</em>')}
  <div class="where">
    <div class="mapcard rv"><span class="x">X</span><h3>68 S&amp;B Tower, room 103</h3><p>Thanon Pan, Si Lom, Bang Rak, Bangkok</p>
      <div class="kv"><div><b>BTS</b><span>A short walk from Saint Louis and Surasak stations</span></div><div><b>Streets</b><span>Safe, well-lit, wide sidewalks</span></div><div><b>Parking</b><span>Covered parking for cars and motorbikes</span></div><div><b>Hours</b><span>11:00 AM – 11:00 PM</span></div><div><b>Phone</b><span>+66 92 502 7181</span></div><div><b>Email</b><span>gianluca@thedieneverdies.net</span></div></div>
      <a class="btn small fire" href="https://www.google.com/maps/search/?api=1&query=S%26B+Tower+Thanon+Pan+Silom+Bangkok" target="_blank" rel="noopener">Open in Google Maps</a></div>
    <div class="vbig rv" data-v="MSMe2AwYT6Y" style="aspect-ratio:auto;min-height:340px"><img src="${IMG.projector}" alt=""><span class="play"></span><div class="cap"><span class="badge">At the club</span><h3>D&amp;D games just got level up: battle maps on the projector</h3></div></div>
  </div>
</div></section>
<section style="padding-top:0"><div class="wrap">
  ${head('Club chronicles', 'Stories from the <em>table</em>')}
  <div class="cards">${['a-new-adventure-begins-opening-my-gaming-club-in-bangkok', 'dd-games-just-got-level-up', 'the-fighters-challenge'].map(s => tcg(bySlug(s))).join('')}</div>
</div></section>`;

  /* booking */
  V.book = () => `
${phero('Reserve your seat at the table', 'Book a <em>table</em>', 'Four ways to play. Pick a session, a day and your game: Gianluca confirms your table.', 'Book')}
<section style="padding-top:40px"><div class="wrap"><div class="book booking">
  <div class="steps">
    <div class="step"><h3><b>1</b>Choose your session</h3><div class="sessions" id="sess">
      <button class="sess" data-h="2" aria-pressed="true"><b>2H</b><span>Quick game</span></button>
      <button class="sess" data-h="4" aria-pressed="false"><b>4H</b><span>Evening session</span></button>
      <button class="sess" data-h="6" aria-pressed="false"><b>6H</b><span>Long campaign</span></button>
      <button class="sess" data-h="all" aria-pressed="false"><b>ALL DAY</b><span>Marathon 11–23</span></button></div></div>
    <div class="step"><h3><b>2</b>Pick a day</h3><div class="cal" id="cal"></div></div>
    <div class="step"><h3><b>3</b>Start time</h3><div class="slots" id="slots"></div></div>
    <div class="step"><h3><b>4</b>Your party</h3><form class="form" id="bf" onsubmit="return false">
      <label>What will you play?<select id="bg"><option>Board games</option><option>Role-playing (D&amp;D)</option><option>Warhammer / Kill Team</option><option>A Song of Ice and Fire</option><option>Something else</option></select></label>
      <label>Players<input id="bp" type="number" min="1" max="12" value="4"></label>
      <label>Your name<input id="bn" placeholder="Name"></label>
      <label>Email or phone<input id="bc" placeholder="you@example.com"></label>
      <label class="full">Message (optional)<textarea id="bm" rows="3" placeholder="Bringing our own campaign…"></textarea></label></form></div>
  </div>
  <aside class="side"><div class="scroll" id="sum"></div>
    <div class="btns" style="display:grid;gap:12px;margin-top:20px"><button class="btn fire" id="send">Send request</button><button class="btn" id="copy">Copy request</button></div>
    <p class="note">Anteprima: il modulo prepara la richiesta ma non la invia. Nel sito definitivo si collega al calendario prenotazioni (quello attuale o uno nuovo, da concordare).</p></aside>
</div></div></section>`;

  /* videos */
  const SERIES = ['All', ...new Set(VIDS.map(v => v.s))];
  const LANGS = ['All', 'EN', 'IT', 'ES', 'VI', 'ID'];
  V.videos = () => `
${phero('YouTube · @TheDieNeverDies · 1.01K subscribers', 'The screening <em>room</em>', 'Unboxings, crash courses, FAQs and painting sessions, many of them dubbed or subtitled in other languages.', 'Play')}
<section style="padding-top:40px"><div class="wrap">
  <div class="feature" style="margin-top:0">${(() => { const v = VBYID['OmkwvUuUF7o']; return `<div class="vbig" data-v="${v.id}"><img src="${thumb(v.id)}" alt=""><span class="play"></span><div class="cap"><span class="badge">Fan favourite · ${k(v.v)} views</span><h3>${esc(v.t)}</h3></div></div>`; })()}
  <div class="toplist"><h3>Series <small>${VIDS.length} VIDEOS</small></h3>${SERIES.slice(1).map(s => { const l = VIDS.filter(v => v.s === s); return `<div class="topitem" data-series="${esc(s)}"><b>${l.length}</b><img src="${thumb(l[0].id)}" alt=""><span>${esc(s)}<em>${k(l.reduce((a, v) => a + v.v, 0))} views</em></span></div>`; }).join('')}</div></div>
  <div class="filters" id="vf"></div><div class="filters" id="lf" style="margin-top:12px"></div>
  <div class="count" id="vc"></div><div class="vgrid" id="vg"></div>
  <div style="margin-top:34px"><a class="btn fire" href="https://www.youtube.com/@TheDieNeverDies" target="_blank" rel="noopener">Subscribe on YouTube</a></div>
</div></section>`;

  /* chronicles */
  const CATS = ['All', 'Board Games', 'Miniature Games', 'Miniature Painting', 'Role Play Games', 'RPG Module', '1-Minute Unboxing', 'News'];
  V.chronicles = () => `
${phero(`${POSTS.length} cards in the deck`, 'The <em>chronicles</em>', 'Reviews, unboxings, house rules, adventure modules and painting logs. Every post is a card: filter the deck or search it.', 'Deck')}
<section style="padding-top:30px"><div class="wrap"><div class="filters" id="cf"></div><input class="search" id="cs" placeholder="Search the deck…" aria-label="Search"><div class="count" id="cc"></div><div class="cards" id="cg"></div></div></section>`;

  /* post */
  V.post = slug => {
    const p = bySlug(slug); if (!p) return V.home();
    const i = POSTS.indexOf(p), prev = POSTS[i + 1], next = POSTS[i - 1];
    const rel = POSTS.filter(x => x !== p && (x.cat === p.cat)).slice(0, 4);
    return `
<section class="phero img" style="min-height:520px">${p.cover ? `<img class="bgimg" src="${p.cover}" alt="">` : ''}<div class="wrap">${(p.cats.length ? p.cats : [p.cat]).map(c => `<span class="badge">${esc(c)}</span>`).join('')}<h1 style="font-size:clamp(44px,7vw,104px);max-width:16ch">${esc(p.title)}</h1><p class="lead">${fmt(p.date)} · by GLux</p></div></section>
<div class="wrap"><div class="book">
  <div><article class="page" id="page">${p.html || `<p>${esc(p.ex)}</p>`}</article>
    <div class="prevnext">${prev ? `<a href="#post-${prev.slug}"><small>← Older</small>${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#post-${next.slug}"><small>Newer →</small>${esc(next.title)}</a>` : '<span></span>'}</div></div>
  <aside class="side">
    <div class="sidebox"><h4>More ${esc(p.cat)}</h4>${rel.map(r => `<a class="mini" href="#post-${r.slug}">${r.cover ? `<img src="${r.cover}" alt="">` : '<span></span>'}<span>${esc(r.title)}</span></a>`).join('')}</div>
    <div class="sidebox"><h4>Play at the club</h4><p style="font-size:14.5px;color:var(--muted)">Want to try this game? Book a table in Silom.</p><a class="btn fire small" href="#book">Book a table</a></div>
  </aside></div></div>`;
  };

  /* quests */
  const QUESTS = [
    ['save-the-royal-messenger', 'Quest I', 'One-shot D&D 5.5e, beginner friendly: a perfect handshake between DM and new players. Gather information, then launch into combat.', ['≈ 4 hours', 'Starting level 3', 'Beginner friendly'], 'I'],
    ['the-dungeon-protectors', 'Quest II', 'It begins right after the Royal Messenger. Not a dungeon crawler: a troublesome love story ignites the events, and your decisions shape the continent.', ['3–4 sessions', '4h each', 'Homebrew world'], 'II'],
    ['the-snake-and-the-ghosts', 'Quest III', 'A ghost story: succeed without fighting, or face a dragon serpent, two powerful wizards and ghosts. Playable by two groups with two DMs.', ['2–3 sessions', '2 groups · 2 DMs', 'Ghost story'], 'III'],
    ['the-fighters-challenge', 'Campaign', "The classic TSR module Fighter's Challenge II, fully adapted for D&D 5e. Weekly evenings at the club in Bangkok.", ['≈ 10 sessions + 0', '4–6 players', 'Beginners welcome'], 'IV'],
  ];
  V.quests = () => `
${phero('D&D 5e with an old-school soul', 'RPG <em>quests</em>', 'Adventures ready to play at the club, house rules and long reads on the culture of role-playing.', 'Quest')}
<section style="padding-top:40px"><div class="wrap"><div class="quests">${QUESTS.map(q => { const p = bySlug(q[0]); return `<a class="quest rv" href="#post-${p.slug}"><div class="art"><img src="${p.cover}" alt=""></div><div class="tx"><span class="seal">${q[4]}</span><div class="q">${q[1]}</div><h3>${esc(p.title)}</h3><p>${q[2]}</p><div class="meta">${q[3].map(m => `<span>${m}</span>`).join('')}</div></div></a>`; }).join('')}</div></div></section>
<section style="padding-top:20px"><div class="wrap">${head('From behind the DM screen', 'Essays &amp; <em>house rules</em>')}<div class="cards">${POSTS.filter(p => p.cat === 'Role Play Games').map(p => tcg(p)).join('')}</div></div></section>`;

  /* paint desk */
  V['paint-desk'] = () => {
    const ps = POSTS.filter(p => p.cat === 'Miniature Painting' || p.cats.includes('Miniature Painting'));
    const tiles = [];
    ps.forEach(p => { if (p.cover) tiles.push([p.cover, p]); (p.html.match(/<img src="([^"]+)"/g) || []).forEach(m => tiles.push([m.slice(10, -1), p])); });
    const seen = new Set(), uniq = tiles.filter(t => !seen.has(t[0]) && seen.add(t[0]));
    const pv = VIDS.filter(v => /paint|tyranid|carnifex|slapchop|dry brushing|chaos knight|volkus logo|terrain/i.test(v.t) && v.lang === 'EN');
    return `
${phero('Brushes, lead &amp; plastic', 'The paint <em>desk</em>', 'Retro Tyranids from the 90s, Rackham ghosts, speed painting with three colours and Kill Team terrain painted straight on the sprues.', 'Paint')}
<section style="padding-top:40px"><div class="wrap"><div class="masonry">${uniq.map(t => `<a href="#post-${t[1].slug}"><img src="${t[0]}" alt="" loading="lazy"><span>${esc(t[1].title)}</span></a>`).join('')}</div></div></section>
<section style="padding-top:0"><div class="wrap">${head('Watch the brush', 'Painting <em>videos</em>')}<div class="vgrid">${pv.map(vcard).join('')}</div></div></section>`;
  };

  /* the DM */
  V.gianluca = () => `
${phero('Character sheet', 'Meet the <em>DM</em>', "I'm Gianluca and gaming has been my passion since I was 6 years old.", 'GLux')}
<section style="padding-top:20px"><div class="wrap"><div class="sheet rv">
  <div class="left"><div class="portrait"><img src="${IMG.logo}" alt="The Die Never Dies"></div>
    <div class="row"><small>Character name</small><b>Gianluca “GLux”</b></div>
    <div class="row"><small>Class</small><b>Dungeon Master · Painter · YouTuber</b></div>
    <div class="row"><small>Home base</small><b>Bangkok, Thailand</b></div>
    <div class="row"><small>First quest</small><b>Board games, age 6</b></div>
    <div class="row"><small>Rarest item</small><b>Zargo's Lords, first edition — owned since age 10</b></div>
  </div>
  <div class="right">
    <h3>Ability scores</h3>
    <div class="abil"><div><b>${POSTS.length}</b><span>Chronicles</span></div><div><b>169</b><span>Videos</span></div><div><b>100s</b><span>Blood Bowl games</span></div></div>
    <h3>Backstory</h3>
    <div class="levels">
      <div><b>Level 1</b><p>It all started with Milton Bradley board games like Zargo's Lords, Axis &amp; Allies and HeroQuest, which sparked an imagination and a love for strategy.</p></div>
      <div><b>Level 5</b><p>Miniatures and the Games Workshop universe: countless battles in Warhammer, Warhammer 40K and Blood Bowl, hundreds of games, each a test of skill and tactics.</p></div>
      <div><b>Level 10</b><p>Role-playing becomes another pillar: from The Dark Eye with my brothers to D&amp;D, AD&amp;D, GURPS and many other systems.</p></div>
      <div><b>2015</b><p>The move to Thailand. Life took a different turn: selling, packing and giving away much of the collection.</p></div>
      <div><b>2024</b><p>Ready to reignite the passion: the blog and the channel become the space to reconnect with the games I've always loved.</p></div>
      <div><b>2025</b><p>A new adventure begins: the gaming club opens in Thanon Pan, a new home for Bangkok's gaming community.</p></div>
    </div>
    <p class="quote">Let's roll the dice once again: The Die Never Dies!</p>
  </div></div></div></section>`;

  V.party = () => `
${phero('Join the party', 'Find us <em>everywhere</em>', 'New unboxings, tutorials and painting logs land on every channel. Support the project on Patreon.', 'Party')}
<section style="padding-top:40px"><div class="wrap"><div class="tokens">${SOCIAL.map(tok).join('')}</div></div></section>`;

  /* ---------- after-render behaviour ---------- */
  let die = null;
  const LINES = { hi: ['You strike true.', 'The dragon flinches.', 'Critical vibes.', 'The party cheers.'], mid: ['The dungeon holds its breath.', 'Not bad, adventurer.', 'Roll for initiative.', 'The tavern goes quiet.'], lo: ['The goblins laugh.', 'Ouch. Try again.', 'Your torch flickers.'] };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function mountDie() {
    const host = $('#stage'); if (!host) return;
    const res = $('#res'), boom = $('#boom');
    const start = () => {
      die = window.TDNDDie && window.TDNDDie(host, {
        onStart() { res.innerHTML = 'Rolling…<small>May the dice be kind</small>'; },
        onResult(n) {
          const line = n === 20 ? 'The die never dies!' : n === 1 ? 'Critical fail.' : n >= 15 ? pick(LINES.hi) : n >= 8 ? pick(LINES.mid) : pick(LINES.lo);
          res.innerHTML = `You rolled ${n}<small>${line}</small>`;
          if (n === 20 || n === 1) { boom.textContent = n === 20 ? 'NAT 20!' : 'CRIT FAIL!'; boom.classList.remove('go'); void boom.offsetWidth; boom.classList.add('go'); }
        }
      });
      if (!die) { host.classList.add('nogl'); return; }
      $('canvas', host).style.position = 'absolute'; $('canvas', host).style.inset = '0';
      setTimeout(() => die && die.roll(20), 700);
    };
    (document.fonts && document.fonts.load ? document.fonts.load('400 80px Anton').catch(() => 0) : Promise.resolve()).then(start);
    $('#rollbtn').onclick = () => die && die.roll();
  }
  function mountVideos() {
    let s = 'All', l = 'All';
    const draw = () => {
      $('#vf').innerHTML = SERIES.map(x => `<button class="chip" data-s="${esc(x)}" aria-pressed="${x === s}">${esc(x)}</button>`).join('');
      $('#lf').innerHTML = '<span class="count" style="margin:0 6px 0 0">Language</span>' + LANGS.map(x => `<button class="chip" data-l="${x}" aria-pressed="${x === l}">${x}</button>`).join('');
      const list = VIDS.filter(v => (s === 'All' || v.s === s) && (l === 'All' || v.lang === l));
      $('#vc').textContent = `${list.length} videos`;
      $('#vg').innerHTML = list.map(vcard).join('');
    };
    draw();
    $('#vf').onclick = e => { const b = e.target.closest('[data-s]'); if (b) { s = b.dataset.s; draw(); } };
    $('#lf').onclick = e => { const b = e.target.closest('[data-l]'); if (b) { l = b.dataset.l; draw(); } };
    $$('[data-series]').forEach(el => el.onclick = () => { s = el.dataset.series; draw(); $('#vf').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }
  let pendingCat = 'All';
  function mountChronicles() {
    let c = CATS.includes(pendingCat) ? pendingCat : 'All', q = ''; pendingCat = 'All';
    const draw = () => {
      $('#cf').innerHTML = CATS.map(x => `<button class="chip" data-c="${esc(x)}" aria-pressed="${x === c}">${esc(x)}<span class="n">${x === 'All' ? POSTS.length : count(x)}</span></button>`).join('');
      const list = POSTS.filter(p => (c === 'All' || p.cat === c || p.cats.includes(c)) && (!q || (p.title + ' ' + p.ex).toLowerCase().includes(q)));
      $('#cc').textContent = `${list.length} cards`;
      $('#cg').innerHTML = list.length ? list.map(p => tcg(p)).join('') : '<p class="lead">No cards match. Try another word.</p>';
    };
    draw();
    $('#cs').oninput = e => { q = e.target.value.toLowerCase().trim(); draw(); };
    $('#cf').addEventListener('click', e => { const b = e.target.closest('button[data-c]'); if (b) { c = b.dataset.c; draw(); } });
  }
  function mountPost() {
    $$('#page .yt').forEach(el => {
      const id = el.dataset.v, v = VBYID[id];
      if (thumb(id)) el.style.backgroundImage = `url(${thumb(id)})`;
      el.innerHTML = `<span class="play"></span><span>▶ ${v ? esc(v.t) : 'Watch the video'}</span>`;
      el.setAttribute('role', 'button'); el.tabIndex = 0;
    });
    $$('#page img').forEach(i => i.classList.add('zoom'));
    $$('#page a[href^="https://thedieneverdies.net/category"]').forEach(a => { a.href = '#chronicles'; a.removeAttribute('target'); });
  }
  function mountBook() {
    const st = { h: '2', day: null, time: '18:00' };
    const days = []; const t = new Date(); t.setHours(12, 0, 0, 0);
    for (let i = 0; i < 28; i++) { const d = new Date(t); d.setDate(t.getDate() + i); days.push(d); }
    const lead = (days[0].getDay() + 6) % 7;
    $('#cal').innerHTML = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="dh">${d}</div>`).join('') + '<span></span>'.repeat(lead) + days.map((d, i) => `<button data-i="${i}" aria-pressed="${i === 0}">${d.getDate()}<small>${d.toLocaleDateString('en-GB', { month: 'short' })}</small></button>`).join('');
    st.day = days[0];
    const slots = () => {
      const max = st.h === 'all' ? 11 : 23 - Number(st.h);
      const list = st.h === 'all' ? ['11:00'] : Array.from({ length: max - 11 + 1 }, (_, i) => (11 + i) + ':00');
      if (!list.includes(st.time)) st.time = list[list.length > 7 ? 7 : list.length - 1];
      $('#slots').innerHTML = list.map(x => `<button class="chip" data-t="${x}" aria-pressed="${x === st.time}">${x}</button>`).join('');
    };
    const text = () => {
      const end = st.h === 'all' ? '23:00' : (parseInt(st.time) + Number(st.h)) + ':00';
      return { date: st.day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }), when: `${st.time} – ${end}`, sess: st.h === 'all' ? 'All day' : st.h + ' hours', game: $('#bg').value, players: $('#bp').value, name: $('#bn').value || '—', contact: $('#bc').value || '—', msg: $('#bm').value };
    };
    const sum = () => {
      const x = text();
      $('#sum').innerHTML = `<h3>Your quest</h3><div class="kv"><div><b>Session</b><span>${x.sess}</span></div><div><b>Day</b><span>${x.date}</span></div><div><b>Time</b><span>${x.when}</span></div><div><b>Game</b><span>${esc(x.game)}</span></div><div><b>Party</b><span>${esc(x.players)} players</span></div><div><b>Name</b><span>${esc(x.name)}</span></div><div><b>Contact</b><span>${esc(x.contact)}</span></div></div><p style="margin:0;font-size:14px">No table fees: pay what you feel is right.</p>`;
    };
    const plain = () => { const x = text(); return `Table request — The Die Never Dies\nSession: ${x.sess}\nDay: ${x.date}\nTime: ${x.when}\nGame: ${x.game}\nPlayers: ${x.players}\nName: ${x.name}\nContact: ${x.contact}${x.msg ? '\nMessage: ' + x.msg : ''}`; };
    slots(); sum();
    $('#sess').onclick = e => { const b = e.target.closest('.sess'); if (!b) return; $$('.sess').forEach(s => s.setAttribute('aria-pressed', s === b)); st.h = b.dataset.h; slots(); sum(); };
    $('#cal').onclick = e => { const b = e.target.closest('button'); if (!b) return; $$('#cal button').forEach(s => s.setAttribute('aria-pressed', s === b)); st.day = days[b.dataset.i]; sum(); };
    $('#slots').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; st.time = b.dataset.t; slots(); sum(); };
    $('#bf').oninput = sum;
    $('#copy').onclick = async () => { try { await navigator.clipboard.writeText(plain()); $('#copy').textContent = 'Copied ✓'; } catch (e) { $('#copy').textContent = 'Copy not available'; } setTimeout(() => $('#copy').textContent = 'Copy request', 1800); };
    $('#send').onclick = () => { $('#sum').insertAdjacentHTML('beforeend', '<p style="margin:14px 0 0;font-weight:700;color:#A13D00">Demo: in the live site this request reaches the club calendar. For now, write to gianluca@thedieneverdies.net</p>'); $('#send').disabled = true; };
  }

  /* ---------- overlay ---------- */
  const ov = $('#ov'), box = $('#ovbox');
  function openVideo(id) {
    const v = VBYID[id] || { t: 'The Die Never Dies', id };
    const yt = `https://www.youtube.com/watch?v=${id}`;
    box.innerHTML = `<button class="x" aria-label="Close">×</button><div class="frame" style="background-image:url(${thumb(id)})">${canEmbed ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="${esc(v.t)}"></iframe>` : `<a href="${yt}" target="_blank" rel="noopener" style="position:absolute;inset:0" aria-label="Watch on YouTube"><span class="play" style="top:50%"></span></a>`}</div><div class="cap"><h4>${esc(v.t)}</h4><a class="btn fire small" href="${yt}" target="_blank" rel="noopener">Watch on YouTube ↗</a></div>`;
    ov.classList.add('on'); document.body.style.overflow = 'hidden';
  }
  function openImg(src) { box.innerHTML = `<button class="x" aria-label="Close">×</button><img class="big" src="${src}" alt="">`; ov.classList.add('on'); document.body.style.overflow = 'hidden'; }
  function close() { ov.classList.remove('on'); box.innerHTML = ''; document.body.style.overflow = ''; }
  document.addEventListener('click', e => {
    const cat = e.target.closest('[data-cat]'); if (cat) pendingCat = cat.dataset.cat;
    const v = e.target.closest('[data-v]'); if (v && !e.target.closest('a[href^="#"]')) { e.preventDefault(); openVideo(v.dataset.v); return; }
    const z = e.target.closest('img.zoom'); if (z) { openImg(z.src); return; }
    if (e.target === ov || e.target.closest('.x')) close();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-v][tabindex]')) { e.preventDefault(); openVideo(e.target.dataset.v); }
  });

  /* card tilt + holo */
  document.addEventListener('pointermove', e => {
    const c = e.target.closest && e.target.closest('.cards .tcg'); if (!c) return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty('--ry', ((x - .5) * 14).toFixed(1) + 'deg'); c.style.setProperty('--rx', ((.5 - y) * 14).toFixed(1) + 'deg');
    c.style.setProperty('--mx', (x * 100).toFixed(0) + '%'); c.style.setProperty('--my', (y * 100).toFixed(0) + '%');
  });
  document.addEventListener('pointerout', e => { const c = e.target.closest && e.target.closest('.cards .tcg'); if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); } });

  /* palette */
  function setPal(p) { if (p === 'notte') delete document.body.dataset.pal; else document.body.dataset.pal = p; $$('.palsw button').forEach(b => b.setAttribute('aria-pressed', b.dataset.pal === p)); try { localStorage.setItem('tdnd-pal', p); } catch (e) { } }
  $$('.palsw button').forEach(b => b.onclick = () => setPal(b.dataset.pal));
  try { const s = localStorage.getItem('tdnd-pal'); if (s) setPal(s); } catch (e) { }

  /* nav */
  $('#burger').onclick = () => { const n = $('#nav'); n.classList.toggle('open'); $('#burger').setAttribute('aria-expanded', n.classList.contains('open')); };

  /* ---------- router ---------- */
  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .08 });
    $$('.rv').forEach(el => io.observe(el));
  }
  function route() {
    const h = decodeURIComponent((location.hash || '').slice(1));
    let r = 'home', arg = '';
    if (h.startsWith('post-')) { r = 'post'; arg = h.slice(5); } else if (V[h] && h !== 'post') r = h;
    if (die) { die.destroy(); die = null; }
    const app = $('#app'); app.style.animation = 'none'; void app.offsetWidth; app.style.animation = '';
    document.body.dataset.route = r;
    app.innerHTML = r === 'post' ? V.post(arg) : V[r]();
    const navR = r === 'post' ? 'chronicles' : r === 'book' ? '' : r;
    $$('#nav a').forEach(a => a.dataset.r === navR ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    $('#nav').classList.remove('open');
    window.scrollTo(0, 0);
    document.title = (r === 'post' && bySlug(arg) ? bySlug(arg).title + ' — ' : '') + 'The Die Never Dies';
    if (r === 'home') mountDie();
    if (r === 'videos') mountVideos();
    if (r === 'chronicles') mountChronicles();
    if (r === 'post') mountPost();
    if (r === 'book') mountBook();
    reveal();
  }
  window.addEventListener('hashchange', route);
  route();
})();
