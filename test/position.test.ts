import { describe, it, expect } from 'vitest';
import { computePosition } from '../src/tooltip';

const vp = { width: 1000, height: 800 };
const tip = { width: 200, height: 60 };

describe('computePosition', () => {
  it('places the tooltip below and left-aligned', () => {
    expect(computePosition({ left: 100, top: 100, right: 180, bottom: 120 }, tip, vp))
      .toEqual({ left: 100, top: 126 });
  });
  it('shifts left when overflowing the right edge', () => {
    expect(computePosition({ left: 900, top: 100, right: 980, bottom: 120 }, tip, vp))
      .toEqual({ left: 792, top: 126 });
  });
  it('flips above when overflowing the bottom edge', () => {
    expect(computePosition({ left: 100, top: 760, right: 180, bottom: 780 }, tip, vp))
      .toEqual({ left: 100, top: 694 });
  });
  it('handles overflow on both axes', () => {
    expect(computePosition({ left: 900, top: 760, right: 980, bottom: 780 }, tip, vp))
      .toEqual({ left: 792, top: 694 });
  });
  it('clamps left to 4', () => {
    expect(computePosition({ left: -50, top: 100, right: -10, bottom: 120 }, tip, vp).left).toBe(4);
  });
  it('clamps top to 4 when flipping above would go negative', () => {
    expect(computePosition({ left: 100, top: 10, right: 180, bottom: 790 }, tip, vp).top).toBe(4);
  });
  it('clamps left to 4 when the tooltip is wider than the viewport', () => {
    expect(computePosition({ left: 100, top: 100, right: 180, bottom: 120 }, { width: 2000, height: 60 }, vp).left).toBe(4);
  });
});
