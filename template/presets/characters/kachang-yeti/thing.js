export default {
  name: "Kachang Yeti",
  tags: ["food", "ice", "cold", "yeti"],
  zone: "ground",
  size: 2,
  init(me, world) {
    me.state = { mode: "roam", until: world.time + 7, target: null, spot: "", nextFx: 0, nextHello: 0, shake: 0, seekUntil: 0 };
  },
  update(me, world, dt) {
    const s = me.state, t = world.time, f = world.scene.floor;
    const ds = world.scene.depthScale;
    const head = me.y - me.z - 190 * (ds[0] + (ds[1] - ds[0]) * me.depth);
    const warm = world.nearest(me, "warm");
    const hot = warm && world.dist(me, warm) < 230;
    const p = world.pointer;
    const curious = p && world.dist({ x: me.x, y: head + 65 }, p) < 170;
    if (hot && t > s.nextFx) {
      world.fx("rain", me.x, head + 45);
      s.nextFx = t + 1.3;
      if (t > s.nextHello) {
        me.say("I'm becoming dessert soup!", 3);
        s.nextHello = t + 9;
      }
    }
    if (s.mode === "rest") {
      me.vx = 0; me.vy = 0;
      if (t > s.until || hot) {
        world.leave(me);
        s.mode = "roam"; s.until = t + 8; s.target = null;
      }
    }
    if (s.mode === "seek") {
      const q = world.spots().find(q => q.id === s.spot);
      if (!q || (q.occupant && q.occupant !== me.id) || t > s.seekUntil) {
        s.mode = "roam"; s.until = t + 5; s.target = null;
      } else if (world.goTo(me, s.spot, 42)) {
        s.mode = "rest"; s.until = t + 7;
        me.say("Shade is my happy place.", 3);
        world.fx("sparkle", me.x, head);
      }
    }
    if (s.mode === "roam") {
      if (!s.target) {
        const d = world.random();
        const y = f.backY + (f.frontY - f.backY) * (0.08 + 0.84 * d);
        const left = f.backX[0] + (f.frontX[0] - f.backX[0]) * d;
        const right = f.backX[1] + (f.frontX[1] - f.backX[1]) * d;
        s.target = { x: left + (right - left) * (0.12 + 0.76 * world.random()), y };
      }
      if (world.steer(me, s.target, hot ? 55 : 32) < 15) s.target = null;
      if (t > s.until) {
        const free = world.spots().filter(q => (q.kind === "rest" || q.kind === "seat") && !q.occupant);
        const shady = free.filter(q => q.tags.includes("shade") || q.tags.includes("cool"));
        const pool = shady.length ? shady : free.filter(q => !q.tags.includes("warm") && !q.tags.includes("sunny"));
        if (pool.length) {
          s.spot = pool[Math.floor(world.random() * pool.length)].id;
          s.mode = "seek"; s.seekUntil = t + 35;
        }
        s.until = t + 8;
      }
    }
    if (curious && t > s.nextHello) {
      me.say("Gentle! The corn tickles.", 2.5);
      s.shake = t + 1.1; s.nextHello = t + 7;
    }
    const moving = Math.abs(me.vx) + Math.abs(me.vy) > 2;
    me.angle = t < s.shake ? Math.sin(t * 25) * 0.14 : s.mode === "rest" ? Math.sin(t * 14) * 0.035 : moving ? Math.sin(t * 3) * 0.085 : 0;
    me.scale = hot ? 0.96 + Math.sin(t * 2) * 0.015 : 1;
    if (moving) me.flip = me.vx < 0;
  },
  onPoke(me, world) {
    me.state.shake = world.time + 1.5;
    me.say("Extra toppings! No extra charge.", 3);
    const ds = world.scene.depthScale;
    const h = me.y - me.z - 180 * (ds[0] + (ds[1] - ds[0]) * me.depth);
    world.fx("sparkle", me.x - 45, h);
    world.fx("burst", me.x, h + 30);
    world.fx("sparkle", me.x + 45, h);
    me.signal("brainfreeze");
  },
  onMeet(me, world, other) {
    if (other.tags.includes("warm")) {
      me.say("You make me puddle.", 2.5);
      world.fx("rain", me.x, me.y - me.z - 120);
      me.state.until = world.time;
      me.signal("cooldown", other.id);
    } else if (other.tags.includes("food")) {
      me.say("Dessert family reunion!", 2.5);
      world.fx("hearts", me.x, me.y - me.z - 160);
    } else {
      me.say(other.tags.includes("cat") ? "No licking the syrup!" : "Want a little rainbow?", 2.5);
      me.state.shake = world.time + 0.8;
      me.signal("hello", other.id);
    }
  }
};
