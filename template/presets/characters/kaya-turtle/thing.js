export default {
  name: "Kaya Turtle",
  tags: ["turtle", "food", "sleepy"],
  zone: "ground",
  size: 1,
  init(me, world) {
    me.state = { mode: "roam", until: world.time + 2, target: null, seat: "", hide: 0, perk: 0, next: 0, sniff: 0, front: false };
  },
  update(me, world, dt) {
    const s = me.state, t = world.time, f = world.scene.floor;
    const ds = world.scene.depthScale;
    const head = me.y - me.z - 140 * (ds[0] + (ds[1] - ds[0]) * me.depth);
    me.vx = 0; me.vy = 0;
    if (t < s.hide) {
      me.scale += (0.62 - me.scale) * Math.min(1, dt * 10);
      me.angle = 0;
      return;
    }
    me.scale += (1 - me.scale) * Math.min(1, dt * 5);
    const p = world.pointer;
    if (p && world.dist({ x: me.x, y: head + 55 }, p) < 140 && t > s.next) {
      me.say("Five more crumbs...", 2);
      world.fx("zzz", me.x, head);
      s.next = t + 9;
    }
    if (s.mode === "sit") {
      me.angle = Math.sin(t * 1.4) * 0.025;
      if (t > s.next) { world.fx("zzz", me.x, head); s.next = t + 4; }
      if (t >= s.until) {
        world.leave(me);
        s.mode = "roam"; s.until = t + 14; s.target = null;
      }
      return;
    }
    if (s.mode === "seat") {
      const seat = world.spots("seat").find(q => q.id === s.seat);
      if (!seat || (seat.occupant && seat.occupant !== me.id) || t > s.until) {
        s.mode = "roam"; s.until = t + 8; s.target = null;
      } else if (world.goTo(me, s.seat, 48)) {
        s.mode = "sit"; s.until = t + 12; s.next = t + 3;
        me.say("Breakfast needs a chair.", 3);
      }
    } else {
      if (t >= s.until) {
        const seats = world.spots("seat").filter(q => !q.occupant);
        if (seats.length) {
          s.seat = seats.reduce((best, q) => world.dist(me, q) < world.dist(me, best) ? q : best).id;
          s.mode = "seat"; s.until = t + 80;
        } else s.until = t + 8;
      }
      const warm = world.nearest(me, "warm"), food = world.nearest(me, "food");
      const treat = warm && world.dist(me, warm) < 260 ? warm : food && world.dist(me, food) < 220 ? food : null;
      if (treat && t > s.sniff) { s.perk = t + 4; s.sniff = t + 14; }
      if (treat && t < s.perk) {
        if (world.dist(me, treat) > 85) world.steer(me, treat, 42);
        me.angle = Math.sin(t * 5) * 0.06;
      } else {
        if (!s.target || world.dist(me, s.target) < 18) {
          s.front = !s.front;
          const depth = s.front ? 0.65 + world.random() * 0.3 : 0.05 + world.random() * 0.3;
          const left = f.backX[0] + (f.frontX[0] - f.backX[0]) * depth;
          const right = f.backX[1] + (f.frontX[1] - f.backX[1]) * depth;
          s.target = { x: left + (right - left) * (0.1 + world.random() * 0.8), y: f.backY + (f.frontY - f.backY) * depth };
        }
        world.steer(me, s.target, 19);
        me.angle = Math.sin(t * 2.1) * 0.055;
      }
    }
    if (me.vx) me.flip = me.vx < 0;
  },
  onPoke(me, world) {
    me.state.hide = world.time + 3.5;
    me.vx = 0; me.vy = 0;
    me.say("Closed for butter maintenance.", 3);
  },
  onMeet(me, world, other) {
    if (world.time < me.state.hide) return;
    if (other.tags.includes("warm") || other.tags.includes("food")) {
      me.state.perk = world.time + 5;
      me.say("You smell like morning.", 2.5);
      me.signal("cozy", other.id);
      const ds = world.scene.depthScale;
      world.fx("hearts", me.x, me.y - me.z - 140 * (ds[0] + (ds[1] - ds[0]) * me.depth));
    } else if (other.tags.includes("cat") || other.tags.includes("bird")) {
      me.say("Shell. Not a sandwich.", 2.5);
    } else me.say("Slow company is good company.", 2.5);
  },
  onSignal(me, world, sig) {
    if (sig.kind === "cozy" || sig.kind === "warm" || sig.kind === "food") {
      me.state.perk = world.time + 5;
      me.say("Save me a warm crumb.", 2);
    }
  }
};
