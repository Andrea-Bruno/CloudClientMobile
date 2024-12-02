import { store } from '../store';
import {
  base64ToBuffer,
  bufferToHex,
  bufferToString,
  decodeBase64Url,
  importRsaPublicKey,
} from './proxy-cryptography-utils';
import {
  executeRequest,
  getDir,
  getGroup,
  GetStorageInfo,
  search,
  setClient,
} from './data-transmission-utils';
import { hash256 } from './encryption-utils';
import { setCloudMemory } from '../reducers/profileActionsReducer';
import { command, fileTypes } from '../constants';
import { setScreenBehavior } from '../reducers/screenControllerReducer';
import { goBackLocation, goToLocation, setFavoritesList } from '../reducers/fileReducer';
import {
  setProxyMMKV,
  setUserPublicAndPrivetKeyMMKV,
  setUserQrMMKV,
  setUserSecretDataMMKV,
  setUserServerIdMMKV,
} from './mmkv';
import { setAuthWait, setUserSecretDataToRedux } from '../reducers/userSecretDataReducer';
import { URL } from 'react-native-url-polyfill';
import { setProxy } from '../reducers/proxyReducer';

export function formatBytes(a, b = 2) {
  if (!+a) return '0 Bytes';
  const c = 0 > b ? 0 : b,
    d = Math.floor(Math.log(a) / Math.log(1024));
  return `${parseFloat((a / Math.pow(1024, d)).toFixed(c))} ${['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][d]
    }`;
}

export async function generateKeyRSA() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
  const privateKey = keyPair.privateKey;
  const publicKey = keyPair.publicKey;
  await setUserPublicAndPrivetKeyMMKV(publicKey, privateKey);
  store.dispatch(setUserSecretDataToRedux({ publicKey, privateKey }));
  return exportCryptoKey(publicKey);
}

async function exportCryptoKey(key) {
  const k = await window.crypto.subtle.exportKey('jwk', key);
  let publicKeyB64 = decodeBase64Url(k.n);
  let keyBin = base64ToBuffer(publicKeyB64);
  return hash256(keyBin).then(async (digestHex) => {
    let clientId = bufferToHex(digestHex.slice(0, 8));
    // store.dispatch(setClientId(clientId));
    // store.dispatch(setPublicKeyB64(publicKeyB64))
    store.dispatch(setUserSecretDataToRedux({ publicKeyB64, clientId }));
    await setUserSecretDataMMKV(clientId, publicKeyB64);
  });
}

export async function onQrCodeAcquires(qrCode) {
  const reg = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/; // base64 regex;
  if (reg.test(qrCode) === false) {
    store.dispatch(setAuthWait(false));
    throw new Error('Qr format not valid');
  }

  let qr = base64ToBuffer(qrCode);
  await setUserQrMMKV(qrCode);
  let offset = 0;
  let type = new Uint8Array(qr.slice(offset, 1))[0];
  offset += 1;
  if (type == 1) {
    let mSize = 2048 / 8; //NOTE: modules with sizes different of 2048 give an error during encryption in JavaScript
    let modulus = qr.slice(offset, offset + mSize);
    offset += mSize;
    let exponent = qr.slice(offset, offset + 3);
    offset += 3;
    let serverPublicKey = qr.slice(offset, offset + 33);
    offset += 33;
    let entryPoint = bufferToString(qr.slice(offset)); //proxy ;

    await entryPointToProxy(entryPoint);
    return hash256(serverPublicKey).then(async (hash) => {
      let serverId = bufferToHex(hash.slice(0, 8));
      store.dispatch(setUserSecretDataToRedux({ serverId }));
      await setUserServerIdMMKV(serverId);
      importRsaPublicKey(modulus, exponent).then((rsaPubKey) => {
        setClient(rsaPubKey);
      });
    });
  } else if (type == 2) {
    let QrKey = qr.slice(offset, offset + 24);
    store.dispatch(setUserSecretDataToRedux({ qr: QrKey }));
    offset += 24;
    let serverId = bufferToHex(qr.slice(offset, offset + 8));
    store.dispatch(setUserSecretDataToRedux({ serverId }));
    offset += 8;
    let entryPoint = bufferToString(qr.slice(offset)); //proxy ;
    await entryPointToProxy(entryPoint);
    executeRequest(command.GetEncryptedQR);
  } else {
    throw new Error('QR code format not supported!');
  }
}

async function entryPointToProxy(ep) {
  if (ep == null || ep == '') {
    ep = 'server.cloudservices.agency';
  } else if (ep.indexOf('.') == -1) {
    ep = ep + '.cloudservices.agency';
  }
  let json = await resolveDNS(ep);
  if (json.Answer && json.Answer.length > 0) {
    ep = json.Answer[0].data;
  }
  if (!ep.startsWith('http')) {
    ep = 'http://' + ep;
  }
  store.dispatch(setProxy(ep));
  await setProxyMMKV(ep);
  let proxy = store.getState().proxyManager.proxy;
  if (proxy.replace('://', '').indexOf(':') == -1) {
    store.dispatch(setProxy(proxy + ':' + 5050));
    await setProxyMMKV(proxy + ':' + 5050);
    // proxy += ":" + defaultProxyPort;
  }
}

