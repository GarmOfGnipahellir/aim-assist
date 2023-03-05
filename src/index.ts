import { Pane } from "tweakpane";
import { CanvasSpace, Pt, Group, Line } from "pts";
import Complex from "complex.js";

const RED = "#f23"
const GREEN = "#6f6"

const PARAMS = {
  outMin: 0.4,
  outMax: 0.6,
};

const pane = new Pane({ title: "Parameters" });
pane.addInput(PARAMS, "outMin", { min: 0.0, max: 1.0 });
pane.addInput(PARAMS, "outMax", { min: 0.0, max: 1.0 });

const space = new CanvasSpace("#main");
space.setup({ bgcolor: "#111", resize: true });
const form = space.getForm();

const TARGETS: { position: Pt; radius: number }[] = [];
let pendingTarget: { position: Pt; radius: number } | null = null;

space.add({
  animate: () => {
    const canvasRadius = Math.sqrt(
      space.center.x * space.center.x + space.center.y * space.center.y
    );

    form.fillOnly(RED);
    for (const target of TARGETS) {
      form.point(target.position, target.radius, "circle");
    }
    if (pendingTarget) {
      form
        .strokeOnly(RED)
        .point(pendingTarget.position, pendingTarget.radius, "circle");
      form
        .strokeOnly(RED)
        .dash()
        .line(new Group(pendingTarget.position, space.pointer));
    }

    form.strokeOnly("#222");
    for (let a = 0; a < Math.PI * 2; a += Math.PI * 0.25) {
      form.line(
        new Group(new Pt(), new Pt(0, canvasRadius))
          .moveTo(space.center)
          .rotate2D(a)
      );
    }
    form.point(
      space.center,
      Math.min(space.center.x, space.center.y) * PARAMS.outMin,
      "circle"
    );
    form.point(
      space.center,
      Math.min(space.center.x, space.center.y) * PARAMS.outMax,
      "circle"
    );

    let delta = space.pointer.$subtract(space.center);
    let inputAngle = Math.atan2(delta.y, delta.x);
    let outputAngle = inputAngle + 0.1;
    form
      .strokeOnly(GREEN)
      .dash()
      .line(Line.fromAngle(space.center, inputAngle, canvasRadius));
    form
      .strokeOnly("#fff")
      .dash(false)
      .line(Line.fromAngle(space.center, outputAngle, canvasRadius));
  },
  action(type, px, py, evt) {
    if (type == "down" && !pendingTarget) {
      pendingTarget = { position: new Pt(px, py), radius: 0.0 };
    }
    if (type == "drag" && pendingTarget) {
      pendingTarget.radius = new Pt(px, py)
        .subtract(pendingTarget.position)
        .magnitude();
    }
    if (type == "drop" && pendingTarget) {
      if (pendingTarget.radius > 5) {
        TARGETS.push(pendingTarget);
      }
      pendingTarget = null;
    }
  },
});

space.bindMouse().play();
