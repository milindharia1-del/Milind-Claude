module.exports = {
  apps: [
    {
      name: 'geowatch',
      script: 'server/index.js',
      cwd: '/var/www/geowatch',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/var/log/pm2/geowatch-error.log',
      out_file: '/var/log/pm2/geowatch-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
