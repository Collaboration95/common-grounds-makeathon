export default {
  name: "Merlion Pup",
  tags: ["water", "lion", "puppy"],
  zone: "ground",
  size: 1,
  init(me, world) {
    me.state = { mode: "roam", tx: me.x, ty: me.y, nextRest: world.time + 1, nextHop: 0, nextSpout: world.time + 3, sprayUntil: 0, dropAt: 0, big: false, spotId: "", until: 0 };
  },
  update(me, world, dt) {
    const s = me.state, t = world.time, f = world.scene.floor;
    const ds = world.scene.depthScale;
    const scale = ds[0] + (ds[1] - ds[0]) * me.depth;
    const headY = me.y - me.z - 115 * scale;
    if (t < s.sprayUntil) {
      me.vx = 0; me.vy = 0;
      me.angle = Math.sin(t * 12) * 0.045;
      if (t >= s.dropAt) {
        const side = me.flip ? -1 : 1;
        world.fx("rain", me.x + side * 35 * scale, headY - (s.big ? 100 : 25) * scale);
        if (s.big) world.fx("sparkle", me.x + side * 65 * scale, headY - 150 * scale);
        s.dropAt = t + (s.big ? 0.15 : 0.28);
      }
      return;
    }
    me.angle = 0;
    if (s.mode === "rest") {
      me.vx = 0; me.vy = 0;
      if (t < s.until) return;
      world.leave(me);
      s.mode = "roam"; s.nextRest = t + 14; s.tx = me.x; s.ty = me.y;
    }
    if (s.mode === "visit") {
      const spot = world.spots().find(q => q.id === s.spotId);
      if (!spot || (spot.occupant && spot.occupant !== me.id) || t > s.until) {
        s.mode = "roam"; s.nextRest = t + 6;
      } else {
        if (world.goTo(me, s.spotId, 190)) {
          s.mode = "rest"; s.until = t + 4;
          me.say("Refilling my Singapore!", 2);
          world.fx("hearts", me.x, headY);
        }
        me.flip = me.vx < 0;
        return;
      }
    }
    if (t >= s.nextRest) {
      const free = world.spots("rest").filter(q => !q.occupant);
      const seats = free.length ? free : world.spots("seat").filter(q => !q.occupant);
      s.nextRest = t + 10;
      if (seats.length) {
        s.spotId = seats[Math.floor(world.random() * seats.length)].id;
        s.mode = "visit"; s.until = t + 25;
        return;
      }
    }
    const p = world.pointer;
    let target = null;
    if (p && world.dist({ x: me.x, y: headY }, p) < 360) {
      const y = Math.max(f.backY, Math.min(f.frontY, p.y + 100 * scale));
      const depth = (y - f.backY) / Math.max(1, f.frontY - f.backY);
      const left = f.backX[0] + (f.frontX[0] - f.backX[0]) * depth;
      const right = f.backX[1] + (f.frontX[1] - f.backX[1]) * depth;
      target = { x: Math.max(left + 25, Math.min(right - 25, p.x)), y };
    }
    if (!target && world.dist(me, { x: s.tx, y: s.ty }) < 35) {
      const depth = 0.08 + world.random() * 0.84;
      const left = f.backX[0] + (f.frontX[0] - f.backX[0]) * depth;
      const right = f.backX[1] + (f.frontX[1] - f.backX[1]) * depth;
      s.tx = left + (right - left) * (0.1 + world.random() * 0.8);
      s.ty = f.backY + (f.frontY - f.backY) * depth;
    }
    const distance = world.steer(me, target || { x: s.tx, y: s.ty }, target ? 190 : 115);
    if (target && distance < 55) { me.vx = 0; me.vy = 0; }
    if (me.vx || me.vy) {
      me.flip = me.vx < 0;
      me.angle = Math.sin(t * 7) * 0.09;
      if (me.z < 1 && t >= s.nextHop) { me.vz = 310; s.nextHop = t + 0.8; }
    }
    if (t >= s.nextSpout && me.z < 1) {
      s.sprayUntil = t + 1; s.dropAt = t; s.big = false;
      s.nextSpout = t + 5 + world.random() * 3;
      me.vx = 0; me.vy = 0;
    }
  },
  onPoke(me, world) {
    world.leave(me);
    const s = me.state;
    s.mode = "roam"; s.nextRest = world.time + 8;
    s.big = true; s.sprayUntil = world.time + 2; s.dropAt = world.time;
    s.nextSpout = world.time + 7;
    me.vx = 0; me.vy = 0; me.vz = 380;
    me.say("Small lion. Big plumbing!", 2.5);
    me.signal("splash");
  },
  onMeet(me, world, other) {
    const ds = world.scene.depthScale;
    const y = me.y - me.z - 115 * (ds[0] + (ds[1] - ds[0]) * me.depth);
    if (other.tags.includes("cat")) {
      me.say("Cousin! Want a shower?", 2);
      world.fx("hearts", me.x, y);
    } else if (other.tags.includes("water")) {
      me.say("Fountain friends!", 2);
      me.signal("splash", other.id);
    } else {
      me.say(other.tags.includes("food") ? "Snack after splash?" : "Look! I can fountain!", 2);
    }
    if (me.state.mode === "roam") {
      me.state.sprayUntil = Math.max(me.state.sprayUntil, world.time + 0.8);
      me.state.dropAt = world.time;
    }
  }
};
