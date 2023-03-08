import { AngleTarget } from "./target";

let sin = Math.sin;
let abs = Math.abs;
let floor = Math.floor;
let pow = Math.pow;
let min = Math.min;
let max = Math.max;
let PI = Math.PI;

function lerp(a: number, b: number, t: number): number {
  return (1 - t) * a + t * b;
}

function clamp(a: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, a));
}

function saturate(a: number): number {
  return clamp(a, 0, 1);
}

export class WeightedTransformer {
  public targets: AngleTarget[];

  constructor(targets: AngleTarget[]) {
    this.targets = targets.sort((a, b) => b.distance - a.distance);
  }

  closestInfluenceOverlap(target: AngleTarget): AngleTarget | null {
    let closestDistance = Number.MAX_VALUE;
    let closestTarget: AngleTarget | null = null;
    for (const other of this.targets) {
      if (!target.isInfluenceOverlapping(other)) {
        continue;
      }
      let distance = abs(target.position - other.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = other;
      }
    }
    return closestTarget;
  }

  closestLeft(target: AngleTarget): AngleTarget | null {
    let closestDistance = Number.MAX_VALUE;
    let closestTarget: AngleTarget | null = null;
    for (const other of this.targets) {
      if (target === other || target.position < other.position) {
        continue;
      }
      let distance = abs(target.position - other.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = other;
      }
    }
    return closestTarget;
  }

  closestRight(target: AngleTarget): AngleTarget | null {
    let closestDistance = Number.MAX_VALUE;
    let closestTarget: AngleTarget | null = null;
    for (const other of this.targets) {
      if (target === other || target.position > other.position) {
        continue;
      }
      let distance = abs(target.position - other.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = other;
      }
    }
    return closestTarget;
  }

  influenceLeft(target: AngleTarget): number {
    let closest = this.closestLeft(target);
    if (!closest || !target.isInfluenceOverlapping(closest)) {
      return target.influenceRadius;
    }
    return abs(closest.position - target.position) / 2;
  }

  influenceRight(target: AngleTarget): number {
    let closest = this.closestRight(target);
    if (!closest || !target.isInfluenceOverlapping(closest)) {
      return target.influenceRadius;
    }
    return abs(closest.position - target.position) / 2;
  }

  baseWeight(input: number, target: AngleTarget): number {
    let il = this.influenceLeft(target);
    let start = (input - target.position) / il + 1;
    start *= saturate(1 - abs(floor(start)));
    let ir = this.influenceRight(target);
    let end = (target.position - input) / ir + 1;
    end *= saturate(1 - abs(floor(end)));
    // return start + end;
    return sin((start + end - 0.5) * PI) * 0.5 + 0.5;
  }

  occlusionFactor(target: AngleTarget): number {
    let result = 0;
    let overlaps: { start: number; end: number }[] = [];
    for (const other of this.targets) {
      if (other.distance >= target.distance) {
        continue;
      }

      if (target.isOverlapping(other)) {
        let maxStart = max(target.start, other.start);
        let minEnd = min(target.end, other.end);
        overlaps.push({ start: maxStart, end: minEnd });
      }
    }
    for (const overlap of overlaps) {
      result += (overlap.end - overlap.start) / (target.radius * 2);
    }
    return saturate(result);
  }

  weight(input: number, target: AngleTarget): number {
    let bw = this.baseWeight(input, target);
    let of = this.occlusionFactor(target);
    return bw * (1 - of);
  }

  weights(input: number): number[] {
    return this.targets.map((target) => this.weight(input, target));
  }

  offset(input: number, target: AngleTarget, weight: number): number {
    let delta = target.position - input;
    return delta * weight;
  }

  offsets(input: number, weights: number[]): number[] {
    let weightSum = weights.reduce((prev, cur) => prev + cur, 0);
    let weightFactor = weightSum > 1 ? 1 / weightSum : 1;
    return this.targets.map((target, i) =>
      this.offset(input, target, weights[i] * weightFactor)
    );
  }

  transform(input: number): number {
    let ws = this.weights(input);
    let os = this.offsets(input, ws).reduce((prev, cur) => prev + cur, 0);
    return input + os;
  }
}
