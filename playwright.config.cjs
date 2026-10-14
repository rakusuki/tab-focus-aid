const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {browserName:'chromium', headless:true, viewport:{width:1280,height:800}, trace:'retain-on-failure'},
  reporter: process.env.CI ? [['github'], ['html',{open:'never'}]] : 'list',
});
