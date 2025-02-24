module.exports = {
  name: "soika-backend", // Name of your application
  script: "src/index.ts", // Entry point of your application
  interpreter: "/root/.bun/bin/bun", // Path to the Bun interpreter
  env_file: ".env.production", // Path to your environment file

  env_development: {
    NODE_ENV: "development",
  },
};
