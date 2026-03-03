module.exports = {
  apps: [
    {
      name: 'qaqnus222',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/qaqnus222',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
}
