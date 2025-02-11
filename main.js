const { app, BrowserWindow, screen, ipcMain, Menu, net, Tray } = require('electron');
const { autoUpdater } = require("electron-updater");
const path = require('path');
const socket = require('net');
const os = require('os');
const qs = require('qs');
const fs = require('fs');
const axios = require('axios');
const packageJson = require('./package.json');
const ldap = require('ldapjs');
const AutoLaunch = require('auto-launch');
const log = require('electron-log');
const sudo = require('sudo-prompt');
const { dialog } = require('electron');
require('dotenv').config();
// Auto-update configuration
const updateMarkerFile = path.join(app.getPath("userData"), "update-in-progress");
const postUpdateScript = "C:\\Program Files\\ZerofAI\\resources\\post-update.bat"; // Update path
let jsonData = null;
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'debug';
const appLauncher = new AutoLaunch({
    name: 'ZerofAI',
    path: app.getPath('exe'), // Path to the executable
});
// const log = require('electron-log');
let solutionRun= null;
appLauncher.isEnabled().then((isEnabled) => {
    if (!isEnabled) {
      appLauncher.enable();
    }
}).catch((err) => {
    log.error(err);
});

const protocol = 'https';
// const port = 5005;
let mainWindow;
var rasaUrl = null;
var itsm_url = null;
var itsm_api_key = null;
var itsm_api_token = null;
var ad_server = null;
var ad_username = null;
var ad_password = null;
var apiUrl = 'https://api.zerofai.ai'
const port = 5005;

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'debug';

const dataToEncrypt = "RmxSWnJJMGxBR3JOVWJrbmt4a3NzRlN3SmhRN1N0MlRhMUNld";
const key = '.Gq0JGP`l&W`t+iLy4Td%-6v6%]tw*bnvn[-`&2kz5Be~2SnI'
function xorEncrypt(data, key) {
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(encrypted);
}

function getMacAddress() {
    const networkInterfaces = os.networkInterfaces();
    const macAddresses = [];
    for (const interfaceName in networkInterfaces) {
        if (networkInterfaces.hasOwnProperty(interfaceName)) {
        const addresses = networkInterfaces[interfaceName];
        const macAddress = addresses[0]?.mac;

        macAddresses.push(macAddress || 'MAC address not available');
        }
    }
    return macAddresses
}

async function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    app.commandLine.appendSwitch('remote-debugging-port', '9222');

    mainWindow = new BrowserWindow({
        width: 500,
        height: 550,
        x: width - 530,
        y: height - 570,
        icon: path.join(__dirname, 'images/chatbot.png'),
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
            devTools: true // Explicitly enable DevTools
        },
    });
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12' && input.type === 'keyDown') {
          mainWindow.webContents.openDevTools();
        }
      });
    // mainWindow.webContents.openDevTools({ mode: 'detach' });


    // Get application configuration
    let app_config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${apiUrl}/portal/api/v1/application/configuration/`,
        headers: {
        'Authorization': xorEncrypt(dataToEncrypt, key),
        }
    };

    console.log('updateMarkerFile', updateMarkerFile);

    await axios.request(app_config)
    .then((response) => {
        jsonData = response.data.meta_data;

        response = response.data
        itsm_url = response.itsm_api_url;
        itsm_api_key = response.itsm_api_key;
        itsm_api_token = response.itsm_api_token;
        ad_server = response.ad_server;
        ad_username = response.ad_username;
        ad_password = response.ad_password;
        rasaUrl = response.rasa_url;

        mainWindow.webContents.on('did-finish-load', () => {
          mainWindow.webContents.send('send-json', jsonData);
        });
    })
    .catch((error) => {
        log.info(error);
    });
    const tray = new Tray(path.join(__dirname, 'images/chatbot.png')); // Replace 'icon.png' with your tray icon path
    const contextMenu = Menu.buildFromTemplate([
        {
        label: 'Show App',
        click: () => {
            mainWindow.show();
        },
        },
        {
        label: 'Quit',
        click: () => {
            app.isQuitting = true;
            app.quit();
        },
        },
    ]);

    tray.setToolTip('ZerofAI');
    tray.setContextMenu(contextMenu);

    // Restore the window when clicking the tray icon
    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
    macAddresses = getMacAddress()
    let data = JSON.stringify({
        "hostname": os.hostname(),
        "mac_address": macAddresses[0],
        "version": packageJson.version
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${apiUrl}/portal/api/v1/host/`,
        headers: {
            'Authorization': xorEncrypt(dataToEncrypt, key),
            'Content-Type': 'application/json',
        },
        data : data
    };
    axios.request(config)
    .then((response) => {
        mainWindow.loadFile(path.join(__dirname, 'src/chatbot/chatbot.html'));
    })
    .catch((error) => {
        console.log(error);
        mainWindow.loadFile(path.join(__dirname, 'src/chatbot/error.html'));
    });
}

