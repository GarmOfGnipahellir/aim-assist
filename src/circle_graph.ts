import { Group, Num, Pt } from "pts";
import { canvasHalfMin, form, params, space } from ".";

export class CircleGraph {
  public lineColor: string;

  constructor(public transform: (input: number) => number) {
    this.lineColor = "#fff";
  }

  color(c: string): CircleGraph {
    this.lineColor = c;
    return this;
  }

  draw() {
    let angleStep = (Math.PI * 2) / params.resolution;
    for (let i = 1; i <= params.resolution; i++) {
      let inputStart = (i - 1) * angleStep - Math.PI;
      let inputEnd = i * angleStep - Math.PI;
      let normInputStart = inputStart / (Math.PI * 2);
      let normInputEnd = inputEnd / (Math.PI * 2);
      let outputStart = this.transform(normInputStart);
      let outputEnd = this.transform(normInputEnd);
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
        .strokeOnly(this.lineColor)
        .line(new Group(ptStart, ptEnd).moveBy(space.center));
    }
  }
}
