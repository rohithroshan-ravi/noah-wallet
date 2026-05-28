import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../server/docs/openapi.yaml",
  output: "app/src/client",
  plugins: ["@hey-api/client-fetch"],
});
