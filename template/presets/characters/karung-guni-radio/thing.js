export default {
  name: "Karung Guni Radio",
  tags: ["music", "retro", "rescued"],
  zone: "air",
  size: 1,
  init(me, world) {
    me.state = { phase: world.random() * 6.28, mode: "float", next: world.time + 12, tune: world.time + 3, spot: "", deadline: 0, staticUntil: 0, pointerUntil: 0, line: 0 };
  },
  update(me, world, dt) {
    const s = me.state, t = world.time, a = world.scene.air, p = world.pointer;
    s.phase += dt * 0.32;
    if (t < s.staticUntil) {
      me.angle = Math.sin(t * 38) * 0.18;
      world.steer(me, { x: world.width * 0.5 + Math.cos(s.phase) * world.width * 0.36, y: a.top + (a.bottom - a.top) * (0.5 + 0.46 * Math.sin(s.phase * 2)) }, 170);
      me.flip = me.vx < 0;
      return;
    }
    if (p && world.dist(me, p) < 180 && t > s.pointerUntil) {
      me.say("You have excellent reception!", 2);
      world.fx("sparkle", me.x, me.y - 45);
      s.pointerUntil = t + 9;
      s.tune = t + 4;
    }
    if (s.mode === "listen") {
      me.angle = Math.sin(t * 2.5) * 0.035;
      if (t >= s.next) {
        world.leave(me);
        s.mode = "float";
        s.spot = "";
        s.next = t + 16;
        me.say("Back on air!", 2);
      }
      return;
    }
    if (s.mode === "approach") {
      const perch = world.spots("perch").find(q => q.id === s.spot);
      if (!perch || (perch.occupant && perch.occupant !== me.id) || t > s.deadline) {
        s.mode = "float";
        s.spot = "";
        s.next = t + 7;
      } else {
        if (world.goTo(me, s.spot, 100)) {
          s.mode = "listen";
          s.next = t + 7;
          me.say("Shh. Listening to the neighbourhood.", 3);
        }
        me.angle = Math.sin(t * 2) * 0.08;
        me.flip = me.vx < 0;
        return;
      }
    }
    const target = {
      x: world.width * (0.5 + 0.39 * Math.cos(s.phase)),
      y: a.top + (a.bottom - a.top) * (0.5 + 0.47 * Math.sin(s.phase * 2))
    };
    world.steer(me, target, 105);
    me.angle = Math.sin(t * 2.6) * 0.08 + me.vx / 1100;
    me.flip = me.vx < 0;
    if (t >= s.tune) {
      const lyrics = ["Karung guni! Old treasures, new tunes!", "Tin tin! Still got swing!", "Old radio, young at heart!"];
      me.say(lyrics[s.line % lyrics.length], 3);
      s.line += 1;
      s.tune = t + 8 + world.random() * 4;
      me.signal("music");
    }
    if (t >= s.next) {
      const free = world.spots("perch").filter(q => !q.occupant);
      if (free.length) {
        const high = free.filter(q => q.y <= a.top + (a.bottom - a.top) * 0.6);
        const choices = high.length ? high : free;
        s.spot = choices[Math.floor(world.random() * choices.length)].id;
        s.mode = "approach";
        s.deadline = t + 20;
      }
      s.next = t + 10;
    }
  },
  onPoke(me, world) {
    world.leave(me);
    me.state.mode = "float";
    me.state.spot = "";
    me.state.staticUntil = world.time + 1.2;
    me.state.next = world.time + 10;
    me.state.tune = world.time + 5;
    me.say("Krrrsh! That's my tickle frequency!", 3);
    world.fx("burst", me.x, me.y - 35);
    me.signal("static");
  },
  onMeet(me, world, other) {
    if (other.tags.includes("bird")) {
      me.say("Duet? You take the high notes!", 3);
      me.signal("music", other.id);
    } else if (other.tags.includes("cat")) {
      me.say("Purr FM. My favourite station.", 3);
      world.fx("hearts", me.x, me.y - 40);
    } else if (other.tags.includes("food")) {
      me.say("Lunch break on the air!", 2);
    } else {
      me.say("One owner's junk, everyone's jukebox!", 3);
      me.signal("hello", other.id);
    }
    me.state.tune = world.time + 7;
  },
  onSignal(me, world, sig) {
    if (sig.kind === "music" || sig.kind === "hello") {
      me.say("La la! Request received!", 2);
      world.fx("sparkle", me.x, me.y - 40);
      me.state.tune = world.time + 5;
    }
  }
};
