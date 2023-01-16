# Twitter Listener API

## locally run

1. build
   ```bash
   cp docker-compose.override.example.yml docker-compose.override.yml
   - Update environment variables for actual values

   docker-compose -p twit build
   ```
1. start
   ```bash
   docker-compose -p twit up -d
   ```
1. logs
   ```bash
   docker-compose -p twit logs -f server
   ```
1. stop
   ```bash
   docker-compose -p twit stop
   # or with cleaning
   docker-compose -p twit down
   ```
1. run migration in postgres
   ```bash
   docker-compose -p twit exec -T server yarn run migrate:up
   ```
   