async function resolveDNS(url) {
  if (url.indexOf('://') == -1) {
    url = 'http://' + url;
  }
  let builder = new URL(url);
  var host = builder.host;
  let provider = 'https://dns.google/resolve?name=' + host;
  let response = await fetch(provider);
  let json = await response.json();
  return json;
}

export const getFileType = (file) => {
  file = file?.split('.').reverse()[0].toLowerCase();
  return fileTypes[file] ? fileTypes[file] : 'other';
};

export const parseDateTime = (dateTime) => {
  let date = new Date(dateTime);
  // return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  return date.toLocaleDateString();
};

const getPathByName = (name) => {
  const location = store.getState().files.location;
  if (location.length) return `${location}/${name}`;
  else return name;
};

export const lastNameGenerator = (name) => name?.split('/').reverse()[0];

export const locationGenerator = (full) => {
  let generated = full?.split('/');
  generated.pop();
  return generated.join('/');
};

export const parseFile = (fileContent, not, loc) => {
  const files = [];
  fileContent?.filter((e) => {
    const name = e.Name.replace('loudBoxNuget/Cloud0/', '');
    e.Name !== '..' &&
      files.push({
        title: name,
        type: e.IsDirectory ? 'folder' : getFileType(name),
        name: lastNameGenerator(name),
        source: 'data:image/png;base64,' + e.Thumbnail,
        Thumbnail: e.Thumbnail,
        description: parseDateTime(e.Date),
        path: not ? getPathByName(name) : name,
        location: loc ?? locationGenerator(name),
        Length: e.Length,
        // favorite: store.getState().files.favorites?.includes(path),
      });
  });

  return files.sort((a) => (a.type === 'folder' ? -1 : 1));
};

export const navigateToFolder = async (path, routeName) => {
  store.dispatch(goToLocation(path));
  store.dispatch(setScreenBehavior({ routeName, loader: true, blocker: false }));
  const data = await getDir(store.getState().files.location);
  store.dispatch(setScreenBehavior({ routeName, loader: false, blocker: data ? true : false }));
  return parseFile(data, true, store.getState().files.location);
};

export const navigateToBack = async (routeName) => {
  store.dispatch(goBackLocation(store.getState().files.location));
  store.dispatch(setScreenBehavior({ routeName, loader: true, blocker: false }));
  const data = await getDir(store.getState().files.location);
  store.dispatch(setScreenBehavior({ routeName, loader: false, blocker: data ? true : false }));
  return parseFile(data);
};

export const getAllImages = async () => {
  store.dispatch(setScreenBehavior({ routeName: 'MediaScreen', loader: true, blocker: false }));
  const data = await search('', '[^s]+(.*?).(jpg|jpeg|png|gif|ico|JPG|JPEG|PNG|GIF)$', 0, -1);
  store.dispatch(
    setScreenBehavior({ routeName: 'MediaScreen', loader: false, blocker: data ? true : false })
  );
  return parseFile(data);
};

export const getFavorites = async () => {
  store.dispatch(setScreenBehavior({ routeName: 'FavoriteScreen', loader: true, blocker: false }));
  const data = await getGroup('favorities');
  const names = data?.map((items) => items.Name.replace('loudBoxNuget/Cloud0/', ''));
  store.dispatch(setFavoritesList(names));
  store.dispatch(
    setScreenBehavior({ routeName: 'FavoriteScreen', loader: false, blocker: data ? true : false })
  );
  return parseFile(data);
};

export const storageInfo = async () => {
  const info = await GetStorageInfo();
  store.dispatch(setCloudMemory(info));
  return parseInt(info?.totalMemory);
};


export function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

export function timeConvert(time) {
  if (time < 60 && time > 0) return `${time} seconds`;
  else if (time > 60 && time < 3600) return `${Math.floor(time / 60)} minutes`;
  else if (time > 3600) return `${Math.floor(time / 3600)} hour`;
  else return '..calculating';
}

export const groupsByFolder = (arr) => {
  let groups = {};
  if (!Array.isArray(arr)) {
    arr = arr.split();
  }

  const filtered = arr.map((x) => {
    const spl = x.split('/');
    return { path: spl.slice(0, -1).join('/'), name: spl.pop() };
  });

  for (let el of filtered) {
    if (groups[el.path]) {
      groups[el.path].push(el.name);
    } else {
      groups[el.path] = [];
      groups[el.path].push(el.name);
    }
  }

  return Object.entries(groups);
};
