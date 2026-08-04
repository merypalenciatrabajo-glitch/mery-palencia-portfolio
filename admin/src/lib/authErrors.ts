const GENERIC_CREDENTIAL_ERROR =
  "Credenciales incorrectas. Verifica tu email y contraseña.";

export function getSignInErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  switch (code) {
    case "auth/network-request-failed":
      return "No hay conexión. Comprueba tu red e inténtalo de nuevo.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.";
    default:
      return GENERIC_CREDENTIAL_ERROR;
  }
}
