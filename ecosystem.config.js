module.exports = {
  apps: [
    {
      name: "meaeco-backend",
      script: "run_api.py",
      interpreter: "python",
      env: {
        PORT: 8000,
        APP_ENV: "production"
      }
    },
    {
      name: "meaeco-frontend",
      cwd: "./autonomous-marketing-frontend-main",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
