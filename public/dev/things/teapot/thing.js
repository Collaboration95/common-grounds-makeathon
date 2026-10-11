export default {
  name: "Steamy Teapot",
  tags: ["warm", "tea"],
  zone: "ground",
  size: 1,
  init(me, world) { me.state.hello = 0; },
  update(me, world, dt) {
    const s = me.state;
    s.t = (s.t || 0) + dt;
    s.puff = (s.puff || 0) - dt;
    // lives on a table; strolls to the next one now and then
    const tables = world.spots("table");
    if (!s.go || world.time > s.until) { s.go = tables[Math.floor(world.random() * tables.length)]; s.until = world.time + 16; world.leave(me); }
    if (s.go && !world.goTo(me, s.go, 60)) me.flip = me.vx < 0;
    const near = world.nearby(me, 260)[0];
    const p = world.pointer;
    if (near || (p && world.dist(me, p) < 260)) {
      if (s.puff <= 0) { s.puff = 0.12; world.fx("steam", me.x + 18, me.y - me.z - 110); }
      me.angle = Math.sin(s.t * 9) * 0.04;
    } else me.angle *= 0.9;
  },
  onMeet(me, world, other) { me.say("Tea?", 1.5); me.signal("teatime"); },
  onPoke(me, world) {
    me.say("Tea's ready!", 2);
    me.vz = 380;
    world.fx("steam", me.x + 18, me.y - 110);
    world.fx("burst", me.x, me.y - 60);
  },
};
