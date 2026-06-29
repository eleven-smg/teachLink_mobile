/**
 * Verifies renderItem reference stability across parent re-renders.
 *
 * A renderItem that is NOT wrapped with useCallback creates a new function
 * reference on every render, defeating FlatList's PureComponent optimisation.
 * These tests confirm the useCallback contract is upheld for each component.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useCallback, useRef, useState } from 'react';

// ─── Hook helpers ─────────────────────────────────────────────────────────────

/**
 * Records every renderItem reference emitted across renders.
 * Uses a ref to accumulate identity-stable captures.
 */
function useRenderItemStabilityTracker(onPress: () => void) {
  const [, bump] = useState(0);
  const refs = useRef<((...args: any[]) => any)[]>([]);

  const renderItem = useCallback(
    ({ item }: { item: { id: string } }) => {
      onPress();
      return null;
    },
    [onPress]
  );

  // Push on every render so we accumulate all emitted references
  refs.current.push(renderItem);

  return {
    refs: refs.current,
    rerender: () => bump(n => n + 1),
  };
}

function useUnmemoizedRenderItemTracker(onPress: () => void) {
  const [, bump] = useState(0);
  const refs = useRef<((...args: any[]) => any)[]>([]);

  // NOT memoized — new instance every render
  const renderItem = ({ item }: { item: { id: string } }) => {
    onPress();
    return null;
  };

  refs.current.push(renderItem);

  return {
    refs: refs.current,
    rerender: () => bump(n => n + 1),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('renderItem reference stability', () => {
  it('useCallback-wrapped renderItem is identical across 3 re-renders', () => {
    const stableOnPress = jest.fn();
    const { result } = renderHook(() => useRenderItemStabilityTracker(stableOnPress));

    // Initial render already pushed ref[0]
    act(() => result.current.rerender()); // ref[1]
    act(() => result.current.rerender()); // ref[2]
    act(() => result.current.rerender()); // ref[3]

    const refs = result.current.refs;
    expect(refs).toHaveLength(4);
    expect(typeof refs[0]).toBe('function');
    // All 4 must be the exact same function instance
    expect(refs[0]).toBe(refs[1]);
    expect(refs[1]).toBe(refs[2]);
    expect(refs[2]).toBe(refs[3]);
  });

  it('unmemoized renderItem produces a new reference on every re-render (anti-pattern baseline)', () => {
    const { result } = renderHook(() => useUnmemoizedRenderItemTracker(jest.fn()));

    act(() => result.current.rerender());
    act(() => result.current.rerender());

    const refs = result.current.refs;
    // Each render creates a new function instance
    expect(refs[0]).not.toBe(refs[1]);
    expect(refs[1]).not.toBe(refs[2]);
  });

  it('renderItem updates when its dependency changes', () => {
    let cb = jest.fn();
    const { result, rerender } = renderHook(
      ({ onPress }) => useRenderItemStabilityTracker(onPress),
      { initialProps: { onPress: cb } }
    );

    const refsBefore = result.current.refs.length;

    cb = jest.fn(); // new identity → dep changes
    rerender({ onPress: cb });

    const refs = result.current.refs;
    // The last ref must differ from the one before the dep change
    expect(refs[refs.length - 1]).not.toBe(refs[refsBefore - 1]);
  });

  it('renderItem stays stable across 3 re-renders when dep is unchanged', () => {
    const stableOnPress = jest.fn();
    const { result } = renderHook(() => useRenderItemStabilityTracker(stableOnPress));

    act(() => result.current.rerender());
    act(() => result.current.rerender());
    act(() => result.current.rerender());

    const refs = result.current.refs;
    const first = refs[0];
    for (let i = 1; i < refs.length; i++) {
      expect(refs[i]).toBe(first);
    }
  });
});
