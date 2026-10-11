export default {
  name: "Bishan Otter",
  tags: ["otter", "animal", "water", "playful"],
  zone: "ground",
  size: 1,
  init(me, world) {
    me.state = { mode: "play", restAt: world.time + 4, turnAt: 0,
      hopAt: world.time + 2, slideUntil: 0, airborne: false,
      tx: me.x, ty: me.y, side: 1, friend: "", friendUntil: 0,
      spot: "", deadline: 0, chatAt: 0 };
  },
  update(me, world, dt) {
    const s = me.state, t = world.time, f = world.scene.floor;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const floorPoint = (x, y) => {
      y = clamp(y, f.backY, f.frontY);
      const d = (y - f.backY) / Math.max(1, f.frontY - f.backY);
      const l = f.backX[0] + (f.frontX[0] - f.backX[0]) * d;
      const r = f.backX[1] + (f.frontX[1] - f.backX[1]) * d;
      return { x: clamp(x, l + (r-l)*0.06, r - (r-l)*0.06), y };
    };
    if (s.mode === "rest") {
      me.vx = 0; me.vy = 0; me.angle = 0;
      me.scale = 1 + Math.sin(t * 2) * 0.025;
      if (t < s.deadline) return;
      world.leave(me);
      s.mode = "play"; s.restAt = t + 14; s.turnAt = 0;
      me.say("Back to otter nonsense!", 2);
    }
    if (s.mode === "seek") {
      me.angle = 0; me.scale = 1;
      if (world.goTo(me, s.spot, 320)) {
        s.mode = "rest"; s.deadline = t + 4;
        me.say("Belly parking. Very important.", 2);
      } else if (t > s.deadline) {
        s.mode = "play"; s.restAt = t + 8;
      }
      return;
    }
    if (t >= s.restAt && me.z === 0 && t > s.slideUntil) {
      const free = world.spots("rest").filter(q => !q.occupant);
      const seats = free.length ? free : world.spots("seat").filter(q => !q.occupant);
      if (seats.length) {
        s.spot = seats[Math.floor(world.random() * seats.length)].id;
        s.mode = "seek"; s.deadline = t + 15;
        return;
      }
      s.restAt = t + 5;
    }
    if (s.airborne && me.z === 0 && me.vz <= 0) {
      s.airborne = false; s.slideUntil = t + 1.1;
    }
    let target = null;
    const p = world.pointer;
    if (p && world.dist(me, p) < 420) target = floorPoint(p.x, p.y);
    if (!target && t < s.friendUntil) {
      const friend = world.things().find(q => q.id === s.friend);
      if (friend && friend.zone === "ground") target = floorPoint(friend.x, friend.y);
    }
    if (!target && t > s.chatAt) {
      const animal = world.nearest(me, "animal") || world.nearest(me, "cat") || world.nearest(me, "otter");
      if (animal && animal.zone === "ground" && world.dist(me, animal) < 360) {
        s.friend = animal.id; s.friendUntil = t + 3; s.chatAt = t + 7;
        target = floorPoint(animal.x, animal.y);
      }
    }
    if (t >= s.turnAt || world.dist(me, {x:s.tx, y:s.ty}) < 25) {
      s.side = -s.side;
      let q;
      if (target) {
        q = floorPoint(target.x + s.side * 95,
          target.y + s.side * (f.frontY - f.backY) * 0.18);
      } else {
        const y = f.backY + (f.frontY-f.backY) * (0.1 + world.random()*0.8);
        const d = (y-f.backY)/Math.max(1, f.frontY-f.backY);
        const l = f.backX[0]+(f.frontX[0]-f.backX[0])*d;
        const r = f.backX[1]+(f.frontX[1]-f.backX[1])*d;
        q = floorPoint(l+(r-l)*(s.side > 0 ? 0.75 : 0.25), y);
      }
      s.tx = q.x; s.ty = q.y; s.turnAt = t + 0.8 + world.random()*0.5;
    }
    if (t >= s.hopAt && me.z === 0 && t > s.slideUntil) {
      me.vz = 420; s.airborne = true; s.hopAt = t + 3.5 + world.random()*2;
    }
    const sliding = t < s.slideUntil;
    world.steer(me, {x:s.tx, y:s.ty}, sliding ? 490 : target ? 380 : 290);
    me.flip = me.vx < 0;
    me.angle = sliding ? (me.flip ? -0.95 : 0.95) : Math.sin(t*10)*0.08;
    me.scale = sliding ? 0.88 : 1;
  },
  onMeet(me, world, other) {
    const s = me.state;
    if (s.mode !== "play" || world.time < s.chatAt) return;
    if (other.tags.some(tag => ["animal", "cat", "otter", "bird", "toy"].includes(tag))) {
      s.friend = other.id; s.friendUntil = world.time + 4;
      s.chatAt = world.time + 6; s.turnAt = 0;
      me.say("Tag! You're otter it!", 2);
      me.signal("play", other.id);
    } else if (other.tags.includes("food")) {
      me.say("Snack break after zoomies!", 2);
      s.chatAt = world.time + 6;
    }
  },
  onPoke(me, world) {
    world.leave(me);
    const s = me.state;
    s.mode = "play"; s.restAt = world.time + 8;
    s.turnAt = 0; s.airborne = true; s.slideUntil = 0;
    s.hopAt = world.time + 4;
    me.vz = 500;
    me.say("Squeak! Belly has turbo!", 2);
    const ds = world.scene.depthScale;
    world.fx("burst", me.x, me.y-me.z-140*(ds[0]+(ds[1]-ds[0])*me.depth));
  },
  onSignal(me, world, sig) {
    if (sig.kind === "play" || sig.kind === "tease") {
      if (me.state.mode !== "play") return;
      me.state.friend = sig.fromId;
      me.state.friendUntil = world.time + 3;
      me.state.turnAt = 0;
      me.say("Catch my slippery belly!", 2);
    }
  }
};
