export default {
  name: "Rolling Durian",
  tags: ["food", "spiky"],
  zone: "ground",
  size: 1,
  init(me, world) {
    me.state.mode = "roam";
    me.state.until = 4;
    me.state.tx = me.x;
    me.state.ty = me.y;
    me.state.spot = "";
  },
  update(me, world, dt) {
    const s = me.state, t = world.time, p = world.pointer, f = world.scene.floor;
    if (p && world.dist(me, p) < 200) {
      // scared of the cursor: roll away in x AND in depth (y); hop off the table first
      world.leave(me);
      const d = world.dist(me, p) || 1;
      me.vx = ((me.x - p.x) / d) * 260;
      me.vy = ((me.y - p.y) / d) * 160;
      s.mode = "roam";
      s.until = t + 5;
    } else if (s.mode === "roam") {
      // wander the whole floor, front to back
      if (world.steer(me, { x: s.tx, y: s.ty }, 60) < 20) {
        s.tx = 120 + world.random() * (world.width - 240);
        s.ty = f.backY + 30 + world.random() * (f.frontY - f.backY - 60);
      }
      if (t > s.until) {
        const free = world.spots("table").filter((q) => !q.occupant);
        s.spot = free.length ? free[Math.floor(world.random() * free.length)].id : ""; // pick once
        if (s.spot) s.mode = "stall"; else s.until = t + 5;
      }
    } else if (s.mode === "stall") {
      if (world.goTo(me, s.spot, 80)) { s.mode = "sit"; s.until = t + 6; me.say("Fresh durian!", 2); }
    } else if (t > s.until) {
      world.leave(me); // done sitting on the table
      s.mode = "roam";
      s.until = t + 8;
    }
    me.flip = me.vx < 0;
    if (!me.spot) me.angle += (me.vx * dt) / 44; // rolling
  },
  onMeet(me, world, other) {
    if (other.tags.includes("cat")) {
      me.say("Don't sniff me!", 1.5);
      me.vz = 450; // hop
      me.signal("stinky", other.id);
      world.fx("burst", me.x, me.y - me.z - 60);
    }
  },
  onPoke(me, world) {
    me.say("Wah, don't touch!", 2);
    me.vz = 500;
    world.fx("burst", me.x, me.y - me.z - 60);
  },
};
