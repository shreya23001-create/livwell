# SSR Deployment Guide — Windows Server VPS

## What changed
The app now uses Angular SSR (Server-Side Rendering).
Google and other crawlers now receive fully rendered HTML instead of an empty shell.

## Requirements on the server
- Node.js 18+ installed
- PM2 process manager: `npm install -g pm2`
- IIS or Nginx as reverse proxy (to forward port 80/443 to Node on port 4000)

## Build locally
```
npm run build
```
Output goes to: `dist/livwell-real-estate/`

## Deploy to server

### 1. Copy these folders to the server (e.g. C:\livwell\):
```
dist/livwell-real-estate/browser/
dist/livwell-real-estate/server/
dist/livwell-real-estate/prerendered-routes.json
```

### 2. Install PM2 on the server (once only)
```
npm install -g pm2
```

### 3. Start the SSR server with PM2
```
pm2 start "node dist/livwell-real-estate/server/server.mjs" --name livwell-ssr
pm2 save
pm2 startup
```

### 4. The Node server runs on port 4000
Configure IIS URL Rewrite or Nginx to proxy to http://localhost:4000

#### IIS URL Rewrite rule (web.config):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Proxy to Node" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://localhost:4000/{R:1}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

### 5. Environment variable for port (optional)
```
$env:PORT = "4000"
pm2 start "node dist/livwell-real-estate/server/server.mjs" --name livwell-ssr
```

## Verify it works
Open: http://localhost:4000 on the server
View page source — you should see full HTML content, NOT just `<app-root></app-root>`

## PM2 commands
```
pm2 list          # see running processes
pm2 restart livwell-ssr   # restart after deploy
pm2 logs livwell-ssr      # view logs
pm2 stop livwell-ssr      # stop server
```
