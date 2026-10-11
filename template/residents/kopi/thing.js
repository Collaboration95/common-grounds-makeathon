// Kopi: the cheeky mynah. Perches on lamps, swoops at fingers, teases Oyen with signals, and "steals" hats.
export default {
  name: "Kopi",
  tags: ["bird"],
  zone: "air",
  size: 1,
  init(me, world) {
    const s = me.state;
    s.mode = "fly"; s.until = 2 + world.random() * 2; s.tx = me.x; s.ty = me.y;
    s.lamp = ""; s.sat = 0; s.cool = 8; s.tease = 10; s.hat = 12; s.who = "";
  },
  update(me, world, dt) {
    const s = me.state, t = world.time, p = world.pointer, a = world.scene.air;
    const go = (mode, secs) => { s.mode = mode; s.until = t + secs; };
    const roam = () => {
      s.sat = 0;
      s.tx = 100 + world.random() * (world.width - 200);
      s.ty = a.top + world.random() * (a.bottom - a.top);
      go("fly", 3 + world.random() * 4);
    };
    const all = world.things();

    if (p && t > s.cool && s.mode !== "swoop" && world.dist(me, p) < 380) {
      world.leave(me);
      s.sat = 0;
      me.say("Kaw!", 1);
      go("swoop", 1.3);
    }
    if (s.mode === "swoop") {
      if (p) world.steer(me, { x: p.x, y: p.y - 30 }, 560);
      if (!p || t > s.until) { s.cool = t + 7; roam(); }
    } else if (s.mode === "hunt") {
      const v = all.find((q) => q.id === s.who && q.hat);
      if (!v || t > s.until) { s.hat = t + 12; roam(); }
      else world.steer(me, { x: v.x, y: v.y - 80 }, 300); // onMeet does the stealing
    } else if (s.mode === "perch") {
      if (world.goTo(me, s.lamp, 260)) {
        if (!s.sat) { s.sat = 1; s.until = t + 7 + world.random() * 6; }
        const cat = all.find((q) => q.tags.includes("cat"));
        if (cat && t > s.tease) {
          s.tease = t + 14 + world.random() * 8;
          me.say("Nyah nyah!", 1.5);
          me.signal("tease", cat.id);
        }
        if (t > s.until) { world.leave(me); roam(); }
      } else if (t > s.until + 6) roam();
    } else {
      if (world.steer(me, { x: s.tx, y: s.ty }, 190) < 24 || t > s.until) {
        const wearer = all.find((q) => q.hat);
        const free = world.spots("perch").filter((q) => !q.occupant);
        if (wearer && t > s.hat && world.random() < 0.5) { s.who = wearer.id; go("hunt", 8); }
        else if (free.length && world.random() < 0.6) { s.lamp = free[Math.floor(world.random() * free.length)].id; s.sat = 0; go("perch", 12); }
        else roam();
      }
    }
    if (Math.abs(me.vx) > 15) me.flip = me.vx < 0;
    me.angle = me.spot ? 0 : Math.max(-0.4, Math.min(0.4, me.vx / 1200)) * (me.flip ? -1 : 1);
  },
  onMeet(me, world, other) {
    const head = other.y - 120;
    if (other.hat) {
      me.say("Mine now!", 2);
      world.fx("sparkle", other.x, head);
      me.signal("stolen", other.id);
    } else if (other.tags.includes("cat")) {
      me.say("Too slow!", 1.5);
      me.signal("tease", other.id);
    }
  },
  onSignal(me, world, sig) {
    const s = me.state;
    if (sig.kind === "pounce") { // Oyen jumped: flap away
      world.leave(me);
      me.say("Kaw kaw!", 1.5);
      s.sat = 0;
      s.tx = me.x < world.width / 2 ? world.width - 250 : 250;
      s.ty = world.scene.air.top + 30;
      s.mode = "fly";
      s.until = world.time + 4;
    }
  },
  onPoke(me, world) {
    me.say("Kaw kaw kaw!", 2);
    world.leave(me);
    me.state.sat = 0;
    me.state.mode = "fly";
    me.state.until = world.time + 3;
    me.state.tx = 150 + world.random() * (world.width - 300);
    me.state.ty = world.scene.air.top + 20;
    world.fx("burst", me.x, me.y);
  },
};
