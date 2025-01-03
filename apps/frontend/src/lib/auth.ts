import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://soika.gefest.agency", // the base url of your auth server
  // baseURL: "http://localhost:3000",
  fetchOptions: { credentials: "include" },
});
