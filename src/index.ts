import { Pane } from "tweakpane";
import { CanvasSpace, Pt, Group, Line, Circle, Num } from "pts";
import { CanvasTarget } from "./target";
import transform from "./transformer";
import "./input";
import { setInputMode, updateInput, inputAngle } from "./input";
import { weights, weightsSum } from "./weighted_transformer";

const RED = "#f23";
const GREEN = "#6f6";

export let params = {
  inEdge: 1.0,
  outMiddle: 0.5,
  outEdge: 0.1,
  resolution: 360,
  showInputDirection: true,
  showTargetEdges: true,
};

const pane = new Pane();
let graphFolder = pane.addFolder({ title: "Graph" });
graphFolder.addInput(params, "outMiddle", { min: 0.0, max: 1.0 });
graphFolder.addInput(params, "outEdge", { min: 0.0, max: 1.0 });
graphFolder.addInput(params, "resolution", { min: 0, max: 1000, step: 10 });
let drawFolder = pane.addFolder({ title: "Show/Hide" });
drawFolder.addInput(params, "showInputDirection");
drawFolder.addInput(params, "showTargetEdges");

export const space = new CanvasSpace("#main");
space.setup({ bgcolor: "#111", resize: true });
const form = space.getForm();

export let targets: CanvasTarget[] = [];
let pendingTarget: CanvasTarget | null = null;

space.add({
  animate: () => {
    const canvasRadius = space.center.magnitude();
    const canvasHalfMin = Math.min(space.center.x, space.center.y);

    for (const target of targets) {
      let circle = target.toCircle();
      form.fillOnly(target.color.hex).circle(circle);
      if (params.showTargetEdges && Circle.withinBound(circle, space.pointer)) {
        let angleTarget = target.toAngleTarget();
        form
          .strokeOnly(target.color.hex)
          .dash()
          .line(
            Line.fromAngle(
              space.center,
              angleTarget.start() * (Math.PI * 2),
              canvasRadius
            )
          );
        form
          .strokeOnly(target.color.hex)
          .dash()
          .line(
            Line.fromAngle(
              space.center,
              angleTarget.end() * (Math.PI * 2),
              canvasRadius
            )
          );
      }
    }
    form.reset();

    if (pendingTarget) {
      form
        .strokeOnly(pendingTarget.color.hex)
        .point(pendingTarget.position, pendingTarget.radius, "circle");
      form
        .strokeOnly(pendingTarget.color.hex)
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
    form.point(space.center, canvasHalfMin * params.outMiddle, "circle");
    form.reset();

    let angleTargets = targets.map((canvasTarget) =>
      canvasTarget.toAngleTarget()
    );

    updateInput();

    let normInputAngle = inputAngle / (Math.PI * 2);
    let normOutputAngle = transform(normInputAngle, angleTargets);
    let outputAngle = normOutputAngle * (Math.PI * 2);
    if (params.showInputDirection) {
      form
        .strokeOnly(GREEN)
        .dash()
        .line(Line.fromAngle(space.center, inputAngle, canvasRadius));
    }
    form
      .strokeOnly("#fff")
      .dash(false)
      .line(Line.fromAngle(space.center, outputAngle, canvasRadius));
    form.reset();

    let angleStep = (Math.PI * 2) / params.resolution;
    for (let i = 1; i <= params.resolution; i++) {
      let inputStart = (i - 1) * angleStep - Math.PI;
      let inputEnd = i * angleStep - Math.PI;
      let normInputStart = inputStart / (Math.PI * 2);
      let normInputEnd = inputEnd / (Math.PI * 2);
      let outputStart = weightsSum(normInputStart, angleTargets);
      let outputEnd = weightsSum(normInputEnd, angleTargets);
      let distStart =
        Num.mapToRange(
          outputStart,
          -params.inEdge,
          params.inEdge,
          params.outMiddle - params.outEdge,
          params.outMiddle + params.outEdge
        ) * canvasHalfMin;
      let distEnd =
        Num.mapToRange(
          outputEnd,
          -params.inEdge,
          params.inEdge,
          params.outMiddle - params.outEdge,
          params.outMiddle + params.outEdge
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
    setInputMode("mouse");

    if (type == "click" && !pendingTarget) {
      for (let i = targets.length - 1; i >= 0; i--) {
        let target = targets[i];
        if (target.isWithin(new Pt(px, py))) {
          targets.splice(i, 1);
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
        targets.push(pendingTarget);
      }
      pendingTarget = null;
    }
  },
});

space.bindMouse().play();
