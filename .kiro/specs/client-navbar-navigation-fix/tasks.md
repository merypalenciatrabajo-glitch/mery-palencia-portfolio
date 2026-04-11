# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Navbar de /blog no muestra enlaces de navegación
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — renderizar `Blog` y verificar que los enlaces "Blog", "Galería" e "Inicio" están presentes en el header
  - Create test file `client/src/pages/__tests__/Blog.navbar.property.test.tsx`
  - Mock `useFirestore` hook to avoid real data dependencies
  - Render `<Blog />` wrapped in wouter `Router` and assert that the header contains links to `/`, `/blog`, and `/galeria`
  - Assert `getByRole('link', { name: 'Inicio' })` is present with `href="/"`
  - Assert `getByRole('link', { name: 'Blog' })` is present with `href="/blog"`
  - Assert `getByRole('link', { name: 'Galería' })` is present with `href="/galeria"`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists: header only shows logo and ThemeToggle)
  - Document counterexamples found: "Blog.tsx header does not render 'Blog', 'Galería' or 'Inicio' links"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Comportamiento existente de GalleryPage y ThemeToggle no se altera
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `GalleryPage` at `/galeria` renders "Blog" and "Galería" links with active style on "Galería" — UNFIXED code
  - Observe: `ThemeToggle` is present in both `/blog` and `/galeria` headers — UNFIXED code
  - Observe: Logo "Mery Palencia" navigates to `/` in all pages — UNFIXED code
  - Create test file `client/src/pages/__tests__/Blog.navbar.preservation.test.tsx`
  - Write property-based test: for all routes in `['/galeria']`, `GalleryPage` header contains "Blog" and "Galería" links
  - Write test: `ThemeToggle` is present in `GalleryPage` header
  - Write test: logo link in `GalleryPage` has `href="/"`
  - Write test: "Galería" link in `GalleryPage` has active style class when at `/galeria`
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix Blog.tsx navbar — añadir enlaces de navegación faltantes

  - [x] 3.1 Implement the fix in `client/src/pages/Blog.tsx`
    - Add `import { Link, useLocation } from 'wouter'` replacing or alongside existing wouter imports
    - Add `isActive` helper: `const [location] = useLocation(); const isActive = (path: string) => location === path`
    - Replace the simplified header (logo as `<button>` + `ThemeToggle` only) with the full navigation header
    - Add `<Link to="/">Mery Palencia</Link>` as the logo (replacing `<button onClick={() => window.location.href = '/'}>`
    - Add nav links: `<Link to="/">Inicio</Link>`, `<Link to="/blog">Blog</Link>` with active style, `<Link to="/galeria">Galería</Link>` with active style
    - Keep `<ThemeToggle />` in the nav bar
    - Change header padding from `py-6` to `py-4` for consistency with `GalleryPage.tsx`
    - Remove all uses of `window.location.href` from the header
    - _Bug_Condition: isBugCondition(page) where page.route === '/blog' AND header.navLinks does not include 'Blog' or 'Galería'_
    - _Expected_Behavior: header renders Link('Inicio', '/'), Link('Blog', '/blog'), Link('Galería', '/galeria'), ThemeToggle_
    - _Preservation: GalleryPage.tsx and Home.tsx are NOT modified; only Blog.tsx header changes_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Navbar de /blog muestra todos los enlaces de navegación
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run `client/src/pages/__tests__/Blog.navbar.property.test.tsx` on FIXED code
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — "Inicio", "Blog", "Galería" links are present)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Comportamiento existente de otras páginas no se altera
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run `client/src/pages/__tests__/Blog.navbar.preservation.test.tsx` on FIXED code
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in GalleryPage, ThemeToggle, logo navigation, active styles)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Run the full client test suite to confirm no regressions
  - Ensure all tests pass, ask the user if questions arise.
