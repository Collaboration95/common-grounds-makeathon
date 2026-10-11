export default {
  name: "Auntie's Trolley",
  tags: ["trolley", "market", "collector"],
  zone: "ground",
  size: 1,
  init(me, world) {
    me.state = { mode: "roam", tx: me.x, ty: me.y, route: 0,
      restAt: world.time + 3, until: 0, spot: "", target: "",
      collected: [], seekAt: 0, pokeUntil: 0, pointerAt: 0 };
    me.say("Market waits for no auntie!", 3);
  },
  update(me, world, dt) {
    const s = me.state, t = world.time, f = world.scene.floor;
    const ds = world.scene.depthScale;
    const head = me.y - me.z - 140 * (ds[0] + (ds[1] - ds[0]) * me.depth);
    if (t < s.pokeUntil) {
      me.vx = 0; me.vy = 0;
      me.angle = Math.sin((s.pokeUntil - t) * 24) * 0.28;
      me.scale = 1 + Math.sin((s.pokeUntil - t) * 18) * 0.06;
      return;
    }
    me.scale = 1;
    const p = world.pointer;
    if (p && world.dist({ x: me.x, y: head }, p) < 150 && t > s.pointerAt) {
      s.pointerAt = t + 7;
      me.say("Carry your own groceries, ah!", 2.5);
      world.fx("burst", me.x, head);
      if (s.mode === "roam") { s.mode = "pause"; s.until = t + 1.2; }
    }
    if (s.mode === "pause" || s.mode === "rest") {
      me.vx = 0; me.vy = 0; me.angle = 0;
      if (t < s.until) return;
      world.leave(me);
      s.mode = "roam"; s.target = "";
    }
    if (s.mode === "spot") {
      const q = world.spots().find(q => q.id === s.spot);
      if (!q || (q.occupant && q.occupant !== me.id) || t > s.until) {
        s.mode = "roam"; s.restAt = t + 10;
      } else if (world.goTo(me, s.spot, 120)) {
        s.mode = "rest"; s.until = t + 4; s.restAt = t + 20;
        me.say("Auntie needs kopi break.", 2.5);
        me.vx = 0; me.vy = 0;
      }
    }
    if (s.mode === "roam") {
      if (t > s.restAt) {
        const free = world.spots().filter(q => (q.kind === "rest" || q.kind === "table" || q.kind === "seat") && !q.occupant);
        s.restAt = t + 10;
        if (free.length) {
          s.spot = free[Math.floor(world.random() * free.length)].id;
          s.mode = "spot"; s.until = t + 30; s.target = "";
        }
      }
      if (s.mode === "roam") {
        if (t > s.seekAt && !s.target) {
          s.seekAt = t + 2;
          const food = world.nearest(me, "food"), hat = world.nearest(me, "hat");
          const choices = [food, hat].filter(q => q && !s.collected.includes(q.id));
          choices.sort((a, b) => world.dist(me, a) - world.dist(me, b));
          if (choices.length) { s.target = choices[0].id; s.until = t + 8; }
        }
        const item = s.target ? world.things().find(q => q.id === s.target) : null;
        if (item && t < s.until) {
          world.steer(me, item, 100);
          if (world.dist(me, item) < 105) {
            // Collection is a polite claim: other cutouts remain independent.
            s.collected.push(item.id);
            if (s.collected.length > 16) s.collected.shift();
            me.signal("collect", item.id);
            me.say("This one is for later.", 2.5);
            world.fx("sparkle", me.x, head);
            s.target = ""; s.mode = "pause"; s.until = t + 2.5;
            s.seekAt = t + 6; me.vx = 0; me.vy = 0;
          }
        } else {
          s.target = "";
          if (world.steer(me, { x: s.tx, y: s.ty }, 75) < 25) {
            s.route = 1 - s.route;
            const depth = s.route ? 0.8 : 0.2;
            s.ty = f.backY + (f.frontY - f.backY) * depth;
            const left = f.backX[0] + (f.frontX[0] - f.backX[0]) * depth;
            const right = f.backX[1] + (f.frontX[1] - f.backX[1]) * depth;
            s.tx = left + (right - left) * (0.15 + world.random() * 0.7);
          }
        }
      }
    }
    me.flip = me.vx < 0;
    me.angle = Math.abs(me.vx) + Math.abs(me.vy) > 5 ? Math.sin(t * 8) * 0.055 : 0;
  },
  onMeet(me, world, other) {
    if (other.tags.includes("food") || other.tags.includes("hat")) {
      if (!me.state.collected.includes(other.id)) {
        me.state.seekAt = 0;
        me.say("Got offer or not?", 2);
      }
    } else if (other.tags.includes("cat")) {
      me.say("No fish for you yet!", 2);
      me.signal("hello", other.id);
    } else {
      me.say("Make way, market express!", 2);
    }
  },
  onPoke(me, world) {
    world.leave(me);
    me.state.mode = "roam";
    me.state.pokeUntil = world.time + 1.6;
    me.vx = 0; me.vy = 0; me.vz = 260;
    me.say("Wheels spinning! Auntie still loading!", 2.5);
    me.signal("rattle");
    const ds = world.scene.depthScale;
    world.fx("burst", me.x, me.y - me.z - 140 * (ds[0] + (ds[1] - ds[0]) * me.depth));
  }
};
