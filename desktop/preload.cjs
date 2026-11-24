const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('setup',{save:(data)=>ipcRenderer.invoke('create-owner',data)});
