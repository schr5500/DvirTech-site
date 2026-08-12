/* <pc-stage> — במה תלת-ממדית חיה לבונה המחשבים.
   מקבלת config (JSON) של הרכיבים שנבחרו ומרכיבה מחשב אמיתי בזמן אמת:
   מארז + לוח אם + מעבד + קירור + זיכרון + כרטיס מסך + אחסון + ספק + מאווררים.
   דורש importmap ל-three (ראה helmet של ה-DC).                              */
(() => {
  const EASE = t => 1 - Math.pow(1 - t, 3);

  class Stage {
    constructor(host){
      this.host = host;
      this._cfg = {};
      this._prev = {};
      this._anims = [];
      this._cfgStr = "{}";
      this._mode = "3d";
      this._ready = false;
    }

    start(){
      if (this._booted) return;
      this._booted = true;
      window.__pcStage = this;
      if (!this._capable()){ this._fallback("no-webgl"); return; }
      this._boot().catch(e => { console.warn("pc-stage", e); this._fallback("boot-error"); });
    }

    /* בדיקת יכולת: בלי WebGL, בדרייבר תוכנה או במכשיר חלש — עוברים לתמונה */
    _capable(){
      try {
        const cv = document.createElement("canvas");
        const gl = cv.getContext("webgl2") || cv.getContext("webgl");
        if (!gl) return false;
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "") : "";
        if (/swiftshader|llvmpipe|software|basic render/i.test(name)) return false;
        if ((navigator.deviceMemory || 4) <= 1) return false;
        if ((navigator.hardwareConcurrency || 4) <= 2) return false;
        return true;
      } catch(e){ return false; }
    }

    /* תמונת רנדר סטטית — נראית זהה לבמה החיה, בלי WebGL */
    _fallback(reason){
      if (this._fellBack) return;
      this._fellBack = true;
      try { this.dispose(); } catch(e){}
      if (this._canvas) this._canvas.remove();
      const img = document.createElement("img");
      img.src = this._fallbackSrc || "builder-assets/assets/stage-fallback.jpg";
      img.alt = "המחשב שנבחר";
      img.style.cssText = "display:block;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .5s";
      this.host.appendChild(img);
      requestAnimationFrame(() => { img.style.opacity = "1"; });
      this._fallbackImg = img;
      if (window.__pcStage === this) window.__pcStage = null;   // לא להשאיר הפניה למופע מנותק
      if (window.console) console.info("pc-stage: static fallback (" + reason + ")");
    }

    setBg(color){
      this._bg = color || "";
      if (this._scene){
        if (this._bg) this._scene.background = new this.THREE.Color(this._bg);
        else this._scene.background = null;
      }
    }

    setFallback(src){ if (src) this._fallbackSrc = src; }

    setConfig(config, mode){
      if (this._fellBack) return;
      if (config != null) this._cfgStr = config;
      this._mode = mode || "3d";
      this._cfg = this._parse();
      if (this._ready) this._build();
    }

    dispose(){
      if (this._renderer){ this._renderer.setAnimationLoop(null); this._renderer.dispose(); }
      if (this._ro) this._ro.disconnect();
      if (this._io) this._io.disconnect();
    }

    _parse(){
      try { return JSON.parse(this._cfgStr || "{}"); }
      catch(e){ return {}; }
    }

    async _boot(){
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
      let Reflector = null;
      try { Reflector = (await import("three/addons/objects/Reflector.js")).Reflector; } catch(e){}
      this.Reflector = Reflector;
      const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
      this.THREE = THREE;

      const canvas = document.createElement("canvas");
      canvas.style.cssText = "display:block;width:100%;height:100%;outline:none";
      this.host.appendChild(canvas);
      this._canvas = canvas;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, preserveDrawingBuffer:true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.34;
      this._renderer = renderer;

      const scene = new THREE.Scene();
      this._scene = scene;
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
      camera.position.set(6.4, 3.4, 8.2);
      this._camera = camera;

      const key = new THREE.DirectionalLight(0xfff4e8, 4.2); key.position.set(7, 9, 5);
      key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 1; key.shadow.camera.far = 40;
      key.shadow.camera.left = -8; key.shadow.camera.right = 8;
      key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
      key.shadow.bias = -0.0008;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x9fc0e0, .6); fill.position.set(-6, 3, 5); scene.add(fill);
      const rim = new THREE.DirectionalLight(0xbcd9f2, .9); rim.position.set(-5, 5, -7); scene.add(rim);
      const rim2 = new THREE.DirectionalLight(0x4f9dff, 1.5); rim2.position.set(6, 2, -6); scene.add(rim2);
      const backGlow = new THREE.PointLight(0x2f7fe0, 5.6, 16); backGlow.position.set(-2, 2.4, -5.5); scene.add(backGlow);   // הילה כחולה מאחורי המארז
      const inner = new THREE.DirectionalLight(0xeaf4ff, .85); inner.position.set(9, 3, 2); scene.add(inner);   // אור שנכנס דרך הזכוכית ומאיר את הפנים
      const front = new THREE.DirectionalLight(0xffffff, .55); front.position.set(4, 1.2, 8); scene.add(front);
      scene.add(new THREE.HemisphereLight(0xa8c4e0, 0x05090f, .26));

      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true; controls.dampingFactor = .08;
      controls.enablePan = false;
      controls.minDistance = 4.5; controls.maxDistance = 18;
      controls.minPolarAngle = .35; controls.maxPolarAngle = Math.PI/2 - .04;
      controls.autoRotate = false;
      controls.addEventListener("start", () => { this._idle = false; });
      this._idle = true;
      this._controls = controls;

      this._mats(THREE);
      this._podium();

      this._rig = new THREE.Group(); scene.add(this._rig);
      this._cfg = this._parse();
      if (this._bg) scene.background = new THREE.Color(this._bg);
      this._ready = true;
      this._build();

      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this.host);
      this._resize();

      canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); this._fallback("context-lost"); });
      const clock = new THREE.Clock();
      let frames = 0, t0 = performance.now(), lowStreak = 0;
      /* מודדים ביצועים רק כשהבמה באמת על המסך — אחרת הדפדפן מחניק rAF ונקבל "FPS נמוך" מזויף */
      this._onScreen = true;
      if (window.IntersectionObserver){
        this._onScreen = false;
        this._io = new IntersectionObserver(es => {
          this._onScreen = es.some(e => e.isIntersecting);
          if (!this._onScreen){ frames = 0; t0 = performance.now(); }
        }, { threshold: .25 });
        this._io.observe(this.host);
      }
      renderer.setAnimationLoop(() => {
        const dt = clock.getDelta(), t = clock.elapsedTime;
        if (!this._perfChecked){
          if (document.hidden || !this._onScreen || t < 1.5){       // ברקע / מחוץ למסך / חימום ראשוני
            frames = 0; t0 = performance.now();
          } else {
            frames++;
            const ms = performance.now() - t0;
            if (ms > 3000){
              const fps = frames / (ms / 1000);
              frames = 0; t0 = performance.now();
              lowStreak = fps < 16 ? lowStreak + 1 : 0;
              if (lowStreak >= 2){ this._perfChecked = true; this._fallback("low-fps"); return; }
              if (fps >= 16) this._perfChecked = true;
            }
          }
        }
        try {
          this._spin(dt);
          this._tick(t);
          this._sway(t);
        } catch(e){ if(!window.__stageErr) window.__stageErr = String(e && e.stack || e); }
        controls.update();
        renderer.render(scene, camera);
      });
    }

    /* תנועה עדינה: המצלמה מתנדנדת סביב זווית 3/4 שמראה את פאנל הזכוכית */
    /* מסגור: התאמה איטרטיבית לפי הטלת התיבה האמיתית לפריים, בשתי קצות
       תנודת המצלמה — נקרא גם מ-_build וגם בכל שינוי גודל של החלון */
    _fit(){
      /* כיתוב שיושב בתוך קבוצה משוקפת נקרא הפוך — מיישרים לפי סימן המטריצה */
      if (this._rig){
        this._rig.updateWorldMatrix(true, true);
        this._rig.traverse(o => {
          if (!o.userData || !o.userData.autoFlip || o.userData.flipped) return;
          if (o.matrixWorld.determinant() < 0){ o.scale.x = -1; o.updateMatrixWorld(true); }
          o.userData.flipped = true;
        });
      }
      if (!this._rig || !this._camera) return;
      const THREE = this.THREE, inside = !!this._insideMode;
      const bb = new THREE.Box3().setFromObject(this._rig);
      if (bb.isEmpty()) return;
      bb.expandByPoint(new THREE.Vector3(-1.9, -.22, -1.9));   // בסיס הפודיום
      bb.expandByPoint(new THREE.Vector3(1.9, 0, 1.9));
      const corners = [];
      for (const x of [bb.min.x, bb.max.x])
        for (const y of [bb.min.y, bb.max.y])
          for (const z of [bb.min.z, bb.max.z]) corners.push(new THREE.Vector3(x, y, z));
      const target = new THREE.Vector3(0, bb.getCenter(new THREE.Vector3()).y, 0);
      const vFov = this._camera.fov * Math.PI / 180;
      const el = .28, azs = inside ? [.92] : [.66, .92, 1.18];
      let R = Math.max(bb.getSize(new THREE.Vector3()).y, 4) * 2.2;
      const fill = inside ? 1.5 : .97;   // ~3% אוויר סביב   // ~6% אוויר סביב גם בקצות התנודה
      for (let pass = 0; pass < 7; pass++){
        let xm = 0, ymin = 9, ymax = -9;
        for (const az of azs){
          this._camera.position.set(
            target.x + Math.sin(az) * Math.cos(el) * R,
            target.y + Math.sin(el) * R,
            target.z + Math.cos(az) * Math.cos(el) * R
          );
          this._camera.lookAt(target);
          this._camera.updateMatrixWorld();
          this._camera.updateProjectionMatrix();
          for (const p of corners){
            const v = p.clone().project(this._camera);
            xm = Math.max(xm, Math.abs(v.x));
            ymin = Math.min(ymin, v.y); ymax = Math.max(ymax, v.y);
          }
        }
        const yMid = (ymin + ymax) / 2;
        target.y += yMid * Math.tan(vFov / 2) * R;
        const extent = Math.max(xm, Math.abs(ymin - yMid), Math.abs(ymax - yMid));
        R *= extent / fill;
        if (Math.abs(extent / fill - 1) < .01 && Math.abs(yMid) < .01) break;
      }
      this._targetPos = target.clone();
      this._radiusTo = R;
      if (this._radius == null){ this._radius = R; this._controls.target.copy(target); }
      this._controls.minDistance = inside ? 2.2 : 4.2;
    }

    _sway(t){
      if (!this._radius) return;
      if (this._radiusTo != null && Math.abs(this._radiusTo - this._radius) > .01)
        this._radius += (this._radiusTo - this._radius) * .07;   // זום רך בין המצבים
      if (this._targetPos){
        const tg = this._controls.target;
        tg.y += (this._targetPos.y - tg.y) * .07;
      }
      if (!this._idle) return;
      const az = .92 + Math.sin(t * .2) * .26, el = .28;
      const r = this._radius, tg = this._controls.target;
      this._camera.position.set(
        tg.x + Math.sin(az) * Math.cos(el) * r,
        tg.y + Math.sin(el) * r,
        tg.z + Math.cos(az) * Math.cos(el) * r
      );
    }

    _resize(){
      const w = this.host.clientWidth || 520, h = this.host.clientHeight || 520;
      this._renderer.setSize(w, h, false);
      this._camera.aspect = w / h;
      this._camera.updateProjectionMatrix();
      if (this._ready && !this._fitQueued){
        this._fitQueued = true;
        requestAnimationFrame(() => { this._fitQueued = false; this._fit(); });
      }
    }

    /* ---------- חומרים ---------- */
    _mats(THREE){
      const m = (o) => new THREE.MeshStandardMaterial(o);
      const p = (o) => new THREE.MeshPhysicalMaterial(o);
      this.M = {
        steel:   p({ color:0x222932, metalness:.72, roughness:.44, clearcoat:.3, clearcoatRoughness:.32 }),
        steelDk: p({ color:0x11151c, metalness:.6,  roughness:.5, clearcoat:.22, clearcoatRoughness:.4 }),
        alu:     p({ color:0x59626e, metalness:.82, roughness:.3, clearcoat:.2, clearcoatRoughness:.25 }),
        plastic: p({ color:0x14181e, metalness:.16, roughness:.62, clearcoat:.18, clearcoatRoughness:.45 }),
        rubber:  m({ color:0x0a0e13, metalness:.05, roughness:.9 }),
        white:   m({ color:0xa8b4c0, metalness:.1,  roughness:.55 }),
        pcb:     m({ color:0x0f2337, metalness:.35, roughness:.5 }),
        pcbGrn:  m({ color:0x0b2419, metalness:.25, roughness:.66 }),
        copper:  m({ color:0xb87333, metalness:1,   roughness:.3 }),
        gold:    m({ color:0xb9975b, metalness:1,   roughness:.34 }),
        glass:   new THREE.MeshPhysicalMaterial({ color:0x71889c, metalness:0, roughness:.02,
                   transmission:.86, thickness:.55, transparent:true, opacity:.18, ior:1.52,
                   clearcoat:1, clearcoatRoughness:.03,
                   attenuationColor:0x16222f, attenuationDistance:1.3 }),
        podium:  m({ color:0x050a12, metalness:.45, roughness:.34 }),
        floorIn: m({ color:0x04060a, metalness:0, roughness:1 }),   // רצפת המארז: מאט שחור, לא מחזיר את התאורה הממלאת
        blade:   p({ color:0x232a34, metalness:.1, roughness:.66, clearcoat:.08, clearcoatRoughness:.5 })
      };
      Object.values(this.M).forEach(x => { x.envMapIntensity = .3; x.side = this.THREE.DoubleSide; });
      this.M.glass.side = this.THREE.FrontSide;
      this.M.alu.envMapIntensity = .55;
      this.M.steel.envMapIntensity = .5;
      this.M.steelDk.envMapIntensity = .38;
      this.M.podium.envMapIntensity = .12;
      this.M.floorIn.envMapIntensity = 0;
      this.M.glass.envMapIntensity = 1.4;
      this._glow = (c, i) => m({ color:0x0a0f16, emissive:c, emissiveIntensity:(i || 1.35) * 1.5, roughness:.45 });
    }

    /* כיתוב על רכיב: טקסטורת קנבס קטנה, ממוחזרת בין בנייה לבנייה */
    _label(text, w, h, o){
      o = o || {};
      const THREE = this.THREE;
      const color = o.color || "#93a6ba", weight = o.weight || 800, track = o.track === undefined ? 8 : o.track;
      const key = [text, color, weight, track].join("|");
      this._texCache = this._texCache || {};
      let tex = this._texCache[key];
      if (!tex){
        const cv = document.createElement("canvas"); cv.width = 512; cv.height = 128;
        const x = cv.getContext("2d");
        x.clearRect(0,0,512,128);
        x.fillStyle = color;
        x.textAlign = "center"; x.textBaseline = "middle";
        try { x.letterSpacing = track + "px"; } catch(e){}
        let fs = 82;                                        // מקטין עד שהמחרוזת נכנסת ברוחב הטקסטורה
        for (let i=0;i<14;i++){
          x.font = weight + " " + fs + "px Helvetica Neue, Helvetica, Arial, sans-serif";
          if (x.measureText(text).width <= 470) break;
          fs -= 5;
        }
        x.fillText(text, 256, 70, 470);
        tex = new THREE.CanvasTexture(cv);
        tex.anisotropy = 4; tex.needsUpdate = true;
        this._texCache[key] = tex;
      }
      const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: o.opacity === undefined ? .8 : o.opacity,
                                      depthWrite: false, toneMapped: false }));
      return me;
    }
    /* לוחית פונה אל הזכוכית (+X) */
    _labelX(text, w, h, x, y, z, o){
      const me = this._label(text, w, h, o);
      me.rotation.y = Math.PI/2;
      me.material.side = this.THREE.DoubleSide;
      me.userData.autoFlip = true;                 // ייושר מול היפוך ההורה בסוף הבנייה
      me.position.set(x, y, z); return me;
    }
    _box(w,h,d,mat,x=0,y=0,z=0){
      const THREE = this.THREE;
      const me = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
      me.position.set(x,y,z); me.castShadow = true; me.receiveShadow = true; return me;
    }
    _cyl(r,h,mat,x=0,y=0,z=0,seg=24){
      const THREE = this.THREE;
      const me = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg), mat);
      me.position.set(x,y,z); me.castShadow = true; me.receiveShadow = true; return me;
    }
    /* מאוורר: מסגרת + טבור + להבים מסתובבים (+ טבעת ARGB) */
    _fan(r, rgb, lit){
      const THREE = this.THREE, g = new THREE.Group();
      g.add(this._box(r*2.06, r*2.06, r*.26, this.M.plastic));
      const hole = this._cyl(r*.95, r*.3, this.M.steelDk, 0,0,0, 28); hole.rotation.x = Math.PI/2; g.add(hole);
      for (const sz of [r*.14, -r*.14]){                                   // טבעות מסגרת פנימיות
        const rim = new THREE.Mesh(new THREE.TorusGeometry(r*.97, r*.05, 8, 34), this.M.plastic);
        rim.position.z = sz; g.add(rim);
      }
      for (let i=0;i<4;i++){                                               // זרועות סטטור מאחור
        const arm = this._box(r*.9, r*.09, r*.05, this.M.plastic, 0, 0, -r*.11);
        arm.rotation.z = i/4*Math.PI + .4; g.add(arm);
      }
      const ringColor = rgb || (lit ? 0x4f9dff : null);
      for (const sx of [-1,1]) for (const sy of [-1,1]){                    // ברגים ופדי גומי בפינות
        g.add(this._cyl(r*.075, r*.3, this.M.alu, sx*r*.86, sy*r*.86, 0, 10).rotateX(Math.PI/2));
        g.add(this._box(r*.34, r*.34, r*.05, this.M.rubber, sx*r*.86, sy*r*.86, r*.15));
      }
      if (ringColor){
        const gi = rgb ? 1.7 : 1.2;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r*.85, r*.075, 10, 44), this._glow(ringColor, gi));
        ring.position.z = r*.12; g.add(ring);
        const ringB = new THREE.Mesh(new THREE.TorusGeometry(r*.85, r*.075, 10, 44), this._glow(ringColor, gi));
        ringB.position.z = -r*.12; g.add(ringB);
        const hub2 = new THREE.Mesh(new THREE.TorusGeometry(r*.42, r*.04, 8, 30), this._glow(ringColor, gi*.8));
        hub2.position.z = r*.14; g.add(hub2);
        const l = new THREE.PointLight(ringColor, rgb ? 2.6 : 1.5, r*10); l.position.z = r*.55; g.add(l);
        const lb = new THREE.PointLight(ringColor, rgb ? 1.8 : 1.1, r*9); lb.position.z = -r*.55; g.add(lb);
        const hubB = new THREE.Mesh(new THREE.TorusGeometry(r*.42, r*.04, 8, 30), this._glow(ringColor, gi*.8));
        hubB.position.z = -r*.14; g.add(hubB);
      }
      const blades = new THREE.Group();
      const hub = this._cyl(r*.3, r*.2, this.M.plastic, 0,0,0, 20);
      hub.rotation.x = Math.PI/2; blades.add(hub);
      for (let i=0;i<9;i++){
        const a2 = i/9*Math.PI*2;
        const b = this._box(r*.5, r*.16, r*.03, this.M.blade,
          Math.cos(a2)*r*.5, Math.sin(a2)*r*.5, r*.07);
        b.rotation.z = a2 + .5; b.rotation.y = .38;
        b.scale.set(1, .85, 1); blades.add(b);
      }
      blades.position.z = r*.06;
      g.add(blades);
      this._spinners.push(blades);
      return g;
    }
    _spin(dt){
      const target = this._powered ? 5.2 : 0;                 // המאווררים מתחילים לרוץ רק אחרי חיבור ספק
      this._rpm = this._rpm === undefined ? 0 : this._rpm + (target - this._rpm) * Math.min(1, dt*1.4);
      if (this._rpm < .02) return;
      (this._spinners || []).forEach(b => { b.rotation.z += dt * this._rpm; });
    }
    /* צינור כבל חלק בין נקודות */
    _cable(pts, r0, mat){
      const THREE = this.THREE;
      const cur = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
      const me = new THREE.Mesh(new THREE.TubeGeometry(cur, 22, r0 || .05, 7, false), mat || this.M.rubber);
      me.castShadow = true; return me;
    }

    /* ---------- במה: פודיום + טבעת אור + רצפה ---------- */
    _podium(){
      const THREE = this.THREE, M = this.M, g = new THREE.Group();
      const disc = this._cyl(2.85, .2, M.podium, 0, -.1, 0, 72);
      disc.receiveShadow = true; g.add(disc);
      if (this.Reflector){                                  // השתקפות עדינה מתחת למארז
        const mirror = new this.Reflector(new THREE.CircleGeometry(2.7, 64), {
          textureWidth: 512, textureHeight: 512, color: 0x1a2432, clipBias: .004
        });
        mirror.rotation.x = -Math.PI/2; mirror.position.y = .005;
        g.add(mirror);
        const veil = new THREE.Mesh(new THREE.CircleGeometry(2.7, 64),
          new THREE.MeshBasicMaterial({ color:0x061120, transparent:true, opacity:.62 }));
        veil.rotation.x = -Math.PI/2; veil.position.y = .008; g.add(veil);
      }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.79, .028, 12, 96), this._glow(0x2f8fff, 1.15));
      ring.rotation.x = Math.PI/2; ring.position.y = .02; g.add(ring);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60),
        new THREE.ShadowMaterial({ opacity:.66 }));
      floor.rotation.x = -Math.PI/2; floor.position.y = -.22; floor.receiveShadow = true; g.add(floor);
      const up = new THREE.PointLight(0x2f8fff, .9, 8); up.position.set(0, .35, 0); g.add(up);
      this._scene.add(g);
    }

    /* ---------- הרכבה ---------- */
    _build(){
      const THREE = this.THREE, c = this._cfg, prev = this._prev;
      this._spinners = [];
      this._anims = [];
      while (this._rig.children.length) {
        const ch = this._rig.children.pop();
        ch.traverse(o => { o.geometry && o.geometry.dispose(); });
      }
      const inside = (this._mode || c.mode) === "in";
      this._powered = !!c.psu;

      const FORM = { itx:{w:1.9,h:2.9,d:3.0,fans:2}, mid:{w:2.15,h:4.4,d:4.1,fans:3}, full:{w:2.4,h:5.0,d:4.6,fans:3} };
      const S = FORM[(c.case && c.case.form) || "mid"];
      const argb = !!(c.case && c.case.argb) || !!(c.fans && c.fans.rgb);
      const rgb = argb ? 0x3f9dff : null;
      const base = new THREE.Group();
      base.scale.z = -1;                       // שיקוף לאורך העומק: פאנל קדמי מימין, מגש לוח האם בשמאל
      base.position.y = S.h/2 + .04;
      this._rig.add(base);
      this._rig.rotation.y = -.5;

      const { w, h, d } = S, mx = -w/2 + .12;
      const bdG = d * ((c.mobo && c.mobo.form === "matx") ? .6 : .72);
      const mz = -d/2 + .18 + bdG/2;          // הלוח נצמד לפאנל האחורי

      /* --- שלד המארז --- */
      if (c.case){
        const shell = new THREE.Group();
        shell.add(this._box(.07, h, d, this.M.steelDk, -w/2, 0, 0));      // דופן שמאל
        shell.add(this._box(.05, h*.84, d*.84, this.M.steel, -w/2 + .07, h*.04,
                  Math.max(mz, -d/2 + .12 + d*.42)));                            // מגש לוח אם — נשאר בתוך הפאנל האחורי
        // גב עם פתח למאוורר הפליטה: מסגרת סביב חלון פתוח
        const ap = Math.min(w*.29, h*.15);                                // חצי גודל הפתח
        const apY = h*.28, apX = -w*.04;
        shell.add(this._box(w, h/2 - (apY + ap), .07, this.M.steelDk, 0, (apY + ap + h/2)/2, -d/2));
        shell.add(this._box(w, (apY - ap) + h/2, .07, this.M.steelDk, 0, ((apY - ap) - h/2)/2, -d/2));
        shell.add(this._box(w/2 + apX - ap, ap*2, .07, this.M.steelDk, (-w/2 + apX - ap)/2, apY, -d/2));
        shell.add(this._box(w/2 - apX - ap, ap*2, .07, this.M.steelDk, (w/2 + apX + ap)/2, apY, -d/2));
        for (let i=1;i<7;i++)                                             // סבכת הגנה
          shell.add(this._box(ap*1.94, .022, .03, this.M.steel, apX, apY - ap + i*(ap*2/7), -d/2 - .05));
        shell.add(this._box(w, .08, d, this.M.steel, 0, h/2, 0));         // גג
        shell.add(this._box(w, .08, d, this.M.floorIn, 0, -h/2, 0));      // רצפה
        // מסגרת קדמית (mesh) — המאווררים מאחוריה נראים
        shell.add(this._box(w*.13, h*.99, .1, this.M.steel, -w*.435, 0, d/2));
        shell.add(this._box(w*.13, h*.99, .1, this.M.steel,  w*.435, 0, d/2));
        shell.add(this._box(w*.99, h*.055, .1, this.M.steel, 0,  h*.472, d/2));
        shell.add(this._box(w*.99, h*.055, .1, this.M.steel, 0, -h*.472, d/2));
        shell.add(this._box(w*.9, h*.02, .04, this._glow(rgb || 0x2f8fff, rgb ? 2.1 : 1.1), 0, h*.44, d/2 + .06));  // פס ARGB קדמי
        shell.add(this._labelX("DVIRTECH", h*.42, h*.105, w/2 + .05, -h*.45, d*.06,
                  { color:"#9db1c6", track:10, opacity:.8 }));                            // לוגו על פס הזכוכית
        for (let i=0;i<8;i++)                                             // פתחי אוורור בגג
          shell.add(this._box(w*.62, .02, .05, this.M.steelDk, 0, h/2 + .045, -d*.3 + i*(d*.55/7)));
        shell.add(this._box(w*.86, .02, d*.66, this.M.steelDk, 0, h/2 + .05, -d*.03));   // פילטר אבק עליון
        const io = new THREE.Group();                                     // פאנל IO קדמי
        io.add(this._box(.04, .78, .34, this.M.steelDk, 0, -.06, 0));     // לוחית הפאנל (דקה לאורך נורמל הפאנל)
        io.add(this._cyl(.062, .035, this.M.alu, 0, .16, 0, 16));         // כפתור הפעלה
        io.add(this._cyl(.03, .04, this._glow(0x2f8fff, c.psu ? 2.4 : .35), 0, .17, 0, 14));
        io.add(this._cyl(.032, .03, this.M.alu, 0, .02, 0, 12));          // כפתור איפוס
        for (let i=0;i<2;i++){                                            // שתי כניסות USB-A
          io.add(this._box(.075, .035, .105, this.M.steelDk, 0, -.14 - i*.11, 0));
          io.add(this._box(.05, .012, .075, this._glow(0x2f6fd0, .5), 0, -.145 - i*.11, .005));
        }
        io.add(this._box(.05, .03, .085, this.M.steelDk, 0, -.38, 0));    // USB-C
        io.add(this._cyl(.026, .03, this.M.gold, 0, -.48, 0, 12));        // ג'ק שמע
        io.rotation.y = Math.PI/2;
        io.position.set(w*.36, h*.4, d/2 + .07); shell.add(io);
        const barN = Math.floor((h*.9) / .09);                            // סבכת mesh קדמית — בתוך פתח הפאנל בלבד
        for (let i=0;i<=barN;i++)
          shell.add(this._box(w*.72, .012, .05, this.M.steelDk, 0, -h*.45 + i*(h*.9/barN), d/2 + .03));
        for (let i=0;i<5;i++) for (let k=0;k<5;k++)                        // רשת אוורור בגב (ליד המגש)
          shell.add(this._box(.05, .05, .04, this.M.plastic,
                    -w*.46 + i*.085, -h*.12 + k*.075 + (i%2)*.037, -d/2 - .03));
        for (let i=0;i<6;i++) for (let k=0;k<5;k++)                        // רשת אוורור תחתונה
          shell.add(this._box(.05, .05, .04, this.M.plastic,
                    -w*.46 + i*.085, -h*.38 + k*.07 + (i%2)*.035, -d/2 - .03));
        shell.add(this._box(w*.26, .5, .05, this.M.steelDk, -w*.3, h*.13 + h*.24, -d/2 - .03));   // מסגרת פתח ה-IO
        shell.add(this._box(w*.2, .11, .05, this.M.steelDk, w*.26, -h*.4, -d/2 - .03));           // פתח כבל הספק
        const bhS = h * ((c.mobo && c.mobo.form === "matx") ? .46 : .55);
        const slot0 = h*.13 - bhS*.12;                                    // גובה החריץ העליון
        for (let i=0;i<7;i++){                                            // כיסויי חריצי הרחבה בגב
          shell.add(this._box(w*.2, .11, .05, this.M.steel, -w*.28, slot0 - .04 - i*.135, -d/2 - .04));
          shell.add(this._box(w*.05, .05, .04, this.M.alu, -w*.36, slot0 - .04 - i*.135, -d/2 - .05));
        }
        shell.add(this._box(w*.22, .03, d*.9, this.M.rubber, 0, -h/2 - .04, 0));  // רגליים
        for (let i=0;i<3;i++)                                             // פאנל IO
          shell.add(this._box(.05, .05, .05, this.M.alu, w*.42, h*.44, d/2 + .06));
        if (!inside){
          const glass = this._box(.03, h*.93, d*.93, this.M.glass, w/2 - .02, 0, 0);
          glass.castShadow = false; shell.add(glass);
          const gf = this._box(.02, h*.93, .03, this.M.steel, w/2 - .02, 0, d*.46); shell.add(gf);
          const gb = this._box(.02, h*.93, .03, this.M.steel, w/2 - .02, 0, -d*.46); shell.add(gb);
          for (const sy of [h*.44, -h*.44]) for (const sz of [d*.43, -d*.43])   // ברגי פאנל
            shell.add(this._cyl(.035, .04, this.M.alu, w/2 - .01, sy, sz, 12).rotateZ(Math.PI/2));
        }
        const innerGlow = new THREE.PointLight(0xcfe2f5, 1.1, w*10);  // אור פנימי רך
        innerGlow.position.set(w*.1, h*.08, d*.05); shell.add(innerGlow);
        const blueGlow = new THREE.PointLight(0x3f8fe0, 2.8, w*10);     // גוון כחול עדין בפנים
        blueGlow.position.set(-w*.1, -h*.12, -d*.1); shell.add(blueGlow);
        if (c.extras && c.extras.strip)                                   // רצועת ARGB לאורך הגג
          shell.add(this._box(.05, .04, d*.7, this._glow(rgb || 0x3f9dff, 2.2), w*.36, h/2 - .1, -d*.04));
        base.add(shell);
        this._reg(shell, prev.caseKey !== c.caseKey);
      }

      /* --- מאווררים קדמיים (מהמארז או מערכת שנבחרה) --- */
      const kitCount = c.fans ? c.fans.count : 0;
      const frontCount = Math.max(c.case ? S.fans : 0, Math.min(kitCount || 0, S.fans));
      if (c.case && frontCount){
        const fr = Math.min(w*.33, (h*.86) / (frontCount + .2));
        const pitch = fr*2.05, top = (frontCount-1)*pitch/2;
        const fg = new THREE.Group();
        for (let i=0;i<frontCount;i++){
          const f = this._fan(fr, rgb, true);
          f.position.set(-w*.03, top - i*pitch, d/2 - .2);
          fg.add(f);
        }
        base.add(fg);
        this._reg(fg, prev.fansKey !== c.fansKey);
      }
      if (c.case){                                                        // מאוורר פליטה אחורי
        const rf = this._fan(Math.min(w*.28, h*.145), rgb);
        rf.rotation.y = Math.PI;
        rf.position.set(-w*.04, h*.28, -d/2 + .16);
        const rg = new THREE.Group(); rg.add(rf); base.add(rg);
        this._reg(rg, prev.caseKey !== c.caseKey);
      }
      if (c.case && kitCount > S.fans){                                   // עודף → מאווררי גג
        const extra = Math.min(kitCount - S.fans, 3);
        const fr = Math.min(d*.3, (w*.8)/1.1) * .5;
        const tg = new THREE.Group();
        for (let i=0;i<extra;i++){
          const f = this._fan(fr, rgb);
          f.rotation.x = -Math.PI/2;
          f.position.set(0, h/2 - .18, d*.28 - i*fr*2.1);
          tg.add(f);
        }
        base.add(tg);
        this._reg(tg, prev.fansKey !== c.fansKey);
      }

      /* --- לוח אם --- */
      if (c.mobo){
        const matx = c.mobo.form === "matx";
        const bh = h * (matx ? .46 : .55), bd = d * (matx ? .6 : .72);
        const g = new THREE.Group();
        g.add(this._box(.06, bh, bd, this.M.pcb, mx, h*.13, mz));
        g.add(this._box(.1, .56, .56, this.M.steelDk, mx + .07, h*.13, mz));      // סוקט
        g.add(this._box(.14, bh*.34, .3, this.M.alu, mx + .08, h*.13, mz - bd*.4));  // VRM
        g.add(this._box(.14, .26, bd*.34, this.M.alu, mx + .08, h*.13 - bh*.26, mz));  // מגן M.2
        g.add(this._box(.16, .3, .3, this.M.steelDk, mx + .08, h*.13 - bh*.4, mz - bd*.26)); // צ'יפסט
        const ioZ = -d/2 + .3;                                                          // צמוד לפאנל האחורי
        g.add(this._box(.22, .44, .42, this.M.steelDk, mx + .12, h*.13 + bh*.42, ioZ));  // כיסוי IO
        g.add(this._box(.23, .05, .34, this._glow(0x2f8fff), mx + .12, h*.13 + bh*.42, ioZ));
        g.add(this._labelX("DVIRTECH", .78, .195, mx + .17, h*.13 - bh*.4, mz - bd*.24,
              { color:"#6f8296", track:4, opacity:.7 }));                                 // כיתוב על הצ'יפסט
        g.add(this._labelX("Z790  GAMING", .95, .238, mx + .155, h*.13 - bh*.62, mz + bd*.1,
              { color:"#4d6076", weight:600, track:3, opacity:.55 }));                    // סילקסקרין
        for (let i=0;i<(matx ? 2 : 3); i++){                                           // חריצי PCIe
          g.add(this._box(.1, .07, bd*.46, this.M.steelDk, mx + .09, h*.13 - bh*.12 - i*.3, mz + bd*.04));
          g.add(this._box(.06, .05, .05, this.M.plastic, mx + .09, h*.13 - bh*.12 - i*.3, mz + bd*.28));
        }
        for (let i=0;i<7;i++)                                                          // קבלים ליד הסוקט
          g.add(this._cyl(.03, .09, this.M.steelDk, mx + .08, h*.13 - .34 + (i%4)*.1, mz + .22 + Math.floor(i/4)*.09, 8));
        g.add(this._box(.09, .3, .08, this.M.plastic, mx + .08, h*.2, mz + bd*.44));     // מחבר ATX 24 פינים
        g.add(this._box(.07, .12, .07, this.M.plastic, mx + .08, h*.13 + bh*.46, mz - bd*.1)); // EPS 8 פינים
        for (let i=0;i<4;i++)                                                          // כותרות/מחברים תחתונים
          g.add(this._box(.05, .05, .05, this.M.plastic, mx + .08, h*.13 - bh*.46, mz - bd*.2 + i*.12));
        /* אשכול יציאות אחורי: הכל פונה אל גב המארז */
        const iz = -d/2 + .16, iy = h*.13 + bh*.42;
        g.add(this._box(.2, .46, .04, this.M.steelDk, mx + .12, iy, iz));                   // לוחית IO
        for (let i=0;i<2;i++) for (let k=0;k<2;k++){                                        // 4× USB-A
          g.add(this._box(.055, .038, .05, this.M.steelDk, mx + .06 + i*.1, iy + .17 - k*.055, iz - .02));
          g.add(this._box(.036, .012, .05, this._glow(0x2f6fd0, .45), mx + .06 + i*.1, iy + .166 - k*.055, iz - .03));
        }
        for (let i=0;i<2;i++)                                                               // 2× USB-C
          g.add(this._box(.05, .026, .05, this.M.steelDk, mx + .06 + i*.1, iy + .055, iz - .02));
        g.add(this._box(.075, .045, .05, this.M.steelDk, mx + .07, iy - .02, iz - .02));    // HDMI
        g.add(this._box(.075, .045, .05, this.M.steelDk, mx + .16, iy - .02, iz - .02));    // DisplayPort
        g.add(this._box(.085, .07, .05, this.M.steelDk, mx + .07, iy - .11, iz - .02));     // רשת RJ45
        g.add(this._box(.03, .012, .04, this._glow(0x2FC4B0, .8), mx + .045, iy - .14, iz - .03));
        for (let i=0;i<3;i++)                                                               // ג'קים לשמע
          g.add(this._cyl(.024, .05, this.M.gold, mx + .15 + (i%2)*.05, iy - .1 - Math.floor(i/2)*.06, iz - .02, 12).rotateX(Math.PI/2));
        g.add(this._box(.05, .04, .05, this.M.plastic, mx + .17, iy - .19, iz - .02));      // אופטי
        /* פירוט חזית הלוח */
        for (let i=0;i<9;i++)                                                               // צלעות מפזר ה-VRM
          g.add(this._box(.15, bh*.3, .018, this.M.steelDk, mx + .085, h*.13, mz - bd*.44 + i*.035));
        g.add(this._box(.13, .2, bd*.3, this.M.steelDk, mx + .075, h*.13 - bh*.26, mz));  // מגן M.2 שני
        g.add(this._labelX("M.2  Gen5", .5, .125, mx + .145, h*.13 - bh*.26, mz + bd*.06,
              { color:"#5d7186", weight:600, track:2, opacity:.6 }));
        for (let i=0;i<4;i++)                                                               // יציאות SATA
          g.add(this._box(.07, .045, .05, this.M.steelDk, mx + .07, h*.13 - bh*.34 + Math.floor(i/2)*.06, mz + bd*.42 - (i%2)*.06));
        for (let i=0;i<5;i++)                                                               // רכיבי SMD קטנים
          g.add(this._box(.02, .03, .05, this.M.plastic, mx + .04, h*.13 + bh*.3 - i*.07, mz + bd*.3));
        g.add(this._box(.005, .02, bd*.5, this.M.white, mx + .04, h*.13 + bh*.2, mz));   // סילקסקרין
        base.add(g);
        this._reg(g, prev.moboKey !== c.moboKey);
      }

      /* --- מעבד (נראה רק אם אין קירור מותקן) --- */
      if (c.cpu){
        const g = new THREE.Group();
        g.add(this._box(.05, .46, .46, this.M.alu, mx + .13, h*.13, mz));
        g.add(this._box(.02, .16, .16, this._glow(c.cpu.brand === "amd" ? 0xd9302c : 0x2f8fff), mx + .16, h*.13, mz));
        base.add(g);
        this._reg(g, prev.cpuKey !== c.cpuKey);
      }

      /* --- קירור למעבד --- */
      if (c.cooling){
        const g = new THREE.Group();
        const cy = h*.13, cz = mz;
        if (c.cooling.type === "aio"){
          const nf = c.cooling.fans || 2;
          const rl = Math.min(d*.88, nf*1.02);
          g.add(this._box(w*.62, .3, rl, this.M.steelDk, mx + w*.34, h/2 - .3, cz));   // רדיאטור
          for (let i=0;i<Math.round(rl/.1);i++)
            g.add(this._box(w*.56, .24, .035, this.M.alu, mx + w*.34, h/2 - .3, cz - rl/2 + .06 + i*.1));
          for (let i=0;i<nf;i++){                                                       // מאווררי רדיאטור
            const f = this._fan(Math.min(w*.28, rl/(nf*2.2)), rgb || 0x4f9dff);
            f.rotation.x = Math.PI/2;
            f.position.set(mx + w*.34, h/2 - .58, cz - rl/2 + rl/(nf*2) + i*(rl/nf));
            g.add(f);
          }
          const pump = this._cyl(.28, .22, this.M.plastic, mx + .22, cy, cz, 28);
          pump.rotation.z = Math.PI/2; g.add(pump);
          const THREE2 = this.THREE;
          const pr = new THREE2.Mesh(new THREE2.TorusGeometry(.24, .03, 10, 36), this._glow(rgb || 0x2f8fff));
          pr.position.set(mx + .34, cy, cz); pr.rotation.y = Math.PI/2; g.add(pr);
          for (let i=0;i<2;i++){                                                        // צינורות משורגים
            const zo = -.14 + i*.28;
            g.add(this._cable([[mx + .3, cy + .16, cz + zo],
                               [mx + .5, cy + (h/2 - cy)*.45, cz + zo*1.5 - .1],
                               [mx + w*.42, h/2 - .78, cz + zo*1.2 - rl*.18],
                               [mx + w*.36, h/2 - .58, cz + zo - rl*.34]], .055));
            g.add(this._cyl(.07, .16, this.M.alu, mx + .3, cy + .2, cz + zo, 12));      // מחבר סיבובי
          }
        } else {
          const cpuY = cy + .05;                                       // גובה פני המעבד
          g.add(this._box(.46, .09, .46, this.M.steelDk, mx + .26, cpuY, cz));              // בסיס/מנשא שחור על ה-IHS
          g.add(this._box(w*.3, .1, d*.16, this.M.steelDk, mx + w*.26, cpuY + .07, cz));       // בלוק חיבור לצלעות
          g.add(this._box(w*.44, .05, .06, this.M.steelDk, mx + w*.26, cpuY - .03, cz - d*.1)); // תושבת
          /* גובה המגדל נגזר מהמרווח שבין המעבד לגג — לא נחתך ולא בוקע החוצה */
          const finY0 = cpuY + .1;
          const finTop = h/2 - .22;                                     // תחתית הגג פחות מרווח
          const avail = Math.max(.35, finTop - finY0);
          const nFin = Math.max(6, Math.min(18, Math.floor(avail / .079)));
          const pitch = avail / nFin;
          const midY = finY0 + avail/2;
          for (let i=0;i<6;i++)                                                              // צינורות חום
            g.add(this._cyl(.045, avail + .1, this.M.copper, mx + .18 + i*.08, midY, cz - .16, 10));
          for (let i=0;i<nFin;i++)
            g.add(this._box(w*.4, Math.min(.022, pitch*.4), d*.22, this.M.alu, mx + w*.26, finY0 + i*pitch, cz));
          g.add(this._box(.02, avail, d*.22, this.M.steelDk, mx + w*.06, midY, cz));         // דופן צלעות
          g.add(this._box(w*.42, .05, d*.24, this.M.steelDk, mx + w*.26, finTop + .03, cz)); // מכסה עליון
          for (let i=0;i<6;i++)                                                              // ראשי צינורות
            g.add(this._cyl(.045, .06, this.M.copper, mx + .18 + i*.08, finTop + .07, cz - .16, 10));
          const f = this._fan(Math.min(w*.2, .34, avail*.42), null, true);
          f.rotation.y = Math.PI/2;
          f.position.set(mx + w*.5, midY, cz); g.add(f);
          for (let i=0;i<2;i++)                                                              // קליפסים
            g.add(this._box(.02, Math.min(.9, avail*.7), .03, this.M.alu, mx + w*.5, midY, cz - .2 + i*.4));
        }
        base.add(g);
        this._reg(g, prev.coolKey !== c.coolKey || prev.cpuKey !== c.cpuKey);
      }

      /* --- כרטיס רשת / WiFi בחריץ PCIe התחתון --- */
      if (c.wifi && c.mobo){
        const g = new THREE.Group();
        const wy = -h*.16, wz = mz + d*.04;
        g.add(this._box(.05, .34, d*.3, this.M.pcbGrn, mx + .1, wy, wz));
        g.add(this._box(.07, .2, d*.16, this.M.steelDk, mx + .13, wy + .02, wz));
        if (c.wifi === "wifi"){
          for (let i=0;i<2;i++){
            const a = this._cyl(.03, .7, this.M.steelDk, mx + .16, wy + .34, wz - d*.1 + i*d*.14, 10);
            a.rotation.z = .35; g.add(a);
          }
          g.add(this._box(.03, .05, .05, this._glow(0x2f8fff), mx + .14, wy - .1, wz + d*.1));
        } else {
          g.add(this._box(.06, .14, .16, this.M.alu, mx + .14, wy, wz + d*.11));
          g.add(this._box(.03, .04, .05, this._glow(0x2FC4B0), mx + .14, wy - .1, wz + d*.1));
        }
        base.add(g);
        this._reg(g, prev.wifiKey !== c.wifiKey);
      }

      /* --- משחה תרמית: מונחת על הפודיום ליד המארז --- */
      if (c.paste){
        const g = new THREE.Group();
        const tube = this._cyl(.09, .5, c.paste === "pro" ? this.M.steelDk : this.M.white, 0, 0, 0, 20);
        tube.rotation.z = Math.PI/2; g.add(tube);
        g.add(this._cyl(.05, .12, this.M.plastic, .3, 0, 0, 14).rotateZ(Math.PI/2));
        g.add(this._box(.16, .1, .01, c.paste === "pro" ? this.M.gold : this.M.plastic, 0, .09, 0));
        g.position.set(w*.2, -S.h/2 + .13, d/2 + .75);
        g.rotation.y = .5;
        base.add(g);
        this._reg(g, prev.pasteKey !== c.pasteKey);
      }

      /* --- זיכרון --- */
      if (c.ram){
        const g = new THREE.Group();
        const n = c.ram.sticks || 2;
        for (let i=0;i<n;i++){
          const z = mz + bdG*.24 + i*.15;
          const y0 = h*.16, hh = h*.13;
          g.add(this._box(.11, .055, .1, this.M.plastic, mx + .17, y0 - hh*.52, z));      // חריץ DIMM
          g.add(this._box(.045, hh, .052, this.M.pcbGrn, mx + .17, y0, z));               // PCB
          g.add(this._box(.05, .03, .052, this.M.gold, mx + .17, y0 - hh*.5, z));         // מגעים
          g.add(this._box(.085, hh*.8, .1, this.M.steelDk, mx + .185, y0 + hh*.06, z));   // מפזר חום
          for (let k=0;k<5;k++)                                                            // שיני המפזר
            g.add(this._box(.02, hh*.16, .09, this.M.alu, mx + .155 + k*.016, y0 + hh*.5, z));
          g.add(this._box(.09, .022, .1, rgb ? this._glow(rgb, 1.1) : this.M.white,
                mx + .185, y0 + hh*.47, z));                                               // פס עליון
        }
        base.add(g);
        this._reg(g, prev.ramKey !== c.ramKey);
      }

      /* --- כרטיס מסך --- */
      if (c.gpu){
        const cls = c.gpu.cls || 1;
        const len = [d*.44, d*.54, d*.64, d*.72][cls];
        const th = [.15, .18, .22, .26][cls];
        const nf = cls >= 2 ? 3 : 2;
        const bhG = h * ((c.mobo && c.mobo.form === "matx") ? .46 : .55);
        const slotY = h*.13 - bhG*.12;                               // החריץ העליון בלוח
        const gy = slotY - th*.5 - .06;                              // הכרטיס תלוי מתחת לחריץ
        const gz = -d/2 + .2 + len/2;                                // הסוגר נצמד לפאנל האחורי
        const g = new THREE.Group();
        const gx = mx + w*.3;
        const gw = w*.56;                                            // רוחב הכרטיס (מהמגש אל הזכוכית)
        g.add(this._box(gw*.9, .045, len*.94, this.M.pcbGrn, gx, gy - th*.34, gz));   // PCB
        for (let i=0;i<22;i++)                                        // צלעות גוף הקירור הפסיבי
          g.add(this._box(gw*.86, th*.66, .022, this.M.alu, gx, gy + th*.02, gz - len*.46 + i*(len*.92/21)));
        for (let i=0;i<3;i++)                                         // צינורות חום לאורך הכרטיס
          g.add(this._cyl(.035, len*.86, this.M.copper, gx - gw*.28 + i*gw*.28, gy - th*.16, gz, 10).rotateX(Math.PI/2));
        g.add(this._box(.035, th*.7, len*.92, this.M.steelDk, gx - gw*.45, gy + th*.04, gz));  // דופן שרוד
        g.add(this._box(.035, th*.7, len*.92, this.M.steelDk, gx + gw*.45, gy + th*.04, gz));
        const fr2 = Math.min(gw*.42, len/(nf*2.25));
        for (let i=0;i<=nf;i++){                                      // גשרי שרוד בין המאווררים
          const zc = gz - len/2 + i*(len/nf);
          g.add(this._box(gw, .045, Math.max(.06, len/nf - fr2*2), this.M.steelDk, gx, gy + th*.42, zc));
        }
        for (let i=0;i<nf;i++){                                       // מאווררים בתוך החיתוכים
          const f = this._fan(fr2, null, true);
          f.rotation.x = -Math.PI/2;
          f.position.set(gx, gy + th*.46, gz - len/2 + len/(nf*2) + i*(len/nf));
          g.add(f);
        }
        g.add(this._box(gw*.92, .035, len*.96, this.M.steel, gx, gy - th*.56, gz));   // גב מתכת
        g.add(this._box(.09, .05, len*.24, this.M.gold, gx - gw*.42, gy - th*.5, gz - len*.3)); // מגעי PCIe
        g.add(this._box(gw*.5, th*1.9, .05, this.M.alu, gx, gy + th*.2, gz - len/2 - .04));     // סוגר אחורי
        for (let i=0;i<3;i++){                                        // 3× DisplayPort בסוגר
          g.add(this._box(gw*.2, .062, .06, this.M.steelDk, gx - gw*.24 + i*gw*.2, gy + th*.42, gz - len/2 - .07));
          g.add(this._box(gw*.13, .02, .05, this.M.plastic, gx - gw*.24 + i*gw*.2, gy + th*.42, gz - len/2 - .085));
        }
        g.add(this._box(gw*.26, .07, .06, this.M.steelDk, gx - gw*.02, gy + th*.02, gz - len/2 - .07));  // HDMI
        for (let i=0;i<6;i++)                                         // חריצי אוורור בסוגר
          g.add(this._box(gw*.055, .3, .04, this.M.alu, gx + gw*.16 + i*gw*.055, gy + th*.2, gz - len/2 - .06));
        g.add(this._box(.16, .09, .22, this.M.plastic, gx + gw*.18, gy + th*.5, gz + len*.3));  // מחבר חשמל
        g.add(this._box(gw*.5, .05, .05, this.M.steelDk, gx, gy + th*.46, gz + len*.2));        // קו עיצוב בשרוד
        g.add(this._box(.05, th*1.2, .16, this.M.alu, gx + gw*.3, gy - th*.9, gz + len*.42));   // תמיכת אנטי-סאג
        g.add(this._box(.02, .13, .5, this._glow(c.gpu.brand === "amd" ? 0xd9302c : 0x4f9dff, .55),
              gx + gw*.47, gy + th*.02, gz + len*.16));                                          // לוגו מואר בצד
        g.add(this._box(.03, .035, len*.44, this._glow(c.gpu.brand === "amd" ? 0xd9302c : 0x4f9dff, .45),
              gx + gw*.47, gy + th*.24, gz - len*.1));                // פס מותג בצד הזכוכית
        g.add(this._labelX(c.gpu.brand === "amd" ? "RADEON" : "GEFORCE RTX", len*.52, len*.13,
              gx + gw*.47 + .02, gy - th*.18, gz + len*.02,
              { color:"#c3d2e2", track:5, opacity:.9 }));
        g.add(this._labelX(c.gpu.brand === "amd" ? "AMD" : "NVIDIA", len*.26, len*.065,
              gx + gw*.47 + .02, gy + th*.34, gz - len*.3,
              { color: c.gpu.brand === "amd" ? "#e08a86" : "#a9d68f", track:6, opacity:.85 }));
        for (let i=0;i<7;i++)                                          // חורי אוורור בגב הכרטיס
          g.add(this._box(gw*.4, .012, .05, this.M.steelDk, gx, gy - th*.58, gz - len*.34 + i*(len*.68/6)));
        base.add(g);
        this._reg(g, prev.gpuKey !== c.gpuKey);
      }

      /* --- אחסון (M.2 על הלוח) --- */
      if (c.storage){
        const g = new THREE.Group();
        g.add(this._box(.05, .1, d*.28, this.M.alu, mx + .1, -h*.19, mz));
        g.add(this._box(.02, .04, d*.1, this.M.white, mx + .13, -h*.19, mz));
        base.add(g);
        this._reg(g, prev.storageKey !== c.storageKey);
      }

      /* --- ספק כוח + שרוד --- */
      if (c.psu){
        const g = new THREE.Group();
        const pw = Math.min(w*.7, 1.6), ph = Math.min(h*.2, .58), pd = Math.min(d*.34, 1.35);
        const px = -w*.06, py = -h/2 + ph/2 + .07, pz = -d/2 + pd/2 + .14;
        g.add(this._box(pw, ph, pd, this.M.steelDk, px, py, pz));                    // גוף הספק
        g.add(this._box(pw*.98, ph*.06, pd*.98, this.M.steel, px, py + ph*.47, pz)); // מכסה עליון
        for (let i=0;i<6;i++)                                                        // חורי אוורור בגב
          for (let k=0;k<3;k++)
            g.add(this._box(pw*.06, ph*.13, .03, this.M.plastic,
                  px - pw*.3 + i*pw*.075, py + ph*.24 - k*ph*.22, pz - pd/2 - .02));
        for (let i=0;i<7;i++)                                                        // חריצי אוורור בצד הזכוכית
          g.add(this._box(.03, ph*.5, pd*.055, this.M.plastic, px + pw/2 + .015, py - ph*.16, pz - pd*.28 + i*pd*.09));
        g.add(this._box(.025, ph*.16, pd*.7, this.M.alu, px + pw/2 + .015, py + ph*.3, pz));   // פס עיצוב בצד
        g.add(this._box(.19, .17, .05, this.M.steelDk, px + pw*.34, py + ph*.2, pz - pd/2 - .03));  // שקע חשמל
        g.add(this._box(.12, .1, .05, this.M.plastic, px + pw*.34, py - ph*.14, pz - pd/2 - .03));  // מתג
        g.add(this._box(.05, .04, .04, this._glow(0x2FC4B0, 1.4), px + pw*.34, py - ph*.14, pz - pd/2 - .05));
        const pf = this._fan(Math.min(pw*.32, pd*.32), null);                        // מאוורר הספק
        pf.rotation.x = -Math.PI/2;
        pf.position.set(px, py + ph*.5, pz); g.add(pf);
        for (let i=0;i<7;i++)                                                        // סבכת מגן מעל המאוורר
          g.add(this._box(pw*.62, .015, .02, this.M.alu, px, py + ph*.56, pz - pd*.22 + i*(pd*.44/6)));
        for (let i=0;i<6;i++)                                                        // פאנל מחברים מודולרי
          g.add(this._box(.11, .07, .04, this.M.plastic, px - pw*.3 + (i%3)*.16, py + ph*.16 - Math.floor(i/3)*.14, pz + pd/2 + .02));
        g.add(this._labelX(String(c.psu.watt || 750) + "W  GOLD", pd*.62, pd*.155,
              px + pw/2 + .02, py, pz, { color:"#8b9cae", track:4, opacity:.85 }));  // מדבקת הספק

        const shY = -h*.5 + ph + h*.075;
        g.add(this._box(w*.86, .03, .1, this.M.steelDk, 0, shY - h*.02, d*.12));      // מסילת ניתוב כבלים בלבד

        /* כבלי הזנה מסודרים: 24 פינים ללוח, EPS למעלה, PCIe לכרטיס */
        const cy0 = shY + h*.06;
        if (c.mobo){
          const mtx = c.mobo.form === "matx";
          const bh2 = h * (mtx ? .46 : .55), bd2 = d * (mtx ? .6 : .72);
          g.add(this._cable([[mx - .06, h*.2 - .34, mz + bd2*.56], [mx + .01, h*.2 - .12, mz + bd2*.52],
                             [mx + .1, h*.2, mz + bd2*.44]], .05));                       // 24 פינים
          g.add(this._cable([[mx - .06, h*.13 + bh2*.52, mz - bd2*.22], [mx + .03, h*.13 + bh2*.52, mz - bd2*.15],
                             [mx + .1, h*.13 + bh2*.46, mz - bd2*.1]], .042));            // EPS
        }
        if (c.gpu){
          const cls2 = c.gpu.cls || 1;
          const len2 = [d*.44, d*.54, d*.64, d*.72][cls2], th2 = [.15, .18, .22, .26][cls2];
          const bhG2 = h * ((c.mobo && c.mobo.form === "matx") ? .46 : .55);
          const gy2 = h*.13 - bhG2*.12 - th2*.5 - .06, gz2 = -d/2 + .2 + len2/2, gx2 = mx + w*.3, gw2 = w*.56;
          const rgbCable = !!(c.extras && c.extras.rgbCable);
          g.add(this._cable([[gx2 + gw2*.1, gy2 + th2*1.15, gz2 + len2*.46],
                             [gx2 + gw2*.15, gy2 + th2*.85, gz2 + len2*.38],
                             [gx2 + gw2*.18, gy2 + th2*.52, gz2 + len2*.3]], .046,
                             rgbCable ? this._glow(rgb || 0x3f9dff, 1.1) : null));             // PCIe
          g.add(this._cable([[px - pw*.2, py + ph*.16, pz + pd/2 + .06], [px, py + ph*.6, pz + pd*.66],
                             [px + pw*.2, py + ph*.9, pz + pd*.6]], .05));                     // כבלים יוצאים מהספק
        }
        base.add(g);
        this._reg(g, prev.psuKey !== c.psuKey);
      }

      this._insideMode = inside;
      this._fit();
      this._controls.minDistance = inside ? 2.2 : 4.2;

      this._prev = Object.assign({}, c);
    }

    /* רישום קבוצה לאנימציית "נכנס למחשב" */
    _reg(group, isNew){
      if (!isNew) return;
      group.userData.t0 = performance.now();
      group.userData.baseY = group.position.y;
      this._anims.push(group);
    }
    _tick(){
      if (!this._anims.length) return;
      const now = performance.now();
      this._anims = this._anims.filter(g => {
        const p = Math.min(1, (now - g.userData.t0) / 620);
        const e = EASE(p);
        g.position.y = g.userData.baseY + (1 - e) * 1.4;
        const s = .82 + .18 * e;
        g.scale.setScalar(s);
        if (p >= 1){ g.position.y = g.userData.baseY; g.scale.setScalar(1); return false; }
        return true;
      });
    }
  }

  /* רכיב React: מחזיק במה אחת ומעדכן את התצורה בכל רינדור */
  const R = window.React;
  window.PCStage = function(props){
    const host = R.useRef(null), st = R.useRef(null);
    R.useEffect(() => {
      const s = new Stage(host.current);
      st.current = s;
      s.setFallback(props.fallback);
      s.setConfig(props.config, props.mode);
      s.setBg(props.bg);
      s.start();
      return () => s.dispose();
    }, []);
    R.useEffect(() => {
      if (st.current) st.current.setConfig(props.config, props.mode);
    }, [props.config, props.mode]);
    R.useEffect(() => {
      if (st.current) st.current.setBg(props.bg);
    }, [props.bg]);
    return R.createElement("div", {
      ref: host,
      style: Object.assign({ width:"100%", height:"100%", display:"block", position:"relative" }, props.style || {})
    });
  };
})();
