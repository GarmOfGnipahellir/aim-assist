import { Circle, Color, Group, Pt, PtLike } from "pts";
import { params, space } from ".";

export class CanvasTarget {
  public color: Color;

  constructor(public position: Pt, public radius: number) {
    this.color = Color.HSBtoRGB(Color.hsb(Math.random() * 360, 1, 1));
  }

  toCircle(): Group {
    return Circle.fromCenter(this.position, this.radius);
  }

  isWithin(pt: PtLike, threshold?: number): boolean {
    return Circle.withinBound(this.toCircle(), pt, threshold);
  }

  toAngleTarget(): AngleTarget {
    let delta = this.position.$subtract(space.center);
    let distance = delta.magnitude();
    let anglePosition = Math.atan2(delta.y, delta.x) / (Math.PI * 2);
    let angleRadius = Math.asin(this.radius / distance) / (Math.PI * 2);
    return new AngleTarget(anglePosition, angleRadius, distance);
  }
}

export class AngleTarget {
  public influenceRadius: number;

  constructor(
    public position: number,
    public radius: number,
    public distance: number
  ) {
    this.influenceRadius = radius * params.influenceFactor;
  }

  get start(): number {
    return this.position - this.radius;
  }

  get end(): number {
    return this.position + this.radius;
  }

  get influenceStart(): number {
    return this.position - this.influenceRadius;
  }

  get influenceEnd(): number {
    return this.position + this.influenceRadius;
  }

  isOverlapping(other: AngleTarget): boolean {
    return (
      (this.start > other.start && this.start < other.end) ||
      (this.end > other.start && this.end < other.end)
    );
  }

  isInfluenceOverlapping(other: AngleTarget): boolean {
    return (
      (this.influenceStart > other.influenceStart &&
        this.influenceStart < other.influenceEnd) ||
      (this.influenceEnd > other.influenceStart &&
        this.influenceEnd < other.influenceEnd)
    );
  }
}
