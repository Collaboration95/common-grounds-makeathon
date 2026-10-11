export default {
  name: "Red Fez",
  tags: ["hat", "red"],
  zone: "ground",
  size: 1,
  init(me, world) { me.state.tx = me.x; me.state.ty = me.y; },
  update(me, world, dt) {
    const s = me.state;
    s.t = (s.t || 0) + dt;
    me.scale = 1 + Math.sin(s.t * 2) * 0.03;
    if (world.steer(me, { x: s.tx, y: s.ty }, 40) < 15) {
      const fl = world.scene.floor;
      s.tx = 150 + world.random() * 1300;
      s.ty = fl.backY + 30 + world.random() * (fl.frontY - fl.backY - 60);
    }
    me.flip = me.vx < 0;
  },
  onMeet(me, world, other) { me.say("Oh, hello.", 1.5); },
  onSignal(me, world, sig) { if (sig.kind === "tease") me.say("Leave me alone!", 1.5); },
  onPoke(me, world) {
    me.say("Oi! Mind the tassel.", 2);
    world.fx("sparkle", me.x, me.y - 80);
    me.vz = 450;
  },
};
