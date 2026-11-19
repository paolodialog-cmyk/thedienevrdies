/* The Die Never Dies — 3D d20 with fire (three.js r149) */
(function () {
  const PAL = { die: '#FFD23F', dieDark: '#E9A80F', num: '#0B1026' };

  function faceTexture(n) {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, S);
    grd.addColorStop(0, '#FFE680'); grd.addColorStop(1, '#F6B91C');
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
    // centroid of the triangle (uv .5,.356) -> canvas y = (1-.356)*S
    const cx = S * 0.5, cy = S * (1 - 0.356);
    g.fillStyle = PAL.num; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `900 ${n >= 10 ? 74 : 84}px Anton, Impact, "Arial Black", sans-serif`;
    g.fillText(String(n), cx, cy + 4);
    if (n === 6 || n === 9) { g.fillRect(cx - 16, cy + 42, 32, 6); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function sparkTexture() {
    const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.8)');
    r.addColorStop(.6, 'rgba(255,255,255,.18)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, S, S);
    return new THREE.CanvasTexture(c);
  }

  window.TDNDDie = function (host, opts) {
    opts = opts || {};
    if (!window.THREE) return null;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.45, 7.8); camera.lookAt(0, 0.35, 0);

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(-3, 4, 6); scene.add(key);
    const fireLight = new THREE.PointLight(0xff6a13, 2.2, 9, 1.6); fireLight.position.set(0, -1.4, -0.6); scene.add(fireLight);
    const rim = new THREE.PointLight(0xffc933, 0.9, 10); rim.position.set(2.5, 1.5, -2.5); scene.add(rim);

    // die
    const geo = new THREE.IcosahedronGeometry(1.25, 0);
    const pos = geo.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let f = 0; f < 20; f++) {
      uv.set([0.0, 0.067, 1.0, 0.067, 0.5, 0.933], f * 6);
      geo.addGroup(f * 3, 3, f);
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    // face data
    const faces = [];
    const v = i => new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    for (let f = 0; f < 20; f++) {
      const a = v(f * 3), b = v(f * 3 + 1), c = v(f * 3 + 2);
      const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
      const up = new THREE.Vector3().subVectors(c, a.clone().add(b).multiplyScalar(0.5)).normalize();
      faces.push({ n, up, num: 0 });
    }
    // numbers: opposite faces sum to 21
    let next = 1;
    faces.forEach((F, i) => {
      if (F.num) return;
      const j = faces.findIndex((G, k) => k !== i && !G.num && G.n.dot(F.n) < -0.99);
      F.num = next; if (j >= 0) faces[j].num = 21 - next; next++;
    });
    const mats = faces.map(F => new THREE.MeshStandardMaterial({ map: faceTexture(F.num), roughness: 0.32, metalness: 0.06, flatShading: true }));
    const die = new THREE.Mesh(geo, mats);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x9a5c00, transparent: true, opacity: 0.55 }));
    die.add(edges);
    const rig = new THREE.Group(); rig.add(die); scene.add(rig);

    // glow behind die
    const spark = sparkTexture();
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: spark, color: 0xff7a1a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(6.5, 6.5, 1); glow.position.set(0, 0.5, -2.2); scene.add(glow);

    // procedural flame (shader) behind the die — shaped like the logo's fire
    const flameMat = new THREE.ShaderMaterial({
      uniforms: { t: { value: 0 }, heat: { value: 1 } },
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vUv;uniform float t;uniform float heat;
        float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
        float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
        void main(){
          vec2 uv=vUv; float y=uv.y; float x=uv.x-.5;
          float q=fbm(vec2(x*3.2, y*2.6 - t*1.9));
          float r=fbm(vec2(x*6.0+q, y*4.0 - t*3.1));
          x += (q-.5)*.22*y + (r-.5)*.08;
          // logo-like flame: narrow base, wide belly, tongues peaking above the die
          float top = (.84 + .1*heat) * (.8 + .2*abs(sin(x*7.5+.9)) ) + (r-.5)*.18;
          float yy = clamp(y/top,0.,1.);
          float w = .47*pow(sin(3.1416*min(yy*.8+.2,1.)),.55) * (.85+.3*q);
          float body = smoothstep(w, w*.15, abs(x));
          float vert = smoothstep(1., .62, yy + (q-.5)*.35) * smoothstep(.06,.24,y);
          float i = clamp(body*vert*(.42+r*.7),0.,1.);
          vec3 c = mix(vec3(.55,.05,.0), vec3(1.,.38,.04), smoothstep(.05,.45,i));
          c = mix(c, vec3(1.,.78,.25), smoothstep(.45,.8,i));
          c = mix(c, vec3(1.,.9,.6), smoothstep(.85,1.,i));
          gl_FragColor = vec4(c*i*.95, i*.9);
        }`
    });
    const flame = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.2), flameMat);
    flame.position.set(0, 0.95, -1.4); scene.add(flame);

    // fire particles (behind & around die, rising from below like the logo)
    const N = reduce ? 40 : 140;
    const pGeo = new THREE.BufferGeometry();
    const P = new Float32Array(N * 3), C = new Float32Array(N * 3), Sz = new Float32Array(N);
    const life = new Float32Array(N), age = new Float32Array(N), vel = new Float32Array(N * 3), seed = new Float32Array(N);
    pGeo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(C, 3));
    pGeo.setAttribute('size', new THREE.BufferAttribute(Sz, 1));
    const pMat = new THREE.ShaderMaterial({
      uniforms: { tex: { value: spark }, scale: { value: 300 } },
      vertexShader: 'attribute float size;attribute vec3 color;varying vec3 vC;uniform float scale;void main(){vC=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*scale/-mv.z;gl_Position=projectionMatrix*mv;}',
      fragmentShader: 'uniform sampler2D tex;varying vec3 vC;void main(){vec4 t=texture2D(tex,gl_PointCoord);gl_FragColor=vec4(vC*t.a,t.a*max(vC.r,.0));}',
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
    });
    const fire = new THREE.Points(pGeo, pMat); scene.add(fire);
    let heat = 1, burst = 0;
    const TONGUES = [-1.25, -0.8, -0.38, 0.05, 0.45, 0.85, 1.25];
    const TH = [0.55, 0.85, 1.05, 1.25, 1.15, 0.8, 0.5]; // centre tongues taller, like the logo
    const tongue = new Uint8Array(N);
    function spawn(i, initial) {
      const ti = Math.floor(Math.random() * TONGUES.length); tongue[i] = ti;
      P[i * 3] = TONGUES[ti] + (Math.random() - .5) * 0.42;
      P[i * 3 + 1] = -1.35 + Math.random() * 0.35;
      P[i * 3 + 2] = -0.85 - Math.random() * 0.5;
      vel[i * 3] = 0; vel[i * 3 + 1] = 1.2 + Math.random() * 1.4; vel[i * 3 + 2] = 0;
      life[i] = (1.4 + Math.random() * 1.4) * TH[ti]; age[i] = initial ? Math.random() * life[i] : 0; seed[i] = Math.random() * 100;
    }
    for (let i = 0; i < N; i++) spawn(i, true);
    function sparks(count, gold) {
      for (let k = 0; k < count; k++) {
        const i = Math.floor(Math.random() * N);
        P[i * 3] = (Math.random() - .5) * 1.4; P[i * 3 + 1] = -0.6 + Math.random() * 1.0; P[i * 3 + 2] = 0.3 + Math.random() * 0.6;
        vel[i * 3] = (Math.random() - .5) * 5; vel[i * 3 + 1] = 1.5 + Math.random() * 4.5; vel[i * 3 + 2] = (Math.random() - .2) * 1.5;
        life[i] = 0.7 + Math.random() * 0.9; age[i] = 0; seed[i] = gold ? -2 : -1;
      }
    }
    const col = new THREE.Color();
    function updateFire(dt, t) {
      for (let i = 0; i < N; i++) {
        age[i] += dt;
        if (age[i] >= life[i]) spawn(i, false);
        const k = age[i] / life[i];
        if (seed[i] < 0) { // spark
          P[i * 3] += vel[i * 3] * dt; P[i * 3 + 1] += vel[i * 3 + 1] * dt; P[i * 3 + 2] += vel[i * 3 + 2] * dt;
          vel[i * 3 + 1] -= dt * 2.2; vel[i * 3] *= 1 - dt;
          if (seed[i] === -2) col.setRGB(1, 0.86, 0.38); else col.setRGB(1, 0.55, 0.15);
          col.multiplyScalar((1 - k) * 0.9); Sz[i] = 0.16 + (1 - k) * 0.1;
        } else {
          const ti = tongue[i];
          const lick = Math.sin(t * 5.2 + ti * 1.7) * 0.5 + Math.sin(t * 11.3 + ti) * 0.25;
          const cx = TONGUES[ti] * (1 - k * 0.55) + lick * 0.22 * k;
          P[i * 3] += (cx * 1.1 + Math.sin(seed[i] + t * 2) * 0.5 - P[i * 3]) * Math.min(1, dt * 1.2);
          P[i * 3 + 1] += vel[i * 3 + 1] * dt * (0.8 + heat * 0.35) * (1 + TH[ti] * 0.25);
          if (k < 0.22) col.setRGB(1, 0.86, 0.45);
          else if (k < 0.55) col.setRGB(1, 0.6 - (k - .22) * 0.55, 0.1);
          else col.setRGB(0.95 - (k - .55) * 0.7, 0.3 - (k - .55) * 0.45, 0.04);
          const fade = k < 0.12 ? k / 0.12 : Math.pow(1 - (k - 0.12) / 0.88, 1.3);
          col.setRGB(1, 0.62 - k*0.3, 0.15).multiplyScalar(Math.max(0, fade) * 0.85);
          Sz[i] = 0.09 + (1 - k) * 0.07;
        }
        C[i * 3] = col.r; C[i * 3 + 1] = col.g; C[i * 3 + 2] = col.b;
      }
      pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true; pGeo.attributes.size.needsUpdate = true;
    }

    // ---- rolling ----
    const Z = new THREE.Vector3(0, 0, 1), Y = new THREE.Vector3(0, 1, 0);
    function targetQuat(num) {
      const F = faces.find(f => f.num === num);
      const q1 = new THREE.Quaternion().setFromUnitVectors(F.n, Z);
      const up = F.up.clone().applyQuaternion(q1);
      const ang = Math.atan2(up.x, up.y);
      const q2 = new THREE.Quaternion().setFromAxisAngle(Z, ang);
      // a slight tilt so the die reads as 3D, not a flat badge
      const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.1, 0.16, 0));
      return tilt.multiply(q2.multiply(q1));
    }
    let state = 'idle', t0 = 0, spin = new THREE.Vector3(), result = 20, qFrom = new THREE.Quaternion(), qTo = targetQuat(20);
    die.quaternion.copy(qTo);
    const R = 1.6; // roll duration
    function roll(forced) {
      if (state === 'roll') return;
      result = forced || 1 + Math.floor(Math.random() * 20);
      qTo = targetQuat(result);
      spin.set((Math.random() - .5) * 26, (Math.random() - .5) * 26, (Math.random() - .5) * 18);
      if (spin.length() < 16) spin.setLength(18);
      state = 'roll'; t0 = clock; heat = 2.1; sparks(60, false);
      opts.onStart && opts.onStart();
    }
    const tmpQ = new THREE.Quaternion(), axis = new THREE.Vector3();
    function updateDie(dt) {
      if (state === 'roll') {
        const t = (clock - t0) / R;
        if (t < 0.62) {
          const s = spin.clone().multiplyScalar(dt * (1 - t / 0.75));
          const ang = s.length(); axis.copy(s).normalize();
          tmpQ.setFromAxisAngle(axis, ang); die.quaternion.premultiply(tmpQ);
          qFrom.copy(die.quaternion);
        } else if (t < 1) {
          const k = (t - 0.62) / 0.38, e = 1 - Math.pow(1 - k, 3);
          die.quaternion.slerpQuaternions(qFrom, qTo, e);
        } else {
          die.quaternion.copy(qTo); state = 'idle'; heat = result === 20 ? 2.8 : 1.35;
          if (result === 20) { sparks(220, true); burst = 1; }
          else if (result === 1) heat = 0.45;
          opts.onResult && opts.onResult(result);
        }
        // hop + bounce
        const h = t < 1 ? Math.abs(Math.sin(t * Math.PI * 2.2)) * (1 - t) * 1.2 : 0;
        rig.position.y = h;
        const sq = t < 1 ? 1 + Math.sin(t * Math.PI * 4.4) * 0.05 * (1 - t) : 1;
        rig.scale.set(sq, 2 - sq, sq);
      } else if (state === 'idle') {
        rig.position.y = Math.sin(clock * 1.6) * 0.07;
        rig.rotation.y = Math.sin(clock * 0.6) * 0.12;
        rig.rotation.x = Math.sin(clock * 0.45) * 0.05;
        rig.scale.set(1, 1, 1);
      }
      heat += (1 - heat) * Math.min(1, dt * 0.9);
      burst = Math.max(0, burst - dt * 0.8);
      glow.material.opacity = 0.42 + heat * 0.12 + burst * 0.5 + Math.sin(clock * 9) * 0.03;
      glow.scale.setScalar(6 + heat * 0.6 + burst * 3);
      flameMat.uniforms.t.value = clock; flameMat.uniforms.heat.value = heat + burst * 1.5;
      fireLight.intensity = 1.6 + heat * 0.9 + Math.sin(clock * 13) * 0.25 + Math.sin(clock * 7.1) * 0.2 + burst * 3;
    }

    // drag to spin, release to roll
    let drag = null;
    const el = renderer.domElement; el.style.touchAction = 'none'; el.style.cursor = 'grab';
    el.addEventListener('pointerdown', e => { if (state === 'roll') return; drag = { x: e.clientX, y: e.clientY, d: 0, t: performance.now() }; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; state = 'drag'; });
    el.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.d += Math.abs(dx) + Math.abs(dy);
      tmpQ.setFromEuler(new THREE.Euler(dy * 0.012, dx * 0.012, 0)); die.quaternion.premultiply(tmpQ);
    });
    const up = e => { if (!drag) return; el.style.cursor = 'grab'; drag = null; state = 'idle'; roll(); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

    // render loop (paused off-screen)
    let clock = 0, last = performance.now(), running = true, visible = true, raf;
    function size() {
      const w = host.clientWidth, h = host.clientHeight || w;
      renderer.setSize(w, h, false); el.style.width = '100%'; el.style.height = '100%';
      camera.aspect = w / h; camera.updateProjectionMatrix();
      pMat.uniforms.scale.value = h * 0.62;
    }
    size();
    const ro = new ResizeObserver(size); ro.observe(host);
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.01 }); io.observe(host);
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!visible || !running) return;
      clock += dt;
      updateDie(dt); updateFire(dt, clock);
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);
    return {
      roll,
      destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); el.remove(); }
    };
  };
})();