setInterval(() => {
    autoUpdater.checkForUpdates()
        .then(result => {
            log.info('Update check result:', result);
        })
        .catch(err => {
            log.error('Update check failed:', err);
            mainWindow.webContents.send('update_error', err.message);
        });
}, 60000);
autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update_available', info.version);
    fs.writeFileSync(updateMarkerFile, "update");
    autoUpdater.downloadUpdate();
});

autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update_status', `No updates available. Current version ${packageJson.version}`);
});

autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update_downloaded', info.version);
});

autoUpdater.on('error', (err) => {
    log.error("Auto-update error details:", err);
    // Check for specific error types
    let errorMsg;
    if (err.code === 'ERR_INTERNET_DISCONNECTED') {
        errorMsg = 'Internet connection required for updates';
    } else if (err.code === 'GITHUB_API_ERROR') {
        errorMsg = 'GitHub authentication issue - contact administrator';
    } else {
        errorMsg = 'Update service temporarily unavailable';
    }
    mainWindow.webContents.send('update_error', errorMsg);
});

ipcMain.on('restart_app', () => {
    const dialogOpts = {
        type: 'info',
        buttons: ['Restart now', 'Later'],
        title: 'Application Update',
        message: "A new version has been downloaded. Restart to complete the update.",
        detail: `Current version: ${packageJson.version}`
    };

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) {
            app.exit(0);
            autoUpdater.quitAndInstall(true, true);
        }
    });
});

