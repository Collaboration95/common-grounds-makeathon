export default {
  name: "Left-Side Rain",
  tags: ["weather", "wet"],
  zone: "air",
  size: 2,
  update(me, world, dt) {
    const s = me.state;
    s.t = (s.t || 0) + dt;
    const a = world.scene.air;
    world.steer(me, { x: 450 + Math.sin(s.t * 0.3) * 320, y: a.top + 40 + Math.sin(s.t * 0.7) * 25 }, 90);
    if (me.x < world.width / 2) world.fx("rain", me.x + (world.random() - 0.5) * 140, me.y + 60);
  },
  onMeet(me, world, other) { if (other.tags.includes("hat")) { me.say("Soggy hat!", 1.5); me.signal("wet", other.id); } },
  onPoke(me, world) {
    me.say("Drip drip!", 1.5);
    world.fx("burst", me.x, me.y + 40);
  },
};
