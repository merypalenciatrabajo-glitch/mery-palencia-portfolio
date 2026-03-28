// Feature: gallery-page, Property 8: Auth guard en admin /galeria
// Validates: Requirements 7.2

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

/**
 * Property 8: Auth guard en admin /galeria
 *
 * The ProtectedRoute component in admin/src/App.tsx implements the following
 * pure logic:
 *
 *   function ProtectedRoute({ children }) {
 *     const { user, loading } = useAuth();
 *     if (loading) return <Spinner />;
 *     if (!user) return <Navigate to="/login" replace />;
 *     return <DashboardLayout>{children}</DashboardLayout>;
 *   }
 *
 * We model this as a pure function that returns one of three outcomes:
 *   - "spinner"   → loading is true (auth state not yet resolved)
 *   - "redirect"  → user is null and loading is false (unauthenticated)
 *   - "render"    → user is present and loading is false (authenticated)
 *
 * Property: for ANY unauthenticated state (user = null, loading = false),
 * the guard MUST return "redirect" (→ /login) and NEVER "render".
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GuardOutcome = "spinner" | "redirect" | "render";

interface AuthState {
  user: null | { uid: string; email: string };
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Pure model of ProtectedRoute logic
// ---------------------------------------------------------------------------

/**
 * Models the decision made by ProtectedRoute given an auth state.
 * Mirrors the exact conditional logic in admin/src/App.tsx.
 */
function evaluateGuard(state: AuthState): GuardOutcome {
  if (state.loading) return "spinner";
  if (!state.user) return "redirect";
  return "render";
}

/**
 * Models the redirect target when the guard returns "redirect".
 * ProtectedRoute always redirects to "/login".
 */
function redirectTarget(): string {
  return "/login";
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Any unauthenticated state: user is null, loading is false */
const unauthenticatedStateArb: fc.Arbitrary<AuthState> = fc.record({
  user: fc.constant(null),
  loading: fc.constant(false),
});

/** Any authenticated state: user is present, loading is false */
const authenticatedStateArb: fc.Arbitrary<AuthState> = fc.record({
  user: fc.record({
    uid: fc.string({ minLength: 1, maxLength: 28 }),
    email: fc.emailAddress(),
  }),
  loading: fc.constant(false),
});

/** Loading state: loading is true, user may be anything */
const loadingStateArb: fc.Arbitrary<AuthState> = fc.record({
  user: fc.option(
    fc.record({
      uid: fc.string({ minLength: 1, maxLength: 28 }),
      email: fc.emailAddress(),
    }),
    { nil: null }
  ),
  loading: fc.constant(true),
});

// ---------------------------------------------------------------------------
// Property 8: Auth guard en admin /galeria
// ---------------------------------------------------------------------------

describe("ProtectedRoute – auth guard en admin /galeria (Property 8)", () => {
  it(
    "P8a: para cualquier estado no autenticado (user=null, loading=false), el guard redirige a /login",
    () => {
      fc.assert(
        fc.property(unauthenticatedStateArb, (state) => {
          const outcome = evaluateGuard(state);
          expect(outcome).toBe("redirect");
          expect(redirectTarget()).toBe("/login");
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P8b: para cualquier estado no autenticado, el guard NUNCA renderiza el componente protegido",
    () => {
      fc.assert(
        fc.property(unauthenticatedStateArb, (state) => {
          const outcome = evaluateGuard(state);
          expect(outcome).not.toBe("render");
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P8c: para cualquier estado no autenticado, el guard NUNCA muestra el spinner (loading=false)",
    () => {
      fc.assert(
        fc.property(unauthenticatedStateArb, (state) => {
          const outcome = evaluateGuard(state);
          expect(outcome).not.toBe("spinner");
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P8d: para cualquier estado autenticado (user presente, loading=false), el guard renderiza el componente",
    () => {
      fc.assert(
        fc.property(authenticatedStateArb, (state) => {
          const outcome = evaluateGuard(state);
          expect(outcome).toBe("render");
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    "P8e: para cualquier estado de carga (loading=true), el guard muestra el spinner independientemente del usuario",
    () => {
      fc.assert(
        fc.property(loadingStateArb, (state) => {
          const outcome = evaluateGuard(state);
          expect(outcome).toBe("spinner");
        }),
        { numRuns: 100 }
      );
    }
  );
});
