export default {
  name: "Rolling Durian",
  tags: ["food", "spiky"],
  zone: "ground",
  size: 1,
  init(me, world) {
    me.state.hop = 2 + world.random() * 3;
    me.state.tx = 300 + world.random() * 900;
    me.state.ty = world.scene.floor.backY + 120 + world.random() * 100;
  },
  update(me, world, dt) {
    const s = me.state, p = world.pointer;
    const fl = world.scene.floor;
    if (p && world.dist(me, { x: p.x, y: me.y - 40 }) < 220) {
      // rolls away from the cursor, in x and in depth
      const dx = me.x - p.x, dy = me.y - (p.y + 40);
      const d = Math.hypot(dx, dy) || 1;
      me.vx = (dx / d) * 260;
      me.vy = (dy / d) * 150;
      if (me.z === 0 && (me.x < 90 || me.x > world.width - 90)) { me.vz = 520; me.vx = -Math.sign(dx || 1) * 320; }
    } else {
      if (world.steer(me, { x: s.tx, y: s.ty }, 55) < 20) {
        s.tx = 200 + world.random() * 1200;
        s.ty = fl.backY + 40 + world.random() * (fl.frontY - fl.backY - 80);
      }
    }
    me.flip = me.vx < 0;
    me.angle += (me.vx * dt) / 44;
    s.hop -= dt;
    if (s.hop <= 0) { s.hop = 3 + world.random() * 4; if (me.z === 0) me.vz = 300; }
  },
  onMeet(me, world, other) {
    if (other.tags.includes("cat")) { me.say("Don't sniff me!", 1.5); me.vz = 420; world.fx("burst", me.x, me.y - 60); }
  },
  onPoke(me, world) {
    me.say("Wah, don't touch!", 2);
    world.fx("burst", me.x, me.y - 60);
    me.vz = 450;
    me.vx = (world.random() - 0.5) * 500;
  },
};
