// Deliberately broken: throws after 3s so the engine quarantines it ("resting...").
export default {
  name: "Brittle Lantern",
  tags: ["light"],
  zone: "ground",
  size: 1,
  init(me) {
    me.state.t = 0;
  },
  update(me, world, dt) {
    me.state.t += dt;
    me.angle = Math.sin(me.state.t * 3) * 0.08;
    world.fx("sparkle", me.x, me.y - 70);
    if (me.state.t > 3) throw new Error("lantern wick snapped");
  },
};