app.whenReady().then(() => {
    createWindow()
    const mainMenu = Menu.buildFromTemplate([])
    Menu.setApplicationMenu(mainMenu);
    if (fs.existsSync(updateMarkerFile)) {
        const options = {
            name: 'ZerofAI Updater'
        };
        console.log('postUpdateScript', postUpdateScript);
        
        sudo.exec(`"${postUpdateScript}"`, options,
            (error, stdout, stderr) => {
                if (error) {
                    log.error('Post-update error:', error);
                    mainWindow.webContents.send('update_error', `Post-update failed: ${error.message}`);
                    return;
                }
                
                if (fs.existsSync(updateMarkerFile)) {
                    fs.unlinkSync(updateMarkerFile);
                }
            }
        );
    }
    
    // app.on('activate', () => {
    //     if (BrowserWindow.getAllWindows().length === 0) {
    //         createWindow()
    //     }
    // })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

ipcMain.on('send:message', function (event, data) {
    if (data.message == 'reportnewincident') {
        mainWindow.webContents.send('message:loader');
        mainWindow.webContents.send('renderTicket:subject');
    } else {
        let body = JSON.stringify({ 'message': data.message, 'sender': data.sender });
        const request = net.request({
            method: 'post',
            maxBodyLength: Infinity,
            url: `${rasaUrl}/webhooks/rest/webhook`,
            headers: { 
                'Content-Type': 'application/json', 
            },
            data : body
        });
        request.on('response', (response) => {
            if (response.statusCode === 200) {
                response.on('data', (chunk) => {
                    var responseData = JSON.parse(chunk.toString());
                    // console.log(responseData);
                    mainWindow.webContents.send('message:success', responseData);
                    responseData.forEach(data => {
                        if (data.text == 'report-new-incident') {
                            mainWindow.webContents.send('message:loader');
                            mainWindow.webContents.send('renderTicket:subject');
                        }
                    });
                });
            } else {
                response.on('data', (chunk) => {
                    errorMessage = chunk['message'];
                    mainWindow.webContents.send('message:failed', { errorMessage });
                });
            };
        });
        request.on('error', (response) => {
            if (response.message == 'net::ERR_CONNECTION_REFUSED') {
                mainWindow.webContents.send('message:failed', [{ 'text': 'I am sorry. I am unable to connect with chat server.' }])
            };
        });
        mainWindow.webContents.send('message:loader');
        request.setHeader('Content-Type', 'application/json');
        request.write(body, 'utf-8');
        request.end();
    }
});


ipcMain.on('get:solution', function (event, data) {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${apiUrl}/portal/api/v1/solution/?id=${data.id}`,
        headers: {
          'Authorization': xorEncrypt(dataToEncrypt, key),
        }
    };
    axios.request(config)
    .then((response) => {
        // console.log('solutionRun.name', solutionRun)

        // console.log('successText', successText)


        const responseData = response.data.results[0];
        solutionRun = responseData
        const matchingSolution = jsonData['solutions'].find(sol => sol.name.toLowerCase() === solutionRun.name.toLowerCase());
        const successText = matchingSolution ? matchingSolution.afterFixedText : `I have fixed your <b>${solutionRun.solution_name}</b>..!! 😃. Was it helpful for you?`;
        var loaderText = '';
        if (matchingSolution?.loaderText) {
            loaderText = matchingSolution?.loaderText;
        } else{
            if(responseData.type=='exe'){
                 loaderText = `Please wait while we are installing <b>${responseData.name}</b> for you..!!`;
            }else{
                 loaderText = `Please wait while we are fixing <b>${responseData.name}</b> for you..!!`;
            }
        }

        mainWindow.webContents.send('solution:loader', loaderText);
        // mainWindow.webContents.send('solution:loader', responseData);
        if (responseData.type === 'command') {
            const client = new socket.Socket();
            var command = responseData.command;
            command = command.replace('<hostname>', os.userInfo().username);
            client.connect(12345, '127.0.0.1', () => {
                client.write(command);
            });
            client.on('data', (data) => {
                console.log(`Received: ${data}`);
            });
            client.on('close', () => {
                mainWindow.webContents.send('solution:success');
                var responseData = [{
                    'text': successText,
                    'buttons': [
                        { 'payload': '/yes', 'title': 'Yes' },
                        { 'payload': '/no', 'title': 'No' }
                    ]
                }]
                solutionRun = null;
                mainWindow.webContents.send('message:success', responseData);
            });
        }else if (responseData.type === 'exe') {
            const url = responseData.exe_file;
            const fileName = path.basename(url);
            const destination = path.join(app.getPath('downloads'), fileName);
        
            downloadFile(url, destination)
                .then(() => {
                    setTimeout(() => {
                        log.info('Download completed:', destination);
                        const fileExtension = path.extname(destination).toLowerCase();
                        const client = new socket.Socket();
                        let command;
        
                        if (fileExtension === '.msi') {
                            command = destination + ' -ms';
                        } else if (fileExtension === '.exe') {
                            command = `run_exe_command ${destination}`;
                        }
        
                        client.connect(12345, '127.0.0.1', () => {
                            log.info('Connected');
                            client.write(command);
                        });
        
                        client.on('data', (data) => {
                            log.info(`Received: ${data}`);
                        });
        
                        client.on('close', () => {
                            if (fileExtension === '.msi' || fileExtension === '.exe') {
                                fs.unlink(destination, (err) => {
                                    if (err) {
                                        log.info('Error deleting file:', err);
                                    } else {
                                        log.info('File deleted successfully');
                                    }
                                });
                            }
        
                            mainWindow.webContents.send('solution:success');

                            const matchingSolution = jsonData['solutions'].find(sol => sol.name.toLowerCase() === solutionRun.name.toLowerCase());
                            const successInstallationText = matchingSolution ? matchingSolution.afterFixedText : `I have fixed your <b>${solutionRun.solution_name}</b>..!! 😃. Was it helpful for you?`;

                    
        
                            const responseData = [{
                                'text': successInstallationText ? successInstallationText : `I have installed <b>${solutionRun.solution_name}</b>..!! 😃`,
                                'buttons': [
                                    { 'payload': '/yes', 'title': 'Yes' },
                                    { 'payload': '/no', 'title': 'No' }
                                ]
                            }];
                            solutionRun = null;
                            mainWindow.webContents.send('message:success', responseData);
                        });
                    }, 5000);
                })
                .catch((error) => {
                    log.info(error);
                });
        }
        else {
                // downloadFile(url, destination)
                // .then(() => {
                //     console.log('Download completed:', destination);
                //     const client = new socket.Socket();
                //     var command = destination + ' -ms';
                //     client.connect(12345, '127.0.0.1', () => {
                //         console.log('Connected');
                //         client.write(command);
                //     });
                //     client.on('data', (data) => {
                //         console.log(`Received: ${data}`);
                //     });
                //     client.on('close', () => {
                //         fs.unlink(destination, (err) => {
                //             if (err) {
                //                 console.error('Error deleting file:', err);
                //             } else {
                //                 console.log('File deleted successfully');
                //             }
                //             });
                //         mainWindow.webContents.send('solution:success');
                //         var responseData = [{
                //             'text': `I have installed <b>${solutionRun.name}<b>..!! 😃. Was it helpful for you?`,
                //             'buttons': [
                //                 { 'payload': '/yes', 'title': 'Yes' },
                //                 { 'payload': '/no', 'title': 'No' }
                //             ]
                //         }]
                //         solutionRun = null;
                //         mainWindow.webContents.send('message:success', responseData);
                //     });
                // })
                // .catch(error => {
                //     console.error('Download error:', error);
                // });
            }
        }
    )
    .catch((error) => {
        console.log(error);
    });
})

const downloadFile = async (url, destination) => {
    url = apiUrl + url;
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });

    const writer = fs.createWriteStream(destination);

    return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};

ipcMain.on('generate:ticket', function (event, data) {
    mainWindow.webContents.send('message:loader');
    let payload = qs.stringify({
        'input_data': `{
            "request": {
                "subject": "CHATBOT GENERATED - ${data.subject}",
                "description": "${data.description}",
                "requester": {"login_name": "${os.userInfo().username}"},
                "account": {
                    "name": "Demo_MS"
                }
            }
        }`
    });

    // Add this after the payload is created
const rawPayload = {
    request: {
        subject: `CHATBOT GENERATED - ${data.subject}`,
        description: data.description,
        requester: {login_name: os.userInfo().username},
        account: {
            name: "Demo_MS"
        }
    }
};

console.log('Postman Ready Payload:', rawPayload);


    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: itsm_url,
        headers: {
            'authtoken': itsm_api_token,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: payload
    };
  
    axios.request(config)
        .then((response) => {
            console.log('res', response);
            mainWindow.webContents.send('ticketCreation:success', response.data);
        })
        .catch((error) => {
            mainWindow.webContents.send('message:failed', [{ 'text': `I am sorry. Something went wrong, please contact administrator. ${error}` }]);
        });
});

ipcMain.on('create:solutionRunEntry', function (event, data) {
    macAddresses = getMacAddress()
    let payload = JSON.stringify({
        "hostname": os.hostname(),
        "solution": data.solution,
        'type': data.type
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${apiUrl}/portal/api/v1/solution/run/`,
        headers: {
            'Authorization': xorEncrypt(dataToEncrypt, key),
            'Content-Type': 'application/json',
        },
        data : payload
    };
    axios.request(config)
    .then((response) => {
        mainWindow.webContents.send('set:solutionId', response.data.solution_run_id);
        console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
        console.log(error);
    });
});

ipcMain.on('create:feedback', function (event, data) {
    macAddresses = getMacAddress()
    let payload = JSON.stringify({
        "hostname": os.hostname(),
        "solution": data.solution,
        'type': data.type,
        "feedback": data.ratings
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${apiUrl}/portal/api/v1/feedback/`,
        headers: {
            'Authorization': xorEncrypt(dataToEncrypt, key),
            'Content-Type': 'application/json',
        },
        data : payload
    };
    axios.request(config)
    .then((response) => {
        console.log(JSON.stringify(response.data));
        mainWindow.webContents.send('message:success', [{ 'text': 'Thanks for your feedback.' }]);
    })
    .catch((error) => {
        console.log(error);
    });
});

ipcMain.on('create:TicketEntry', function (event, data) {
    macAddresses = getMacAddress()
    let payload = JSON.stringify({
        "hostname": os.hostname(),
        "ticket_id": data.ticketNumber,
        'subject': data.description,
        "description": data.description
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${apiUrl}/portal/api/v1/ticket/`,
        headers: {
            'Authorization': xorEncrypt(dataToEncrypt, key),
            'Content-Type': 'application/json',
        },
        data : payload
    };
    console.log('config', config)
    axios.request(config)
    .then((response) => {
        console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
        console.log(error);
    });
});

ipcMain.on('change:password', function (event, data) {
    const username = os.hostname().split('-')[0];
    const oldPassword =  data.oldpassword;
    const newPassword = data.newpassword;
    var options = {
        'rejectUnauthorized': false, 
    };
    const client = ldap.createClient({ url: 'ldap://172.16.19.20', tlsOptions: options });
    const bindDN = 'Administrator@tcplcoe.com';
    const bindPassword = 'Xanadu@@12345';
    client.starttls(options,[], function(err) {
        client.bind(bindDN, bindPassword, function (err) {
            console.log("StartTTLS connection established.")
            client.search('dc=tcplcoe,dc=com', { filter: `(sAMAccountName=${username})`, scope: 'SUBTREE', attributes: ['*'] }, (searchErr, searchRes) => {
                searchRes.on('searchEntry', (entry) => {
                    userDn = entry.dn;
                    console.log('User exists:', username);
                    const userPasswordAttribute = new ldap.Attribute({
                        type: 'unicodePwd',
                        values: Buffer.from(`"${newPassword}"`, 'utf16le')
                    });
                    const change = new ldap.Change({
                        operation: 'replace',
                        modification: userPasswordAttribute
                    });
                    client.modify(userDn, change, (modifyErr) => {
                        if (modifyErr) {
                            console.error(`Error modifying password: ${modifyErr}`);
                            mainWindow.webContents.send('message:failed', [{ 'text': 'Sorry, I am unable to change your password. I am generating a ticket to resolve this issue.' }])
                            mainWindow.webContents.send('change-password-failed', []);
                        } else {
                            console.log(`Password changed successfully for ${username}`);
                            mainWindow.webContents.send('message:success', [{ 'text': 'I have successfully changed your password. Please login with new password.' }])
                        }
                        client.unbind();
                    });
                });
                searchRes.on('error', (error) => {
                  console.error('Search error:', error);
                });
              });
        });
    });
});
