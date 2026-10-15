import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/ui',workers:1,fullyParallel:false,reporter:'list',
 use:{baseURL:process.env.DBC_STATIC_TEST?'http://dbc.test':'http://127.0.0.1:1420',channel:process.env.DBC_BROWSER?undefined:'msedge',launchOptions:process.env.DBC_BROWSER?{executablePath:process.env.DBC_BROWSER}:{},headless:true,viewport:{width:1000,height:720}},
 webServer:process.env.DBC_STATIC_TEST?undefined:{command:'npm run dev',url:'http://127.0.0.1:1420',reuseExistingServer:!process.env.CI,timeout:30000}
});
