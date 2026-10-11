// Oyen: the void-deck cat. Wanders the floor in depth, naps on seats / beside warm things, trots over to greet
// newcomers (hearts), stalks Kopi when it lands on a lamp, and bolts from anything spiky.
export default {
  name: "Oyen",
  tags: ["cat", "warm"],
  zone: "ground",
  size: 1,
  init(me, world) {
    const s = me.state;
    s.mode = "wander"; s.until = 3 + world.random() * 3; s.tx = me.x; s.ty = me.y;
    s.seen = []; s.cool = 0; s.zz = 0; s.spot = ""; s.say = 0; s.who = "";
  },
  update(me, world, dt) {
    const s = me.state, t = world.time, f = world.scene.floor, p = world.pointer, ds = world.scene.depthScale;
    const go = (mode, secs) => { s.mode = mode; s.until = t + secs; };
    const talk = (txt, secs) => { if (t > s.say) { s.say = t + 4; me.say(txt, secs); } };
    const head = me.y - me.z - 130 * (ds[0] + (ds[1] - ds[0]) * me.depth);
    me.scale = 1;

    // run from anything spiky
    const sp = world.nearby(me, 190).find((v) => v.tags.includes("spiky"));
    if (sp) {
      world.leave(me);
      const dx = me.x - sp.x, dy = me.y - sp.y, d = Math.hypot(dx, dy) || 1;
      me.vx = (dx / d) * 170; me.vy = (dy / d) * 110;
      me.flip = me.vx < 0;
      talk("Eep! Pointy.", 1.5);
      go("wander", 3);
      return;
    }

    // newcomers: trot over and say hi
    const all = world.things();
    for (const v of all) {
      if (s.seen.includes(v.id)) continue;
      s.seen.push(v.id);
      if (s.seen.length > 40) s.seen.shift();
      if (t > 4 && s.mode === "wander" && !v.tags.includes("spiky")) { s.who = v.id; world.leave(me); go("greet", 12); }
    }
    const who = all.find((v) => v.id === s.who);
    const bird = all.find((v) => v.tags.includes("bird") && v.spot);
    if (bird && s.mode === "wander" && t > s.cool && world.random() < 0.02) { s.who = bird.id; go("stalk", 14); }

    if (s.mode === "greet") {
      if (!who) go("wander", 3);
      else if (world.steer(me, { x: who.x + (me.x < who.x ? -70 : 70), y: who.y }, 120) < 30 || t > s.until) {
        world.fx("hearts", me.x, head);
        talk("Mrrp!", 1.5);
        go("sit", 5);
      }
    } else if (s.mode === "sit") {
      me.vx = 0; me.vy = 0;
      if (who) me.flip = who.x < me.x;
      if (t > s.until) go("wander", 4);
    } else if (s.mode === "stalk") {
      const prey = all.find((v) => v.id === s.who && v.spot);
      if (!prey || t > s.until) { s.cool = t + 15; go("wander", 3); }
      else {
        me.scale = 0.93; // crouch
        world.steer(me, { x: prey.x, y: f.backY + 15 }, 55);
        if (Math.abs(prey.x - me.x) < 100 && me.z === 0) {
          me.vz = 640; me.scale = 1;
          talk("Mrrow!", 1.2);
          me.signal("pounce", prey.id);
          world.fx("burst", me.x, head);
          s.cool = t + 20;
          go("wander", 2);
        }
      }
    } else if (s.mode === "seek") {
      if (s.spot) {
        if (world.goTo(me, s.spot, 85)) go("nap", 10 + world.random() * 6);
        else if (t > s.until) go("wander", 4);
      } else {
        const w = world.nearest(me, "warm");
        if (!w || t > s.until) go("wander", 4);
        else if (world.steer(me, { x: w.x - 60, y: w.y }, 85) < 30) go("nap", 12);
      }
    } else if (s.mode === "nap") {
      me.vx = 0; me.vy = 0;
      if (t > s.zz) { s.zz = t + 2.2; world.fx("zzz", me.x + 22, head); }
      if (p && world.dist(me, p) < 130) { talk("Mrow?", 1.5); world.leave(me); go("wander", 5); }
      else if (t > s.until) { world.leave(me); go("wander", 6 + world.random() * 6); }
    } else {
      // wander: trot to random points on the floor, front to back
      if (world.steer(me, { x: s.tx, y: s.ty }, 70) < 20) {
        s.tx = 100 + world.random() * (world.width - 200);
        s.ty = f.backY + 20 + world.random() * (f.frontY - f.backY - 40);
      }
      if (me.z === 0 && world.random() < 0.003) me.vz = 420;
      if (t > s.until) {
        const free = world.spots().filter((q) => !q.occupant && (q.kind === "seat" || q.kind === "rest"));
        free.sort((a, b) => world.dist(me, a) - world.dist(me, b));
        s.spot = "";
        if (world.nearest(me, "warm") && (!free.length || world.random() < 0.4)) go("seek", 12);
        else if (free.length) { s.spot = free[Math.floor(world.random() * Math.min(3, free.length))].id; go("seek", 18); }
        else go("wander", 5);
      }
    }
    if (Math.abs(me.vx) > 8) me.flip = me.vx < 0;
  },
  onMeet(me, world, other) {
    const s = me.state;
    if (other.tags.includes("spiky") || s.mode === "stalk") return;
    const head = me.y - me.z - 110;
    if (other.tags.includes("bird")) { me.say("Chirp? Mine.", 1.5); world.fx("sparkle", me.x, head); return; }
    world.fx("hearts", me.x, head);
    if (s.mode === "nap") return;
    world.leave(me);
    s.who = other.id;
    s.mode = "sit";
    s.until = world.time + 5;
    me.say("Mrrp.", 1.5);
  },
  onSignal(me, world, sig) {
    const s = me.state;
    if (sig.kind === "tease" && sig.from.tags.includes("bird") && sig.from.spot) {
      me.say("Hmph.", 1.2);
      world.leave(me);
      s.who = sig.fromId;
      s.mode = "stalk";
      s.until = world.time + 14;
    }
  },
  onPoke(me, world) {
    world.leave(me);
    me.state.mode = "wander";
    me.state.until = world.time + 5;
    me.vz = 560;
    me.say("Mrrow!", 1.5);
    world.fx("sparkle", me.x, me.y - me.z - 110);
  },
};
