// const Toastify = require('toastify-js');
const os = require('os');
const { contextBridge, ipcRenderer } = require('electron');

// contextBridge.exposeInMainWorld('Toastify', {
//   toast: (options) => Toastify(options).showToast(),
// });

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});

let bridge = {
  updateMessage: (callback) => ipcRenderer.on("updateMessage", callback),
};

contextBridge.exposeInMainWorld("bridge", bridge);

contextBridge.exposeInMainWorld('os', {
  username: () => os.hostname(),
  userInfo: () => os.userInfo()
});

