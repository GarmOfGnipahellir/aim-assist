import { Circle, Color, Group, Pt, PtLike } from "pts";
import { space } from ".";

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
  constructor(
    public position: number,
    public radius: number,
    public distance: number
  ) {}

  start(): number {
    return this.position - this.radius;
  }

  end(): number {
    return this.position + this.radius;
  }
}
