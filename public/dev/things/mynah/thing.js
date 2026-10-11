export default {
  name: "Kopi the Mynah",
  tags: ["bird"],
  zone: "air",
  size: 1,
  init(me, world) {
    me.state.mode = "fly";
    me.state.until = 2;
    me.state.tx = me.x;
    me.state.ty = me.y;
  },
  update(me, world, dt) {
    const s = me.state, t = world.time, p = world.pointer;
    if (s.mode === "fly") {
      if (p && world.dist(me, p) < 300) { s.mode = "swoop"; s.until = t + 1.4; me.say("Kaw!", 1); }
      else if (world.steer(me, { x: s.tx, y: s.ty }, 170) < 20) {
        const a = world.scene.air;
        s.tx = 150 + world.random() * 1300;
        s.ty = a.top + world.random() * (a.bottom - a.top);
        if (world.random() < 0.5) {
          const free = world.spots("perch").filter((l) => !l.occupant);
          s.lamp = free.length ? free[Math.floor(world.random() * free.length)].id : null;
          s.mode = s.lamp ? "perch" : "fly";
          s.until = t + 8;
        }
      }
    } else if (s.mode === "swoop") {
      if (p) world.steer(me, { x: p.x, y: p.y - 30 }, 520);
      if (t > s.until) { s.mode = "fly"; }
    } else {
      if (world.goTo(me, s.lamp, 240)) { if (t > s.until) { world.leave(me); s.mode = "fly"; } }
      else if (t > s.until + 6) s.mode = "fly"; // couldn't get there
    }
    if (Math.abs(me.vx) > 15) me.flip = me.vx < 0;
    me.angle = Math.max(-0.4, Math.min(0.4, me.vx / 1200)) * (me.flip ? -1 : 1);
  },
  onMeet(me, world, other) {
    if (other.hat) { me.say("Mine now!", 2); world.fx("sparkle", other.x, other.y - 120); me.signal("tease", other.id); }
    else if (other.tags.includes("cat")) { me.say("Haha, slow!", 1.5); me.signal("tease", other.id); }
  },
  onPoke(me, world) {
    me.say("Squawk!", 1.5);
    world.leave(me);
    me.vy = -260;
    world.fx("burst", me.x, me.y);
  },
};
