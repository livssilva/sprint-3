import dotenv from "dotenv";

const envFile =
  process.env.NODE_ENV === "development"
    ? ".env-dev"
    : ".env";

dotenv.config({
  path: envFile,
  override: true
});

console.log("Arquivo carregado:", envFile);