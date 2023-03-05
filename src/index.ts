import { Pane } from "tweakpane";
import { CanvasSpace, Pt, Group, Line, Circle, Num } from "pts";
import { CanvasTarget } from "./target";
import transform from "./transformer";

const RED = "#f23";
const GREEN = "#6f6";

export const PARAMS = {
  outMin: 0.4,
  outMax: 0.6,
  resolution: 360,
};

const pane = new Pane({ title: "Parameters" });
pane.addInput(PARAMS, "outMin", { min: 0.0, max: 1.0 });
pane.addInput(PARAMS, "outMax", { min: 0.0, max: 1.0 });
pane.addInput(PARAMS, "resolution", { min: 0, max: 1000, step: 10 });

export const space = new CanvasSpace("#main");
space.setup({ bgcolor: "#111", resize: true });
const form = space.getForm();

export const TARGETS: CanvasTarget[] = [];
let pendingTarget: CanvasTarget | null = null;

space.add({
  animate: () => {
    const canvasRadius = space.center.magnitude();
    const canvasHalfMin = Math.min(space.center.x, space.center.y);

    for (const target of TARGETS) {
      let circle = target.toCircle();
      form.fillOnly(RED).circle(circle);
      if (Circle.withinBound(circle, space.pointer)) {
        let angleTarget = target.toAngleTarget();
        form
          .strokeOnly(RED)
          .dash()
          .line(
            Line.fromAngle(space.center, angleTarget.start() * (Math.PI * 2), canvasRadius)
          );
        form
          .strokeOnly(RED)
          .dash()
          .line(Line.fromAngle(space.center, angleTarget.end() * (Math.PI * 2), canvasRadius));
      }
    }
    form.reset();

    if (pendingTarget) {
      form
        .strokeOnly(RED)
        .point(pendingTarget.position, pendingTarget.radius, "circle");
      form
        .strokeOnly(RED)
        .dash()
        .line(new Group(pendingTarget.position, space.pointer));
      form.reset();
    }

    form.strokeOnly("#222").dash(false);
    for (let a = 0; a < Math.PI * 2; a += Math.PI * 0.25) {
      form.line(
        new Group(new Pt(), new Pt(0, canvasRadius))
          .moveTo(space.center)
          .rotate2D(a)
      );
    }
    form.point(space.center, canvasHalfMin * PARAMS.outMin, "circle");
    form.point(space.center, canvasHalfMin * PARAMS.outMax, "circle");
    form.reset();

    let angleTargets = TARGETS.map((canvasTarget) =>
      canvasTarget.toAngleTarget()
    );

    let delta = space.pointer.$subtract(space.center);
    let inputAngle = Math.atan2(delta.y, delta.x);
    let normInputAngle = inputAngle / (Math.PI * 2);
    let normOutputAngle = transform(normInputAngle, angleTargets);
    let outputAngle = normOutputAngle * (Math.PI * 2);
    form
      .strokeOnly(GREEN)
      .dash()
      .line(Line.fromAngle(space.center, inputAngle, canvasRadius));
    form
      .strokeOnly("#fff")
      .dash(false)
      .line(Line.fromAngle(space.center, outputAngle, canvasRadius));
    form.reset();

    let angleStep = (Math.PI * 2) / PARAMS.resolution;
    for (let i = 1; i <= PARAMS.resolution; i++) {
      let inputStart = (i - 1) * angleStep;
      let inputEnd = i * angleStep;
      let outputStart = transform(inputStart, angleTargets);
      let outputEnd = transform(inputEnd, angleTargets);
      let distStart =
        Num.mapToRange(
          outputStart,
          0,
          Math.PI * 2,
          PARAMS.outMin,
          PARAMS.outMax
        ) * canvasHalfMin;
      let distEnd =
        Num.mapToRange(
          outputEnd,
          0,
          Math.PI * 2,
          PARAMS.outMin,
          PARAMS.outMax
        ) * canvasHalfMin;
      let ptStart = new Pt(
        Math.cos(inputStart) * distStart,
        Math.sin(inputStart) * distStart
      );
      let ptEnd = new Pt(
        Math.cos(inputEnd) * distEnd,
        Math.sin(inputEnd) * distEnd
      );
      form
        .strokeOnly("#fff")
        .line(new Group(ptStart, ptEnd).moveBy(space.center));
    }
  },
  action(type, px, py, evt) {
    if (type == "click" && !pendingTarget) {
      for (let i = TARGETS.length - 1; i >= 0; i--) {
        let target = TARGETS[i];
        if (target.isWithin(new Pt(px, py))) {
          TARGETS.splice(i, 1);
        }
      }
    }
    if (type == "drag" && !pendingTarget) {
      pendingTarget = new CanvasTarget(new Pt(px, py), 0.0);
    }
    if (type == "drag" && pendingTarget) {
      // hacky solution to not click new targets
      pendingTarget.radius = Math.max(
        0,
        new Pt(px, py).subtract(pendingTarget.position).magnitude() - 0.1
      );
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
