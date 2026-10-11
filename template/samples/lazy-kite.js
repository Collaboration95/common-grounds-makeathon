export default {
  name: "Lazy Kite",
  tags: ["wind", "toy"],
  zone: "air",
  size: 2,
  init(me, world) {
    me.state.t = world.random() * 6;
    me.state.lamp = "";
    me.state.free = 0;
  },
  update(me, world, dt) {
    const s = me.state, a = world.scene.air, p = world.pointer;
    s.t += dt;
    if (me.spot) {
      // snagged on a lamp: wriggle, then pop free
      me.angle = Math.sin(s.t * 9) * 0.25;
      if (s.t > s.free) { world.leave(me); world.fx("sparkle", me.x, me.y); }
      return;
    }
    if (s.lamp && world.goTo(me, s.lamp, 120)) {
      s.free = s.t + 4; // arrived: stuck on the lamp for 4s
      s.lamp = "";
      me.say("I'm stuck!", 1.5);
      return;
    }
    if (!s.lamp) {
      // drift through the whole air band (that is depth too), or follow a finger
      const tx = p ? p.x : world.width / 2 + Math.sin(s.t * 0.3) * 600;
      const ty = p ? p.y - 60 : a.top + (a.bottom - a.top) * (0.5 + 0.45 * Math.sin(s.t * 0.7));
      world.steer(me, { x: tx, y: ty }, 140);
      if (!p && world.random() < 0.003) { // now and then, fly into a lamp on purpose (pick one, keep it)
        const free = world.spots("perch").filter((q) => !q.occupant);
        if (free.length) s.lamp = free[Math.floor(world.random() * free.length)].id;
      }
    }
    me.angle = Math.max(-0.5, Math.min(0.5, me.vx / 400)); // leans into the wind
    me.flip = me.vx < 0;
  },
  onMeet(me, world, other) {
    if (other.tags.includes("bird")) {
      me.say("Shoo, bird!", 1.5);
      me.signal("shoo", other.id);
      world.fx("sparkle", me.x, me.y);
    }
  },
  onSignal(me, world, sig) {
    if (sig.kind === "tease") me.say("Hmph.", 1.2);
  },
  onPoke(me, world) {
    me.say("Wheee!", 1.5);
    me.state.t += 1.5;
    world.fx("hearts", me.x, me.y - 80);
  },
};
