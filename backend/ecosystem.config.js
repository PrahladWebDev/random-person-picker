module.exports = {
  apps: [
    {
      name: 'randompick-api',
      script: 'src/server.js',
      cwd: '/var/www/projects/randompick/backend',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
