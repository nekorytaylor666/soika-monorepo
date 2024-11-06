module.exports = {
  name: "soika-backend", // Name of your application
  script: "src/index.ts", // Entry point of your application
  interpreter: "/root/.bun/bin/bun", // Path to the Bun interpreter
  env_production: {
    NODE_ENV: "production",
  },
  env_development: {
    NODE_ENV: "development",
  },
};
