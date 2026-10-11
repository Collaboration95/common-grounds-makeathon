export default {
  name: "Napping Cat",
  tags: ["cat", "animal"],
  zone: "ground",
  size: 1,
  init(me, world) {
    me.state.mode = "wander";
    me.state.until = 3;
    me.state.tx = me.x;
    me.state.ty = me.y;
    me.state.zz = 0;
  },
  update(me, world, dt) {
    const s = me.state, t = world.time;
    if (s.mode === "wander") {
      if (world.steer(me, { x: s.tx, y: s.ty }, 70) < 16) {
        const fl = world.scene.floor;
        s.tx = 150 + world.random() * 1300;
        s.ty = fl.backY + 30 + world.random() * (fl.frontY - fl.backY - 60);
      }
      if (t > s.until) { s.mode = "seek"; s.until = t + 14; }
    } else if (s.mode === "seek") {
      const seats = world.spots("seat").filter((p) => !p.occupant || p.occupant === me.id);
      const near = seats.sort((a, b) => world.dist(me, a) - world.dist(me, b))[0];
      if (!near || t > s.until) { s.mode = "wander"; s.until = t + 6; }
      else if (world.goTo(me, near, 90)) { s.mode = "nap"; s.until = t + 9; me.say("Zzz...", 1.5); }
    } else {
      me.vx = 0;
      if (t > s.zz) { s.zz = t + 1.6; world.fx("zzz", me.x + 20, me.y - 100); }
      if (t > s.until) { world.leave(me); s.mode = "wander"; s.until = t + 8; }
    }
    if (Math.abs(me.vx) > 8) me.flip = me.vx < 0;
  },
  onMeet(me, world, other) {
    if (other.tags.includes("spiky")) { me.say("Eep! Pointy.", 1.5); world.leave(me); me.state.mode = "wander"; me.state.until = world.time + 6; }
    else if (other.tags.includes("bird")) { me.say("Chirp? Mine.", 1.5); world.fx("sparkle", me.x, me.y - 90); }
    else world.fx("hearts", me.x, me.y - 110);
  },
  onSignal(me, world, sig) { if (sig.kind === "tease") me.say("Hmph.", 1.2); },
  onPoke(me, world) {
    world.leave(me);
    me.vz = 420;
    me.state.mode = "wander";
    me.state.until = world.time + 5;
    me.say("Mrrp!", 1.5);
    world.fx("hearts", me.x, me.y - 110);
  },
};
