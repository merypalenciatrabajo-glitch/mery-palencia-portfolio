const credentialVariables = [
  "FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON",
  "GOOGLE_APPLICATION_CREDENTIALS",
];
const splitCredentials = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
];
const testTokens = [
  "FIREBASE_TEST_EXPIRED_ID_TOKEN",
  "FIREBASE_TEST_REVOKED_ID_TOKEN",
];

const hasCredentialFileOrJson = credentialVariables.some(
  (name) => Boolean(process.env[name])
);
const hasSplitCredentials = splitCredentials.every(
  (name) => Boolean(process.env[name])
);
const missingTokens = testTokens.filter((name) => !process.env[name]);

if ((!hasCredentialFileOrJson && !hasSplitCredentials) || missingTokens.length) {
  const missing = [
    ...(!hasCredentialFileOrJson && !hasSplitCredentials
      ? ["Firebase Admin credentials"]
      : []),
    ...missingTokens,
  ];
  console.error(
    `Live Firebase tests are not configured. Missing: ${missing.join(", ")}`
  );
  process.exit(1);
}
