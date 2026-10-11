export default {
  name: "Too Cool Durian",
  tags: ["food", "spiky", "cool"],
  zone: "ground",
  size: 1,
  init(me, world) {
    me.state = { mode: "roam", until: world.time + 7, tx: me.x, ty: me.y, spot: "", pose: 0, pointerAt: 0, hopAt: 0 };
  },
  update(me, world, dt) {
    const s = me.state, t = world.time, f = world.scene.floor;
    const ds = world.scene.depthScale;
    const head = me.y - me.z - 140 * (ds[0] + (ds[1] - ds[0]) * me.depth);
    const p = world.pointer;
    if (p && world.dist({ x: me.x, y: head + 45 }, p) < 170 && t > s.pointerAt) {
      s.pointerAt = t + 6;
      s.pose = t + 1.8;
      me.say("Cool outside. Funky inside.", 2.5);
      world.fx("sparkle", me.x, head);
    }
    if (t < s.pose) {
      me.vx = 0; me.vy = 0;
      me.angle = Math.sin((s.pose - t) * 4) * 0.3;
      me.scale = 1.08;
      me.anim = "action";
      return;
    }
    me.scale = 1;
    me.anim = null;
    me.angle = Math.sin(t * 3.5) * 0.12;
    if (s.mode === "roam") {
      if (world.steer(me, { x: s.tx, y: s.ty }, 85) < 18) {
        const depth = world.random();
        s.ty = f.backY + (f.frontY - f.backY) * depth;
        const l = f.backX[0] + (f.frontX[0] - f.backX[0]) * depth;
        const r = f.backX[1] + (f.frontX[1] - f.backX[1]) * depth;
        s.tx = l + (r - l) * (0.1 + world.random() * 0.8);
      }
      if (t > s.hopAt && me.z === 0) {
        me.vz = 210; s.hopAt = t + 1.4;
      }
      if (t > s.until) {
        const spots = world.spots().filter(q => !q.occupant && (q.kind === "rest" || q.kind === "seat" || q.kind === "table"));
        if (spots.length) {
          s.spot = spots[Math.floor(world.random() * spots.length)].id;
          s.mode = "approach"; s.until = t + 12;
        } else s.until = t + 5;
      }
    } else if (s.mode === "approach") {
      if (world.goTo(me, s.spot, 100)) {
        s.mode = "lounge"; s.until = t + 5;
        me.say("VIP. Very Important Produce.", 2.5);
        world.fx("sparkle", me.x, head);
      } else if (t > s.until) {
        world.leave(me); s.mode = "roam"; s.until = t + 6;
      }
    } else {
      me.vx = 0; me.vy = 0;
      me.anim = "sit";
      me.angle = 0.22 + Math.sin(t * 2) * 0.06;
      if (t > s.until) {
        world.leave(me); s.mode = "roam"; s.until = t + 8;
        s.tx = me.x; s.ty = me.y;
      }
    }
    if (Math.abs(me.vx) > 1) me.flip = me.vx < 0;
  },
  onMeet(me, world, other) {
    if (world.time < me.state.pose) return;
    me.state.pose = world.time + 1.4;
    me.flip = other.x < me.x;
    me.say(other.tags.includes("food") ? "Fresh squad, assemble!" : "Admire from a safe distance.", 2);
    me.signal("cool", other.id);
    const ds = world.scene.depthScale;
    world.fx("sparkle", me.x, me.y - me.z - 140 * (ds[0] + (ds[1] - ds[0]) * me.depth));
  },
  onPoke(me, world) {
    world.leave(me);
    me.state.mode = "roam";
    me.state.until = world.time + 7;
    me.state.pose = world.time + 1.2;
    me.vz = 450;
    me.say("These spikes are designer.", 2.5);
    const ds = world.scene.depthScale;
    world.fx("burst", me.x, me.y - me.z - 140 * (ds[0] + (ds[1] - ds[0]) * me.depth));
  }
};
