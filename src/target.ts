import { Circle, Group, Pt, PtLike } from "pts";
import { space } from ".";

export class CanvasTarget {
  constructor(public position: Pt, public radius: number) {}

  toCircle(): Group {
    return Circle.fromCenter(this.position, this.radius);
  }

  isWithin(pt: PtLike, threshold?: number): boolean {
    return Circle.withinBound(this.toCircle(), pt, threshold);
  }

  toAngleTarget(): AngleTarget {
    let delta = this.position.$subtract(space.center);
    let distance = delta.magnitude();
    let anglePosition = Math.atan2(delta.y, delta.x);
    let angleRadius = Math.asin(this.radius / distance);
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
