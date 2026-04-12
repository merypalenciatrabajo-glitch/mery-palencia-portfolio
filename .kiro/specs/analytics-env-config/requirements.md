# Requirements Document

## Introduction

The portfolio site (Vite + React, deployed on Vercel) references two environment variables in `client/index.html` for Umami analytics: `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID`. These variables are currently undefined, causing build warnings and preventing the analytics script from loading correctly. This feature covers defining, documenting, and correctly wiring these environment variables so that Umami analytics loads in production without warnings.

## Glossary

- **Portfolio_Site**: The Vite-based React application located in the `client/` folder, deployed on Vercel.
- **Umami_Script**: The third-party analytics script loaded via a `<script>` tag in `client/index.html`, sourced from the URL defined by `VITE_ANALYTICS_ENDPOINT`.
- **VITE_ANALYTICS_ENDPOINT**: A Vite environment variable holding the base URL of the self-hosted Umami analytics instance (e.g., `https://analytics.example.com`).
- **VITE_ANALYTICS_WEBSITE_ID**: A Vite environment variable holding the unique website ID assigned by the Umami instance to the portfolio site.
- **Env_File**: The `client/.env` file used for local development environment variables.
- **Env_Example_File**: The `client/.env.example` file used as a reference template for required environment variables.
- **Vercel_Dashboard**: The Vercel project settings UI where production environment variables are configured.

## Requirements

### Requirement 1: Define Analytics Environment Variables Locally

**User Story:** As a developer, I want `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` defined in the local env file, so that the Umami analytics script loads correctly during local development without build warnings.

#### Acceptance Criteria

1. THE Env_File SHALL contain an entry for `VITE_ANALYTICS_ENDPOINT` with the Umami instance base URL as its value.
2. THE Env_File SHALL contain an entry for `VITE_ANALYTICS_WEBSITE_ID` with the Umami website ID as its value.
3. WHEN Vite builds the Portfolio_Site, THE Portfolio_Site SHALL substitute `%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%` in `index.html` with their respective values.
4. IF `VITE_ANALYTICS_ENDPOINT` or `VITE_ANALYTICS_WEBSITE_ID` is not defined, THEN THE Portfolio_Site build SHALL emit a warning identifying the missing variable by name.

### Requirement 2: Document Analytics Environment Variables in the Example File

**User Story:** As a developer onboarding to the project, I want the `.env.example` file to list all required environment variables including analytics ones, so that I know what values to provide without reading the source code.

#### Acceptance Criteria

1. THE Env_Example_File SHALL contain an entry for `VITE_ANALYTICS_ENDPOINT` with an empty or placeholder value.
2. THE Env_Example_File SHALL contain an entry for `VITE_ANALYTICS_WEBSITE_ID` with an empty or placeholder value.
3. THE Env_Example_File SHALL include a comment above the analytics variables describing their purpose and expected format.

### Requirement 3: Configure Analytics Environment Variables on Vercel

**User Story:** As a developer, I want `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` set in the Vercel project settings, so that the production build resolves the analytics script URL and website ID correctly.

#### Acceptance Criteria

1. WHEN the Portfolio_Site is built on Vercel, THE Vercel_Dashboard SHALL supply `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` as environment variables available at build time.
2. WHEN the production build completes, THE Umami_Script tag in the built `index.html` SHALL contain the resolved endpoint URL and website ID rather than the literal placeholder strings `%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%`.
3. IF either variable is absent from the Vercel_Dashboard at build time, THEN THE Portfolio_Site build log SHALL emit a warning identifying the missing variable by name.

### Requirement 4: Analytics Script Loads Without Errors in Production

**User Story:** As a site owner, I want the Umami analytics script to load successfully in production, so that visitor analytics are tracked without console errors.

#### Acceptance Criteria

1. WHEN a visitor loads the Portfolio_Site in a browser, THE Umami_Script SHALL be requested from the URL composed of `VITE_ANALYTICS_ENDPOINT` and the path `/umami`.
2. WHEN the Umami_Script loads successfully, THE Umami_Script SHALL receive the `data-website-id` attribute value equal to `VITE_ANALYTICS_WEBSITE_ID`.
3. IF the Umami_Script fails to load (e.g., network error), THEN THE Portfolio_Site SHALL continue to render all non-analytics functionality without interruption.
