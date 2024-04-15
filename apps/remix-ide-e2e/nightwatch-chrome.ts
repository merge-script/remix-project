module.exports = {
  src_folders: ['dist/apps/remix-ide-e2e/src/tests'],
  output_folder: './reports/tests',
  custom_commands_path: ['dist/apps/remix-ide-e2e/src/commands'],
  custom_assertions_path: '',
  page_objects_path: '',
  globals_path: '',

  webdriver: {
    start_process: true,
    port: 4444,
    server_path: './tmp/webdrivers/node_modules/chromedriver/bin/chromedriver',
  },

  test_settings: {
    selenium_port: 4444,
    selenium_host: 'localhost',
    'default': {
      globals: {
        waitForConditionTimeout: 10000,
        asyncHookTimeout: 100000
      },
      screenshots: {
        enabled: true,
        path: './reports/screenshots',
        on_failure: true,
        on_error: true
      },
      exclude: ['dist/apps/remix-ide-e2e/src/tests/runAndDeploy.test.js', 'dist/apps/remix-ide-e2e/src/tests/pluginManager.test.ts']
    },

    'chrome': {
      desiredCapabilities: {
        'browserName': 'chrome',
        'javascriptEnabled': true,
        'acceptSslCerts': true,
        'goog:chromeOptions': {
          args: [
            'window-size=2560,1440',
            'start-fullscreen',
            '--no-sandbox',
            '--headless',
            '--verbose',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'
          ]
        }
      }
    },

    'chromeDesktop': {
      desiredCapabilities: {
        'browserName': 'chrome',
        'javascriptEnabled': true,
        'acceptSslCerts': true,
        'goog:chromeOptions': {
          args: ['window-size=2560,1440', 'start-fullscreen', '--no-sandbox']
        }
      }
    },

    'chrome-runAndDeploy': {
      desiredCapabilities: {
        'browserName': 'chrome',
        'javascriptEnabled': true,
        'acceptSslCerts': true,
        'goog:chromeOptions': {
          args: ['window-size=2560,1440', 'start-fullscreen', '--no-sandbox', '--headless', '--verbose']
        }
      }
    }
  }
}
