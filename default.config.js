const path = require('path');
const fs = require('fs');


let config = {
    puppeteerOptions: {
        headless: false,
        // executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        // userDataDir: "C:\\Users\\family\\AppData\\Local\\BraveSoftware\\Brave-Browser\\User Data\\Default",
        // executablePath: "C:\\Users\\family\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
        // userDataDir: "C:\\Users\\family\\AppData\\Local\\Google\\Chrome\\User Data\\Default",
    },
    recaptchaMatchConfigs: [
        // hidden input in recaptcha iframe
        {
            selector: "#recaptcha-token",
            targetPattern: ""
        },
        // main content element in recaptcha iframe
        {
            selector: "#rc-anchor-container",
            targetPattern: ""
        },
        // hidden textarea outside recaptcha iframe
        {
            selector: "#g-recaptcha-response",
            targetPattern: ""
        },
        // selector for reCAPTCHA checkbox
        {
            selector: "div.recaptcha-checkbox-checkmark",
            targetPattern: ""
        }
    ],
    notificationProviders: [
        {
            name: "PushBullet",
            apiAccessToken: process.env.PushbulletApiAccessToken
        }
    ]
};


if ((!config.puppeteerOptions.executablePath && !config.puppeteerOptions.userDataDir) || 
    (config.puppeteerOptions.executablePath && !fs.existsSync(config.puppeteerOptions.executablePath) && 
     config.puppeteerOptions.userDataDir && !fs.existsSync(config.puppeteerOptions.userDataDir) )) {
    // attempt to apply a default value
    let chromeExecutablePath = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'Chrome.exe');
    let chromeUserDataDir = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default');
    if (fs.existsSync(chromeExecutablePath) && fs.existsSync(chromeUserDataDir)) {
        console.log("Chrome executable and user data found at expected locations, so those defaults will be used if not overridden.");
        config.puppeteerOptions.executablePath = chromeExecutablePath;
        config.puppeteerOptions.userDataDir = chromeUserDataDir;
    }
}


module.exports = config;