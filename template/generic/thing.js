// Generic behaviour for any sprite-sheet character; drives every action in template/ACTION_MAP.md via me.anim.
export default {
  name: "NAME_HERE",
  tags: ["critter", "friend"],
  zone: "ground",
  size: 1,
  init(me, world) {
    me.state = { mode: "wander", until: world.time + 3, target: null, seat: "", act: 0, hop: 0, next: world.time + 6, meet: 0 };
  },
  update(me, world, dt) {
    const s = me.state, t = world.time, f = world.scene.floor, ds = world.scene.depthScale;
    const head = me.y - me.z - 140 * (ds[0] + (ds[1] - ds[0]) * me.depth);
    me.vx = 0; me.vy = 0;
    if (t < s.act) { me.anim = "action"; me.angle = Math.sin(t * 20) * 0.05; return; }
    me.angle = 0;
    if (s.mode === "sit" || s.mode === "sleep") {
      me.anim = s.mode;
      if (s.mode === "sit" && t > s.next) { s.mode = "sleep"; s.until = t + 7; s.next = t + 30; }
      if (s.mode === "sleep" && t > s.next - 23) world.fx("zzz", me.x, head);
      if (t >= s.until) { world.leave(me); s.mode = "wander"; s.until = t + 8 + world.random() * 6; s.target = null; me.anim = null; }
      return;
    }
    if (s.mode === "seat") {
      me.anim = null;
      const seat = world.spots("seat").find((q) => q.id === s.seat);
      if (!seat || (seat.occupant && seat.occupant !== me.id) || t > s.until) { s.mode = "wander"; s.until = t + 8; }
      else if (world.goTo(me, s.seat, 55)) { s.mode = "sit"; s.until = t + 12; s.next = t + 6; }
      if (me.vx) me.flip = me.vx < 0;
      return;
    }
    if (s.mode === "idle") {
      me.anim = "idle";
      if (t >= s.until) { s.mode = "wander"; s.until = t + 8 + world.random() * 6; me.anim = null; }
      return;
    }
    // wander in depth
    if (t >= s.until) {
      const r = world.random();
      const seats = world.spots("seat").filter((q) => !q.occupant);
      if (r < 0.4 && seats.length) { s.seat = seats[Math.floor(world.random() * seats.length)].id; s.mode = "seat"; s.until = t + 40; }
      else if (r < 0.65) { s.mode = "idle"; s.until = t + 2 + world.random() * 2; }
      else s.until = t + 6 + world.random() * 6;
    }
    if (me.z === 0 && t > s.hop) { s.hop = t + 5 + world.random() * 6; me.vz = 380; }
    me.anim = me.z > 4 ? "fly" : "walk";
    if (!s.target || world.dist(me, s.target) < 16) {
      const d = world.random(), l = f.backX[0] + (f.frontX[0] - f.backX[0]) * d, r2 = f.backX[1] + (f.frontX[1] - f.backX[1]) * d;
      s.target = { x: l + (r2 - l) * (0.1 + world.random() * 0.8), y: f.backY + (f.frontY - f.backY) * d };
    }
    world.steer(me, s.target, 45);
    if (me.vx) me.flip = me.vx < 0;
  },
  onPoke(me, world) {
    me.state.act = world.time + 1.2;
    me.vx = 0; me.vy = 0;
    if (me.state.mode === "sit" || me.state.mode === "sleep") { world.leave(me); me.state.mode = "wander"; me.state.until = world.time + 6; }
    const ds = world.scene.depthScale;
    world.fx("burst", me.x, me.y - me.z - 100 * (ds[0] + (ds[1] - ds[0]) * me.depth));
    me.say("Ta-da!", 2);
  },
  onMeet(me, world, other) {
    const s = me.state;
    if (world.time < s.meet) return;
    s.meet = world.time + 12;
    const ds = world.scene.depthScale, head = me.y - me.z - 140 * (ds[0] + (ds[1] - ds[0]) * me.depth);
    if (s.mode === "wander" && world.random() < 0.5) { s.act = world.time + 1.2; world.fx("burst", me.x, head); me.say("Watch this!", 2); }
    else { world.fx("hearts", me.x, head); me.say(world.random() < 0.5 ? "Hello, friend!" : "Nice to meet you!", 2); }
  },
};
