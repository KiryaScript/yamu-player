'use strict';const electron=require('electron'),logger$1=require('electron-log'),os=require('node:os'),semver$1=require('semver'),electronUpdater=require('electron-updater'),Store=require('electron-store'),node_crypto=require('node:crypto'),fs=require('node:fs/promises'),path=require('node:path'),intlMessageformat=require('intl-messageformat'),icuMessageformatParser=require('@formatjs/icu-messageformat-parser'),url=require('node:url'),cron=require('node-cron'),electronCertificateVerification=require('@yandex-music-int/electron-certificate-verification');function _interopNamespaceDefault(e){const n=Object.create(null);if(e){for(const k in e){if(k!=='default'){const d=Object.getOwnPropertyDescriptor(e,k);Object.defineProperty(n,k,d.get?d:{enumerable:true,get:function(){return e[k]}});}}}n.default=e;return Object.freeze(n)}const path__namespace=/*#__PURE__*/_interopNamespaceDefault(path);var Platform = /* @__PURE__ */ ((Platform2) => {
  Platform2["WINDOWS"] = "win32";
  Platform2["MACOS"] = "darwin";
  Platform2["LINUX"] = "linux";
  return Platform2;
})(Platform || {});const firstLine = (message) => {
  if (typeof message === "string") {
    const [line] = message.split("\n");
    return line;
  }
  return message;
};
const dateFormatter = new Intl.DateTimeFormat("ru", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  fractionalSecondDigits: 3,
  hour12: false
});
const formatLog = ({ message }) => {
  const date = dateFormatter.format(message.date);
  const prefix = `[${date}] [${message.level}] (${message.scope})`;
  const data = message.data.map(
    (chunk) => chunk instanceof Error ? `${chunk.name} ${firstLine(chunk.message)}` : chunk
  );
  return [prefix, ...data];
};const appConfig={appProtocol:"music-application",appHostname:"desktop",deeplinkProtocol:"yandexmusic",errorBooster:{project:"'music.frontend.desktop'",clickUrl:"https://yandex.ru/clck/click",clickErrorCounter:"690.2354"},systemDefaultLanguage:"en",systemLanguages:["ru","en","kk","uz"]};const buildInfo={VERSION:"5.116.3",BRANCH:"9514e66969bd27e00a6f2403bbaf4675da866692",BUILD_TIME:"2026-08-20T16:42:38Z"};const common={SHOW_RELEASE_NOTES:false,CERTIFICATE_VERIFICATION_ENABLED:true,REVOCATION_DEFENSE_ENABLED:false,REFRESH_EVENT_TRIGGER_TIME_MS:600000,UPDATE_POLL_INTERVAL_MS:1800000,UPDATE_URL:"https://desktop.app.music.yandex.net/stable/",SUPPORT_URL:"/user/ee219503-b69b-9484-405b-6877a510e13c",TERMS_OF_USE_URL:"https://yandex.ru/legal/music_mobile_agreement/",RECOMMENDATIONS_URL:"https://music.yandex.ru/legal/recommendations/ru/#music"};const certificates={yandexInternalHosts:[{hostname:"music.yandex.net",includeSubdomains:true},{hostname:"music.yandex.ru",includeSubdomains:true},{hostname:"music.yandex.com",includeSubdomains:true},{hostname:"music.yandex.by",includeSubdomains:true},{hostname:"music.yandex.kz",includeSubdomains:true},{hostname:"strm.yandex.net",includeSubdomains:true},{hostname:"ynison.music.yandex.tld",includeSubdomains:true},{hostname:"mds.yandex.net",includeSubdomains:true},{hostname:"s3.yandex.net",includeSubdomains:true},{hostname:"strm.yandex.ru",includeSubdomains:true},{hostname:"widget.tickets.yandex.ru"},{hostname:"avatars.yandex.net"},{hostname:"favicon.yandex.net"},{hostname:"cdn.yandex.net",includeSubdomains:true}],nucHosts:[{hostname:"yandex.ru",includeSubdomains:true},{hostname:"yandex.com",includeSubdomains:true},{hostname:"yandex.kz",includeSubdomains:true},{hostname:"yandex.uz",includeSubdomains:true},{hostname:"yandex.by",includeSubdomains:true},{hostname:"ya.ru",includeSubdomains:true},{hostname:"ya.com",includeSubdomains:true},{hostname:"ya.kz",includeSubdomains:true},{hostname:"ya.uz",includeSubdomains:true},{hostname:"ya.by",includeSubdomains:true},{hostname:"desktop.app.music.yandex.net"},{hostname:"cdn.yandex.net",includeSubdomains:true}],revocationDefenseHosts:[{hostname:"music.yandex.net",includeSubdomains:true},{hostname:"strm.yandex.net",includeSubdomains:true},{hostname:"mds.yandex.net",includeSubdomains:true},{hostname:"s3.yandex.net",includeSubdomains:true},{hostname:"strm.yandex.ru",includeSubdomains:true},{hostname:"widget.tickets.yandex.ru"},{hostname:"avatars.yandex.net"},{hostname:"favicon.yandex.net"},{hostname:"cdn.yandex.net",includeSubdomains:true}]};const meta={PRODUCT_NAME_LOCALIZED:"Яндекс Музыка"};
const config = {
  app: appConfig,
  buildInfo,
  meta,
  common,
  certificates
};
const applyCommonConfig = (commonConfig) => {
  Object.assign(config.common, commonConfig ?? {});
};const mergeOptions = (original, mergable) => {
  const result = {
    ...original,
    ...mergable
  };
  if (original.headers || mergable.headers) {
    result.headers = {
      ...original.headers,
      ...mergable.headers
    };
  }
  if (original.retryPolicy || mergable.retryPolicy) {
    result.retryPolicy = {
      ...original.retryPolicy,
      ...mergable.retryPolicy,
      statusCodes: {
        ...original.retryPolicy?.statusCodes,
        ...mergable.retryPolicy?.statusCodes
      }
    };
  }
  return result;
};const defaultTotalRequestsLimit = 3;const defaultRetryPolicy = {
  statusCodes: {
    408: {
      attempts: [2e3, 5e3]
    },
    429: {
      attempts: [2e3, 5e3]
    },
    500: {
      attempts: [1e3, 3e3]
    },
    502: {
      attempts: [1e3, 3e3]
    },
    503: {
      attempts: [1e3, 3e3]
    },
    504: {
      attempts: [2e3, 5e3]
    },
    NON_HTTP_ERROR: {
      attempts: [1e3, 1e3]
    },
    TIMEOUT: {
      attempts: [500]
    }
  },
  totalRequestsLimit: defaultTotalRequestsLimit
};const defaultTimeout = 1e4;var ErrorStatusCode = /* @__PURE__ */ ((ErrorStatusCode2) => {
  ErrorStatusCode2["NON_HTTP_ERROR"] = "NON_HTTP_ERROR";
  ErrorStatusCode2["TIMEOUT"] = "TIMEOUT";
  return ErrorStatusCode2;
})(ErrorStatusCode || {});class FetchRequestError extends Error {
  message;
  status;
  url;
  headers;
  constructor({ message, status, url, headers }) {
    super(message);
    this.message = message;
    this.headers = headers;
    this.status = status;
    this.url = url;
    Object.setPrototypeOf(this, FetchRequestError.prototype);
  }
}const requestWithTimeout = (url, fetch, options, delay) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      request(url, fetch, options).then(resolve).catch((error) => {
        reject(error);
      });
    }, delay ?? 0);
  });
};
function request(url, fetch, options) {
  const timeout = options.timeout || defaultTimeout;
  const retryPolicy = options.retryPolicy || defaultRetryPolicy;
  const totalRequestsLimit = retryPolicy.totalRequestsLimit || defaultTotalRequestsLimit;
  const retryCount = typeof options.retryCount === "number" ? options.retryCount : 0;
  const controller = new AbortController();
  const signal = controller.signal;
  return new Promise(async (resolve, reject) => {
    const abortTimeout = setTimeout(() => {
      reject(
        new FetchRequestError({
          message: "HTTP_CLIENT_ERROR",
          status: ErrorStatusCode.TIMEOUT,
          url
        })
      );
      controller.abort();
    }, timeout);
    try {
      const response = await fetch(url, { ...options, signal });
      clearTimeout(abortTimeout);
      if (response?.ok) {
        return resolve(response);
      }
      throw new FetchRequestError({
        url,
        message: response.statusText,
        status: response.status ?? ErrorStatusCode.NON_HTTP_ERROR,
        headers: response.headers
      });
    } catch (err) {
      clearTimeout(abortTimeout);
      const error = err;
      const status = error?.status ?? ErrorStatusCode.NON_HTTP_ERROR;
      const retryAttempts = retryPolicy?.statusCodes[status]?.attempts ?? [];
      if (retryCount < retryAttempts.length && retryCount < totalRequestsLimit - 1) {
        const delay = retryAttempts[retryCount];
        requestWithTimeout(url, fetch, { ...options, retryCount: retryCount + 1 }, delay).then(resolve).catch(reject);
      } else {
        reject(
          new FetchRequestError({
            url,
            message: error?.message,
            status: error?.status ?? ErrorStatusCode.NON_HTTP_ERROR,
            headers: error?.headers
          })
        );
      }
    }
  }).catch((error) => {
    if (error?.status === ErrorStatusCode.TIMEOUT) {
      const retryAttempts = retryPolicy?.statusCodes?.TIMEOUT?.attempts ?? [];
      if (retryCount < retryAttempts.length && retryCount < totalRequestsLimit - 1) {
        const delay = retryPolicy?.statusCodes.TIMEOUT?.attempts[retryCount];
        return requestWithTimeout(url, fetch, { ...options, retryCount: retryCount + 1 }, delay);
      }
    }
    throw error;
  });
}class ElectronNetHttpClient {
  constructor(options = {}) {
    this.options = options;
  }
  isOnline() {
    return electron.app.isReady() && electron.net.isOnline();
  }
  async get(path, options = {}) {
    return request(path, electron.net.fetch, { ...mergeOptions(this.options, options), method: "GET" });
  }
  async post(path, options = {}) {
    return request(path, electron.net.fetch, { ...mergeOptions(this.options, options), method: "POST" });
  }
  async put(path, options = {}) {
    return request(path, electron.net.fetch, { ...mergeOptions(this.options, options), method: "PUT" });
  }
  async patch(path, options = {}) {
    return request(path, electron.net.fetch, { ...mergeOptions(this.options, options), method: "PATCH" });
  }
  async delete(path, options = {}) {
    return request(path, electron.net.fetch, { ...mergeOptions(this.options, options), method: "DELETE" });
  }
  async head(path, options = {}) {
    return request(path, electron.net.fetch, { ...mergeOptions(this.options, options), method: "HEAD" });
  }
}const CLICK_REQUEST_HEADERS = {
  "Content-Type": "text/plain;charset=UTF-8",
  "Accept-Encoding": "deflate, gzip, br"
};const PASSPORT_LOGIN = "yandex_login";
const PASSPORT_LOGIN_DOMAIN = ".yandex.ru";
const YANDEX_ID = "yandexuid";const getUserYandexId = async () => {
  try {
    const cookie = await electron.session.defaultSession.cookies.get({
      name: YANDEX_ID,
      domain: PASSPORT_LOGIN_DOMAIN
    });
    return cookie?.[0]?.value;
  } catch {
    return void 0;
  }
};const stringifyPayloadData = (path, { user, service, payload, dateTime }) => {
  const data = {
    "-region": user?.region,
    "-yandexid": user?.yandexId,
    "-loggedin": user?.loggedIn,
    "-project": service.project,
    "-env": service.env,
    "-platform": service.platform,
    "-version": service.version,
    "-page": payload.page,
    "-msg": payload.message,
    "-level": payload.level,
    "-stack": payload.stack,
    "-sourceMethod": payload.sourceMethod,
    "-source": payload.source,
    "-additional": payload.additional
  };
  const vars = Object.keys(data).map((key) => {
    let chunk;
    if (typeof data[key] === "object") {
      try {
        chunk = JSON.stringify(data[key]);
      } catch {
        chunk = "[Value can not be stringified]";
      }
    } else {
      chunk = String(data[key]);
    }
    return key + "=" + encodeURIComponent(chunk).replace(/\*/g, "%2A");
  }).join(",");
  return `/path=${path}/vars=${vars}/cts=${dateTime}/*`;
};const BATCH_SIZE = 3;
const OFFLINE_THROTTLE_TIMEOUT = 1e4;
const SERVICE_CONFIG = {
  project: config.app.errorBooster.project,
  version: config.buildInfo.VERSION,
  platform: "desktop"
};
class ErrorBooster {
  httpClient;
  payloadsForSending = [];
  scheduledRequestTimeout;
  logger;
  constructor() {
    this.logger = new Logger("ErrorBooster");
    this.httpClient = new ElectronNetHttpClient({
      headers: CLICK_REQUEST_HEADERS
    });
  }
  async sendData(payload) {
    const stringifiedPayload = stringifyPayloadData(config.app.errorBooster.clickErrorCounter, {
      user: {
        yandexId: await getUserYandexId()
      },
      service: SERVICE_CONFIG,
      payload,
      dateTime: payload.dateTime || Number((/* @__PURE__ */ new Date()).getTime())
    });
    if (this.httpClient.isOnline()) {
      try {
        await this.requestToClick(stringifiedPayload);
      } catch (error) {
        this.logSendingError(error);
      }
    } else {
      this.payloadsForSending.push(stringifiedPayload);
      this.scheduleRequest();
    }
  }
  logSendingError(error) {
    this.logger.warn("Error sending data to ErrorBooster", error);
  }
  async requestToClick(body) {
    await this.httpClient.post(config.app.errorBooster.clickUrl, { body });
  }
  scheduleRequest() {
    clearTimeout(this.scheduledRequestTimeout);
    if (!this.payloadsForSending.length) {
      return;
    }
    this.scheduledRequestTimeout = setTimeout(async () => {
      if (this.httpClient.isOnline()) {
        const batchSize = this.payloadsForSending.length < BATCH_SIZE ? this.payloadsForSending.length : BATCH_SIZE;
        const batch = this.payloadsForSending.splice(-batchSize);
        try {
          await this.requestToClick(batch.join("\r\n"));
        } catch (error) {
          this.logSendingError(error);
          this.payloadsForSending.push(...batch);
        }
      }
      this.scheduleRequest();
    }, OFFLINE_THROTTLE_TIMEOUT);
  }
}const getErrorBoosterTransport = () => {
  const errorBooster = new ErrorBooster();
  const transport = function(logMessage) {
    if (logMessage.level !== "error") {
      return;
    }
    const logChunks = logMessage.data || [];
    const error = logChunks.find((data) => data instanceof Error);
    const message = logChunks.find((data) => typeof data === "string");
    const info = logChunks.map((data) => {
      let result;
      if (typeof data === "string") {
        result = data;
      } else if (data instanceof Error) {
        result = data.toString();
      } else {
        try {
          result = JSON.stringify(data);
        } catch {
          result = "[Value can not be stringified]";
        }
      }
      return result;
    }).join(", ");
    errorBooster.sendData({
      message: message || error?.message || "UnknownError",
      stack: error?.stack,
      level: logMessage.level,
      source: logMessage.scope,
      additional: {
        os: os.version(),
        info
      },
      dateTime: Number(logMessage.date?.getTime())
    });
  };
  transport.level = "error";
  transport.transforms = [];
  return transport;
};class Logger {
  constructor(scope) {
    this.scope = scope;
    this.logger = logger$1.scope(scope);
  }
  logger;
  log(...data) {
    this.logger.log(...data);
  }
  info(...data) {
    this.logger.info(...data);
  }
  error(...data) {
    this.logger.error(...data);
  }
  warn(...data) {
    this.logger.warn(...data);
  }
  debug(...data) {
    this.logger.debug(...data);
  }
  verbose(...data) {
    this.logger.verbose(...data);
  }
  silly(...data) {
    this.logger.silly(...data);
  }
  withPrefix(...prefix) {
    const methods = ["log", "info", "error", "warn", "debug", "verbose", "silly"];
    return methods.reduce((logger2, method) => {
      logger2[method] = (...data) => this.logger[method](...prefix, ...data);
      return logger2;
    }, {});
  }
  static startCatching(options) {
    logger$1.errorHandler.startCatching(options);
  }
  static setupLogger() {
    logger$1.transports.errorBooster = getErrorBoosterTransport();
    logger$1.transports.console.format = formatLog;
    logger$1.transports.file.format = formatLog;
  }
}const devicePlatform = os.platform();const state = {
  isWindowHidden: false,
  isMinimized: false,
  willQuit: false,
  lastWindowBlurredOrHiddenTime: 0,
  deeplink: null,
  player: {
    isPlaying: false,
    canMoveBackward: false,
    canMoveForward: false
  }
};const UNIVERSAL_DIGIT_REGEX = /[014589cd]/;
const ZERO_MAC_REGEX = /(?:[0]{1,2}[:-]){5}[0]{1,2}/;
const isGloballyUniqueMacAddress = (mac) => {
  const digit = mac[1];
  if (!digit) {
    return false;
  }
  return UNIVERSAL_DIGIT_REGEX.test(digit.toLowerCase());
};
const getMac = () => {
  for (const config of Object.values(os.networkInterfaces())) {
    if (!config) {
      continue;
    }
    for (const iface of config) {
      if (ZERO_MAC_REGEX.test(iface.mac)) {
        continue;
      }
      if (isGloballyUniqueMacAddress(iface.mac)) {
        return iface.mac;
      }
    }
  }
  return;
};
const generateDeviceId = () => {
  const data = [os.hostname(), os.platform(), os.machine(), os.totalmem(), getMac()].join();
  return node_crypto.createHash("sha256").update(data).digest("hex");
};var StoreKeys = /* @__PURE__ */ ((StoreKeys2) => {
  StoreKeys2["VERSION"] = "version";
  StoreKeys2["HAS_RECENTLY_LAUNCHED"] = "hasRecentlyLaunched";
  StoreKeys2["UUID"] = "uuid";
  StoreKeys2["DEVICE_ID"] = "deviceId";
  StoreKeys2["DEVICE_SOFTWARE_REVISION"] = "deviceSoftwareRevision";
  StoreKeys2["DEVICE_CPU_REVISION"] = "deviceCpuRevision";
  StoreKeys2["TRACKS_AVAILABILITY_UPDATED_AT"] = "tracksAvailabilityUpdatedAt";
  StoreKeys2["REPOSITORY_META_UPDATED_AT"] = "repositoryMetaUpdatedAt";
  return StoreKeys2;
})(StoreKeys || {});const store = new Store();
const useCachedValue = (key) => {
  let cachedValue = null;
  const get = () => {
    if (cachedValue) {
      return cachedValue;
    }
    cachedValue = store.get(key);
    return cachedValue;
  };
  const set = (value) => {
    cachedValue = value;
    store.set(key, value);
  };
  return [get, set];
};
const needToShowReleaseNotes = () => {
  const currentVersion = electron.app.getVersion();
  const storeVersion = String(store.get(StoreKeys.VERSION));
  store.set(StoreKeys.VERSION, currentVersion);
  if (!semver$1.valid(storeVersion) || semver$1.gt(currentVersion, storeVersion)) {
    if (config.common.SHOW_RELEASE_NOTES) {
      return true;
    }
  }
  return false;
};
const isFirstLaunch = () => {
  const storeVersion = store.get(StoreKeys.VERSION);
  const hasRecentlyLaunched = Boolean(store.get(StoreKeys.HAS_RECENTLY_LAUNCHED));
  if (storeVersion) {
    store.set(StoreKeys.HAS_RECENTLY_LAUNCHED, true);
    return false;
  }
  if (!hasRecentlyLaunched) {
    store.set(StoreKeys.HAS_RECENTLY_LAUNCHED, true);
  }
  return !hasRecentlyLaunched;
};
const isRevisionChanged = (type, revision) => {
  const storeRevision = store.get(type);
  store.set(type, revision);
  return storeRevision !== revision;
};
const deviceId = useCachedValue(StoreKeys.DEVICE_ID);
const getDeviceId = () => {
  const [get, set] = deviceId;
  let deviceIdValue = get();
  if (deviceIdValue) {
    return String(deviceIdValue);
  }
  deviceIdValue = generateDeviceId();
  set(deviceIdValue);
  return String(deviceIdValue);
};
const tracksAvailabilityUpdatedAt = useCachedValue(StoreKeys.TRACKS_AVAILABILITY_UPDATED_AT);
const repositoryMetaUpdatedAt = useCachedValue(StoreKeys.REPOSITORY_META_UPDATED_AT);const deviceInfoLogger = new Logger("DeviceInfo");
const printObject = (info) => {
  deviceInfoLogger.info(JSON.stringify(info, null, 2));
};const toMB = (bytes) => {
  return Math.round(bytes / 1024 / 1024);
};
const getAppMetrics = () => {
  const metrics = electron.app.getAppMetrics();
  const { cpu, memory } = metrics[0] ?? {};
  const { workingSetSize, peakWorkingSetSize } = memory ?? {};
  return {
    cpu,
    memory: {
      workingSetSizeMB: workingSetSize ? toMB(workingSetSize) : 0,
      peakWorkingSetSizeMB: peakWorkingSetSize ? toMB(peakWorkingSetSize) : 0
    }
  };
};
const getStorage = async () => {
  const [root, folder] = path.normalize(electron.app.getAppPath()).split(path.sep);
  const rootFolder = [root, folder].join(path.sep);
  const { bfree, blocks, bsize } = await fs.statfs(rootFolder);
  return {
    freeMB: toMB(bfree * bsize),
    totalMB: toMB(blocks * bsize)
  };
};
const getMemory = () => {
  return {
    freeMB: toMB(os.freemem()),
    totalMB: toMB(os.totalmem())
  };
};
const getSystemMetrics = async (params) => {
  const systemMetrics = {
    memory: getMemory(),
    storage: await getStorage()
  };
  if (params?.withAppMetrics) {
    systemMetrics.appMetrics = getAppMetrics();
  }
  return systemMetrics;
};
const logSystemMetrics = async (withAppMetrics = false) => {
  try {
    const systemMetrics = await getSystemMetrics({
      withAppMetrics
    });
    printObject(systemMetrics);
  } catch (error) {
    deviceInfoLogger.error("Cannot get system metrics", error);
  }
};var UpdateStatus = /* @__PURE__ */ ((UpdateStatus2) => {
  UpdateStatus2["IDLE"] = "IDLE";
  UpdateStatus2["DOWNLOADING"] = "DOWNLOADING";
  UpdateStatus2["DOWNLOADED"] = "DOWNLOADED";
  UpdateStatus2["INSTALLING"] = "INSTALLING";
  return UpdateStatus2;
})(UpdateStatus || {});const appSuspensionLogger = new Logger("AppSuspension");
let powerSaveBlockerId = null;
const enableSuspensionBlocker = () => {
  disableSuspensionBlocker();
  powerSaveBlockerId = electron.powerSaveBlocker.start("prevent-app-suspension");
  appSuspensionLogger.info("App suspension blocker is enabled");
};
const disableSuspensionBlocker = () => {
  if (typeof powerSaveBlockerId !== "number") {
    return;
  }
  electron.powerSaveBlocker.stop(powerSaveBlockerId);
  appSuspensionLogger.info("App suspension blocker is disabled");
};
const toggleAppSuspension = (enable) => {
  if (enable) {
    enableSuspensionBlocker();
  } else {
    disableSuspensionBlocker();
  }
};const probabilityBuckets = {
  6: "0-5",
  26: "5-25",
  51: "25-50",
  101: "50-100"
};
const isVersionDeprecated = () => {
  if (!config.common.DEPRECATED_VERSIONS) {
    return false;
  }
  return semver$1.satisfies(electron.app.getVersion(), config.common.DEPRECATED_VERSIONS);
};
class Updater {
  latestAvailableVersion = null;
  updateStatus = UpdateStatus.IDLE;
  updaterId = null;
  onUpdateListeners = [];
  logger;
  cancellationToken = null;
  downloadedVersion = null;
  downloadingVersion = null;
  isDownloadingDeprecatedVersion = false;
  constructor() {
    this.logger = new Logger("UpdateLogger");
    electronUpdater.autoUpdater.autoDownload = false;
    electronUpdater.autoUpdater.logger = this.logger.withPrefix('Logger inside "electron-updater" package');
    electronUpdater.autoUpdater.autoRunAppAfterInstall = true;
    electronUpdater.autoUpdater.disableDifferentialDownload = false;
    electronUpdater.autoUpdater.on("error", (error) => {
      this.logger.error("Updater error", error);
    });
    electronUpdater.autoUpdater.on("update-downloaded", (updateInfo) => {
      this.logger.log("Update downloaded", updateInfo.version);
      this.downloadedVersion = updateInfo.version;
      this.downloadingVersion = null;
      this.isDownloadingDeprecatedVersion = false;
      disableSuspensionBlocker();
      if (isVersionDeprecated()) {
        this.logger.info("This version is deprecated", electron.app.getVersion(), config.common.DEPRECATED_VERSIONS);
        this.install();
        return;
      }
      this.latestAvailableVersion = updateInfo.version;
      this.onUpdateListeners.forEach((listener) => {
        listener(updateInfo.version);
      });
    });
  }
  cancelCurrentDownload(newVersion) {
    this.logger.info(
      "Cancelling current download",
      this.downloadingVersion || this.downloadedVersion || "unknown",
      "->",
      newVersion
    );
    if (this.cancellationToken) {
      this.cancellationToken.cancel();
      this.cancellationToken = null;
    }
    this.latestAvailableVersion = null;
    this.downloadedVersion = null;
    this.downloadingVersion = null;
    this.updateStatus = UpdateStatus.IDLE;
    disableSuspensionBlocker();
  }
  updateApplier(updateResult) {
    const { downloadPromise, updateInfo, cancellationToken } = updateResult;
    if ("commonConfig" in updateInfo) {
      this.logger.info("Common config", updateInfo.commonConfig);
      applyCommonConfig(updateInfo.commonConfig);
    }
    if (downloadPromise !== null) {
      return;
    }
    const newVersion = updateInfo.version;
    const shouldCancelCurrent = this.shouldCancelCurrentUpdate(newVersion);
    if (shouldCancelCurrent) {
      this.cancelCurrentDownload(newVersion);
    }
    logSystemMetrics(true);
    if (isVersionDeprecated()) {
      this.isDownloadingDeprecatedVersion = true;
      this.downloadUpdate(updateInfo.version, cancellationToken);
      return;
    }
    if ("updateProbability" in updateInfo) {
      this.logger.info(
        `Update probability: ${updateInfo.updateProbability}; checking with client value ${this.clientUpdateProbability}`
      );
      const updateProbability = Number(updateInfo.updateProbability);
      if (this.clientUpdateProbability <= updateProbability && updateProbability > 0) {
        this.downloadUpdate(updateInfo.version, cancellationToken);
      }
    }
  }
  shouldCancelCurrentUpdate(newVersion) {
    if (this.isDownloadingDeprecatedVersion) {
      this.logger.info("Not cancelling deprecated version download");
      return false;
    }
    if (this.updateStatus === UpdateStatus.IDLE) {
      if (!this.downloadingVersion && !this.downloadedVersion) {
        return false;
      }
    }
    const currentVersion = this.downloadingVersion || this.downloadedVersion || this.latestAvailableVersion;
    if (currentVersion && semver$1.gt(newVersion, currentVersion)) {
      this.logger.info("New version is higher", currentVersion, "<", newVersion);
      return true;
    }
    return false;
  }
  async downloadUpdate(version, cancellationToken) {
    this.logger.info("New version available", electron.app.getVersion(), "->", version);
    this.updateStatus = UpdateStatus.DOWNLOADING;
    this.downloadingVersion = version;
    this.cancellationToken = cancellationToken;
    enableSuspensionBlocker();
    electronUpdater.autoUpdater.downloadUpdate(cancellationToken).then((downloadResult) => {
      if (downloadResult) {
        this.updateStatus = UpdateStatus.DOWNLOADED;
        this.logger.info(`Download result: ${downloadResult}`);
      }
    }).catch((error) => {
      this.updateStatus = UpdateStatus.IDLE;
      this.downloadingVersion = null;
      this.isDownloadingDeprecatedVersion = false;
      disableSuspensionBlocker();
      this.logger.error("Downloader error", error);
    });
  }
  async check() {
    if (this.updateStatus === UpdateStatus.INSTALLING) {
      this.logger.log("Update is installing", this.updateStatus);
      return;
    }
    try {
      const updateResult = await electronUpdater.autoUpdater.checkForUpdates();
      if (!updateResult) {
        this.logger.log("Updater is inactive");
        return;
      }
      this.updateApplier(updateResult);
    } catch (error) {
      this.logger.error("Update check error", error);
    }
  }
  start() {
    this.check();
    this.updaterId = setInterval(() => {
      this.check();
    }, config.common.UPDATE_POLL_INTERVAL_MS);
  }
  stop() {
    if (this.updaterId) {
      clearInterval(this.updaterId);
    }
  }
  onUpdate(listener) {
    this.onUpdateListeners.push(listener);
  }
  install() {
    this.logger.info("Installing a new version", this.latestAvailableVersion);
    this.updateStatus = UpdateStatus.INSTALLING;
    state.willQuit = true;
    electronUpdater.autoUpdater.quitAndInstall();
  }
  get clientUpdateProbability() {
    const deviceId = getDeviceId();
    const num = Number.parseInt(deviceId, 16);
    if (Number.isNaN(num)) {
      return 0;
    }
    return num % 101;
  }
  get netSession() {
    return electronUpdater.autoUpdater.netSession;
  }
  getProbabilityBucket() {
    for (const bucket of Object.keys(probabilityBuckets)) {
      if (this.clientUpdateProbability < Number(bucket)) {
        return probabilityBuckets[Number(bucket)];
      }
    }
    return;
  }
}
const getUpdater = /* @__PURE__ */ (() => {
  let updater;
  return () => {
    if (!updater) {
      updater = new Updater();
    }
    return updater;
  };
})();const translationsRU = {"a11y-regions.player":[{type:0,value:"Плеер"}],"a11y-regions.wheel":[{type:0,value:"Рекомендации моей волны"}],"about-app.app-name":[{type:0,value:"Яндекс Mузыка"}],"about-app.explicit-content":[{type:0,value:"Сервис Яндекс Музыка может содержать информацию, не&nbsp;предназначенную для&nbsp;несовершеннолетних. Яндекс Музыка – самая точная система музыкальных рекомендаций. По степени точности подбора персональных рекомендаций для пользователей в РФ среди музыкальных стриминговых сервисов в апреле 2025 года. Основано на данных ООО «Майл дата» по результатам опроса на базе Единой панели данных Ромир среди респондентов в возрасте 18-59 лет."}],"ads.about-advertiser":[{type:0,value:"О рекламодателе"}],"ads.ad":[{type:0,value:"Реклама"}],"ads.continue-ad":[{type:0,value:"Воспроизведение начнется сразу после рекламы"}],"ads.disable-ads":[{type:0,value:"Отключить рекламу"}],"ads.learn-more":[{type:0,value:"Узнать подробнее"}],"ads.notification":[{type:0,value:"Слушайте без рекламы с мультиподпиской Плюс"}],"advert.banner":[{type:0,value:"Реклама"}],"album-errors.error-during-loading-album":[{type:0,value:"При загрузке альбома произошла ошибка"}],"album-errors.error-during-loading-similar-albums":[{type:0,value:"При загрузке похожих альбомов произошла ошибка"}],"album.external-streamings-title":[{type:0,value:"Послушать на других площадках"}],"artist-errors.error-during-loading-artist":[{type:0,value:"При загрузке артиста произошла ошибка"}],"artist-errors.error-during-loading-artist-info":[{type:0,value:"При загрузке информации об исполнителе произошла ошибка"}],"artist.about-artist":[{type:0,value:"Об исполнителе"}],"artist.about-composer":[{type:0,value:"О композиторе"}],"artist.artist-in-playlists":[{type:0,value:"Плейлисты, где встречается"}],"artist.artist-links-label":[{type:0,value:"Исполнитель "},{type:1,value:"artistName"},{type:0,value:": $"},{type:1,value:"linkName"}],"artist.official-pages":[{type:0,value:"Официальные страницы"}],"artist.stats-less-listeners-per-month":[{type:0,value:"На"},{type:1,value:"nbsp"},{type:1,value:"number"},{type:1,value:"nbsp"},{type:0,value:"меньше, "},{type:1,value:"br"},{type:0,value:"чем за предыдущие 30 дней"}],"artist.stats-listeners-per-month":[{type:0,value:"Слушателей за месяц"}],"artist.stats-more-listeners-per-month":[{type:0,value:"На"},{type:1,value:"nbsp"},{type:1,value:"number"},{type:1,value:"nbsp"},{type:0,value:"больше, "},{type:1,value:"br"},{type:0,value:"чем за предыдущие 30 дней"}],"artist.stats-same-listeners-per-month":[{type:0,value:"Столько же,"},{type:1,value:"br"},{type:0,value:"как и за предыдущие 30 дней"}],"authorization-messages.need-to-authorizate":[{type:0,value:"Сначала необходимо авторизоваться"}],"authorization.enter-and-listen-button":[{type:0,value:"Войти и слушать без ограничений"}],"authorization.enter-button":[{type:0,value:"Войти"}],"authorization.enter-subtitle":[{type:0,value:"Чтобы слушать музыку и подкасты без ограничений"}],"authorization.enter-text":[{type:0,value:"Войдите и получите доступ к единой коллекции музыки на всех устройствах."}],"authorization.enter-title":[{type:0,value:"Войдите в аккаунт"}],"authorization.enter-tooltip":[{type:0,value:"Войти в аккаунт"}],"authorization.start-button":[{type:0,value:"Начать"}],"bar-below.section-name":[{type:0,value:"Баннер"}],"branded-player.branding-integration":[{type:0,value:"Рекламная интеграция"}],"branded-player.car":[{type:0,value:"Машинка"}],"branded-player.default":[{type:0,value:"Стандартный"}],"branded-player.duck":[{type:0,value:"Уточка"}],"branded-player.hide":[{type:0,value:"Скрыть"}],"branded-player.player-type":[{type:0,value:"Вид плеера"}],"branded-player.to-website":[{type:0,value:"На сайт"}],"buy-subscription.activate":[{type:0,value:"Подключить"}],"buy-subscription.already-in-plus":[{type:0,value:"Я уже в"},{type:1,value:"nbsp"},{type:0,value:"Плюсе"}],"buy-subscription.get-more-discoveries":[{type:0,value:"Больше открытий в"},{type:1,value:"nbsp"},{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Музыке с"},{type:1,value:"nbsp"},{type:0,value:"мультиподпиской"},{type:1,value:"nbsp"},{type:0,value:"Плюс!"}],"buy-subscription.listen-without-restrictions":[{type:0,value:"Слушайте Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Музыку без ограничений"}],"buy-subscription.music-and-films-and-other":[{type:0,value:"Музыка, кино и многое другое"}],"buy-subscription.new-vibe-description":[{type:0,value:"Слушайте музыку без"},{type:1,value:"nbsp"},{type:0,value:"рекламы с"},{type:1,value:"nbsp"},{type:0,value:"Мультиподпиской"},{type:1,value:"nbsp"},{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Плюс. А так же получите доступ к"},{type:1,value:"nbsp"},{type:0,value:"Кинопоиску, Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Книгам и"},{type:1,value:"nbsp"},{type:0,value:"кешбеку баллами"}],"buy-subscription.offer-for-you":[{type:0,value:"Для вас "},{type:1,value:"offerText"}],"buy-subscription.plus-benefit-non-music":[{type:0,value:"Музыка, подкасты и"},{type:1,value:"nbsp"},{type:0,value:"аудиокниги"}],"buy-subscription.plus-benefit-offline":[{type:0,value:"Слушайте даже без"},{type:1,value:"nbsp"},{type:0,value:"интернета"}],"buy-subscription.plus-benefit-other-services":[{type:0,value:"А еще Кинопоиск и"},{type:1,value:"nbsp"},{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Книги"}],"buy-subscription.plus-benefit-recommendations":[{type:0,value:"Самые точные рекомендации"}],"calendar.april-short":[{type:0,value:"апр"}],"calendar.august-short":[{type:0,value:"авг"}],"calendar.december-short":[{type:0,value:"дек"}],"calendar.february-short":[{type:0,value:"фев"}],"calendar.january-short":[{type:0,value:"янв"}],"calendar.july-short":[{type:0,value:"июл"}],"calendar.june-short":[{type:0,value:"июн"}],"calendar.march-short":[{type:0,value:"мар"}],"calendar.may-short":[{type:0,value:"май"}],"calendar.november-short":[{type:0,value:"ноя"}],"calendar.october-short":[{type:0,value:"окт"}],"calendar.september-short":[{type:0,value:"сен"}],"collection.collection-color":[{type:0,value:"У вашей музыки есть "},{children:[{type:0,value:"цвет"}],type:8,value:"color"}],"collection.collection-color-description":[{type:0,value:"Добавили в Мою волну и Коллекцию цвет музыки, которая вас вдохновляет"}],"collection.collection-color-title":[{type:0,value:"Меняется вместе с вами"}],"collection.created-playlists-list":[{type:0,value:"Список моих плейлистов"}],"collection.empty-liked-tracks-text":[{type:0,value:"Ставьте лайки трекам, чтобы добавить их в этот плейлист. А найти любимое поможет Моя волна"}],"collection.empty-liked-tracks-title":[{type:0,value:"Тут появятся ваши любимые треки"}],"collection.liked-albums-list":[{type:0,value:"Список любимых альбомов"}],"collection.liked-artists-list":[{type:0,value:"Список любимых исполнителей"}],"collection.liked-non-music-list":[{type:0,value:"Список любимых подкастов и книг"}],"collection.liked-playlists-list":[{type:0,value:"Список любимых плейлистов"}],"collection.my-dislikes":[{type:0,value:"Мои дизлайки"}],"collection.new-playlist":[{type:0,value:"Новый плейлист"}],"collection.your-created-playlists":[{type:0,value:"Вы собрали"}],"collection.your-liked-playlists":[{type:0,value:"Вам понравилось"}],"concerts.about-event-kind":[{options:{concert:{value:[{type:0,value:"О концерте"}]},festival:{value:[{type:0,value:"О фестивале"}]},musical:{value:[{type:0,value:"О мюзикле"}]},other:{value:[{type:0,value:"О "},{type:1,value:"kind"}]},tribute:{value:[{type:0,value:"О трибьюте"}]},unspecified:{value:[{type:0,value:"О концерте"}]}},type:5,value:"kind"}],"concerts.all-concerts":[{type:0,value:"Концерты для вас"}],"concerts.cities-list":[{type:0,value:"Список городов"}],"concerts.concerts-nearby":[{type:0,value:"Концерты рядом"}],"concerts.details-title":[{type:0,value:"Концерты"}],"concerts.event-kind":[{options:{concert:{value:[{type:0,value:"Концерт"}]},festival:{value:[{type:0,value:"Фестиваль"}]},musical:{value:[{type:0,value:"Мюзикл"}]},other:{value:[{type:1,value:"kind"}]},tribute:{value:[{type:0,value:"Трибьют"}]},unspecified:{value:[{type:0,value:"Концерт"}]}},type:5,value:"kind"}],"concerts.feed-error":[{type:0,value:"При загрузке концертов произошла ошибка"}],"concerts.find-city":[{type:0,value:"Найти город"}],"concerts.nearby":[{type:0,value:"Рядом"}],"concerts.nothing-found":[{type:0,value:"Ничего не нашли"}],"concerts.onboarding":[{type:0,value:"Новый раздел с"},{type:1,value:"nbsp"},{type:0,value:"концертами ваших любимых артистов"},{type:1,value:"nbsp"},{type:0,value:"— кричим «браво»!"}],"concerts.top-for-you":[{type:0,value:"Топ для вас"}],"concerts.try-different-query":[{type:0,value:"Попробуйте написать по-другому"}],"crackdown.description":[{type:0,value:"Подключите мультиподписку Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Плюс,"},{type:1,value:"br"},{type:0,value:"чтобы слушать любимые треки без рекламы"}],"crackdown.title":[{type:0,value:"Музыка без"},{type:1,value:"br"},{type:0,value:"ограничений"}],"deeplinks.download-from-app-gallery":[{type:0,value:"Скачать в AppGallery"}],"deeplinks.download-from-app-store":[{type:0,value:"Скачать в AppStore"}],"deeplinks.download-from-google-play":[{type:0,value:"Скачать в Google Play"}],"deeplinks.listen-in-app":[{type:0,value:"Слушать в приложении"}],"desktop.about":[{type:0,value:"О приложении"}],"desktop.app-revision":[{type:0,value:"Код "},{type:1,value:"revision"}],"desktop.app-version":[{type:0,value:"Версия приложения: "},{type:1,value:"version"}],"desktop.app-version-short":[{type:0,value:"Версия "},{type:1,value:"version"}],"desktop.check-for-updates":[{type:0,value:"Проверить обновления"}],"desktop.close-yandex-music":[{type:0,value:"Закрыть Яндекс Музыку"}],"desktop.copy":[{type:0,value:"Скопировать"}],"desktop.cut":[{type:0,value:"Вырезать"}],"desktop.default-release-note":[{children:[{type:0,value:"Заходите в приложение — а там только любимые жанры и ни одного бага. Это не совпадение. Это обновление"}],type:8,value:"p"},{type:0,value:"\n"},{children:[{type:0,value:"И самые точные рекомендации\nот команды Яндекс Музыки"}],type:8,value:"p"}],"desktop.edit":[{type:0,value:"Правка"}],"desktop.hide-yandex-music":[{type:0,value:"Скрыть Яндекс Музыку"}],"desktop.minimize":[{type:0,value:"Свернуть"}],"desktop.on-update-available":[{type:0,value:"Доступна версия "},{type:1,value:"version"}],"desktop.paste":[{type:0,value:"Вставить"}],"desktop.quit":[{type:0,value:"Закрыть приложение"}],"desktop.quit-yandex-music":[{type:0,value:"Завершить Яндекс Музыку"}],"desktop.recommendations":[{type:0,value:"Правила рекомендаций"}],"desktop.redo":[{type:0,value:"Повторить"}],"desktop.release-notes-modal-title":[{type:0,value:"Что нового?"}],"desktop.select-all":[{type:0,value:"Выбрать все"}],"desktop.support":[{type:0,value:"Чат с поддержкой"}],"desktop.terms":[{type:0,value:"Пользовательское соглашение"}],"desktop.undo":[{type:0,value:"Отменить"}],"desktop.update":[{type:0,value:"Обновить"}],"desktop.window":[{type:0,value:"Окно"}],"donation.button-text":[{type:0,value:"Поддержать донатом"}],"donation.support-artist":[{offset:0,options:{one:{value:[{type:0,value:"Поддержать артиста"}]},other:{value:[{type:0,value:"Поддержать артистов"}]}},pluralType:"cardinal",type:6,value:"count"}],"donation.support-button":[{type:0,value:"Поддержать"}],"donation.support-text":[{type:0,value:"Поддержите донатом"}],"donation.transfer-any-amount":[{type:0,value:"Можете перевести любую сумму"}],"download-mobile-app.listen-in-app":[{type:0,value:"Слушать в приложении"}],"download-mobile-app.listen-in-app-without-restrictions":[{type:0,value:"Слушать без ограничений в приложении"}],"download-mobile-app.stay":[{type:0,value:"Остаться на сайте"}],"download-mobile-app.subtitle":[{type:0,value:"В"},{type:1,value:"nbsp"},{type:0,value:"мобильном"},{type:1,value:"nbsp"},{type:0,value:"приложении Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Музыки"}],"download-mobile-app.title":[{type:0,value:"Музыка"},{type:1,value:"nbsp"},{type:0,value:"даже без"},{type:1,value:"nbsp"},{type:0,value:"сети"}],"download-mobile-app.use-service-in-app-without-restrictions":[{type:0,value:"Слушайте Яндекс Музыку без ограничений в приложении"}],"drag-and-drop.failed-to-move":[{type:0,value:"Не удалось переместить трек"}],"drag-and-drop.playlist-move-instructions":[{type:0,value:"Чтобы переместить трек в плейлисте, нажмите клавишу Enter."}],"drag-and-drop.playlist-on-move":[{type:0,value:"Трек "},{type:1,value:"trackName"},{type:0,value:" перемещен на позицию "},{type:1,value:"index"},{type:0,value:". Для завершения перемещения нажмите клавишу Enter. Для отмены перемещения нажмите клавишу Esc."}],"drag-and-drop.playlist-on-move-cancel":[{type:0,value:"Перемещение трека отменено."}],"drag-and-drop.playlist-on-move-end":[{type:0,value:"Трек "},{type:1,value:"trackName"},{type:0,value:" окончательно перемещен."}],"drag-and-drop.playlist-on-move-end-with-index":[{type:0,value:"Трек "},{type:1,value:"trackName"},{type:0,value:" окончательно перемещен на позицию "},{type:1,value:"index"},{type:0,value:"."}],"drag-and-drop.playlist-on-move-fail":[{type:0,value:"Трек "},{type:1,value:"trackName"},{type:0,value:" вышел за пределы зоны перемещения."}],"drag-and-drop.playlist-on-move-start":[{type:0,value:"Для перемещения выбран трек "},{type:1,value:"trackName"},{type:0,value:" на позиции "},{type:1,value:"index"},{type:0,value:"."}],"entity-names.album":[{type:0,value:"Альбом"}],"entity-names.album-available-with-plus":[{type:0,value:"Этот альбом доступен с опцией Плюса"}],"entity-names.album-name":[{type:0,value:"Альбом "},{type:1,value:"albumName"}],"entity-names.albums":[{type:0,value:"Альбомы"}],"entity-names.albums-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"альбома"}]},many:{value:[{type:0,value:"альбомов"}]},one:{value:[{type:0,value:"альбом"}]},other:{value:[{type:0,value:"альбомов"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.albums-tracks-list":[{type:0,value:"Список треков альбома «"},{type:1,value:"albumName"},{type:0,value:"»"}],"entity-names.and-more-artists":[{type:1,value:"artists"},{type:0,value:" и другие"}],"entity-names.artist":[{type:0,value:"Артист"}],"entity-names.artist-albums-list":[{type:0,value:"Список альбомов артиста"}],"entity-names.artist-clips-list":[{type:0,value:"Список клипов артиста"}],"entity-names.artist-compilations-list":[{type:0,value:"Список сборников артиста"}],"entity-names.artist-name":[{type:0,value:"Артист "},{type:1,value:"artistName"}],"entity-names.artist-playlist":[{type:0,value:"Плейлисты"}],"entity-names.artist-popular-tracks":[{type:0,value:"Популярные треки артиста"}],"entity-names.artist-studio-albums-list":[{type:0,value:"Список студийных альбомов артиста"}],"entity-names.artist-tracks-list":[{type:0,value:"Список треков артиста"}],"entity-names.artists":[{type:0,value:"Исполнители"}],"entity-names.artists-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"исполнителя"}]},many:{value:[{type:0,value:"исполнителей"}]},one:{value:[{type:0,value:"исполнитель"}]},other:{value:[{type:0,value:"исполнителей"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.audio":[{type:0,value:"Аудио"}],"entity-names.audiobook":[{type:0,value:"Аудиокнига"}],"entity-names.audiobook-name":[{type:0,value:"Аудиокнига "},{type:1,value:"bookName"}],"entity-names.authors":[{type:0,value:"Авторы: "},{type:1,value:"authors"}],"entity-names.book":[{type:0,value:"Книга"}],"entity-names.cashback-percent":[{type:0,value:"Кешбэк "},{type:1,value:"value"},{type:0,value:"%"}],"entity-names.chart-down":[{type:0,value:"Позиция в чарте опустилась"}],"entity-names.chart-new":[{type:0,value:"Новый в чарте"}],"entity-names.chart-podcasts-list":[{type:0,value:"Список подкастов чарта"}],"entity-names.chart-same":[{type:0,value:"Позиция в чарте не изменилась"}],"entity-names.chart-tracks-list":[{type:0,value:"Список треков чарта"}],"entity-names.chart-up":[{type:0,value:"Позиция в чарте поднялась"}],"entity-names.clip":[{type:0,value:"Клип"}],"entity-names.clip-name":[{type:0,value:"Клип "},{type:1,value:"clipName"}],"entity-names.clips":[{type:0,value:"Клипы"}],"entity-names.clips-will-like":[{type:0,value:"Вам понравится"}],"entity-names.collection":[{type:0,value:"Коллекция"}],"entity-names.composer":[{type:0,value:"Композитор"}],"entity-names.concert":[{type:0,value:"Концерт"}],"entity-names.concerts":[{type:0,value:"Концерты"}],"entity-names.created-playlists-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"собранных плейлиста"}]},many:{value:[{type:0,value:"собранных плейлистов"}]},one:{value:[{type:0,value:"собранный плейлист"}]},other:{value:[{type:0,value:"собранных плейлистов"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.disk-number":[{type:0,value:"Диск "},{type:1,value:"number"}],"entity-names.editor-feature-is-show":[{type:0,value:"Уже показывается"}],"entity-names.fairy-tale":[{type:0,value:"Аудиосказка"}],"entity-names.fairytale":[{type:0,value:"Сказка"}],"entity-names.favourite-albums":[{type:0,value:"Любимые альбомы"}],"entity-names.favourite-playlists":[{type:0,value:"Любимые плейлисты"}],"entity-names.generative":[{type:0,value:"Нейромузыка"}],"entity-names.has-your-like":[{type:0,value:"Есть ваш лайк"}],"entity-names.label":[{type:0,value:"Лейбл"}],"entity-names.label-albums-list":[{type:0,value:"Релизы лейбла"}],"entity-names.label-artists-list":[{type:0,value:"Исполнители лейбла"}],"entity-names.liked-artist":[{type:0,value:"Вам понравились"}],"entity-names.liked-playlist":[{type:0,value:"Мне нравится"}],"entity-names.liked-playlists-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"понравившихся плейлиста"}]},many:{value:[{type:0,value:"понравившихся плейлистов"}]},one:{value:[{type:0,value:"понравившийся плейлист"}]},other:{value:[{type:0,value:"понравившихся плейлистов"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.likes-count-description":[{type:0,value:"Нравится, количество отметок - "},{type:1,value:"count"}],"entity-names.likes-counter":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"лайка"}]},many:{value:[{type:0,value:"лайков"}]},one:{value:[{type:0,value:"лайк"}]},other:{value:[{type:0,value:"лайков"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.likes-counter-empty":[{type:0,value:"Еще нет лайков"}],"entity-names.list-is-empty":[{type:0,value:"Список пуст"}],"entity-names.listeners-per-month":[{style:null,type:2,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"слушателя"}]},many:{value:[{type:0,value:"слушателей"}]},one:{value:[{type:0,value:"слушатель"}]},other:{value:[{type:0,value:"слушателей"}]}},pluralType:"cardinal",type:6,value:"counter"},{type:0,value:" в месяц"}],"entity-names.map-url":[{type:0,value:"Ссылка на Яндекс Карты"}],"entity-names.metro-stations":[{type:0,value:"Станции метро"}],"entity-names.mixes":[{type:0,value:"Подборки"}],"entity-names.music-history":[{type:0,value:"История прослушивания"}],"entity-names.my-playlists":[{type:0,value:"Мои плейлисты"}],"entity-names.my-vibe":[{type:0,value:"Моя волна"}],"entity-names.new-albums":[{type:0,value:"Новые альбомы"}],"entity-names.new-albums-in-genre":[{type:0,value:"Новые альбомы в этом жанре"}],"entity-names.new-playlist":[{type:0,value:"Новый плейлист"}],"entity-names.non-music-releases":[{type:0,value:"Выпуски"}],"entity-names.number-of-books":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"книги"}]},many:{value:[{type:0,value:"книг"}]},one:{value:[{type:0,value:"книга"}]},other:{value:[{type:0,value:"книг"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-chapters":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"главы"}]},many:{value:[{type:0,value:"глав"}]},one:{value:[{type:0,value:"глава"}]},other:{value:[{type:0,value:"глав"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-episodes":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"выпуска"}]},many:{value:[{type:0,value:"выпусков"}]},one:{value:[{type:0,value:"выпуск"}]},other:{value:[{type:0,value:"выпусков"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-more-artists":[{type:0,value:"и ещё "},{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"исполнителя"}]},many:{value:[{type:0,value:"исполнителей"}]},one:{value:[{type:0,value:"исполнитель"}]},other:{value:[{type:0,value:"исполнителей"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-podcasts":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"подкаста"}]},many:{value:[{type:0,value:"подкастов"}]},one:{value:[{type:0,value:"подкаст"}]},other:{value:[{type:0,value:"подкастов"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-tracks":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"трека"}]},many:{value:[{type:0,value:"треков"}]},one:{value:[{type:0,value:"трек"}]},other:{value:[{type:0,value:"треков"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.other-album-versions":[{type:0,value:"Другие версии альбома"}],"entity-names.other-albums-of-artist":[{type:0,value:"Другие альбомы исполнителя"}],"entity-names.percent":[{type:1,value:"value"},{type:0,value:"%"}],"entity-names.playlist":[{type:0,value:"Плейлист"}],"entity-names.playlist-name":[{type:0,value:"Плейлист "},{type:1,value:"playlistName"}],"entity-names.playlist-tracks-list":[{type:0,value:"Список треков плейлиста «"},{type:1,value:"playlistName"},{type:0,value:"»"}],"entity-names.podcast":[{type:0,value:"Подкаст"}],"entity-names.podcast-last-episodes":[{type:0,value:"Последние выпуски"}],"entity-names.podcast-name":[{type:0,value:"Подкаст "},{type:1,value:"podcastName"}],"entity-names.podcasts-and-books":[{type:0,value:"Книги и подкасты"}],"entity-names.popular-among-users":[{type:0,value:"Популярно у слушателей"}],"entity-names.popular-artists":[{type:0,value:"Популярные исполнители"}],"entity-names.popular-playlists":[{type:0,value:"Популярные плейлисты"}],"entity-names.publisher":[{type:0,value:"Издатель"}],"entity-names.query-to-vibe-loading-description":[{type:0,value:"Люмен ловит ваш настрой"}],"entity-names.query-to-vibe-loading-title":[{type:0,value:"Я так чувствую..."}],"entity-names.recently-release":[{type:0,value:"Недавний релиз"}],"entity-names.releases":[{type:0,value:"Релизы"}],"entity-names.search":[{type:0,value:"Поиск"}],"entity-names.season-number":[{type:0,value:"Сезон "},{type:1,value:"number"}],"entity-names.similar-artists":[{type:0,value:"Похожие исполнители"}],"entity-names.similar-playlists":[{type:0,value:"Похожие плейлисты"}],"entity-names.singer":[{type:0,value:"Исполнитель"}],"entity-names.single":[{type:0,value:"Сингл"}],"entity-names.single-available-with-plus":[{type:0,value:"Этот сингл доступен с опцией Плюса"}],"entity-names.source":[{type:0,value:"Источник: "},{type:1,value:"source"}],"entity-names.tags":[{type:0,value:"Теги: "},{type:1,value:"tags"}],"entity-names.text":[{type:0,value:"Текст"}],"entity-names.top-artists":[{type:0,value:"Ваш топ месяца"}],"entity-names.track":[{type:0,value:"Трек"}],"entity-names.track-in-playlist":[{type:0,value:"Уже есть в этом плейлисте"}],"entity-names.track-name":[{type:0,value:"Трек "},{type:1,value:"trackName"}],"entity-names.track-name-by-type":[{options:{audiobook:{value:[{type:0,value:"Глава "},{type:1,value:"name"}]},comment:{value:[{type:0,value:"Выпуск "},{type:1,value:"name"}]},fairy_tale:{value:[{type:0,value:"Глава "},{type:1,value:"name"}]},music:{value:[{type:0,value:"Трек "},{type:1,value:"name"}]},other:{value:[{type:0,value:"Трек "},{type:1,value:"name"}]},podcast_episode:{value:[{type:0,value:"Выпуск "},{type:1,value:"name"}]}},type:5,value:"type"}],"entity-names.track-type":[{options:{audiobook:{value:[{type:0,value:"Глава"}]},comment:{value:[{type:0,value:"Выпуск"}]},fairy_tale:{value:[{type:0,value:"Глава"}]},music:{value:[{type:0,value:"Трек"}]},other:{value:[{type:0,value:"Трек"}]},podcast_episode:{value:[{type:0,value:"Выпуск"}]}},type:5,value:"type"}],"entity-names.tracks":[{type:0,value:"Треки"}],"entity-names.tracks-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"трека"}]},many:{value:[{type:0,value:"треков"}]},one:{value:[{type:0,value:"трек"}]},other:{value:[{type:0,value:"треков"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.trailer":[{type:0,value:"Трейлер"}],"entity-names.upcoming-album-date":[{type:0,value:"Выйдет "},{type:1,value:"releaseDate"}],"entity-names.upcoming-album-name":[{type:0,value:"Предстоящий релиз "},{type:1,value:"upcomingAlbumName"}],"entity-names.upcoming-album-play-disabled":[{type:0,value:"Для воспроизведения нужно дождаться предстоящего релиза"}],"entity-names.upcoming-albums":[{type:0,value:"Будущие релизы"}],"entity-names.upcoming-albums-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"будущих релиза"}]},many:{value:[{type:0,value:"будущих релизов"}]},one:{value:[{type:0,value:"будущий релиз"}]},other:{value:[{type:0,value:"будущих релизов"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.vibe-name":[{type:0,value:"Моя волна "},{type:1,value:"vibeName"}],"entity-names.vibe-room-name":[{type:0,value:"Моя волна "},{type:1,value:"name"},{type:0,value:". Статус "},{type:1,value:"status"}],"equalizer.amp-label":[{type:1,value:"value"},{type:0,value:"dB"}],"equalizer.bass-and-treble-boost-preset":[{type:0,value:"Усиление НЧ и ВЧ"}],"equalizer.bass-boost-preset":[{type:0,value:"Усиление НЧ"}],"equalizer.classical-preset":[{type:0,value:"Классическая музыка"}],"equalizer.club-preset":[{type:0,value:"Клубная музыка"}],"equalizer.concert-preset":[{type:0,value:"Концерт"}],"equalizer.custom-preset":[{type:0,value:"Своя настройка"}],"equalizer.dance-preset":[{type:0,value:"Танцевальная музыка"}],"equalizer.default-preset":[{type:0,value:"По умолчанию"}],"equalizer.disable-equalizer":[{type:0,value:"Выключить эквалайзер"}],"equalizer.disabled":[{type:0,value:"Выключен"}],"equalizer.enable":[{type:0,value:"Включить"}],"equalizer.enable-equalizer":[{type:0,value:"Включить эквалайзер"}],"equalizer.enabled":[{type:0,value:"Включен"}],"equalizer.frequency-label":[{type:1,value:"value"},{type:0,value:"k"}],"equalizer.large-hall-preset":[{type:0,value:"Большой зал"}],"equalizer.party-preset":[{type:0,value:"Вечеринка"}],"equalizer.pop-preset":[{type:0,value:"Поп"}],"equalizer.preamp-level":[{type:0,value:"уровень"}],"equalizer.reggae-preset":[{type:0,value:"Регги"}],"equalizer.rock-preset":[{type:0,value:"Рок"}],"equalizer.ska-preset":[{type:0,value:"Ска"}],"equalizer.slider-frequency-label":[{type:0,value:"Изменить децибелы на частоте "},{type:1,value:"label"},{type:0,value:" "},{type:1,value:"value"},{type:0,value:" децибел"}],"equalizer.slider-preamp-label":[{type:0,value:"Коэффициент предусиления"}],"equalizer.soft-preset":[{type:0,value:"Мягкое звучание"}],"equalizer.soft-rock-preset":[{type:0,value:"Софт-рок"}],"equalizer.speakers-preset":[{type:0,value:"Колонки ноутбука"}],"equalizer.techno-preset":[{type:0,value:"Техно"}],"equalizer.title":[{type:0,value:"Эквалайзер"}],"equalizer.treble-boost-preset":[{type:0,value:"Усиление ВЧ"}],"error-messages.empty-artist-familiar-collection-title":[{type:0,value:"У вас пока нет треков исполнителя в Коллекции"}],"error-messages.empty-artist-familiar-vibe-title":[{type:0,value:"Вы пока не слушали в Моей волне треки исполнителя"}],"error-messages.empty-collection-albums":[{type:0,value:"Ставьте лайки альбомам, и они появятся тут"}],"error-messages.empty-collection-albums-description":[{type:0,value:"Ставьте лайки синглам и альбомам, чтобы увидеть их здесь"}],"error-messages.empty-collection-albums-title":[{type:0,value:"У вас нет альбомов в Коллекции"}],"error-messages.empty-collection-artists-title":[{type:0,value:"Ставьте лайки исполнителям, и они появятся тут"}],"error-messages.empty-collection-clips-text":[{type:0,value:"А пока — посмотрите наши рекомендации"}],"error-messages.empty-collection-clips-title":[{type:0,value:"Ставьте лайки клипам, и они появятся тут"}],"error-messages.empty-collection-kids-sub-page-link":[{type:0,value:"Перейти в детское"}],"error-messages.empty-collection-kids-sub-page-title":[{type:0,value:"Начните лайкать песенки и выпуски, и они появятся тут"}],"error-messages.empty-collection-liked-playlists":[{type:0,value:"Ставьте лайки плейлистам, и они появятся тут"}],"error-messages.empty-collection-playlist-description":[{type:0,value:"Треки можно найти через поиск"}],"error-messages.empty-collection-playlist-title":[{type:0,value:"Добавьте треки в плейлист"}],"error-messages.empty-collection-podcasts":[{type:0,value:"Ставьте лайки подкастам, и они появятся тут"}],"error-messages.empty-collection-podcasts-and-books":[{type:0,value:"У вас нет подкастов и книг в Коллекции"}],"error-messages.empty-collection-upcoming-albums-title":[{type:0,value:"Ставьте лайки будущим релизам на страницах артистов, и они появятся тут"}],"error-messages.empty-collection-vibe-rooms-title":[{type:0,value:"Поделитесь ссылкой и слушайте Мою волну для двоих, которая совместит ваши вкусы. Персональные рекомендации не изменятся"}],"error-messages.empty-shelf-liked-page-link":[{type:0,value:"Перейти к подкастам"}],"error-messages.empty-shelf-liked-page-title":[{type:0,value:"Начните слушать и лайкать подкасты, и они появятся тут"}],"error-messages.empty-shelf-new-episodes-text":[{type:0,value:"А пока мы добавили вам новый выпуск подкаста, который вы слушали"}],"error-messages.empty-shelf-new-episodes-title":[{type:0,value:"Начните лайкать подкасты, и новые выпуски появятся тут"}],"error-messages.empty-shelf-new-episodes-title-no-tracks":[{type:0,value:"Начните слушать и лайкать подкасты, и они появятся тут"}],"error-messages.empty-shelf-page-title":[{type:0,value:"Начните слушать подкасты, и они появятся тут"}],"error-messages.error-during-action":[{type:0,value:"При выполнении действия произошла ошибка"}],"error-messages.error-during-initial-loading":[{type:0,value:"Не удалось получить часть данных при старте"}],"error-messages.error-load-part-page":[{type:0,value:"Не удалось загрузить часть страницы"}],"error-messages.error-load-wizard":[{type:0,value:"Произошла ошибка. Возвращайтесь к выбору исполнителей позже."}],"error-messages.multivibe-create-link":[{type:0,value:"Не удалось создать ссылку. Попробуйте снова"}],"error-messages.something-went-wrong":[{type:0,value:"Что-то пошло не так"}],"extra-explicit.confirm-unsafe-album":[{type:0,value:"К альбому"}],"extra-explicit.confirm-unsafe-artist":[{type:0,value:"К артисту"}],"extra-explicit.confirm-unsafe-audiobook":[{type:0,value:"К аудиокниге"}],"extra-explicit.confirm-unsafe-clip":[{type:0,value:"К клипу"}],"extra-explicit.confirm-unsafe-podcast":[{type:0,value:"К подкасту"}],"extra-explicit.confirm-unsafe-track":[{type:0,value:"К треку"}],"extra-explicit.explicit-mark":[{type:0,value:"Контент не подходит для детей"}],"extra-explicit.play-unavailable":[{type:0,value:"Воспроизведение недоступно"}],"extra-explicit.reject-unsafe-entity":[{type:0,value:"Не буду слушать"}],"family.about":[{type:0,value:"Подробнее о мультиподписке"}],"family.about1":[{type:0,value:"Больше о мультиподписке"}],"family.accept":[{type:0,value:"Принять"}],"family.go-to-music":[{type:0,value:"К музыке"}],"family.info-description":[{type:0,value:"Слушайте музыку и пользуйтесь другими"},{type:1,value:"br"},{type:0,value:"преимуществами Плюса вместе"},{type:1,value:"br"},{type:0,value:"с близкими в семейной мультиподписке"}],"family.info-title":[{type:0,value:"Вас приглашают"},{type:1,value:"br"},{type:0,value:"в Яндекс Плюс"}],"family.invitation-error-description":[{type:0,value:"Возможно, приглашение отменили или в мультиподписке пользователя, который вас приглашал, заняты все места"}],"family.invitation-error-title":[{type:0,value:"Приглашение недействительно"}],"family.later":[{type:0,value:"Позже"}],"family.reject":[{type:0,value:"Отклонить"}],"family.retry":[{type:0,value:"Повторить"}],"family.subscription-error-description":[{type:0,value:"Попробуйте связаться с тем, кто вас приглашал, или подключите свой Плюс, чтобы послушать музыку прямо сейчас"}],"family.subscription-error-title":[{type:0,value:"Мультиподписка недоступна"}],"family.success-description":[{type:0,value:"Вам доступны Музыка, Кинопоиск"},{type:1,value:"br"},{type:0,value:"и кешбэк баллами в сервисах Яндекса"}],"family.success-title":[{type:0,value:"Теперь вы в Плюсе!"}],"family.terms":[{type:0,value:"Условия мультиподписки"}],"family.unknown-error-description":[{type:0,value:"Точно не знаем, в чём дело. Проверьте интернет и попробуйте ещё раз"}],"family.unknown-error-title":[{type:0,value:"Не удалось принять приглашение"}],"faq.title":[{type:0,value:"Ответы на"},{type:1,value:"nbsp"},{type:0,value:"частые вопросы"}],"footer.disclaimer-content":[{type:0,value:"Яндекс Музыка – самая точная система музыкальных рекомендаций. По степени точности подбора персональных рекомендаций для&nbsp;пользователей в&nbsp;РФ среди музыкальных стриминговых сервисов в апреле 2025 года. Основано на&nbsp;данных ООО «Майл дата» по&nbsp;результатам опроса на&nbsp;базе Единой панели данных Ромир среди респондентов в возрасте 18-59 лет."},{type:0,value:"<br/>"},{type:0,value:"<br/>"},{type:0,value:"Сервис Яндекс Музыка может содержать информацию, не&nbsp;предназначенную для&nbsp;несовершеннолетних. Эти материалы отмечены значком (!). Незаконное потребление наркотических средств, психотропных веществ, их&nbsp;аналогов причиняет вред здоровью, их&nbsp;незаконный оборот запрещен и&nbsp;влечет установленную законодательством ответственность"}],"footer.explicit-content":[{type:0,value:"Сервис Яндекс Музыка может содержать информацию, не&nbsp;предназначенную для&nbsp;несовершеннолетних. Яндекс Музыка – самая точная система музыкальных рекомендаций. По степени точности подбора персональных рекомендаций для пользователей в РФ среди музыкальных стриминговых сервисов в апреле 2025 года. Основано на данных ООО «Майл дата» по результатам опроса на базе Единой панели данных Ромир среди респондентов в возрасте 18-59 лет."}],"footer.links-copyright-holders":[{type:0,value:"Правообладателям"}],"footer.links-help":[{type:0,value:"Справка"}],"footer.links-privacy-policy":[{type:0,value:"Политика конфиденциальности"}],"footer.links-recommendation-rules":[{type:0,value:"Правила рекомендаций (РФ)"}],"footer.links-terms":[{type:0,value:"Пользовательское соглашение"}],"footer.yandex-music":[{type:0,value:"Яндекс Музыка"}],"footer.yandex-project":[{type:0,value:"Проект компании Яндекс"}],"future-feature.message":[{type:0,value:"Функция в разработке, но скоро станет доступна."}],"interface-actions.add-track-to-playlist":[{type:0,value:"Добавить трек в плейлист"}],"interface-actions.add-tracks-to-playlist":[{type:0,value:"Добавить в другой плейлист"}],"interface-actions.cancel":[{type:0,value:"Отменить"}],"interface-actions.change":[{type:0,value:"Изменить"}],"interface-actions.clear":[{type:0,value:"Очистить"}],"interface-actions.close":[{type:0,value:"Закрыть"}],"interface-actions.close-ad":[{type:0,value:"Закрыть рекламу"}],"interface-actions.close-my-vibe-settings":[{type:0,value:"Закрыть меню настроек"}],"interface-actions.close-quality-settings":[{type:0,value:"Закрыть меню настройки звука"}],"interface-actions.configure-my-vibe":[{type:0,value:"Настроить"}],"interface-actions.confirm":[{type:0,value:"Понятно"}],"interface-actions.context-menu":[{type:0,value:"Контекстное меню"}],"interface-actions.context-menu-artists":[{type:0,value:"Контекстное меню с артистами"}],"interface-actions.copy-iframe":[{type:0,value:"HTML-код"}],"interface-actions.copy-link":[{type:0,value:"Скопировать ссылку"}],"interface-actions.create":[{type:0,value:"Создать"}],"interface-actions.date-today":[{type:0,value:"Сегодня"}],"interface-actions.date-yesterday":[{type:0,value:"Вчера"}],"interface-actions.delete-multivibe":[{type:0,value:"Покинуть Мою волну для двоих"}],"interface-actions.do-not-like":[{type:0,value:"Не нравится"}],"interface-actions.edit":[{type:0,value:"Редактировать"}],"interface-actions.editorial-tools":[{type:0,value:"Инструменты редакции"}],"interface-actions.further":[{type:0,value:"Далее"}],"interface-actions.go-to-collection":[{type:0,value:"Перейти в Коллекцию"}],"interface-actions.hide-sync-lyrics":[{type:0,value:"Скрыть текстомузыку"}],"interface-actions.like":[{type:0,value:"Нравится"}],"interface-actions.mark-all-listened":[{type:0,value:"Отметить всё прослушанным"}],"interface-actions.mark-all-non-listened":[{type:0,value:"Отметить всё непрослушанным"}],"interface-actions.mark-listened":[{type:0,value:"Отметить прослушанным"}],"interface-actions.mark-non-listened":[{type:0,value:"Отметить непрослушанным"}],"interface-actions.more":[{type:0,value:"Ещё"}],"interface-actions.more-details":[{type:0,value:"Подробнее"}],"interface-actions.my-vibe-context-settings":[{type:0,value:"Под занятие"}],"interface-actions.my-vibe-settings":[{type:0,value:"Настроить Мою волну"}],"interface-actions.navigate-to-admin":[{type:0,value:"Перейти в админку"}],"interface-actions.navigate-to-album":[{type:0,value:"Перейти к альбому"}],"interface-actions.navigate-to-artist":[{type:0,value:"Перейти к исполнителю"}],"interface-actions.navigate-to-artists":[{type:0,value:"Перейти к исполнителям"}],"interface-actions.navigate-to-track":[{type:0,value:"Перейти к треку"}],"interface-actions.open-lyrics":[{type:0,value:"Показать текст песни"}],"interface-actions.open-play-queue":[{type:0,value:"Открыть очередь"}],"interface-actions.open-sync-lyrics":[{type:0,value:"Включить текстомузыку"}],"interface-actions.pin":[{type:0,value:"Закрепить"}],"interface-actions.pin-my-vibe":[{type:0,value:"Закрепить Мою волну"}],"interface-actions.playlist-made-date":[{type:0,value:"Cобран "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"}],"interface-actions.playlist-made-date-with-year":[{type:0,value:"Cобран "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"}],"interface-actions.playlist-made-for-date":[{type:0,value:"Cобран для "},{type:1,value:"playlistReceiver"},{type:0,value:" "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"}],"interface-actions.playlist-made-for-date-with-year":[{type:0,value:"Cобран для "},{type:1,value:"playlistReceiver"},{type:0,value:" "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"}],"interface-actions.playlist-made-for-today":[{type:0,value:"Cобран для "},{type:1,value:"playlistReceiver"},{type:0,value:" сегодня"}],"interface-actions.playlist-made-for-yesterday":[{type:0,value:"Cобран для "},{type:1,value:"playlistReceiver"},{type:0,value:" вчера"}],"interface-actions.playlist-made-today":[{type:0,value:"Cобран сегодня"}],"interface-actions.playlist-made-yesterday":[{type:0,value:"Cобран вчера"}],"interface-actions.quality":[{type:0,value:"Качество"}],"interface-actions.reload-part-page":[{type:0,value:"Перезагрузить часть страницы"}],"interface-actions.rename":[{type:0,value:"Переименовать"}],"interface-actions.report-problem":[{type:0,value:"Сообщить о проблеме"}],"interface-actions.reset-context":[{type:0,value:"Сбросить "},{type:1,value:"context"},{type:0,value:" и включить Мою волну"}],"interface-actions.reset-my-vibe-settings":[{type:0,value:"Сбросить"}],"interface-actions.reset-search-input":[{type:0,value:"Очистить поиск"}],"interface-actions.save":[{type:0,value:"Сохранить"}],"interface-actions.share":[{type:0,value:"Поделиться"}],"interface-actions.show-duplicates":[{type:0,value:"Показать дубликаты"}],"interface-actions.show-genres":[{type:0,value:"Показать жанры"}],"interface-actions.show-majors":[{type:0,value:"Показать majors"}],"interface-actions.speed":[{type:0,value:"Скорость воспроизведения "},{type:1,value:"speed"},{type:0,value:" "}],"interface-actions.subscribe":[{type:0,value:"Подписаться на подкаст"}],"interface-actions.subscribed":[{type:0,value:"Вы подписаны"}],"interface-actions.unpin":[{type:0,value:"Открепить"}],"interface-actions.unpin-my-vibe":[{type:0,value:"Открепить Мою волну"}],"interface-actions.updated-anonymously-playlist-date":[{type:0,value:"Плейлист обновлён "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"}],"interface-actions.updated-anonymously-playlist-date-with-year":[{type:0,value:"Плейлист обновлён "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"}],"interface-actions.updated-anonymously-playlist-today":[{type:0,value:"Плейлист обновлён сегодня"}],"interface-actions.updated-anonymously-playlist-yesterday":[{type:0,value:"Плейлист обновлён вчера"}],"interface-actions.updated-playlist-date":[{type:1,value:"ownerName"},{type:0,value:" "},{options:{female:{value:[{type:0,value:"обновила"}]},male:{value:[{type:0,value:"обновил"}]},other:{value:[{type:0,value:"обновил"}]}},type:5,value:"gender"},{type:0,value:" плейлист "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"}],"interface-actions.updated-playlist-date-with-year":[{type:1,value:"ownerName"},{type:0,value:" "},{options:{female:{value:[{type:0,value:"обновила"}]},male:{value:[{type:0,value:"обновил"}]},other:{value:[{type:0,value:"обновил"}]}},type:5,value:"gender"},{type:0,value:" плейлист "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"}],"interface-actions.updated-playlist-today":[{type:1,value:"ownerName"},{type:0,value:" "},{options:{female:{value:[{type:0,value:"обновила"}]},male:{value:[{type:0,value:"обновил"}]},other:{value:[{type:0,value:"обновил"}]}},type:5,value:"gender"},{type:0,value:" плейлист сегодня"}],"interface-actions.updated-playlist-yesterday":[{type:1,value:"ownerName"},{type:0,value:" "},{options:{female:{value:[{type:0,value:"обновила"}]},male:{value:[{type:0,value:"обновил"}]},other:{value:[{type:0,value:"обновил"}]}},type:5,value:"gender"},{type:0,value:" плейлист вчера"}],"interface-actions.xlsx-download":[{type:0,value:"Скачать Excel-файл"}],"kids.albums-and-podcasts":[{type:0,value:"Альбомы, подкасты и сказки"}],"kids.empty-collection-text":[{type:0,value:"Ставьте лайки детским песенкам и сказкам, и они появятся тут"}],"kids.favourite-tracks-and-episodes":[{type:0,value:"Любимые песенки и выпуски"}],"kids.for-kids":[{type:0,value:"Детям"}],"lite-version.description":[{type:0,value:"Визуальные эффекты и анимации будут загружаться в облегчённом формате"}],"lite-version.go-to-settings":[{type:0,value:"К настройкам"}],"lite-version.notification-title":[{type:0,value:"Включена lite-версия"}],"lite-version.title":[{type:0,value:"Включить lite-версию"}],"loading-messages.concert-is-loading":[{type:0,value:"Концерт загружается"}],"loading-messages.content-is-loading":[{type:0,value:"Контент загружается"}],"loading-messages.entity-is-loading":[{type:1,value:"entityName"},{type:0,value:" загружается"}],"mixes.albums-list":[{type:0,value:"Список альбомов подборки «"},{type:1,value:"genreName"},{type:0,value:"»"}],"mixes.playlists-list":[{type:0,value:"Список плейлистов подборки «"},{type:1,value:"genreName"},{type:0,value:"»"}],"multivibe.enabled-room-modal-button-text":[{type:0,value:"Слушать"}],"multivibe.enabled-room-modal-description":[{type:0,value:"Слушайте Мою волну с объединенными рекомендациями"}],"multivibe.enabled-room-modal-title":[{type:0,value:"Моя волна на двоих уже создана"}],"multivibe.go-to-collection-button-text":[{type:0,value:"В Коллекцию"}],"multivibe.invite-modal-draft-description":[{type:0,value:"Когда приглашение примут, Моя волна для двоих появится в вашей Коллекции\n"}],"multivibe.invite-modal-draft-title":[{type:0,value:"Приглашение пока не принято"}],"multivibe.invite-modal-invalid-button-text":[{type:0,value:"Создать"}],"multivibe.invite-modal-invalid-description":[{type:0,value:"Попросите прислать новое приглашение или создайте Мою волну для двоих"}],"multivibe.invite-modal-invalid-title":[{type:0,value:"Это приглашение больше недействительно"}],"multivibe.invite-modal-valid-button-text":[{type:0,value:"Присоединиться"}],"multivibe.invite-modal-valid-description":[{type:0,value:"Слушайте Мою волну, которая совместит ваши вкусы. Персональные рекомендации не&nbsp;изменятся"}],"multivibe.invite-modal-valid-title":[{type:1,value:"name"},{type:0,value:" приглашает вас в&nbsp;Мою волну для&nbsp;двоих"}],"multivibe.link-successfully-copied":[{type:0,value:"Ссылка на Мою волну для двоих скопирована"}],"multivibe.modal-subtitle":[{type:0,value:"Ваша настоящая связь"}],"multivibe.nda":[{type:0,value:"NDA"}],"multivibe.only-member-modal-description":[{type:0,value:"Поделитесь ссылкой снова, чтобы слушать Мою волну для двоих"}],"multivibe.only-member-modal-title":[{type:0,value:"В этой Моей волне для двоих только вы"}],"multivibe.promo-modal-co-brand-a11y":[{type:0,value:"Доступно при поддержке билайн"}],"multivibe.promo-modal-description":[{type:0,value:"Поделитесь ссылкой и слушайте Мою волну, которая совместит ваши вкусы. Персональные рекомендации не изменятся"}],"multivibe.promo-modal-title":[{type:0,value:"Моя волна на двоих"}],"multivibe.room-limit-exceeded-description":[{type:0,value:"Вы создали уже 50 Моих волн для двоих. Чтобы создать новую, покиньте одну из текущих"}],"multivibe.room-limit-exceeded-title":[{type:0,value:"Много-много половин!"}],"multivibe.room-status-disabled":[{type:0,value:"неактивна"}],"multivibe.room-status-enabled":[{type:0,value:"активна"}],"multivibe.room-unavailable":[{type:0,value:"Больше недоступно"}],"music-history.album":[{type:0,value:"Альбом"}],"music-history.artist":[{type:0,value:"Исполнитель"}],"music-history.empty-title":[{type:0,value:"Тут найдётся всё, что вы слушали в последнее время"}],"music-history.my-vibe":[{type:0,value:"Моя волна"}],"music-history.playlist":[{type:0,value:"Плейлист"}],"music-history.search":[{type:0,value:"Результаты поиска"}],"music-history.shuffle":[{type:0,value:"Слушали вперемешку"}],"music-history.title":[{type:0,value:"История"}],"navigation.best-recommendations":[{type:0,value:"Самые точные рекомендации"}],"navigation.go-back":[{type:0,value:"Вернуться назад"}],"navigation.go-forward":[{type:0,value:"Вернуться вперед"}],"navigation.go-home":[{type:0,value:"Перейти в Яндекс Музыку"}],"navigation.main-menu":[{type:0,value:"Главное меню"}],"navigation.page-collection":[{type:0,value:"Коллекция"}],"navigation.page-for-you-and-trends":[{type:0,value:"Для вас и Тренды"}],"navigation.page-main":[{type:0,value:"Главная"}],"navigation.page-my-vibe":[{type:0,value:"Моя волна"}],"navigation.page-plus":[{type:0,value:"Ваш Плюс"}],"navigation.pins-list":[{type:0,value:"Закрепленное"}],"navigation.search":[{type:0,value:"Поиск"}],"non-music.audiobook-artist":[{type:0,value:"Чтец"}],"non-music.audiobook-artists":[{type:0,value:"Чтецы"}],"non-music.audiobook-list":[{type:0,value:"Оглавление аудиокниги «"},{type:1,value:"albumName"},{type:0,value:"»"}],"non-music.audiobook-tab-about":[{type:0,value:"О книге"}],"non-music.audiobook-tab-tracks":[{type:0,value:"Оглавление"}],"non-music.book-available-with-plus":[{type:0,value:"Эта книга доступна с опцией Плюса"}],"non-music.continue-listen-landing-block-title":[{type:0,value:"Продолжить слушать"}],"non-music.fairy-tale-available-with-plus":[{type:0,value:"Эта сказка доступна с опцией Плюса"}],"non-music.fairytale-tab-about":[{type:0,value:"О сказке"}],"non-music.navigate-to-book-album":[{type:0,value:"Перейти к книге"}],"non-music.navigate-to-clip":[{type:0,value:"Перейти к клипу"}],"non-music.navigate-to-podcast-album":[{type:0,value:"Перейти к подкасту"}],"non-music.non-music-progress":[{type:0,value:"Прогресс прослушивания "},{type:1,value:"progress"},{type:0,value:"%, "},{options:{"0":{value:[]},other:{value:[{type:1,value:"beginHours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"часа"}]},many:{value:[{type:0,value:"часов"}]},one:{value:[{type:0,value:"час"}]},other:{value:[{type:0,value:"часов"}]}},pluralType:"cardinal",type:6,value:"beginHours"}]}},type:5,value:"beginHours"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"beginMinutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"минуты"}]},many:{value:[{type:0,value:"минут"}]},one:{value:[{type:0,value:"минута"}]},other:{value:[{type:0,value:"минут"}]}},pluralType:"cardinal",type:6,value:"beginMinutes"}]}},type:5,value:"beginMinutes"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"beginSeconds"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"секунды"}]},many:{value:[{type:0,value:"секунд"}]},one:{value:[{type:0,value:"секунда"}]},other:{value:[{type:0,value:"секунд"}]}},pluralType:"cardinal",type:6,value:"beginSeconds"}]}},type:5,value:"beginSeconds"},{type:0,value:" из "},{options:{"0":{value:[]},other:{value:[{type:1,value:"endHours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"часа"}]},many:{value:[{type:0,value:"часов"}]},one:{value:[{type:0,value:"час"}]},other:{value:[{type:0,value:"часов"}]}},pluralType:"cardinal",type:6,value:"endHours"}]}},type:5,value:"endHours"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"endMinutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"минуты"}]},many:{value:[{type:0,value:"минут"}]},one:{value:[{type:0,value:"минута"}]},other:{value:[{type:0,value:"минут"}]}},pluralType:"cardinal",type:6,value:"endMinutes"}]}},type:5,value:"endMinutes"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"endSeconds"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"секунды"}]},many:{value:[{type:0,value:"секунд"}]},one:{value:[{type:0,value:"секунда"}]},other:{value:[{type:0,value:"секунд"}]}},pluralType:"cardinal",type:6,value:"endSeconds"}]}},type:5,value:"endSeconds"},{type:0,value:"."}],"non-music.podcast-available-with-plus":[{type:0,value:"Этот подкаст доступен с опцией Плюса"}],"non-music.shelf-subscribe":[{type:0,value:"Добавить на полку"}],"non-music.shelf-unsubscribe":[{type:0,value:"Убрать с полки"}],"notifications-info.added-audiobook-episode-to-playlist":[{type:0,value:"Глава "},{type:1,value:"trackName"},{type:0,value:" добавлена в плейлист «"},{type:1,value:"playlistName"},{type:0,value:"»"}],"notifications-info.added-podcast-episode-to-playlist":[{type:0,value:"Выпуск "},{type:1,value:"trackName"},{type:0,value:" добавлен в плейлист «"},{type:1,value:"playlistName"},{type:0,value:"»"}],"notifications-info.added-to":[{type:0,value:"добавлен в"}],"notifications-info.added-track-to-playlist":[{type:0,value:"Трек "},{type:1,value:"trackName"},{type:0,value:" добавлен в плейлист «"},{type:1,value:"playlistName"},{type:0,value:"»"}],"notifications-info.added-tracks-to-playlist":[{type:0,value:"Треки добавлены в плейлист «"},{type:1,value:"playlistName"},{type:0,value:"»"}],"notifications-info.album-added-to-collection":[{type:0,value:"Альбом "},{type:1,value:"entity"},{type:0,value:" добавлен в "},{children:[{type:0,value:"Коллекцию"}],type:8,value:"collection"}],"notifications-info.album-added-to-collection-aria-label":[{type:0,value:"Альбом "},{type:1,value:"entity"},{type:0,value:" добавлен в Коллекцию"}],"notifications-info.album-link":[{type:0,value:"Ссылка на альбом"}],"notifications-info.album-pinned-in-menu":[{type:0,value:"Альбом "},{type:1,value:"entity"},{type:0,value:" закреплен в боковом меню"}],"notifications-info.album-removed-from-collection":[{type:0,value:"Альбом "},{type:1,value:"entity"},{type:0,value:" удален из "},{children:[{type:0,value:"Коллекции"}],type:8,value:"collection"}],"notifications-info.album-removed-from-collection-aria-label":[{type:0,value:"Альбом "},{type:1,value:"entity"},{type:0,value:" удален из Коллекции"}],"notifications-info.album-unpinned-from-menu":[{type:0,value:"Альбом "},{type:1,value:"entity"},{type:0,value:" удален из бокового меню"}],"notifications-info.already-added-tracks":[{type:0,value:"Все треки уже добавлены в данный плейлист"}],"notifications-info.artist-added-to-collection":[{type:0,value:"Исполнитель "},{type:1,value:"entity"},{type:0,value:" добавлен в "},{children:[{type:0,value:"Коллекцию"}],type:8,value:"collection"}],"notifications-info.artist-added-to-collection-aria-label":[{type:0,value:"Исполнитель "},{type:1,value:"entity"},{type:0,value:" добавлен в Коллекцию"}],"notifications-info.artist-available-in-recommendations":[{type:0,value:"Теперь исполнитель будет появляться в ваших рекомендациях"}],"notifications-info.artist-link":[{type:0,value:"Ссылка на артиста"}],"notifications-info.artist-pinned-in-menu":[{type:0,value:"Исполнитель "},{type:1,value:"entity"},{type:0,value:" закреплен в боковом меню"}],"notifications-info.artist-removed-from-collection":[{type:0,value:"Исполнитель "},{type:1,value:"entity"},{type:0,value:" удален из "},{children:[{type:0,value:"Коллекции"}],type:8,value:"collection"}],"notifications-info.artist-removed-from-collection-aria-label":[{type:0,value:"Исполнитель "},{type:1,value:"entity"},{type:0,value:" удален из Коллекции"}],"notifications-info.artist-unavailable-in-recommendations":[{type:0,value:"Исполнитель больше не появится в ваших рекомендациях"}],"notifications-info.artist-unpinned-from-menu":[{type:0,value:"Исполнитель "},{type:1,value:"entity"},{type:0,value:" удален из бокового меню"}],"notifications-info.audiobook-added-to-collection":[{type:0,value:"Аудиокнига "},{type:1,value:"entity"},{type:0,value:" добавлена в "},{children:[{type:0,value:"Коллекцию"}],type:8,value:"collection"}],"notifications-info.audiobook-added-to-collection-aria-label":[{type:0,value:"Аудиокнига "},{type:1,value:"entity"},{type:0,value:" добавлена в Коллекцию"}],"notifications-info.audiobook-episode-added-to-shelf":[{type:0,value:"Глава "},{type:1,value:"entity"},{type:0,value:" добавлена в "},{children:[{type:0,value:"Коллекцию"}],type:8,value:"collection"}],"notifications-info.audiobook-episode-added-to-shelf-aria-label":[{type:0,value:"Глава "},{type:1,value:"entity"},{type:0,value:" добавлена в Коллекцию"}],"notifications-info.audiobook-episode-available-in-recommendations":[{type:0,value:"Теперь глава сможет появляться в ваших рекомендациях"}],"notifications-info.audiobook-episode-removed-from-shelf":[{type:0,value:"Глава "},{type:1,value:"entity"},{type:0,value:" удалена из "},{children:[{type:0,value:"Коллекции"}],type:8,value:"collection"}],"notifications-info.audiobook-episode-removed-from-shelf-aria-label":[{type:0,value:"Глава "},{type:1,value:"entity"},{type:0,value:" удалена из Коллекции"}],"notifications-info.audiobook-episode-unavailable-in-recommendations":[{type:0,value:"Глава больше не будет появляться в ваших рекомендациях"}],"notifications-info.audiobook-pinned-in-menu":[{type:0,value:"Аудиокнига "},{type:1,value:"entity"},{type:0,value:" закреплена в боковом меню"}],"notifications-info.audiobook-removed-from-collection":[{type:0,value:"Аудиокнига "},{type:1,value:"entity"},{type:0,value:" удалена из "},{children:[{type:0,value:"Коллекции"}],type:8,value:"collection"}],"notifications-info.audiobook-removed-from-collection-aria-label":[{type:0,value:"Аудиокнига "},{type:1,value:"entity"},{type:0,value:" удалена из Коллекции"}],"notifications-info.audiobook-unpinned-from-menu":[{type:0,value:"Аудиокнига "},{type:1,value:"entity"},{type:0,value:" удалена из бокового меню"}],"notifications-info.change-repeat-context":[{type:0,value:"Повтор списка воспроизведения включен"}],"notifications-info.change-repeat-none":[{type:0,value:"Повтор выключен"}],"notifications-info.change-repeat-track":[{type:0,value:"Повтор трека включен"}],"notifications-info.clip-added-to-collection":[{type:0,value:"Клип "},{type:1,value:"entity"},{type:0,value:" добавлен в "},{children:[{type:0,value:"Коллекцию"}],type:8,value:"collection"}],"notifications-info.clip-added-to-collection-aria-label":[{type:0,value:"Клип "},{type:1,value:"entity"},{type:0,value:" добавлен в Коллекцию"}],"notifications-info.clip-link":[{type:0,value:"Ссылка на клип"}],"notifications-info.clip-removed-from-collection":[{type:0,value:"Клип "},{type:1,value:"entity"},{type:0,value:" удален из "},{children:[{type:0,value:"Коллекции"}],type:8,value:"collection"}],"notifications-info.clip-removed-from-collection-aria-label":[{type:0,value:"Клип "},{type:1,value:"entity"},{type:0,value:" удален из Коллекции"}],"notifications-info.concert-link":[{type:0,value:"Ссылка на концерт"}],"notifications-info.copied":[{type:0,value:"скопирована"}],"notifications-info.entity-pinned-in-menu":[{type:1,value:"description"},{type:0,value:" "},{type:1,value:"entity"},{type:0,value:" теперь в боковом меню"}],"notifications-info.entity-unpinned-from-menu":[{type:0,value:"\n"},{type:1,value:"description"},{type:0,value:" "},{type:1,value:"entity"},{type:0,value:" больше не в боковом меню"}],"notifications-info.fairytale-added-to-collection":[{type:0,value:"Сказка "},{type:1,value:"entity"},{type:0,value:" добавлена в "},{children:[{type:0,value:"Коллекцию"}],type:8,value:"collection"}],"notifications-info.fairytale-added-to-collection-aria-label":[{type:0,value:"Сказка "},{type:1,value:"entity"},{type:0,value:" добавлена в Коллекцию"}],"notifications-info.fairytale-pinned-in-menu":[{type:0,value:"Сказка "},{type:1,value:"entity"},{type:0,value:" закреплена в боковом меню"}],"notifications-info.fairytale-removed-from-collection":[{type:0,value:"Сказка "},{type:1,value:"entity"},{type:0,value:" удалена из "},{children:[{type:0,value:"Коллекции"}],type:8,value:"collection"}],"notifications-info.fairytale-removed-from-collection-aria-label":[{type:0,value:"Сказка "},{type:1,value:"entity"},{type:0,value:" удалена из Коллекции"}],"notifications-info.fairytale-unpinned-from-menu":[{type:0,value:"Сказка "},{type:1,value:"entity"},{type:0,value:" удалена из бокового меню"}],"notifications-info.from-collection":[{type:0,value:"Коллекции"}],"notifications-info.html-code-copied":[{type:0,value:"HTML-код скопирован"}],"notifications-info.label-link":[{type:0,value:"Ссылка на лейбл"}],"notifications-info.my-vibe-pinned-in-menu":[{type:0,value:"Моя волна "},{type:1,value:"entity"},{type:0,value:" закреплена в боковом меню"}],"notifications-info.my-vibe-unpinned-from-menu":[{type:0,value:"Моя волна "},{type:1,value:"entity"},{type:0,value:" удалена из бокового меню"}],"notifications-info.playlist-added-to-collection":[{type:0,value:"Плейлист "},{type:1,value:"entity"},{type:0,value:" добавлен в "},{children:[{type:0,value:"Коллекцию"}],type:8,value:"collection"}],"notifications-info.playlist-added-to-collection-aria-label":[{type:0,value:"Плейлист "},{type:1,value:"entity"},{type:0,value:" добавлен в Коллекцию"}],"notifications-info.playlist-link":[{type:0,value:"Ссылка на плейлист"}],"notifications-info.playlist-pinned-in-menu":[{type:0,value:"Плейлист "},{type:1,value:"entity"},{type:0,value:" закреплен в боковом меню"}],"notifications-info.playlist-removed-from-collection":[{type:0,value:"Плейлист "},{type:1,value:"entity"},{type:0,value:" удален из "},{children:[{type:0,value:"Коллекции"}],type:8,value:"collection"}],"notifications-info.playlist-removed-from-collection-aria-label":[{type:0,value:"Плейлист "},{type:1,value:"entity"},{type:0,value:" удален из Коллекции"}],"notifications-info.playlist-unpinned-from-menu":[{type:0,value:"Плейлист "},{type:1,value:"entity"},{type:0,value:" удален из бокового меню"}],"notifications-info.podcast-added-to-collection":[{type:0,value:"Подкаст "},{type:1,value:"entity"},{type:0,value:" добавлен в "},{children:[{type:0,value:"Коллекцию"}],type:8,value:"collection"}],"notifications-info.podcast-added-to-collection-aria-label":[{type:0,value:"Подкаст "},{type:1,value:"entity"},{type:0,value:" добавлен в Коллекцию"}],"notifications-info.podcast-episode-added-to-collection":[{type:0,value:"Выпуск "},{type:1,value:"entity"},{type:0,value:" добавлен в "},{children:[{type:0,value:"Коллекцию"}],type:8,value:"collection"}],"notifications-info.podcast-episode-added-to-collection-aria-label":[{type:0,value:"Выпуск "},{type:1,value:"entity"},{type:0,value:" добавлен в Коллекцию"}],"notifications-info.podcast-episode-available-in-recommendations":[{type:0,value:"Теперь выпуск сможет появляться в ваших рекомендациях"}],"notifications-info.podcast-episode-removed-from-collection":[{type:0,value:"Выпуск "},{type:1,value:"entity"},{type:0,value:" удален из "},{children:[{type:0,value:"Коллекции"}],type:8,value:"collection"}],"notifications-info.podcast-episode-removed-from-collection-aria-label":[{type:0,value:"Выпуск "},{type:1,value:"entity"},{type:0,value:" удален из Коллекции"}],"notifications-info.podcast-episode-unavailable-in-recommendations":[{type:0,value:"Выпуск больше не будет появляться в ваших рекомендациях"}],"notifications-info.podcast-pinned-in-menu":[{type:0,value:"Подкаст "},{type:1,value:"entity"},{type:0,value:" закреплен в боковом меню"}],"notifications-info.podcast-remove-from-collection-aria-label":[{type:0,value:"Подкаст "},{type:1,value:"entity"},{type:0,value:" удален из Коллекции"}],"notifications-info.podcast-removed-from-collection":[{type:0,value:"Подкаст "},{type:1,value:"entity"},{type:0,value:" удален из "},{children:[{type:0,value:"Коллекции"}],type:8,value:"collection"}],"notifications-info.podcast-unpinned-from-menu":[{type:0,value:"Подкаст "},{type:1,value:"entity"},{type:0,value:" удален из бокового меню"}],"notifications-info.quality-changed":[{type:0,value:"Включено "},{type:1,value:"quality"},{type:0,value:" качество звука"}],"notifications-info.removed-audiobook-episode-from-playlist":[{type:0,value:"Глава "},{type:1,value:"trackName"},{type:0,value:" удалена из плейлиста «"},{type:1,value:"playlistName"},{type:0,value:"»"}],"notifications-info.removed-from":[{type:0,value:"удален из"}],"notifications-info.removed-podcast-episode-from-playlist":[{type:0,value:"Выпуск "},{type:1,value:"trackName"},{type:0,value:" удален из плейлиста «"},{type:1,value:"playlistName"},{type:0,value:"»"}],"notifications-info.removed-track-from-playlist":[{type:0,value:"Трек "},{type:1,value:"trackName"},{type:0,value:" удален из плейлиста «"},{type:1,value:"playlistName"},{type:0,value:"»"}],"notifications-info.shuffle-disabled":[{type:0,value:"Воспроизведение подряд"}],"notifications-info.shuffle-enabled":[{type:0,value:"Случайный порядок"}],"notifications-info.to-collection":[{type:0,value:"Коллекцию"}],"notifications-info.track-added-to-collection":[{type:0,value:"Трек "},{type:1,value:"entity"},{type:0,value:" добавлен в плейлист "},{children:[{type:0,value:"«Мне нравится»"}],type:8,value:"collection"}],"notifications-info.track-added-to-collection-aria-label":[{type:0,value:"Трек "},{type:1,value:"entity"},{type:0,value:" добавлен в плейлист «Мне нравится»"}],"notifications-info.track-available-in-recommendations":[{type:0,value:"Теперь трек сможет появляться в ваших рекомендациях"}],"notifications-info.track-link":[{type:0,value:"Ссылка на трек"}],"notifications-info.track-removed-from-collection":[{type:0,value:"Трек "},{type:1,value:"entity"},{type:0,value:" удален из плейлиста "},{children:[{type:0,value:"«Мне нравится»"}],type:8,value:"collection"}],"notifications-info.track-removed-to-collection-aria-label":[{type:0,value:"Трек "},{type:1,value:"entity"},{type:0,value:" удален из плейлиста «Мне нравится»"}],"notifications-info.track-unavailable-in-recommendations":[{type:0,value:"Трек больше не будет появляться в ваших рекомендациях"}],"notifications-info.xlsx-loading":[{type:0,value:"Формирование Excel-файла"}],"notifications-info.xlsx-success":[{type:0,value:"Excel-файл успешно скачан"}],"offline.clear-memory":[{type:0,value:"Очистить память"}],"offline.clear-memory-description":[{type:0,value:"Удалим только скачанное и кэш. Это не повлияет на ваши рекомендации и лайки"}],"offline.delete-from-device":[{type:0,value:"Удалить с устройства"}],"offline.disable-offline-mode":[{type:0,value:"Выключить офлайн-режим"}],"offline.download":[{type:0,value:"Скачать"}],"offline.download-for-offline":[{type:0,value:"Скачивайте музыку для офлайн-доступа"}],"offline.download-progress":[{type:0,value:"Прогресс скачивания"}],"offline.downloaded-empty":[{type:0,value:"У вас нет скачанного"}],"offline.downloaded-track-list":[{type:0,value:"Список скачанных треков"}],"offline.downloaded-tracks":[{type:0,value:"Скачанные треки"}],"offline.downloading-progress":[{type:1,value:"value"},{type:0,value:"%"}],"offline.listen-downloaded-content":[{type:0,value:"Сейчас вы можете слушать только скачанное"}],"offline.memory-cleared":[{type:0,value:"Память устройства очищена"}],"offline.no-internet-connection":[{type:0,value:"Нет интернета"}],"offline.offline-mode":[{type:0,value:"Офлайн-режим"}],"offline.offline-mode-description":[{type:0,value:"Слушайте скачанное без интернета"}],"offline.offline-mode-enabled":[{type:0,value:"Офлайн-режим включён"}],"offline.stop-downloading":[{type:0,value:"Остановить скачивание"}],"offline.track-download-error":[{type:0,value:"При скачивании трека произошла ошибка"}],"offline.track-downloaded":[{type:0,value:"Трек скачан"}],"onboarding.artist-donation-button-1":[{type:0,value:"Поддержите донатом"},{type:1,value:"br"},{type:0,value:"любимого артиста"}],"onboarding.authorize-to-add-to-collection":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы добавить в"},{type:1,value:"nbsp"},{type:0,value:"Коллекцию"}],"onboarding.authorize-to-add-track-to-queue":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы добавить трек в"},{type:1,value:"nbsp"},{type:0,value:"очередь"}],"onboarding.authorize-to-change-quality":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы настроить качество звука"}],"onboarding.authorize-to-dislike":[{type:0,value:"Войдите в аккаунт, чтобы поставить дизлайк"}],"onboarding.authorize-to-like":[{type:0,value:"Войдите в аккаунт, чтобы поставить лайк"}],"onboarding.authorize-to-listen-full":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы послушать трек полностью"}],"onboarding.authorize-to-listen-vibe":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну"}],"onboarding.authorize-to-listen-vibe-by-activity":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"занятию"}],"onboarding.authorize-to-listen-vibe-by-album":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"альбому"}],"onboarding.authorize-to-listen-vibe-by-artist":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"артисту"}],"onboarding.authorize-to-listen-vibe-by-genre":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"жанру"}],"onboarding.authorize-to-listen-vibe-by-mood":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"настроению"}],"onboarding.authorize-to-listen-vibe-by-playlist":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"плейлисту"}],"onboarding.authorize-to-listen-vibe-by-track":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"треку"}],"onboarding.authorize-to-open-queue":[{type:0,value:"Войдите в аккаунт, чтобы открыть очередь"}],"onboarding.authorize-to-pin":[{type:0,value:"Войдите в аккаунт, чтобы закрепить в"},{type:1,value:"nbsp"},{type:0,value:"сайдбаре/меню"}],"onboarding.authorize-to-view-sync-lyrics":[{type:0,value:"Войдите в"},{type:1,value:"nbsp"},{type:0,value:"аккаунт, чтобы посмотреть текстомузыку"}],"onboarding.rewind-trailer":[{type:0,value:"Включайте трейлер"},{type:1,value:"br"},{type:0,value:"года"}],"onboarding.trailer":[{type:0,value:"Ищите музыку по"},{type:1,value:"br"},{type:0,value:"лучшим отрывкам"}],"onboarding.try-plus-to-enable-high-quality":[{type:0,value:"Активируйте мультиподписку, чтобы включить высокое качество"}],"onboarding.try-plus-to-listen-full":[{type:0,value:"Активируйте мультиподписку, чтобы послушать трек целиком"}],"onboarding.try-plus-to-listen-vibe":[{type:0,value:"Активируйте мультиподписку, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну"}],"onboarding.try-plus-to-listen-vibe-by-activity":[{type:0,value:"Активируйте мультиподписку, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"занятию"}],"onboarding.try-plus-to-listen-vibe-by-album":[{type:0,value:"Активируйте мультиподписку, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"альбому"}],"onboarding.try-plus-to-listen-vibe-by-artist":[{type:0,value:"Активируйте мультиподписку, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"артисту"}],"onboarding.try-plus-to-listen-vibe-by-genre":[{type:0,value:"Активируйте мультиподписку, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"жанру"}],"onboarding.try-plus-to-listen-vibe-by-mood":[{type:0,value:"Активируйте мультиподписку, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"настроению"}],"onboarding.try-plus-to-listen-vibe-by-playlist":[{type:0,value:"Активируйте мультиподписку, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"плейлисту"}],"onboarding.try-plus-to-listen-vibe-by-track":[{type:0,value:"Активируйте мультиподписку, чтобы"},{type:1,value:"br"},{type:0,value:"послушать Мою"},{type:1,value:"nbsp"},{type:0,value:"волну по"},{type:1,value:"nbsp"},{type:0,value:"треку"}],"onboarding.try-plus-to-open-collection":[{type:0,value:"Активируйте мультиподписку, чтобы получить доступ к"},{type:1,value:"nbsp"},{type:0,value:"вашей Коллекции"}],"onboarding.try-plus-to-view-sync-lyrics":[{type:0,value:"Активируйте подписку, чтобы"},{type:1,value:"br"},{type:0,value:"посмотреть текстомузыку"}],"page-error.concert-page-does-not-exist":[{type:0,value:"Не нашли такой концерт"}],"page-error.concert-page-does-not-exist-description":[{type:0,value:"Возможно, он уже прошёл или произошла ошибка"}],"page-error.page-does-not-exist":[{type:0,value:"Ничего не нашлось"}],"page-error.page-does-not-exist-description":[{type:0,value:"Попробуйте поискать в этом разделе"}],"page-error.reload":[{type:0,value:"Обновить"}],"page-error.reload-page-button":[{type:0,value:"Обновить страницу"}],"page-error.restart-app-button":[{type:0,value:"Перезагрузить"}],"page-error.try-to-reload-page":[{type:0,value:"Попробуйте обновить страницу"}],"page-error.try-to-restart-app":[{type:0,value:"Попробуйте перезагрузить приложение"}],"page.album-label-title":[{options:{"1":{value:[{type:0,value:"Лейбл"}]},other:{value:[{type:0,value:"Лейблы"}]}},type:5,value:"count"},{type:0,value:":"}],"page.album-publisher-title":[{options:{"1":{value:[{type:0,value:"Издатель"}]},other:{value:[{type:0,value:"Издатели"}]}},type:5,value:"count"},{type:0,value:":"}],"page.artist-albums-header":[{type:0,value:"Альбомы "},{type:1,value:"artistName"}],"page.artist-all-concerts-header":[{type:0,value:"Все концерты "},{type:1,value:"artistName"}],"page.artist-clips-header":[{type:0,value:"Клипы "},{type:1,value:"artistName"}],"page.artist-compilations-header":[{type:0,value:"Сборники "},{type:1,value:"artistName"}],"page.artist-concerts-header":[{type:0,value:"Концерты "},{type:1,value:"artistName"}],"page.artist-discography-header":[{type:0,value:"Студийные альбомы "},{type:1,value:"artistName"}],"page.artist-pick-aria-label":[{type:0,value:"Новая сцена "},{type:1,value:"artistName"}],"page.artist-pick-subtitle":[{type:0,value:"Новая сцена"}],"page.artist-similar-header":[{type:0,value:"Похожие исполнители на "},{type:1,value:"artistName"}],"page.artist-tracks-header":[{type:0,value:"Популярные треки "},{type:1,value:"artistName"}],"page.delayed-non-music":[{type:0,value:"Добавленные подкасты и книги"}],"page.familiar-collection":[{type:0,value:"У вас в Коллекции"}],"page.familiar-vibe":[{type:0,value:"Слушали в Моей волне"}],"page.familiar-you":[{type:0,value:"Знакомое вам"}],"page.label-albums-header":[{type:0,value:"Релизы "},{type:1,value:"labelName"}],"page.label-artists-header":[{type:0,value:"Исполнители "},{type:1,value:"labelName"}],"page.label-podcast-header":[{type:0,value:"Выпуски "},{type:1,value:"labelName"}],"page.podcasts-and-books":[{type:0,value:"Подкасты и книги"}],"page.results-of-the-year":[{type:0,value:"Итоги года"}],"page.settings":[{type:0,value:"Настройки"}],"page.shelf":[{type:0,value:"Моя полка"}],"page.similar-entities-block-title":[{type:0,value:"Слушайте похожее"}],"page.summer_2026_title":[{type:0,value:"Распакуйте ваше лето"}],"page.vibe-rooms":[{type:0,value:"Моя волна на двоих"}],"payment.album-offer-button-title":[{type:0,value:"Слушать альбом"}],"payment.books-offer-button-title":[{type:0,value:"Слушать книгу"}],"payment.buy":[{type:0,value:"Купить"}],"payment.fairy-tale-offer-button-title":[{type:0,value:"Слушать сказку"}],"payment.high-quality-offer-button-title":[{type:0,value:"Слушать в высоком качестве"}],"payment.learn-personal-bonus":[{type:0,value:"Узнайте ваш персональный бонус"}],"payment.min-price":[{type:0,value:"от "},{type:1,value:"value"}],"payment.offer-button":[{type:0,value:"Оформить мультиподписку"}],"payment.podcast-offer-button-title":[{type:0,value:"Слушать подкаст"}],"payment.single-offer-button-title":[{type:0,value:"Слушать сингл"}],"payment.try-button":[{type:0,value:"Попробовать"}],"payment.yandex-plus-offer-button":[{type:0,value:"По мультиподписке Яндекс Плюс"}],"paywall-footer.cashback-terms-link":[{type:0,value:"Условия кешбэка"}],"paywall-footer.privileges-terms-link":[{type:0,value:"Условия привилегий"}],"paywall-footer.promotion-terms-link":[{type:0,value:"Условия акции"}],"paywall-footer.subscription-terms-link":[{type:0,value:"Условия мультиподписки"}],"paywall-footer.subscription-terms-link-other-countries":[{type:0,value:"Условия подписки"}],"paywall-footer.support-link":[{type:0,value:"Служба поддержки"}],"paywall.books-part-benefit-app-desktop":[{type:0,value:"Читайте и"},{type:1,value:"nbsp"},{type:0,value:"слушайте в"},{type:1,value:"nbsp"},{type:0,value:"отдельном приложении"}],"paywall.books-part-benefit-download-desktop":[{type:0,value:"Скачивайте книги на"},{type:1,value:"nbsp"},{type:0,value:"устройство"}],"paywall.books-part-benefit-download-mobile":[{type:0,value:"Скачивайте книги на"},{type:1,value:"nbsp"},{type:0,value:"устройство"}],"paywall.books-part-benefit-follow-desktop":[{type:0,value:"Следите за"},{type:1,value:"nbsp"},{type:0,value:"новинками и"},{type:1,value:"nbsp"},{type:0,value:"возвращайтесь к"},{type:1,value:"nbsp"},{type:0,value:"классике"}],"paywall.books-part-benefit-read-mobile":[{type:0,value:"Читайте новинки и"},{type:1,value:"nbsp"},{type:0,value:"классику"}],"paywall.books-part-benefit-speed-desktop":[{type:0,value:"Выбирайте комфортный"},{type:1,value:"br"},{type:0,value:"вам темп"}],"paywall.books-part-benefit-speed-mobile":[{type:0,value:"Слушайте в"},{type:1,value:"nbsp"},{type:0,value:"комфортном темпе"}],"paywall.books-part-benefit-switch-mobile":[{type:0,value:"Переключайтесь между текстом и"},{type:1,value:"nbsp"},{type:0,value:"аудио"}],"paywall.books-part-title":[{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Книги"}],"paywall.family-offer-text":[{type:0,value:"У каждого свой аккаунт и персональные"},{type:1,value:"br"},{type:0,value:"рекомендации. Без доплат"}],"paywall.family-offer-title":[{type:0,value:"Музыка для вас "},{type:1,value:"br"},{type:0,value:"и"},{type:1,value:"nbsp"},{type:0,value:"трёх близких"}],"paywall.faq-answer-afraid-forget-cancel":[{type:0,value:"Не переживайте, мы напишем письмо на"},{type:1,value:"nbsp"},{type:0,value:"вашу почту за"},{type:1,value:"nbsp"},{type:0,value:"3"},{type:1,value:"nbsp"},{type:0,value:"дня до"},{type:1,value:"nbsp"},{type:0,value:"первого списания"}],"paywall.faq-answer-cancel-until-end":[{type:0,value:"Мультиподписку можно отменить в любой момент. Вот как это сделать:"},{type:1,value:"steps"}],"paywall.faq-answer-cancel-until-end-other-countries":[{type:0,value:"Подписку можно отменить в любой момент. Вот как это сделать:"},{type:1,value:"steps"}],"paywall.faq-answer-cancel-until-end-step-1":[{type:0,value:"Откройте страницу "},{type:1,value:"link"}],"paywall.faq-answer-cancel-until-end-step-1-link":[{type:0,value:"Управление мультиподпиской"}],"paywall.faq-answer-cancel-until-end-step-1-link-other-countries":[{type:0,value:"Управление подпиской"}],"paywall.faq-answer-cancel-until-end-step-2":[{type:0,value:"Нажмите «Отменить мультиподписку»"}],"paywall.faq-answer-cancel-until-end-step-2-other-countries":[{type:0,value:"Нажмите «Отменить подписку»"}],"paywall.faq-answer-where-else-subscribe":[{type:0,value:"Скачивайте приложение Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Музыки"},{type:1,value:"nbsp"},{type:0,value:"—"},{type:1,value:"nbsp"},{type:0,value:"через"},{type:1,value:"nbsp"},{type:0,value:"него тоже можно активировать Плюс"}],"paywall.faq-answer-without-card-binding":[{type:0,value:"Нет, к"},{type:1,value:"nbsp"},{type:0,value:"аккаунту должна быть привязана карта. Не беспокойтесь за"},{type:1,value:"nbsp"},{type:0,value:"списания, их не будет до"},{type:1,value:"nbsp"},{type:0,value:"конца пробного периода. Когда вы привяжете новую карту к"},{type:1,value:"nbsp"},{type:0,value:"аккаунту, с"},{type:1,value:"nbsp"},{type:0,value:"неё спишется и тут"},{type:1,value:"nbsp"},{type:0,value:"же вернётся небольшая сумма — так мы проверяем, что с"},{type:1,value:"nbsp"},{type:0,value:"картой всё в"},{type:1,value:"nbsp"},{type:0,value:"порядке"}],"paywall.faq-question-afraid-forget-cancel":[{type:0,value:"Боюсь забыть отменить мультиподписку до"},{type:1,value:"nbsp"},{type:0,value:"конца пробного периода"}],"paywall.faq-question-afraid-forget-cancel-other-countries":[{type:0,value:"Боюсь забыть отменить подписку до"},{type:1,value:"nbsp"},{type:0,value:"конца пробного периода"}],"paywall.faq-question-cancel-until-end":[{type:0,value:"Смогу"},{type:1,value:"nbsp"},{type:0,value:"ли я отключить мультиподписку до"},{type:1,value:"nbsp"},{type:0,value:"конца пробного периода?"}],"paywall.faq-question-cancel-until-end-other-countries":[{type:0,value:"Смогу"},{type:1,value:"nbsp"},{type:0,value:"ли я отключить подписку до"},{type:1,value:"nbsp"},{type:0,value:"конца пробного периода?"}],"paywall.faq-question-where-else-subscribe":[{type:0,value:"Не"},{type:1,value:"nbsp"},{type:0,value:"хочу вводить данные карты на"},{type:1,value:"nbsp"},{type:0,value:"сайте в"},{type:1,value:"nbsp"},{type:0,value:"браузере. Где я ещё могу оформить мультиподписку?"}],"paywall.faq-question-where-else-subscribe-other-countries":[{type:0,value:"Не"},{type:1,value:"nbsp"},{type:0,value:"хочу вводить данные карты на"},{type:1,value:"nbsp"},{type:0,value:"сайте в"},{type:1,value:"nbsp"},{type:0,value:"браузере. Где я ещё могу оформить подписку?"}],"paywall.faq-question-without-card-binding":[{type:0,value:"Можно ли включить пробный период, не привязывая банковскую карту?"}],"paywall.kinopoisk-part-benefit-channels":[{type:0,value:"Откройте доступ"},{type:1,value:"br"},{type:0,value:"к"},{type:1,value:"nbsp"},{type:0,value:"сотням телеканалов"}],"paywall.kinopoisk-part-benefit-exclusive":[{type:0,value:"Смотрите"},{type:1,value:"br"},{type:0,value:"эксклюзивы"},{type:1,value:"br"},{type:0,value:"Кинопоиска"}],"paywall.kinopoisk-part-benefit-movies":[{type:0,value:"Выбирайте из"},{type:1,value:"nbsp"},{type:0,value:"тысяч"},{type:1,value:"br"},{type:0,value:"фильмов и"},{type:1,value:"nbsp"},{type:0,value:"сериалов"}],"paywall.kinopoisk-part-benefit-sport":[{type:0,value:"Следите"},{type:1,value:"br"},{type:0,value:"за"},{type:1,value:"nbsp"},{type:0,value:"спортивными"},{type:1,value:"br"},{type:0,value:"трансляциями"}],"paywall.kinopoisk-part-title":[{type:0,value:"Кинопоиск"}],"paywall.more-info":[{type:0,value:"Что входит в"},{type:1,value:"nbsp"},{type:0,value:"мультиподписку"}],"paywall.music-benefit-all-in-one-desktop":[{type:0,value:"Всё это — в"},{type:1,value:"nbsp"},{type:0,value:"одном"},{type:1,value:"br"},{type:0,value:"удобном сервисе"}],"paywall.music-benefit-all-in-one-mobile":[{type:0,value:"Всё это — в"},{type:1,value:"nbsp"},{type:0,value:"одном"},{type:1,value:"br"},{type:0,value:"удобном приложении"}],"paywall.music-benefit-audio":[{type:0,value:"Музыка, аудиокниги\u2028и"},{type:1,value:"nbsp"},{type:0,value:"подкасты"}],"paywall.music-benefit-recommendation":[{type:0,value:"Самые точные рекомендации"}],"paywall.music-benefit-without-network":[{type:0,value:"Скачивайте и"},{type:1,value:"nbsp"},{type:0,value:"слушайте даже без"},{type:1,value:"nbsp"},{type:0,value:"интернета"}],"paywall.music-benefits-title":[{type:0,value:"Давайте включим"},{type:1,value:"br"},{type:0,value:"Яндекс Музыку"}],"paywall.music-on-many-devices":[{type:0,value:"Музыка на"},{type:1,value:"nbsp"},{type:0,value:"разных устройствах с"},{type:1,value:"nbsp"},{type:0,value:"подпиской Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Плюс"}],"paywall.music-part-benefit-books":[{type:0,value:"Слушайте"},{type:1,value:"br"},{type:0,value:"аудиокниги"}],"paywall.music-part-benefit-books-alternative":[{type:0,value:"Слушайте аудиокниги"}],"paywall.music-part-benefit-many-devices":[{type:0,value:"Позвольте умным рекомендациям"},{type:1,value:"br"},{type:0,value:"удивлять вас"}],"paywall.music-part-benefit-playlists":[{type:0,value:"Создавайте"},{type:1,value:"br"},{type:0,value:"свои плейлисты"},{type:1,value:"br"},{type:0,value:"в"},{type:1,value:"nbsp"},{type:0,value:"Коллекции"}],"paywall.music-part-benefit-recommendations":[{type:0,value:"Находите интересное"},{type:1,value:"br"},{type:0,value:"среди тысяч подборок"}],"paywall.music-part-benefit-without-internet":[{type:0,value:"Слушайте"},{type:1,value:"br"},{type:0,value:"без"},{type:1,value:"nbsp"},{type:0,value:"интернета"},{type:1,value:"br"},{type:0,value:"в"},{type:1,value:"nbsp"},{type:0,value:"отличном качестве"}],"paywall.music-part-benefit-without-internet-mobile":[{type:0,value:"Слушайте даже без"},{type:1,value:"nbsp"},{type:0,value:"интернета"}],"paywall.music-part-title":[{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Музыка"}],"paywall.open-plus-benefits":[{type:0,value:"Все развлечения в"},{type:1,value:"nbsp"},{type:0,value:"одной мультиподписке"}],"paywall.other-services-part-benefit-maps":[{type:0,value:"Карты и Навигатор\u2028 в"},{type:1,value:"nbsp"},{type:0,value:"CarPlay \u2028и"},{type:1,value:"nbsp"},{type:0,value:"Android"},{type:1,value:"nbsp"},{type:0,value:"Auto"}],"paywall.other-services-part-benefit-your-plus":[{type:0,value:"Больше возможностей в"},{type:1,value:"nbsp"},{type:0,value:"Своих"},{type:1,value:"nbsp"},{type:0,value:"Плюсах"}],"paywall.other-services-part-save":[{type:0,value:"Повышенная ставка \u2028по"},{type:1,value:"nbsp"},{type:0,value:"накопительным счетам в"},{type:1,value:"nbsp"},{type:0,value:"Сейвах"}],"paywall.other-services-part-title":[{type:0,value:"Преимущества Плюса в"},{type:1,value:"nbsp"},{type:0,value:"сервисах Яндекса"}],"paywall.pay-part-benefit-split-desktop":[{type:0,value:"Делите оплату на"},{type:1,value:"nbsp"},{type:0,value:"части со"},{type:1,value:"nbsp"},{type:0,value:"Сплитом"}],"paywall.plus-benefit-books":[{type:0,value:"Книги"},{type:1,value:"br"},{type:0,value:"и аудиокниги"}],"paywall.plus-benefit-cashback":[{type:0,value:"И другие преимущества в"},{type:1,value:"nbsp"},{type:0,value:"сервисах Яндекса"}],"paywall.plus-benefit-kinopoisk":[{type:0,value:"Фильмы и"},{type:1,value:"nbsp"},{type:0,value:"сериалы"},{type:1,value:"br"},{type:0,value:"на"},{type:1,value:"nbsp"},{type:0,value:"Кинопоиске"}],"paywall.plus-benefit-music":[{type:0,value:"Музыка и"},{type:1,value:"nbsp"},{type:0,value:"подкасты"},{type:1,value:"br"},{type:0,value:"без рекламы"}],"paywall.plus-part-benefit-devices":[{type:0,value:"Подключайте"},{type:1,value:"br"},{type:0,value:"до 10 устройств"}],"paywall.plus-part-benefit-family":[{type:0,value:"Добавляйте"},{type:1,value:"br"},{type:0,value:"3"},{type:1,value:"nbsp"},{type:0,value:"близких"}],"paywall.plus-part-benefit-options":[{type:0,value:"Расширяйте возможности \u2028вашей мультиподписки\u2028 с"},{type:1,value:"nbsp"},{type:0,value:"помощью опций"}],"paywall.plus-part-spend-points":[{type:0,value:"Тратьте баллы Плюса на"},{type:1,value:"nbsp"},{type:0,value:"заказы в"},{type:1,value:"nbsp"},{type:0,value:"сервисах Яндекса: 1"},{type:1,value:"nbsp"},{type:0,value:"балл"},{type:1,value:"nbsp"},{type:0,value:"="},{type:1,value:"nbsp"},{type:0,value:"1"},{type:1,value:"nbsp"},{type:0,value:"₽"}],"paywall.plus-part-title":[{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Плюс"}],"paywall.recommendations-on-devices":[{type:0,value:"Слушайте рекомендации по"},{type:1,value:"nbsp"},{type:0,value:"вашим интересам там, где удобно"}],"play-queue.album-will-be-played-last":[{type:0,value:"Альбом "},{type:1,value:"title"},{type:0,value:" добавлен в конец очереди"}],"play-queue.album-will-be-played-next":[{type:0,value:"Альбом "},{type:1,value:"title"},{type:0,value:" добавлен в начало очереди"}],"play-queue.audiobook-episode-will-be-played-last":[{type:0,value:"Глава "},{type:1,value:"title"},{type:0,value:" добавлена в конец очереди"}],"play-queue.audiobook-episode-will-be-played-next":[{type:0,value:"Глава "},{type:1,value:"title"},{type:0,value:" добавлена в начало очереди"}],"play-queue.audiobook-episode-will-be-removed":[{type:0,value:"Глава "},{type:1,value:"title"},{type:0,value:" удалена из очереди"}],"play-queue.delete-from-queue":[{type:0,value:"Удалить из очереди"}],"play-queue.my-wave-by-album":[{type:0,value:"Моя волна по альбому"}],"play-queue.my-wave-by-artist":[{type:0,value:"Моя волна по артисту"}],"play-queue.my-wave-by-playlist":[{type:0,value:"Моя волна по плейлисту"}],"play-queue.next-in":[{type:0,value:"Далее в очереди"}],"play-queue.now-playing":[{type:0,value:"Сейчас играет"}],"play-queue.now-playing-by-entity":[{type:0,value:"Сейчас играет "},{type:1,value:"entity"}],"play-queue.now-playing-from-album":[{type:0,value:"Сейчас играет из альбома"}],"play-queue.now-playing-from-artist-collection":[{type:0,value:"Сейчас играет из знакомое вам"}],"play-queue.now-playing-from-artist-popular-tracks":[{type:0,value:"Сейчас играет из популярных треков исполнителя"}],"play-queue.now-playing-from-artist-wave":[{type:0,value:"Сейчас играет из знакомое вам"}],"play-queue.now-playing-from-downloads":[{type:0,value:"Сейчас играет из скаченных треков"}],"play-queue.now-playing-from-history":[{type:0,value:"Сейчас играет из истории"}],"play-queue.now-playing-from-history-search":[{type:0,value:"Сейчас играет из история поиска"}],"play-queue.now-playing-from-playlist":[{type:0,value:"Сейчас играет из плейлиста"}],"play-queue.now-playing-from-podcast":[{type:0,value:"Сейчас играет из подкаста"}],"play-queue.now-playing-from-search":[{type:0,value:"Сейчас играет из поиска"}],"play-queue.now-playing-my-wave-by-album":[{type:0,value:"Сейчас играет Моя волна по альбому"}],"play-queue.now-playing-my-wave-by-artist":[{type:0,value:"Сейчас играет Моя волна по артисту"}],"play-queue.now-playing-my-wave-by-playlist":[{type:0,value:"Сейчас играет Моя волна по плейлисту"}],"play-queue.now-playing-my-wave-by-podcast":[{type:0,value:"Сейчас играет Моя волна по подкасту"}],"play-queue.now-playing-my-wave-by-track":[{type:0,value:"Сейчас играет Моя волна по треку"}],"play-queue.play-last":[{type:0,value:"Добавить в конец очереди"}],"play-queue.play-next":[{type:0,value:"Играть следующим"}],"play-queue.playlist-will-be-played-last":[{type:0,value:"Плейлист "},{type:1,value:"title"},{type:0,value:" добавлен в конец очереди"}],"play-queue.playlist-will-be-played-next":[{type:0,value:"Плейлист "},{type:1,value:"title"},{type:0,value:" добавлен в начало очереди"}],"play-queue.podcast-episode-will-be-played-last":[{type:0,value:"Выпуск "},{type:1,value:"title"},{type:0,value:" добавлен в конец очереди"}],"play-queue.podcast-episode-will-be-played-next":[{type:0,value:"Выпуск "},{type:1,value:"title"},{type:0,value:" добавлен в начало очереди"}],"play-queue.podcast-episode-will-be-removed":[{type:0,value:"Выпуск "},{type:1,value:"title"},{type:0,value:" удалён из очереди"}],"play-queue.repeat-context":[{type:0,value:"Включен повтор очереди"}],"play-queue.repeat-one":[{type:0,value:"Включен повтор трека"}],"play-queue.shuffle":[{type:0,value:"В случайном порядке"}],"play-queue.title":[{type:0,value:"Очередь воспроизведения"}],"play-queue.track-will-be-played-last":[{type:0,value:"Трек "},{type:1,value:"title"},{type:0,value:" добавлен в конец очереди"}],"play-queue.track-will-be-played-next":[{type:0,value:"Трек "},{type:1,value:"title"},{type:0,value:" добавлен в начало очереди"}],"play-queue.track-will-be-removed":[{type:0,value:"Трек "},{type:1,value:"title"},{type:0,value:" удалён из очереди"}],"player-actions.audio-quality":[{type:0,value:"Настройки звука"}],"player-actions.audio-quality-economical":[{type:0,value:"Экономичное"}],"player-actions.audio-quality-economical-description":[{type:0,value:"Стабильное звучание при медленном интернете"}],"player-actions.audio-quality-maximum":[{type:0,value:"Превосходное"}],"player-actions.audio-quality-maximum-description":[{type:0,value:"Музыка в lossless и других высококачественных форматах для быстрого интернета и хорошей акустики"}],"player-actions.audio-quality-optimal":[{type:0,value:"Оптимальное"}],"player-actions.audio-quality-optimal-description":[{type:0,value:"Сбалансированный звук для большинства устройств"}],"player-actions.cast":[{type:0,value:"Выбор устройства"}],"player-actions.fullscreen":[{type:0,value:"На весь экран"}],"player-actions.fullscreen-button":[{type:0,value:"Плеер на весь экран"}],"player-actions.listen":[{type:0,value:"Слушать"}],"player-actions.mix":[{type:0,value:"Перемешать"}],"player-actions.next-track":[{type:0,value:"Следующая песня"}],"player-actions.pause":[{type:0,value:"Пауза"}],"player-actions.play":[{type:0,value:"Воспроизведение"}],"player-actions.previous-track":[{type:0,value:"Предыдущая песня"}],"player-actions.repeat":[{type:0,value:"Повтор"}],"player-actions.repeat-action":[{type:0,value:"Повторять"}],"player-actions.repeat-context":[{type:0,value:"Повтор списка воспроизведения"}],"player-actions.repeat-one":[{type:0,value:"Повтор трека"}],"player-actions.rewind-backwards":[{type:0,value:"Назад на 15 секунд"}],"player-actions.rewind-forward":[{type:0,value:"Вперед на 30 секунд"}],"player-actions.shuffle":[{type:0,value:"В случайном порядке"}],"player-actions.timecode-control":[{type:0,value:"Управление таймкодом"}],"player-actions.video-speed":[{type:0,value:"Скорость"}],"player-actions.video-speed-normal":[{type:0,value:"Обычная"}],"player-actions.volume-control":[{type:0,value:"Управление громкостью"}],"player-actions.volume-off":[{type:0,value:"Выключить звук"}],"player-actions.volume-on":[{type:0,value:"Включить звук"}],"playlist-actions.add-description":[{type:0,value:"Добавить описание"}],"playlist-actions.add-poster":[{type:0,value:"Добавить обложку"}],"playlist-actions.add-track-to-playlist":[{type:0,value:"Добавить в плейлист"}],"playlist-actions.change-description":[{type:0,value:"Изменить описание"}],"playlist-actions.change-description-abbr":[{type:0,value:"Ред."}],"playlist-actions.change-poster":[{type:0,value:"Изменить обложку"}],"playlist-actions.change-title":[{type:0,value:"Изменить название"}],"playlist-actions.create-playlist":[{type:0,value:"Создать плейлист"}],"playlist-actions.enter-title":[{type:0,value:"Введите название"}],"playlist-actions.privacy":[{type:0,value:"Приватный плейлист"}],"playlist-actions.privacy-label":[{type:0,value:"Изменить настройки приватности плейлиста"}],"playlist-actions.remove-from-playlist":[{type:0,value:"Удалить из плейлиста"}],"playlist-actions.remove-playlist":[{type:0,value:"Удалить плейлист"}],"playlist-errors.failed-add-track-to-playlist":[{type:0,value:"Трек не добавлен в плейлист, попробуйте снова"}],"playlist-errors.failed-add-tracks-to-playlist":[{type:0,value:"Треки не добавлены в плейлист, попробуйте снова"}],"playlist-errors.failed-download-xlsx":[{type:0,value:"Excel-файл не удалось скачать"}],"playlist-errors.failed-part-tracks-download-xlsx":[{type:0,value:"Excel-файл скачан, но часть треков не удалось загрузить"}],"playlist-errors.failed-to-change-description":[{type:0,value:"Не удалось изменить описание плейлиста"}],"playlist-errors.failed-to-change-poster":[{type:0,value:"Не удалось изменить обложку плейлиста"}],"playlist-errors.failed-to-change-privacy-settings":[{type:0,value:"Не удалось изменить настройки приватности"}],"playlist-errors.failed-to-change-title":[{type:0,value:"Не удалось изменить название плейлиста"}],"playlist-errors.failed-to-create-playlist":[{type:0,value:"Не удалось создать плейлист"}],"playlist-errors.failed-to-remove-playlist":[{type:0,value:"Не удалось удалить плейлист"}],"playlist-errors.failed-to-remove-track":[{type:0,value:"Не удалось удалить трек из плейлиста"}],"plus-page.iframe-title":[{type:0,value:"Ваш плюс"}],"plusbar.subscription-activation":[{type:0,value:"Активация мультиподписки"}],"plusbar.text":[{type:0,value:"А ещё смотрите Кинопоиск"},{type:1,value:"br"},{type:0,value:"и"},{type:1,value:"nbsp"},{type:0,value:"получайте кешбэк баллами "}],"plusbar.title":[{type:0,value:"Музыка начинается"},{type:1,value:"br"},{type:0,value:"с"},{type:1,value:"nbsp"},{type:0,value:"мультиподписки Яндекс Плюс"}],"podcast-errors.error-during-loading-podcast":[{type:0,value:"При загрузке подкаста произошла ошибка"}],"podcast.age-limit":[{type:0,value:"Возрастное ограничение"}],"podcast.episodes-list":[{type:0,value:"Список эпизодов подкаста «"},{type:1,value:"albumName"},{type:0,value:"»"}],"podcast.last-episodes-list":[{type:0,value:"Список последних выпусков"}],"podcast.publisher-title":[{type:0,value:"Издатель"}],"podcast.publishers-title":[{type:0,value:"Издатели"}],"podcast.shelf-liked-title":[{type:0,value:"Вы добавили ранее"}],"podcast.shelf-recently-played-title":[{type:0,value:"Вы недавно слушали"}],"podcast.tab-about":[{type:0,value:"О подкасте"}],"podcast.tab-tracks":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"выпуска"}]},many:{value:[{type:0,value:"выпусков"}]},one:{value:[{type:0,value:"выпуск"}]},other:{value:[{type:0,value:"выпусков"}]}},pluralType:"cardinal",type:6,value:"value"}],"rewind.button-title":[{type:0,value:"Распаковка 2025"}],"rewind.download-image":[{type:0,value:"Скачать картинку"}],"rewind.save-choice":[{type:0,value:"Сохранить выбор"}],"search-filters.top":[{type:0,value:"Топ"}],"search-filters.track":[{type:0,value:"Треки"}],"search-results.album":[{type:0,value:"Альбомы"}],"search-results.artist":[{type:0,value:"Исполнители"}],"search-results.best":[{type:0,value:"Лучшие результаты"}],"search-results.clip":[{type:0,value:"Клипы"}],"search-results.not-found-description":[{type:0,value:"Попробуйте написать по-другому"}],"search-results.not-found-title":[{type:0,value:"Ничего не нашли"}],"search-results.other-results":[{type:0,value:"Другие результаты"}],"search-results.playlist":[{type:0,value:"Плейлисты"}],"search-results.podcasts-and-books":[{type:0,value:"Подкасты и книги"}],"search.clear-history":[{type:0,value:"Очистить историю"}],"search.cleared-history":[{type:0,value:"История удалена"}],"search.corrected-text":[{type:0,value:"Возможно, вы искали "},{type:1,value:"text"}],"search.history":[{type:0,value:"История"}],"search.history-empty":[{type:0,value:"История поиска пуста"}],"search.input-placeholder":[{type:0,value:"Трек, альбом, исполнитель"}],"search.input-placeholder-q2v":[{type:0,value:"Что вы чувствуете или ищете?"}],"search.playlist-placeholder":[{type:0,value:"Найти плейлист"}],"search.q2v-suggestions-loading":[{type:0,value:"Думаю, что предложить"}],"search.recent-requests-fallback":[{type:0,value:"Здесь будут ваши недавние запросы"}],"search.search-catalog":[{type:0,value:"Поиск по каталогу"}],"search.track-placeholder":[{type:0,value:"Поиск трека"}],"settings.about-app":[{type:0,value:"О приложении"}],"settings.ai-content-reduction":[{type:0,value:"Меньше ИИ"}],"settings.ai-content-reduction-description":[{type:0,value:"В рекомендациях будет реже встречаться музыка, созданная с помощью ИИ"}],"settings.crossfade":[{type:0,value:"Плавные переходы между треками"}],"settings.failed-to-change-child-mode":[{type:0,value:"Не удалось изменить настройки приватности"}],"settings.preferences":[{type:0,value:"Уточнить предпочтения"}],"settings.preferences-description":[{type:0,value:"Если ваши музыкальные предпочтения поменялись, уточните это здесь"}],"settings.shortcuts":[{type:0,value:"Горячие клавиши"}],"settings.show-child-section":[{type:0,value:"Показывать раздел «Детям»"}],"share.iframe-copy":[{type:0,value:"Скопировать"}],"share.iframe-editor-code":[{type:0,value:"Код"}],"share.iframe-editor-height":[{type:0,value:"Высота"}],"share.iframe-editor-preview":[{type:0,value:"Предпросмотр"}],"share.iframe-editor-width":[{type:0,value:"Ширина"}],"share.iframe-listen":[{type:0,value:"Слушайте "},{type:1,value:"html"},{type:0,value:" на Яндекс Музыке"}],"share.iframe-modal-title":[{type:0,value:"Настройте размер и скопируйте код на сайт"}],"shortcuts.fullscreen-player":[{type:0,value:"Открыть / закрыть фулскрин плеер"}],"shortcuts.like":[{type:0,value:"Лайк"}],"shortcuts.mute":[{type:0,value:"Отключить/включить звук"}],"shortcuts.next-track":[{type:0,value:"Переключить на следующий трек"}],"shortcuts.or":[{type:0,value:"или"}],"shortcuts.play-pause":[{type:0,value:"Включить музыку/поставить на паузу"}],"shortcuts.previous-track":[{type:0,value:"Переключить на предыдущий трек"}],"shortcuts.rewind":[{type:0,value:"Промотать назад"}],"shortcuts.skip-forward":[{type:0,value:"Промотать вперед"}],"shortcuts.switch-repeat-mode":[{type:0,value:"Переключение режима повтора"}],"shortcuts.switch-shuffle-mode":[{type:0,value:"Переключение режима («в случайном порядке»)"}],"shortcuts.unlike":[{type:0,value:"Дизлайк"}],"shortcuts.volume-down":[{type:0,value:"Уменьшить громкость"}],"shortcuts.volume-up":[{type:0,value:"Увеличить громкость"}],"sidebar.collapse":[{type:0,value:"Свернуть сайдбар"}],"sidebar.download-app":[{type:0,value:"Скачать приложение"}],"sidebar.download-app-formatted":[{type:0,value:"Музыка на "},{children:[{type:0,value:"десктопе"}],type:8,value:"span"}],"sidebar.download-macos":[{type:0,value:"Скачать приложение для MacOS"}],"sidebar.download-macos-formatted":[{type:0,value:"Музыка на "},{children:[{type:0,value:"MacOS"}],type:8,value:"span"}],"sidebar.download-windows":[{type:0,value:"Скачать приложение для Windows"}],"sidebar.download-windows-formatted":[{type:0,value:"Музыка на "},{children:[{type:0,value:"Windows"}],type:8,value:"span"}],"sidebar.plus-badge":[{type:0,value:"Плюс"}],"sidebar.uncollapse":[{type:0,value:"Развернуть сайдбар"}],"slider.close-image-modal":[{type:0,value:"Закрыть окно просмотра изображений"}],"slider.image-counter":[{type:0,value:"Изображение "},{type:1,value:"index"},{type:0,value:" из "},{type:1,value:"count"}],"slider.image-slider-modal":[{type:0,value:"Просмотр изображений"}],"slider.images-left-count":[{type:0,value:"Еще "},{type:1,value:"imagesLeft"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"изображения"}]},many:{value:[{type:0,value:"изображений"}]},one:{value:[{type:0,value:"изображение"}]},other:{value:[{type:0,value:"изображений"}]}},pluralType:"cardinal",type:6,value:"imagesLeft"}],"slider.next-image":[{type:0,value:"Следующее изображение"}],"slider.next-slide":[{type:0,value:"Следующий слайд"}],"slider.prev-image":[{type:0,value:"Предыдущее изображение"}],"slider.prev-slide":[{type:0,value:"Предыдущий слайд"}],"slider.slide":[{type:0,value:"Слайд"}],"slider.view-artist-covers":[{type:0,value:"Просмотр изображений исполнителя"}],"slider.view-concert-covers":[{type:0,value:"Просмотр изображений концерта"}],"slider.view-cover":[{type:0,value:"Просмотр обложки"}],"snegir.auth-button-text":[{type:0,value:"Войти"}],"snegir.main-text":[{type:0,value:"Яндекс Музыка"},{type:1,value:"br"},{type:0,value:"недоступна в вашем регионе"}],"snegir.redirect-button-text":[{type:0,value:"Войти"}],"sort.select-filter":[{type:0,value:"Выберите фильтр"}],"sort.sort-by-rating":[{type:0,value:"По популярности"}],"sort.sort-by-year":[{type:0,value:"По дате выхода"}],"time.duration":[{type:0,value:"Продолжительность"}],"time.finished":[{type:0,value:"Прослушано"}],"time.hours":[{offset:0,options:{few:{value:[{style:null,type:2,value:"hours"},{type:0,value:" часа"}]},many:{value:[{style:null,type:2,value:"hours"},{type:0,value:" часов"}]},one:{value:[{style:null,type:2,value:"hours"},{type:0,value:" час"}]},other:{value:[{style:null,type:2,value:"hours"},{type:0,value:" часа"}]}},pluralType:"cardinal",type:6,value:"hours"}],"time.hours-left":[{offset:0,options:{few:{value:[{type:0,value:"Осталось "},{style:null,type:2,value:"hours"},{type:0,value:" часа"}]},many:{value:[{type:0,value:"Осталось "},{style:null,type:2,value:"hours"},{type:0,value:" часов"}]},one:{value:[{type:0,value:"Остался "},{style:null,type:2,value:"hours"},{type:0,value:" час"}]},other:{value:[{type:0,value:"Осталось "},{style:null,type:2,value:"hours"},{type:0,value:" часов"}]}},pluralType:"cardinal",type:6,value:"hours"}],"time.hours-minutes":[{options:{"0":{value:[]},other:{value:[{type:1,value:"hours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"часа"}]},many:{value:[{type:0,value:"часов"}]},one:{value:[{type:0,value:"час"}]},other:{value:[{type:0,value:"часов"}]}},pluralType:"cardinal",type:6,value:"hours"}]}},type:5,value:"hours"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"minutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"минуты"}]},many:{value:[{type:0,value:"минут"}]},one:{value:[{type:0,value:"минута"}]},other:{value:[{type:0,value:"минут"}]}},pluralType:"cardinal",type:6,value:"minutes"}]}},type:5,value:"minutes"}],"time.hours-minutes-seconds":[{options:{"0":{value:[]},other:{value:[{type:1,value:"hours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"часа,"}]},many:{value:[{type:0,value:"часов,"}]},one:{value:[{type:0,value:"час,"}]},other:{value:[{type:0,value:"часов,"}]}},pluralType:"cardinal",type:6,value:"hours"}]}},type:5,value:"hours"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"minutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"минуты,"}]},many:{value:[{type:0,value:"минут,"}]},one:{value:[{type:0,value:"минута,"}]},other:{value:[{type:0,value:"минут,"}]}},pluralType:"cardinal",type:6,value:"minutes"}]}},type:5,value:"minutes"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"seconds"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"секунды."}]},many:{value:[{type:0,value:"секунд."}]},one:{value:[{type:0,value:"секунда."}]},other:{value:[{type:0,value:"секунд"}]}},pluralType:"cardinal",type:6,value:"seconds"}]}},type:5,value:"seconds"}],"time.left":[{offset:0,options:{few:{value:[{type:0,value:"Осталось"}]},many:{value:[{type:0,value:"Осталось"}]},one:{value:[{type:0,value:"Осталась"}]},other:{value:[{type:0,value:"Осталось"}]}},pluralType:"cardinal",type:6,value:"time"}],"time.minutes-left":[{offset:0,options:{few:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" минуты"}]},many:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" минут"}]},one:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" минута"}]},other:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" минут"}]}},pluralType:"cardinal",type:6,value:"minutes"}],"time.seconds-left":[{offset:0,options:{few:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" секунды"}]},many:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" секунд"}]},one:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" секунда"}]},other:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" секунд"}]}},pluralType:"cardinal",type:6,value:"seconds"}],"track-modal.album-heading":[{options:{audiobook:{value:[{type:0,value:"Книга"}]},fairy_tale:{value:[{type:0,value:"Сказка"}]},other:{value:[{type:0,value:"Альбом"}]},podcast:{value:[{type:0,value:"Подкаст"}]},single:{value:[{type:0,value:"Сингл"}]}},type:5,value:"type"}],"track-modal.audiobook-title":[{type:0,value:"О главе"}],"track-modal.clip-title":[{type:0,value:"О клипе"}],"track-modal.concert-title":[{type:0,value:"О концерте"}],"track-modal.content-rating":[{type:0,value:"Возраст"}],"track-modal.genre":[{type:0,value:"Жанр"}],"track-modal.podcast-title":[{type:0,value:"О выпуске"}],"track-modal.read-more":[{type:0,value:"Читать полностью"}],"track-modal.similar-tracks":[{type:0,value:"Похожие треки"}],"track-modal.source":[{type:0,value:"Источник"}],"track-modal.title":[{type:0,value:"О треке"}],"track-modal.track-name":[{type:0,value:"Название"}],"track-title.audiobook-not-found":[{type:0,value:"Аудиокнига недоступна"}],"track-title.error-not-found":[{type:0,value:"Трек недоступен"}],"track-title.podcast-not-found":[{type:0,value:"Подкаст недоступен"}],"trailer.button-aria-label":[{type:0,value:"Запустить трейлер"}],"trailer.close":[{type:0,value:"Закрыть трейлер"}],"trailer.listen-full-version":[{type:0,value:"Слушать полностью"}],"trailer.navigate":[{type:0,value:"Перейти"}],"trailer.not-found-description":[{type:0,value:"Скоро починим, возвращайтесь позже"}],"trailer.not-found-title":[{type:0,value:"Трейлер сломался"}],"trailer.something-went-wrong-description":[{type:0,value:"Обновите экран или попробуйте позже"}],"ugc.cancel-upload":[{type:0,value:"Отменить загрузку"}],"ugc.close-edit-popup":[{type:0,value:"Закрыть окно редактирования трека"}],"ugc.editing-failed":[{type:0,value:"Не удалось отредактировать трек"}],"ugc.notification-success":[{type:0,value:"Загрузили все треки в плейлист «"},{type:1,value:"playlistName"},{type:0,value:"»"}],"ugc.notification-too-large-file-error":[{type:0,value:"Файл слишком большой для загрузки"}],"ugc.notification-too-many-files-error":[{type:0,value:"Превышен лимит по количеству загруженных треков"}],"ugc.notification-unknown-error":[{type:0,value:"Ошибка при загрузке треков в плейлист «"},{type:1,value:"playlistName"},{type:0,value:"»"}],"ugc.repeat-upload":[{type:0,value:"Повторить загрузку"}],"ugc.track-description":[{type:0,value:"Этот трек можете слушать только вы"}],"ugc.track-uploading-error-status":[{type:0,value:"Ошибка загрузки"}],"ugc.track-uploading-pending-status":[{type:0,value:"Загружаем трек"}],"ugc.track-uploading-processing-status":[{type:0,value:"Обрабатываем трек"}],"ugc.upload-track":[{type:0,value:"Загрузить трек"}],"vibe-actions.apply":[{type:0,value:"Применить настройку"}],"vibe-actions.aria-label-pause":[{type:0,value:"Пауза Моей волны"}],"vibe-actions.aria-label-play":[{type:0,value:"Воспроизведение Моей волны"}],"vibe-actions.aria-label-settings":[{type:0,value:"Настроить Мою волну"}],"vibe-actions.enter-title":[{type:0,value:"Введите название"}],"vibe-actions.play-vibe":[{type:0,value:"Включить Мою волну"}],"vibe-actions.remove":[{type:0,value:"Снять настроку"}],"vibe-actions.reset-settings":[{type:0,value:"Сбросить настройки Моей волны"}],"vibe-actions.vibe-by-album":[{type:0,value:"Моя волна по альбому"}],"vibe-actions.vibe-by-artist":[{type:0,value:"Моя волна по артисту"}],"vibe-actions.vibe-by-playlist":[{type:0,value:"Моя волна по плейлисту"}],"vibe-actions.vibe-by-track":[{type:0,value:"Моя волна по треку"}],"vibe-actions.vibe-context":[{options:{MIX:{value:[{type:0,value:"Сет "}]},other:{value:[]}},type:5,value:"type"},{type:1,value:"name"}],"vibe-errors.apply-vibe-setting":[{type:0,value:"При настройке Моей волны произошла ошибка"}],"vibe-errors.start-vibe":[{type:0,value:"При запуски Моей волны произошла ошибка"}],"vibe-freemium.available-in-plus":[{type:0,value:"Самая точная система рекомендаций найдёт ту самую музыку."},{type:1,value:"br"},{type:0,value:"Доступна в мультиподписке Плюс, а также Кинопоиск и кешбэк баллами"}],"vibe-wheel.activity-description":[{type:0,value:"Моя волна под занятие"}],"vibe-wheel.activity-fall-asleep":[{type:0,value:"Засыпаю"}],"vibe-wheel.activity-road-trip":[{type:0,value:"В дороге"}],"vibe-wheel.activity-wake-up":[{type:0,value:"Просыпаюсь"}],"vibe-wheel.activity-work-background":[{type:0,value:"Работаю"}],"vibe-wheel.activity-workout":[{type:0,value:"Тренируюсь"}],"vibe-wheel.mood-description":[{type:0,value:"Моя волна по настроению"}],"vibe-wheel.mood-energetic":[{type:0,value:"Энергичное"}],"vibe-wheel.mood-happy":[{type:0,value:"Радостное"}],"vibe-wheel.mood-sad":[{type:0,value:"Грустное"}],"warning-messages.can-break-accessibility":[{type:0,value:"Может нарушить доступность"}],"warning-messages.update-your-browser":[{type:0,value:"Музыка может работать некорректно — обновите браузер\n"}],"welcome-page.beta-header":[{type:0,value:"Скоро здесь "},{type:1,value:"br"},{type:0,value:"будет громко"}],"welcome-page.beta-text-short":[{type:0,value:"Возвращайтесь попозже"}],"welcome-page.not-auth-header":[{type:0,value:"Войдите в аккаунт, "},{type:1,value:"br"},{type:0,value:"чтобы открыть приложение"}],"welcome-page.not-auth-text":[{type:0,value:"Яндекс Музыка доступна по мультиподписке Плюс"}],"welcome-page.offer-header":[{type:0,value:"У вас пока нет мультиподписки Плюс"}],"welcome-page.offer-text":[{type:0,value:"Оформите мультиподписку, чтобы получить доступ к приложению."}],"windows-menu.close":[{type:0,value:"Закрыть"}],"windows-menu.roll-up":[{type:0,value:"Свернуть"}],"windows-menu.unwrap":[{type:0,value:"Развернуть"}],"wizard.button-done":[{type:0,value:"Готово"}],"wizard.button-little-more":[{type:0,value:"Осталось чуть-чуть"}],"wizard.button-one-more":[{type:0,value:"Еще один, и всё"}],"wizard.button-tune":[{type:0,value:"Настраиваем под вас"}],"wizard.buttonText":[{type:0,value:"Выбрать исполнителей"}],"wizard.description":[{type:0,value:"Хотим узнать о вас больше, чтобы советовать подходящую музыку. Выберите любимых исполнителей, и рекомендации подстроятся под вас."}],"wizard.modal-text":[{type:0,value:"Это поможет получить более точные и интересные рекомендации"}],"wizard.modal-title":[{type:0,value:"Выберите любимых исполнителей"}],"wizard.title":[{type:0,value:"Расскажите о себе"}],"words.ai-description":[{type:0,value:"AI может ошибаться, проверяйте важное"}],"words.dislike":[{type:0,value:"Мимо"}],"words.dislike-feedback":[{type:0,value:"Спасибо, что помогаете мне стать лучше"}],"words.like":[{type:0,value:"Больше такого"}],"words.like-feedback":[{type:0,value:"Спасибо за оценку"}],"words.loading-phrase-catching":[{type:0,value:"Ловлю ритм"}],"words.loading-phrase-collecting-interesting":[{type:0,value:"Собираю интересное силой ИИ"}],"words.loading-phrase-reading":[{type:0,value:"Читаю про артиста"}],"words.loading-phrase-studying":[{type:0,value:"Изучаю звучание"}],"words.loading-phrase-tuning":[{type:0,value:"Настраиваюсь"}],"words.show-more":[{type:0,value:"Показывать такое чаще?"}],"ynison.desktop-device-title":[{type:0,value:"Приложение "},{type:1,value:"platformName"},{type:0,value:" ("},{type:1,value:"hostname"},{type:0,value:")"}]};const translationsEN = {"a11y-regions.player":[{type:0,value:"Player"}],"a11y-regions.wheel":[{type:0,value:"Recommendations from My Vibe"}],"about-app.app-name":[{type:0,value:"Yandex Music"}],"about-app.explicit-content":[{type:0,value:"The Yandex Music service may contain information not suitable for minors. Yandex Music is the most accurate music recommendation system. Measured by the accuracy of personalized recommendations for users in Russia among music streaming services in April 2025. Based on data from LLC “Mile Data”, survey conducted on the Romir Unified Data Panel among respondents aged 18—59."}],"ads.about-advertiser":[{type:0,value:"About the advertiser"}],"ads.ad":[{type:0,value:"Ads"}],"ads.continue-ad":[{type:0,value:"Playback will begin right after the ad."}],"ads.disable-ads":[{type:0,value:"Turn off ads"}],"ads.learn-more":[{type:0,value:"Learn more"}],"ads.notification":[{type:0,value:"Listen ad-free with a Yandex Plus multi-subscription"}],"advert.banner":[{type:0,value:"Ads"}],"album-errors.error-during-loading-album":[{type:0,value:"Something went wrong when loading the album"}],"album-errors.error-during-loading-similar-albums":[{type:0,value:"Something went wrong when loading similar albums"}],"album.external-streamings-title":[{type:0,value:"Listen on other platforms"}],"artist-errors.error-during-loading-artist":[{type:0,value:"An error occurred while loading the artist."}],"artist-errors.error-during-loading-artist-info":[{type:0,value:"An error occurred when loading the artist info"}],"artist.about-artist":[{type:0,value:"Artist info"}],"artist.about-composer":[{type:0,value:"About composer"}],"artist.artist-in-playlists":[{type:0,value:"Playlists that feature"}],"artist.artist-links-label":[{type:0,value:"Artist "},{type:1,value:"artistName"},{type:0,value:": $"},{type:1,value:"linkName"}],"artist.official-pages":[{type:0,value:"Official pages"}],"artist.stats-less-listeners-per-month":[{type:1,value:"number"},{type:1,value:"nbsp"},{type:0,value:"fewer"},{type:1,value:"br"},{type:0,value:"than in the past 30"},{type:1,value:"nbsp"},{type:0,value:"days"}],"artist.stats-listeners-per-month":[{type:0,value:"Monthly listeners"}],"artist.stats-more-listeners-per-month":[{type:1,value:"number"},{type:1,value:"nbsp"},{type:0,value:"more"},{type:1,value:"br"},{type:0,value:"than in the past 30"},{type:1,value:"nbsp"},{type:0,value:"days"}],"artist.stats-same-listeners-per-month":[{type:0,value:"Same"},{type:1,value:"br"},{type:0,value:"as in the past 30 days"}],"authorization-messages.need-to-authorizate":[{type:0,value:"You need to log in first"}],"authorization.enter-and-listen-button":[{type:0,value:"Log in for unlimited listening"}],"authorization.enter-button":[{type:0,value:"Log in"}],"authorization.enter-subtitle":[{type:0,value:"To listen to music and podcasts without restrictions"}],"authorization.enter-text":[{type:0,value:"Log in to get access to a single music collection on all devices."}],"authorization.enter-title":[{type:0,value:"Log in to your account"}],"authorization.enter-tooltip":[{type:0,value:"Log in to your account"}],"authorization.start-button":[{type:0,value:"Start"}],"bar-below.section-name":[{type:0,value:"Banner"}],"branded-player.branding-integration":[{type:0,value:"Ad integration"}],"branded-player.car":[{type:0,value:"Car"}],"branded-player.default":[{type:0,value:"Standard"}],"branded-player.duck":[{type:0,value:"Duckie"}],"branded-player.hide":[{type:0,value:"Hide"}],"branded-player.player-type":[{type:0,value:"Player style"}],"branded-player.to-website":[{type:0,value:"Go to website"}],"buy-subscription.activate":[{type:0,value:"Activate"}],"buy-subscription.already-in-plus":[{type:0,value:"I'm already a Yandex Plus member"}],"buy-subscription.get-more-discoveries":[{type:0,value:"Discover more on"},{type:1,value:"nbsp"},{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Music with"},{type:1,value:"nbsp"},{type:0,value:"a"},{type:1,value:"nbsp"},{type:0,value:"Plus multi-subscription!"}],"buy-subscription.listen-without-restrictions":[{type:0,value:"Listen to Yandex Music without restrictions"}],"buy-subscription.music-and-films-and-other":[{type:0,value:"Music, movies, and much more"}],"buy-subscription.new-vibe-description":[{type:0,value:"Listen to ad-free music with"},{type:1,value:"nbsp"},{type:0,value:"the"},{type:1,value:"nbsp"},{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Plus"},{type:1,value:"nbsp"},{type:0,value:"multi-subscription. In addition, get access to"},{type:1,value:"nbsp"},{type:0,value:"Kinopoisk, Yandex"},{type:1,value:"nbsp"},{type:0,value:"Books, and"},{type:1,value:"nbsp"},{type:0,value:"bonus points"}],"buy-subscription.offer-for-you":[{type:0,value:"For you: "},{type:1,value:"offerText"}],"buy-subscription.plus-benefit-non-music":[{type:0,value:"Music, podcasts, and"},{type:1,value:"nbsp"},{type:0,value:"audiobooks"}],"buy-subscription.plus-benefit-offline":[{type:0,value:"Listen even without"},{type:1,value:"nbsp"},{type:0,value:"internet"}],"buy-subscription.plus-benefit-other-services":[{type:0,value:"Plus Kinopoisk and"},{type:1,value:"nbsp"},{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Books"}],"buy-subscription.plus-benefit-recommendations":[{type:0,value:"Spot-on recommendations"}],"calendar.april-short":[{type:0,value:"Apr"}],"calendar.august-short":[{type:0,value:"Aug"}],"calendar.december-short":[{type:0,value:"Dec"}],"calendar.february-short":[{type:0,value:"Feb"}],"calendar.january-short":[{type:0,value:"Jan"}],"calendar.july-short":[{type:0,value:"Jul"}],"calendar.june-short":[{type:0,value:"Jun"}],"calendar.march-short":[{type:0,value:"Mar"}],"calendar.may-short":[{type:0,value:"May"}],"calendar.november-short":[{type:0,value:"Nov"}],"calendar.october-short":[{type:0,value:"Oct"}],"calendar.september-short":[{type:0,value:"Sep"}],"collection.collection-color":[{type:0,value:"Your music has a "},{children:[{type:0,value:"color"}],type:8,value:"color"}],"collection.collection-color-description":[{type:0,value:"Added color to the music that inspires you"}],"collection.collection-color-title":[{type:0,value:"Changing with you"}],"collection.created-playlists-list":[{type:0,value:"List of my playlists"}],"collection.empty-liked-tracks-text":[{type:0,value:"Like tracks to add them to this playlist. Find music you like with My Vibe"}],"collection.empty-liked-tracks-title":[{type:0,value:"Your favorite tracks will appear here"}],"collection.liked-albums-list":[{type:0,value:"Favorite albums list"}],"collection.liked-artists-list":[{type:0,value:"Favorite artists list"}],"collection.liked-non-music-list":[{type:0,value:"List of favorite podcasts and books"}],"collection.liked-playlists-list":[{type:0,value:"Favorite playlists list"}],"collection.my-dislikes":[{type:0,value:"My dislikes"}],"collection.new-playlist":[{type:0,value:"New playlist"}],"collection.your-created-playlists":[{type:0,value:"Playlists you created"}],"collection.your-liked-playlists":[{type:0,value:"Playlists you liked"}],"concerts.about-event-kind":[{options:{concert:{value:[{type:0,value:"About concert"}]},festival:{value:[{type:0,value:"About festival"}]},musical:{value:[{type:0,value:"About musical"}]},other:{value:[{type:0,value:"About "},{type:1,value:"kind"}]},tribute:{value:[{type:0,value:"About tribute"}]},unspecified:{value:[{type:0,value:"About concert"}]}},type:5,value:"kind"}],"concerts.all-concerts":[{type:0,value:"Concerts for you"}],"concerts.cities-list":[{type:0,value:"List of cities"}],"concerts.concerts-nearby":[{type:0,value:"Concerts nearby"}],"concerts.details-title":[{type:0,value:"Concerts"}],"concerts.event-kind":[{options:{concert:{value:[{type:0,value:"Concert"}]},festival:{value:[{type:0,value:"Festival"}]},musical:{value:[{type:0,value:"Musical"}]},other:{value:[{type:1,value:"kind"}]},tribute:{value:[{type:0,value:"Tribute"}]},unspecified:{value:[{type:0,value:"Concert"}]}},type:5,value:"kind"}],"concerts.feed-error":[{type:0,value:"An error occurred when loading concerts"}],"concerts.find-city":[{type:0,value:"Find city"}],"concerts.nearby":[{type:0,value:"Nearby"}],"concerts.nothing-found":[{type:0,value:"Couldn't find anything"}],"concerts.onboarding":[{type:0,value:"A"},{type:1,value:"nbsp"},{type:0,value:"new section with"},{type:1,value:"nbsp"},{type:0,value:"concerts by"},{type:1,value:"nbsp"},{type:0,value:"your favorite artists"},{type:1,value:"nbsp"},{type:0,value:"— bravo!"}],"concerts.top-for-you":[{type:0,value:"Top for you"}],"concerts.try-different-query":[{type:0,value:"Try changing your query"}],"crackdown.description":[{type:0,value:"Activate a Yandex"},{type:1,value:"nbsp"},{type:0,value:"Plus multi-subscription"},{type:1,value:"br"},{type:0,value:"to listen to your favorite tracks ad-free"}],"crackdown.title":[{type:0,value:"Unlimited"},{type:1,value:"br"},{type:0,value:"music"}],"deeplinks.download-from-app-gallery":[{type:0,value:"Download in AppGallery"}],"deeplinks.download-from-app-store":[{type:0,value:"Download in AppStore"}],"deeplinks.download-from-google-play":[{type:0,value:"Download on Google Play"}],"deeplinks.listen-in-app":[{type:0,value:"Listen in app"}],"desktop.about":[{type:0,value:"About the app"}],"desktop.app-revision":[{type:0,value:"Code "},{type:1,value:"revision"}],"desktop.app-version":[{type:0,value:"App version: "},{type:1,value:"version"}],"desktop.app-version-short":[{type:0,value:"Version "},{type:1,value:"version"}],"desktop.check-for-updates":[{type:0,value:"Check updates"}],"desktop.close-yandex-music":[{type:0,value:"Close Yandex Music"}],"desktop.copy":[{type:0,value:"Copy"}],"desktop.cut":[{type:0,value:"Cut"}],"desktop.default-release-note":[{children:[{type:0,value:"Log in to the app and find your favorite genres without a single bug. This is no coincidence. This is an update"}],type:8,value:"p"},{type:0,value:"\n"},{children:[{type:0,value:"Plus spot-on recommendations from the Yandex Music team"}],type:8,value:"p"}],"desktop.edit":[{type:0,value:"Edit"}],"desktop.hide-yandex-music":[{type:0,value:"Hide Yandex Music"}],"desktop.minimize":[{type:0,value:"Hide"}],"desktop.on-update-available":[{type:1,value:"version"},{type:0,value:" version available"}],"desktop.paste":[{type:0,value:"Paste"}],"desktop.quit":[{type:0,value:"Close app"}],"desktop.quit-yandex-music":[{type:0,value:"Quit Yandex Music"}],"desktop.recommendations":[{type:0,value:"Recommendation rules"}],"desktop.redo":[{type:0,value:"Try again"}],"desktop.release-notes-modal-title":[{type:0,value:"What's new?"}],"desktop.select-all":[{type:0,value:"Choose all"}],"desktop.support":[{type:0,value:"Support chat"}],"desktop.terms":[{type:0,value:"User agreement"}],"desktop.undo":[{type:0,value:"Cancel"}],"desktop.update":[{type:0,value:"Update"}],"desktop.window":[{type:0,value:"Window"}],"donation.button-text":[{type:0,value:"Support the Artist"}],"donation.support-artist":[{offset:0,options:{one:{value:[{type:0,value:"Support the artist"}]},other:{value:[{type:0,value:"Support the artists"}]}},pluralType:"cardinal",type:6,value:"count"}],"donation.support-button":[{type:0,value:"Support"}],"donation.support-text":[{type:0,value:"Support with a donation"}],"donation.transfer-any-amount":[{type:0,value:"You can donate any amount"}],"download-mobile-app.listen-in-app":[{type:0,value:"Listen in app"}],"download-mobile-app.listen-in-app-without-restrictions":[{type:0,value:"Listen in app without restrictions"}],"download-mobile-app.stay":[{type:0,value:"Stay on the website"}],"download-mobile-app.subtitle":[{type:0,value:"In"},{type:1,value:"nbsp"},{type:0,value:"the"},{type:1,value:"nbsp"},{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Music"},{type:1,value:"nbsp"},{type:0,value:"mobile"},{type:1,value:"nbsp"},{type:0,value:"app"}],"download-mobile-app.title":[{type:0,value:"Music"},{type:1,value:"nbsp"},{type:0,value:"even offline"}],"download-mobile-app.use-service-in-app-without-restrictions":[{type:0,value:"Use Yandex Music in mobile app without restrictions"}],"drag-and-drop.failed-to-move":[{type:0,value:"Couldn't move track"}],"drag-and-drop.playlist-move-instructions":[{type:0,value:"To move a track in the playlist, press Enter"}],"drag-and-drop.playlist-on-move":[{type:0,value:"The track "},{type:1,value:"trackName"},{type:0,value:" was moved to the position number "},{type:1,value:"index"},{type:0,value:". To confirm, press Enter. To cancel, press Esc."}],"drag-and-drop.playlist-on-move-cancel":[{type:0,value:"Track moving was canceled."}],"drag-and-drop.playlist-on-move-end":[{type:0,value:"The track "},{type:1,value:"trackName"},{type:0,value:" was permanently moved."}],"drag-and-drop.playlist-on-move-end-with-index":[{type:0,value:"The track "},{type:1,value:"trackName"},{type:0,value:" was permanently moved to the position number "},{type:1,value:"index"},{type:0,value:"."}],"drag-and-drop.playlist-on-move-fail":[{type:0,value:"The track "},{type:1,value:"index"},{type:0,value:" is beyond the moving area."}],"drag-and-drop.playlist-on-move-start":[{type:0,value:"You chose the track "},{type:1,value:"trackName"},{type:0,value:" in the position number "},{type:1,value:"index"},{type:0,value:" for moving."}],"entity-names.album":[{type:0,value:"Album"}],"entity-names.album-available-with-plus":[{type:0,value:"This album is available with the Plus option"}],"entity-names.album-name":[{type:0,value:"Album "},{type:1,value:"albumName"}],"entity-names.albums":[{type:0,value:"Albums"}],"entity-names.albums-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"albums"}]},many:{value:[{type:0,value:"albums"}]},one:{value:[{type:0,value:"album"}]},other:{value:[{type:0,value:"albums"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.albums-tracks-list":[{type:1,value:"albumName"},{type:0,value:" track list"}],"entity-names.and-more-artists":[{type:1,value:"artists"},{type:0,value:" and others"}],"entity-names.artist":[{type:0,value:"Artist"}],"entity-names.artist-albums-list":[{type:0,value:"Artist's albums list"}],"entity-names.artist-clips-list":[{type:0,value:"List of music videos by the artist"}],"entity-names.artist-compilations-list":[{type:0,value:"Artist's collections list"}],"entity-names.artist-name":[{type:0,value:"Artist "},{type:1,value:"artistName"}],"entity-names.artist-playlist":[{type:0,value:"Playlists"}],"entity-names.artist-popular-tracks":[{type:0,value:"Popular tracks by the artist"}],"entity-names.artist-studio-albums-list":[{type:0,value:"Artist's studio albums list"}],"entity-names.artist-tracks-list":[{type:0,value:"Artist's track list"}],"entity-names.artists":[{type:0,value:"Artists"}],"entity-names.artists-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"artists"}]},many:{value:[{type:0,value:"artists"}]},one:{value:[{type:0,value:"artist"}]},other:{value:[{type:0,value:"artists"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.audio":[{type:0,value:"Audio"}],"entity-names.audiobook":[{type:0,value:"Audiobook"}],"entity-names.audiobook-name":[{type:0,value:"Audiobook "},{type:1,value:"bookName"}],"entity-names.authors":[{type:0,value:"Written by: "},{type:1,value:"authors"}],"entity-names.book":[{type:0,value:"Book"}],"entity-names.cashback-percent":[{type:0,value:"Get "},{type:1,value:"value"},{type:0,value:"% back"}],"entity-names.chart-down":[{type:0,value:"Went down in the chart"}],"entity-names.chart-new":[{type:0,value:"New in the chart"}],"entity-names.chart-podcasts-list":[{type:0,value:"Chart podcast list"}],"entity-names.chart-same":[{type:0,value:"Chart position didn't change"}],"entity-names.chart-tracks-list":[{type:0,value:"Chart track list"}],"entity-names.chart-up":[{type:0,value:"Went up in the chart"}],"entity-names.clip":[{type:0,value:"Video"}],"entity-names.clip-name":[{type:0,value:"Video "},{type:1,value:"clipName"}],"entity-names.clips":[{type:0,value:"Videos"}],"entity-names.clips-will-like":[{type:0,value:"You might like"}],"entity-names.collection":[{type:0,value:"My Collection"}],"entity-names.composer":[{type:0,value:"Music"}],"entity-names.concert":[{type:0,value:"Live"}],"entity-names.concerts":[{type:0,value:"Concerts"}],"entity-names.created-playlists-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"playlists you created"}]},many:{value:[{type:0,value:"playlists you created"}]},one:{value:[{type:0,value:"playlist you created"}]},other:{value:[{type:0,value:"playlists you created"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.disk-number":[{type:0,value:"Disc "},{type:1,value:"number"}],"entity-names.editor-feature-is-show":[{type:0,value:"Already displayed"}],"entity-names.fairy-tale":[{type:0,value:"Audio fairy tale"}],"entity-names.fairytale":[{type:0,value:"Fairy tale"}],"entity-names.favourite-albums":[{type:0,value:"Favorite albums"}],"entity-names.favourite-playlists":[{type:0,value:"Favorite playlists"}],"entity-names.generative":[{type:0,value:"Neuromusic"}],"entity-names.has-your-like":[{type:0,value:"You liked"}],"entity-names.label":[{type:0,value:"Label"}],"entity-names.label-albums-list":[{type:0,value:"Label releases"}],"entity-names.label-artists-list":[{type:0,value:"Artists of the label"}],"entity-names.liked-artist":[{type:0,value:"Your likes"}],"entity-names.liked-playlist":[{type:0,value:"My Favorites"}],"entity-names.liked-playlists-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"playlists you liked"}]},many:{value:[{type:0,value:"playlists you liked"}]},one:{value:[{type:0,value:"playlist you liked"}]},other:{value:[{type:0,value:"playlists you liked"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.likes-count-description":[{type:0,value:"Liked, likes: "},{type:1,value:"count"}],"entity-names.likes-counter":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"like"}]},other:{value:[{type:0,value:"likes"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.likes-counter-empty":[{type:0,value:"No likes yet"}],"entity-names.list-is-empty":[{type:0,value:"The list is empty"}],"entity-names.listeners-per-month":[{style:null,type:2,value:"counter"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"listener"}]},other:{value:[{type:0,value:"listeners"}]}},pluralType:"cardinal",type:6,value:"counter"},{type:0,value:" a month"}],"entity-names.map-url":[{type:0,value:"Link to Yandex Maps"}],"entity-names.metro-stations":[{type:0,value:"Metro stations"}],"entity-names.mixes":[{type:0,value:"Selections"}],"entity-names.music-history":[{type:0,value:"Listening history"}],"entity-names.my-playlists":[{type:0,value:"My playlists"}],"entity-names.my-vibe":[{type:0,value:"My Vibe"}],"entity-names.new-albums":[{type:0,value:"New albums"}],"entity-names.new-albums-in-genre":[{type:0,value:"New albums in this genre"}],"entity-names.new-playlist":[{type:0,value:"New playlist"}],"entity-names.non-music-releases":[{type:0,value:"Episodes"}],"entity-names.number-of-books":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"books"}]},many:{value:[{type:0,value:"books"}]},one:{value:[{type:0,value:"book"}]},other:{value:[{type:0,value:"books"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-chapters":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"chapters"}]},many:{value:[{type:0,value:"chapters"}]},one:{value:[{type:0,value:"chapter"}]},other:{value:[{type:0,value:"chapters"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-episodes":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"episodes"}]},many:{value:[{type:0,value:"episodes"}]},one:{value:[{type:0,value:"episode"}]},other:{value:[{type:0,value:"episodes"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-more-artists":[{type:0,value:"and "},{type:1,value:"counter"},{type:0,value:" more "},{offset:0,options:{one:{value:[{type:0,value:"artist"}]},other:{value:[{type:0,value:"artists"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-podcasts":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"podcasts"}]},many:{value:[{type:0,value:"podcasts"}]},one:{value:[{type:0,value:"podcast"}]},other:{value:[{type:0,value:"podcasts"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-tracks":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"track"}]},other:{value:[{type:0,value:"tracks"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.other-album-versions":[{type:0,value:"More album versions"}],"entity-names.other-albums-of-artist":[{type:0,value:"More albums by this artist"}],"entity-names.percent":[{type:1,value:"value"},{type:0,value:"%"}],"entity-names.playlist":[{type:0,value:"Playlist"}],"entity-names.playlist-name":[{type:0,value:"Playlist "},{type:1,value:"playlistName"}],"entity-names.playlist-tracks-list":[{type:1,value:"playlistName"},{type:0,value:" track list"}],"entity-names.podcast":[{type:0,value:"Podcast"}],"entity-names.podcast-last-episodes":[{type:0,value:"Latest episodes"}],"entity-names.podcast-name":[{type:0,value:"Podcast "},{type:1,value:"podcastName"}],"entity-names.podcasts-and-books":[{type:0,value:"Books & Podcasts"}],"entity-names.popular-among-users":[{type:0,value:"Popular"}],"entity-names.popular-artists":[{type:0,value:"Popular artists"}],"entity-names.popular-playlists":[{type:0,value:"Popular Playlists"}],"entity-names.publisher":[{type:0,value:"Publisher"}],"entity-names.query-to-vibe-loading-description":[{type:0,value:"Lumen is tuning in to your mood"}],"entity-names.query-to-vibe-loading-title":[{type:0,value:"I feel this way..."}],"entity-names.recently-release":[{type:0,value:"Recent release"}],"entity-names.releases":[{type:0,value:"Releases"}],"entity-names.search":[{type:0,value:"Search"}],"entity-names.season-number":[{type:0,value:"Season "},{type:1,value:"number"}],"entity-names.similar-artists":[{type:0,value:"Similar artists"}],"entity-names.similar-playlists":[{type:0,value:"Similar playlists"}],"entity-names.singer":[{type:0,value:"Artist"}],"entity-names.single":[{type:0,value:"Single"}],"entity-names.single-available-with-plus":[{type:0,value:"This single is available with the Plus option"}],"entity-names.source":[{type:0,value:"Source: "},{type:1,value:"source"}],"entity-names.tags":[{type:0,value:"Tags: "},{type:1,value:"tags"}],"entity-names.text":[{type:0,value:"Text"}],"entity-names.top-artists":[{type:0,value:"Your Top This Month"}],"entity-names.track":[{type:0,value:"Track"}],"entity-names.track-in-playlist":[{type:0,value:"Already in this playlist"}],"entity-names.track-name":[{type:0,value:"Track "},{type:1,value:"trackName"}],"entity-names.track-name-by-type":[{options:{audiobook:{value:[{type:0,value:"Chapter "},{type:1,value:"name"}]},comment:{value:[{type:0,value:"Episode "},{type:1,value:"name"}]},fairy_tale:{value:[{type:0,value:"Chapter "},{type:1,value:"name"}]},music:{value:[{type:0,value:"Track "},{type:1,value:"name"}]},other:{value:[{type:0,value:"Track "},{type:1,value:"name"}]},podcast_episode:{value:[{type:0,value:"Episode "},{type:1,value:"name"}]}},type:5,value:"type"}],"entity-names.track-type":[{options:{audiobook:{value:[{type:0,value:"Chapter"}]},comment:{value:[{type:0,value:"Episode"}]},fairy_tale:{value:[{type:0,value:"Chapter"}]},music:{value:[{type:0,value:"Track"}]},other:{value:[{type:0,value:"Track"}]},podcast_episode:{value:[{type:0,value:"Episode"}]}},type:5,value:"type"}],"entity-names.tracks":[{type:0,value:"Tracks"}],"entity-names.tracks-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"tracks"}]},many:{value:[{type:0,value:"tracks"}]},one:{value:[{type:0,value:"track"}]},other:{value:[{type:0,value:"tracks"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.trailer":[{type:0,value:"Trailer"}],"entity-names.upcoming-album-date":[{type:1,value:"releaseDate"},{type:0,value:" Release date"}],"entity-names.upcoming-album-name":[{type:0,value:"Upcoming release "},{type:1,value:"upcomingAlbumName"}],"entity-names.upcoming-album-play-disabled":[{type:0,value:"Wait for the upcoming release to play it"}],"entity-names.upcoming-albums":[{type:0,value:"Upcoming releases"}],"entity-names.upcoming-albums-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"upcoming releases"}]},many:{value:[{type:0,value:"upcoming releases"}]},one:{value:[{type:0,value:"upcoming release"}]},other:{value:[{type:0,value:"upcoming releases"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.vibe-name":[{type:0,value:"My Vibe "},{type:1,value:"vibeName"}],"entity-names.vibe-room-name":[{type:0,value:"My Vibe "},{type:1,value:"name"},{type:0,value:". Status "},{type:1,value:"status"}],"equalizer.amp-label":[{type:1,value:"value"},{type:0,value:"dB"}],"equalizer.bass-and-treble-boost-preset":[{type:0,value:"Enhanced bass and treble"}],"equalizer.bass-boost-preset":[{type:0,value:"Enhanced bass"}],"equalizer.classical-preset":[{type:0,value:"Classical Music"}],"equalizer.club-preset":[{type:0,value:"Club music"}],"equalizer.concert-preset":[{type:0,value:"Live"}],"equalizer.custom-preset":[{type:0,value:"Custom settings"}],"equalizer.dance-preset":[{type:0,value:"Dance music"}],"equalizer.default-preset":[{type:0,value:"Default"}],"equalizer.disable-equalizer":[{type:0,value:"Disable equalizer"}],"equalizer.disabled":[{type:0,value:"Off"}],"equalizer.enable":[{type:0,value:"Turn on"}],"equalizer.enable-equalizer":[{type:0,value:"Enable equalizer"}],"equalizer.enabled":[{type:0,value:"On"}],"equalizer.frequency-label":[{type:1,value:"value"},{type:0,value:"k"}],"equalizer.large-hall-preset":[{type:0,value:"Large Hall"}],"equalizer.party-preset":[{type:0,value:"Partying"}],"equalizer.pop-preset":[{type:0,value:"Pop"}],"equalizer.preamp-level":[{type:0,value:"level"}],"equalizer.reggae-preset":[{type:0,value:"Reggae"}],"equalizer.rock-preset":[{type:0,value:"Rock"}],"equalizer.ska-preset":[{type:0,value:"Ska"}],"equalizer.slider-frequency-label":[{type:0,value:"Adjust decibels at the frequency "},{type:1,value:"label"},{type:0,value:" "},{type:1,value:"value"},{type:0,value:" decibels"}],"equalizer.slider-preamp-label":[{type:0,value:"Preamp coefficient"}],"equalizer.soft-preset":[{type:0,value:"Soft"}],"equalizer.soft-rock-preset":[{type:0,value:"Soft rock"}],"equalizer.speakers-preset":[{type:0,value:"Laptop speakers"}],"equalizer.techno-preset":[{type:0,value:"Techno"}],"equalizer.title":[{type:0,value:"Equalizer"}],"equalizer.treble-boost-preset":[{type:0,value:"Enhanced treble"}],"error-messages.empty-artist-familiar-collection-title":[{type:0,value:"You don't have tracks by this artist in your Favorites yet"}],"error-messages.empty-artist-familiar-vibe-title":[{type:0,value:"You haven't listened to the artist's tracks in My Vibe yet"}],"error-messages.empty-collection-albums":[{type:0,value:"Like albums, and they'll appear here"}],"error-messages.empty-collection-albums-description":[{type:0,value:"Like singles and albums, and they'll appear here"}],"error-messages.empty-collection-albums-title":[{type:0,value:"You have no albums in My Collection"}],"error-messages.empty-collection-artists-title":[{type:0,value:"Like artists, and they'll appear here"}],"error-messages.empty-collection-clips-text":[{type:0,value:"Meanwhile, you can view our recommendations"}],"error-messages.empty-collection-clips-title":[{type:0,value:"Like music videos, and they'll appear here"}],"error-messages.empty-collection-kids-sub-page-link":[{type:0,value:"Go to the children's section"}],"error-messages.empty-collection-kids-sub-page-title":[{type:0,value:"Start liking songs and episodes, and they'll appear here"}],"error-messages.empty-collection-liked-playlists":[{type:0,value:"Like playlists to see them here"}],"error-messages.empty-collection-playlist-description":[{type:0,value:"You can find the tracks via the search"}],"error-messages.empty-collection-playlist-title":[{type:0,value:"Add tracks to playlist"}],"error-messages.empty-collection-podcasts":[{type:0,value:"Like podcasts, and they'll appear here"}],"error-messages.empty-collection-podcasts-and-books":[{type:0,value:"You have no podcasts and books in Collection"}],"error-messages.empty-collection-upcoming-albums-title":[{type:0,value:"Like the upcoming releases on the artists' pages, and they'll appear here"}],"error-messages.empty-collection-vibe-rooms-title":[{type:0,value:"Share the link to listen to My Vibe for two that combines your preferences. This won't affect your personal recommendations"}],"error-messages.empty-shelf-liked-page-link":[{type:0,value:"Go to podcasts"}],"error-messages.empty-shelf-liked-page-title":[{type:0,value:"Start listening to and liking podcasts, and they'll appear here"}],"error-messages.empty-shelf-new-episodes-text":[{type:0,value:"Meanwhile, we've added a new episode of the podcast you were listening to"}],"error-messages.empty-shelf-new-episodes-title":[{type:0,value:"Start liking podcasts, and new episodes will appear here"}],"error-messages.empty-shelf-new-episodes-title-no-tracks":[{type:0,value:"Start listening to and liking podcasts, and they'll appear here"}],"error-messages.empty-shelf-page-title":[{type:0,value:"Start listening to podcasts, and they'll appear here"}],"error-messages.error-during-action":[{type:0,value:"Something went wrong when performing the action"}],"error-messages.error-during-initial-loading":[{type:0,value:"Couldn't fetch some data when launching"}],"error-messages.error-load-part-page":[{type:0,value:"Couldn't load part of the page"}],"error-messages.error-load-wizard":[{type:0,value:"An error occurred. Please choose artists later."}],"error-messages.multivibe-create-link":[{type:0,value:"Couldn't create the link. Please try again"}],"error-messages.something-went-wrong":[{type:0,value:"Something went wrong"}],"extra-explicit.confirm-unsafe-album":[{type:0,value:"To album"}],"extra-explicit.confirm-unsafe-artist":[{type:0,value:"To artist"}],"extra-explicit.confirm-unsafe-audiobook":[{type:0,value:"To audiobook"}],"extra-explicit.confirm-unsafe-clip":[{type:0,value:"To the video"}],"extra-explicit.confirm-unsafe-podcast":[{type:0,value:"To podcast"}],"extra-explicit.confirm-unsafe-track":[{type:0,value:"To track"}],"extra-explicit.explicit-mark":[{type:0,value:"Explicit content"}],"extra-explicit.play-unavailable":[{type:0,value:"Playing unavailable"}],"extra-explicit.reject-unsafe-entity":[{type:0,value:"Skip"}],"family.about":[{type:0,value:"Learn more about the multi-subscription"}],"family.about1":[{type:0,value:"Learn more about the multi-subscription"}],"family.accept":[{type:0,value:"Accept"}],"family.go-to-music":[{type:0,value:"To music"}],"family.info-description":[{type:0,value:"Listen to music and enjoy other"},{type:1,value:"br"},{type:0,value:"Plus benefits with your family members"},{type:1,value:"br"},{type:0,value:"using the family multi-subscription"}],"family.info-title":[{type:0,value:"You're invited"},{type:1,value:"br"},{type:0,value:"to Yandex Plus"}],"family.invitation-error-description":[{type:0,value:"The invitation might have been canceled or there are no more free slots in the multi-subscription of the user who invited you"}],"family.invitation-error-title":[{type:0,value:"The invite is invalid"}],"family.later":[{type:0,value:"Later"}],"family.reject":[{type:0,value:"Decline"}],"family.retry":[{type:0,value:"Try again"}],"family.subscription-error-description":[{type:0,value:"Try contacting the person who invited you or activate your own Plus to listen to music right now"}],"family.subscription-error-title":[{type:0,value:"Multi-subscription unavailable"}],"family.success-description":[{type:0,value:"You can enjoy Yandex Music, Kinopoisk,"},{type:1,value:"br"},{type:0,value:"and bonus points in Yandex services"}],"family.success-title":[{type:0,value:"Welcome to Yandex Plus!"}],"family.terms":[{type:0,value:"Multi-subscription terms and conditions"}],"family.unknown-error-description":[{type:0,value:"We don't know what is wrong. Please check your internet connection and try again"}],"family.unknown-error-title":[{type:0,value:"Unable to accept invitation"}],"faq.title":[{type:0,value:"FAQ"}],"footer.disclaimer-content":[{type:0,value:"Yandex Music is the most accurate music recommendation system. By accuracy of personal recommendations for users in&nbsp;Russia among music streaming services in&nbsp;April 2025. Based on&nbsp;data from Mail Data LLC obtained through a&nbsp;Romir Scan Panel survey of respondents aged&nbsp;18-59."},{type:0,value:"<br/>"},{type:0,value:"<br/>"},{type:0,value:"Yandex&nbsp;Music may contain information not suitable for&nbsp;minors. This content is marked with (!). Illegal consumption of narcotics, psychotropic substances, and&nbsp;similar drugs is harmful to health. Their illegal trafficking is prohibited and&nbsp;incurs liability under the&nbsp;law"}],"footer.explicit-content":[{type:0,value:"Yandex Music may contain information not&nbsp;intended for&nbsp;minors. Yandex Music is the most accurate music recommendation system. Measured by the accuracy of personalized recommendations for users in Russia among music streaming services in April 2025. Based on data from LLC “Mile Data”, survey conducted on the Romir Unified Data Panel among respondents aged 18—59."}],"footer.links-copyright-holders":[{type:0,value:"Copyright holders"}],"footer.links-help":[{type:0,value:"Help"}],"footer.links-privacy-policy":[{type:0,value:"Privacy policy"}],"footer.links-recommendation-rules":[{type:0,value:"Recommendation rules"}],"footer.links-terms":[{type:0,value:"User agreement"}],"footer.yandex-music":[{type:0,value:"Yandex Music"}],"footer.yandex-project":[{type:0,value:"A Yandex project"}],"future-feature.message":[{type:0,value:"This feature is currently being developed and will be available soon."}],"interface-actions.add-track-to-playlist":[{type:0,value:"Add the track to playlist"}],"interface-actions.add-tracks-to-playlist":[{type:0,value:"Add to another playlist"}],"interface-actions.cancel":[{type:0,value:"Cancel"}],"interface-actions.change":[{type:0,value:"Change"}],"interface-actions.clear":[{type:0,value:"Clear"}],"interface-actions.close":[{type:0,value:"Close"}],"interface-actions.close-ad":[{type:0,value:"Close ad"}],"interface-actions.close-my-vibe-settings":[{type:0,value:"Close settings menu"}],"interface-actions.close-quality-settings":[{type:0,value:"Close the volume setting menu"}],"interface-actions.configure-my-vibe":[{type:0,value:"Customize"}],"interface-actions.confirm":[{type:0,value:"Got it"}],"interface-actions.context-menu":[{type:0,value:"Context menu"}],"interface-actions.context-menu-artists":[{type:0,value:"Context menu with artists"}],"interface-actions.copy-iframe":[{type:0,value:"HTML code"}],"interface-actions.copy-link":[{type:0,value:"Copy link"}],"interface-actions.create":[{type:0,value:"Create"}],"interface-actions.date-today":[{type:0,value:"Today"}],"interface-actions.date-yesterday":[{type:0,value:"Yesterday"}],"interface-actions.delete-multivibe":[{type:0,value:"Quit My Vibe for two"}],"interface-actions.do-not-like":[{type:0,value:"I don't like it"}],"interface-actions.edit":[{type:0,value:"Edit"}],"interface-actions.editorial-tools":[{type:0,value:"Editing tools"}],"interface-actions.further":[{type:0,value:"Next"}],"interface-actions.go-to-collection":[{type:0,value:"Go to Сollection"}],"interface-actions.hide-sync-lyrics":[{type:0,value:"Hide Music and lyrics"}],"interface-actions.like":[{type:0,value:"Like"}],"interface-actions.mark-all-listened":[{type:0,value:"Mark all as played"}],"interface-actions.mark-all-non-listened":[{type:0,value:"Mark all as unplayed"}],"interface-actions.mark-listened":[{type:0,value:"Mark as played"}],"interface-actions.mark-non-listened":[{type:0,value:"Mark as unplayed"}],"interface-actions.more":[{type:0,value:"More"}],"interface-actions.more-details":[{type:0,value:"Learn more"}],"interface-actions.my-vibe-context-settings":[{type:0,value:"By activity"}],"interface-actions.my-vibe-settings":[{type:0,value:"Customize My Vibe"}],"interface-actions.navigate-to-admin":[{type:0,value:"Go to the admin dashboard"}],"interface-actions.navigate-to-album":[{type:0,value:"View album"}],"interface-actions.navigate-to-artist":[{type:0,value:"Go to artist"}],"interface-actions.navigate-to-artists":[{type:0,value:"Go to artists"}],"interface-actions.navigate-to-track":[{type:0,value:"Go to track"}],"interface-actions.open-lyrics":[{type:0,value:"Show lyrics"}],"interface-actions.open-play-queue":[{type:0,value:"Open queue"}],"interface-actions.open-sync-lyrics":[{type:0,value:"Turn on Music and lyrics"}],"interface-actions.pin":[{type:0,value:"Pin"}],"interface-actions.pin-my-vibe":[{type:0,value:"Pin My Vibe"}],"interface-actions.playlist-made-date":[{type:0,value:"Compiled on "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"}],"interface-actions.playlist-made-date-with-year":[{type:0,value:"Compiled on "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"}],"interface-actions.playlist-made-for-date":[{type:0,value:"Compiled for "},{type:1,value:"playlistReceiver"},{type:0,value:" "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"}],"interface-actions.playlist-made-for-date-with-year":[{type:0,value:"Compiled for "},{type:1,value:"playlistReceiver"},{type:0,value:" "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"}],"interface-actions.playlist-made-for-today":[{type:0,value:"Compiled for "},{type:1,value:"playlistReceiver"},{type:0,value:" today"}],"interface-actions.playlist-made-for-yesterday":[{type:0,value:"Compiled for "},{type:1,value:"playlistReceiver"},{type:0,value:" yesterday"}],"interface-actions.playlist-made-today":[{type:0,value:"Compiled today"}],"interface-actions.playlist-made-yesterday":[{type:0,value:"Compiled yesterday"}],"interface-actions.quality":[{type:0,value:"Quality"}],"interface-actions.reload-part-page":[{type:0,value:"Refresh part of the page"}],"interface-actions.rename":[{type:0,value:"Rename"}],"interface-actions.report-problem":[{type:0,value:"Report a problem"}],"interface-actions.reset-context":[{type:0,value:"Reset "},{type:1,value:"context"},{type:0,value:" and play My Vibe"}],"interface-actions.reset-my-vibe-settings":[{type:0,value:"Reset"}],"interface-actions.reset-search-input":[{type:0,value:"Clear search"}],"interface-actions.save":[{type:0,value:"Save"}],"interface-actions.share":[{type:0,value:"Share"}],"interface-actions.show-duplicates":[{type:0,value:"Show duplicates"}],"interface-actions.show-genres":[{type:0,value:"Show genres"}],"interface-actions.show-majors":[{type:0,value:"Show majors"}],"interface-actions.speed":[{type:0,value:"Playback speed "},{type:1,value:"speed"}],"interface-actions.subscribe":[{type:0,value:"Subscribe to podcast"}],"interface-actions.subscribed":[{type:0,value:"You are already following this user"}],"interface-actions.unpin":[{type:0,value:"Unpin"}],"interface-actions.unpin-my-vibe":[{type:0,value:"Unpin My Vibe"}],"interface-actions.updated-anonymously-playlist-date":[{type:0,value:"Playlist updated on "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"}],"interface-actions.updated-anonymously-playlist-date-with-year":[{type:0,value:"Playlist updated on "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"}],"interface-actions.updated-anonymously-playlist-today":[{type:0,value:"Playlist updated today"}],"interface-actions.updated-anonymously-playlist-yesterday":[{type:0,value:"Playlist updated yesterday"}],"interface-actions.updated-playlist-date":[{type:1,value:"ownerName"},{type:0,value:" "},{options:{female:{value:[{type:0,value:"updated"}]},male:{value:[{type:0,value:"updated"}]},other:{value:[{type:0,value:"updated"}]}},type:5,value:"gender"},{type:0,value:" the playlist on "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"}],"interface-actions.updated-playlist-date-with-year":[{type:1,value:"ownerName"},{type:0,value:" "},{options:{female:{value:[{type:0,value:"updated"}]},male:{value:[{type:0,value:"updated"}]},other:{value:[{type:0,value:"updated"}]}},type:5,value:"gender"},{type:0,value:" the playlist on "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"}],"interface-actions.updated-playlist-today":[{type:1,value:"ownerName"},{type:0,value:" "},{options:{female:{value:[{type:0,value:"updated"}]},male:{value:[{type:0,value:"updated"}]},other:{value:[{type:0,value:"updated"}]}},type:5,value:"gender"},{type:0,value:" the playlist today"}],"interface-actions.updated-playlist-yesterday":[{type:1,value:"ownerName"},{type:0,value:" "},{options:{female:{value:[{type:0,value:"updated"}]},male:{value:[{type:0,value:"updated"}]},other:{value:[{type:0,value:"updated"}]}},type:5,value:"gender"},{type:0,value:" the playlist yesterday"}],"interface-actions.xlsx-download":[{type:0,value:"Download the Excel file"}],"kids.albums-and-podcasts":[{type:0,value:"Albums, podcasts, and fairy tales"}],"kids.empty-collection-text":[{type:0,value:"Like children's songs and fairy tales, and they'll appear here"}],"kids.favourite-tracks-and-episodes":[{type:0,value:"Favorite songs and episodes"}],"kids.for-kids":[{type:0,value:"For Kids"}],"lite-version.description":[{type:0,value:"Visual effects and animations will load in a lighter format"}],"lite-version.go-to-settings":[{type:0,value:"Go to settings"}],"lite-version.notification-title":[{type:0,value:"The lite version is on"}],"lite-version.title":[{type:0,value:"Turn on the lite version"}],"loading-messages.concert-is-loading":[{type:0,value:"Loading concert"}],"loading-messages.content-is-loading":[{type:0,value:"Loading..."}],"loading-messages.entity-is-loading":[{type:1,value:"entityName"},{type:0,value:" loading"}],"mixes.albums-list":[{type:0,value:"The list of albums in the \""},{type:1,value:"genreName"},{type:0,value:"\" selection"}],"mixes.playlists-list":[{type:0,value:"The list of playlists in the \""},{type:1,value:"genreName"},{type:0,value:"\" selection"}],"multivibe.enabled-room-modal-button-text":[{type:0,value:"Listen"}],"multivibe.enabled-room-modal-description":[{type:0,value:"Listen to My Vibe with combines recommendations"}],"multivibe.enabled-room-modal-title":[{type:0,value:"My Vibe for two has already been created"}],"multivibe.go-to-collection-button-text":[{type:0,value:"To My Collection"}],"multivibe.invite-modal-draft-description":[{type:0,value:"When your invitation is accepted, My Vibe for two will appear in your Collection"}],"multivibe.invite-modal-draft-title":[{type:0,value:"The invitation hasn't been accepted yet"}],"multivibe.invite-modal-invalid-button-text":[{type:0,value:"Create"}],"multivibe.invite-modal-invalid-description":[{type:0,value:"Ask the user to send a new invitation or create My Vibe for two"}],"multivibe.invite-modal-invalid-title":[{type:0,value:"This invitation is no longer valid"}],"multivibe.invite-modal-valid-button-text":[{type:0,value:"Join"}],"multivibe.invite-modal-valid-description":[{type:0,value:"Listen to My Vibe that combines your preferences. This won't&nbsp;affect your personal recommendations"}],"multivibe.invite-modal-valid-title":[{type:1,value:"name"},{type:0,value:" invites you to My Vibe for two"}],"multivibe.link-successfully-copied":[{type:0,value:"The link to My Vibe for two has been copied"}],"multivibe.modal-subtitle":[{type:0,value:"Your real connection"}],"multivibe.nda":[{type:0,value:"NDA"}],"multivibe.only-member-modal-description":[{type:0,value:"Share the link again to listen to My Vibe for two"}],"multivibe.only-member-modal-title":[{type:0,value:"You're the only participant of this My Vibe for two"}],"multivibe.promo-modal-co-brand-a11y":[{type:0,value:"Available with support from Beeline"}],"multivibe.promo-modal-description":[{type:0,value:"Share the link to listen to My Vibe that combines your preferences. This won't affect your personal recommendations"}],"multivibe.promo-modal-title":[{type:0,value:"My Vibe for two"}],"multivibe.room-limit-exceeded-description":[{type:0,value:"You've already created 50 My Vibes for two. To create a new My Vibe for two, quit one of the current ones"}],"multivibe.room-limit-exceeded-title":[{type:0,value:"Many second halves!"}],"multivibe.room-status-disabled":[{type:0,value:"inactive"}],"multivibe.room-status-enabled":[{type:0,value:"active"}],"multivibe.room-unavailable":[{type:0,value:"Not available anymore"}],"music-history.album":[{type:0,value:"Album"}],"music-history.artist":[{type:0,value:"Artist"}],"music-history.empty-title":[{type:0,value:"Find here everything you've recently listened to"}],"music-history.my-vibe":[{type:0,value:"My Vibe"}],"music-history.playlist":[{type:0,value:"Playlist"}],"music-history.search":[{type:0,value:"Search results"}],"music-history.shuffle":[{type:0,value:"Shuffled"}],"music-history.title":[{type:0,value:"History"}],"navigation.best-recommendations":[{type:0,value:"Spot-on AI recommendations"}],"navigation.go-back":[{type:0,value:"Back"}],"navigation.go-forward":[{type:0,value:"Forward"}],"navigation.go-home":[{type:0,value:"Go to Yandex Music"}],"navigation.main-menu":[{type:0,value:"Main menu"}],"navigation.page-collection":[{type:0,value:"My Collection"}],"navigation.page-for-you-and-trends":[{type:0,value:"For you and Trends"}],"navigation.page-main":[{type:0,value:"Home"}],"navigation.page-my-vibe":[{type:0,value:"My Vibe"}],"navigation.page-plus":[{type:0,value:"Your Plus"}],"navigation.pins-list":[{type:0,value:"Pinned"}],"navigation.search":[{type:0,value:"Search"}],"non-music.audiobook-artist":[{type:0,value:"Narrator"}],"non-music.audiobook-artists":[{type:0,value:"Narrators"}],"non-music.audiobook-list":[{type:0,value:"\""},{type:1,value:"albumName"},{type:0,value:"\" audiobook chapters"}],"non-music.audiobook-tab-about":[{type:0,value:"Book details"}],"non-music.audiobook-tab-tracks":[{type:0,value:"Chapters"}],"non-music.book-available-with-plus":[{type:0,value:"This book is available with the Plus option"}],"non-music.continue-listen-landing-block-title":[{type:0,value:"Keep listening"}],"non-music.fairy-tale-available-with-plus":[{type:0,value:"This fairy tale is available with the Plus option"}],"non-music.fairytale-tab-about":[{type:0,value:"About the fairy tale"}],"non-music.navigate-to-book-album":[{type:0,value:"Go to book"}],"non-music.navigate-to-clip":[{type:0,value:"Go to the video"}],"non-music.navigate-to-podcast-album":[{type:0,value:"Go to podcast"}],"non-music.non-music-progress":[{type:0,value:"Listening progress "},{type:1,value:"progress"},{type:0,value:"%, "},{options:{"0":{value:[]},other:{value:[{type:1,value:"beginHours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"hours"}]},many:{value:[{type:0,value:"hours"}]},one:{value:[{type:0,value:"hour"}]},other:{value:[{type:0,value:"hours"}]}},pluralType:"cardinal",type:6,value:"beginHours"}]}},type:5,value:"beginHours"},{type:0,value:"\n"},{options:{"0":{value:[]},other:{value:[{type:1,value:"beginMinutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"minutes"}]},many:{value:[{type:0,value:"minutes"}]},one:{value:[{type:0,value:"minute"}]},other:{value:[{type:0,value:"minutes"}]}},pluralType:"cardinal",type:6,value:"beginMinutes"}]}},type:5,value:"beginMinutes"},{type:0,value:"\n"},{options:{"0":{value:[]},other:{value:[{type:1,value:"beginSeconds"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"seconds"}]},many:{value:[{type:0,value:"seconds"}]},one:{value:[{type:0,value:"second"}]},other:{value:[{type:0,value:"seconds"}]}},pluralType:"cardinal",type:6,value:"beginSeconds"}]}},type:5,value:"beginSeconds"},{type:0,value:" out of "},{options:{"0":{value:[]},other:{value:[{type:1,value:"endHours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"hours"}]},many:{value:[{type:0,value:"hours"}]},one:{value:[{type:0,value:"hour"}]},other:{value:[{type:0,value:"hours"}]}},pluralType:"cardinal",type:6,value:"endHours"}]}},type:5,value:"endHours"},{type:0,value:"\n"},{options:{"0":{value:[]},other:{value:[{type:1,value:"endMinutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"minutes"}]},many:{value:[{type:0,value:"minutes"}]},one:{value:[{type:0,value:"minute"}]},other:{value:[{type:0,value:"minutes"}]}},pluralType:"cardinal",type:6,value:"endMinutes"}]}},type:5,value:"endMinutes"},{type:0,value:"\n"},{options:{"0":{value:[]},other:{value:[{type:1,value:"endSeconds"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"seconds"}]},many:{value:[{type:0,value:"seconds"}]},one:{value:[{type:0,value:"second"}]},other:{value:[{type:0,value:"seconds"}]}},pluralType:"cardinal",type:6,value:"endSeconds"}]}},type:5,value:"endSeconds"},{type:0,value:"."}],"non-music.podcast-available-with-plus":[{type:0,value:"This podcast is available with the Plus option"}],"non-music.shelf-subscribe":[{type:0,value:"Save"}],"non-music.shelf-unsubscribe":[{type:0,value:"Remove from My Shelf"}],"notifications-info.added-audiobook-episode-to-playlist":[{type:0,value:"Chapter "},{type:1,value:"trackName"},{type:0,value:" was added to playlist "},{type:1,value:"playlistName"}],"notifications-info.added-podcast-episode-to-playlist":[{type:0,value:"Episode "},{type:1,value:"trackName"},{type:0,value:" was added to "},{type:1,value:"playlistName"}],"notifications-info.added-to":[{type:0,value:"added to"}],"notifications-info.added-track-to-playlist":[{type:0,value:"Track "},{type:1,value:"trackName"},{type:0,value:" was added to "},{type:1,value:"playlistName"}],"notifications-info.added-tracks-to-playlist":[{type:0,value:"Tracks have been added to \""},{type:1,value:"playlistName"},{type:0,value:"\""}],"notifications-info.album-added-to-collection":[{type:0,value:"Album "},{type:1,value:"entity"},{type:0,value:" was added to your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.album-added-to-collection-aria-label":[{type:0,value:"Album "},{type:1,value:"entity"},{type:0,value:" was added to your Collection"}],"notifications-info.album-link":[{type:0,value:"Link to the album"}],"notifications-info.album-pinned-in-menu":[{type:0,value:"Album "},{type:1,value:"entity"},{type:0,value:" was pinned to the side menu"}],"notifications-info.album-removed-from-collection":[{type:0,value:"Album "},{type:1,value:"entity"},{type:0,value:" was removed from your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.album-removed-from-collection-aria-label":[{type:0,value:"Album "},{type:1,value:"entity"},{type:0,value:" was removed from your Collection"}],"notifications-info.album-unpinned-from-menu":[{type:0,value:"Album "},{type:1,value:"entity"},{type:0,value:" was removed from the side menu"}],"notifications-info.already-added-tracks":[{type:0,value:"All the tracks have already been added to this playlist"}],"notifications-info.artist-added-to-collection":[{type:0,value:"Artist "},{type:1,value:"entity"},{type:0,value:" was added to your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.artist-added-to-collection-aria-label":[{type:0,value:"Artist "},{type:1,value:"entity"},{type:0,value:" was added to your Collection"}],"notifications-info.artist-available-in-recommendations":[{type:0,value:"This artist will now appear in your recommendations"}],"notifications-info.artist-link":[{type:0,value:"Link to the artist"}],"notifications-info.artist-pinned-in-menu":[{type:0,value:"Artist "},{type:1,value:"entity"},{type:0,value:" was pinned to the side menu"}],"notifications-info.artist-removed-from-collection":[{type:0,value:"Artist "},{type:1,value:"entity"},{type:0,value:" was removed from your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.artist-removed-from-collection-aria-label":[{type:0,value:"Artist "},{type:1,value:"entity"},{type:0,value:" was removed from your Collection"}],"notifications-info.artist-unavailable-in-recommendations":[{type:0,value:"This artist will no longer appear in your recommendations"}],"notifications-info.artist-unpinned-from-menu":[{type:0,value:"Artist "},{type:1,value:"entity"},{type:0,value:" was removed from the side menu"}],"notifications-info.audiobook-added-to-collection":[{type:0,value:"Audiobook "},{type:1,value:"entity"},{type:0,value:" was added to your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.audiobook-added-to-collection-aria-label":[{type:0,value:"Audiobook "},{type:1,value:"entity"},{type:0,value:" was added to your Collection"}],"notifications-info.audiobook-episode-added-to-shelf":[{type:0,value:"Chapter "},{type:1,value:"entity"},{type:0,value:" was added to your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.audiobook-episode-added-to-shelf-aria-label":[{type:0,value:"Chapter "},{type:1,value:"entity"},{type:0,value:" was added to your Collection"}],"notifications-info.audiobook-episode-available-in-recommendations":[{type:0,value:"The chapter will now appear in your recommendations"}],"notifications-info.audiobook-episode-removed-from-shelf":[{type:0,value:"Chapter "},{type:1,value:"entity"},{type:0,value:" was removed from your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.audiobook-episode-removed-from-shelf-aria-label":[{type:0,value:"Chapter "},{type:1,value:"entity"},{type:0,value:" was removed from your Collection"}],"notifications-info.audiobook-episode-unavailable-in-recommendations":[{type:0,value:"The chapter will no longer appear in your recommendations"}],"notifications-info.audiobook-pinned-in-menu":[{type:0,value:"Audiobook "},{type:1,value:"entity"},{type:0,value:" was pinned to the side menu"}],"notifications-info.audiobook-removed-from-collection":[{type:0,value:"Audiobook "},{type:1,value:"entity"},{type:0,value:" was removed from your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.audiobook-removed-from-collection-aria-label":[{type:0,value:"Audiobook "},{type:1,value:"entity"},{type:0,value:" was removed from your Collection"}],"notifications-info.audiobook-unpinned-from-menu":[{type:0,value:"Audiobook "},{type:1,value:"entity"},{type:0,value:" was removed from the side menu"}],"notifications-info.change-repeat-context":[{type:0,value:"Repeat playlist on"}],"notifications-info.change-repeat-none":[{type:0,value:"Repeat off"}],"notifications-info.change-repeat-track":[{type:0,value:"Repeat track on"}],"notifications-info.clip-added-to-collection":[{type:0,value:"Video "},{type:1,value:"entity"},{type:0,value:" was added to your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.clip-added-to-collection-aria-label":[{type:0,value:"Video "},{type:1,value:"entity"},{type:0,value:" was added to your Collection"}],"notifications-info.clip-link":[{type:0,value:"Link to the video"}],"notifications-info.clip-removed-from-collection":[{type:0,value:"Video "},{type:1,value:"entity"},{type:0,value:" was removed from your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.clip-removed-from-collection-aria-label":[{type:0,value:"Video "},{type:1,value:"entity"},{type:0,value:" was removed from your Collection"}],"notifications-info.concert-link":[{type:0,value:"Link to concert"}],"notifications-info.copied":[{type:0,value:"copied"}],"notifications-info.entity-pinned-in-menu":[{type:1,value:"description"},{type:0,value:" "},{type:1,value:"entity"},{type:0,value:" is now in the side menu"}],"notifications-info.entity-unpinned-from-menu":[{type:0,value:"\n"},{type:1,value:"description"},{type:0,value:" "},{type:1,value:"entity"},{type:0,value:" is no longer in the side menu"}],"notifications-info.fairytale-added-to-collection":[{type:0,value:"Fairy tale "},{type:1,value:"entity"},{type:0,value:" was added to your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.fairytale-added-to-collection-aria-label":[{type:0,value:"Fairy tale "},{type:1,value:"entity"},{type:0,value:" was added to your Collection"}],"notifications-info.fairytale-pinned-in-menu":[{type:0,value:"Fairy tale "},{type:1,value:"entity"},{type:0,value:" was pinned to the side menu"}],"notifications-info.fairytale-removed-from-collection":[{type:0,value:"Fairy tale "},{type:1,value:"entity"},{type:0,value:" was removed from your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.fairytale-removed-from-collection-aria-label":[{type:0,value:"Fairy tale "},{type:1,value:"entity"},{type:0,value:" was removed from your Collection"}],"notifications-info.fairytale-unpinned-from-menu":[{type:0,value:"Fairy tale "},{type:1,value:"entity"},{type:0,value:" was removed from the side menu"}],"notifications-info.from-collection":[{type:0,value:"Collections"}],"notifications-info.html-code-copied":[{type:0,value:"HTML code copied"}],"notifications-info.label-link":[{type:0,value:"Link to the label"}],"notifications-info.my-vibe-pinned-in-menu":[{type:0,value:"My vibe "},{type:1,value:"entity"},{type:0,value:" was pinned to the side menu"}],"notifications-info.my-vibe-unpinned-from-menu":[{type:0,value:"My vibe "},{type:1,value:"entity"},{type:0,value:" was removed from the side menu"}],"notifications-info.playlist-added-to-collection":[{type:0,value:"Playlist "},{type:1,value:"entity"},{type:0,value:" was added to your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.playlist-added-to-collection-aria-label":[{type:0,value:"Playlist "},{type:1,value:"entity"},{type:0,value:" was added to your Collection"}],"notifications-info.playlist-link":[{type:0,value:"Link to the playlist"}],"notifications-info.playlist-pinned-in-menu":[{type:0,value:"Playlist "},{type:1,value:"entity"},{type:0,value:" was pinned to the side menu"}],"notifications-info.playlist-removed-from-collection":[{type:0,value:"Playlist "},{type:1,value:"entity"},{type:0,value:" was removed from your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.playlist-removed-from-collection-aria-label":[{type:0,value:"Playlist "},{type:1,value:"entity"},{type:0,value:" was removed from your Collection"}],"notifications-info.playlist-unpinned-from-menu":[{type:0,value:"Playlist "},{type:1,value:"entity"},{type:0,value:" was removed from the side menu"}],"notifications-info.podcast-added-to-collection":[{type:0,value:"Podcast "},{type:1,value:"entity"},{type:0,value:" was added to your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.podcast-added-to-collection-aria-label":[{type:0,value:"Podcast "},{type:1,value:"entity"},{type:0,value:" was added to your Collection"}],"notifications-info.podcast-episode-added-to-collection":[{type:0,value:"Episode "},{type:1,value:"entity"},{type:0,value:" was added to your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.podcast-episode-added-to-collection-aria-label":[{type:0,value:"Episode "},{type:1,value:"entity"},{type:0,value:" was added to your Collection"}],"notifications-info.podcast-episode-available-in-recommendations":[{type:0,value:"This episode will now appear in your recommendations"}],"notifications-info.podcast-episode-removed-from-collection":[{type:0,value:"Episode "},{type:1,value:"entity"},{type:0,value:" was removed from your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.podcast-episode-removed-from-collection-aria-label":[{type:0,value:"Episode "},{type:1,value:"entity"},{type:0,value:" was removed from your Collection"}],"notifications-info.podcast-episode-unavailable-in-recommendations":[{type:0,value:"This episode will no longer appear in your recommendations"}],"notifications-info.podcast-pinned-in-menu":[{type:0,value:"Podcast "},{type:1,value:"entity"},{type:0,value:" was pinned to the side menu"}],"notifications-info.podcast-remove-from-collection-aria-label":[{type:0,value:"Podcast "},{type:1,value:"entity"},{type:0,value:" was removed from your Collection"}],"notifications-info.podcast-removed-from-collection":[{type:0,value:"Podcast "},{type:1,value:"entity"},{type:0,value:" was removed from your "},{children:[{type:0,value:"Collection"}],type:8,value:"collection"}],"notifications-info.podcast-unpinned-from-menu":[{type:0,value:"Podcast "},{type:1,value:"entity"},{type:0,value:" was removed from the side menu"}],"notifications-info.quality-changed":[{type:1,value:"quality"},{type:0,value:" sound quality on"}],"notifications-info.removed-audiobook-episode-from-playlist":[{type:0,value:"Chapter "},{type:1,value:"trackName"},{type:0,value:" removed from the "},{type:1,value:"playlistName"},{type:0,value:" playlist"}],"notifications-info.removed-from":[{type:0,value:"is removed from"}],"notifications-info.removed-podcast-episode-from-playlist":[{type:0,value:"Episode "},{type:1,value:"trackName"},{type:0,value:" removed from the "},{type:1,value:"playlistName"},{type:0,value:" playlist"}],"notifications-info.removed-track-from-playlist":[{type:0,value:"Track "},{type:1,value:"trackName"},{type:0,value:" removed from the "},{type:1,value:"playlistName"},{type:0,value:" playlist"}],"notifications-info.shuffle-disabled":[{type:0,value:"Auto-play"}],"notifications-info.shuffle-enabled":[{type:0,value:"Shuffle play"}],"notifications-info.to-collection":[{type:0,value:"to My Collection"}],"notifications-info.track-added-to-collection":[{type:0,value:"Track "},{type:1,value:"entity"},{type:0,value:" was added to "},{children:[{type:0,value:"'My Favorites'"}],type:8,value:"collection"}],"notifications-info.track-added-to-collection-aria-label":[{type:0,value:"Track "},{type:1,value:"entity"},{type:0,value:" was added to My Favorites"}],"notifications-info.track-available-in-recommendations":[{type:0,value:"Now the track will be able to appear in your recommendations"}],"notifications-info.track-link":[{type:0,value:"Link to the track"}],"notifications-info.track-removed-from-collection":[{type:0,value:"Track "},{type:1,value:"entity"},{type:0,value:" was removed from "},{children:[{type:0,value:"'My Favorites'"}],type:8,value:"collection"}],"notifications-info.track-removed-to-collection-aria-label":[{type:0,value:"Track "},{type:1,value:"entity"},{type:0,value:" was removed from My Favorites"}],"notifications-info.track-unavailable-in-recommendations":[{type:0,value:"Track will no longer appear in your recommendations"}],"notifications-info.xlsx-loading":[{type:0,value:"Creating the Excel file"}],"notifications-info.xlsx-success":[{type:0,value:"The Excel file was successfully downloaded"}],"offline.clear-memory":[{type:0,value:"Clear сache"}],"offline.clear-memory-description":[{type:0,value:"We'll only delete downloaded content and cache. This won't affect your recommendations or likes"}],"offline.delete-from-device":[{type:0,value:"Delete from device"}],"offline.disable-offline-mode":[{type:0,value:"Disable offline mode"}],"offline.download":[{type:0,value:"Download"}],"offline.download-for-offline":[{type:0,value:"Download tracks to listen to them offline"}],"offline.download-progress":[{type:0,value:"Download progress"}],"offline.downloaded-empty":[{type:0,value:"You don't have any downloads"}],"offline.downloaded-track-list":[{type:0,value:"List of downloaded tracks"}],"offline.downloaded-tracks":[{type:0,value:"Downloaded tracks"}],"offline.downloading-progress":[{type:1,value:"value"},{type:0,value:"%"}],"offline.listen-downloaded-content":[{type:0,value:"You can only listen to downloaded content right now"}],"offline.memory-cleared":[{type:0,value:"Device memory cleared"}],"offline.no-internet-connection":[{type:0,value:"No internet connection"}],"offline.offline-mode":[{type:0,value:"Offline mode"}],"offline.offline-mode-description":[{type:0,value:"Download and listen without the internet"}],"offline.offline-mode-enabled":[{type:0,value:"Offline mode is enabled"}],"offline.stop-downloading":[{type:0,value:"Stop download"}],"offline.track-download-error":[{type:0,value:"An error occurred while downloading the track"}],"offline.track-downloaded":[{type:0,value:"Track downloaded"}],"onboarding.artist-donation-button-1":[{type:0,value:"Support your favorite artist"},{type:1,value:"br"},{type:0,value:"with a donation"}],"onboarding.authorize-to-add-to-collection":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account to add to Collection"}],"onboarding.authorize-to-add-track-to-queue":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account to add the"},{type:1,value:"nbsp"},{type:0,value:"track to queue"}],"onboarding.authorize-to-change-quality":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account to adjust the sound quality"}],"onboarding.authorize-to-dislike":[{type:0,value:"Log in to your account to dislike"}],"onboarding.authorize-to-like":[{type:0,value:"Log in to your account to like"}],"onboarding.authorize-to-listen-full":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account to listen to the full track"}],"onboarding.authorize-to-listen-vibe":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe"}],"onboarding.authorize-to-listen-vibe-by-activity":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by"},{type:1,value:"nbsp"},{type:0,value:"activity"}],"onboarding.authorize-to-listen-vibe-by-album":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by"},{type:1,value:"nbsp"},{type:0,value:"album"}],"onboarding.authorize-to-listen-vibe-by-artist":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by"},{type:1,value:"nbsp"},{type:0,value:"artist"}],"onboarding.authorize-to-listen-vibe-by-genre":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by"},{type:1,value:"nbsp"},{type:0,value:"genre"}],"onboarding.authorize-to-listen-vibe-by-mood":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by"},{type:1,value:"nbsp"},{type:0,value:"mood"}],"onboarding.authorize-to-listen-vibe-by-playlist":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by"},{type:1,value:"nbsp"},{type:0,value:"playlist"}],"onboarding.authorize-to-listen-vibe-by-track":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by"},{type:1,value:"nbsp"},{type:0,value:"track"}],"onboarding.authorize-to-open-queue":[{type:0,value:"Log in to your account to open the queue"}],"onboarding.authorize-to-pin":[{type:0,value:"Log in to your account to pin in the"},{type:1,value:"nbsp"},{type:0,value:"sidebar or menu"}],"onboarding.authorize-to-view-sync-lyrics":[{type:0,value:"Log"},{type:1,value:"nbsp"},{type:0,value:"in to your account to view Music and lyrics"}],"onboarding.rewind-trailer":[{type:0,value:"Play the trailer"},{type:1,value:"br"},{type:0,value:"of the year"}],"onboarding.trailer":[{type:0,value:"Search for music"},{type:1,value:"br"},{type:0,value:"by the best bits"}],"onboarding.try-plus-to-enable-high-quality":[{type:0,value:"Activate the multi-subscription to enable high quality"}],"onboarding.try-plus-to-listen-full":[{type:0,value:"Activate the multi-subscription to listen to the full track"}],"onboarding.try-plus-to-listen-vibe":[{type:0,value:"Activate the"},{type:1,value:"nbsp"},{type:0,value:"multi-subscription"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe"}],"onboarding.try-plus-to-listen-vibe-by-activity":[{type:0,value:"Activate the"},{type:1,value:"nbsp"},{type:0,value:"multi-subscription"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by activity"}],"onboarding.try-plus-to-listen-vibe-by-album":[{type:0,value:"Activate the"},{type:1,value:"nbsp"},{type:0,value:"multi-subscription"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by album"}],"onboarding.try-plus-to-listen-vibe-by-artist":[{type:0,value:"Activate the"},{type:1,value:"nbsp"},{type:0,value:"multi-subscription"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by artist"}],"onboarding.try-plus-to-listen-vibe-by-genre":[{type:0,value:"Activate the"},{type:1,value:"nbsp"},{type:0,value:"multi-subscription"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by genre"}],"onboarding.try-plus-to-listen-vibe-by-mood":[{type:0,value:"Activate the"},{type:1,value:"nbsp"},{type:0,value:"multi-subscription"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by mood"}],"onboarding.try-plus-to-listen-vibe-by-playlist":[{type:0,value:"Activate the"},{type:1,value:"nbsp"},{type:0,value:"multi-subscription"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by playlist"}],"onboarding.try-plus-to-listen-vibe-by-track":[{type:0,value:"Activate the"},{type:1,value:"nbsp"},{type:0,value:"multi-subscription"},{type:1,value:"br"},{type:0,value:"to listen to My"},{type:1,value:"nbsp"},{type:0,value:"Vibe by track"}],"onboarding.try-plus-to-open-collection":[{type:0,value:"Activate the"},{type:1,value:"nbsp"},{type:0,value:"multi-subscription to get access to your Collection"}],"onboarding.try-plus-to-view-sync-lyrics":[{type:0,value:"Activate the subscription"},{type:1,value:"br"},{type:0,value:"to view Music and lyrics"}],"page-error.concert-page-does-not-exist":[{type:0,value:"Couldn't find this concert"}],"page-error.concert-page-does-not-exist-description":[{type:0,value:"It may have already finished or an error may have occurred"}],"page-error.page-does-not-exist":[{type:0,value:"Page not found"}],"page-error.page-does-not-exist-description":[{type:0,value:"Try searching this section"}],"page-error.reload":[{type:0,value:"Refresh"}],"page-error.reload-page-button":[{type:0,value:"Refresh the page"}],"page-error.restart-app-button":[{type:0,value:"Restart"}],"page-error.try-to-reload-page":[{type:0,value:"Try refreshing the page"}],"page-error.try-to-restart-app":[{type:0,value:"Try restarting the app"}],"page.album-label-title":[{options:{"1":{value:[{type:0,value:"Label"}]},other:{value:[{type:0,value:"Labels"}]}},type:5,value:"count"},{type:0,value:":"}],"page.album-publisher-title":[{options:{"1":{value:[{type:0,value:"Publisher"}]},other:{value:[{type:0,value:"Publishers"}]}},type:5,value:"count"},{type:0,value:":"}],"page.artist-albums-header":[{type:0,value:"Albums by "},{type:1,value:"artistName"}],"page.artist-all-concerts-header":[{type:0,value:"All concerts by "},{type:1,value:"artistName"}],"page.artist-clips-header":[{type:0,value:"Music videos by "},{type:1,value:"artistName"}],"page.artist-compilations-header":[{type:1,value:"artistName"},{type:0,value:" Compilations"}],"page.artist-concerts-header":[{type:1,value:"artistName"},{type:0,value:" Concerts"}],"page.artist-discography-header":[{type:0,value:"Studio albums by "},{type:1,value:"artistName"}],"page.artist-pick-aria-label":[{type:0,value:"New Scene "},{type:1,value:"artistName"}],"page.artist-pick-subtitle":[{type:0,value:"New Scene"}],"page.artist-similar-header":[{type:0,value:"Artists similar to "},{type:1,value:"artistName"}],"page.artist-tracks-header":[{type:0,value:"Popular tracks by "},{type:1,value:"artistName"}],"page.delayed-non-music":[{type:0,value:"Saved podcasts and books"}],"page.familiar-collection":[{type:0,value:"In your Favorites"}],"page.familiar-vibe":[{type:0,value:"Listened to in My Vibe"}],"page.familiar-you":[{type:0,value:"Something Familiar"}],"page.label-albums-header":[{type:0,value:"Releases by "},{type:1,value:"labelName"}],"page.label-artists-header":[{type:1,value:"labelName"},{type:0,value:" artists"}],"page.label-podcast-header":[{type:1,value:"labelName"},{type:0,value:" episodes"}],"page.podcasts-and-books":[{type:0,value:"Podcasts and books"}],"page.results-of-the-year":[{type:0,value:"Year in review"}],"page.settings":[{type:0,value:"Settings"}],"page.shelf":[{type:0,value:"My Shelf"}],"page.similar-entities-block-title":[{type:0,value:"More like this"}],"page.summer_2026_title":[{type:0,value:"Unpack your summer"}],"page.vibe-rooms":[{type:0,value:"My Vibe for two"}],"payment.album-offer-button-title":[{type:0,value:"Listen to the album"}],"payment.books-offer-button-title":[{type:0,value:"Listen to the audiobook"}],"payment.buy":[{type:0,value:"Buy"}],"payment.fairy-tale-offer-button-title":[{type:0,value:"Listen to the fairy tale"}],"payment.high-quality-offer-button-title":[{type:0,value:"Listen in high quality"}],"payment.learn-personal-bonus":[{type:0,value:"Check out your personal bonus"}],"payment.min-price":[{type:0,value:"from "},{type:1,value:"value"}],"payment.offer-button":[{type:0,value:"Purchase the multi-subscription"}],"payment.podcast-offer-button-title":[{type:0,value:"Listen to the podcast"}],"payment.single-offer-button-title":[{type:0,value:"Listen to the single"}],"payment.try-button":[{type:0,value:"Try"}],"payment.yandex-plus-offer-button":[{type:0,value:"With a Yandex Plus multi-subscription"}],"paywall-footer.cashback-terms-link":[{type:0,value:"Cashback conditions"}],"paywall-footer.privileges-terms-link":[{type:0,value:"Privilege conditions"}],"paywall-footer.promotion-terms-link":[{type:0,value:"Promotion terms and conditions"}],"paywall-footer.subscription-terms-link":[{type:0,value:"Multi-subscription terms and conditions"}],"paywall-footer.subscription-terms-link-other-countries":[{type:0,value:"Subscription terms and conditions"}],"paywall-footer.support-link":[{type:0,value:"Support"}],"paywall.books-part-benefit-app-desktop":[{type:0,value:"Read and"},{type:1,value:"nbsp"},{type:0,value:"listen in a"},{type:1,value:"nbsp"},{type:0,value:"dedicated app"}],"paywall.books-part-benefit-download-desktop":[{type:0,value:"Download books to"},{type:1,value:"nbsp"},{type:0,value:"your device"}],"paywall.books-part-benefit-download-mobile":[{type:0,value:"Download books to"},{type:1,value:"nbsp"},{type:0,value:"your device"}],"paywall.books-part-benefit-follow-desktop":[{type:0,value:"Keep up with"},{type:1,value:"nbsp"},{type:0,value:"new releases and"},{type:1,value:"nbsp"},{type:0,value:"revisit the"},{type:1,value:"nbsp"},{type:0,value:"classics"}],"paywall.books-part-benefit-read-mobile":[{type:0,value:"Read new releases and"},{type:1,value:"nbsp"},{type:0,value:"classics"}],"paywall.books-part-benefit-speed-desktop":[{type:0,value:"Choose the pace that's comfortable for you"}],"paywall.books-part-benefit-speed-mobile":[{type:0,value:"Listen at"},{type:1,value:"nbsp"},{type:0,value:"your own pace"}],"paywall.books-part-benefit-switch-mobile":[{type:0,value:"Switch between text and"},{type:1,value:"nbsp"},{type:0,value:"audio"}],"paywall.books-part-title":[{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Books"}],"paywall.family-offer-text":[{type:0,value:"Everyone will have their own account and personal"},{type:1,value:"br"},{type:0,value:"recommendations. No extra fees"}],"paywall.family-offer-title":[{type:0,value:"Music for you "},{type:1,value:"br"},{type:0,value:"and"},{type:1,value:"nbsp"},{type:0,value:"three of your family members"}],"paywall.faq-answer-afraid-forget-cancel":[{type:0,value:"Don't worry, we'll send you an"},{type:1,value:"nbsp"},{type:0,value:"email 3"},{type:1,value:"nbsp"},{type:0,value:"days before your first payment"}],"paywall.faq-answer-cancel-until-end":[{type:0,value:"You can cancel your multi-subscription at any time. To do this:"},{type:1,value:"steps"}],"paywall.faq-answer-cancel-until-end-other-countries":[{type:0,value:"You can cancel your subscription at any time. To do this:"},{type:1,value:"steps"}],"paywall.faq-answer-cancel-until-end-step-1":[{type:0,value:"Open the page "},{type:1,value:"link"}],"paywall.faq-answer-cancel-until-end-step-1-link":[{type:0,value:"Manage your multi-subscription"}],"paywall.faq-answer-cancel-until-end-step-1-link-other-countries":[{type:0,value:"Manage subscription"}],"paywall.faq-answer-cancel-until-end-step-2":[{type:0,value:"Press \"Cancel multi-subscription\""}],"paywall.faq-answer-cancel-until-end-step-2-other-countries":[{type:0,value:"Tap Cancel subscription"}],"paywall.faq-answer-where-else-subscribe":[{type:0,value:"Download the"},{type:1,value:"nbsp"},{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Music app and"},{type:1,value:"nbsp"},{type:0,value:"use it to activate Plus"}],"paywall.faq-answer-without-card-binding":[{type:0,value:"No, a"},{type:1,value:"nbsp"},{type:0,value:"card must be linked to an"},{type:1,value:"nbsp"},{type:0,value:"account. Don't worry about payments. You won't be charged until the"},{type:1,value:"nbsp"},{type:0,value:"end of the"},{type:1,value:"nbsp"},{type:0,value:"trial period. When you link a"},{type:1,value:"nbsp"},{type:0,value:"new card to your account, we charge a"},{type:1,value:"nbsp"},{type:0,value:"small amount of money and"},{type:1,value:"nbsp"},{type:0,value:"then immediately refund it. This is just a"},{type:1,value:"nbsp"},{type:0,value:"confirmation payment to verify your card."}],"paywall.faq-question-afraid-forget-cancel":[{type:0,value:"I'm worried that I might forget to cancel my multi-subscription before the"},{type:1,value:"nbsp"},{type:0,value:"end of the"},{type:1,value:"nbsp"},{type:0,value:"trial period"}],"paywall.faq-question-afraid-forget-cancel-other-countries":[{type:0,value:"I'm worried that I might forget to cancel my subscription before the"},{type:1,value:"nbsp"},{type:0,value:"end of the"},{type:1,value:"nbsp"},{type:0,value:"trial period"}],"paywall.faq-question-cancel-until-end":[{type:0,value:"Can I cancel my multi-subscription before the"},{type:1,value:"nbsp"},{type:0,value:"trial period ends?"}],"paywall.faq-question-cancel-until-end-other-countries":[{type:0,value:"Can I cancel my subscription before the"},{type:1,value:"nbsp"},{type:0,value:"trial period ends?"}],"paywall.faq-question-where-else-subscribe":[{type:0,value:"I don't want to enter my bank card data on the"},{type:1,value:"nbsp"},{type:0,value:"website in a"},{type:1,value:"nbsp"},{type:0,value:"browser. Where else can I purchase the"},{type:1,value:"nbsp"},{type:0,value:"multi-subscription?"}],"paywall.faq-question-where-else-subscribe-other-countries":[{type:0,value:"I don't want to enter my bank card data on the"},{type:1,value:"nbsp"},{type:0,value:"website in a"},{type:1,value:"nbsp"},{type:0,value:"browser. Where else can I purchase the"},{type:1,value:"nbsp"},{type:0,value:"subscription?"}],"paywall.faq-question-without-card-binding":[{type:0,value:"Can I sign up for the trial period without linking a bank card?"}],"paywall.kinopoisk-part-benefit-channels":[{type:0,value:"Unlock access"},{type:1,value:"br"},{type:0,value:"to"},{type:1,value:"nbsp"},{type:0,value:"hundreds of TV channels"}],"paywall.kinopoisk-part-benefit-exclusive":[{type:0,value:"Watch"},{type:1,value:"br"},{type:0,value:"exclusive"},{type:1,value:"br"},{type:0,value:"Kinopoisk releases"}],"paywall.kinopoisk-part-benefit-movies":[{type:0,value:"Choose from"},{type:1,value:"nbsp"},{type:0,value:"thousands"},{type:1,value:"br"},{type:0,value:"of movies and"},{type:1,value:"nbsp"},{type:0,value:"TV series"}],"paywall.kinopoisk-part-benefit-sport":[{type:0,value:"Watch"},{type:1,value:"br"},{type:0,value:"sports"},{type:1,value:"br"},{type:0,value:"streams"}],"paywall.kinopoisk-part-title":[{type:0,value:"Movies and Series"}],"paywall.more-info":[{type:0,value:"What's included in the"},{type:1,value:"nbsp"},{type:0,value:"multi-subscription"}],"paywall.music-benefit-all-in-one-desktop":[{type:0,value:"All in"},{type:1,value:"nbsp"},{type:0,value:"one convenient service"}],"paywall.music-benefit-all-in-one-mobile":[{type:0,value:"All in"},{type:1,value:"nbsp"},{type:0,value:"one convenient app"}],"paywall.music-benefit-audio":[{type:0,value:"Music, audiobooks, and"},{type:1,value:"nbsp"},{type:0,value:"podcasts"}],"paywall.music-benefit-recommendation":[{type:0,value:"Spot-on recommendations"}],"paywall.music-benefit-without-network":[{type:0,value:"Download and"},{type:1,value:"nbsp"},{type:0,value:"listen even"},{type:1,value:"nbsp"},{type:0,value:"offline"}],"paywall.music-benefits-title":[{type:0,value:"Let's listen to"},{type:1,value:"br"},{type:0,value:"Yandex Music"}],"paywall.music-on-many-devices":[{type:0,value:"Music on different devices with the"},{type:1,value:"nbsp"},{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Plus subscription"}],"paywall.music-part-benefit-books":[{type:0,value:"Listen to"},{type:1,value:"nbsp"},{type:0,value:"audiobooks"}],"paywall.music-part-benefit-books-alternative":[{type:0,value:"Listen to audiobooks"}],"paywall.music-part-benefit-many-devices":[{type:0,value:"Let the smart recommendations"},{type:1,value:"br"},{type:0,value:"surprise you"}],"paywall.music-part-benefit-playlists":[{type:0,value:"Create"},{type:1,value:"br"},{type:0,value:"your own playlists"},{type:1,value:"br"},{type:0,value:"in "},{type:1,value:"nbsp"},{type:0,value:"Collection"}],"paywall.music-part-benefit-recommendations":[{type:0,value:"Dive into"},{type:1,value:"br"},{type:0,value:"thousands of selections"}],"paywall.music-part-benefit-without-internet":[{type:0,value:"Listen"},{type:1,value:"br"},{type:0,value:"offline"},{type:1,value:"br"},{type:0,value:"in"},{type:1,value:"nbsp"},{type:0,value:"high quality"}],"paywall.music-part-benefit-without-internet-mobile":[{type:0,value:"Listen even without"},{type:1,value:"nbsp"},{type:0,value:"internet"}],"paywall.music-part-title":[{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Music"}],"paywall.open-plus-benefits":[{type:0,value:"All the"},{type:1,value:"nbsp"},{type:0,value:"entertainment options in a"},{type:1,value:"nbsp"},{type:0,value:"single multi-subscription"}],"paywall.other-services-part-benefit-maps":[{type:0,value:"Yandex Maps and Yandex Navigator in"},{type:1,value:"nbsp"},{type:0,value:"CarPlay and"},{type:1,value:"nbsp"},{type:0,value:"Android"},{type:1,value:"nbsp"},{type:0,value:"Auto"}],"paywall.other-services-part-benefit-your-plus":[{type:0,value:"Enjoy more benefits in"},{type:1,value:"nbsp"},{type:0,value:"Select"},{type:1,value:"nbsp"},{type:0,value:"Pluses"}],"paywall.other-services-part-save":[{type:0,value:"Enjoy increased interest rates on"},{type:1,value:"nbsp"},{type:0,value:"savings accounts with"},{type:1,value:"nbsp"},{type:0,value:"Savers"}],"paywall.other-services-part-title":[{type:0,value:"Plus benefits in"},{type:1,value:"nbsp"},{type:0,value:"Yandex services"}],"paywall.pay-part-benefit-split-desktop":[{type:0,value:"Pay in"},{type:1,value:"nbsp"},{type:0,value:"parts with"},{type:1,value:"nbsp"},{type:0,value:"Split"}],"paywall.plus-benefit-books":[{type:0,value:"Books"},{type:1,value:"br"},{type:0,value:"and audiobooks"}],"paywall.plus-benefit-cashback":[{type:0,value:"And more benefits in"},{type:1,value:"nbsp"},{type:0,value:"Yandex services"}],"paywall.plus-benefit-kinopoisk":[{type:0,value:"Movies and"},{type:1,value:"nbsp"},{type:0,value:"TV series"},{type:1,value:"br"},{type:0,value:"on"},{type:1,value:"nbsp"},{type:0,value:"Kinopoisk"}],"paywall.plus-benefit-music":[{type:0,value:"Ad-free music"},{type:1,value:"br"},{type:0,value:"and"},{type:1,value:"nbsp"},{type:0,value:"podcasts"}],"paywall.plus-part-benefit-devices":[{type:0,value:"Add up to"},{type:1,value:"br"},{type:0,value:"10 devices"}],"paywall.plus-part-benefit-family":[{type:0,value:"Add"},{type:1,value:"br"},{type:0,value:"3"},{type:1,value:"nbsp"},{type:0,value:"family members"}],"paywall.plus-part-benefit-options":[{type:0,value:"Add options to enhance your multi-subscription"}],"paywall.plus-part-spend-points":[{type:0,value:"Spend your Plus bonus points on"},{type:1,value:"nbsp"},{type:0,value:"orders in"},{type:1,value:"nbsp"},{type:0,value:"Yandex services: 1"},{type:1,value:"nbsp"},{type:0,value:"bonus point"},{type:1,value:"nbsp"},{type:0,value:"="},{type:1,value:"nbsp"},{type:0,value:"₽1"},{type:1,value:"nbsp"},{type:0,value:"off"}],"paywall.plus-part-title":[{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Plus"}],"paywall.recommendations-on-devices":[{type:0,value:"Listen to recommendations based on your interests wherever you want"}],"play-queue.album-will-be-played-last":[{type:0,value:"Album "},{type:1,value:"title"},{type:0,value:" added to the end of the queue"}],"play-queue.album-will-be-played-next":[{type:0,value:"Album "},{type:1,value:"title"},{type:0,value:" added to the beginning of the queue"}],"play-queue.audiobook-episode-will-be-played-last":[{type:0,value:"Chapter "},{type:1,value:"title"},{type:0,value:" added to the end of the queue"}],"play-queue.audiobook-episode-will-be-played-next":[{type:0,value:"Chapter "},{type:1,value:"title"},{type:0,value:" added to the beginning of the queue"}],"play-queue.audiobook-episode-will-be-removed":[{type:0,value:"The chapter "},{type:1,value:"title"},{type:0,value:" removed from the queue"}],"play-queue.delete-from-queue":[{type:0,value:"Remove from queue"}],"play-queue.my-wave-by-album":[{type:0,value:"My Vibe by album"}],"play-queue.my-wave-by-artist":[{type:0,value:"My Vibe by artist"}],"play-queue.my-wave-by-playlist":[{type:0,value:"My Vibe by playlist"}],"play-queue.next-in":[{type:0,value:"Queuing"}],"play-queue.now-playing":[{type:0,value:"Playing now"}],"play-queue.now-playing-by-entity":[{type:0,value:"Now playing "},{type:1,value:"entity"}],"play-queue.now-playing-from-album":[{type:0,value:"Playing now from the album"}],"play-queue.now-playing-from-artist-collection":[{type:0,value:"Playing now from Something Familiar"}],"play-queue.now-playing-from-artist-popular-tracks":[{type:0,value:"Playing now from the artist's popular tracks"}],"play-queue.now-playing-from-artist-wave":[{type:0,value:"Playing now from Something Familiar"}],"play-queue.now-playing-from-downloads":[{type:0,value:"Playing now from downloaded tracks"}],"play-queue.now-playing-from-history":[{type:0,value:"Playing now from history"}],"play-queue.now-playing-from-history-search":[{type:0,value:"Playing now from search history"}],"play-queue.now-playing-from-playlist":[{type:0,value:"Playing now from the playlist"}],"play-queue.now-playing-from-podcast":[{type:0,value:"Playing now from the podcast"}],"play-queue.now-playing-from-search":[{type:0,value:"Playing now from search"}],"play-queue.now-playing-my-wave-by-album":[{type:0,value:"Now playing My Vibe by album"}],"play-queue.now-playing-my-wave-by-artist":[{type:0,value:"Now playing My Vibe by artist"}],"play-queue.now-playing-my-wave-by-playlist":[{type:0,value:"Now playing My Vibe by playlist"}],"play-queue.now-playing-my-wave-by-podcast":[{type:0,value:"Now playing My Vibe by podcast"}],"play-queue.now-playing-my-wave-by-track":[{type:0,value:"Now playing My Vibe by track"}],"play-queue.play-last":[{type:0,value:"Add to the end of the queue"}],"play-queue.play-next":[{type:0,value:"Play next"}],"play-queue.playlist-will-be-played-last":[{type:0,value:"Playlist "},{type:1,value:"title"},{type:0,value:" added to the end of the queue"}],"play-queue.playlist-will-be-played-next":[{type:0,value:"Playlist "},{type:1,value:"title"},{type:0,value:" added to the beginning of the queue"}],"play-queue.podcast-episode-will-be-played-last":[{type:0,value:"Episode "},{type:1,value:"title"},{type:0,value:" added to the end of the queue"}],"play-queue.podcast-episode-will-be-played-next":[{type:0,value:"Episode "},{type:1,value:"title"},{type:0,value:" added to the beginning of the queue"}],"play-queue.podcast-episode-will-be-removed":[{type:0,value:"The episode "},{type:1,value:"title"},{type:0,value:" removed from the queue"}],"play-queue.repeat-context":[{type:0,value:"Repeat queue on"}],"play-queue.repeat-one":[{type:0,value:"Repeat track on"}],"play-queue.shuffle":[{type:0,value:"Shuffle"}],"play-queue.title":[{type:0,value:"Playback queue"}],"play-queue.track-will-be-played-last":[{type:0,value:"Track "},{type:1,value:"title"},{type:0,value:" added to the end of the queue"}],"play-queue.track-will-be-played-next":[{type:0,value:"Track "},{type:1,value:"title"},{type:0,value:" added to the beginning of the queue"}],"play-queue.track-will-be-removed":[{type:0,value:"The track "},{type:1,value:"title"},{type:0,value:" removed from the queue"}],"player-actions.audio-quality":[{type:0,value:"Sound settings"}],"player-actions.audio-quality-economical":[{type:0,value:"Efficient"}],"player-actions.audio-quality-economical-description":[{type:0,value:"Stable sound with a slow internet connection"}],"player-actions.audio-quality-maximum":[{type:0,value:"Superb"}],"player-actions.audio-quality-maximum-description":[{type:0,value:"Music in lossless and other high-quality formats for fast internet connections and superior acoustic systems"}],"player-actions.audio-quality-optimal":[{type:0,value:"Balanced"}],"player-actions.audio-quality-optimal-description":[{type:0,value:"Balanced sound for most devices"}],"player-actions.cast":[{type:0,value:"Select device"}],"player-actions.fullscreen":[{type:0,value:"Full-screen"}],"player-actions.fullscreen-button":[{type:0,value:"Fullscreen player"}],"player-actions.listen":[{type:0,value:"Listen"}],"player-actions.mix":[{type:0,value:"Shuffle"}],"player-actions.next-track":[{type:0,value:"Next song"}],"player-actions.pause":[{type:0,value:"Pause"}],"player-actions.play":[{type:0,value:"Playback"}],"player-actions.previous-track":[{type:0,value:"Previous song"}],"player-actions.repeat":[{type:0,value:"Repeat"}],"player-actions.repeat-action":[{type:0,value:"Repeat"}],"player-actions.repeat-context":[{type:0,value:"Repeat playlist"}],"player-actions.repeat-one":[{type:0,value:"Repeat track"}],"player-actions.rewind-backwards":[{type:0,value:"15 seconds back"}],"player-actions.rewind-forward":[{type:0,value:"30 seconds forward"}],"player-actions.shuffle":[{type:0,value:"Shuffle"}],"player-actions.timecode-control":[{type:0,value:"Manage time code"}],"player-actions.video-speed":[{type:0,value:"Speed"}],"player-actions.video-speed-normal":[{type:0,value:"Normal"}],"player-actions.volume-control":[{type:0,value:"Manage volume"}],"player-actions.volume-off":[{type:0,value:"Turn off sound"}],"player-actions.volume-on":[{type:0,value:"Turn on sound"}],"playlist-actions.add-description":[{type:0,value:"Add description"}],"playlist-actions.add-poster":[{type:0,value:"Add cover image"}],"playlist-actions.add-track-to-playlist":[{type:0,value:"Add to playlist"}],"playlist-actions.change-description":[{type:0,value:"Edit description"}],"playlist-actions.change-description-abbr":[{type:0,value:"Ed."}],"playlist-actions.change-poster":[{type:0,value:"Edit cover image"}],"playlist-actions.change-title":[{type:0,value:"Edit name"}],"playlist-actions.create-playlist":[{type:0,value:"Create playlist"}],"playlist-actions.enter-title":[{type:0,value:"Enter the name"}],"playlist-actions.privacy":[{type:0,value:"Private playlist"}],"playlist-actions.privacy-label":[{type:0,value:"Change playlist privacy settings"}],"playlist-actions.remove-from-playlist":[{type:0,value:"Remove from playlist"}],"playlist-actions.remove-playlist":[{type:0,value:"Delete playlist"}],"playlist-errors.failed-add-track-to-playlist":[{type:0,value:"The track wasn't added to the playlist. Please try again"}],"playlist-errors.failed-add-tracks-to-playlist":[{type:0,value:"Couldn't add tracks to the playlist. Please try again"}],"playlist-errors.failed-download-xlsx":[{type:0,value:"Couldn't download the Excel file"}],"playlist-errors.failed-part-tracks-download-xlsx":[{type:0,value:"The Excel file was downloaded, but some of the tracks couldn't be downloaded"}],"playlist-errors.failed-to-change-description":[{type:0,value:"Couldn't edit the playlist description"}],"playlist-errors.failed-to-change-poster":[{type:0,value:"Couldn't edit the cover image"}],"playlist-errors.failed-to-change-privacy-settings":[{type:0,value:"Couldn't change privacy settings"}],"playlist-errors.failed-to-change-title":[{type:0,value:"Couldn't edit the playlist name"}],"playlist-errors.failed-to-create-playlist":[{type:0,value:"Couldn't create playlist"}],"playlist-errors.failed-to-remove-playlist":[{type:0,value:"Couldn't delete playlist"}],"playlist-errors.failed-to-remove-track":[{type:0,value:"Couldn't remove the track from the playlist"}],"plus-page.iframe-title":[{type:0,value:"Your Plus"}],"plusbar.subscription-activation":[{type:0,value:"Activate the multi-subscription"}],"plusbar.text":[{type:0,value:"You can also watch Kinopoisk"},{type:1,value:"br"},{type:0,value:"and"},{type:1,value:"nbsp"},{type:0,value:"earn bonus points"}],"plusbar.title":[{type:0,value:"Music starts"},{type:1,value:"br"},{type:0,value:"with a"},{type:1,value:"nbsp"},{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Plus multi-subscription"}],"podcast-errors.error-during-loading-podcast":[{type:0,value:"An error occurred while loading the podcast"}],"podcast.age-limit":[{type:0,value:"Age restriction"}],"podcast.episodes-list":[{type:1,value:"albumName"},{type:0,value:" podcast episodes list"}],"podcast.last-episodes-list":[{type:0,value:"The list of latest episodes"}],"podcast.publisher-title":[{type:0,value:"Publisher"}],"podcast.publishers-title":[{type:0,value:"Publishers"}],"podcast.shelf-liked-title":[{type:0,value:"You Added Earlier"}],"podcast.shelf-recently-played-title":[{type:0,value:"Recently played"}],"podcast.tab-about":[{type:0,value:"Podcast details"}],"podcast.tab-tracks":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"episodes"}]},many:{value:[{type:0,value:"episodes"}]},one:{value:[{type:0,value:"episode"}]},other:{value:[{type:0,value:"episodes"}]}},pluralType:"cardinal",type:6,value:"value"}],"rewind.button-title":[{type:0,value:"Unpacking 2025"}],"rewind.download-image":[{type:0,value:"Download image"}],"rewind.save-choice":[{type:0,value:"Save selection"}],"search-filters.top":[{type:0,value:"Top"}],"search-filters.track":[{type:0,value:"Tracks"}],"search-results.album":[{type:0,value:"Albums"}],"search-results.artist":[{type:0,value:"Artists"}],"search-results.best":[{type:0,value:"Top results"}],"search-results.clip":[{type:0,value:"Videos"}],"search-results.not-found-description":[{type:0,value:"Try changing your query"}],"search-results.not-found-title":[{type:0,value:"Couldn't find anything"}],"search-results.other-results":[{type:0,value:"More results"}],"search-results.playlist":[{type:0,value:"Playlists"}],"search-results.podcasts-and-books":[{type:0,value:"Podcasts and books"}],"search.clear-history":[{type:0,value:"Clear history"}],"search.cleared-history":[{type:0,value:"History deleted"}],"search.corrected-text":[{type:0,value:"Did you mean "},{type:1,value:"text"},{type:0,value:"?"}],"search.history":[{type:0,value:"History"}],"search.history-empty":[{type:0,value:"Your search history is empty"}],"search.input-placeholder":[{type:0,value:"Track, album, artist"}],"search.input-placeholder-q2v":[{type:0,value:"What do you feel or search for?"}],"search.playlist-placeholder":[{type:0,value:"Playlist search"}],"search.q2v-suggestions-loading":[{type:0,value:"Thinking of suggestions"}],"search.recent-requests-fallback":[{type:0,value:"Your recent queries will appear here"}],"search.search-catalog":[{type:0,value:"Search catalog"}],"search.track-placeholder":[{type:0,value:"Track search"}],"settings.about-app":[{type:0,value:"About the app"}],"settings.ai-content-reduction":[{type:0,value:"Less AI"}],"settings.ai-content-reduction-description":[{type:0,value:"AI-generated music will appear less frequently in your recommendations"}],"settings.crossfade":[{type:0,value:"Crossfade between tracks"}],"settings.failed-to-change-child-mode":[{type:0,value:"Couldn't change privacy settings"}],"settings.preferences":[{type:0,value:"Update recommendations"}],"settings.preferences-description":[{type:0,value:"If your music preferences have changed, be sure to specify it here"}],"settings.shortcuts":[{type:0,value:"Hot keys"}],"settings.show-child-section":[{type:0,value:"Display the \"For Kids\" section"}],"share.iframe-copy":[{type:0,value:"Copy"}],"share.iframe-editor-code":[{type:0,value:"Code"}],"share.iframe-editor-height":[{type:0,value:"Height"}],"share.iframe-editor-preview":[{type:0,value:"Preview"}],"share.iframe-editor-width":[{type:0,value:"Width"}],"share.iframe-listen":[{type:0,value:"Listen to "},{type:1,value:"html"},{type:0,value:" on Yandex Music"}],"share.iframe-modal-title":[{type:0,value:"Customize the size and copy the code to the site"}],"shortcuts.fullscreen-player":[{type:0,value:"Open/close fullscreen player"}],"shortcuts.like":[{type:0,value:"Like"}],"shortcuts.mute":[{type:0,value:"Mute/unmute"}],"shortcuts.next-track":[{type:0,value:"Next track"}],"shortcuts.or":[{type:0,value:"or"}],"shortcuts.play-pause":[{type:0,value:"Play/pause music"}],"shortcuts.previous-track":[{type:0,value:"Previous track"}],"shortcuts.rewind":[{type:0,value:"Rewind"}],"shortcuts.skip-forward":[{type:0,value:"Skip forward"}],"shortcuts.switch-repeat-mode":[{type:0,value:"Toggle repeat mode"}],"shortcuts.switch-shuffle-mode":[{type:0,value:"Toggle shuffle mode"}],"shortcuts.unlike":[{type:0,value:"Unlike"}],"shortcuts.volume-down":[{type:0,value:"Volume down"}],"shortcuts.volume-up":[{type:0,value:"Volume up"}],"sidebar.collapse":[{type:0,value:"Collaps the sidebar"}],"sidebar.download-app":[{type:0,value:"Download app"}],"sidebar.download-app-formatted":[{type:0,value:"Yandex Music on "},{children:[{type:0,value:"desktop"}],type:8,value:"span"}],"sidebar.download-macos":[{type:0,value:"Download the application for MacOS"}],"sidebar.download-macos-formatted":[{type:0,value:"Yandex Music on "},{children:[{type:0,value:"MacOS"}],type:8,value:"span"}],"sidebar.download-windows":[{type:0,value:"Download the application for Windows"}],"sidebar.download-windows-formatted":[{type:0,value:"Yandex Music on "},{children:[{type:0,value:"Windows"}],type:8,value:"span"}],"sidebar.plus-badge":[{type:0,value:"Plus"}],"sidebar.uncollapse":[{type:0,value:"Expand the sidebar"}],"slider.close-image-modal":[{type:0,value:"Close image viewer"}],"slider.image-counter":[{type:0,value:"Image "},{type:1,value:"index"},{type:0,value:" of "},{type:1,value:"count"}],"slider.image-slider-modal":[{type:0,value:"Image viewer"}],"slider.images-left-count":[{type:1,value:"imagesLeft"},{type:0,value:" more "},{offset:0,options:{few:{value:[{type:0,value:"images"}]},many:{value:[{type:0,value:"images"}]},one:{value:[{type:0,value:"image"}]},other:{value:[{type:0,value:"images"}]}},pluralType:"cardinal",type:6,value:"imagesLeft"}],"slider.next-image":[{type:0,value:"Next image"}],"slider.next-slide":[{type:0,value:"Next slide"}],"slider.prev-image":[{type:0,value:"Previous image"}],"slider.prev-slide":[{type:0,value:"Previous slide"}],"slider.slide":[{type:0,value:"Slide"}],"slider.view-artist-covers":[{type:0,value:"View the artist's photos"}],"slider.view-concert-covers":[{type:0,value:"View concert photos"}],"slider.view-cover":[{type:0,value:"View the cover"}],"snegir.auth-button-text":[{type:0,value:"Log in"}],"snegir.main-text":[{type:0,value:"Yandex Music"},{type:1,value:"br"},{type:0,value:"is currently not available in your region"}],"snegir.redirect-button-text":[{type:0,value:"Log in"}],"sort.select-filter":[{type:0,value:"Select a filter"}],"sort.sort-by-rating":[{type:0,value:"By popularity"}],"sort.sort-by-year":[{type:0,value:"By release date"}],"time.duration":[{type:0,value:"Duration"}],"time.finished":[{type:0,value:"Played"}],"time.hours":[{offset:0,options:{few:{value:[{style:null,type:2,value:"hours"},{type:0,value:" hours"}]},many:{value:[{style:null,type:2,value:"hours"},{type:0,value:" hours"}]},one:{value:[{style:null,type:2,value:"hours"},{type:0,value:" hours"}]},other:{value:[{style:null,type:2,value:"hours"},{type:0,value:" hours"}]}},pluralType:"cardinal",type:6,value:"hours"}],"time.hours-left":[{offset:0,options:{few:{value:[{style:null,type:2,value:"hours"},{type:0,value:" hours left"}]},many:{value:[{style:null,type:2,value:"hours"},{type:0,value:" hours left"}]},one:{value:[{style:null,type:2,value:"hours"},{type:0,value:" hour left"}]},other:{value:[{style:null,type:2,value:"hours"},{type:0,value:" hours left"}]}},pluralType:"cardinal",type:6,value:"hours"}],"time.hours-minutes":[{options:{"0":{value:[]},other:{value:[{type:1,value:"hours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"hours"}]},many:{value:[{type:0,value:"hours"}]},one:{value:[{type:0,value:"hour"}]},other:{value:[{type:0,value:"hours"}]}},pluralType:"cardinal",type:6,value:"hours"}]}},type:5,value:"hours"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"minutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"minutes"}]},many:{value:[{type:0,value:"minutes"}]},one:{value:[{type:0,value:"minute"}]},other:{value:[{type:0,value:"minutes"}]}},pluralType:"cardinal",type:6,value:"minutes"}]}},type:5,value:"minutes"}],"time.hours-minutes-seconds":[{options:{"0":{value:[]},other:{value:[{type:1,value:"hours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"hours,"}]},many:{value:[{type:0,value:"hours,"}]},one:{value:[{type:0,value:"hour,"}]},other:{value:[{type:0,value:"hours,"}]}},pluralType:"cardinal",type:6,value:"hours"}]}},type:5,value:"hours"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"minutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"minutes,"}]},many:{value:[{type:0,value:"minutes,"}]},one:{value:[{type:0,value:"minute,"}]},other:{value:[{type:0,value:"minutes,"}]}},pluralType:"cardinal",type:6,value:"minutes"}]}},type:5,value:"minutes"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"seconds"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"seconds."}]},many:{value:[{type:0,value:"seconds."}]},one:{value:[{type:0,value:"second."}]},other:{value:[{type:0,value:"seconds"}]}},pluralType:"cardinal",type:6,value:"seconds"}]}},type:5,value:"seconds"}],"time.left":[{offset:0,options:{few:{value:[{type:0,value:"Time left:"}]},many:{value:[{type:0,value:"Time left:"}]},one:{value:[{type:0,value:"Time left:"}]},other:{value:[{type:0,value:"Time left:"}]}},pluralType:"cardinal",type:6,value:"time"}],"time.minutes-left":[{offset:0,options:{few:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" minutes"}]},many:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" minutes"}]},one:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" minute"}]},other:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" minutes"}]}},pluralType:"cardinal",type:6,value:"minutes"}],"time.seconds-left":[{offset:0,options:{few:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" seconds"}]},many:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" seconds"}]},one:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" second"}]},other:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" seconds"}]}},pluralType:"cardinal",type:6,value:"seconds"}],"track-modal.album-heading":[{options:{audiobook:{value:[{type:0,value:"Book"}]},fairy_tale:{value:[{type:0,value:"Fairy tale"}]},other:{value:[{type:0,value:"Album"}]},podcast:{value:[{type:0,value:"Podcast"}]},single:{value:[{type:0,value:"Single"}]}},type:5,value:"type"}],"track-modal.audiobook-title":[{type:0,value:"About the chapter"}],"track-modal.clip-title":[{type:0,value:"About the video"}],"track-modal.concert-title":[{type:0,value:"About the concert"}],"track-modal.content-rating":[{type:0,value:"Age"}],"track-modal.genre":[{type:0,value:"Genre"}],"track-modal.podcast-title":[{type:0,value:"About the episode"}],"track-modal.read-more":[{type:0,value:"Read all"}],"track-modal.similar-tracks":[{type:0,value:"Similar tracks"}],"track-modal.source":[{type:0,value:"Source"}],"track-modal.title":[{type:0,value:"Track details"}],"track-modal.track-name":[{type:0,value:"Name"}],"track-title.audiobook-not-found":[{type:0,value:"This audiobook is unavailable"}],"track-title.error-not-found":[{type:0,value:"Track unavailable"}],"track-title.podcast-not-found":[{type:0,value:"Podcast unavailable"}],"trailer.button-aria-label":[{type:0,value:"Play trailer"}],"trailer.close":[{type:0,value:"Close trailer"}],"trailer.listen-full-version":[{type:0,value:"Listen in full"}],"trailer.navigate":[{type:0,value:"Go"}],"trailer.not-found-description":[{type:0,value:"Soon we'll fix it! Come back later"}],"trailer.not-found-title":[{type:0,value:"The trailer is unavailable"}],"trailer.something-went-wrong-description":[{type:0,value:"Refresh the screen or try again later"}],"ugc.cancel-upload":[{type:0,value:"Cancel upload"}],"ugc.close-edit-popup":[{type:0,value:"Close the track editing window"}],"ugc.editing-failed":[{type:0,value:"Couldn't edit track"}],"ugc.notification-success":[{type:0,value:"All the tracks were uploaded to "},{type:1,value:"playlistName"}],"ugc.notification-too-large-file-error":[{type:0,value:"The file is too large to be uploaded"}],"ugc.notification-too-many-files-error":[{type:0,value:"You've reached the limit on the number of uploaded tracks"}],"ugc.notification-unknown-error":[{type:0,value:"An error occurred when uploading tracks to "},{type:1,value:"playlistName"}],"ugc.repeat-upload":[{type:0,value:"Repeat uploading"}],"ugc.track-description":[{type:0,value:"This track is available only to you"}],"ugc.track-uploading-error-status":[{type:0,value:"Error uploading the track"}],"ugc.track-uploading-pending-status":[{type:0,value:"Uploading track"}],"ugc.track-uploading-processing-status":[{type:0,value:"Processing the track"}],"ugc.upload-track":[{type:0,value:"Upload track"}],"vibe-actions.apply":[{type:0,value:"Apply"}],"vibe-actions.aria-label-pause":[{type:0,value:"Pause My Vibe"}],"vibe-actions.aria-label-play":[{type:0,value:"Play My Vibe"}],"vibe-actions.aria-label-settings":[{type:0,value:"Customize My Vibe"}],"vibe-actions.enter-title":[{type:0,value:"Enter the name"}],"vibe-actions.play-vibe":[{type:0,value:"Play My Vibe"}],"vibe-actions.remove":[{type:0,value:"Cancel"}],"vibe-actions.reset-settings":[{type:0,value:"Reset My Vibe"}],"vibe-actions.vibe-by-album":[{type:0,value:"My Vibe by album"}],"vibe-actions.vibe-by-artist":[{type:0,value:"My Vibe by artist"}],"vibe-actions.vibe-by-playlist":[{type:0,value:"My Vibe by playlist"}],"vibe-actions.vibe-by-track":[{type:0,value:"My Vibe by track"}],"vibe-actions.vibe-context":[{options:{MIX:{value:[{type:0,value:"Set "}]},other:{value:[]}},type:5,value:"type"},{type:1,value:"name"}],"vibe-errors.apply-vibe-setting":[{type:0,value:"An error occurred when setting up My Vibe"}],"vibe-errors.start-vibe":[{type:0,value:"An error occurred when launching My Vibe"}],"vibe-freemium.available-in-plus":[{type:0,value:"Find the music you like with the spot-on AI recommendations."},{type:1,value:"br"},{type:0,value:"Available with a Plus multi-subscription in addition to Kinopoisk and bonus points"}],"vibe-wheel.activity-description":[{type:0,value:"My Vibe by activity"}],"vibe-wheel.activity-fall-asleep":[{type:0,value:"Falling asleep"}],"vibe-wheel.activity-road-trip":[{type:0,value:"On-the-Road"}],"vibe-wheel.activity-wake-up":[{type:0,value:"Waking up"}],"vibe-wheel.activity-work-background":[{type:0,value:"Working"}],"vibe-wheel.activity-workout":[{type:0,value:"Working out"}],"vibe-wheel.mood-description":[{type:0,value:"My Vibe by mood"}],"vibe-wheel.mood-energetic":[{type:0,value:"Dynamic"}],"vibe-wheel.mood-happy":[{type:0,value:"Joyful"}],"vibe-wheel.mood-sad":[{type:0,value:"Sad"}],"warning-messages.can-break-accessibility":[{type:0,value:"Can break accessibility"}],"warning-messages.update-your-browser":[{type:0,value:"Yandex Music may work incorrectly. Please update your browser"}],"welcome-page.beta-header":[{type:0,value:"It's going "},{type:1,value:"br"},{type:0,value:"to get loud"}],"welcome-page.beta-text-short":[{type:0,value:"Come back later"}],"welcome-page.not-auth-header":[{type:0,value:"Log in to your account"},{type:1,value:"br"},{type:0,value:"to open the app"}],"welcome-page.not-auth-text":[{type:0,value:"Only users with a Plus multi-subscription have access to Yandex Music"}],"welcome-page.offer-header":[{type:0,value:"You don't have a Plus multi-subscription yet"}],"welcome-page.offer-text":[{type:0,value:"Sign up to get access to the app."}],"windows-menu.close":[{type:0,value:"Close"}],"windows-menu.roll-up":[{type:0,value:"Hide"}],"windows-menu.unwrap":[{type:0,value:"Expand"}],"wizard.button-done":[{type:0,value:"Done"}],"wizard.button-little-more":[{type:0,value:"Just a little left"}],"wizard.button-one-more":[{type:0,value:"Just one more"}],"wizard.button-tune":[{type:0,value:"Personalizing"}],"wizard.buttonText":[{type:0,value:"Choose artists"}],"wizard.description":[{type:0,value:"We'd like to know more about you to recommend music you'll like. Please choose some artists that you like, and our recommendations will adjust to your taste."}],"wizard.modal-text":[{type:0,value:"This will make your recommendations more accurate and interesting"}],"wizard.modal-title":[{type:0,value:"Select your favorite artists"}],"wizard.title":[{type:0,value:"Tell us about yourself"}],"words.ai-description":[{type:0,value:"AI may make mistakes, be sure to double-check important information"}],"words.dislike":[{type:0,value:"Not cool"}],"words.dislike-feedback":[{type:0,value:"Thank you for making me become better!"}],"words.like":[{type:0,value:"More similar replies"}],"words.like-feedback":[{type:0,value:"Thank you for your rating!"}],"words.loading-phrase-catching":[{type:0,value:"Getting in the rhythm"}],"words.loading-phrase-collecting-interesting":[{type:0,value:"Using the AI power to collect interesting stuff"}],"words.loading-phrase-reading":[{type:0,value:"Reading about the artist"}],"words.loading-phrase-studying":[{type:0,value:"Analyzing the sound"}],"words.loading-phrase-tuning":[{type:0,value:"Getting ready"}],"words.show-more":[{type:0,value:"Show this more often?"}],"ynison.desktop-device-title":[{type:1,value:"platformName"},{type:0,value:" ("},{type:1,value:"hostname"},{type:0,value:") app"}]};const translationsUZ = {"a11y-regions.player":[{type:0,value:"Pleyer"}],"a11y-regions.wheel":[{type:0,value:"Mening toʻlqinim tavsiyalari"}],"about-app.app-name":[{type:0,value:"Yandex Music"}],"about-app.explicit-content":[{type:0,value:"Yandex Music xizmatida voyaga yetmaganlar uchun moʻljallanmagan maʼlumotlar bo‘lishi mumkin. Yandex Music – musiqiy tavsiyalarni aniqlik darajasi boʻyicha eng aniq tizimdir. 2025-yil aprel oyida Rossiya Federatsiyasidagi musiqiy striming xizmatlari orasida foydalanuvchilarga shaxsiy tavsiyalarni tanlash aniqligi bo‘yicha yetakchi. Ma’lumotlar “Mail Data” MChJ tomonidan Romir Yagona ma’lumotlar paneli asosida 18–59 yoshdagi respondentlar o‘rtasida o‘tkazilgan so‘rov natijalariga tayangan holda taqdim etilgan."}],"ads.about-advertiser":[{type:0,value:"Reklama beruvchi haqida"}],"ads.ad":[{type:0,value:"Reklama"}],"ads.continue-ad":[{type:0,value:"Ijro reklamadan keyin boshlanadi"}],"ads.disable-ads":[{type:0,value:"Reklamani faolsizlantirish"}],"ads.learn-more":[{type:0,value:"Batafsil bilib olish"}],"ads.notification":[{type:0,value:"Plus multi-obunasi bilan reklamasiz tinglang"}],"advert.banner":[{type:0,value:"Reklama"}],"album-errors.error-during-loading-album":[{type:0,value:"Albomni yuklashda xatolik yuz berdi"}],"album-errors.error-during-loading-similar-albums":[{type:0,value:"O‘xshash albomlarni yuklashda xatolik yuz berdi"}],"album.external-streamings-title":[{type:0,value:"Boshqa platformalarda tinglash"}],"artist-errors.error-during-loading-artist":[{type:0,value:"Ijrochini yuklashda xatolik yuz berdi"}],"artist-errors.error-during-loading-artist-info":[{type:0,value:"Ijrochi haqidagi axborotni yuklashda xatolik yuz berdi"}],"artist.about-artist":[{type:0,value:"Ijrochi haqida"}],"artist.about-composer":[{type:0,value:"Bastakor haqida"}],"artist.artist-in-playlists":[{type:0,value:"Quyidagi mavjud pleylistlar"}],"artist.artist-links-label":[{type:0,value:"Ijrochi "},{type:1,value:"artistName"},{type:0,value:": $"},{type:1,value:"linkName"}],"artist.official-pages":[{type:0,value:"Rasmiy sahifalar"}],"artist.stats-less-listeners-per-month":[{type:0,value:"Oxirgi 30 kunga qaraganda"},{type:1,value:"br"},{type:1,value:"number"},{type:0,value:" kamroq"}],"artist.stats-listeners-per-month":[{type:0,value:"tinglovchi – oyiga"}],"artist.stats-more-listeners-per-month":[{type:0,value:"Oxirgi 30 kunga qaraganda"},{type:1,value:"br"},{type:1,value:"number"},{type:0,value:" koʻproq"}],"artist.stats-same-listeners-per-month":[{type:0,value:"Oxirgi 30 kun bilan"},{type:1,value:"br"},{type:0,value:"bir xil"}],"authorization-messages.need-to-authorizate":[{type:0,value:"Avval avtorizatsiya qilish kerak"}],"authorization.enter-and-listen-button":[{type:0,value:"Kirish va cheklovsiz tinglash"}],"authorization.enter-button":[{type:0,value:"Kirish"}],"authorization.enter-subtitle":[{type:0,value:"Musiqa va podkastlarni cheklovlarsiz tinglash uchun"}],"authorization.enter-text":[{type:0,value:"Hisobingizga kiring va barcha qurilmalarda bitta musiqalar termasiga ruxsat oling."}],"authorization.enter-title":[{type:0,value:"Hisobga kiring"}],"authorization.enter-tooltip":[{type:0,value:"Hisobga kirish"}],"authorization.start-button":[{type:0,value:"Boshlash"}],"bar-below.section-name":[{type:0,value:"Banner"}],"branded-player.branding-integration":[{type:0,value:"Reklama integratsiyasi"}],"branded-player.car":[{type:0,value:"Mashina"}],"branded-player.default":[{type:0,value:"Standart"}],"branded-player.duck":[{type:0,value:"O‘rdakcha"}],"branded-player.hide":[{type:0,value:"Berkitish"}],"branded-player.player-type":[{type:0,value:"Pleyer turi"}],"branded-player.to-website":[{type:0,value:"Saytga"}],"buy-subscription.activate":[{type:0,value:"Ulanish"}],"buy-subscription.already-in-plus":[{type:0,value:"Men allaqachon"},{type:1,value:"nbsp"},{type:0,value:"Plusdaman"}],"buy-subscription.get-more-discoveries":[{type:0,value:"Koʻplab yangiliklar"},{type:1,value:"nbsp"},{type:0,value:"Yandex multi-obunasi"},{type:1,value:"nbsp"},{type:0,value:"bilan"},{type:1,value:"nbsp"},{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Music ilovasida!"}],"buy-subscription.listen-without-restrictions":[{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Music ilovasini cheklovlarsiz tinglang"}],"buy-subscription.music-and-films-and-other":[{type:0,value:"Musiqa, kino va yana boshqalar"}],"buy-subscription.new-vibe-description":[{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Plus"},{type:1,value:"nbsp"},{type:0,value:"Multi-obunasi"},{type:1,value:"nbsp"},{type:0,value:"bilan musiqani reklamasi"},{type:1,value:"nbsp"},{type:0,value:" tinglang. Shuningdek, "},{type:1,value:"nbsp"},{type:0,value:"Kinopoisk, Yandex"},{type:1,value:"nbsp"},{type:0,value:"Books"},{type:1,value:"nbsp"},{type:0,value:"va"},{type:1,value:"nbsp"},{type:0,value:"ballar bilan keshbekka ega boʻling."}],"buy-subscription.offer-for-you":[{type:0,value:"Siz uchun "},{type:1,value:"offerText"}],"buy-subscription.plus-benefit-non-music":[{type:0,value:"Musiqa, podkastlar va"},{type:1,value:"nbsp"},{type:0,value:"audiokitoblar"}],"buy-subscription.plus-benefit-offline":[{type:0,value:"Hatto internetsiz"},{type:1,value:"nbsp"},{type:0,value:"ham tinglang "}],"buy-subscription.plus-benefit-other-services":[{type:0,value:"Shuningdek, Kinopoisk"},{type:1,value:"nbsp"},{type:0,value:"va"},{type:1,value:"nbsp"},{type:0,value:"Yandex Books"}],"buy-subscription.plus-benefit-recommendations":[{type:0,value:"Eng aniq tavsiyalar"}],"calendar.april-short":[{type:0,value:"apr"}],"calendar.august-short":[{type:0,value:"avg"}],"calendar.december-short":[{type:0,value:"dek"}],"calendar.february-short":[{type:0,value:"fev"}],"calendar.january-short":[{type:0,value:"yan"}],"calendar.july-short":[{type:0,value:"iyl"}],"calendar.june-short":[{type:0,value:"iyn"}],"calendar.march-short":[{type:0,value:"mar"}],"calendar.may-short":[{type:0,value:"may"}],"calendar.november-short":[{type:0,value:"noy"}],"calendar.october-short":[{type:0,value:"okt"}],"calendar.september-short":[{type:0,value:"sen"}],"collection.collection-color":[{type:0,value:"Musiqangizda "},{children:[{type:0,value:"rang"}],type:8,value:"color"},{type:0,value:" bor"}],"collection.collection-color-description":[{type:0,value:"Mening toʻlqinim va Kolleksiyaga sizni ruhlantiruvchi musiqiy rang qoʻshildi"}],"collection.collection-color-title":[{type:0,value:"Siz bilan birgalikda oʻzgaradi"}],"collection.created-playlists-list":[{type:0,value:"Pleylistlarim roʻyxati"}],"collection.empty-liked-tracks-text":[{type:0,value:"Taronalarni bu pleylistga kiritish uchun ularga layk bosing. Sevimlilarni topishga esa Mening toʻlqinim yordam beradi"}],"collection.empty-liked-tracks-title":[{type:0,value:"Bu yerda sevimli taronalaringiz chiqadi"}],"collection.liked-albums-list":[{type:0,value:"Sevimli albomlar roʻyxati"}],"collection.liked-artists-list":[{type:0,value:"Sevimli ijrochilar roʻyxati"}],"collection.liked-non-music-list":[{type:0,value:"Sevimli podkatlar va kitoblar roʻyxati"}],"collection.liked-playlists-list":[{type:0,value:"Sevimli pleylistlar roʻyxati"}],"collection.my-dislikes":[{type:0,value:"Mening dizlayklarim"}],"collection.new-playlist":[{type:0,value:"Yangi pleylist"}],"collection.your-created-playlists":[{type:0,value:"Siz jamlagan"}],"collection.your-liked-playlists":[{type:0,value:"Siz yoqtirgan"}],"concerts.about-event-kind":[{options:{concert:{value:[{type:0,value:"Konsert haqida"}]},festival:{value:[{type:0,value:"Festival haqida"}]},musical:{value:[{type:0,value:"Myuzikl haqida"}]},other:{value:[{type:1,value:"kind"},{type:0,value:" haqida"}]},tribute:{value:[{type:0,value:"Tribut haqida"}]},unspecified:{value:[{type:0,value:"Konsert haqida"}]}},type:5,value:"kind"}],"concerts.all-concerts":[{type:0,value:"Siz uchun konsertlar"}],"concerts.cities-list":[{type:0,value:"Shaharlar roʻyxati"}],"concerts.concerts-nearby":[{type:0,value:"Yaqin oradagi konsertlar"}],"concerts.details-title":[{type:0,value:"Konsertlar"}],"concerts.event-kind":[{options:{concert:{value:[{type:0,value:"Konsert"}]},festival:{value:[{type:0,value:"Festival"}]},musical:{value:[{type:0,value:"Myuzikl"}]},other:{value:[{type:1,value:"kind"}]},tribute:{value:[{type:0,value:"Tribut"}]},unspecified:{value:[{type:0,value:"Konsert"}]}},type:5,value:"kind"}],"concerts.feed-error":[{type:0,value:"Konsertlarni yuklashda xatolik yuz berdi"}],"concerts.find-city":[{type:0,value:"Shaharni topish"}],"concerts.nearby":[{type:0,value:"Yonma-yon"}],"concerts.nothing-found":[{type:0,value:"Hech narsa topilmadi"}],"concerts.onboarding":[{type:0,value:"Sevimli artistlaringizning konsertlari bilan yangi boʻlim ochildi – barakalla deymiz!"}],"concerts.top-for-you":[{type:0,value:"Siz uchun Top"}],"concerts.try-different-query":[{type:0,value:"Boshqacha yozishga urinib ko‘ring"}],"crackdown.description":[{type:0,value:"Sevimli treklarni reklamasiz tinglash uchun Yandex"},{type:1,value:"nbsp"},{type:0,value:"Plus"},{type:1,value:"br"},{type:0,value:"multi-obunasini ulang"}],"crackdown.title":[{type:0,value:"Chegaralarsiz"},{type:1,value:"br"},{type:0,value:"musiqa"}],"deeplinks.download-from-app-gallery":[{type:0,value:"AppGallery orqali yuklab olish"}],"deeplinks.download-from-app-store":[{type:0,value:"AppStore orqali yuklab olish"}],"deeplinks.download-from-google-play":[{type:0,value:"Google Play’da yuklab olish"}],"deeplinks.listen-in-app":[{type:0,value:"Ilovada tinglash"}],"desktop.about":[{type:0,value:"Ilova haqida"}],"desktop.app-revision":[{type:0,value:"Kod "},{type:1,value:"revision"}],"desktop.app-version":[{type:0,value:"Ilova versiyasi: "},{type:1,value:"version"}],"desktop.app-version-short":[{type:0,value:"Versiya "},{type:1,value:"version"}],"desktop.check-for-updates":[{type:0,value:"Yangilanishlarni tekshirish"}],"desktop.close-yandex-music":[{type:0,value:"Yandex Music'ni yopish"}],"desktop.copy":[{type:0,value:"Nusxalash"}],"desktop.cut":[{type:0,value:"Qirqish"}],"desktop.default-release-note":[{children:[{type:0,value:"Ilovaga kirasiz – u yerda faqat sevimli janrlaringiz bor, hech qanday xato yoʻq. Bu tasodif emas. Bu yangilanish"}],type:8,value:"p"},{type:0,value:"\n"},{children:[{type:0,value:"Yandex Music jamoasidan\neng aniq tavsiyalar"}],type:8,value:"p"}],"desktop.edit":[{type:0,value:"Tahrir"}],"desktop.hide-yandex-music":[{type:0,value:"Yandex Music’ni yashirish"}],"desktop.minimize":[{type:0,value:"Pastga tushirish"}],"desktop.on-update-available":[{type:1,value:"version"},{type:0,value:" versiyasi chiqdi"}],"desktop.paste":[{type:0,value:"Joylash"}],"desktop.quit":[{type:0,value:"Ilovani yopish"}],"desktop.quit-yandex-music":[{type:0,value:"Yandex Music'ni yakunlash"}],"desktop.recommendations":[{type:0,value:"Tavsiyalar qoidasi"}],"desktop.redo":[{type:0,value:"Takrorlash"}],"desktop.release-notes-modal-title":[{type:0,value:"Qanday yangiliklar bor?"}],"desktop.select-all":[{type:0,value:"Barchasini tanlash"}],"desktop.support":[{type:0,value:"Yordam xizmati bilan chat"}],"desktop.terms":[{type:0,value:"Foydalanuvchi bilan kelishuv"}],"desktop.undo":[{type:0,value:"Bekor qilish"}],"desktop.update":[{type:0,value:"Yangilash"}],"desktop.window":[{type:0,value:"Oyna"}],"donation.button-text":[{type:0,value:"Donat yordamida dastaklash"}],"donation.support-artist":[{offset:0,options:{one:{value:[{type:0,value:"Ijrochini dastaklash"}]},other:{value:[{type:0,value:"Ijrochilarni dastaklash"}]}},pluralType:"cardinal",type:6,value:"count"}],"donation.support-button":[{type:0,value:"Qo‘llab-quvvatlash"}],"donation.support-text":[{type:0,value:"Donat bilan dastaklang"}],"donation.transfer-any-amount":[{type:0,value:"Istalgan summani yuborish mumkin"}],"download-mobile-app.listen-in-app":[{type:0,value:"Ilovada tinglash"}],"download-mobile-app.listen-in-app-without-restrictions":[{type:0,value:"Ilovada cheklovlarsiz tinglash"}],"download-mobile-app.stay":[{type:0,value:"Saytda qolish"}],"download-mobile-app.subtitle":[{type:0,value:"Yandex Music mobil ilovasida"}],"download-mobile-app.title":[{type:0,value:"Internetsiz ham musiqa tinglang"}],"download-mobile-app.use-service-in-app-without-restrictions":[{type:0,value:"Ilovada Yandex Musicʼni cheklovlarsiz tinglang"}],"drag-and-drop.failed-to-move":[{type:0,value:"Tarona koʻchirilmadi"}],"drag-and-drop.playlist-move-instructions":[{type:0,value:"Pleylistdagi taronani koʻchirish uchun, Enter tugmasini bosing."}],"drag-and-drop.playlist-on-move":[{type:1,value:"trackName"},{type:0,value:" taronasi "},{type:1,value:"index"},{type:0,value:" pozitsiyasiga koʻchadi. Koʻchirishni yakunlash uchun Enter tugmasini bosing. Bekor qilish uchun Esc tugmasini bosing."}],"drag-and-drop.playlist-on-move-cancel":[{type:0,value:"Taronani koʻchirish bekor qilindi."}],"drag-and-drop.playlist-on-move-end":[{type:1,value:"trackName"},{type:0,value:" taronasi butunlay koʻchirildi."}],"drag-and-drop.playlist-on-move-end-with-index":[{type:1,value:"trackName"},{type:0,value:" taronasi "},{type:1,value:"index"},{type:0,value:" pozitsiyasiga butunlay koʻchirildi."}],"drag-and-drop.playlist-on-move-fail":[{type:1,value:"trackName"},{type:0,value:" taronasi koʻchirish sohasi chegarasidan chiqib ketdi."}],"drag-and-drop.playlist-on-move-start":[{type:0,value:"Koʻchirish uchun "},{type:1,value:"index"},{type:0,value:" pozitsiyasidagi "},{type:1,value:"trackName"},{type:0,value:" taronasi tanlandi."}],"entity-names.album":[{type:0,value:"Albom"}],"entity-names.album-available-with-plus":[{type:0,value:"Bu albom Plus opsiyasi bilan mavjud"}],"entity-names.album-name":[{type:1,value:"albumName"},{type:0,value:" albomi"}],"entity-names.albums":[{type:0,value:"Albomlar"}],"entity-names.albums-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"ta albom"}]},many:{value:[{type:0,value:"ta albom"}]},one:{value:[{type:0,value:"ta albom"}]},other:{value:[{type:0,value:"ta albom"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.albums-tracks-list":[{type:0,value:"“"},{type:1,value:"albumName"},{type:0,value:"” albomi taronalari roʻyxati"}],"entity-names.and-more-artists":[{type:1,value:"artists"},{type:0,value:" va boshqalar"}],"entity-names.artist":[{type:0,value:"Artist"}],"entity-names.artist-albums-list":[{type:0,value:"Ijrochining albomlari roʻyxati"}],"entity-names.artist-clips-list":[{type:0,value:"Ijrochining kliplari roʻyxati"}],"entity-names.artist-compilations-list":[{type:0,value:"Ijrochining toʻplamlari roʻyxati"}],"entity-names.artist-name":[{type:0,value:"Artist "},{type:1,value:"artistName"}],"entity-names.artist-playlist":[{type:0,value:"Pleylistlar"}],"entity-names.artist-popular-tracks":[{type:0,value:"Artistning ommabop treklari"}],"entity-names.artist-studio-albums-list":[{type:0,value:"Ijrochining studiya albomlari roʻyxati"}],"entity-names.artist-tracks-list":[{type:0,value:"Ijrochining taronalari roʻyxati"}],"entity-names.artists":[{type:0,value:"Ijrochilar"}],"entity-names.artists-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"ta ijrochi"}]},many:{value:[{type:0,value:"ta ijrochi"}]},one:{value:[{type:0,value:"ta ijrochi"}]},other:{value:[{type:0,value:"ta ijrochi"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.audio":[{type:0,value:"Audio"}],"entity-names.audiobook":[{type:0,value:"Audio-kitoblar"}],"entity-names.audiobook-name":[{type:1,value:"bookName"},{type:0,value:" audiokitobi"}],"entity-names.authors":[{type:0,value:"Mualliflar: "},{type:1,value:"authors"}],"entity-names.book":[{type:0,value:"Kitob"}],"entity-names.cashback-percent":[{type:1,value:"value"},{type:0,value:"% keshbek"}],"entity-names.chart-down":[{type:0,value:"Chartdagi pozitsiyasi pastladi"}],"entity-names.chart-new":[{type:0,value:"Chartda yangi"}],"entity-names.chart-podcasts-list":[{type:0,value:"Chart podkastlari roʻyxati"}],"entity-names.chart-same":[{type:0,value:"Chartdagi pozitsiyasi oʻzgarmadi"}],"entity-names.chart-tracks-list":[{type:0,value:"Chart taronalari roʻyxati"}],"entity-names.chart-up":[{type:0,value:"Chartdagi pozitsiyasi yuqoriladi"}],"entity-names.clip":[{type:0,value:"Klip"}],"entity-names.clip-name":[{type:0,value:"Klip "},{type:1,value:"clipName"}],"entity-names.clips":[{type:0,value:"Kliplar"}],"entity-names.clips-will-like":[{type:0,value:"Sizga yoqadi"}],"entity-names.collection":[{type:0,value:"Terma"}],"entity-names.composer":[{type:0,value:"Bastakor"}],"entity-names.concert":[{type:0,value:"Konsert"}],"entity-names.concerts":[{type:0,value:"Konsertlar"}],"entity-names.created-playlists-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"ta shakllantirilgan pleylist"}]},many:{value:[{type:0,value:"ta shakllantirilgan pleylist"}]},one:{value:[{type:0,value:"ta shakllantirilgan pleylist"}]},other:{value:[{type:0,value:"ta shakllantirilgan pleylist"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.disk-number":[{type:1,value:"number"},{type:0,value:"-disk"}],"entity-names.editor-feature-is-show":[{type:0,value:"Allaqachon ko‘rsatilmoqda"}],"entity-names.fairy-tale":[{type:0,value:"Audio-ertak"}],"entity-names.fairytale":[{type:0,value:"Ertak"}],"entity-names.favourite-albums":[{type:0,value:"Sevimli albomlar"}],"entity-names.favourite-playlists":[{type:0,value:"Sevimli pleylistlar"}],"entity-names.generative":[{type:0,value:"Neyromusiqa"}],"entity-names.has-your-like":[{type:0,value:"Laykingiz bor"}],"entity-names.label":[{type:0,value:"Leybl"}],"entity-names.label-albums-list":[{type:0,value:"Leybl relizlari"}],"entity-names.label-artists-list":[{type:0,value:"Leybl ijrochilari"}],"entity-names.liked-artist":[{type:0,value:"Siz yoqtirgan"}],"entity-names.liked-playlist":[{type:0,value:"Menga yoqadi"}],"entity-names.liked-playlists-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"ta pleylist yoqdi"}]},many:{value:[{type:0,value:"ta pleylist yoqdi"}]},one:{value:[{type:0,value:"ta pleylist yoqdi"}]},other:{value:[{type:0,value:"ta pleylist yoqdi"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.likes-count-description":[{type:0,value:"Yoqdi, belgilar soni – "},{type:1,value:"count"}],"entity-names.likes-counter":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"ta layk"}]},other:{value:[{type:0,value:"ta layk"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.likes-counter-empty":[{type:0,value:"Hali layklar yo‘q"}],"entity-names.list-is-empty":[{type:0,value:"Ro‘yxat bo‘sh"}],"entity-names.listeners-per-month":[{type:0,value:"Oyiga "},{style:null,type:2,value:"counter"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"tinglovchi"}]},other:{value:[{type:0,value:"tinglovchi"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.map-url":[{type:0,value:"Yandex Maps havolasi"}],"entity-names.metro-stations":[{type:0,value:"Metro bekatlari"}],"entity-names.mixes":[{type:0,value:"Termalar"}],"entity-names.music-history":[{type:0,value:"Tinglash tarixi"}],"entity-names.my-playlists":[{type:0,value:"Pleylistlarim"}],"entity-names.my-vibe":[{type:0,value:"Mening to‘lqinim"}],"entity-names.new-albums":[{type:0,value:"Yangi albomlar"}],"entity-names.new-albums-in-genre":[{type:0,value:"Bu janrdagi yangi albomlar"}],"entity-names.new-playlist":[{type:0,value:"Yangi pleylist"}],"entity-names.non-music-releases":[{type:0,value:"Relizlar"}],"entity-names.number-of-books":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"ta kitob"}]},many:{value:[{type:0,value:"ta kitob"}]},one:{value:[{type:0,value:"ta kitob"}]},other:{value:[{type:0,value:"ta kitob"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-chapters":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"bob"}]},many:{value:[{type:0,value:"bob"}]},one:{value:[{type:0,value:"bob"}]},other:{value:[{type:0,value:"bob"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-episodes":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"ta reliz"}]},many:{value:[{type:0,value:"ta reliz"}]},one:{value:[{type:0,value:"ta reliz"}]},other:{value:[{type:0,value:"ta reliz"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-more-artists":[{type:0,value:"va yana "},{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"ta ijrochi"}]},other:{value:[{type:0,value:"ta ijrochi"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-podcasts":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"ta podkast"}]},many:{value:[{type:0,value:"ta podkast"}]},one:{value:[{type:0,value:"ta podkast"}]},other:{value:[{type:0,value:"ta podkast"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-tracks":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"ta trek"}]},other:{value:[{type:0,value:"ta trek"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.other-album-versions":[{type:0,value:"Albomning boshqa versiyalari"}],"entity-names.other-albums-of-artist":[{type:0,value:"Ijrochining boshqa albomlari"}],"entity-names.percent":[{type:1,value:"value"},{type:0,value:"%"}],"entity-names.playlist":[{type:0,value:"Pleylist"}],"entity-names.playlist-name":[{type:1,value:"playlistName"},{type:0,value:" pleylisti"}],"entity-names.playlist-tracks-list":[{type:1,value:"playlistName"},{type:0,value:"” pleylisti taronalari roʻyxati"}],"entity-names.podcast":[{type:0,value:"Podkast"}],"entity-names.podcast-last-episodes":[{type:0,value:"So‘nggi versiyalar"}],"entity-names.podcast-name":[{type:0,value:"Podkast: "},{type:1,value:"podcastName"}],"entity-names.podcasts-and-books":[{type:0,value:"Kitob va podkastlar"}],"entity-names.popular-among-users":[{type:0,value:"Tinglovchilarda ommabop"}],"entity-names.popular-artists":[{type:0,value:"Mashhur ijrochilar"}],"entity-names.popular-playlists":[{type:0,value:"Mashhur pleylistlar"}],"entity-names.publisher":[{type:0,value:"Nashriyot"}],"entity-names.query-to-vibe-loading-description":[{type:0,value:"Lyumen kayfiyatingizni his qiladi"}],"entity-names.query-to-vibe-loading-title":[{type:0,value:"Men shunday his qilyapman..."}],"entity-names.recently-release":[{type:0,value:"Yangi reliz"}],"entity-names.releases":[{type:0,value:"Relizlar"}],"entity-names.search":[{type:0,value:"Qidiruv"}],"entity-names.season-number":[{type:1,value:"number"},{type:0,value:"-mavsum"}],"entity-names.similar-artists":[{type:0,value:"O‘xshash ijrochilar"}],"entity-names.similar-playlists":[{type:0,value:"Oʻxshash pleylistlar"}],"entity-names.singer":[{type:0,value:"Ijrochi"}],"entity-names.single":[{type:0,value:"Singl"}],"entity-names.single-available-with-plus":[{type:0,value:"Bu singl Plus opsiyasi bilan mavjud"}],"entity-names.source":[{type:0,value:"Manba: "},{type:1,value:"source"}],"entity-names.tags":[{type:0,value:"Teglar: "},{type:1,value:"tags"}],"entity-names.text":[{type:0,value:"Matn"}],"entity-names.top-artists":[{type:0,value:"Sizning oylik top"}],"entity-names.track":[{type:0,value:"Trek"}],"entity-names.track-in-playlist":[{type:0,value:"Bu pleylistda allaqachon mavjud"}],"entity-names.track-name":[{type:1,value:"trackName"},{type:0,value:" treki"}],"entity-names.track-name-by-type":[{options:{audiobook:{value:[{type:1,value:"name"},{type:0,value:" bobi"}]},comment:{value:[{type:1,value:"name"},{type:0,value:" soni"}]},fairy_tale:{value:[{type:1,value:"name"},{type:0,value:" bobi"}]},music:{value:[{type:1,value:"name"},{type:0,value:" treki"}]},other:{value:[{type:1,value:"name"},{type:0,value:" treki"}]},podcast_episode:{value:[{type:1,value:"name"},{type:0,value:" soni"}]}},type:5,value:"type"}],"entity-names.track-type":[{options:{audiobook:{value:[{type:0,value:"Bob"}]},comment:{value:[{type:0,value:"Qism"}]},fairy_tale:{value:[{type:0,value:"Bob"}]},music:{value:[{type:0,value:"Trek"}]},other:{value:[{type:0,value:"Trek"}]},podcast_episode:{value:[{type:0,value:"Qism"}]}},type:5,value:"type"}],"entity-names.tracks":[{type:0,value:"Treklar"}],"entity-names.tracks-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"ta trek"}]},many:{value:[{type:0,value:"ta trek"}]},one:{value:[{type:0,value:"ta trek"}]},other:{value:[{type:0,value:"ta trek"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.trailer":[{type:0,value:"Treyler"}],"entity-names.upcoming-album-date":[{type:1,value:"releaseDate"},{type:0,value:" kuni chiqadi"}],"entity-names.upcoming-album-name":[{type:0,value:"Kutilayotgan reliz "},{type:1,value:"upcomingAlbumName"}],"entity-names.upcoming-album-play-disabled":[{type:0,value:"Ijro etish uchun yaqinda chiqadigan relizni kutish kerak"}],"entity-names.upcoming-albums":[{type:0,value:"Kelgusi relizlar"}],"entity-names.upcoming-albums-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"ta kelgusi reliz"}]},many:{value:[{type:0,value:"ta kelgusi reliz"}]},one:{value:[{type:0,value:"ta kelgusi reliz"}]},other:{value:[{type:0,value:"ta kelgusi reliz"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.vibe-name":[{type:0,value:"Mening toʻlqinim "},{type:1,value:"vibeName"}],"entity-names.vibe-room-name":[{type:0,value:"Mening toʻlqinim "},{type:1,value:"name"},{type:0,value:". Holati "},{type:1,value:"status"}],"equalizer.amp-label":[{type:1,value:"value"},{type:0,value:"dB"}],"equalizer.bass-and-treble-boost-preset":[{type:0,value:"Yuqori va quyi chastotalarni kuchaytirish"}],"equalizer.bass-boost-preset":[{type:0,value:"QCh kuchayishi"}],"equalizer.classical-preset":[{type:0,value:"Klassik musiqa"}],"equalizer.club-preset":[{type:0,value:"Klub musiqasi"}],"equalizer.concert-preset":[{type:0,value:"Konsert"}],"equalizer.custom-preset":[{type:0,value:"O‘zining sozlamasi"}],"equalizer.dance-preset":[{type:0,value:"Raqsbop musiqa"}],"equalizer.default-preset":[{type:0,value:"Sukut bo‘yicha"}],"equalizer.disable-equalizer":[{type:0,value:"Ekvalayzerni faolsizlantirish"}],"equalizer.disabled":[{type:0,value:"Oʻchiq"}],"equalizer.enable":[{type:0,value:"Yoqish"}],"equalizer.enable-equalizer":[{type:0,value:"Ekvalayzerni yoqish"}],"equalizer.enabled":[{type:0,value:"Yoniq"}],"equalizer.frequency-label":[{type:1,value:"value"},{type:0,value:"k"}],"equalizer.large-hall-preset":[{type:0,value:"Katta zal"}],"equalizer.party-preset":[{type:0,value:"Bazm"}],"equalizer.pop-preset":[{type:0,value:"Pop"}],"equalizer.preamp-level":[{type:0,value:"daraja"}],"equalizer.reggae-preset":[{type:0,value:"Reggi"}],"equalizer.rock-preset":[{type:0,value:"Rok"}],"equalizer.ska-preset":[{type:0,value:"Yuk"}],"equalizer.slider-frequency-label":[{type:0,value:"Detsibelni "},{type:1,value:"label"},{type:0,value:" "},{type:1,value:"value"},{type:0,value:" detsibel chastotaga oʻzgartirish"}],"equalizer.slider-preamp-label":[{type:0,value:"Oldindan kuchaytirish koeffisiyenti"}],"equalizer.soft-preset":[{type:0,value:"Yumshoq ovoz"}],"equalizer.soft-rock-preset":[{type:0,value:"Qattiq-rok"}],"equalizer.speakers-preset":[{type:0,value:"Noutbuk karnaylari"}],"equalizer.techno-preset":[{type:0,value:"Texno"}],"equalizer.title":[{type:0,value:"Ekvalayzer"}],"equalizer.treble-boost-preset":[{type:0,value:"Yuqori chastotalarni kuchaytirish"}],"error-messages.empty-artist-familiar-collection-title":[{type:0,value:"Sizda hozircha Termadagi ijrochining treki yo‘q"}],"error-messages.empty-artist-familiar-vibe-title":[{type:0,value:"Siz hali Mening to‘lqinimda ijrochining treklarini tinglamadingiz"}],"error-messages.empty-collection-albums":[{type:0,value:"Albomlarga layk bosing va ular bu yerda aks etadi"}],"error-messages.empty-collection-albums-description":[{type:0,value:"Singl va albomlar bu yerda chiqishi uchun ularga layk bosing"}],"error-messages.empty-collection-albums-title":[{type:0,value:"Sizda Termalarda albomlar yoʻq"}],"error-messages.empty-collection-artists-title":[{type:0,value:"Ijrochilarga layk bosing va ular bu yerda aks etadi"}],"error-messages.empty-collection-clips-text":[{type:0,value:"Hozircha – tavsiyalarimiz bilan tanishing"}],"error-messages.empty-collection-clips-title":[{type:0,value:"Kliplarga layk bosing, shunda ular bu yerda chiqadi"}],"error-messages.empty-collection-kids-sub-page-link":[{type:0,value:"Bolalar boʻlimiga oʻtish"}],"error-messages.empty-collection-kids-sub-page-title":[{type:0,value:"Qoʻshiq va podkastlarga layk bosing va ular shu yerda koʻrinadi"}],"error-messages.empty-collection-liked-playlists":[{type:0,value:"Pleylistlarga layk bosing va ular bu yerda koʻrinadi"}],"error-messages.empty-collection-playlist-description":[{type:0,value:"Treklarni qidiruv orqali topish mumkin"}],"error-messages.empty-collection-playlist-title":[{type:0,value:"Treklarni pleylistga kiriting"}],"error-messages.empty-collection-podcasts":[{type:0,value:"Podkastlarga layk bosing va ular bu yerda chiqadi"}],"error-messages.empty-collection-podcasts-and-books":[{type:0,value:"Temalaringizda podkastlar va kitoblar yoʻq"}],"error-messages.empty-collection-upcoming-albums-title":[{type:0,value:"Ijrochilarning sahifalari kelgusi relizlariga layklar bosing va ular bu yerda koʻrinadi"}],"error-messages.empty-collection-vibe-rooms-title":[{type:0,value:"Havolani ulashing va didlaringizni uygʻunlashtiradigan ikki kishilik Mening toʻlqinimni tinglang. Shaxsiy tavsiyalar oʻzgarmaydi"}],"error-messages.empty-shelf-liked-page-link":[{type:0,value:"Podkastlarga oʻtish"}],"error-messages.empty-shelf-liked-page-title":[{type:0,value:"Podkastlarni tinglash va layk bosishni boshlang va ular bu yerda chiqadi"}],"error-messages.empty-shelf-new-episodes-text":[{type:0,value:"Biz siz tinglagan podkastning yangi sonini sizga qoʻshgunimizga qadar"}],"error-messages.empty-shelf-new-episodes-title":[{type:0,value:"Podkastlarga layk bosing va shunda yangi sonlari shu yerda chiqadi"}],"error-messages.empty-shelf-new-episodes-title-no-tracks":[{type:0,value:"Podkastlarni tinglashni va layk bosishni boshlang va ular shu yerda chiqadi"}],"error-messages.empty-shelf-page-title":[{type:0,value:"Podkastlar tinglashni boshlang va ular shu yerda chiqadi"}],"error-messages.error-during-action":[{type:0,value:"Amalni bajarishda xatolik yuz berdi"}],"error-messages.error-during-initial-loading":[{type:0,value:"Ishga tushirishda maʼlumotlarning bir qismi olinmadi"}],"error-messages.error-load-part-page":[{type:0,value:"Sahifaning bir qismi yuklab olinmadi"}],"error-messages.error-load-wizard":[{type:0,value:"Xatolik yuz berdi. Ijrochilar tanloviga keyinroq qayting."}],"error-messages.multivibe-create-link":[{type:0,value:"Havola yaratilmadi. Qayta urining"}],"error-messages.something-went-wrong":[{type:0,value:"Nimadir xato ketdi"}],"extra-explicit.confirm-unsafe-album":[{type:0,value:"Albomga"}],"extra-explicit.confirm-unsafe-artist":[{type:0,value:"Ijrochiga"}],"extra-explicit.confirm-unsafe-audiobook":[{type:0,value:"Audio kitobga"}],"extra-explicit.confirm-unsafe-clip":[{type:0,value:"Klipni ochish"}],"extra-explicit.confirm-unsafe-podcast":[{type:0,value:"Podkastga"}],"extra-explicit.confirm-unsafe-track":[{type:0,value:"Trek"}],"extra-explicit.explicit-mark":[{type:0,value:"Kontent bolalar uchun emas"}],"extra-explicit.play-unavailable":[{type:0,value:"Ijro qilish imkonsiz"}],"extra-explicit.reject-unsafe-entity":[{type:0,value:"Tinglamayman"}],"family.about":[{type:0,value:"Multi-obuna haqida batafsil"}],"family.about1":[{type:0,value:"Multi-obuna haqida"}],"family.accept":[{type:0,value:"Qabul qilish"}],"family.go-to-music":[{type:0,value:"Musiqani ochish"}],"family.info-description":[{type:0,value:"Musiqa tinglang va oilaviy multi-obuna orqali yaqinlaringiz bilan"},{type:1,value:"br"},{type:0,value:"Plusning boshqa"},{type:1,value:"br"},{type:0,value:"imtiyozlaridan foydalaning"}],"family.info-title":[{type:0,value:"Sizni Yandex Plusga"},{type:1,value:"br"},{type:0,value:"taklif qilishmoqda"}],"family.invitation-error-description":[{type:0,value:"Taklif bekor qilingan yoki sizni taklif qilgan foydalanuvchining multi-obunasida barcha joylar band boʻlishi mumkin"}],"family.invitation-error-title":[{type:0,value:"Taklif haqiqiy emas"}],"family.later":[{type:0,value:"Keyinroq"}],"family.reject":[{type:0,value:"Rad etish"}],"family.retry":[{type:0,value:"Takrorlash"}],"family.subscription-error-description":[{type:0,value:"Sizni taklif qilgan foydalanuvchi bilan aloqaga chiqishga urining yoki musiqani hoziroq tinglash uchun oʻz Plusingizni yoqing"}],"family.subscription-error-title":[{type:0,value:"Multi-obuna mavjud emas"}],"family.success-description":[{type:0,value:"Siz Yandex Music, Kinopoisk"},{type:1,value:"br"},{type:0,value:"va Yandex xizmati ballar bilan keshbekdan foydalanishingiz mumkin"}],"family.success-title":[{type:0,value:"Siz endi Plus’dasiz!"}],"family.terms":[{type:0,value:"Multi-obuna shartlari"}],"family.unknown-error-description":[{type:0,value:"Muammo nimada ekanligini aniq bilmaymiz. Internetni tekshiring va qayta urinib ko‘ring"}],"family.unknown-error-title":[{type:0,value:"Taklifni qabul qilib bo‘lmadi"}],"faq.title":[{type:0,value:"Tez-tez beriladigan savollarga javoblar"}],"footer.disclaimer-content":[{type:0,value:"Yandex Music – musiqiy tavsiyalar aniqligi boʻyicha eng aniq tizim. 2025-yil aprel holatiga koʻra, RF hududida musiqiy striming xizmatlari orasida foydalanuvchilar uchun shaxsiy tavsiyalarni tanlash aniqligi boʻyicha. Ma’lumotlar “Mail Data” MChJ tomonidan Romir Yagona maʼlumotlar paneli asosida 18–59 yoshdagi respondentlar oʻrtasida oʻtkazilgan soʻrov natijalariga asoslangan. "},{type:0,value:"<br/>"},{type:0,value:"<br/>"},{type:0,value:" Yandex Music xizmatida voyaga yetmaganlar uchun moʻljallanmagan maʼlumotlar boʻlishi mumkin. Bunday materiallar (!) belgisi bilan koʻrsatiladi. Giyohvandlik vositalari, psixotrop moddalar, ularning analoglarini qonunga xilof ravishda isteʼmol qilish sogʻliqqa zarar yetkazadi, ularning noqonuniy muomalasi taqiqlanadi va qonun hujjatlarida belgilangan javobgarlikka sabab boʻladi"}],"footer.explicit-content":[{type:0,value:"Yandex Music xizmatida voyaga yetmaganlarga mo‘ljallanmagan axborot bo‘lishi mumkin"}],"footer.links-copyright-holders":[{type:0,value:"Mualliflik huquqi egalari"}],"footer.links-help":[{type:0,value:"Yandex Support"}],"footer.links-privacy-policy":[{type:0,value:"Maxfiylik siyosati"}],"footer.links-recommendation-rules":[{type:0,value:"Tavsiyalar qoidalari"}],"footer.links-terms":[{type:0,value:"Foydalanuvchi bilan kelishuv"}],"footer.yandex-music":[{type:0,value:"Yandex Music"}],"footer.yandex-project":[{type:0,value:"Yandex kompaniyasi loyihasi"}],"future-feature.message":[{type:0,value:"Bu funksiya hozircha ishlab chiqish jarayonida, lekin tez orada mavjud bo‘ladi."}],"interface-actions.add-track-to-playlist":[{type:0,value:"Trekni pleylistga kiritish"}],"interface-actions.add-tracks-to-playlist":[{type:0,value:"Boshqa pleylistga qoʻshish"}],"interface-actions.cancel":[{type:0,value:"Bekor qilish"}],"interface-actions.change":[{type:0,value:"O‘zgartirish"}],"interface-actions.clear":[{type:0,value:"Tozalash"}],"interface-actions.close":[{type:0,value:"Yopish"}],"interface-actions.close-ad":[{type:0,value:"Reklamani yopish"}],"interface-actions.close-my-vibe-settings":[{type:0,value:"Sozlamalar menyusini yopish"}],"interface-actions.close-quality-settings":[{type:0,value:"Ovoz sozlamasi menyusini yopish"}],"interface-actions.configure-my-vibe":[{type:0,value:"Sozlash"}],"interface-actions.confirm":[{type:0,value:"Tushunarli"}],"interface-actions.context-menu":[{type:0,value:"Kontekst menyusi"}],"interface-actions.context-menu-artists":[{type:0,value:"Ijrochilar bor kontekst menyu"}],"interface-actions.copy-iframe":[{type:0,value:"HTML-kod"}],"interface-actions.copy-link":[{type:0,value:"Havolani nusxalash"}],"interface-actions.create":[{type:0,value:"Yaratish"}],"interface-actions.date-today":[{type:0,value:"Bugun"}],"interface-actions.date-yesterday":[{type:0,value:"Kecha"}],"interface-actions.delete-multivibe":[{type:0,value:"Ikki kishilik Mening toʻlqinimni tark etish"}],"interface-actions.do-not-like":[{type:0,value:"Yoqmaydi"}],"interface-actions.edit":[{type:0,value:"Tahrirlash"}],"interface-actions.editorial-tools":[{type:0,value:"Tahririyat vositalari"}],"interface-actions.further":[{type:0,value:"Davom etish"}],"interface-actions.go-to-collection":[{type:0,value:"Termaga kirish"}],"interface-actions.hide-sync-lyrics":[{type:0,value:"Matnli musiqani berkitish"}],"interface-actions.like":[{type:0,value:"Yoqadi"}],"interface-actions.mark-all-listened":[{type:0,value:"Hammasi tinglandi"}],"interface-actions.mark-all-non-listened":[{type:0,value:"Hech biri tinglanmadi"}],"interface-actions.mark-listened":[{type:0,value:"Tinglandi"}],"interface-actions.mark-non-listened":[{type:0,value:"Tinglanmadi"}],"interface-actions.more":[{type:0,value:"Yana"}],"interface-actions.more-details":[{type:0,value:"Batafsil axborot bilan tanishing"}],"interface-actions.my-vibe-context-settings":[{type:0,value:"Mashg‘ulot asosida"}],"interface-actions.my-vibe-settings":[{type:0,value:"Mening toʻlqinimni sozlash"}],"interface-actions.navigate-to-admin":[{type:0,value:"Admin kabinetiga kirish"}],"interface-actions.navigate-to-album":[{type:0,value:"Albomga oʻtish"}],"interface-actions.navigate-to-artist":[{type:0,value:"Ijrochiga oʻtish"}],"interface-actions.navigate-to-artists":[{type:0,value:"Ijrochilarga o‘tish"}],"interface-actions.navigate-to-track":[{type:0,value:"Trekka oʻtish"}],"interface-actions.open-lyrics":[{type:0,value:"Qo‘shiq matnini ko‘rsatish"}],"interface-actions.open-play-queue":[{type:0,value:"Navbatni ochish"}],"interface-actions.open-sync-lyrics":[{type:0,value:"Matnli musiqani yoqish"}],"interface-actions.pin":[{type:0,value:"Qadash"}],"interface-actions.pin-my-vibe":[{type:0,value:"Mening toʻlqinimni qadash"}],"interface-actions.playlist-made-date":[{type:0,value:"Yigʻilgan sana: "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"“d MMMM”",type:1},type:3,value:"updateDate"}],"interface-actions.playlist-made-date-with-year":[{type:0,value:"Yigʻilgan sana: "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"}],"interface-actions.playlist-made-for-date":[{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d-MMMM\"",type:1},type:3,value:"updateDate"},{type:0,value:" kuni "},{type:1,value:"playlistReceiver"},{type:0,value:" uchun jamlandi"}],"interface-actions.playlist-made-for-date-with-year":[{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d-MMMM y\"",type:1},type:3,value:"updateDate"},{type:0,value:" kuni "},{type:1,value:"playlistReceiver"},{type:0,value:" uchun jamlandi"}],"interface-actions.playlist-made-for-today":[{type:0,value:"Bugun "},{type:1,value:"playlistReceiver"},{type:0,value:" uchun jamlandi"}],"interface-actions.playlist-made-for-yesterday":[{type:0,value:"Kecha "},{type:1,value:"playlistReceiver"},{type:0,value:" uchun jamlandi"}],"interface-actions.playlist-made-today":[{type:0,value:"Bugun yigʻilgan"}],"interface-actions.playlist-made-yesterday":[{type:0,value:"Kecha yigʻilgan"}],"interface-actions.quality":[{type:0,value:"Sifat"}],"interface-actions.reload-part-page":[{type:0,value:"Sahifaning bir qismini qayta yuklash"}],"interface-actions.rename":[{type:0,value:"Nomini o‘zgartirish"}],"interface-actions.report-problem":[{type:0,value:"Muammo haqida xabar berish"}],"interface-actions.reset-context":[{type:1,value:"context"},{type:0,value:" asliga qaytarish va Mening toʻlqinim funksiyasini yoqish"}],"interface-actions.reset-my-vibe-settings":[{type:0,value:"Asliga qaytarish"}],"interface-actions.reset-search-input":[{type:0,value:"Qidiruvni tozalash"}],"interface-actions.save":[{type:0,value:"Saqlash"}],"interface-actions.share":[{type:0,value:"Ulashish"}],"interface-actions.show-duplicates":[{type:0,value:"Takrorlarni chiqarish"}],"interface-actions.show-genres":[{type:0,value:"Janrlarni koʻrsatish"}],"interface-actions.show-majors":[{type:0,value:"Majors chiqarish"}],"interface-actions.speed":[{type:0,value:"Ijro tezligi "},{type:1,value:"speed"},{type:0,value:" "}],"interface-actions.subscribe":[{type:0,value:"Podkastga obuna qilish"}],"interface-actions.subscribed":[{type:0,value:"Obuna qilingan"}],"interface-actions.unpin":[{type:0,value:"Yechish"}],"interface-actions.unpin-my-vibe":[{type:0,value:"Mening toʻlqinimni yechib olish"}],"interface-actions.updated-anonymously-playlist-date":[{type:0,value:"Pleylist yangilangan sana: "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"}],"interface-actions.updated-anonymously-playlist-date-with-year":[{type:0,value:"Pleylist yangilangan sana: "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"}],"interface-actions.updated-anonymously-playlist-today":[{type:0,value:"Pleylist bugun yangilangan"}],"interface-actions.updated-anonymously-playlist-yesterday":[{type:0,value:"Pleylist kecha yangilangan"}],"interface-actions.updated-playlist-date":[{type:1,value:"ownerName"},{type:0,value:" "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d-MMMM\"",type:1},type:3,value:"updateDate"},{type:0,value:" sanasida pleylistni "},{options:{female:{value:[{type:0,value:"обновила"}]},male:{value:[{type:0,value:"обновил"}]},other:{value:[{type:0,value:"обновил"}]}},type:5,value:"gender"}],"interface-actions.updated-playlist-date-with-year":[{type:1,value:"ownerName"},{type:0,value:" "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"y d-MMMM\"",type:1},type:3,value:"updateDate"},{type:0,value:" sanasida pleylistni "},{options:{female:{value:[{type:0,value:"обновила"}]},male:{value:[{type:0,value:"обновил"}]},other:{value:[{type:0,value:"обновил"}]}},type:5,value:"gender"}],"interface-actions.updated-playlist-today":[{type:1,value:"ownerName"},{type:0,value:" bugun pleylistni "},{options:{female:{value:[{type:0,value:"обновила"}]},male:{value:[{type:0,value:"обновил"}]},other:{value:[{type:0,value:"обновил"}]}},type:5,value:"gender"}],"interface-actions.updated-playlist-yesterday":[{type:1,value:"ownerName"},{type:0,value:" kecha pleylistni "},{options:{female:{value:[{type:0,value:"обновила"}]},male:{value:[{type:0,value:"обновил"}]},other:{value:[{type:0,value:"обновил"}]}},type:5,value:"gender"}],"interface-actions.xlsx-download":[{type:0,value:"Excel-faylni yuklab olish"}],"kids.albums-and-podcasts":[{type:0,value:"Albom, podkast va ertaklar"}],"kids.empty-collection-text":[{type:0,value:"Bolalar taronalari va ertaklariga layk bosing, ular shu yerda chiqadi"}],"kids.favourite-tracks-and-episodes":[{type:0,value:"Sevimli taronalar va relizlar"}],"kids.for-kids":[{type:0,value:"Bolalar uchun"}],"lite-version.description":[{type:0,value:"Vizual effektlar va animatsiyalar yengillashtirilgan formatda yuklanadi"}],"lite-version.go-to-settings":[{type:0,value:"Sozlamalar"}],"lite-version.notification-title":[{type:0,value:"Lite versiya yoqilgan"}],"lite-version.title":[{type:0,value:"Lite versiyani yoqish"}],"loading-messages.concert-is-loading":[{type:0,value:"Konsert yuklanmoqda"}],"loading-messages.content-is-loading":[{type:0,value:"Kontent yuklanmoqda"}],"loading-messages.entity-is-loading":[{type:1,value:"entityName"},{type:0,value:" yuklanmoqda"}],"mixes.albums-list":[{type:0,value:"“"},{type:1,value:"genreName"},{type:0,value:"” termasi albomlari roʻyxati"}],"mixes.playlists-list":[{type:0,value:"“"},{type:1,value:"genreName"},{type:0,value:"” termasi pleylistlari roʻyxati"}],"multivibe.enabled-room-modal-button-text":[{type:0,value:"Tinglash"}],"multivibe.enabled-room-modal-description":[{type:0,value:"Birlashtirilgan tavsiyalar bilan Mening toʻlqinimni tinglang"}],"multivibe.enabled-room-modal-title":[{type:0,value:"Ikki kishilik Mening toʻlqinim allaqachon yaratilgan"}],"multivibe.go-to-collection-button-text":[{type:0,value:"Termalarga"}],"multivibe.invite-modal-draft-description":[{type:0,value:"Taklif qabul qilingach, ikki kishilik Mening toʻlqinim Termalaringizda paydo boʻladi"}],"multivibe.invite-modal-draft-title":[{type:0,value:"Taklif hali qabul qilinmagan"}],"multivibe.invite-modal-invalid-button-text":[{type:0,value:"Yaratish"}],"multivibe.invite-modal-invalid-description":[{type:0,value:"Yangi taklif yuborishlarini soʻrang yoki ikki kishilik Mening toʻlqinimni yarating"}],"multivibe.invite-modal-invalid-title":[{type:0,value:"Bu taklif endi amal qilmaydi"}],"multivibe.invite-modal-valid-button-text":[{type:0,value:"Qo‘shilish"}],"multivibe.invite-modal-valid-description":[{type:0,value:"Didlaringizni uygʻunlashtiradigan Mening toʻlqinimni tinglang. Shaxsiy tavsiyalar&nbsp;oʻzgarmaydi"}],"multivibe.invite-modal-valid-title":[{type:1,value:"name"},{type:0,value:" sizni ikki kishilik Mening to‘lqinimga taklif qilmoqda"}],"multivibe.link-successfully-copied":[{type:0,value:"Ikki kishilik Mening toʻlqinim havolasi nusxalandi"}],"multivibe.modal-subtitle":[{type:0,value:"Sizning haqiqiy aloqangiz"}],"multivibe.nda":[{type:0,value:"NDA"}],"multivibe.only-member-modal-description":[{type:0,value:"Ikki kishilik Mening toʻlqinimni tinglash uchun havolani qayta ulashing"}],"multivibe.only-member-modal-title":[{type:0,value:"Bu ikki kishilik Mening toʻlqinimda faqat siz"}],"multivibe.promo-modal-co-brand-a11y":[{type:0,value:"Beeline koʻmagida mavjud"}],"multivibe.promo-modal-description":[{type:0,value:"Havolani ulashing va didlaringizni uygʻunlashtiradigan Mening toʻlqinimni tinglang. Shaxsiy tavsiyalar oʻzgarmaydi"}],"multivibe.promo-modal-title":[{type:0,value:"Mening toʻlqinim ikki kishilik"}],"multivibe.room-limit-exceeded-description":[{type:0,value:"Siz allaqachon 50 ta ikki kishilik Mening toʻlqinimni yaratdingiz. Yangisini yaratish uchun mavjudlaridan birini tark eting"}],"multivibe.room-limit-exceeded-title":[{type:0,value:"Juda koʻp ikkinchi yarimta!"}],"multivibe.room-status-disabled":[{type:0,value:"faol emas"}],"multivibe.room-status-enabled":[{type:0,value:"faol"}],"multivibe.room-unavailable":[{type:0,value:"Boshqa mavjud emas"}],"music-history.album":[{type:0,value:"Albom"}],"music-history.artist":[{type:0,value:"Ijrochi"}],"music-history.empty-title":[{type:0,value:"U yerda siz oxirgi vaqtda tinglagan barcha narsani topasiz"}],"music-history.my-vibe":[{type:0,value:"Mening to‘lqinim"}],"music-history.playlist":[{type:0,value:"Pleylist"}],"music-history.search":[{type:0,value:"Qidiruv natijalari"}],"music-history.shuffle":[{type:0,value:"Aralash tinglandi"}],"music-history.title":[{type:0,value:"Tarix"}],"navigation.best-recommendations":[{type:0,value:"Eng aniq tavsiyalar"}],"navigation.go-back":[{type:0,value:"Orqaga qaytish"}],"navigation.go-forward":[{type:0,value:"Oldinga qaytish"}],"navigation.go-home":[{type:0,value:"Yandex Music ilovasiga oʻtish"}],"navigation.main-menu":[{type:0,value:"Bosh menyu"}],"navigation.page-collection":[{type:0,value:"Terma"}],"navigation.page-for-you-and-trends":[{type:0,value:"Siz uchun va trendlar"}],"navigation.page-main":[{type:0,value:"Bosh sahifa"}],"navigation.page-my-vibe":[{type:0,value:"Mening toʻlqinim"}],"navigation.page-plus":[{type:0,value:"Sizning Plusingiz"}],"navigation.pins-list":[{type:0,value:"Qadalgan"}],"navigation.search":[{type:0,value:"Qidiruv"}],"non-music.audiobook-artist":[{type:0,value:"O‘quvchi"}],"non-music.audiobook-artists":[{type:0,value:"O‘quvchilar"}],"non-music.audiobook-list":[{type:0,value:"“"},{type:1,value:"albumName"},{type:0,value:"” audio kitobi sarlavhasi"}],"non-music.audiobook-tab-about":[{type:0,value:"Kitob haqida"}],"non-music.audiobook-tab-tracks":[{type:0,value:"Sarlavha"}],"non-music.book-available-with-plus":[{type:0,value:"Bu kitob Plus opsiyasi bilan mavjud"}],"non-music.continue-listen-landing-block-title":[{type:0,value:"Tinglashda davom etish"}],"non-music.fairy-tale-available-with-plus":[{type:0,value:"Bu ertak Plus opsiyasi bilan mavjud"}],"non-music.fairytale-tab-about":[{type:0,value:"Ertak haqida"}],"non-music.navigate-to-book-album":[{type:0,value:"Kitobga o‘tish"}],"non-music.navigate-to-clip":[{type:0,value:"Klipga oʻtish"}],"non-music.navigate-to-podcast-album":[{type:0,value:"Podkastga o‘tish"}],"non-music.non-music-progress":[{type:0,value:"Tinglash jarayoni "},{type:1,value:"progress"},{type:0,value:"%, "},{options:{"0":{value:[]},other:{value:[{type:1,value:"beginHours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"soat"}]},many:{value:[{type:0,value:"soat"}]},one:{value:[{type:0,value:"soat"}]},other:{value:[{type:0,value:"soat"}]}},pluralType:"cardinal",type:6,value:"beginHours"}]}},type:5,value:"beginHours"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"beginMinutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"daqiqa"}]},many:{value:[{type:0,value:"daqiqa"}]},one:{value:[{type:0,value:"daqiqa"}]},other:{value:[{type:0,value:"daqiqa"}]}},pluralType:"cardinal",type:6,value:"beginMinutes"}]}},type:5,value:"beginMinutes"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"beginSeconds"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"soniya"}]},many:{value:[{type:0,value:"soniya"}]},one:{value:[{type:0,value:"soniya"}]},other:{value:[{type:0,value:"soniya"}]}},pluralType:"cardinal",type:6,value:"beginSeconds"}]}},type:5,value:"beginSeconds"},{type:0,value:", jami "},{options:{"0":{value:[]},other:{value:[{type:1,value:"endHours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"soat"}]},many:{value:[{type:0,value:"soat"}]},one:{value:[{type:0,value:"soat"}]},other:{value:[{type:0,value:"soat"}]}},pluralType:"cardinal",type:6,value:"endHours"}]}},type:5,value:"endHours"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"endMinutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"daqiqa"}]},many:{value:[{type:0,value:"daqiqa"}]},one:{value:[{type:0,value:"daqiqa"}]},other:{value:[{type:0,value:"daqiqa"}]}},pluralType:"cardinal",type:6,value:"endMinutes"}]}},type:5,value:"endMinutes"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"endSeconds"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"soniya"}]},many:{value:[{type:0,value:"soniya"}]},one:{value:[{type:0,value:"soniya"}]},other:{value:[{type:0,value:"soniya"}]}},pluralType:"cardinal",type:6,value:"endSeconds"}]}},type:5,value:"endSeconds"},{type:0,value:"."}],"non-music.podcast-available-with-plus":[{type:0,value:"Bu podkast Plus opsiyasi bilan mavjud"}],"non-music.shelf-subscribe":[{type:0,value:"Javonga olib qo‘yish"}],"non-music.shelf-unsubscribe":[{type:0,value:"Javondan olib tashlash"}],"notifications-info.added-audiobook-episode-to-playlist":[{type:1,value:"trackName"},{type:0,value:" bobi “"},{type:1,value:"playlistName"},{type:0,value:"” pleylistiga qoʻshildi"}],"notifications-info.added-podcast-episode-to-playlist":[{type:1,value:"trackName"},{type:0,value:" relizi “"},{type:1,value:"playlistName"},{type:0,value:"” pleylistiga qoʻshildi"}],"notifications-info.added-to":[{type:0,value:"bunga kiritildi:"}],"notifications-info.added-track-to-playlist":[{type:1,value:"trackName"},{type:0,value:" nomli trek «"},{type:1,value:"playlistName"},{type:0,value:"» pleylistiga qoʻshildi"}],"notifications-info.added-tracks-to-playlist":[{type:0,value:"Treklar “"},{type:1,value:"playlistName"},{type:0,value:"” pleylistiga qoʻshildi"}],"notifications-info.album-added-to-collection":[{type:1,value:"entity"},{type:0,value:" albomi "},{children:[{type:0,value:"Termaga"}],type:8,value:"collection"},{type:0,value:" qoʻshildi"}],"notifications-info.album-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" albomi Termaga qo‘shildi"}],"notifications-info.album-link":[{type:0,value:"Albomga havola"}],"notifications-info.album-pinned-in-menu":[{type:1,value:"entity"},{type:0,value:" albomi yon menyuga mahkamlandi"}],"notifications-info.album-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" albomi "},{children:[{type:0,value:"Termadan"}],type:8,value:"collection"},{type:0,value:" oʻchirildi"}],"notifications-info.album-removed-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" albomi Termadan o‘chirildi"}],"notifications-info.album-unpinned-from-menu":[{type:1,value:"entity"},{type:0,value:" albomi yon menyudan oʻchirildi"}],"notifications-info.already-added-tracks":[{type:0,value:"Barcha treklar ushbu pleylistga qoʻshilgan"}],"notifications-info.artist-added-to-collection":[{type:1,value:"entity"},{type:0,value:" ijrochisi "},{children:[{type:0,value:"Termaga"}],type:8,value:"collection"},{type:0,value:" qoʻshildi"}],"notifications-info.artist-added-to-collection-aria-label":[{type:0,value:"Ijrochi "},{type:1,value:"entity"},{type:0,value:" Termaga qo‘shildi"}],"notifications-info.artist-available-in-recommendations":[{type:0,value:"Endi bu ijrochi tavsiyalaringizda chiqib turadi"}],"notifications-info.artist-link":[{type:0,value:"Ijrochiga havola"}],"notifications-info.artist-pinned-in-menu":[{type:1,value:"entity"},{type:0,value:" ijrochisi yon menyuga mahkamlandi"}],"notifications-info.artist-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" ijrochisi "},{children:[{type:0,value:"Termadan"}],type:8,value:"collection"},{type:0,value:" oʻchirildi"}],"notifications-info.artist-removed-from-collection-aria-label":[{type:0,value:"Ijrochi "},{type:1,value:"entity"},{type:0,value:" Termadan o‘chirildi"}],"notifications-info.artist-unavailable-in-recommendations":[{type:0,value:"Endi bu ijrochi tavsiyalaringizda chiqib qolmaydi"}],"notifications-info.artist-unpinned-from-menu":[{type:1,value:"entity"},{type:0,value:" ijrochisi yon menyudan oʻchirildi"}],"notifications-info.audiobook-added-to-collection":[{type:1,value:"entity"},{type:0,value:" audio kitobi "},{children:[{type:0,value:"Termaga"}],type:8,value:"collection"},{type:0,value:" qoʻshildi"}],"notifications-info.audiobook-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" audiokitobi Termaga qo‘shildi"}],"notifications-info.audiobook-episode-added-to-shelf":[{type:1,value:"entity"},{type:0,value:" bobi "},{children:[{type:0,value:"Termaga"}],type:8,value:"collection"},{type:0,value:" kiritildi"}],"notifications-info.audiobook-episode-added-to-shelf-aria-label":[{type:1,value:"entity"},{type:0,value:" bobi Termaga qo‘shildi"}],"notifications-info.audiobook-episode-available-in-recommendations":[{type:0,value:"Endi bob sizning tavsiyalaringizda chiqishi mumkin"}],"notifications-info.audiobook-episode-removed-from-shelf":[{type:1,value:"entity"},{type:0,value:" bobi "},{children:[{type:0,value:"Termadan"}],type:8,value:"collection"},{type:0,value:" oʻchirildi"}],"notifications-info.audiobook-episode-removed-from-shelf-aria-label":[{type:1,value:"entity"},{type:0,value:" bobi Termadan o‘chirildi"}],"notifications-info.audiobook-episode-unavailable-in-recommendations":[{type:0,value:"Endi bu bob sizning tavsiyalaringizda chiqmaydi"}],"notifications-info.audiobook-pinned-in-menu":[{type:1,value:"entity"},{type:0,value:" audio kitobi yon menyuga mahkamlandi"}],"notifications-info.audiobook-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" audio kitobi "},{children:[{type:0,value:"Termadan"}],type:8,value:"collection"},{type:0,value:" oʻchirildi"}],"notifications-info.audiobook-removed-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" audiokitobi Termadan o‘chirildi"}],"notifications-info.audiobook-unpinned-from-menu":[{type:1,value:"entity"},{type:0,value:" audio kitobi yon menyudan oʻchirildi"}],"notifications-info.change-repeat-context":[{type:0,value:"Pleylistni takrorlash yoniq"}],"notifications-info.change-repeat-none":[{type:0,value:"Takrorlash oʻchiq"}],"notifications-info.change-repeat-track":[{type:0,value:"Trekni takrorlash yoniq"}],"notifications-info.clip-added-to-collection":[{type:1,value:"entity"},{type:0,value:" klipi "},{children:[{type:0,value:"Termaga"}],type:8,value:"collection"},{type:0,value:" kiritildi"}],"notifications-info.clip-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" klipi Termaga kiritildi"}],"notifications-info.clip-link":[{type:0,value:"Klipga havola"}],"notifications-info.clip-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" klipi "},{children:[{type:0,value:"Termadan"}],type:8,value:"collection"},{type:0,value:" olib tashlandi"}],"notifications-info.clip-removed-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" klipi Termadan olib tashlandi"}],"notifications-info.concert-link":[{type:0,value:"Konsertga havola"}],"notifications-info.copied":[{type:0,value:"nusxalandi"}],"notifications-info.entity-pinned-in-menu":[{type:1,value:"description"},{type:0,value:" "},{type:1,value:"entity"},{type:0,value:" endi yon menyuda"}],"notifications-info.entity-unpinned-from-menu":[{type:0,value:"\n"},{type:1,value:"description"},{type:0,value:" "},{type:1,value:"entity"},{type:0,value:" endi yon menyuda emas"}],"notifications-info.fairytale-added-to-collection":[{type:1,value:"entity"},{type:0,value:" ertagi "},{children:[{type:0,value:"Termaga"}],type:8,value:"collection"},{type:0,value:" qo‘shildi"}],"notifications-info.fairytale-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" ertagi Termaga qo‘shildi"}],"notifications-info.fairytale-pinned-in-menu":[{type:1,value:"entity"},{type:0,value:" ertagi yon menyuga qadaldi"}],"notifications-info.fairytale-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" ertagi "},{children:[{type:0,value:"Termadan"}],type:8,value:"collection"},{type:0,value:" o‘chirildi"}],"notifications-info.fairytale-removed-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" ertagi Termadan o‘chirildi"}],"notifications-info.fairytale-unpinned-from-menu":[{type:1,value:"entity"},{type:0,value:" ertagi yon menyudan olib tashlandi"}],"notifications-info.from-collection":[{type:0,value:"Termalar"}],"notifications-info.html-code-copied":[{type:0,value:"HTML-kod nusxalandi"}],"notifications-info.label-link":[{type:0,value:"Leybl havolasi"}],"notifications-info.my-vibe-pinned-in-menu":[{type:0,value:"Mening toʻlqinim "},{type:1,value:"entity"},{type:0,value:" yon menyuga mahkamlandi"}],"notifications-info.my-vibe-unpinned-from-menu":[{type:0,value:"Mening toʻlqinim "},{type:1,value:"entity"},{type:0,value:" yon menyudan oʻchirildi"}],"notifications-info.playlist-added-to-collection":[{type:1,value:"entity"},{type:0,value:" pleylisti "},{children:[{type:0,value:"Termaga"}],type:8,value:"collection"},{type:0,value:" qoʻshildi"}],"notifications-info.playlist-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" pleylisti Termaga qo‘shildi"}],"notifications-info.playlist-link":[{type:0,value:"Pleylistga havola"}],"notifications-info.playlist-pinned-in-menu":[{type:1,value:"entity"},{type:0,value:" pleylisti yon menyuga mahkamlandi"}],"notifications-info.playlist-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" pleylisti "},{children:[{type:0,value:"Termadan"}],type:8,value:"collection"},{type:0,value:" oʻchirildi"}],"notifications-info.playlist-removed-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" pleylisti Termadan o‘chirildi"}],"notifications-info.playlist-unpinned-from-menu":[{type:1,value:"entity"},{type:0,value:" pleylisti yon menyudan oʻchirildi"}],"notifications-info.podcast-added-to-collection":[{type:1,value:"entity"},{type:0,value:" podkasti "},{children:[{type:0,value:"Termaga"}],type:8,value:"collection"},{type:0,value:" qoʻshildi"}],"notifications-info.podcast-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" podkasti Termaga qo‘shildi"}],"notifications-info.podcast-episode-added-to-collection":[{type:1,value:"entity"},{type:0,value:" relizi "},{children:[{type:0,value:"Termaga"}],type:8,value:"collection"},{type:0,value:" kiritildi"}],"notifications-info.podcast-episode-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" soni Termaga qo‘shildi"}],"notifications-info.podcast-episode-available-in-recommendations":[{type:0,value:"Endi eshittirish sizning tavsiya etilganlaringizda paydo bo‘lishi mumkin"}],"notifications-info.podcast-episode-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" relizi "},{children:[{type:0,value:"Termadan"}],type:8,value:"collection"},{type:0,value:" oʻchirildi"}],"notifications-info.podcast-episode-removed-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" soni Termadan o‘chirildi"}],"notifications-info.podcast-episode-unavailable-in-recommendations":[{type:0,value:"Eshittirish sizning tavsiya etilganlaringizda paydo bo‘lmaydi"}],"notifications-info.podcast-pinned-in-menu":[{type:1,value:"entity"},{type:0,value:" podkasti yon menyuga mahkamlandi"}],"notifications-info.podcast-remove-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" podkasti Termadan o‘chirildi"}],"notifications-info.podcast-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" podkasti "},{children:[{type:0,value:"Termadan"}],type:8,value:"collection"},{type:0,value:" oʻchirildi"}],"notifications-info.podcast-unpinned-from-menu":[{type:1,value:"entity"},{type:0,value:" podkasti yon menyudan oʻchirildi"}],"notifications-info.quality-changed":[{type:1,value:"quality"},{type:0,value:" sifatli ovoz yoqilgan"}],"notifications-info.removed-audiobook-episode-from-playlist":[{type:1,value:"trackName"},{type:0,value:" boʻlimi “"},{type:1,value:"playlistName"},{type:0,value:"” pleylistidan oʻchirildi"}],"notifications-info.removed-from":[{type:0,value:"bundan o‘chirildi:"}],"notifications-info.removed-podcast-episode-from-playlist":[{type:1,value:"trackName"},{type:0,value:" relizi “"},{type:1,value:"playlistName"},{type:0,value:"” pleylistidan oʻchirildi"}],"notifications-info.removed-track-from-playlist":[{type:1,value:"trackName"},{type:0,value:" taronasi “"},{type:1,value:"playlistName"},{type:0,value:"” pleylistidan oʻchirildi"}],"notifications-info.shuffle-disabled":[{type:0,value:"Tartibli ijro qilish"}],"notifications-info.shuffle-enabled":[{type:0,value:"Tasodifiy tartib"}],"notifications-info.to-collection":[{type:0,value:"Termani"}],"notifications-info.track-added-to-collection":[{type:1,value:"entity"},{type:0,value:" taronasi "},{children:[{type:0,value:"“Menga yoqadi”"}],type:8,value:"collection"},{type:0,value:" pleylistiga qo‘shildi"}],"notifications-info.track-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" treki “Menga yoqadi” pleylistiga qo‘shildi"}],"notifications-info.track-available-in-recommendations":[{type:0,value:"Endi trek tavsiyalaringizda chiqishi mumkin"}],"notifications-info.track-link":[{type:0,value:"Trek havolasi"}],"notifications-info.track-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" taronasi "},{children:[{type:0,value:"“Menga yoqadi”"}],type:8,value:"collection"},{type:0,value:" pleylistidan oʻchirildi"}],"notifications-info.track-removed-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" treki “Menga yoqadi” pleylistidan o‘chirildi"}],"notifications-info.track-unavailable-in-recommendations":[{type:0,value:"Trek endi tavsiyalaringizda chiqmaydi"}],"notifications-info.xlsx-loading":[{type:0,value:"Excel-faylni shakllantirish"}],"notifications-info.xlsx-success":[{type:0,value:"Excel-fayl muvaffaqiyatli yuklab olindi"}],"offline.clear-memory":[{type:0,value:"Xotirani tozalash"}],"offline.clear-memory-description":[{type:0,value:"Faqat yuklab olinganlar va keshni o‘chiramiz. Bu tavsiyalaringiz va layklaringizga ta’sir qilmaydi"}],"offline.delete-from-device":[{type:0,value:"Qurilmadan o‘chirib tashlash"}],"offline.disable-offline-mode":[{type:0,value:"Oflayn rejimni faolsizlantirish"}],"offline.download":[{type:0,value:"Yuklab olish"}],"offline.download-for-offline":[{type:0,value:"Oflayn kirish uchun musiqa yuklab oling"}],"offline.download-progress":[{type:0,value:"Yuklab olish jarayoni"}],"offline.downloaded-empty":[{type:0,value:"Taronalar yuklab olinmagan"}],"offline.downloaded-track-list":[{type:0,value:"Yuklab olingan taronalar roʻyxati"}],"offline.downloaded-tracks":[{type:0,value:"Barcha yuklab olingan treklar"}],"offline.downloading-progress":[{type:1,value:"value"},{type:0,value:"%"}],"offline.listen-downloaded-content":[{type:0,value:"Hozir faqat yuklanganlarni eshita olasiz"}],"offline.memory-cleared":[{type:0,value:"Qurilma xotirasi tozalandi"}],"offline.no-internet-connection":[{type:0,value:"Internetga ulanmagan"}],"offline.offline-mode":[{type:0,value:"Oflayn rejim"}],"offline.offline-mode-description":[{type:0,value:"Yuklab olinganlarni internetsiz tinglang"}],"offline.offline-mode-enabled":[{type:0,value:"Oflayn rejim yoqilgan"}],"offline.stop-downloading":[{type:0,value:"Yuklab olishni to‘xtatish"}],"offline.track-download-error":[{type:0,value:"Taronani yuklab olishda xatolik yuz berdi"}],"offline.track-downloaded":[{type:0,value:"Trek yuklandi"}],"onboarding.artist-donation-button-1":[{type:0,value:"Sevimli ijrochingizni"},{type:1,value:"br"},{type:0,value:"xayriya bilan dastaklang"}],"onboarding.authorize-to-add-to-collection":[{type:0,value:"Termaga"},{type:1,value:"nbsp"},{type:0,value:"qoʻshish uchun hisobga"},{type:1,value:"nbsp"},{type:0,value:"kiring"}],"onboarding.authorize-to-add-track-to-queue":[{type:0,value:"Taronani navbatga"},{type:1,value:"nbsp"},{type:0,value:"qoʻshish uchun hisobga"},{type:1,value:"nbsp"},{type:0,value:"kiring"}],"onboarding.authorize-to-change-quality":[{type:0,value:"Tovush sifatini"},{type:1,value:"nbsp"},{type:0,value:"sozlash uchun hisobga kiring"}],"onboarding.authorize-to-dislike":[{type:0,value:"Dizlayk qoʻyish uchun hisobga kiring"}],"onboarding.authorize-to-like":[{type:0,value:"Layk qoʻyish uchun hisobga kiring"}],"onboarding.authorize-to-listen-full":[{type:0,value:"Taronani toʻliq tinglash uchun hisobga"},{type:1,value:"nbsp"},{type:0,value:"kiring"}],"onboarding.authorize-to-listen-vibe":[{type:0,value:"Mening"},{type:1,value:"nbsp"},{type:0,value:"toʻlqinimni tinglash"},{type:1,value:"nbsp"},{type:0,value:"uchun hisobga"},{type:1,value:"nbsp"},{type:0,value:"kiring"}],"onboarding.authorize-to-listen-vibe-by-activity":[{type:0,value:"Mashgʻulot boʻyicha Mening"},{type:1,value:"nbsp"},{type:0,value:"toʻlqinimni tinglash"},{type:1,value:"nbsp"},{type:0,value:"uchun hisobga"},{type:1,value:"nbsp"},{type:0,value:"kiring"}],"onboarding.authorize-to-listen-vibe-by-album":[{type:0,value:"Albom boʻyicha Mening"},{type:1,value:"nbsp"},{type:0,value:"toʻlqinimni tinglash"},{type:1,value:"nbsp"},{type:0,value:"uchun hisobga"},{type:1,value:"nbsp"},{type:0,value:"kiring"}],"onboarding.authorize-to-listen-vibe-by-artist":[{type:0,value:"Ijrochi boʻyicha Mening"},{type:1,value:"nbsp"},{type:0,value:"toʻlqinimni tinglash"},{type:1,value:"nbsp"},{type:0,value:"uchun hisobga"},{type:1,value:"nbsp"},{type:0,value:"kiring"}],"onboarding.authorize-to-listen-vibe-by-genre":[{type:0,value:"Janr boʻyicha Mening"},{type:1,value:"nbsp"},{type:0,value:"toʻlqinimni tinglash"},{type:1,value:"nbsp"},{type:0,value:"uchun hisobga"},{type:1,value:"nbsp"},{type:0,value:"kiring"}],"onboarding.authorize-to-listen-vibe-by-mood":[{type:0,value:"Kayfiyat boʻyicha Mening"},{type:1,value:"nbsp"},{type:0,value:"toʻlqinimni tinglash"},{type:1,value:"nbsp"},{type:0,value:"uchun hisobga"},{type:1,value:"nbsp"},{type:0,value:"kiring"}],"onboarding.authorize-to-listen-vibe-by-playlist":[{type:0,value:"Pleylist boʻyicha Mening"},{type:1,value:"nbsp"},{type:0,value:"toʻlqinimni tinglash"},{type:1,value:"nbsp"},{type:0,value:"uchun hisobga"},{type:1,value:"nbsp"},{type:0,value:"kiring"}],"onboarding.authorize-to-listen-vibe-by-track":[{type:0,value:"Tarona boʻyicha Mening"},{type:1,value:"nbsp"},{type:0,value:"toʻlqinimni tinglash"},{type:1,value:"nbsp"},{type:0,value:"uchun hisobga"},{type:1,value:"nbsp"},{type:0,value:"kiring"}],"onboarding.authorize-to-open-queue":[{type:0,value:"Navbatni ochish uchun hisobga kiring"}],"onboarding.authorize-to-pin":[{type:0,value:"Yon"},{type:1,value:"nbsp"},{type:0,value:"menyu/menyuga qadash uchun hisobga kiring"}],"onboarding.authorize-to-view-sync-lyrics":[{type:0,value:"Musiqa matnini ko‘rish uchun hisobga"},{type:1,value:"nbsp"},{type:0,value:"kiring"}],"onboarding.rewind-trailer":[{type:0,value:"Yil treylerini"},{type:1,value:"br"},{type:0,value:"yoqing"}],"onboarding.trailer":[{type:0,value:"Musiqani eng yaxshi"},{type:1,value:"br"},{type:0,value:"parchalari boʻyicha qidiring"}],"onboarding.try-plus-to-enable-high-quality":[{type:0,value:"Yuqori sifatni yoqish uchun multi-obunani faollashtiring"}],"onboarding.try-plus-to-listen-full":[{type:0,value:"Trekni toʻliq tinglash uchun multi-obunani faollashtiring"}],"onboarding.try-plus-to-listen-vibe":[{type:0,value:"Mening toʻlqinimni"},{type:1,value:"br"},{type:0,value:"tinglash uchun multi-obunani"},{type:1,value:"nbsp"},{type:0,value:"faollashtiring"}],"onboarding.try-plus-to-listen-vibe-by-activity":[{type:0,value:"Mening toʻlqinimni"},{type:1,value:"br"},{type:0,value:"mashgʻulot boʻyicha tinglash uchun"},{type:1,value:"nbsp"},{type:0,value:"multi-obunani"},{type:1,value:"nbsp"},{type:0,value:"faollashtiring"}],"onboarding.try-plus-to-listen-vibe-by-album":[{type:0,value:"Mening toʻlqinimni"},{type:1,value:"br"},{type:0,value:"albom boʻyicha tinglash uchun"},{type:1,value:"nbsp"},{type:0,value:"multi-obunani"},{type:1,value:"nbsp"},{type:0,value:"faollashtiring"}],"onboarding.try-plus-to-listen-vibe-by-artist":[{type:0,value:"Mening toʻlqinimni"},{type:1,value:"br"},{type:0,value:"ijrochi boʻyicha tinglash uchun"},{type:1,value:"nbsp"},{type:0,value:"multi-obunani"},{type:1,value:"nbsp"},{type:0,value:"faollashtiring"}],"onboarding.try-plus-to-listen-vibe-by-genre":[{type:0,value:"Mening toʻlqinimni"},{type:1,value:"br"},{type:0,value:"janrlar boʻyicha tinglash uchun"},{type:1,value:"nbsp"},{type:0,value:"multi-obunani"},{type:1,value:"nbsp"},{type:0,value:"faollashtiring"}],"onboarding.try-plus-to-listen-vibe-by-mood":[{type:0,value:"Mening toʻlqinimni"},{type:1,value:"br"},{type:0,value:"kayfiyatga qarab tinglash uchun"},{type:1,value:"nbsp"},{type:0,value:"multi-obunani"},{type:1,value:"nbsp"},{type:0,value:"faollashtiring"}],"onboarding.try-plus-to-listen-vibe-by-playlist":[{type:0,value:"Mening toʻlqinimni"},{type:1,value:"br"},{type:0,value:"pleylist boʻyicha tinglash uchun"},{type:1,value:"nbsp"},{type:0,value:"multi-obunani"},{type:1,value:"nbsp"},{type:0,value:"faollashtiring"}],"onboarding.try-plus-to-listen-vibe-by-track":[{type:0,value:"Mening toʻlqinimni"},{type:1,value:"br"},{type:0,value:"treklar boʻyicha tinglash uchun"},{type:1,value:"nbsp"},{type:0,value:"multi-obunani"},{type:1,value:"nbsp"},{type:0,value:"faollashtiring"}],"onboarding.try-plus-to-open-collection":[{type:0,value:"Termalarga kirish uchun multi-obunani faollashtiring"}],"onboarding.try-plus-to-view-sync-lyrics":[{type:0,value:"Matnli musiqani tomosha qilish uchun obunani faollashtiring"}],"page-error.concert-page-does-not-exist":[{type:0,value:"Bunday konsert topilmadi"}],"page-error.concert-page-does-not-exist-description":[{type:0,value:"Ehtimol, u oʻtib ketgan yoki xatolik yuz bergan boʻlishi mumkin"}],"page-error.page-does-not-exist":[{type:0,value:"Sahifa topilmadi"}],"page-error.page-does-not-exist-description":[{type:0,value:"Shu boʻlimdan qidirib koʻring"}],"page-error.reload":[{type:0,value:"Yangilash"}],"page-error.reload-page-button":[{type:0,value:"Sahifani yangilash"}],"page-error.restart-app-button":[{type:0,value:"Ilovani qayta ishga tushirish"}],"page-error.try-to-reload-page":[{type:0,value:"Sahifani yangilab ko‘ring"}],"page-error.try-to-restart-app":[{type:0,value:"Ilovani qayta ishga tushirib ko‘ring"}],"page.album-label-title":[{options:{"1":{value:[{type:0,value:"Leybl"}]},other:{value:[{type:0,value:"Leybllar"}]}},type:5,value:"count"},{type:0,value:":"}],"page.album-publisher-title":[{options:{"1":{value:[{type:0,value:"Noshir"}]},other:{value:[{type:0,value:"Noshirlar"}]}},type:5,value:"count"},{type:0,value:":"}],"page.artist-albums-header":[{type:1,value:"artistName"},{type:0,value:" albomlari"}],"page.artist-all-concerts-header":[{type:1,value:"artistName"},{type:0,value:"ning barcha konsertlari"}],"page.artist-clips-header":[{type:1,value:"artistName"},{type:0,value:" kliplari"}],"page.artist-compilations-header":[{type:1,value:"artistName"},{type:0,value:" termalari"}],"page.artist-concerts-header":[{type:1,value:"artistName"},{type:0,value:" konsertlari"}],"page.artist-discography-header":[{type:0,value:"Studiya albomlari "},{type:1,value:"artistName"}],"page.artist-pick-aria-label":[{type:0,value:"Yangi sahna: "},{type:1,value:"artistName"}],"page.artist-pick-subtitle":[{type:0,value:"Yangi sahna"}],"page.artist-similar-header":[{type:1,value:"artistName"},{type:0,value:"ga o‘xshash ijrochilar"}],"page.artist-tracks-header":[{type:1,value:"artistName"},{type:0,value:" ommabop treklari"}],"page.delayed-non-music":[{type:0,value:"Qoldirilgan podkastlar va kitoblar"}],"page.familiar-collection":[{type:0,value:"Sizning kolleksiyangizda"}],"page.familiar-vibe":[{type:0,value:"Mening toʻlqinimda tinglagansiz"}],"page.familiar-you":[{type:0,value:"Sizga tanish"}],"page.label-albums-header":[{type:1,value:"labelName"},{type:0,value:" relizlari"}],"page.label-artists-header":[{type:1,value:"labelName"},{type:0,value:" ijrochilari"}],"page.label-podcast-header":[{type:1,value:"labelName"},{type:0,value:" nashrlari"}],"page.podcasts-and-books":[{type:0,value:"Podkastlar va kitoblar"}],"page.results-of-the-year":[{type:0,value:"Yil sarhisobi"}],"page.settings":[{type:0,value:"Sozlamalar"}],"page.shelf":[{type:0,value:"Mening javonim"}],"page.similar-entities-block-title":[{type:0,value:"Oʻxshashlarini tinglang"}],"page.summer_2026_title":[{type:0,value:"Yoz mavsumingizni oching"}],"page.vibe-rooms":[{type:0,value:"Mening toʻlqinim ikki kishilik"}],"payment.album-offer-button-title":[{type:0,value:"Albomni tinglash"}],"payment.books-offer-button-title":[{type:0,value:"Kitob tinglash"}],"payment.buy":[{type:0,value:"Xarid qilish"}],"payment.fairy-tale-offer-button-title":[{type:0,value:"Ertakni tinglash"}],"payment.high-quality-offer-button-title":[{type:0,value:"Yuqori sifatda tinglash"}],"payment.learn-personal-bonus":[{type:0,value:"Shaxsiy bonusingizni bilib oling"}],"payment.min-price":[{type:0,value:"minimal "},{type:1,value:"value"}],"payment.offer-button":[{type:0,value:"Multiobunani rasmiylashtirish"}],"payment.podcast-offer-button-title":[{type:0,value:"Podkastni tinglash"}],"payment.single-offer-button-title":[{type:0,value:"Singlni tinglash"}],"payment.try-button":[{type:0,value:"Sinab ko‘rish"}],"payment.yandex-plus-offer-button":[{type:0,value:"Yandex Plus multi-obunasi boʻyicha"}],"paywall-footer.cashback-terms-link":[{type:0,value:"Keshbek shartlari"}],"paywall-footer.privileges-terms-link":[{type:0,value:"Imtiyoz shartlari"}],"paywall-footer.promotion-terms-link":[{type:0,value:"Aksiya shartlari"}],"paywall-footer.subscription-terms-link":[{type:0,value:"Multi-obuna shartlari"}],"paywall-footer.subscription-terms-link-other-countries":[{type:0,value:"Obuna shartlari"}],"paywall-footer.support-link":[{type:0,value:"Qo‘llab-quvvatlash xizmati"}],"paywall.books-part-benefit-app-desktop":[{type:0,value:"Alohida ilovada"},{type:1,value:"nbsp"},{type:0,value:"oʻqing va"},{type:1,value:"nbsp"},{type:0,value:"tinglang"}],"paywall.books-part-benefit-download-desktop":[{type:0,value:"Kitoblarni qurilmaga yuklab"},{type:1,value:"nbsp"},{type:0,value:"oling"}],"paywall.books-part-benefit-download-mobile":[{type:0,value:"Kitoblarni qurilmaga yuklab"},{type:1,value:"nbsp"},{type:0,value:"oling"}],"paywall.books-part-benefit-follow-desktop":[{type:0,value:"Yangiliklarni kuzatib boring"},{type:1,value:"nbsp"},{type:0,value:"va mumtoz"},{type:1,value:"nbsp"},{type:0,value:"adabiyotga"},{type:1,value:"nbsp"},{type:0,value:"qayting"}],"paywall.books-part-benefit-read-mobile":[{type:0,value:"Yangiliklar va"},{type:1,value:"nbsp"},{type:0,value:"mumtoz adaboyit oʻqing"}],"paywall.books-part-benefit-speed-desktop":[{type:0,value:"Oʻzingizga qulay"},{type:1,value:"br"},{type:0,value:"tempni tanlang"}],"paywall.books-part-benefit-speed-mobile":[{type:0,value:"Oʻzingizga qulay"},{type:1,value:"nbsp"},{type:0,value:"tempda tinglang"}],"paywall.books-part-benefit-switch-mobile":[{type:0,value:"Matn va"},{type:1,value:"nbsp"},{type:0,value:"audio orasida almashtiring"}],"paywall.books-part-title":[{type:0,value:"Yandex"},{type:1,value:"nbsp"},{type:0,value:"Books"}],"paywall.family-offer-text":[{type:0,value:"Har kimning oʻz akkaunt va shaxsiy"},{type:1,value:"br"},{type:0,value:"tavsiyalari mavjud. Qoʻshimcha toʻlovsiz"}],"paywall.family-offer-title":[{type:0,value:"Siz va "},{type:1,value:"br"},{type:0,value:"uch nafar yaqiningiz uchun musiqa"}],"paywall.faq-answer-afraid-forget-cancel":[{type:0,value:"Xavotirlanmang, birinchi pul yechilishidan 3 kun oldin email manzilingizga xabar yuboramiz"}],"paywall.faq-answer-cancel-until-end":[{type:0,value:"Multi-obunani istalgan vaqtda bekor qilish mumkin. Mana bunday qilinadi:"},{type:1,value:"steps"}],"paywall.faq-answer-cancel-until-end-other-countries":[{type:0,value:"Obunani istalgan payt bekor qilish mumkin. Buni quyidagicha bajarish mumkin:"},{type:1,value:"steps"}],"paywall.faq-answer-cancel-until-end-step-1":[{type:0,value:"Sahifani oching: "},{type:1,value:"link"}],"paywall.faq-answer-cancel-until-end-step-1-link":[{type:0,value:"Multi-obunani boshqarish"}],"paywall.faq-answer-cancel-until-end-step-1-link-other-countries":[{type:0,value:"Obunani boshqarish"}],"paywall.faq-answer-cancel-until-end-step-2":[{type:0,value:"“Multi-obunani bekor qilish” tugmasini bosing"}],"paywall.faq-answer-cancel-until-end-step-2-other-countries":[{type:0,value:"“Obunani bekor qilish”ni bosing"}],"paywall.faq-answer-where-else-subscribe":[{type:0,value:"Yandex.Music ilovasini yuklab oling – u orqali ham Plus’ni faollashtirish mumkin"}],"paywall.faq-answer-without-card-binding":[{type:0,value:"Yoʻq, hisobga karta ulangan boʻlishi lozim. Pul yechilishidan xavotirlanmang, sinov davri oxirigacha pul yechilmaydi. Hisobga yangi kartani ulaganingizda, unda kichik summa yechiladi va shu zahoti qaytariladi – bu orqali karta ishlayotganini tekshirib koʻramiz"}],"paywall.faq-question-afraid-forget-cancel":[{type:0,value:"Sinov muddati tugaguniga qadar multi-obunani bekor qilishni unutishdan qoʻrqaman"}],"paywall.faq-question-afraid-forget-cancel-other-countries":[{type:0,value:"Sinov versiyasi yakunlangunicha obunani bekor qilish esimdan chiqishidan qo‘rqaman"}],"paywall.faq-question-cancel-until-end":[{type:0,value:"Sinov muddati tugaguniga qadar multi-obunani oʻchira olamanmi?"}],"paywall.faq-question-cancel-until-end-other-countries":[{type:0,value:"Obunani sinov davri oxirigacha o‘chirishim mumkinmi?"}],"paywall.faq-question-where-else-subscribe":[{type:0,value:"Brauzerdagi saytga karta maʼlumotlarini kiritishni xohlamayman. Multi-obunani yana boshqa qayerda rasmiylashtirish mumkin?"}],"paywall.faq-question-where-else-subscribe-other-countries":[{type:0,value:"Karta ma’lumotlarini brauzerdagi saytga kiritishni xohlamayman. Obunani yana qayerda rasmiylashtirish mumkin?"}],"paywall.faq-question-without-card-binding":[{type:0,value:"Bank kartasini ulamasdan sinov davrini yoqish mumkinmi?"}],"paywall.kinopoisk-part-benefit-channels":[{type:0,value:"Yuzlab telekanallarga"},{type:1,value:"br"},{type:0,value:"kirish"},{type:1,value:"nbsp"},{type:0,value:"imkoniga ega boʻling"}],"paywall.kinopoisk-part-benefit-exclusive":[{type:0,value:"Kinopoisk"},{type:1,value:"br"},{type:0,value:"ekskluzivlarini"},{type:1,value:"br"},{type:0,value:"tomosha qiling"}],"paywall.kinopoisk-part-benefit-movies":[{type:0,value:"Minglab"},{type:1,value:"nbsp"},{type:0,value:"filmlar"},{type:1,value:"br"},{type:0,value:"va seriallar"},{type:1,value:"nbsp"},{type:0,value:"ichidan tanlang"}],"paywall.kinopoisk-part-benefit-sport":[{type:0,value:"Sport"},{type:1,value:"br"},{type:0,value:"translatsiyalarini"},{type:1,value:"nbsp"},{type:0,value:"kuzatib"},{type:1,value:"br"},{type:0,value:"boring"}],"paywall.kinopoisk-part-title":[{type:0,value:"Kinopoisk"}],"paywall.more-info":[{type:0,value:"Multi-obunaga yana nimalar kiradi?"}],"paywall.music-benefit-all-in-one-desktop":[{type:0,value:"Bularning barchasi – yagona qulay xizmatda"}],"paywall.music-benefit-all-in-one-mobile":[{type:0,value:"Bularning barchasi – yagona qulay ilovada"}],"paywall.music-benefit-audio":[{type:0,value:"Musiqa, audiokitoblar va"},{type:1,value:"nbsp"},{type:0,value:"podkastlar"}],"paywall.music-benefit-recommendation":[{type:0,value:"Eng aniq tavsiyalar"}],"paywall.music-benefit-without-network":[{type:0,value:"Yuklab oling va keyin internetsiz ham tinglang "}],"paywall.music-benefits-title":[{type:0,value:"Keling, "},{type:1,value:"br"},{type:0,value:"Yandex Music yoqamiz"}],"paywall.music-on-many-devices":[{type:0,value:"Yandex Music – Yandex Plus obunasi orqali turli qurilmalarda"}],"paywall.music-part-benefit-books":[{type:0,value:"Audiokitoblar"},{type:1,value:"br"},{type:0,value:"tinglang"}],"paywall.music-part-benefit-books-alternative":[{type:0,value:"Audio kitoblar tinglang"}],"paywall.music-part-benefit-many-devices":[{type:0,value:"Aqlli tavsiyalar sizni xayratga solishiga"},{type:1,value:"br"},{type:0,value:"imkon bering"}],"paywall.music-part-benefit-playlists":[{type:0,value:"Termalarda"},{type:1,value:"br"},{type:0,value:"oʻz"},{type:1,value:"br"},{type:0,value:"pleylistlaringizni"},{type:1,value:"nbsp"},{type:0,value:"yarating"}],"paywall.music-part-benefit-recommendations":[{type:0,value:"Мыңдаған музыкалық іріктемелерді"},{type:1,value:"br"},{type:0,value:"қараңыз"}],"paywall.music-part-benefit-without-internet":[{type:0,value:"Internetsiz"},{type:1,value:"br"},{type:0,value:"yuqori"},{type:1,value:"nbsp"},{type:0,value:"sifatli"},{type:1,value:"br"},{type:0,value:"formatda"},{type:1,value:"nbsp"},{type:0,value:"tinglang"}],"paywall.music-part-benefit-without-internet-mobile":[{type:0,value:"Hatto internetsiz"},{type:1,value:"nbsp"},{type:0,value:"tinglang"}],"paywall.music-part-title":[{type:0,value:"Yandex Music"}],"paywall.open-plus-benefits":[{type:0,value:"Barcha koʻngilochar yagona multi-obunada"}],"paywall.other-services-part-benefit-maps":[{type:0,value:"Yandex Maps va Yandex Navigator CarPlay\u2028va AndroidAuto'da"}],"paywall.other-services-part-benefit-your-plus":[{type:0,value:"Bizning Pluslarimizda koʻproq imkoniyatlar"}],"paywall.other-services-part-save":[{type:0,value:"Seyvlardagi jamgʻarma hisoblar boʻyicha yuqori foiz stavkasi"}],"paywall.other-services-part-title":[{type:0,value:"Yandeks xizmatlarida Plus'ning afzalliklari"}],"paywall.pay-part-benefit-split-desktop":[{type:0,value:"Split bilan toʻlovni qismlarga boʻling"}],"paywall.plus-benefit-books":[{type:0,value:"Kitoblar va"},{type:1,value:"br"},{type:0,value:"audiokitoblar"}],"paywall.plus-benefit-cashback":[{type:0,value:"Va Yandex xizmatlaridagi boshqa afzalliklar"}],"paywall.plus-benefit-kinopoisk":[{type:0,value:"Film va"},{type:1,value:"nbsp"},{type:0,value:"seriallar"},{type:1,value:"br"},{type:0,value:"Kinopoisk’da"}],"paywall.plus-benefit-music":[{type:0,value:"Reklamasiz musiqa va"},{type:1,value:"br"},{type:0,value:"podkastlar"}],"paywall.plus-part-benefit-devices":[{type:0,value:"10 tagacha qurilma ulang"}],"paywall.plus-part-benefit-family":[{type:0,value:"3 nafar"},{type:1,value:"br"},{type:0,value:"yaqiningizni qoʻshing"}],"paywall.plus-part-benefit-options":[{type:0,value:"Opsiyalar yordamida multi-obunangiz imkoniyatlarini kengaytiring"}],"paywall.plus-part-spend-points":[{type:0,value:"Plus ballarini Yandex xizmatlarida buyurtmalarga sarflang: 1"},{type:1,value:"nbsp"},{type:0,value:"ball"},{type:1,value:"nbsp"},{type:0,value:"= "},{type:1,value:"nbsp"},{type:0,value:"1"},{type:1,value:"nbsp"},{type:0,value:"₽"}],"paywall.plus-part-title":[{type:0,value:"Yandex Plus"}],"paywall.recommendations-on-devices":[{type:0,value:"Oʻzingizga qulay joyda qiziqishlaringizga mos tavsiyalarni tinglang"}],"play-queue.album-will-be-played-last":[{type:1,value:"title"},{type:0,value:" albomi navbat oxiriga qoʻshildi"}],"play-queue.album-will-be-played-next":[{type:1,value:"title"},{type:0,value:" albomi navbat boshiga qoʻshildi"}],"play-queue.audiobook-episode-will-be-played-last":[{type:1,value:"title"},{type:0,value:" bobi navbat oxiriga qoʻshildi"}],"play-queue.audiobook-episode-will-be-played-next":[{type:1,value:"title"},{type:0,value:" bobi navbat boshiga qoʻshildi"}],"play-queue.audiobook-episode-will-be-removed":[{type:1,value:"title"},{type:0,value:" nomli bob navbatdan olib tashlandi"}],"play-queue.delete-from-queue":[{type:0,value:"Navbatdan olib tashlash"}],"play-queue.my-wave-by-album":[{type:0,value:"Albom boʻyicha Mening toʻlqinim"}],"play-queue.my-wave-by-artist":[{type:0,value:"Artist bo‘yicha Mening toʻlqinim"}],"play-queue.my-wave-by-playlist":[{type:0,value:"Pleylist boʻyicha Mening toʻlqinim"}],"play-queue.next-in":[{type:0,value:"Navbatdagisi"}],"play-queue.now-playing":[{type:0,value:"Hozir ijro etilmoqda"}],"play-queue.now-playing-by-entity":[{type:0,value:"Ijro etilyapti: "},{type:1,value:"entity"}],"play-queue.now-playing-from-album":[{type:0,value:"Hozir albomdan ijro etilmoqda"}],"play-queue.now-playing-from-artist-collection":[{type:0,value:"Hozir sizga tanish nimadir ijro etilmoqda"}],"play-queue.now-playing-from-artist-popular-tracks":[{type:0,value:"Hozir ijrochining mashhur treklaridan ijro etilmoqda"}],"play-queue.now-playing-from-artist-wave":[{type:0,value:"Hozir sizga tanish nimadir ijro etilmoqda"}],"play-queue.now-playing-from-downloads":[{type:0,value:"Hozir yuklab olingan treklardan ijro etilmoqda"}],"play-queue.now-playing-from-history":[{type:0,value:"Hozir tarixdan ijro etilmoqda"}],"play-queue.now-playing-from-history-search":[{type:0,value:"Hozir qidiruv tarixidan ijro etilmoqda"}],"play-queue.now-playing-from-playlist":[{type:0,value:"Hozir pleylistdan ijro etilmoqda"}],"play-queue.now-playing-from-podcast":[{type:0,value:"Hozir podkastdan ijro etilmoqda"}],"play-queue.now-playing-from-search":[{type:0,value:"Hozir qidiruvdan ijro etilmoqda"}],"play-queue.now-playing-my-wave-by-album":[{type:0,value:"Albom boʻyicha Mening toʻlqinim ijro qilinmoqda"}],"play-queue.now-playing-my-wave-by-artist":[{type:0,value:"Artist boʻyicha Mening toʻlqinim ijro qilinmoqda"}],"play-queue.now-playing-my-wave-by-playlist":[{type:0,value:"Pleylist boʻyicha Mening toʻlqinim ijro qilinmoqda"}],"play-queue.now-playing-my-wave-by-podcast":[{type:0,value:"Podkast boʻyicha Mening toʻlqinim ijro qilinmoqda"}],"play-queue.now-playing-my-wave-by-track":[{type:0,value:"Trek boʻyicha Mening toʻlqinim ijro qilinmoqda"}],"play-queue.play-last":[{type:0,value:"Navbat oxiriga qoʻshish"}],"play-queue.play-next":[{type:0,value:"Keyingisida ijro qilish"}],"play-queue.playlist-will-be-played-last":[{type:1,value:"title"},{type:0,value:" pleylisti navbat oxiriga qo‘shildi"}],"play-queue.playlist-will-be-played-next":[{type:1,value:"title"},{type:0,value:" pleylisti navbat boshiga qoʻshildi"}],"play-queue.podcast-episode-will-be-played-last":[{type:1,value:"title"},{type:0,value:" chiqishi navbat oxiriga qoʻshildi"}],"play-queue.podcast-episode-will-be-played-next":[{type:1,value:"title"},{type:0,value:" chiqishi navbat boshiga qoʻshildi"}],"play-queue.podcast-episode-will-be-removed":[{type:1,value:"title"},{type:0,value:" soni navbatdan olib tashlandi"}],"play-queue.repeat-context":[{type:0,value:"Navbat takrorlanishi yoqildi"}],"play-queue.repeat-one":[{type:0,value:"Trek takrorlanishi yoqildi"}],"play-queue.shuffle":[{type:0,value:"Tasodifiy tartibda"}],"play-queue.title":[{type:0,value:"Ijro navbati"}],"play-queue.track-will-be-played-last":[{type:1,value:"title"},{type:0,value:" trek navbat oxiriga qoʻshildi"}],"play-queue.track-will-be-played-next":[{type:1,value:"title"},{type:0,value:" trek navbat boshiga qoʻshildi"}],"play-queue.track-will-be-removed":[{type:1,value:"title"},{type:0,value:" treki navbatdan olib tashlandi"}],"player-actions.audio-quality":[{type:0,value:"Ovoz sozlamalari"}],"player-actions.audio-quality-economical":[{type:0,value:"Tejamkor"}],"player-actions.audio-quality-economical-description":[{type:0,value:"Sekin internetda ham barqaror ijro"}],"player-actions.audio-quality-maximum":[{type:0,value:"Ajoyib"}],"player-actions.audio-quality-maximum-description":[{type:0,value:"Musiqa lossless va boshqa yuqori sifatli formatlar ijrosi yuqori tezlikdagi internet va yaxshi akustika uchun mo‘ljallangan"}],"player-actions.audio-quality-optimal":[{type:0,value:"Optimal"}],"player-actions.audio-quality-optimal-description":[{type:0,value:"Aksariyat qurilmalar uchun esa, o‘rta muvozanatli tovush"}],"player-actions.cast":[{type:0,value:"Qurilma tanlovi"}],"player-actions.fullscreen":[{type:0,value:"Butun ekranga"}],"player-actions.fullscreen-button":[{type:0,value:"Butun ekranga pleyer"}],"player-actions.listen":[{type:0,value:"Tinglash"}],"player-actions.mix":[{type:0,value:"Boshqa joyga ko‘chirish"}],"player-actions.next-track":[{type:0,value:"Keyingi tarona"}],"player-actions.pause":[{type:0,value:"Pauza"}],"player-actions.play":[{type:0,value:"Ijro"}],"player-actions.previous-track":[{type:0,value:"Avvalgi tarona"}],"player-actions.repeat":[{type:0,value:"Takror"}],"player-actions.repeat-action":[{type:0,value:"Takrorlash"}],"player-actions.repeat-context":[{type:0,value:"Pleylistni takroran ijro etish"}],"player-actions.repeat-one":[{type:0,value:"Trek takrorlanishi"}],"player-actions.rewind-backwards":[{type:0,value:"15 soniya orqaga"}],"player-actions.rewind-forward":[{type:0,value:"30 soniya oldinga"}],"player-actions.shuffle":[{type:0,value:"Tasodifiy tartibda"}],"player-actions.timecode-control":[{type:0,value:"Taymkod bilan boshqarish"}],"player-actions.video-speed":[{type:0,value:"Tezlik"}],"player-actions.video-speed-normal":[{type:0,value:"Oddiy"}],"player-actions.volume-control":[{type:0,value:"Tovush balandligini boshqarish"}],"player-actions.volume-off":[{type:0,value:"Tovushni o‘chirish"}],"player-actions.volume-on":[{type:0,value:"Tovushni yoqish"}],"playlist-actions.add-description":[{type:0,value:"Tavsifga qo‘shish"}],"playlist-actions.add-poster":[{type:0,value:"Muqova qoʻshish"}],"playlist-actions.add-track-to-playlist":[{type:0,value:"Pleylistga kiritish"}],"playlist-actions.change-description":[{type:0,value:"Tavsifni tahrirlash"}],"playlist-actions.change-description-abbr":[{type:0,value:"Tahrir"}],"playlist-actions.change-poster":[{type:0,value:"Muqovani oʻzgartirish"}],"playlist-actions.change-title":[{type:0,value:"Nomini tahrirlash"}],"playlist-actions.create-playlist":[{type:0,value:"Ijro ro‘yxatini yaratish"}],"playlist-actions.enter-title":[{type:0,value:"Nomini kiriting"}],"playlist-actions.privacy":[{type:0,value:"Maxfiy ijro ro‘yxati"}],"playlist-actions.privacy-label":[{type:0,value:"Pleylist maxfiyligi sozlamalarini oʻzgartirish"}],"playlist-actions.remove-from-playlist":[{type:0,value:"Pleylistdan oʻchirish"}],"playlist-actions.remove-playlist":[{type:0,value:"Pleylistni oʻchirish"}],"playlist-errors.failed-add-track-to-playlist":[{type:0,value:"Trek pleylistga qo‘shilmadi, qayta urining"}],"playlist-errors.failed-add-tracks-to-playlist":[{type:0,value:"Treklar pleylistga qoʻshilmadi, qaytadan urining"}],"playlist-errors.failed-download-xlsx":[{type:0,value:"Excel-fayl yuklab olinmadi"}],"playlist-errors.failed-part-tracks-download-xlsx":[{type:0,value:"Excel fayl yuklab olindi, biroq treklarning bir qismi yuklab olinmadi"}],"playlist-errors.failed-to-change-description":[{type:0,value:"Pleylist tavsifi tahrirlanmadi"}],"playlist-errors.failed-to-change-poster":[{type:0,value:"Pleylist muqovasi oʻzgartirilmadi"}],"playlist-errors.failed-to-change-privacy-settings":[{type:0,value:"Maxfiylik sozlamalari oʻzgartirilmadi"}],"playlist-errors.failed-to-change-title":[{type:0,value:"Pleylist nomi tahrirlanmadi"}],"playlist-errors.failed-to-create-playlist":[{type:0,value:"Pleylist yaratilmadi"}],"playlist-errors.failed-to-remove-playlist":[{type:0,value:"Pleylistni oʻchirilmadi"}],"playlist-errors.failed-to-remove-track":[{type:0,value:"Trek pleylistdan oʻchirilmadi"}],"plus-page.iframe-title":[{type:0,value:"Sizning Plus"}],"plusbar.subscription-activation":[{type:0,value:"Multi-obunani faollashtirish"}],"plusbar.text":[{type:0,value:"Shuningdek, Kinopoisk tomosha qiling va"},{type:1,value:"nbsp"},{type:0,value:"keshbek ballar oling"}],"plusbar.title":[{type:0,value:"Musiqa"},{type:1,value:"br"},{type:0,value:"Yandex Plus"},{type:1,value:"nbsp"},{type:0,value:"multi-obunalari bilan boshlanadi"}],"podcast-errors.error-during-loading-podcast":[{type:0,value:"Podkastni yuklashda xatolik yuz berdi"}],"podcast.age-limit":[{type:0,value:"Yosh cheklovlari"}],"podcast.episodes-list":[{type:0,value:"“"},{type:1,value:"albumName"},{type:0,value:"” podkasti epizodlari roʻyxati"}],"podcast.last-episodes-list":[{type:0,value:"Oxirgi relizlar roʻyxati"}],"podcast.publisher-title":[{type:0,value:"Nashriyot"}],"podcast.publishers-title":[{type:0,value:"Noshirlar"}],"podcast.shelf-liked-title":[{type:0,value:"Oldinroq qoʻshgansiz"}],"podcast.shelf-recently-played-title":[{type:0,value:"Yaqinda tingladingiz"}],"podcast.tab-about":[{type:0,value:"Podkast haqida"}],"podcast.tab-tracks":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"ta son"}]},many:{value:[{type:0,value:"ta son"}]},one:{value:[{type:0,value:"ta son"}]},other:{value:[{type:0,value:"ta son"}]}},pluralType:"cardinal",type:6,value:"value"}],"rewind.button-title":[{type:0,value:"2025-yil yakunlari"}],"rewind.download-image":[{type:0,value:"Rasmni yuklab olish"}],"rewind.save-choice":[{type:0,value:"Tanlovni saqlash"}],"search-filters.top":[{type:0,value:"Top"}],"search-filters.track":[{type:0,value:"Treklar"}],"search-results.album":[{type:0,value:"Albomlar"}],"search-results.artist":[{type:0,value:"Ijrochilar"}],"search-results.best":[{type:0,value:"Eng yaxshi natijalar"}],"search-results.clip":[{type:0,value:"Kliplar"}],"search-results.not-found-description":[{type:0,value:"Boshqacha yozib ko‘ring"}],"search-results.not-found-title":[{type:0,value:"Hech narsa topilmadi"}],"search-results.other-results":[{type:0,value:"Boshqa natijalar"}],"search-results.playlist":[{type:0,value:"Pleylistlar"}],"search-results.podcasts-and-books":[{type:0,value:"Podkastlar va kitoblar"}],"search.clear-history":[{type:0,value:"Tarixni tozalash"}],"search.cleared-history":[{type:0,value:"Tarix o‘chirib tashlangan"}],"search.corrected-text":[{type:0,value:"Balki, buni qidirgansiz: "},{type:1,value:"text"}],"search.history":[{type:0,value:"Tarix"}],"search.history-empty":[{type:0,value:"Qidiruv tarixi bo‘sh"}],"search.input-placeholder":[{type:0,value:"Trek, albom, ijrochi"}],"search.input-placeholder-q2v":[{type:0,value:"Har qanday soʻrov boʻyicha musiqa"}],"search.playlist-placeholder":[{type:0,value:"Pleylistni qidirish"}],"search.q2v-suggestions-loading":[{type:0,value:"Nima taklif qilsam ekan"}],"search.recent-requests-fallback":[{type:0,value:"Bu yerda oxirgi soʻrovlaringiz boʻladi"}],"search.search-catalog":[{type:0,value:"Katalog bo‘yicha qidirish"}],"search.track-placeholder":[{type:0,value:"Trekni qidirish"}],"settings.about-app":[{type:0,value:"Ilova haqida"}],"settings.ai-content-reduction":[{type:0,value:"Kamroq SI"}],"settings.ai-content-reduction-description":[{type:0,value:"Tavsiyalarda SI yordamida yaratilgan musiqalar kamroq uchraydi"}],"settings.crossfade":[{type:0,value:"Taronalararo ravon o‘tishlar"}],"settings.failed-to-change-child-mode":[{type:0,value:"Maxfiylik sozlamalari oʻzgartirilmadi"}],"settings.preferences":[{type:0,value:"Ma’qullarini aniqlash"}],"settings.preferences-description":[{type:0,value:"Agar musiqiy afzalliklaringiz oʻzgargan boʻlsa, ularni bu yerda aniqlashtiring"}],"settings.shortcuts":[{type:0,value:"Tezkor tugmalar"}],"settings.show-child-section":[{type:0,value:"“Bolalar uchun” ruknini chiqarish"}],"share.iframe-copy":[{type:0,value:"Nusxa olish"}],"share.iframe-editor-code":[{type:0,value:"Kod"}],"share.iframe-editor-height":[{type:0,value:"Balandlik"}],"share.iframe-editor-preview":[{type:0,value:"Razm solish"}],"share.iframe-editor-width":[{type:0,value:"Kenglik"}],"share.iframe-listen":[{type:1,value:"html"},{type:0,value:" – Yandex Music ilovasida tinglang"}],"share.iframe-modal-title":[{type:0,value:"O‘lchamni sozlang va kodni saytga nusxalang"}],"shortcuts.fullscreen-player":[{type:0,value:"Butun ekranli pleyerni ochish / yopish"}],"shortcuts.like":[{type:0,value:"Layk"}],"shortcuts.mute":[{type:0,value:"Tovushni faolsizlantirish/yoqish"}],"shortcuts.next-track":[{type:0,value:"Keyingi taronaga oʻtish"}],"shortcuts.or":[{type:0,value:"yoki"}],"shortcuts.play-pause":[{type:0,value:"Musiqani yoqish/pauzalash"}],"shortcuts.previous-track":[{type:0,value:"Avvalgi taronaga oʻtish"}],"shortcuts.rewind":[{type:0,value:"Orqaga yurgizish"}],"shortcuts.skip-forward":[{type:0,value:"Oldinga yurgizish"}],"shortcuts.switch-repeat-mode":[{type:0,value:"Takrorlash rejimini almashtirish"}],"shortcuts.switch-shuffle-mode":[{type:0,value:"Rejimni almashtirish (“tasodifiy tartibda”)"}],"shortcuts.unlike":[{type:0,value:"Dislayk"}],"shortcuts.volume-down":[{type:0,value:"Tovush balandligini pasaytirish"}],"shortcuts.volume-up":[{type:0,value:"Tovush balandligini oshirish"}],"sidebar.collapse":[{type:0,value:"Yon panelni kichraytirish"}],"sidebar.download-app":[{type:0,value:"Ilovani yuklab olish"}],"sidebar.download-app-formatted":[{type:0,value:"Yandex Music "},{children:[{type:0,value:"desktopda"}],type:8,value:"span"}],"sidebar.download-macos":[{type:0,value:"MacOS uchun ilovani yuklab olish"}],"sidebar.download-macos-formatted":[{type:0,value:"Yandex Music "},{children:[{type:0,value:"MacOSʼda"}],type:8,value:"span"}],"sidebar.download-windows":[{type:0,value:"Windows uchun ilovani yuklab olish"}],"sidebar.download-windows-formatted":[{type:0,value:"Yandex Music "},{children:[{type:0,value:"Windowsʼda"}],type:8,value:"span"}],"sidebar.plus-badge":[{type:0,value:"Plus"}],"sidebar.uncollapse":[{type:0,value:"Yon panelni yoyish"}],"slider.close-image-modal":[{type:0,value:"Rasmlar ko‘rish oynasini yopish"}],"slider.image-counter":[{type:0,value:"Rasm "},{type:1,value:"index"},{type:0,value:" / "},{type:1,value:"count"}],"slider.image-slider-modal":[{type:0,value:"Rasmlar ko‘rish"}],"slider.images-left-count":[{type:0,value:"Yana "},{type:1,value:"imagesLeft"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"ta rasm"}]},many:{value:[{type:0,value:"ta rasm"}]},one:{value:[{type:0,value:"ta rasm"}]},other:{value:[{type:0,value:"ta rasm"}]}},pluralType:"cardinal",type:6,value:"imagesLeft"}],"slider.next-image":[{type:0,value:"Keyingi rasm"}],"slider.next-slide":[{type:0,value:"Keyingi slayd"}],"slider.prev-image":[{type:0,value:"Oldingi rasm"}],"slider.prev-slide":[{type:0,value:"Avvalgi slayd"}],"slider.slide":[{type:0,value:"Slayd"}],"slider.view-artist-covers":[{type:0,value:"Ijrochining rasmlarini koʻrish"}],"slider.view-concert-covers":[{type:0,value:"Konsert rasmlarini ko‘rish"}],"slider.view-cover":[{type:0,value:"Muqovani koʻrish"}],"snegir.auth-button-text":[{type:0,value:"Kirish"}],"snegir.main-text":[{type:0,value:"Yandex Music"},{type:1,value:"br"},{type:0,value:"sizning hududingizda mavjud emas"}],"snegir.redirect-button-text":[{type:0,value:"Kirish"}],"sort.select-filter":[{type:0,value:"Filtrni tanlang"}],"sort.sort-by-rating":[{type:0,value:"Ommabopligi asosida"}],"sort.sort-by-year":[{type:0,value:"Chiqish sanasi asosida"}],"time.duration":[{type:0,value:"Davomiyligi"}],"time.finished":[{type:0,value:"Tinglangan"}],"time.hours":[{offset:0,options:{few:{value:[{style:null,type:2,value:"hours"},{type:0,value:" soat"}]},many:{value:[{style:null,type:2,value:"hours"},{type:0,value:" soat"}]},one:{value:[{style:null,type:2,value:"hours"},{type:0,value:" soat"}]},other:{value:[{style:null,type:2,value:"hours"},{type:0,value:" soat"}]}},pluralType:"cardinal",type:6,value:"hours"}],"time.hours-left":[{offset:0,options:{few:{value:[{style:null,type:2,value:"hours"},{type:0,value:" soat qoldi"}]},many:{value:[{style:null,type:2,value:"hours"},{type:0,value:" soat qoldi"}]},one:{value:[{style:null,type:2,value:"hours"},{type:0,value:" soat qoldi"}]},other:{value:[{style:null,type:2,value:"hours"},{type:0,value:" soat qoldi"}]}},pluralType:"cardinal",type:6,value:"hours"}],"time.hours-minutes":[{options:{"0":{value:[]},other:{value:[{type:1,value:"hours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"soat"}]},many:{value:[{type:0,value:"soat"}]},one:{value:[{type:0,value:"soat"}]},other:{value:[{type:0,value:"soat"}]}},pluralType:"cardinal",type:6,value:"hours"}]}},type:5,value:"hours"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"minutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"daqiqa"}]},many:{value:[{type:0,value:"daqiqa"}]},one:{value:[{type:0,value:"daqiqa"}]},other:{value:[{type:0,value:"daqiqa"}]}},pluralType:"cardinal",type:6,value:"minutes"}]}},type:5,value:"minutes"}],"time.hours-minutes-seconds":[{options:{"0":{value:[]},other:{value:[{type:1,value:"hours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"soat,"}]},many:{value:[{type:0,value:"soat,"}]},one:{value:[{type:0,value:"soat,"}]},other:{value:[{type:0,value:"soat,"}]}},pluralType:"cardinal",type:6,value:"hours"}]}},type:5,value:"hours"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"minutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"daqiqa,"}]},many:{value:[{type:0,value:"daqiqa,"}]},one:{value:[{type:0,value:"daqiqa,"}]},other:{value:[{type:0,value:"daqiqa,"}]}},pluralType:"cardinal",type:6,value:"minutes"}]}},type:5,value:"minutes"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"seconds"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"soniya."}]},many:{value:[{type:0,value:"soniya."}]},one:{value:[{type:0,value:"soniya."}]},other:{value:[{type:0,value:"soniya"}]}},pluralType:"cardinal",type:6,value:"seconds"}]}},type:5,value:"seconds"}],"time.left":[{offset:0,options:{few:{value:[{type:0,value:"ta qoldi"}]},many:{value:[{type:0,value:"ta qoldi"}]},one:{value:[{type:0,value:"ta qoldi"}]},other:{value:[{type:0,value:"ta qoldi"}]}},pluralType:"cardinal",type:6,value:"time"}],"time.minutes-left":[{offset:0,options:{few:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" daqiqa"}]},many:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" daqiqa"}]},one:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" daqiqa"}]},other:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" daqiqa"}]}},pluralType:"cardinal",type:6,value:"minutes"}],"time.seconds-left":[{offset:0,options:{few:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" soniya"}]},many:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" soniya"}]},one:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" soniya"}]},other:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" soniya"}]}},pluralType:"cardinal",type:6,value:"seconds"}],"track-modal.album-heading":[{options:{audiobook:{value:[{type:0,value:"Kitob"}]},fairy_tale:{value:[{type:0,value:"Ertak"}]},other:{value:[{type:0,value:"Albom"}]},podcast:{value:[{type:0,value:"Podkast"}]},single:{value:[{type:0,value:"Singl"}]}},type:5,value:"type"}],"track-modal.audiobook-title":[{type:0,value:"Boʻlim haqida"}],"track-modal.clip-title":[{type:0,value:"Klip haqida"}],"track-modal.concert-title":[{type:0,value:"Konsert haqida"}],"track-modal.content-rating":[{type:0,value:"Yosh"}],"track-modal.genre":[{type:0,value:"Janr"}],"track-modal.podcast-title":[{type:0,value:"Nashr haqida"}],"track-modal.read-more":[{type:0,value:"To‘liq o‘qish"}],"track-modal.similar-tracks":[{type:0,value:"O‘xshash treklar"}],"track-modal.source":[{type:0,value:"Manba"}],"track-modal.title":[{type:0,value:"Trek haqida"}],"track-modal.track-name":[{type:0,value:"Nomi"}],"track-title.audiobook-not-found":[{type:0,value:"Audio kitob mavjud emas"}],"track-title.error-not-found":[{type:0,value:"Trek mavjud emas"}],"track-title.podcast-not-found":[{type:0,value:"Podkast mavjud emas"}],"trailer.button-aria-label":[{type:0,value:"Treylerni ochish"}],"trailer.close":[{type:0,value:"Treylerni yopish"}],"trailer.listen-full-version":[{type:0,value:"Toʻliq tinglash"}],"trailer.navigate":[{type:0,value:"Kirish"}],"trailer.not-found-description":[{type:0,value:"Tez orada tuzatamiz, keyinroq qayting"}],"trailer.not-found-title":[{type:0,value:"Treyler buzilgan"}],"trailer.something-went-wrong-description":[{type:0,value:"Ekranni yangilang yoki keyinroq urining"}],"ugc.cancel-upload":[{type:0,value:"Yuklashni bekor qilish"}],"ugc.close-edit-popup":[{type:0,value:"Trekni tahrirlash oynasini yopish"}],"ugc.editing-failed":[{type:0,value:"Trekni tahrirlab boʻlmadi"}],"ugc.notification-success":[{type:0,value:"Hamma treklarni “"},{type:1,value:"playlistName"},{type:0,value:"” pleylistiga yukladik"}],"ugc.notification-too-large-file-error":[{type:0,value:"Fayl yuklash uchun juda katta"}],"ugc.notification-too-many-files-error":[{type:0,value:"Yuklangan treklar miqdori boʻyicha limitdan oshdi"}],"ugc.notification-unknown-error":[{type:0,value:"Treklarni “"},{type:1,value:"playlistName"},{type:0,value:"” pleylistiga yuklashda xato"}],"ugc.repeat-upload":[{type:0,value:"Yuklashni takrorlash"}],"ugc.track-description":[{type:0,value:"Bu trekni faqat siz tinglashingiz mumkin"}],"ugc.track-uploading-error-status":[{type:0,value:"Yuklashda xatolik"}],"ugc.track-uploading-pending-status":[{type:0,value:"Tarona yuklanmoqda"}],"ugc.track-uploading-processing-status":[{type:0,value:"Tarona qayta ishlanmoqda"}],"ugc.upload-track":[{type:0,value:"Trekni yuklash"}],"vibe-actions.apply":[{type:0,value:"Sozlamani tatbiq qilish"}],"vibe-actions.aria-label-pause":[{type:0,value:"Mening toʻlqinimni pauzalash"}],"vibe-actions.aria-label-play":[{type:0,value:"Mening toʻlqinimni ijro qilish"}],"vibe-actions.aria-label-settings":[{type:0,value:"Mening toʻlqinimni sozlash"}],"vibe-actions.enter-title":[{type:0,value:"Nomini kiriting"}],"vibe-actions.play-vibe":[{type:0,value:"Mening toʻlqinimni yoqish"}],"vibe-actions.remove":[{type:0,value:"Sozlamani olib tashlash"}],"vibe-actions.reset-settings":[{type:0,value:"Mening to‘lqinim sozlamalarini asliga qaytarish"}],"vibe-actions.vibe-by-album":[{type:0,value:"Albom boʻyicha Mening toʻlqinim"}],"vibe-actions.vibe-by-artist":[{type:0,value:"Artist bo‘yicha Mening toʻlqinim"}],"vibe-actions.vibe-by-playlist":[{type:0,value:"Pleylist boʻyicha Mening toʻlqinim"}],"vibe-actions.vibe-by-track":[{type:0,value:"Trek boʻyicha Mening toʻlqinim"}],"vibe-actions.vibe-context":[{options:{MIX:{value:[{type:0,value:"Set "}]},other:{value:[]}},type:5,value:"type"},{type:1,value:"name"}],"vibe-errors.apply-vibe-setting":[{type:0,value:"Mening to‘lqinimni sozlashda xatolik yuz berdi"}],"vibe-errors.start-vibe":[{type:0,value:"Mening to‘lqinimni ishga tushirishda xatolik yuz berdi"}],"vibe-freemium.available-in-plus":[{type:0,value:"Eng aniq tavsiya tizimi aynan oʻsha musiqani topadi."},{type:1,value:"br"},{type:0,value:"Plus multi-obunasida, shuningdek, Kinopoisk va ballar bilan keshbek mavjud"}],"vibe-wheel.activity-description":[{type:0,value:"Mashgʻulotga mos Mening toʻlqinim"}],"vibe-wheel.activity-fall-asleep":[{type:0,value:"Uxlab qolyapman"}],"vibe-wheel.activity-road-trip":[{type:0,value:"Yoʻlda"}],"vibe-wheel.activity-wake-up":[{type:0,value:"Uyg‘onyapman"}],"vibe-wheel.activity-work-background":[{type:0,value:"Ishlayapman"}],"vibe-wheel.activity-workout":[{type:0,value:"Mashg‘ulotdaman"}],"vibe-wheel.mood-description":[{type:0,value:"Kayfiyatga mos Mening toʻlqinim"}],"vibe-wheel.mood-energetic":[{type:0,value:"Faol"}],"vibe-wheel.mood-happy":[{type:0,value:"Quvonchli"}],"vibe-wheel.mood-sad":[{type:0,value:"G‘amgin"}],"warning-messages.can-break-accessibility":[{type:0,value:"Kirish imkoniyatini buzishi mumkin"}],"warning-messages.update-your-browser":[{type:0,value:"Yandex Music xato ishlashi mumkin – brauzerni yangilang\n"}],"welcome-page.beta-header":[{type:0,value:"Tez orada bu yerda "},{type:1,value:"br"},{type:0,value:"jaranglaydi"}],"welcome-page.beta-text-short":[{type:0,value:"Kechroq qayting"}],"welcome-page.not-auth-header":[{type:0,value:"Ilovani ochish uchun"},{type:1,value:"br"},{type:0,value:"hisobingizga kiring"}],"welcome-page.not-auth-text":[{type:0,value:"Yandex Music Plus multi-obunasi orqali mavjud"}],"welcome-page.offer-header":[{type:0,value:"Sizda hozircha Plus multi-obunasi mavjud emas"}],"welcome-page.offer-text":[{type:0,value:"Ilovaga kirish uchun multi-obunani rasmiylashtiring."}],"windows-menu.close":[{type:0,value:"Yopish"}],"windows-menu.roll-up":[{type:0,value:"Kichaytirish"}],"windows-menu.unwrap":[{type:0,value:"Kattaytirish"}],"wizard.button-done":[{type:0,value:"Tayyor"}],"wizard.button-little-more":[{type:0,value:"Bir oz qoldi"}],"wizard.button-one-more":[{type:0,value:"Yana bitta va tamom"}],"wizard.button-tune":[{type:0,value:"Sizga moslashtiriladigan"}],"wizard.buttonText":[{type:0,value:"Ijrochilarni tanlash"}],"wizard.description":[{type:0,value:"Mos musiqani maslahat berish uchun siz haqingizda ko‘proq bilishni xohlaymiz. Sevimli ijrochilarni tanlang va tavsiyalar sizga moslashtiriladi."}],"wizard.modal-text":[{type:0,value:"This will make your recommendations more accurate and interesting"}],"wizard.modal-title":[{type:0,value:"Sevimli ijrochilaringizni tanlang"}],"wizard.title":[{type:0,value:"O‘zingiz haqingizda aytib bering"}],"words.ai-description":[{type:0,value:"AI xato qilishi mumkin, muhim maʼlumotlarni tekshiring"}],"words.dislike":[{type:0,value:"Toʻgʻri kelmaydi"}],"words.dislike-feedback":[{type:0,value:"Yanada yaxshiroq bo‘lishimga yordam berayotganingiz uchun rahmat"}],"words.like":[{type:0,value:"Yana shunaqasidan"}],"words.like-feedback":[{type:0,value:"Baho uchun rahmat"}],"words.loading-phrase-catching":[{type:0,value:"Ritmni ilgʻayman"}],"words.loading-phrase-collecting-interesting":[{type:0,value:"AI kuchi bilan qiziqarli narsalar yigʻyapman"}],"words.loading-phrase-reading":[{type:0,value:"Artist haqida oʻqiyapman"}],"words.loading-phrase-studying":[{type:0,value:"Ovoz ohangini oʻrganyapman"}],"words.loading-phrase-tuning":[{type:0,value:"Tayyorlanyapman"}],"words.show-more":[{type:0,value:"Shunga oʻxshashlar tez-tez koʻrsatilsinmi?"}],"ynison.desktop-device-title":[{type:1,value:"platformName"},{type:0,value:" ("},{type:1,value:"hostname"},{type:0,value:") ilovasi"}]};const translationsKK = {"a11y-regions.player":[{type:0,value:"Плеер"}],"a11y-regions.wheel":[{type:0,value:"Менің толқынымның ұсынымы"}],"about-app.app-name":[{type:0,value:"Яндекс Mузыка"}],"about-app.explicit-content":[{type:0,value:"Яндекс Музыка сервисінде кәмелетке толмағандарға арналмаған ақпарат болуы мүмкін. Яндекс Музыка – музыкалық ұсынымдардың ең дәл жүйесі. 2025 жылдың сәуір айында музыкалық стриминг сервистерінің арасында РФ пайдаланушылары үшін дербес ұсынымдарды таңдау дәлдігінің дәрежесі бойынша. Ромир Бірыңғай деректер панелінің базасында 18-59 жас аралығындағы респонденттер арасында «Майл дата» ЖШҚ жүргізген сауалнама нәтижелеріне негізделген."}],"ads.about-advertiser":[{type:0,value:"Жарнама беруші туралы"}],"ads.ad":[{type:0,value:"Жарнама"}],"ads.continue-ad":[{type:0,value:"Ойнату жарнамадан кейін бірден басталады"}],"ads.disable-ads":[{type:0,value:"Жарнаманы өшіру"}],"ads.learn-more":[{type:0,value:"Толығырақ білу"}],"ads.notification":[{type:0,value:"Плюс мультижазылымымен жарнамасыз тыңдаңыз"}],"advert.banner":[{type:0,value:"Жарнама"}],"album-errors.error-during-loading-album":[{type:0,value:"Альбомды жүктеу кезінде қате туындады"}],"album-errors.error-during-loading-similar-albums":[{type:0,value:"Ұқсас альбомдарды жүктеу кезінде қате туындады"}],"album.external-streamings-title":[{type:0,value:"Басқа алаңдардан тыңдау"}],"artist-errors.error-during-loading-artist":[{type:0,value:"Әртісті жүктеу кезінде қате орын алды"}],"artist-errors.error-during-loading-artist-info":[{type:0,value:"Орындаушы туралы ақпаратты жүктегенде қате орын алды"}],"artist.about-artist":[{type:0,value:"Орындаушы туралы"}],"artist.about-composer":[{type:0,value:"Композитор туралы"}],"artist.artist-in-playlists":[{type:0,value:"Кездесетін плейлистер"}],"artist.artist-links-label":[{type:0,value:"Орындаушы "},{type:1,value:"artistName"},{type:0,value:": $"},{type:1,value:"linkName"}],"artist.official-pages":[{type:0,value:"Ресми парақшалар"}],"artist.stats-less-listeners-per-month":[{type:0,value:"Алдыңғы 30"},{type:1,value:"nbsp"},{type:0,value:"күнге қарағанда"},{type:1,value:"br"},{type:1,value:"number"},{type:1,value:"nbsp"},{type:0,value:"азырақ"}],"artist.stats-listeners-per-month":[{type:0,value:"Бір айдағы тыңдаушылар саны"}],"artist.stats-more-listeners-per-month":[{type:0,value:"Алдыңғы 30"},{type:1,value:"nbsp"},{type:0,value:"күнге қарағанда"},{type:1,value:"br"},{type:1,value:"number"},{type:1,value:"nbsp"},{type:0,value:"көбірек"}],"artist.stats-same-listeners-per-month":[{type:0,value:"Алдыңғы 30 күнде"},{type:1,value:"br"},{type:0,value:"қанша болса, сонша"}],"authorization-messages.need-to-authorizate":[{type:0,value:"Алдымен авторизациядан өту керек"}],"authorization.enter-and-listen-button":[{type:0,value:"Кіру және шектеулерсіз тыңдау"}],"authorization.enter-button":[{type:0,value:"Кіру"}],"authorization.enter-subtitle":[{type:0,value:"Музыка мен подкастарды шектеулерсіз тыңдау үшін"}],"authorization.enter-text":[{type:0,value:"Кіріп, барлық құрылғыларыңыздан музыканың ортақ топтамасына қолжетімділік алыңыз."}],"authorization.enter-title":[{type:0,value:"Аккаунтқа кіріңіз"}],"authorization.enter-tooltip":[{type:0,value:"Аккаунтқа кіру"}],"authorization.start-button":[{type:0,value:"Бастау"}],"bar-below.section-name":[{type:0,value:"Баннер"}],"branded-player.branding-integration":[{type:0,value:"Жарнама интеграциясы"}],"branded-player.car":[{type:0,value:"Машина"}],"branded-player.default":[{type:0,value:"Стандартты"}],"branded-player.duck":[{type:0,value:"Үйрек"}],"branded-player.hide":[{type:0,value:"Жасыру"}],"branded-player.player-type":[{type:0,value:"Плеер түрі"}],"branded-player.to-website":[{type:0,value:"Сайтқа өту"}],"buy-subscription.activate":[{type:0,value:"Қосылу"}],"buy-subscription.already-in-plus":[{type:0,value:"Мен бұрыннан"},{type:1,value:"nbsp"},{type:0,value:"Плюстемін"}],"buy-subscription.get-more-discoveries":[{type:0,value:"Плюс"},{type:1,value:"nbsp"},{type:0,value:"мультижазылымы"},{type:1,value:"nbsp"},{type:0,value:"болса, Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Музыкадан көп жаңа"},{type:1,value:"nbsp"},{type:0,value:"нәрсе табасыз!"}],"buy-subscription.listen-without-restrictions":[{type:0,value:"Яндекс Музыканы"},{type:1,value:"nbsp"},{type:0,value:"шектеусіз тыңдаңыз"}],"buy-subscription.music-and-films-and-other":[{type:0,value:"Музыка, кино және көптеген басқа нәрселер"}],"buy-subscription.new-vibe-description":[{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Плюс"},{type:1,value:"nbsp"},{type:0,value:"Мультижазылымымен музыканы"},{type:1,value:"nbsp"},{type:0,value:"жарнамасыз"},{type:1,value:"nbsp"},{type:0,value:"тыңдаңыз. Сондай-ақ Кинопоиск,"},{type:1,value:"nbsp"},{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Музыка және ұпайлар түрінде"},{type:1,value:"nbsp"},{type:0,value:"кешбэкке қолжетімділік алыңыз"}],"buy-subscription.offer-for-you":[{type:0,value:"Сіз үшін "},{type:1,value:"offerText"}],"buy-subscription.plus-benefit-non-music":[{type:0,value:"Музыка, подкастар мен"},{type:1,value:"nbsp"},{type:0,value:"аудиокітаптар"}],"buy-subscription.plus-benefit-offline":[{type:0,value:"Тіпті интернетсіз"},{type:1,value:"nbsp"},{type:0,value:"тыңдай аласыз"}],"buy-subscription.plus-benefit-other-services":[{type:0,value:"Сондай-ақ Кинопоиск және"},{type:1,value:"nbsp"},{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Книги"}],"buy-subscription.plus-benefit-recommendations":[{type:0,value:"Ең дәл ұсынымдар"}],"calendar.april-short":[{type:0,value:"сәу"}],"calendar.august-short":[{type:0,value:"там"}],"calendar.december-short":[{type:0,value:"желт"}],"calendar.february-short":[{type:0,value:"ақп"}],"calendar.january-short":[{type:0,value:"қаңт"}],"calendar.july-short":[{type:0,value:"шіл"}],"calendar.june-short":[{type:0,value:"мау"}],"calendar.march-short":[{type:0,value:"нау"}],"calendar.may-short":[{type:0,value:"мам"}],"calendar.november-short":[{type:0,value:"қар"}],"calendar.october-short":[{type:0,value:"қаз"}],"calendar.september-short":[{type:0,value:"қырк"}],"collection.collection-color":[{type:0,value:"Музыкаңыздың "},{children:[{type:0,value:"түсі"}],type:8,value:"color"},{type:0,value:" бар"}],"collection.collection-color-description":[{type:0,value:"Менің толқыным мен Топтамаға сізді шабыттандыратын музыка түсін қостық"}],"collection.collection-color-title":[{type:0,value:"Сізбен бірге өзгереді"}],"collection.created-playlists-list":[{type:0,value:"Плейлистерімнің тізімі"}],"collection.empty-liked-tracks-text":[{type:0,value:"Оларды осы плейлиске қосу үшін тректерге лайк қойыңыз. Ал сүйіктіні табуға Менің толқыным көмектеседі"}],"collection.empty-liked-tracks-title":[{type:0,value:"Мұнда сүйікті тректеріңіз шығады"}],"collection.liked-albums-list":[{type:0,value:"Сүйікті альбомдардың тізімі"}],"collection.liked-artists-list":[{type:0,value:"Сүйікті орындаушылардың тізімі"}],"collection.liked-non-music-list":[{type:0,value:"Сүйікті подкастар мен кітаптар тізімі"}],"collection.liked-playlists-list":[{type:0,value:"Сүйікті плейлистердің тізімі"}],"collection.my-dislikes":[{type:0,value:"Менің дизлайктарым"}],"collection.new-playlist":[{type:0,value:"Жаңа плейлист"}],"collection.your-created-playlists":[{type:0,value:"Cіз жинағандар"}],"collection.your-liked-playlists":[{type:0,value:"Сізге ұнағаны"}],"concerts.about-event-kind":[{options:{concert:{value:[{type:0,value:"Концерт туралы"}]},festival:{value:[{type:0,value:"Фестиваль туралы"}]},musical:{value:[{type:0,value:"Мюзикл туралы"}]},other:{value:[{type:1,value:"kind"},{type:0,value:" туралы"}]},tribute:{value:[{type:0,value:"Трибьют туралы"}]},unspecified:{value:[{type:0,value:"Концерт туралы"}]}},type:5,value:"kind"}],"concerts.all-concerts":[{type:0,value:"Сіз үшін концерттер"}],"concerts.cities-list":[{type:0,value:"Қалалар тізімі"}],"concerts.concerts-nearby":[{type:0,value:"Жақын жердегі концерттер"}],"concerts.details-title":[{type:0,value:"Концерттер"}],"concerts.event-kind":[{options:{concert:{value:[{type:0,value:"Концерт"}]},festival:{value:[{type:0,value:"Фестиваль"}]},musical:{value:[{type:0,value:"Мюзикл"}]},other:{value:[{type:1,value:"kind"}]},tribute:{value:[{type:0,value:"Трибьют"}]},unspecified:{value:[{type:0,value:"Концерт"}]}},type:5,value:"kind"}],"concerts.feed-error":[{type:0,value:"Концерттерді жүктеу кезінде қате орын алды"}],"concerts.find-city":[{type:0,value:"Қаланы табу"}],"concerts.nearby":[{type:0,value:"Жанында"}],"concerts.nothing-found":[{type:0,value:"Ештеңе табылмады"}],"concerts.onboarding":[{type:0,value:"Сіздің сүйікті"},{type:1,value:"nbsp"},{type:0,value:"әртістеріңіздің концерттері жиналған"},{type:1,value:"nbsp"},{type:0,value:"жаңа бөлім — «браво» деп айқай саламыз!"}],"concerts.top-for-you":[{type:0,value:"Сізге арналған топ"}],"concerts.try-different-query":[{type:0,value:"Басқаша жазып көріңіз"}],"crackdown.description":[{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Плюс мультижазылымын қосыңыз,"},{type:1,value:"br"},{type:0,value:"сонда сүйікті тректерді жарнамасыз тыңдай аласыз"}],"crackdown.title":[{type:0,value:"Шектеулері жоқ"},{type:1,value:"br"},{type:0,value:"Музыка"}],"deeplinks.download-from-app-gallery":[{type:0,value:"AppGallery арқылы жүктеп алу"}],"deeplinks.download-from-app-store":[{type:0,value:"AppStore арқылы жүктеу"}],"deeplinks.download-from-google-play":[{type:0,value:"Google Play-де жүктеу"}],"deeplinks.listen-in-app":[{type:0,value:"Қосымшада тыңдау"}],"desktop.about":[{type:0,value:"Қосымша туралы"}],"desktop.app-revision":[{type:1,value:"revision"},{type:0,value:" коды"}],"desktop.app-version":[{type:0,value:"Қосымша нұсқасы: "},{type:1,value:"version"}],"desktop.app-version-short":[{type:1,value:"version"},{type:0,value:" нұсқасы"}],"desktop.check-for-updates":[{type:0,value:"Жаңартымдарды тексеру"}],"desktop.close-yandex-music":[{type:0,value:"Яндекс Музыканы жабу"}],"desktop.copy":[{type:0,value:"Көшіру"}],"desktop.cut":[{type:0,value:"Қиып алу"}],"desktop.default-release-note":[{children:[{type:0,value:"Қосымшаға кіріңіз — онда сүйікті жанрлар ғана бар және бірде-бір баг жоқ. Бұл сәйкестік емес. Бұл жаңартылғаны"}],type:8,value:"p"},{type:0,value:" "},{children:[{type:0,value:"Яндекс Музыка командасының ең дәл ұсынымдары"}],type:8,value:"p"}],"desktop.edit":[{type:0,value:"Түзету"}],"desktop.hide-yandex-music":[{type:0,value:"Яндекс Музыканы жасыру"}],"desktop.minimize":[{type:0,value:"Жасыру"}],"desktop.on-update-available":[{type:1,value:"version"},{type:0,value:" нұсқасы қолжетімді"}],"desktop.paste":[{type:0,value:"Енгізу"}],"desktop.quit":[{type:0,value:"Қосымшаны жабу"}],"desktop.quit-yandex-music":[{type:0,value:"Яндекс Музыканы аяқтау"}],"desktop.recommendations":[{type:0,value:"Ұсынымдар ережелері"}],"desktop.redo":[{type:0,value:"Қайталау"}],"desktop.release-notes-modal-title":[{type:0,value:"Жаңа не бар?"}],"desktop.select-all":[{type:0,value:"Бәрін таңдау"}],"desktop.support":[{type:0,value:"Қолдау чаты"}],"desktop.terms":[{type:0,value:"Пайдаланушы келісімі"}],"desktop.undo":[{type:0,value:"Болдырмау"}],"desktop.update":[{type:0,value:"Жаңарту"}],"desktop.window":[{type:0,value:"Терезе"}],"donation.button-text":[{type:0,value:"Донатпен қолдау"}],"donation.support-artist":[{offset:0,options:{one:{value:[{type:0,value:"Әртісті қолдау"}]},other:{value:[{type:0,value:"Әртістерді қолдау"}]}},pluralType:"cardinal",type:6,value:"count"}],"donation.support-button":[{type:0,value:"Қолдау көрсету"}],"donation.support-text":[{type:0,value:"Донатпен қолдау білдіріңіз"}],"donation.transfer-any-amount":[{type:0,value:"Кез келген соманы аудара аласыз"}],"download-mobile-app.listen-in-app":[{type:0,value:"Қосымшада тыңдау"}],"download-mobile-app.listen-in-app-without-restrictions":[{type:0,value:"Қосымшада шектеулерсіз тыңдау"}],"download-mobile-app.stay":[{type:0,value:"Сайтта қалу"}],"download-mobile-app.subtitle":[{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Музыка"},{type:1,value:"nbsp"},{type:0,value:"мобильді"},{type:1,value:"nbsp"},{type:0,value:"қосымшасында"}],"download-mobile-app.title":[{type:0,value:"Музыка"},{type:1,value:"nbsp"},{type:0,value:"желі болмаса да"},{type:1,value:"nbsp"},{type:0,value:"істейді"}],"download-mobile-app.use-service-in-app-without-restrictions":[{type:0,value:"Яндекс Музыканы қосымшадан шектеулерсіз тыңдау"}],"drag-and-drop.failed-to-move":[{type:0,value:"Тректі көшіру мүмкін болмады"}],"drag-and-drop.playlist-move-instructions":[{type:0,value:"Плейлистегі тректің орнын ауыстыру үшін Enter пернесін басыңыз."}],"drag-and-drop.playlist-on-move":[{type:1,value:"trackName"},{type:0,value:" трегі "},{type:1,value:"index"},{type:0,value:" позициясына ауыстырылды. Ауыстыруды аяқтау үшін Enter пернесін басыңыз. Ауыстыруды тоқтату үшін Esc пернесін басыңыз."}],"drag-and-drop.playlist-on-move-cancel":[{type:0,value:"Тректің орнын ауыстыру тоқтатылды."}],"drag-and-drop.playlist-on-move-end":[{type:1,value:"trackName"},{type:0,value:" трегінің орны біржола ауыстырылды."}],"drag-and-drop.playlist-on-move-end-with-index":[{type:1,value:"trackName"},{type:0,value:" трегі біржола "},{type:1,value:"index"},{type:0,value:" позициясына ауыстырылды."}],"drag-and-drop.playlist-on-move-fail":[{type:1,value:"trackName"},{type:0,value:" трегі ауыстыру аймағы шегінен шығып кетті."}],"drag-and-drop.playlist-on-move-start":[{type:0,value:"Ауыстыру үшін "},{type:1,value:"index"},{type:0,value:" позициясындағы "},{type:1,value:"trackName"},{type:0,value:" трегі таңдалды."}],"entity-names.album":[{type:0,value:"Альбом"}],"entity-names.album-available-with-plus":[{type:0,value:"Бұл альбом Плюс опциясымен қолжетімді"}],"entity-names.album-name":[{type:0,value:"Альбом "},{type:1,value:"albumName"}],"entity-names.albums":[{type:0,value:"Альбомдар"}],"entity-names.albums-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"альбом"}]},other:{value:[{type:0,value:"альбом"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.albums-tracks-list":[{type:0,value:"«"},{type:1,value:"albumName"},{type:0,value:"» альбомы тректерінің тізімі"}],"entity-names.and-more-artists":[{type:1,value:"artists"},{type:0,value:" және басқалары"}],"entity-names.artist":[{type:0,value:"Әртіс"}],"entity-names.artist-albums-list":[{type:0,value:"Әртіс альбомдарының тізімі"}],"entity-names.artist-clips-list":[{type:0,value:"Әртістің бейнебаяндар тізімі"}],"entity-names.artist-compilations-list":[{type:0,value:"Әртіс жинақтарының тізімі "}],"entity-names.artist-name":[{type:0,value:"Әртіс "},{type:1,value:"artistName"}],"entity-names.artist-playlist":[{type:0,value:"Плейлистер"}],"entity-names.artist-popular-tracks":[{type:0,value:"Әртістің танымал тректері"}],"entity-names.artist-studio-albums-list":[{type:0,value:"Әртістің студиялық альбомдарының тізімі"}],"entity-names.artist-tracks-list":[{type:0,value:"Әртіс тректерінің тізімі"}],"entity-names.artists":[{type:0,value:"Орындаушылар"}],"entity-names.artists-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"орындаушы"}]},other:{value:[{type:0,value:"орындаушы"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.audio":[{type:0,value:"Аудио"}],"entity-names.audiobook":[{type:0,value:"Аудиокітап"}],"entity-names.audiobook-name":[{type:1,value:"bookName"},{type:0,value:" аудиокітабы"}],"entity-names.authors":[{type:0,value:"Авторлары: "},{type:1,value:"authors"}],"entity-names.book":[{type:0,value:"Кітап"}],"entity-names.cashback-percent":[{type:1,value:"value"},{type:0,value:"% кешбэк"}],"entity-names.chart-down":[{type:0,value:"Чарттағы орны төмендеп кетті"}],"entity-names.chart-new":[{type:0,value:"Чарттағы жаңа"}],"entity-names.chart-podcasts-list":[{type:0,value:"Чарт подкастарының тізімі"}],"entity-names.chart-same":[{type:0,value:"Чарттағы орны өзгерген жоқ"}],"entity-names.chart-tracks-list":[{type:0,value:"Чарт тректерінің тізімі"}],"entity-names.chart-up":[{type:0,value:"Чарттағы орны көтерілді"}],"entity-names.clip":[{type:0,value:"Клип"}],"entity-names.clip-name":[{type:1,value:"clipName"},{type:0,value:" клипі"}],"entity-names.clips":[{type:0,value:"Клиптер"}],"entity-names.clips-will-like":[{type:0,value:"Сізге ұнайды"}],"entity-names.collection":[{type:0,value:"Топтама"}],"entity-names.composer":[{type:0,value:"Композитор"}],"entity-names.concert":[{type:0,value:"Концерт"}],"entity-names.concerts":[{type:0,value:"Концерттер"}],"entity-names.created-playlists-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"жиналған плейлист"}]},other:{value:[{type:0,value:"жиналған плейлист"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.disk-number":[{type:0,value:"Диск "},{type:1,value:"number"}],"entity-names.editor-feature-is-show":[{type:0,value:"Қазір де көрсетіліп тұр"}],"entity-names.fairy-tale":[{type:0,value:"Аудио ертегі"}],"entity-names.fairytale":[{type:0,value:"Ертегі"}],"entity-names.favourite-albums":[{type:0,value:"Сүйікті альбомдар"}],"entity-names.favourite-playlists":[{type:0,value:"Сүйікті плейлистер"}],"entity-names.generative":[{type:0,value:"Нейромузыка"}],"entity-names.has-your-like":[{type:0,value:"Сіздің лайкыңыз бар"}],"entity-names.label":[{type:0,value:"Лейбл"}],"entity-names.label-albums-list":[{type:0,value:"Лейбл релиздері"}],"entity-names.label-artists-list":[{type:0,value:"Лейблдің орындаушылары"}],"entity-names.liked-artist":[{type:0,value:"Сізге ұнағаны"}],"entity-names.liked-playlist":[{type:0,value:"Маған ұнайды"}],"entity-names.liked-playlists-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"ұнатқан плейлист"}]},other:{value:[{type:0,value:"ұнатқан плейлист"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.likes-count-description":[{type:0,value:"Ұнатқан белгілер саны - "},{type:1,value:"count"}],"entity-names.likes-counter":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"лайк"}]},other:{value:[{type:0,value:"лайк"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.likes-counter-empty":[{type:0,value:"Әзірге лайктар жоқ"}],"entity-names.list-is-empty":[{type:0,value:"Тізім бос"}],"entity-names.listeners-per-month":[{type:0,value:"айына "},{style:null,type:2,value:"counter"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"тыңдаушы"}]},other:{value:[{type:0,value:"тыңдаушы"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.map-url":[{type:0,value:"Яндекс Карталарға сілтеме"}],"entity-names.metro-stations":[{type:0,value:"Метро станциялары"}],"entity-names.mixes":[{type:0,value:"Топтамалар"}],"entity-names.music-history":[{type:0,value:"Тыңдау тарихы"}],"entity-names.my-playlists":[{type:0,value:"Менің плейлистерім"}],"entity-names.my-vibe":[{type:0,value:"Менің толқыным"}],"entity-names.new-albums":[{type:0,value:"Жаңа альбомдар"}],"entity-names.new-albums-in-genre":[{type:0,value:"Осы жанрдағы жаңа альбомдар"}],"entity-names.new-playlist":[{type:0,value:"Жаңа плейлист"}],"entity-names.non-music-releases":[{type:0,value:"Шығарылымдар"}],"entity-names.number-of-books":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"кітап"}]},many:{value:[{type:0,value:"кітап"}]},one:{value:[{type:0,value:"кітап"}]},other:{value:[{type:0,value:"кітап"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-chapters":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"бөлім"}]},other:{value:[{type:0,value:"бөлім"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-episodes":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"шығарылым"}]},many:{value:[{type:0,value:"шығарылым"}]},one:{value:[{type:0,value:"шығарылым"}]},other:{value:[{type:0,value:"шығарылым"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-more-artists":[{type:0,value:"және тағы "},{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"орындаушы"}]},other:{value:[{type:0,value:"орындаушы"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-podcasts":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"подкаст"}]},many:{value:[{type:0,value:"подкаст"}]},one:{value:[{type:0,value:"подкаст"}]},other:{value:[{type:0,value:"подкаст"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.number-of-tracks":[{type:1,value:"counter"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"трек"}]},other:{value:[{type:0,value:"трек"}]}},pluralType:"cardinal",type:6,value:"counter"}],"entity-names.other-album-versions":[{type:0,value:"Альбомның басқа нұсқалары"}],"entity-names.other-albums-of-artist":[{type:0,value:"Орындаушының басқа альбомдары"}],"entity-names.percent":[{type:1,value:"value"},{type:0,value:"%"}],"entity-names.playlist":[{type:0,value:"Плейлист"}],"entity-names.playlist-name":[{type:0,value:"Плейлист "},{type:1,value:"playlistName"}],"entity-names.playlist-tracks-list":[{type:0,value:"«"},{type:1,value:"playlistName"},{type:0,value:"» плейлистерінің тректері тізімі"}],"entity-names.podcast":[{type:0,value:"Подкаст"}],"entity-names.podcast-last-episodes":[{type:0,value:"Соңғы шығарылымдар"}],"entity-names.podcast-name":[{type:1,value:"podcastName"},{type:0,value:" подкасты"}],"entity-names.podcasts-and-books":[{type:0,value:"Кітаптар мен подкастар"}],"entity-names.popular-among-users":[{type:0,value:"Тыңдаушыларда танымал"}],"entity-names.popular-artists":[{type:0,value:"Танымал орындаушылар"}],"entity-names.popular-playlists":[{type:0,value:"¶ Танымал плейлистер"}],"entity-names.publisher":[{type:0,value:"Баспагер"}],"entity-names.query-to-vibe-loading-description":[{type:0,value:"Люмен сіздің бабыңызды табады"}],"entity-names.query-to-vibe-loading-title":[{type:0,value:"Маған солай сияқты..."}],"entity-names.recently-release":[{type:0,value:"Жақында шыққан релиз"}],"entity-names.releases":[{type:0,value:"Релиздер"}],"entity-names.search":[{type:0,value:"Іздеу"}],"entity-names.season-number":[{type:1,value:"number"},{type:0,value:" маусымы"}],"entity-names.similar-artists":[{type:0,value:"Ұқсас орындаушылар"}],"entity-names.similar-playlists":[{type:0,value:"Ұқсас плейлисттер"}],"entity-names.singer":[{type:0,value:"Орындаушы"}],"entity-names.single":[{type:0,value:"Сингл"}],"entity-names.single-available-with-plus":[{type:0,value:"Бұл сингл Плюс опциясымен қолжетімді"}],"entity-names.source":[{type:0,value:"Дереккөз: "},{type:1,value:"source"}],"entity-names.tags":[{type:0,value:"Тегтер: "},{type:1,value:"tags"}],"entity-names.text":[{type:0,value:"Мәтін"}],"entity-names.top-artists":[{type:0,value:"Осы айдағы ТОП тізіміңіз"}],"entity-names.track":[{type:0,value:"Трек"}],"entity-names.track-in-playlist":[{type:0,value:"Осы плейлисте бұрыннан бар"}],"entity-names.track-name":[{type:0,value:"Трек "},{type:1,value:"trackName"}],"entity-names.track-name-by-type":[{options:{audiobook:{value:[{type:1,value:"name"},{type:0,value:" тарауы"}]},comment:{value:[{type:1,value:"name"},{type:0,value:" шығарылымы"}]},fairy_tale:{value:[{type:1,value:"name"},{type:0,value:" тарауы"}]},music:{value:[{type:1,value:"name"},{type:0,value:" трегі"}]},other:{value:[{type:1,value:"name"},{type:0,value:" трегі"}]},podcast_episode:{value:[{type:1,value:"name"},{type:0,value:" шығарылымы"}]}},type:5,value:"type"}],"entity-names.track-type":[{options:{audiobook:{value:[{type:0,value:"Бөлім"}]},comment:{value:[{type:0,value:"Шығарылым"}]},fairy_tale:{value:[{type:0,value:"Бөлім"}]},music:{value:[{type:0,value:"Трек"}]},other:{value:[{type:0,value:"Трек"}]},podcast_episode:{value:[{type:0,value:"Шығарылым"}]}},type:5,value:"type"}],"entity-names.tracks":[{type:0,value:"Тректер"}],"entity-names.tracks-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"трек"}]},other:{value:[{type:0,value:"трек"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.trailer":[{type:0,value:"Трейлер"}],"entity-names.upcoming-album-date":[{type:1,value:"releaseDate"},{type:0,value:" күні шығады"}],"entity-names.upcoming-album-name":[{type:0,value:"Жақын уақыттағы "},{type:1,value:"upcomingAlbumName"}],"entity-names.upcoming-album-play-disabled":[{type:0,value:"Ойнату үшін алдағы релизді күту керек"}],"entity-names.upcoming-albums":[{type:0,value:"Болашақ релиздер"}],"entity-names.upcoming-albums-count":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"болашақ релиз"}]},other:{value:[{type:0,value:"болашақ релиз"}]}},pluralType:"cardinal",type:6,value:"value"}],"entity-names.vibe-name":[{type:0,value:"Менің толқыным "},{type:1,value:"vibeName"}],"entity-names.vibe-room-name":[{type:0,value:"Менің толқыным "},{type:1,value:"name"},{type:0,value:". Күйі "},{type:1,value:"status"}],"equalizer.amp-label":[{type:1,value:"value"},{type:0,value:"dB"}],"equalizer.bass-and-treble-boost-preset":[{type:0,value:"ТЖ және ЖЖ күшеюі"}],"equalizer.bass-boost-preset":[{type:0,value:"ТЖ күшеюі"}],"equalizer.classical-preset":[{type:0,value:"Классикалық музыка"}],"equalizer.club-preset":[{type:0,value:"Клубтық музыка"}],"equalizer.concert-preset":[{type:0,value:"Концерт"}],"equalizer.custom-preset":[{type:0,value:"Өз баптауы"}],"equalizer.dance-preset":[{type:0,value:"Танцевальная"}],"equalizer.default-preset":[{type:0,value:"Әдепкі бойынша"}],"equalizer.disable-equalizer":[{type:0,value:"Эквалайзерді сөндіру"}],"equalizer.disabled":[{type:0,value:"Сөндірулі"}],"equalizer.enable":[{type:0,value:"Включить"}],"equalizer.enable-equalizer":[{type:0,value:"Эквалайзерді қосу"}],"equalizer.enabled":[{type:0,value:"Қосулы"}],"equalizer.frequency-label":[{type:1,value:"value"},{type:0,value:"k"}],"equalizer.large-hall-preset":[{type:0,value:"Үлкен зал"}],"equalizer.party-preset":[{type:0,value:"Сауық кеші"}],"equalizer.pop-preset":[{type:0,value:"Поп"}],"equalizer.preamp-level":[{type:0,value:"деңгей"}],"equalizer.reggae-preset":[{type:0,value:"Регги"}],"equalizer.rock-preset":[{type:0,value:"Рок-музыка"}],"equalizer.ska-preset":[{type:0,value:"Ска"}],"equalizer.slider-frequency-label":[{type:1,value:"label"},{type:0,value:" "},{type:1,value:"value"},{type:0,value:" децибел жиілігіндегі децибелдерд өзгерту"}],"equalizer.slider-preamp-label":[{type:0,value:"Алдын ала күшейту коэффициенті"}],"equalizer.soft-preset":[{type:0,value:"Жағымды дыбыс"}],"equalizer.soft-rock-preset":[{type:0,value:"Софт-рок"}],"equalizer.speakers-preset":[{type:0,value:"Ноутбук бағандары"}],"equalizer.techno-preset":[{type:0,value:"Техно"}],"equalizer.title":[{type:0,value:"Эквалайзер"}],"equalizer.treble-boost-preset":[{type:0,value:"ЖЖ күшеюі"}],"error-messages.empty-artist-familiar-collection-title":[{type:0,value:"Топтамаңызда әзірге орындаушының тректері жоқ"}],"error-messages.empty-artist-familiar-vibe-title":[{type:0,value:"Сіз әзірге Менің толқынымда орындаушының тректерін естіген жоқсыз"}],"error-messages.empty-collection-albums":[{type:0,value:"Альбомдарға лайк қойыңыз, олар осында шығады"}],"error-messages.empty-collection-albums-description":[{type:0,value:"Оларды көру үшін сингл мен альбомдарға лайк қойыңыз"}],"error-messages.empty-collection-albums-title":[{type:0,value:"Топтамаңызда альбом жоқ"}],"error-messages.empty-collection-artists-title":[{type:0,value:"Орындаушыларға лайк қойсаңыз, олар осында шығады"}],"error-messages.empty-collection-clips-text":[{type:0,value:"Әзірге — ұсынымдарымызды қараңыз"}],"error-messages.empty-collection-clips-title":[{type:0,value:"Клиптерге лайк қойыңыз, олар осында пайда болады"}],"error-messages.empty-collection-kids-sub-page-link":[{type:0,value:"Балалар бөліміне өту"}],"error-messages.empty-collection-kids-sub-page-title":[{type:0,value:"Әндер мен шығарылымдарға лайк баса бастаңыз, сонда олар осы жерде пайда болады"}],"error-messages.empty-collection-liked-playlists":[{type:0,value:"Плейлистерге лайк қойыңыз, сонда олар осында пайда болады"}],"error-messages.empty-collection-playlist-description":[{type:0,value:"Тректерді іздеу арқылы табуға болады"}],"error-messages.empty-collection-playlist-title":[{type:0,value:"Тректерді плейлистке қосыңыз"}],"error-messages.empty-collection-podcasts":[{type:0,value:"Подкастарға лайк қойыңыз, олар осында шығады"}],"error-messages.empty-collection-podcasts-and-books":[{type:0,value:"Топтамада подкастар мен кітаптарыңыз жоқ"}],"error-messages.empty-collection-upcoming-albums-title":[{type:0,value:"Әртістер парақшаларындағы болашақ релиздерге лайк қойыңыз, сонда олар осында пайда болады"}],"error-messages.empty-collection-vibe-rooms-title":[{type:0,value:"Сілтемені бөлісіп, талғамдарыңызды біріктіретін екі адамға арналған Менің толқынымды тыңдаңыз. Жеке ұсынымдар өзгермейді"}],"error-messages.empty-shelf-liked-page-link":[{type:0,value:"Подкастарға өту"}],"error-messages.empty-shelf-liked-page-title":[{type:0,value:"Подкастарды тыңдап, лайк баса бастасаңыз, олар осында пайда болады"}],"error-messages.empty-shelf-new-episodes-text":[{type:0,value:"Әзірге сіз тыңдаған подкастың жаңа шығарылымын қостық"}],"error-messages.empty-shelf-new-episodes-title":[{type:0,value:"Подкастарға лайк қойып бастаңыз, жаңа шығарылымдары осында шығады"}],"error-messages.empty-shelf-new-episodes-title-no-tracks":[{type:0,value:"Тыңдап көріңіз, подкастарға лайк қойып бастаңыз да, олар осында пайда болады"}],"error-messages.empty-shelf-page-title":[{type:0,value:"Подкастарды тыңдай бастаңыз, сонда олар осы жерде пайда болады"}],"error-messages.error-during-action":[{type:0,value:"Әрекетті орындау кезінде қате туындады"}],"error-messages.error-during-initial-loading":[{type:0,value:"Бастаған кезде деректердің бір бөлігін ала алмадық"}],"error-messages.error-load-part-page":[{type:0,value:"Парақшаның бөлігін жүктеу мүмкін болмады"}],"error-messages.error-load-wizard":[{type:0,value:"Қате орын алды. Орындаушыларды таңдауға кейінірек оралыңыз."}],"error-messages.multivibe-create-link":[{type:0,value:"Сілтеме жасау мүмкін болмады. Қайтадан көріңіз"}],"error-messages.something-went-wrong":[{type:0,value:"Бірдеңе дұрыс болмады"}],"extra-explicit.confirm-unsafe-album":[{type:0,value:"Альбомға"}],"extra-explicit.confirm-unsafe-artist":[{type:0,value:"Әртіске өту"}],"extra-explicit.confirm-unsafe-audiobook":[{type:0,value:"Аудиокітапқа өту"}],"extra-explicit.confirm-unsafe-clip":[{type:0,value:"Бейнебаянға өту"}],"extra-explicit.confirm-unsafe-podcast":[{type:0,value:"Подкастқа"}],"extra-explicit.confirm-unsafe-track":[{type:0,value:"Трекке өту"}],"extra-explicit.explicit-mark":[{type:0,value:"Контент балаларға арналмаған"}],"extra-explicit.play-unavailable":[{type:0,value:"Ойнату қолжетімсіз"}],"extra-explicit.reject-unsafe-entity":[{type:0,value:"Тыңдамаймын"}],"family.about":[{type:0,value:"Мультижазылым туралы толығырақ"}],"family.about1":[{type:0,value:"Мультижазылым туралы көбірек ақпарат"}],"family.accept":[{type:0,value:"Қабылдау"}],"family.go-to-music":[{type:0,value:"Музыкаға өту"}],"family.info-description":[{type:0,value:"Музыканы тыңдаңыз және Плюстің басқа да"},{type:1,value:"br"},{type:0,value:"артықшылықтарын отбасылық мультижазылымда"},{type:1,value:"br"},{type:0,value:"жақындарыңызбен бірге қолданыңыз"}],"family.info-title":[{type:0,value:"Сізді Яндекс"},{type:1,value:"br"},{type:0,value:"Плюске шақырып жатыр"}],"family.invitation-error-description":[{type:0,value:"Шақырудан бас тартқан, не болмаса сізді шақырған пайдаланушының мультижазылымында бос орын жоқ"}],"family.invitation-error-title":[{type:0,value:"Шақыру жарамсыз"}],"family.later":[{type:0,value:"Кейінірек"}],"family.reject":[{type:0,value:"Бас тарту"}],"family.retry":[{type:0,value:"Қайталау"}],"family.subscription-error-description":[{type:0,value:"Сізді шақырған адамға хабарласып көріңіз, не болмаса музыканы дәл қазір тыңдау үшін өз Плюсіңізді қосыңыз"}],"family.subscription-error-title":[{type:0,value:"Мультижазылым қолжетімсіз"}],"family.success-description":[{type:0,value:"Сізге Музыка, Кинопоиск"},{type:1,value:"br"},{type:0,value:"және Яндекстің сервистерінде ұпайлармен кешбэк қолжетімді"}],"family.success-title":[{type:0,value:"Енді сіз Плюстесіз!"}],"family.terms":[{type:0,value:"Мультижазылым шарттары"}],"family.unknown-error-description":[{type:0,value:"Нақты не екенін білмейміз. Интернетті тексеріңіз және қайта байқап көріңіз"}],"family.unknown-error-title":[{type:0,value:"Шақыртуды қабылдау мүмкін болмады"}],"faq.title":[{type:0,value:"Жиі қойылатын сұрақтарға"},{type:1,value:"nbsp"},{type:0,value:"жауаптар"}],"footer.disclaimer-content":[{type:0,value:"Яндекс Музыка – ең дәл музыкалық ұсынымдар жүйесі. 2025 жылғы сәуір айында музыкалық&nbsp;стриминг сервистерінің арасында РФ&nbsp;пайдаланушылары үшін дербес ұсынымдарды іріктеп алу дәлдігінің дәрежесі бойынша. 18-59&nbsp;жас аралығындағы респонденттер арасында Ромир&nbsp;Бірыңғай деректер панелінің базасында&nbsp;«Майл дата» ЖШҚ жүргізген сауалнама нәтижелерінің деректеріне негізделген."},{type:0,value:"<br/>"},{type:0,value:"<br/>"},{type:0,value:"Яндекс Музыка&nbsp;сервисінде кәмелетке толмағандарға арналған&nbsp;ақпарат болуы мүмкін. Мұндай материалдар (!) таңбасымен белгіленген. Есірткі заттарын, психотроптық&nbsp;заттарды, оларға ұқсас заттарды заңсыз&nbsp;пайдалану денсаулыққа зиян келтіреді, олардың заңсыз айналымына заңмен&nbsp;тыйым салынған және заңнама бойынша белгіленген жауапкершілік қарастырылған"}],"footer.explicit-content":[{type:0,value:"Яндекс Музыка сервисінде жасы кәмелетке толмағандарға&nbsp;арналмаған&nbsp;ақпарат болуы мүмкін"}],"footer.links-copyright-holders":[{type:0,value:"Құқық иелеріне"}],"footer.links-help":[{type:0,value:"Анықтама"}],"footer.links-privacy-policy":[{type:0,value:"Құпиялық саясаты"}],"footer.links-recommendation-rules":[{type:0,value:"Ұсынымдар ережелері"}],"footer.links-terms":[{type:0,value:"Пайдаланушы келісімі"}],"footer.yandex-music":[{type:0,value:"Yandex Music"}],"footer.yandex-project":[{type:0,value:"Яндекс компаниясының жобасы"}],"future-feature.message":[{type:0,value:"Функция өңделіп жатыр, бірақ жақын арада қолжетімді болады."}],"interface-actions.add-track-to-playlist":[{type:0,value:"Тректі плейлиске қосу"}],"interface-actions.add-tracks-to-playlist":[{type:0,value:"Басқа плейлиске қосу"}],"interface-actions.cancel":[{type:0,value:"Болдырмау"}],"interface-actions.change":[{type:0,value:"Өзгерту"}],"interface-actions.clear":[{type:0,value:"Мәтін өрісін тазарту"}],"interface-actions.close":[{type:0,value:"Жабу"}],"interface-actions.close-ad":[{type:0,value:"Жарнаманы жабу"}],"interface-actions.close-my-vibe-settings":[{type:0,value:"Баптаулар мәзірін жабу"}],"interface-actions.close-quality-settings":[{type:0,value:"Дыбыс баптау мәзірін жабу"}],"interface-actions.configure-my-vibe":[{type:0,value:"Баптау"}],"interface-actions.confirm":[{type:0,value:"Түсінікті"}],"interface-actions.context-menu":[{type:0,value:"Контекстік мәзір"}],"interface-actions.context-menu-artists":[{type:0,value:"Әртістер бар контекст мәзірі"}],"interface-actions.copy-iframe":[{type:0,value:"HTML-код"}],"interface-actions.copy-link":[{type:0,value:"Сілтемені көшіру"}],"interface-actions.create":[{type:0,value:"Жасау"}],"interface-actions.date-today":[{type:0,value:"Бүгін"}],"interface-actions.date-yesterday":[{type:0,value:"Кеше"}],"interface-actions.delete-multivibe":[{type:0,value:"Екі адамға арналған Менің толқынымнан шығу"}],"interface-actions.do-not-like":[{type:0,value:"Ұнамайды"}],"interface-actions.edit":[{type:0,value:"Өзгерту"}],"interface-actions.editorial-tools":[{type:0,value:"Редакция құралдары"}],"interface-actions.further":[{type:0,value:"Келесі"}],"interface-actions.go-to-collection":[{type:0,value:"Топтамаға өту"}],"interface-actions.hide-sync-lyrics":[{type:0,value:"Мәтінмузыканы жасыру"}],"interface-actions.like":[{type:0,value:"Ұнайды"}],"interface-actions.mark-all-listened":[{type:0,value:"Бәрін тыңдалды деп белгілеу"}],"interface-actions.mark-all-non-listened":[{type:0,value:"Бәрін тыңдалмады деп белгілеу"}],"interface-actions.mark-listened":[{type:0,value:"Тыңдалды деп белгілеу"}],"interface-actions.mark-non-listened":[{type:0,value:"Тыңдалмады деп белгілеу"}],"interface-actions.more":[{type:0,value:"Тағы"}],"interface-actions.more-details":[{type:0,value:"Толығырақ"}],"interface-actions.my-vibe-context-settings":[{type:0,value:"Іс бойынша"}],"interface-actions.my-vibe-settings":[{type:0,value:"Менің толқынымды баптау"}],"interface-actions.navigate-to-admin":[{type:0,value:"Админкаға өту"}],"interface-actions.navigate-to-album":[{type:0,value:"Альбомға өту"}],"interface-actions.navigate-to-artist":[{type:0,value:"Орындаушыға өту"}],"interface-actions.navigate-to-artists":[{type:0,value:"Орындаушыларға өту"}],"interface-actions.navigate-to-track":[{type:0,value:"Трекке өту"}],"interface-actions.open-lyrics":[{type:0,value:"Әннің мәтінін көрсету"}],"interface-actions.open-play-queue":[{type:0,value:"Кезекті ашу"}],"interface-actions.open-sync-lyrics":[{type:0,value:"Мәтіндік музыканы қосу"}],"interface-actions.pin":[{type:0,value:"Бекіту"}],"interface-actions.pin-my-vibe":[{type:0,value:"Менің толқынымды бекіту"}],"interface-actions.playlist-made-date":[{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"},{type:0,value:" жиналды"}],"interface-actions.playlist-made-date-with-year":[{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"},{type:0,value:" жиналды"}],"interface-actions.playlist-made-for-date":[{type:1,value:"playlistReceiver"},{type:0,value:" үшін "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"},{type:0,value:" кезінде жиналды "}],"interface-actions.playlist-made-for-date-with-year":[{type:1,value:"playlistReceiver"},{type:0,value:" үшін "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"},{type:0,value:" уақытта жиналды"}],"interface-actions.playlist-made-for-today":[{type:1,value:"playlistReceiver"},{type:0,value:" үшін бүгін жиналды"}],"interface-actions.playlist-made-for-yesterday":[{type:1,value:"playlistReceiver"},{type:0,value:" үшін кеше жиналды"}],"interface-actions.playlist-made-today":[{type:0,value:"Бүгін жиналды"}],"interface-actions.playlist-made-yesterday":[{type:0,value:"Кеше жиналды"}],"interface-actions.quality":[{type:0,value:"Сапасы"}],"interface-actions.reload-part-page":[{type:0,value:"Парақша бөлімдерін қайта жүктеу"}],"interface-actions.rename":[{type:0,value:"Атауын өзгерту"}],"interface-actions.report-problem":[{type:0,value:"Қиындық туралы хабарлау"}],"interface-actions.reset-context":[{type:1,value:"context"},{type:0,value:" алып тастау және Менің толқынымды қосу"}],"interface-actions.reset-my-vibe-settings":[{type:0,value:"Алып тастау"}],"interface-actions.reset-search-input":[{type:0,value:"Іздеуді тазарту"}],"interface-actions.save":[{type:0,value:"Сақтау"}],"interface-actions.share":[{type:0,value:"Бөлісу"}],"interface-actions.show-duplicates":[{type:0,value:"Телнұсқаларды көрсету"}],"interface-actions.show-genres":[{type:0,value:"Жанрларды көрсету"}],"interface-actions.show-majors":[{type:0,value:"majors-ты көрсету"}],"interface-actions.speed":[{type:0,value:"Ойнату жылдамдығы "},{type:1,value:"speed"},{type:0,value:" "}],"interface-actions.subscribe":[{type:0,value:"Подкастқа жазылу"}],"interface-actions.subscribed":[{type:0,value:"Сіз жазылдыңыз"}],"interface-actions.unpin":[{type:0,value:"Ажырату"}],"interface-actions.unpin-my-vibe":[{type:0,value:"Менің толқынымды алып тастау"}],"interface-actions.updated-anonymously-playlist-date":[{type:0,value:"Плейлист "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"},{type:0,value:" жаңартылды"}],"interface-actions.updated-anonymously-playlist-date-with-year":[{type:0,value:"Плейлист "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"},{type:0,value:" жаңартылды"}],"interface-actions.updated-anonymously-playlist-today":[{type:0,value:"Плейлист бүгін жаңартылды"}],"interface-actions.updated-anonymously-playlist-yesterday":[{type:0,value:"Плейлист кеше жаңартылды"}],"interface-actions.updated-playlist-date":[{type:1,value:"ownerName"},{type:0,value:" плейлисті "},{style:{parsedOptions:{day:"numeric",month:"long"},pattern:"\"d MMMM\"",type:1},type:3,value:"updateDate"},{type:0,value:" күні "},{options:{female:{value:[{type:0,value:"жаңартты"}]},male:{value:[{type:0,value:"жаңартты"}]},other:{value:[{type:0,value:"жаңартты"}]}},type:5,value:"gender"}],"interface-actions.updated-playlist-date-with-year":[{type:1,value:"ownerName"},{type:0,value:" плейлисті "},{style:{parsedOptions:{day:"numeric",month:"long",year:"numeric"},pattern:"\"d MMMM y\"",type:1},type:3,value:"updateDate"},{type:0,value:" күні "},{options:{female:{value:[{type:0,value:"жаңартты"}]},male:{value:[{type:0,value:"жаңартты"}]},other:{value:[{type:0,value:"жаңартты"}]}},type:5,value:"gender"}],"interface-actions.updated-playlist-today":[{type:1,value:"ownerName"},{type:0,value:" плейлисті бүгін "},{options:{female:{value:[{type:0,value:"жаңартты"}]},male:{value:[{type:0,value:"жаңартты"}]},other:{value:[{type:0,value:"жаңартты"}]}},type:5,value:"gender"}],"interface-actions.updated-playlist-yesterday":[{type:1,value:"ownerName"},{type:0,value:" кеше плейлисті "},{options:{female:{value:[{type:0,value:"жаңартты"}]},male:{value:[{type:0,value:"жаңартты"}]},other:{value:[{type:0,value:"жаңартты"}]}},type:5,value:"gender"}],"interface-actions.xlsx-download":[{type:0,value:"Excel-файлды жүктеу"}],"kids.albums-and-podcasts":[{type:0,value:"Альбомдар, подкастар мен ертегілер"}],"kids.empty-collection-text":[{type:0,value:"Балалар әндері мен ертегілерге лайк қойыңыз да, сонда олар осында пайда болады"}],"kids.favourite-tracks-and-episodes":[{type:0,value:"Сүйікті әндер мен шығарылымдар"}],"kids.for-kids":[{type:0,value:"Балаларға"}],"lite-version.description":[{type:0,value:"Визуалдық әсерлер мен анимациялар жеңілдетілген форматта жүктелетін болады"}],"lite-version.go-to-settings":[{type:0,value:"Баптауларға өту"}],"lite-version.notification-title":[{type:0,value:"Lite-нұсқа қосылды"}],"lite-version.title":[{type:0,value:"Lite-нұсқаны қосу"}],"loading-messages.concert-is-loading":[{type:0,value:"Концерт жүктелуде"}],"loading-messages.content-is-loading":[{type:0,value:"Контент жүктеліп жатыр"}],"loading-messages.entity-is-loading":[{type:1,value:"entityName"},{type:0,value:" жүктелуде"}],"mixes.albums-list":[{type:0,value:"«"},{type:1,value:"genreName"},{type:0,value:"» топтамасы альбомдарының тізімі"}],"mixes.playlists-list":[{type:0,value:"«"},{type:1,value:"genreName"},{type:0,value:"» топтамасы плейлистерінің тізімі"}],"multivibe.enabled-room-modal-button-text":[{type:0,value:"Тыңдау"}],"multivibe.enabled-room-modal-description":[{type:0,value:"Бірлескен ұсынымдары бар Менің толқынымды тыңдаңыз"}],"multivibe.enabled-room-modal-title":[{type:0,value:"Екі адамға арналған Менің толқыным жасалды"}],"multivibe.go-to-collection-button-text":[{type:0,value:"Коллекцияға өту"}],"multivibe.invite-modal-draft-description":[{type:0,value:"Шақыруларды қабылдаған кезде сіздің Коллекцияңызда екі адамға арналған Менің толқыным пайда болады"}],"multivibe.invite-modal-draft-title":[{type:0,value:"Шақыру әлі қабылданған жоқ"}],"multivibe.invite-modal-invalid-button-text":[{type:0,value:"Жасау"}],"multivibe.invite-modal-invalid-description":[{type:0,value:"Жаңа шақыру жіберуді сұраңыз немесе екі адамға арналған Менің толқынымды жасаңыз"}],"multivibe.invite-modal-invalid-title":[{type:0,value:"Бұл шақыру енді жарамсыз"}],"multivibe.invite-modal-valid-button-text":[{type:0,value:"Қосылу"}],"multivibe.invite-modal-valid-description":[{type:0,value:"Талғамыңызды біріктіретін Менің толқынымды тыңдаңыз. Жеке ұсынымдар&nbsp;өзгермейді"}],"multivibe.invite-modal-valid-title":[{type:1,value:"name"},{type:0,value:" сізді екі адамға арналған Менің толқыныма шақырады"}],"multivibe.link-successfully-copied":[{type:0,value:"Екі адамға арналған Менің толқыныма сілтеме көшіріп алынды"}],"multivibe.modal-subtitle":[{type:0,value:"Сіздің нағыз байланысыңыз"}],"multivibe.nda":[{type:0,value:"NDA"}],"multivibe.only-member-modal-description":[{type:0,value:"Екі адамға арналған Менің толқынымды тыңдау үшін сілтемені қайта жіберіңіз"}],"multivibe.only-member-modal-title":[{type:0,value:"Екі адамға арналған Менің толқынымда сіз ғанасыз"}],"multivibe.promo-modal-co-brand-a11y":[{type:0,value:"Билайн қолдауымен қолжетімді"}],"multivibe.promo-modal-description":[{type:0,value:"Сілтемені жіберіп, талғамдарыңызды үйлестіретін Менің толқынымды тыңдаңыз. Дербес ұсынымдарыңыз өзгермейді"}],"multivibe.promo-modal-title":[{type:0,value:"Екі адамға арналған Менің толқыным"}],"multivibe.room-limit-exceeded-description":[{type:0,value:"Сіз екі адам үшін 50 Менің толқынымды жасадыңыз. Жаңасын жасау үшін ағымдағылардың бірінен шығыңыз"}],"multivibe.room-limit-exceeded-title":[{type:0,value:"Көптеген жұп!"}],"multivibe.room-status-disabled":[{type:0,value:"белсенді емес"}],"multivibe.room-status-enabled":[{type:0,value:"белсенді"}],"multivibe.room-unavailable":[{type:0,value:"Енді қолжетімсіз"}],"music-history.album":[{type:0,value:"Альбом"}],"music-history.artist":[{type:0,value:"Орындаушы"}],"music-history.empty-title":[{type:0,value:"Осы жерден соңғы кездері тыңдаған нәрсенің бәрін табасыз"}],"music-history.my-vibe":[{type:0,value:"Менің толқыным"}],"music-history.playlist":[{type:0,value:"Плейлист"}],"music-history.search":[{type:0,value:"Іздеу нәтижелері"}],"music-history.shuffle":[{type:0,value:"Аралас тыңдады"}],"music-history.title":[{type:0,value:"Тарих"}],"navigation.best-recommendations":[{type:0,value:"Ең дәл ұсынымдар"}],"navigation.go-back":[{type:0,value:"Артқа оралу"}],"navigation.go-forward":[{type:0,value:"Алға оралу"}],"navigation.go-home":[{type:0,value:"Яндекс Музыкаға өту"}],"navigation.main-menu":[{type:0,value:"Негізгі мәзір"}],"navigation.page-collection":[{type:0,value:"Топтама"}],"navigation.page-for-you-and-trends":[{type:0,value:"Сіз үшін және трендтер"}],"navigation.page-main":[{type:0,value:"Басты бет"}],"navigation.page-my-vibe":[{type:0,value:"Менің толқыным"}],"navigation.page-plus":[{type:0,value:"Сіздің Плюсіңіз"}],"navigation.pins-list":[{type:0,value:"Бекітілгені"}],"navigation.search":[{type:0,value:"Іздеу"}],"non-music.audiobook-artist":[{type:0,value:"Оқушы"}],"non-music.audiobook-artists":[{type:0,value:"Оқушылар"}],"non-music.audiobook-list":[{type:0,value:"«"},{type:1,value:"albumName"},{type:0,value:"» аудиокітабының мазмұны"}],"non-music.audiobook-tab-about":[{type:0,value:"Кітап туралы"}],"non-music.audiobook-tab-tracks":[{type:0,value:"Мазмұны"}],"non-music.book-available-with-plus":[{type:0,value:"Бұл кітап Плюс опциясымен қолжетімді"}],"non-music.continue-listen-landing-block-title":[{type:0,value:"Тыңдауды жалғастыру"}],"non-music.fairy-tale-available-with-plus":[{type:0,value:"Бұл ертегі Плюс опциясымен қолжетімді"}],"non-music.fairytale-tab-about":[{type:0,value:"Ертегі туралы"}],"non-music.navigate-to-book-album":[{type:0,value:"Кітапқа өту"}],"non-music.navigate-to-clip":[{type:0,value:"Клипке өту"}],"non-music.navigate-to-podcast-album":[{type:0,value:"Подкасқа өту"}],"non-music.non-music-progress":[{type:0,value:"Тыңдалым прогресі "},{type:1,value:"progress"},{type:0,value:"%, "},{options:{"0":{value:[]},other:{value:[{type:1,value:"beginHours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"сағат"}]},many:{value:[{type:0,value:"сағат"}]},one:{value:[{type:0,value:"сағат"}]},other:{value:[{type:0,value:"сағат"}]}},pluralType:"cardinal",type:6,value:"beginHours"}]}},type:5,value:"beginHours"},{type:0,value:"\n"},{options:{"0":{value:[]},other:{value:[{type:1,value:"beginMinutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"минут"}]},many:{value:[{type:0,value:"минут"}]},one:{value:[{type:0,value:"минут"}]},other:{value:[{type:0,value:"минут"}]}},pluralType:"cardinal",type:6,value:"beginMinutes"}]}},type:5,value:"beginMinutes"},{type:0,value:"\n"},{options:{"0":{value:[]},other:{value:[{type:1,value:"beginSeconds"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"секунд"}]},many:{value:[{type:0,value:"секунд"}]},one:{value:[{type:0,value:"секунд"}]},other:{value:[{type:0,value:"секунд"}]}},pluralType:"cardinal",type:6,value:"beginSeconds"}]}},type:5,value:"beginSeconds"},{type:0,value:" из "},{options:{"0":{value:[]},other:{value:[{type:1,value:"endHours"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"сағат"}]},many:{value:[{type:0,value:"сағат"}]},one:{value:[{type:0,value:"сағат"}]},other:{value:[{type:0,value:"сағат"}]}},pluralType:"cardinal",type:6,value:"endHours"}]}},type:5,value:"endHours"},{type:0,value:"\n"},{options:{"0":{value:[]},other:{value:[{type:1,value:"endMinutes"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"минут"}]},many:{value:[{type:0,value:"минут"}]},one:{value:[{type:0,value:"минут"}]},other:{value:[{type:0,value:"минут"}]}},pluralType:"cardinal",type:6,value:"endMinutes"}]}},type:5,value:"endMinutes"},{type:0,value:"\n"},{options:{"0":{value:[]},other:{value:[{type:1,value:"endSeconds"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"секунд"}]},many:{value:[{type:0,value:"секунд"}]},one:{value:[{type:0,value:"секунд"}]},other:{value:[{type:0,value:"секунд"}]}},pluralType:"cardinal",type:6,value:"endSeconds"}]}},type:5,value:"endSeconds"},{type:0,value:"."}],"non-music.podcast-available-with-plus":[{type:0,value:"Бұл подкаст Плюс опциясымен қолжетімді"}],"non-music.shelf-subscribe":[{type:0,value:"Сөреге алып қою"}],"non-music.shelf-unsubscribe":[{type:0,value:"Сөреден алып тастау"}],"notifications-info.added-audiobook-episode-to-playlist":[{type:1,value:"trackName"},{type:0,value:" тарауы «"},{type:1,value:"playlistName"},{type:0,value:"» плейлистіне қосылды"}],"notifications-info.added-podcast-episode-to-playlist":[{type:1,value:"trackName"},{type:0,value:" шығарылымы «"},{type:1,value:"playlistName"},{type:0,value:"» плейлистіне қосылды"}],"notifications-info.added-to":[{type:0,value:"мында қосылды: "}],"notifications-info.added-track-to-playlist":[{type:1,value:"trackName"},{type:0,value:" атты трек «"},{type:1,value:"playlistName"},{type:0,value:"» плейлистіне қосылды"}],"notifications-info.added-tracks-to-playlist":[{type:0,value:"Тректер «"},{type:1,value:"playlistName"},{type:0,value:"» плейлистіне қосылды"}],"notifications-info.album-added-to-collection":[{type:1,value:"entity"},{type:0,value:" альбомы "},{children:[{type:0,value:"Топтамаға"}],type:8,value:"collection"},{type:0,value:" қосылды"}],"notifications-info.album-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" альбомы Коллекцияға қосылды"}],"notifications-info.album-link":[{type:0,value:"Link to the album"}],"notifications-info.album-pinned-in-menu":[{type:1,value:"entity"},{type:0,value:" альбомы бүйірлік мәзірге бекітілді"}],"notifications-info.album-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" альбомы "},{children:[{type:0,value:"Топтамадан"}],type:8,value:"collection"},{type:0,value:" жойылды"}],"notifications-info.album-removed-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" альбомы Коллекциядан жойылды"}],"notifications-info.album-unpinned-from-menu":[{type:1,value:"entity"},{type:0,value:" альбомы бүйірлік мәзірден жойылды"}],"notifications-info.already-added-tracks":[{type:0,value:"Бүкіл тректер берілген плейлиске қосылды"}],"notifications-info.artist-added-to-collection":[{type:0,value:"Орындаушы "},{type:1,value:"entity"},{type:0,value:" "},{children:[{type:0,value:"Топтамаға"}],type:8,value:"collection"},{type:0,value:" қосылды"}],"notifications-info.artist-added-to-collection-aria-label":[{type:0,value:"Орындаушы "},{type:1,value:"entity"},{type:0,value:" Коллекцияға қосылды"}],"notifications-info.artist-available-in-recommendations":[{type:0,value:"Енді орындаушы сізге арналған ұсынымдарда көрінетін болады"}],"notifications-info.artist-link":[{type:0,value:"Link to the artist"}],"notifications-info.artist-pinned-in-menu":[{type:0,value:"Орындаушы "},{type:1,value:"entity"},{type:0,value:" бүйірлік мәзірге бекітілді"}],"notifications-info.artist-removed-from-collection":[{type:0,value:"Орындаушы "},{type:1,value:"entity"},{type:0,value:" "},{children:[{type:0,value:"Топтамадан"}],type:8,value:"collection"},{type:0,value:" жойылды"}],"notifications-info.artist-removed-from-collection-aria-label":[{type:0,value:"Орындаушы "},{type:1,value:"entity"},{type:0,value:" Коллекциядан жойылды"}],"notifications-info.artist-unavailable-in-recommendations":[{type:0,value:"Орындаушы енді сіздің ұсынымдарыңызда көрсетілмейді"}],"notifications-info.artist-unpinned-from-menu":[{type:0,value:"Орындаушы "},{type:1,value:"entity"},{type:0,value:" бүйірлік мәзірден жойылды"}],"notifications-info.audiobook-added-to-collection":[{type:1,value:"entity"},{type:0,value:" аудиокітабы "},{children:[{type:0,value:"Топтамаға"}],type:8,value:"collection"},{type:0,value:" қосылды"}],"notifications-info.audiobook-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" аудиокітабы Коллекцияға қосылды"}],"notifications-info.audiobook-episode-added-to-shelf":[{type:1,value:"entity"},{type:0,value:" тарауы "},{children:[{type:0,value:"Топтамаға"}],type:8,value:"collection"},{type:0,value:" қосылды"}],"notifications-info.audiobook-episode-added-to-shelf-aria-label":[{type:1,value:"entity"},{type:0,value:" тарауы Коллекцияға қосылды"}],"notifications-info.audiobook-episode-available-in-recommendations":[{type:0,value:"Енді тарау ұсынымдарыңызда пайда болады"}],"notifications-info.audiobook-episode-removed-from-shelf":[{type:1,value:"entity"},{type:0,value:" тарауы "},{children:[{type:0,value:"Топтамадан"}],type:8,value:"collection"},{type:0,value:" жойылды"}],"notifications-info.audiobook-episode-removed-from-shelf-aria-label":[{type:1,value:"entity"},{type:0,value:" тарауы Коллекциядан жойылды"}],"notifications-info.audiobook-episode-unavailable-in-recommendations":[{type:0,value:"Тарау енді ұсынымдарыңызда пайда болмайды"}],"notifications-info.audiobook-pinned-in-menu":[{type:1,value:"entity"},{type:0,value:" аудиокітабы бүйірлік мәзірге бекітілді"}],"notifications-info.audiobook-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" аудиокітабы "},{children:[{type:0,value:"Топтамадан"}],type:8,value:"collection"},{type:0,value:" жойылды"}],"notifications-info.audiobook-removed-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" аудиокітабы Коллекциядан жойылды"}],"notifications-info.audiobook-unpinned-from-menu":[{type:1,value:"entity"},{type:0,value:" аудиокітабы бүйірлік мәзірден жойылды"}],"notifications-info.change-repeat-context":[{type:0,value:"Плейлистті қайталау қосылған"}],"notifications-info.change-repeat-none":[{type:0,value:"Қайталау өшірулі"}],"notifications-info.change-repeat-track":[{type:0,value:"Тректі қайталау қосылған"}],"notifications-info.clip-added-to-collection":[{type:1,value:"entity"},{type:0,value:" бейнебаяны "},{children:[{type:0,value:"Коллекцияға"}],type:8,value:"collection"},{type:0,value:" қосылды"}],"notifications-info.clip-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" бейнебаяны Коллекцияға қосылды"}],"notifications-info.clip-link":[{type:0,value:"Клиптің сілтемесі"}],"notifications-info.clip-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" бейнебаяны "},{children:[{type:0,value:"Коллекциядан"}],type:8,value:"collection"},{type:0,value:" жойылды"}],"notifications-info.clip-removed-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" бейнебаяны Коллекциядан жойылды"}],"notifications-info.concert-link":[{type:0,value:"Концертке сілтеме"}],"notifications-info.copied":[{type:0,value:"көшірілді"}],"notifications-info.entity-pinned-in-menu":[{type:1,value:"description"},{type:0,value:" "},{type:1,value:"entity"},{type:0,value:" енді бүйір мәзірде"}],"notifications-info.entity-unpinned-from-menu":[{type:0,value:"\n"},{type:1,value:"description"},{type:0,value:" "},{type:1,value:"entity"},{type:0,value:" енді бүйір мәзірде емес"}],"notifications-info.fairytale-added-to-collection":[{type:1,value:"entity"},{type:0,value:" ертегісі "},{children:[{type:0,value:"Коллекцияға"}],type:8,value:"collection"},{type:0,value:" қосылды"}],"notifications-info.fairytale-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" ертегісі Коллекцияға қосылды"}],"notifications-info.fairytale-pinned-in-menu":[{type:1,value:"entity"},{type:0,value:" ертегісі бүйірлік мәзірге бекітілді"}],"notifications-info.fairytale-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" ертегісі "},{children:[{type:0,value:"Коллекциядан"}],type:8,value:"collection"},{type:0,value:" жойылды"}],"notifications-info.fairytale-removed-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" ертегісі Коллекциядан жойылды"}],"notifications-info.fairytale-unpinned-from-menu":[{type:1,value:"entity"},{type:0,value:" ертегісі бүйірлік мәзірден жойылды"}],"notifications-info.from-collection":[{type:0,value:"Топтамалар"}],"notifications-info.html-code-copied":[{type:0,value:"HTML-код көшірілді"}],"notifications-info.label-link":[{type:0,value:"Лейблдің сілтемесі"}],"notifications-info.my-vibe-pinned-in-menu":[{type:0,value:"Менің толқыным "},{type:1,value:"entity"},{type:0,value:" бүйірлік мәзірге бекітілді"}],"notifications-info.my-vibe-unpinned-from-menu":[{type:0,value:"Менің толқыным "},{type:1,value:"entity"},{type:0,value:" бүйірлік мәзірінен жойылды"}],"notifications-info.playlist-added-to-collection":[{type:1,value:"entity"},{type:0,value:" плейлисті "},{children:[{type:0,value:"Топтамаға"}],type:8,value:"collection"},{type:0,value:" қосылды"}],"notifications-info.playlist-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" плейлисті Коллекцияға қосылды"}],"notifications-info.playlist-link":[{type:0,value:"Link to the playlist"}],"notifications-info.playlist-pinned-in-menu":[{type:1,value:"entity"},{type:0,value:" плейлисті бүйірлік мәзірге бекітілді"}],"notifications-info.playlist-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" плейлисті "},{children:[{type:0,value:"Топтамадан"}],type:8,value:"collection"},{type:0,value:" жойылды"}],"notifications-info.playlist-removed-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" плейлисті Коллекциядан жойылды"}],"notifications-info.playlist-unpinned-from-menu":[{type:1,value:"entity"},{type:0,value:" плейлисті бүйір мәзірден өшірілді"}],"notifications-info.podcast-added-to-collection":[{type:1,value:"entity"},{type:0,value:" подкасты "},{children:[{type:0,value:"Топтамаға"}],type:8,value:"collection"},{type:0,value:" қосылды"}],"notifications-info.podcast-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" подкасты Коллекцияға қосылды"}],"notifications-info.podcast-episode-added-to-collection":[{type:1,value:"entity"},{type:0,value:" шығарылымы "},{children:[{type:0,value:"Топтамаға"}],type:8,value:"collection"},{type:0,value:" қосылды"}],"notifications-info.podcast-episode-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" шығарылымы Коллекцияға қосылды"}],"notifications-info.podcast-episode-available-in-recommendations":[{type:0,value:"Енді шығарылым ұсынымдарыңызда пайда болады"}],"notifications-info.podcast-episode-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" шығарылымы "},{children:[{type:0,value:"Топтамадан"}],type:8,value:"collection"},{type:0,value:" жойылды"}],"notifications-info.podcast-episode-removed-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" шығарылымы Коллекциядан жойылды"}],"notifications-info.podcast-episode-unavailable-in-recommendations":[{type:0,value:"Шығарылым енді ұсынымдарыңызда көрсетілмейді"}],"notifications-info.podcast-pinned-in-menu":[{type:1,value:"entity"},{type:0,value:" подкасты бүйірлік мәзірге бекітілді"}],"notifications-info.podcast-remove-from-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" подкасты Коллекциядан жойылды"}],"notifications-info.podcast-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" подкасты "},{children:[{type:0,value:"Топтамадан"}],type:8,value:"collection"},{type:0,value:" жойылды"}],"notifications-info.podcast-unpinned-from-menu":[{type:1,value:"entity"},{type:0,value:" подкасты бүйірлік мәзірі жойылды"}],"notifications-info.quality-changed":[{type:1,value:"quality"},{type:0,value:" дыбыс сапасы қосылған"}],"notifications-info.removed-audiobook-episode-from-playlist":[{type:0,value:"«"},{type:1,value:"playlistName"},{type:0,value:"» плейлистінен "},{type:1,value:"trackName"},{type:0,value:" тарауы жойылды"}],"notifications-info.removed-from":[{type:0,value:"мына жерден жойылды:"}],"notifications-info.removed-podcast-episode-from-playlist":[{type:0,value:"«"},{type:1,value:"playlistName"},{type:0,value:"» плейлистінен "},{type:1,value:"trackName"},{type:0,value:" шығарылымы жойылды"}],"notifications-info.removed-track-from-playlist":[{type:0,value:"«"},{type:1,value:"playlistName"},{type:0,value:"» плейлистінен "},{type:1,value:"trackName"},{type:0,value:" трегі жойылды"}],"notifications-info.shuffle-disabled":[{type:0,value:"Қатарынан ойнату"}],"notifications-info.shuffle-enabled":[{type:0,value:"Кездейсоқ тәртіп"}],"notifications-info.to-collection":[{type:0,value:"Топтаманы"}],"notifications-info.track-added-to-collection":[{type:1,value:"entity"},{type:0,value:" трегі "},{children:[{type:0,value:"«Маған ұнайды»"}],type:8,value:"collection"},{type:0,value:" плейлистіне қосылды"}],"notifications-info.track-added-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" атты трек «Маған ұнайды» плейлистіне қосылды"}],"notifications-info.track-available-in-recommendations":[{type:0,value:"Енді трек сіздің ұсынымдарыңызда көрсетілетін болады"}],"notifications-info.track-link":[{type:0,value:"Трекке сілтеме"}],"notifications-info.track-removed-from-collection":[{type:1,value:"entity"},{type:0,value:" трегі "},{children:[{type:0,value:"«Маған ұнайды»"}],type:8,value:"collection"},{type:0,value:" плейлистінен жойылды"}],"notifications-info.track-removed-to-collection-aria-label":[{type:1,value:"entity"},{type:0,value:" атты трек «Маған ұнайды» плейлистінен жойылды"}],"notifications-info.track-unavailable-in-recommendations":[{type:0,value:"Енді трек сіздің ұсынымдарыңызда көрсетілмейтін болады"}],"notifications-info.xlsx-loading":[{type:0,value:"Excel-файлды қалыптастыру"}],"notifications-info.xlsx-success":[{type:0,value:"Excel-файл сәтті жүктелді"}],"offline.clear-memory":[{type:0,value:"Жадыны тазарту"}],"offline.clear-memory-description":[{type:0,value:"Тек жүктелгені мен кэшті жоямыз. Бұл ұсынымдарыңыз бен лайктарыңызға әсер етпейді"}],"offline.delete-from-device":[{type:0,value:"Құрылғыдан жою"}],"offline.disable-offline-mode":[{type:0,value:"Офлайн режимді өшіру"}],"offline.download":[{type:0,value:"Жүктеу"}],"offline.download-for-offline":[{type:0,value:"Офлайн қосылу үшін музыканы жүктеңіз"}],"offline.download-progress":[{type:0,value:"Жүктеу прогресі"}],"offline.downloaded-empty":[{type:0,value:"Сізде жүктелгені жоқ"}],"offline.downloaded-track-list":[{type:0,value:"Жүктелген тректер тізімі"}],"offline.downloaded-tracks":[{type:0,value:"Жүктеп алынған тректер"}],"offline.downloading-progress":[{type:1,value:"value"},{type:0,value:"%"}],"offline.listen-downloaded-content":[{type:0,value:"Қазір жүктелгенді ғана тыңдай аласыз"}],"offline.memory-cleared":[{type:0,value:"Құрылғы жады тазартылды"}],"offline.no-internet-connection":[{type:0,value:"Интернет жоқ"}],"offline.offline-mode":[{type:0,value:"Офлайн-режим"}],"offline.offline-mode-description":[{type:0,value:"Жүктелгенді интернетсіз тыңдаңыз"}],"offline.offline-mode-enabled":[{type:0,value:"Офлайн режим қосулы"}],"offline.stop-downloading":[{type:0,value:"Жүктеуді тоқтату"}],"offline.track-download-error":[{type:0,value:"Тректі жүктеу кезінде қате орын алды"}],"offline.track-downloaded":[{type:0,value:"Трек жүктелді"}],"onboarding.artist-donation-button-1":[{type:0,value:"Сүйікті әртісіңізге"},{type:1,value:"br"},{type:0,value:"донатпен қолдау көрсетіңіз"}],"onboarding.authorize-to-add-to-collection":[{type:0,value:"Коллекцияға қосу"},{type:1,value:"nbsp"},{type:0,value:"үшін аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.authorize-to-add-track-to-queue":[{type:0,value:"Тректі"},{type:1,value:"nbsp"},{type:0,value:"кезекке қою үшін аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.authorize-to-change-quality":[{type:0,value:"Дыбыс"},{type:1,value:"nbsp"},{type:0,value:"сапасын баптау үшін аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.authorize-to-dislike":[{type:0,value:"Дизлайк басу үшін аккаунтқа кіріңіз"}],"onboarding.authorize-to-like":[{type:0,value:"Лайк басу үшін аккаунтқа кіріңіз"}],"onboarding.authorize-to-listen-full":[{type:0,value:"Тректі толық тыңдау үшін аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.authorize-to-listen-vibe":[{type:0,value:"Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.authorize-to-listen-vibe-by-activity":[{type:0,value:"Кәсібіңізге"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.authorize-to-listen-vibe-by-album":[{type:0,value:"Альбомға"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.authorize-to-listen-vibe-by-artist":[{type:0,value:"Әртіске"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.authorize-to-listen-vibe-by-genre":[{type:0,value:"Жанрға"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.authorize-to-listen-vibe-by-mood":[{type:0,value:"Көңіл-күйге"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.authorize-to-listen-vibe-by-playlist":[{type:0,value:"Плейлистке"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.authorize-to-listen-vibe-by-track":[{type:0,value:"Трекке"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.authorize-to-open-queue":[{type:0,value:"Кезекті ашу үшін аккаунтқа кіріңіз"}],"onboarding.authorize-to-pin":[{type:0,value:"Сайдбарға/мәзірге"},{type:1,value:"nbsp"},{type:0,value:"бекітіп қою үшін аккаунтқа кіріңіз"}],"onboarding.authorize-to-view-sync-lyrics":[{type:0,value:"Мәтін-музыканы қарау үшін аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"кіріңіз"}],"onboarding.rewind-trailer":[{type:0,value:"Жылдың"},{type:1,value:"br"},{type:0,value:"үздік трейлерін қосыңыз"}],"onboarding.trailer":[{type:0,value:"Музыканы"},{type:1,value:"br"},{type:0,value:"үздік үзінді бойынша іздеңіз"}],"onboarding.try-plus-to-enable-high-quality":[{type:0,value:"Жоғары сапаны қосу үшін мультижазылымды іске қосыңыз"}],"onboarding.try-plus-to-listen-full":[{type:0,value:"Тректі толығымен тыңдау үшін мультижазылымды іске қосыңыз"}],"onboarding.try-plus-to-listen-vibe":[{type:0,value:"Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"мультижазылымды іске қосыңыз"}],"onboarding.try-plus-to-listen-vibe-by-activity":[{type:0,value:"Кәсібіңізге"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"мультижазылымды іске қосыңыз"}],"onboarding.try-plus-to-listen-vibe-by-album":[{type:0,value:"Альбомға"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"мультижазылымды іске қосыңыз"}],"onboarding.try-plus-to-listen-vibe-by-artist":[{type:0,value:"Әртіске"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"мультижазылымды іске қосыңыз"}],"onboarding.try-plus-to-listen-vibe-by-genre":[{type:0,value:"Жанрға"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"мультижазылымды іске қосыңыз"}],"onboarding.try-plus-to-listen-vibe-by-mood":[{type:0,value:"Көңіл-күйге"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"мультижазылымды іске қосыңыз"}],"onboarding.try-plus-to-listen-vibe-by-playlist":[{type:0,value:"Плейлистке"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"мультижазылымды іске қосыңыз"}],"onboarding.try-plus-to-listen-vibe-by-track":[{type:0,value:"Трекке"},{type:1,value:"nbsp"},{type:0,value:"сай Менің"},{type:1,value:"nbsp"},{type:0,value:"толқынымды тыңдау үшін"},{type:1,value:"br"},{type:0,value:"мультижазылымды іске қосыңыз"}],"onboarding.try-plus-to-open-collection":[{type:0,value:"Өз Коллекцияңызды ашу"},{type:1,value:"nbsp"},{type:0,value:"үшін мультижазылымды іске қосыңыз"}],"onboarding.try-plus-to-view-sync-lyrics":[{type:0,value:"Музыка-мәтінді қарау үшін"},{type:1,value:"br"},{type:0,value:"жазылымды іске қосыңыз"}],"page-error.concert-page-does-not-exist":[{type:0,value:"Мұндай концертті таппадық"}],"page-error.concert-page-does-not-exist-description":[{type:0,value:"Бәлкім ол өтіп кеткен немесе қате кеткен болуы мүмкін"}],"page-error.page-does-not-exist":[{type:0,value:"Парақша табылмады"}],"page-error.page-does-not-exist-description":[{type:0,value:"Осы бөлімнен іздеп көріңіз"}],"page-error.reload":[{type:0,value:"Жаңарту"}],"page-error.reload-page-button":[{type:0,value:"Парақшаны жаңарту"}],"page-error.restart-app-button":[{type:0,value:"Қолданбаны қайта жүктеу"}],"page-error.try-to-reload-page":[{type:0,value:"Парақшаны жаңартып көріңіз"}],"page-error.try-to-restart-app":[{type:0,value:"Қолданбаны қайта жүктеп көріңіз"}],"page.album-label-title":[{options:{"1":{value:[{type:0,value:"Лейбл"}]},other:{value:[{type:0,value:"Лейблдер"}]}},type:5,value:"count"},{type:0,value:":"}],"page.album-publisher-title":[{options:{"1":{value:[{type:0,value:"Баспагер"}]},other:{value:[{type:0,value:"Баспагерлер"}]}},type:5,value:"count"},{type:0,value:":"}],"page.artist-albums-header":[{type:1,value:"artistName"},{type:0,value:" альбомдары"}],"page.artist-all-concerts-header":[{type:1,value:"artistName"},{type:0,value:" бүкіл концерттері"}],"page.artist-clips-header":[{type:1,value:"artistName"},{type:0,value:" бейнебаяндары"}],"page.artist-compilations-header":[{type:1,value:"artistName"},{type:0,value:" жинақтары"}],"page.artist-concerts-header":[{type:1,value:"artistName"},{type:0,value:" концерттері"}],"page.artist-discography-header":[{type:1,value:"artistName"},{type:0,value:" студиялық альбомдары"}],"page.artist-pick-aria-label":[{type:1,value:"artistName"},{type:0,value:" жаңа сахнасы"}],"page.artist-pick-subtitle":[{type:0,value:"Жаңа сахна"}],"page.artist-similar-header":[{type:1,value:"artistName"},{type:0,value:" ұқсас орындаушылар"}],"page.artist-tracks-header":[{type:1,value:"artistName"},{type:0,value:" танымал тректері"}],"page.delayed-non-music":[{type:0,value:"Кейінге қалдырылған подкастар мен кітаптар"}],"page.familiar-collection":[{type:0,value:"Сіздің Топтамада"}],"page.familiar-vibe":[{type:0,value:"Менің толқынымда тыңдағаныңыз"}],"page.familiar-you":[{type:0,value:"Сізге таныс"}],"page.label-albums-header":[{type:1,value:"labelName"},{type:0,value:" релиздері"}],"page.label-artists-header":[{type:1,value:"labelName"},{type:0,value:" орындаушылары"}],"page.label-podcast-header":[{type:1,value:"labelName"},{type:0,value:" шығарылымдары"}],"page.podcasts-and-books":[{type:0,value:"Подкастар мен кітаптар"}],"page.results-of-the-year":[{type:0,value:"Жыл қорытындылары"}],"page.settings":[{type:0,value:"Баптаулар"}],"page.shelf":[{type:0,value:"Менің сөрем"}],"page.similar-entities-block-title":[{type:0,value:"Ұқсасын тыңдаңыз"}],"page.summer_2026_title":[{type:0,value:"Өз жазыңызды ашыңыз"}],"page.vibe-rooms":[{type:0,value:"Екі адамға арналған Менің толқыным"}],"payment.album-offer-button-title":[{type:0,value:"Альбомды тыңдау"}],"payment.books-offer-button-title":[{type:0,value:"Аудиокітапты тыңдау"}],"payment.buy":[{type:0,value:"Сатып алу"}],"payment.fairy-tale-offer-button-title":[{type:0,value:"Ертегі тыңдау"}],"payment.high-quality-offer-button-title":[{type:0,value:"Жоғары сапада тыңдау"}],"payment.learn-personal-bonus":[{type:0,value:"Өз дербес бонусыңызды біліп алыңыз"}],"payment.min-price":[{type:1,value:"value"},{type:0,value:" бастап"}],"payment.offer-button":[{type:0,value:"Мультижазылымды ресімдеу"}],"payment.podcast-offer-button-title":[{type:0,value:"Подкасты тыңдаңыз"}],"payment.single-offer-button-title":[{type:0,value:"Сингл тыңдау"}],"payment.try-button":[{type:0,value:"Қолданып көру"}],"payment.yandex-plus-offer-button":[{type:0,value:"Яндекс Плюс мультижазылымы бойынша"}],"paywall-footer.cashback-terms-link":[{type:0,value:"Кешбэк шарттары"}],"paywall-footer.privileges-terms-link":[{type:0,value:"Артықшылықтар шарттары"}],"paywall-footer.promotion-terms-link":[{type:0,value:"Науқан шарттары"}],"paywall-footer.subscription-terms-link":[{type:0,value:"Мультижазылым шарттары"}],"paywall-footer.subscription-terms-link-other-countries":[{type:0,value:"Жазылым шарттарын"}],"paywall-footer.support-link":[{type:0,value:"Қолдау көрсету қызметі"}],"paywall.books-part-benefit-app-desktop":[{type:0,value:"Бөлек"},{type:1,value:"nbsp"},{type:0,value:"қосымшада оқыңыз және"},{type:1,value:"nbsp"},{type:0,value:"тыңдаңыз"}],"paywall.books-part-benefit-download-desktop":[{type:0,value:"Кітаптарды"},{type:1,value:"nbsp"},{type:0,value:"құрылғыға жүктеп алыңыз"}],"paywall.books-part-benefit-download-mobile":[{type:0,value:"Кітаптарды"},{type:1,value:"nbsp"},{type:0,value:"құрылғыға жүктеп алыңыз"}],"paywall.books-part-benefit-follow-desktop":[{type:0,value:"Жаңалықтарды"},{type:1,value:"nbsp"},{type:0,value:"қарап отырыңыз және"},{type:1,value:"nbsp"},{type:0,value:"классикаға"},{type:1,value:"nbsp"},{type:0,value:"оралыңыз"}],"paywall.books-part-benefit-read-mobile":[{type:0,value:"Жаңалықтар мен"},{type:1,value:"nbsp"},{type:0,value:"классиканы оқыңыз"}],"paywall.books-part-benefit-speed-desktop":[{type:0,value:"Өзіңізге жайлы"},{type:1,value:"br"},{type:0,value:"қарқынды таңдаңыз"}],"paywall.books-part-benefit-speed-mobile":[{type:0,value:"Жайлы"},{type:1,value:"nbsp"},{type:0,value:"қарқынмен тыңдаңыз"}],"paywall.books-part-benefit-switch-mobile":[{type:0,value:"Мәтін мен"},{type:1,value:"nbsp"},{type:0,value:"аудио арасында ауысыңыз"}],"paywall.books-part-title":[{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Книги"}],"paywall.family-offer-text":[{type:0,value:"Әрқайсысының өз аккаунты мен дербес"},{type:1,value:"br"},{type:0,value:"ұсынымдары болады. Қосымша төлемсіз"}],"paywall.family-offer-title":[{type:0,value:"Сіз бен үш жақыныңызға"},{type:1,value:"br"},{type:0,value:"арналған"},{type:1,value:"nbsp"},{type:0,value:"Музыка"}],"paywall.faq-answer-afraid-forget-cancel":[{type:0,value:"Алаңдамаңыз, сіздің"},{type:1,value:"nbsp"},{type:0,value:"поштаңызға алғашқы шегерімге дейін"},{type:1,value:"nbsp"},{type:0,value:"3"},{type:1,value:"nbsp"},{type:0,value:"күн бұрын хат"},{type:1,value:"nbsp"},{type:0,value:"жазамыз"}],"paywall.faq-answer-cancel-until-end":[{type:0,value:"Мультижазылымнан кез келген уақытта бас тартуға болады. Мұны қалай жасауға болады:"},{type:1,value:"steps"}],"paywall.faq-answer-cancel-until-end-other-countries":[{type:0,value:"Жазылымнан кез келген сәтте бас тартуға болады. Одан бас тарту үшін:"},{type:1,value:"steps"}],"paywall.faq-answer-cancel-until-end-step-1":[{type:1,value:"link"},{type:0,value:" парағын ашыңыз"}],"paywall.faq-answer-cancel-until-end-step-1-link":[{type:0,value:"Мультижазылымды басқару"}],"paywall.faq-answer-cancel-until-end-step-1-link-other-countries":[{type:0,value:"Жазылымды басқару"}],"paywall.faq-answer-cancel-until-end-step-2":[{type:0,value:"«Мультижазылымнан бас тарту» батырмасын басыңыз"}],"paywall.faq-answer-cancel-until-end-step-2-other-countries":[{type:0,value:"«Жазылымнан бас тарту» батырмасын басыңыз"}],"paywall.faq-answer-where-else-subscribe":[{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Музыка"},{type:1,value:"nbsp"},{type:0,value:" қолданбасын жүктеп алыңыз —"},{type:1,value:"nbsp"},{type:0,value:"ол"},{type:1,value:"nbsp"},{type:0,value:"арқылы да Плюсті іске қосуға болады"}],"paywall.faq-answer-without-card-binding":[{type:0,value:"Жоқ, аккаунтқа"},{type:1,value:"nbsp"},{type:0,value:"карта тіркелген болу керек. Шегерімдер үшін"},{type:1,value:"nbsp"},{type:0,value:"алаңдамаңыз, сынақ кезеңінің соңына"},{type:1,value:"nbsp"},{type:0,value:"дейін шегерім болмайды. Сіз аккаунтқа жаңа карта"},{type:1,value:"nbsp"},{type:0,value:"тіркеген кезде, одан"},{type:1,value:"nbsp"},{type:0,value:"шағын сома шегеріліп, бірден"},{type:1,value:"nbsp"},{type:0,value:"қайтарылады — осылай біз"},{type:1,value:"nbsp"},{type:0,value:"картаның"},{type:1,value:"nbsp"},{type:0,value:"істеп тұрғанын тексереміз."}],"paywall.faq-question-afraid-forget-cancel":[{type:0,value:"Сынақ кезеңінің соңына"},{type:1,value:"nbsp"},{type:0,value:"дейін мультижазылымнан бас тартуды ұмытып кетуге қорқамын"}],"paywall.faq-question-afraid-forget-cancel-other-countries":[{type:0,value:"Сынақ мерзімінің соңына дейін жазылымнан"},{type:1,value:"nbsp"},{type:0,value:"бас тартуды ұмытып кетемін бе деп қорқамын"}],"paywall.faq-question-cancel-until-end":[{type:0,value:"Сынақ кезеңінің соңына"},{type:1,value:"nbsp"},{type:0,value:"дейін мультижазылымды өшіре"},{type:1,value:"nbsp"},{type:0,value:"аламын ба?"}],"paywall.faq-question-cancel-until-end-other-countries":[{type:0,value:"Мен"},{type:1,value:"nbsp"},{type:0,value:"сынақ мерзімінің соңына дейін"},{type:1,value:"nbsp"},{type:0,value:"жазылымды ажырата аламын ба?"}],"paywall.faq-question-where-else-subscribe":[{type:0,value:"Браузердегі сайтта карта"},{type:1,value:"nbsp"},{type:0,value:"деректерін енгізгім"},{type:1,value:"nbsp"},{type:0,value:"келмейді. Мультижазылымды тағы қайдан ресімдей аламын?"}],"paywall.faq-question-where-else-subscribe-other-countries":[{type:0,value:"Браузер"},{type:1,value:"nbsp"},{type:0,value:"арқылы сайтта"},{type:1,value:"nbsp"},{type:0,value:"картаның деректерін тергім"},{type:1,value:"nbsp"},{type:0,value:"келмейді. Тағы қай жерде жазылымды ресімдей аламын?"}],"paywall.faq-question-without-card-binding":[{type:0,value:"Сынақ мерзімін банк картасын тіркемей қосуға бола ма?"}],"paywall.kinopoisk-part-benefit-channels":[{type:0,value:"Жүздеген телеарналарға"},{type:1,value:"nbsp"},{type:0,value:"қолжетімділікті ашыңыз"}],"paywall.kinopoisk-part-benefit-exclusive":[{type:0,value:"Кинопоискінің"},{type:1,value:"br"},{type:0,value:"эксклюзивтерін"},{type:1,value:"br"},{type:0,value:"көріңіз"}],"paywall.kinopoisk-part-benefit-movies":[{type:0,value:"Мыңдаған"},{type:1,value:"br"},{type:0,value:"фильм мен"},{type:1,value:"nbsp"},{type:0,value:"сериал арасынан таңдаңыз"}],"paywall.kinopoisk-part-benefit-sport":[{type:0,value:"Спорттық"},{type:1,value:"br"},{type:0,value:"трансляцияларды қарап"},{type:1,value:"nbsp"},{type:0,value:"отырыңыз"}],"paywall.kinopoisk-part-title":[{type:0,value:"Кинопоиск"}],"paywall.more-info":[{type:0,value:"Мультижазылымға не"},{type:1,value:"nbsp"},{type:0,value:"кіреді"}],"paywall.music-benefit-all-in-one-desktop":[{type:0,value:"Осының бәрі — бір"},{type:1,value:"nbsp"},{type:0,value:"ыңғайлы сервисте"}],"paywall.music-benefit-all-in-one-mobile":[{type:0,value:"Осының бәрі — бір"},{type:1,value:"nbsp"},{type:0,value:"ыңғайлы қосымшада"}],"paywall.music-benefit-audio":[{type:0,value:"Музыка, аудиокітаптар мен"},{type:1,value:"nbsp"},{type:0,value:"подкастар"}],"paywall.music-benefit-recommendation":[{type:0,value:"Ең дәл ұсынымдар"}],"paywall.music-benefit-without-network":[{type:0,value:"Жүктеп алып,"},{type:1,value:"nbsp"},{type:0,value:"интернет жоқ жерде"},{type:1,value:"nbsp"},{type:0,value:"де тыңдай беріңіз"}],"paywall.music-benefits-title":[{type:0,value:"Яндекс Музыканы"},{type:1,value:"br"},{type:0,value:"қосайық"}],"paywall.music-on-many-devices":[{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Плюс жазылымымен түрлі"},{type:1,value:"nbsp"},{type:0,value:"құрылғылардағы музыка"}],"paywall.music-part-benefit-books":[{type:0,value:"Аудиокітаптарды"},{type:1,value:"br"},{type:0,value:"тыңдаңыз"}],"paywall.music-part-benefit-books-alternative":[{type:0,value:"Аудиокітаптарды тыңдаңыз"}],"paywall.music-part-benefit-many-devices":[{type:0,value:"Ақылды ұсынымдардың"},{type:1,value:"br"},{type:0,value:"таңғалдыруына рұқсат беріңіз"}],"paywall.music-part-benefit-playlists":[{type:0,value:"Топтамада өз"},{type:1,value:"br"},{type:0,value:"плейлистеріңізді жасаңыз"}],"paywall.music-part-benefit-recommendations":[{type:0,value:"Мыңдаған"},{type:1,value:"br"},{type:0,value:"топтама арасынан қызықтыны іздеңіз"}],"paywall.music-part-benefit-without-internet":[{type:0,value:"Интернетсіз"},{type:1,value:"br"},{type:0,value:"үздік"},{type:1,value:"nbsp"},{type:0,value:"сапада тыңдаңыз"}],"paywall.music-part-benefit-without-internet-mobile":[{type:0,value:"Тіпті интернетсіз"},{type:1,value:"nbsp"},{type:0,value:"тыңдай аласыз"}],"paywall.music-part-title":[{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Музыка"}],"paywall.open-plus-benefits":[{type:0,value:"Бір"},{type:1,value:"nbsp"},{type:0,value:"мультижазылымдағы барлық ойын-сауық"}],"paywall.other-services-part-benefit-maps":[{type:0,value:"Карты мен Навигатор"},{type:1,value:"nbsp"},{type:0,value:"CarPlay \u2028мен"},{type:1,value:"nbsp"},{type:0,value:"Android"},{type:1,value:"nbsp"},{type:0,value:"Auto қосымшаларында"}],"paywall.other-services-part-benefit-your-plus":[{type:0,value:"Өз"},{type:1,value:"nbsp"},{type:0,value:"Плюстерімде мүмкіндіктер"},{type:1,value:"nbsp"},{type:0,value:"көбірек"}],"paywall.other-services-part-save":[{type:0,value:"Сейвтердегі"},{type:1,value:"nbsp"},{type:0,value:"жинақ шоттары бойынша"},{type:1,value:"nbsp"},{type:0,value:"жоғарылатылған ставка"}],"paywall.other-services-part-title":[{type:0,value:"Яндекс сервистеріндегі"},{type:1,value:"nbsp"},{type:0,value:"Плюстің артықшылықтары"}],"paywall.pay-part-benefit-split-desktop":[{type:0,value:"Сплитпен"},{type:1,value:"nbsp"},{type:0,value:"бөліп"},{type:1,value:"nbsp"},{type:0,value:"төлеңіз"}],"paywall.plus-benefit-books":[{type:0,value:"Кітаптар"},{type:1,value:"br"},{type:0,value:"мен аудиокітаптар"}],"paywall.plus-benefit-cashback":[{type:0,value:"Яндекс сервистеріндегі басқа"},{type:1,value:"nbsp"},{type:0,value:"да артықшылықтар"}],"paywall.plus-benefit-kinopoisk":[{type:0,value:"Кинопоискідегі фильмдер мен"},{type:1,value:"nbsp"},{type:0,value:"сериалдар"}],"paywall.plus-benefit-music":[{type:0,value:"Жарнамасыз"},{type:1,value:"br"},{type:0,value:"музыка мен"},{type:1,value:"nbsp"},{type:0,value:"подкастар"}],"paywall.plus-part-benefit-devices":[{type:0,value:"10 құрылғыға"},{type:1,value:"br"},{type:0,value:"дейін қосыңыз"}],"paywall.plus-part-benefit-family":[{type:0,value:"Жақын"},{type:1,value:"br"},{type:0,value:"3"},{type:1,value:"nbsp"},{type:0,value:"адамды қосыңыз"}],"paywall.plus-part-benefit-options":[{type:0,value:"Мультижазылымның мүмкіндіктерін"},{type:1,value:"nbsp"},{type:0,value:"опциялардың көмегімен кеңейтіңіз"}],"paywall.plus-part-spend-points":[{type:0,value:"Плюс ұпайларын"},{type:1,value:"nbsp"},{type:0,value:"Яндекс сервистерінде"},{type:1,value:"nbsp"},{type:0,value:"жұмсаңыз: 1"},{type:1,value:"nbsp"},{type:0,value:"ұпай"},{type:1,value:"nbsp"},{type:0,value:"="},{type:1,value:"nbsp"},{type:0,value:"1"},{type:1,value:"nbsp"},{type:0,value:"₽"}],"paywall.plus-part-title":[{type:0,value:"Яндекс"},{type:1,value:"nbsp"},{type:0,value:"Плюс"}],"paywall.recommendations-on-devices":[{type:0,value:"Қызығушылықтарыңыз"},{type:1,value:"nbsp"},{type:0,value:"бойынша ұсынымдарды ыңғайлы жерден тыңдаңыз"}],"play-queue.album-will-be-played-last":[{type:1,value:"title"},{type:0,value:" альбомы кезектің соңына қосылды"}],"play-queue.album-will-be-played-next":[{type:1,value:"title"},{type:0,value:" альбомы кезектің басына қосылды"}],"play-queue.audiobook-episode-will-be-played-last":[{type:1,value:"title"},{type:0,value:" тарауы кезектің соңына қосылды"}],"play-queue.audiobook-episode-will-be-played-next":[{type:1,value:"title"},{type:0,value:" тарауы кезектің басына қосылды"}],"play-queue.audiobook-episode-will-be-removed":[{type:1,value:"title"},{type:0,value:" тарауы кезектен өшірілді"}],"play-queue.delete-from-queue":[{type:0,value:"Кезектен жою"}],"play-queue.my-wave-by-album":[{type:0,value:"Альбом бойынша Менің толқыным"}],"play-queue.my-wave-by-artist":[{type:0,value:"Әртіс бойынша Менің толқыным"}],"play-queue.my-wave-by-playlist":[{type:0,value:"Плейлист бойынша Менің толқыным"}],"play-queue.next-in":[{type:0,value:"Кезектегі келесі тректер"}],"play-queue.now-playing":[{type:0,value:"Қазір ойнатылып жатыр"}],"play-queue.now-playing-by-entity":[{type:0,value:"Қазір "},{type:1,value:"entity"},{type:0,value:" ойнап тұр"}],"play-queue.now-playing-from-album":[{type:0,value:"Қазір альбомнан ойнатылып жатыр"}],"play-queue.now-playing-from-artist-collection":[{type:0,value:"Сізге танысы ойнап тұр"}],"play-queue.now-playing-from-artist-popular-tracks":[{type:0,value:"Қазір орындаушының танымал тректерінен ойнатылып жатыр"}],"play-queue.now-playing-from-artist-wave":[{type:0,value:"Сізге танысы ойнап тұр"}],"play-queue.now-playing-from-downloads":[{type:0,value:"Жүктелген тректердегі ойнап тұр"}],"play-queue.now-playing-from-history":[{type:0,value:"Қазір тарихтағы ойнап тұр"}],"play-queue.now-playing-from-history-search":[{type:0,value:"Қазір іздеу тарихындағы ойнап тұр"}],"play-queue.now-playing-from-playlist":[{type:0,value:"Қазір плейлистен ойнатылып жатыр"}],"play-queue.now-playing-from-podcast":[{type:0,value:"Қазір подкастан ойнатылып жатыр"}],"play-queue.now-playing-from-search":[{type:0,value:"Қазір іздеудегі ойнап тұр"}],"play-queue.now-playing-my-wave-by-album":[{type:0,value:"Қазір Менің толқыным альбом бойынша ойнап тұр"}],"play-queue.now-playing-my-wave-by-artist":[{type:0,value:"Қазір Менің толқыным әртіс бойынша ойнап тұр"}],"play-queue.now-playing-my-wave-by-playlist":[{type:0,value:"Қазір Менің толқыным плейлист бойынша ойнап тұр"}],"play-queue.now-playing-my-wave-by-podcast":[{type:0,value:"Қазір Менің толқыным подкаст бойынша ойнап тұр"}],"play-queue.now-playing-my-wave-by-track":[{type:0,value:"Қазір Трек бойынша менің толқыным ойнатылып жатыр"}],"play-queue.play-last":[{type:0,value:"Кезектің соңына қосу"}],"play-queue.play-next":[{type:0,value:"Келесі болып ойнау"}],"play-queue.playlist-will-be-played-last":[{type:1,value:"title"},{type:0,value:" плейлисті кезектің соңына қосылды"}],"play-queue.playlist-will-be-played-next":[{type:1,value:"title"},{type:0,value:" плейлисті кезектің басына қосылды"}],"play-queue.podcast-episode-will-be-played-last":[{type:1,value:"title"},{type:0,value:" шығарылымы кезектің соңына қосылды"}],"play-queue.podcast-episode-will-be-played-next":[{type:1,value:"title"},{type:0,value:" шығарылымы кезектің басына қосылды"}],"play-queue.podcast-episode-will-be-removed":[{type:1,value:"title"},{type:0,value:" шығарылымы кезектен өшірілді"}],"play-queue.repeat-context":[{type:0,value:"Кезекті қайталау қосылды"}],"play-queue.repeat-one":[{type:0,value:"Тректі қайталау қосылды"}],"play-queue.shuffle":[{type:0,value:"Кездейсоқ тәртіпте"}],"play-queue.title":[{type:0,value:"Ойнату кезегі"}],"play-queue.track-will-be-played-last":[{type:1,value:"title"},{type:0,value:" атты трек кезектің соңына қосылды"}],"play-queue.track-will-be-played-next":[{type:1,value:"title"},{type:0,value:" атты трек кезектің басына қосылды"}],"play-queue.track-will-be-removed":[{type:1,value:"title"},{type:0,value:" трегі кезектен өшірілді"}],"player-actions.audio-quality":[{type:0,value:"Дыбыс баптаулары"}],"player-actions.audio-quality-economical":[{type:0,value:"Үнемді"}],"player-actions.audio-quality-economical-description":[{type:0,value:"Интернет баяу болса да, дауысы тұрақты болады"}],"player-actions.audio-quality-maximum":[{type:0,value:"Керемет"}],"player-actions.audio-quality-maximum-description":[{type:0,value:"Lossless және жоғары сапалы басқа форматтардағы музыка — жылдам интернет пен жақсы акустика үшін"}],"player-actions.audio-quality-optimal":[{type:0,value:"Оңтайлы"}],"player-actions.audio-quality-optimal-description":[{type:0,value:"Көптеген құрылғыларға арналған теңдестірілген дыбыс"}],"player-actions.cast":[{type:0,value:"Құрылғыны таңдау"}],"player-actions.fullscreen":[{type:0,value:"Түгел экранға"}],"player-actions.fullscreen-button":[{type:0,value:"Плеерды толық экранға орнату"}],"player-actions.listen":[{type:0,value:"Тыңдау"}],"player-actions.mix":[{type:0,value:"Араластыру"}],"player-actions.next-track":[{type:0,value:"Келесі ән"}],"player-actions.pause":[{type:0,value:"Үзіліс"}],"player-actions.play":[{type:0,value:"Ойнату"}],"player-actions.previous-track":[{type:0,value:"Алдыңғы ән"}],"player-actions.repeat":[{type:0,value:"Қайталау"}],"player-actions.repeat-action":[{type:0,value:"Қайталау"}],"player-actions.repeat-context":[{type:0,value:"Ойнату тізімінің қайталануы"}],"player-actions.repeat-one":[{type:0,value:"Тректің қайталануы"}],"player-actions.rewind-backwards":[{type:0,value:"15 секунд артқа"}],"player-actions.rewind-forward":[{type:0,value:"30 секунд алға"}],"player-actions.shuffle":[{type:0,value:"Кездейсоқ тәртіпте"}],"player-actions.timecode-control":[{type:0,value:"Таймкодты басқару"}],"player-actions.video-speed":[{type:0,value:"Жылдамдығы"}],"player-actions.video-speed-normal":[{type:0,value:"Әдеттегі"}],"player-actions.volume-control":[{type:0,value:"Дауыс деңгейін басқару"}],"player-actions.volume-off":[{type:0,value:"Дыбысты өшіру"}],"player-actions.volume-on":[{type:0,value:"Дыбысты қосу"}],"playlist-actions.add-description":[{type:0,value:"Сипаттаманы қосу"}],"playlist-actions.add-poster":[{type:0,value:"Мұқабаны қосу"}],"playlist-actions.add-track-to-playlist":[{type:0,value:"Плейлистіге қосу"}],"playlist-actions.change-description":[{type:0,value:"Сипаттамасын өзгерту"}],"playlist-actions.change-description-abbr":[{type:0,value:"Ред."}],"playlist-actions.change-poster":[{type:0,value:"Мұқабаны өзгерту"}],"playlist-actions.change-title":[{type:0,value:"Атауын өзгерту"}],"playlist-actions.create-playlist":[{type:0,value:"Плейлистті құру"}],"playlist-actions.enter-title":[{type:0,value:"Атауын енгізіңіз"}],"playlist-actions.privacy":[{type:0,value:"Жеке плейлист"}],"playlist-actions.privacy-label":[{type:0,value:"Плейлистің құпиялылық баптауларын өзгерту"}],"playlist-actions.remove-from-playlist":[{type:0,value:"Плейлисттен жою"}],"playlist-actions.remove-playlist":[{type:0,value:"Плейлистіні жою"}],"playlist-errors.failed-add-track-to-playlist":[{type:0,value:"The track wasn't added to the playlist. Please try again"}],"playlist-errors.failed-add-tracks-to-playlist":[{type:0,value:"Тректер плейлиске қосылған жоқ, қайта байқап көріңіз"}],"playlist-errors.failed-download-xlsx":[{type:0,value:"Excel-файлды жүктеу мүмкін болмады"}],"playlist-errors.failed-part-tracks-download-xlsx":[{type:0,value:"Excel-файл жүктелді, бірақ, тректердің бір бөлігін жүктей алмадық"}],"playlist-errors.failed-to-change-description":[{type:0,value:"Плейлист сипаттамасын өзгерту мүмкін болмады"}],"playlist-errors.failed-to-change-poster":[{type:0,value:"Плейлист мұқабасын өзгерту мүмкін болмады"}],"playlist-errors.failed-to-change-privacy-settings":[{type:0,value:"Құпиялылық баптауларын өзгерту мүмкін болмады"}],"playlist-errors.failed-to-change-title":[{type:0,value:"Плейлист атауын өзгерту мүмкін болмады"}],"playlist-errors.failed-to-create-playlist":[{type:0,value:"Плейлист ашу мүмкін болмады"}],"playlist-errors.failed-to-remove-playlist":[{type:0,value:"Плейлистті жою мүмкін болмады"}],"playlist-errors.failed-to-remove-track":[{type:0,value:"Плейлисттегі тректі жою мүмкін болмады"}],"plus-page.iframe-title":[{type:0,value:"Сіздің плюсіңіз"}],"plusbar.subscription-activation":[{type:0,value:"Мультижазылымды іске қосу"}],"plusbar.text":[{type:0,value:"Сондай-ақ Кинопоискіні көріңіз"},{type:1,value:"br"},{type:0,value:"және"},{type:1,value:"nbsp"},{type:0,value:"кешбэк ұпайларын алыңыз"}],"plusbar.title":[{type:0,value:"Музыка Яндекс Плюс"},{type:1,value:"br"},{type:0,value:"мультижазылымынан"},{type:1,value:"nbsp"},{type:0,value:"басталады"}],"podcast-errors.error-during-loading-podcast":[{type:0,value:"Подкастты жүктеу кезінде қате орын алды"}],"podcast.age-limit":[{type:0,value:"Жас шектеуі"}],"podcast.episodes-list":[{type:0,value:"«"},{type:1,value:"albumName"},{type:0,value:"» подкастары эпизодтарының тізімі"}],"podcast.last-episodes-list":[{type:0,value:"Соңғы шығарылымдардың тізімі"}],"podcast.publisher-title":[{type:0,value:"Баспагер"}],"podcast.publishers-title":[{type:0,value:"Баспагерлер"}],"podcast.shelf-liked-title":[{type:0,value:"Сіз бұрын қосқансыз"}],"podcast.shelf-recently-played-title":[{type:0,value:"Сіз жақында ғана тыңдадыңыз"}],"podcast.tab-about":[{type:0,value:"Подкаст туралы"}],"podcast.tab-tracks":[{type:1,value:"value"},{type:0,value:" "},{offset:0,options:{few:{value:[{type:0,value:"шығарылым"}]},many:{value:[{type:0,value:"шығарылым"}]},one:{value:[{type:0,value:"шығарылым"}]},other:{value:[{type:0,value:"шығарылым"}]}},pluralType:"cardinal",type:6,value:"value"}],"rewind.button-title":[{type:0,value:"Жыл қорытындысы — 2025"}],"rewind.download-image":[{type:0,value:"Суретті жүктеу"}],"rewind.save-choice":[{type:0,value:"Таңдауды сақтау"}],"search-filters.top":[{type:0,value:"Топ"}],"search-filters.track":[{type:0,value:"Тректер"}],"search-results.album":[{type:0,value:"Альбомдар"}],"search-results.artist":[{type:0,value:"Орындаушылар"}],"search-results.best":[{type:0,value:"Үздік нәтижелер"}],"search-results.clip":[{type:0,value:"Клиптер"}],"search-results.not-found-description":[{type:0,value:"Басқаша жазып көріңіз"}],"search-results.not-found-title":[{type:0,value:"Ештеңе таппадық"}],"search-results.other-results":[{type:0,value:"Басқа нәтижелер"}],"search-results.playlist":[{type:0,value:"Плейлистер"}],"search-results.podcasts-and-books":[{type:0,value:"Подкастар мен кітаптар"}],"search.clear-history":[{type:0,value:"Тарихты тазарту"}],"search.cleared-history":[{type:0,value:"Тарих жойылды"}],"search.corrected-text":[{type:0,value:"Сіздің іздегеніңіз "},{type:1,value:"text"},{type:0,value:" шығар"}],"search.history":[{type:0,value:"Тарих"}],"search.history-empty":[{type:0,value:"Іздеу тарихы бос"}],"search.input-placeholder":[{type:0,value:"Трек, альбом, орындаушы"}],"search.input-placeholder-q2v":[{type:0,value:"Кез келген сұрауға сай Музыка"}],"search.playlist-placeholder":[{type:0,value:"Плейлисті табу"}],"search.q2v-suggestions-loading":[{type:0,value:"Не ұсынуға болатынын ойланып жатырмын"}],"search.recent-requests-fallback":[{type:0,value:"Мұнда соңғы жіберген сұранымдарыңыз болады"}],"search.search-catalog":[{type:0,value:"Каталог бойынша іздеу"}],"search.track-placeholder":[{type:0,value:"Тректі іздеу"}],"settings.about-app":[{type:0,value:"Қосымша туралы"}],"settings.ai-content-reduction":[{type:0,value:"AI азырақ"}],"settings.ai-content-reduction-description":[{type:0,value:"Ұсынымдарда AI көмегімен жасалған музыка сирек кездесетін болады"}],"settings.crossfade":[{type:0,value:"Тректер арасында жатық ауысу"}],"settings.failed-to-change-child-mode":[{type:0,value:"Құпиялылық баптауларын өзгерту мүмкін болмады"}],"settings.preferences":[{type:0,value:"Артықшылықтарды нақтылау"}],"settings.preferences-description":[{type:0,value:"Музыкалық талғамыңыз өзгерген болса, осы жерде нақтылаңыз"}],"settings.shortcuts":[{type:0,value:"Ыстық пернелер"}],"settings.show-child-section":[{type:0,value:"«Балаларға» бөлімін көрсету"}],"share.iframe-copy":[{type:0,value:"Көшіру"}],"share.iframe-editor-code":[{type:0,value:"Код"}],"share.iframe-editor-height":[{type:0,value:"Биіктігі"}],"share.iframe-editor-preview":[{type:0,value:"Алдын ала қарау"}],"share.iframe-editor-width":[{type:0,value:"Ені"}],"share.iframe-listen":[{type:0,value:"Яндекс Музыкадан "},{type:1,value:"html"},{type:0,value:" тыңдаңыз"}],"share.iframe-modal-title":[{type:0,value:"Өлшемін орнатып, сайттың кодын көшіріп алыңыз"}],"shortcuts.fullscreen-player":[{type:0,value:"Фулскрин плеерді ашу / жабу"}],"shortcuts.like":[{type:0,value:"Лайк"}],"shortcuts.mute":[{type:0,value:"Дыбысты өшіру/қосу"}],"shortcuts.next-track":[{type:0,value:"Келесі трекке ауыстырып қосу"}],"shortcuts.or":[{type:0,value:"немесе"}],"shortcuts.play-pause":[{type:0,value:"Музыканы қосу/кідіртуге қою"}],"shortcuts.previous-track":[{type:0,value:"Алдыңғы трекке ауыстырып қосу"}],"shortcuts.rewind":[{type:0,value:"Артқа айналдыру"}],"shortcuts.skip-forward":[{type:0,value:"Алға айналдыру"}],"shortcuts.switch-repeat-mode":[{type:0,value:"Қайталау режимін ауыстырып қосу"}],"shortcuts.switch-shuffle-mode":[{type:0,value:"Режимді ауыстырып қосу («кездейсоқ тәртіппен»)"}],"shortcuts.unlike":[{type:0,value:"Дизлайк"}],"shortcuts.volume-down":[{type:0,value:"Дыбыс деңгейін азайту"}],"shortcuts.volume-up":[{type:0,value:"Дыбыс деңгейін үлкейту"}],"sidebar.collapse":[{type:0,value:"Сайдбарды жасыру"}],"sidebar.download-app":[{type:0,value:"Қосымшаны жүктеу"}],"sidebar.download-app-formatted":[{type:0,value:"Yandex Music on "},{children:[{type:0,value:"desktop"}],type:8,value:"span"}],"sidebar.download-macos":[{type:0,value:"Download the application for MacOS"}],"sidebar.download-macos-formatted":[{type:0,value:"Yandex Music on "},{children:[{type:0,value:"MacOS"}],type:8,value:"span"}],"sidebar.download-windows":[{type:0,value:"Download the application for Windows"}],"sidebar.download-windows-formatted":[{type:0,value:"Yandex Music on "},{children:[{type:0,value:"Windows"}],type:8,value:"span"}],"sidebar.plus-badge":[{type:0,value:"Плюс"}],"sidebar.uncollapse":[{type:0,value:"Сайдбарды ашу"}],"slider.close-image-modal":[{type:0,value:"Кескіндерді қарау терезесін жабу"}],"slider.image-counter":[{type:1,value:"index"},{type:0,value:" / "},{type:1,value:"count"},{type:0,value:" сурет"}],"slider.image-slider-modal":[{type:0,value:"Кескіндерді қарау"}],"slider.images-left-count":[{type:0,value:"Тағы "},{type:1,value:"imagesLeft"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"сурет"}]},other:{value:[{type:0,value:"сурет"}]}},pluralType:"cardinal",type:6,value:"imagesLeft"}],"slider.next-image":[{type:0,value:"Келесі кескін"}],"slider.next-slide":[{type:0,value:"Келесі слайд"}],"slider.prev-image":[{type:0,value:"Алдыңғы кескін"}],"slider.prev-slide":[{type:0,value:"Алдыңғы слайд"}],"slider.slide":[{type:0,value:"Слайд"}],"slider.view-artist-covers":[{type:0,value:"Орындаушының кескіндерін қарау"}],"slider.view-concert-covers":[{type:0,value:"Концерт кескіндерін қарау"}],"slider.view-cover":[{type:0,value:"Мұқабаны қарау"}],"snegir.auth-button-text":[{type:0,value:"Қосу"}],"snegir.main-text":[{type:0,value:"Яндекс Музыка"},{type:1,value:"br"},{type:0,value:"аймағыңызда қолжетімсіз"}],"snegir.redirect-button-text":[{type:0,value:"Қосу"}],"sort.select-filter":[{type:0,value:"Фильтрді таңдаңыз"}],"sort.sort-by-rating":[{type:0,value:"Танымалдығы бойынша"}],"sort.sort-by-year":[{type:0,value:"Шыққан күні бойынша"}],"time.duration":[{type:0,value:"Ұзақтығы"}],"time.finished":[{type:0,value:"Тыңдалғаны"}],"time.hours":[{offset:0,options:{one:{value:[{style:null,type:2,value:"hours"},{type:0,value:" сағат"}]},other:{value:[{style:null,type:2,value:"hours"},{type:0,value:" сағат"}]}},pluralType:"cardinal",type:6,value:"hours"}],"time.hours-left":[{offset:0,options:{few:{value:[{style:null,type:2,value:"hours"},{type:0,value:" сағат қалды"}]},many:{value:[{style:null,type:2,value:"hours"},{type:0,value:" сағат қалды"}]},one:{value:[{style:null,type:2,value:"hours"},{type:0,value:" сағат қалды"}]},other:{value:[{style:null,type:2,value:"hours"},{type:0,value:" сағат қалды"}]}},pluralType:"cardinal",type:6,value:"hours"}],"time.hours-minutes":[{options:{"0":{value:[]},other:{value:[{type:1,value:"hours"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"сағат"}]},other:{value:[{type:0,value:"сағат"}]}},pluralType:"cardinal",type:6,value:"hours"}]}},type:5,value:"hours"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"minutes"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"минут"}]},other:{value:[{type:0,value:"минут"}]}},pluralType:"cardinal",type:6,value:"minutes"}]}},type:5,value:"minutes"}],"time.hours-minutes-seconds":[{options:{"0":{value:[]},other:{value:[{type:1,value:"hours"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"сағат,"}]},other:{value:[{type:0,value:"сағат,"}]}},pluralType:"cardinal",type:6,value:"hours"}]}},type:5,value:"hours"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"minutes"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"минут,"}]},other:{value:[{type:0,value:"минут,"}]}},pluralType:"cardinal",type:6,value:"minutes"}]}},type:5,value:"minutes"},{type:0,value:" "},{options:{"0":{value:[]},other:{value:[{type:1,value:"seconds"},{type:0,value:" "},{offset:0,options:{one:{value:[{type:0,value:"секунд."}]},other:{value:[{type:0,value:"секунд"}]}},pluralType:"cardinal",type:6,value:"seconds"}]}},type:5,value:"seconds"}],"time.left":[{offset:0,options:{one:{value:[{type:0,value:"қалды"}]},other:{value:[{type:0,value:"қалды"}]}},pluralType:"cardinal",type:6,value:"time"}],"time.minutes-left":[{offset:0,options:{one:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" минут"}]},other:{value:[{style:null,type:2,value:"minutes"},{type:0,value:" минут"}]}},pluralType:"cardinal",type:6,value:"minutes"}],"time.seconds-left":[{offset:0,options:{one:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" секунд"}]},other:{value:[{style:null,type:2,value:"seconds"},{type:0,value:" секунд"}]}},pluralType:"cardinal",type:6,value:"seconds"}],"track-modal.album-heading":[{options:{audiobook:{value:[{type:0,value:"Кітап"}]},fairy_tale:{value:[{type:0,value:"Ертегі"}]},other:{value:[{type:0,value:"Альбом"}]},podcast:{value:[{type:0,value:"Подкаст"}]},single:{value:[{type:0,value:"Сингл"}]}},type:5,value:"type"}],"track-modal.audiobook-title":[{type:0,value:"Тарау туралы"}],"track-modal.clip-title":[{type:0,value:"Клип жайлы"}],"track-modal.concert-title":[{type:0,value:"Концерт туралы"}],"track-modal.content-rating":[{type:0,value:"Жасы"}],"track-modal.genre":[{type:0,value:"Жанр"}],"track-modal.podcast-title":[{type:0,value:"Шығарылым туралы"}],"track-modal.read-more":[{type:0,value:"Толық оқу"}],"track-modal.similar-tracks":[{type:0,value:"Ұқсас тректер"}],"track-modal.source":[{type:0,value:"Дереккөз"}],"track-modal.title":[{type:0,value:"Трек жайлы"}],"track-modal.track-name":[{type:0,value:"Атауы"}],"track-title.audiobook-not-found":[{type:0,value:"Аудиокітап қолжетімсіз"}],"track-title.error-not-found":[{type:0,value:"Трек қолжетімсіз"}],"track-title.podcast-not-found":[{type:0,value:"Подкаст қолжетімсіз"}],"trailer.button-aria-label":[{type:0,value:"Трейлерді іске қосу"}],"trailer.close":[{type:0,value:"Трейлерді жабу"}],"trailer.listen-full-version":[{type:0,value:"Толығымен тыңдау"}],"trailer.navigate":[{type:0,value:"Өту"}],"trailer.not-found-description":[{type:0,value:"Жақында жөндейміз, кейін оралыңыз"}],"trailer.not-found-title":[{type:0,value:"Трейлер сынып қалды"}],"trailer.something-went-wrong-description":[{type:0,value:"Экранды жаңартыңыз немесе кейінірек байқап көріңіз"}],"ugc.cancel-upload":[{type:0,value:"Жүктеуден бас тарту"}],"ugc.close-edit-popup":[{type:0,value:"Тректі өңдеу терезесін жабу"}],"ugc.editing-failed":[{type:0,value:"Тректі өңдеу мүмкін болмады"}],"ugc.notification-success":[{type:0,value:"Барлық тректі «"},{type:1,value:"playlistName"},{type:0,value:"» плейлистіне жүктеп салдық"}],"ugc.notification-too-large-file-error":[{type:0,value:"Файл жүктеп алу үшін тым үлкен"}],"ugc.notification-too-many-files-error":[{type:0,value:"Жүктеп алынған трек саны бойынша лимиттен асып кетті"}],"ugc.notification-unknown-error":[{type:0,value:"Тректерді «"},{type:1,value:"playlistName"},{type:0,value:"» плейлистіне жүктеп салу кезінде қате шықты"}],"ugc.repeat-upload":[{type:0,value:"Жүктеуді қайталау"}],"ugc.track-description":[{type:0,value:"Бұл тректі тек сіз ғана тыңдай аласыз"}],"ugc.track-uploading-error-status":[{type:0,value:"Жүктеу қатесі"}],"ugc.track-uploading-pending-status":[{type:0,value:"Тректі жүктеп жатырмыз"}],"ugc.track-uploading-processing-status":[{type:0,value:"Тректі өңдеп жатырмыз"}],"ugc.upload-track":[{type:0,value:"Тректі жүктеу"}],"vibe-actions.apply":[{type:0,value:"Баптауды қолдану"}],"vibe-actions.aria-label-pause":[{type:0,value:"Pause My Vibe"}],"vibe-actions.aria-label-play":[{type:0,value:"Play My Vibe"}],"vibe-actions.aria-label-settings":[{type:0,value:"Менің толқынымды баптау"}],"vibe-actions.enter-title":[{type:0,value:"Атауын енгізіңіз"}],"vibe-actions.play-vibe":[{type:0,value:"Менің толқынымды қосу"}],"vibe-actions.remove":[{type:0,value:"Баптауды алып тастау"}],"vibe-actions.reset-settings":[{type:0,value:"Менің толқынымның баптауларын алып тастау"}],"vibe-actions.vibe-by-album":[{type:0,value:"Альбом бойынша Менің толқыным"}],"vibe-actions.vibe-by-artist":[{type:0,value:"Әртіс бойынша Менің толқыным"}],"vibe-actions.vibe-by-playlist":[{type:0,value:"Плейлист бойынша Менің толқыным"}],"vibe-actions.vibe-by-track":[{type:0,value:"Трек бойынша Менің толқыным"}],"vibe-actions.vibe-context":[{options:{MIX:{value:[{type:0,value:"Сет "}]},other:{value:[]}},type:5,value:"type"},{type:1,value:"name"}],"vibe-errors.apply-vibe-setting":[{type:0,value:"Менің толқынымды баптау кезінде қате туындады"}],"vibe-errors.start-vibe":[{type:0,value:"Менің толқынымды іске қосу кезінде қате туындады"}],"vibe-freemium.available-in-plus":[{type:0,value:"Ең дәл ұсынымдар жүйесі сіз іздеген әуенді табады."},{type:1,value:"br"},{type:0,value:"Плюс мультижазылымында, сондай-ақ, Кинопоиск пен кешбэк ұпайлары қолжетімді"}],"vibe-wheel.activity-description":[{type:0,value:"Іске сай Менің толқыным"}],"vibe-wheel.activity-fall-asleep":[{type:0,value:"Ұйықтаймын"}],"vibe-wheel.activity-road-trip":[{type:0,value:"Жолда"}],"vibe-wheel.activity-wake-up":[{type:0,value:"Оянамын"}],"vibe-wheel.activity-work-background":[{type:0,value:"Менің"}],"vibe-wheel.activity-workout":[{type:0,value:"Жаттығамын"}],"vibe-wheel.mood-description":[{type:0,value:"Көңіл-күй бойынша Менің толқыным"}],"vibe-wheel.mood-energetic":[{type:0,value:"Энергетикалық"}],"vibe-wheel.mood-happy":[{type:0,value:"Қуанышты"}],"vibe-wheel.mood-sad":[{type:0,value:"Мұңды"}],"warning-messages.can-break-accessibility":[{type:0,value:"Қолжетімділікті бұзуы мүмкін"}],"warning-messages.update-your-browser":[{type:0,value:"Музыка дұрыс істемеуі мүмкін — браузерді жаңартыңыз\n"}],"welcome-page.beta-header":[{type:0,value:"Мұнда "},{type:1,value:"br"},{type:0,value:"өте шулы болады"}],"welcome-page.beta-text-short":[{type:0,value:"Кейінірек оралыңыз"}],"welcome-page.not-auth-header":[{type:0,value:"Қосымшаны ашу үшін"},{type:1,value:"br"},{type:0,value:"аккаунтқа кіріңіз"}],"welcome-page.not-auth-text":[{type:0,value:"Яндекс Музыка Плюс мультижазылымы бойынша қолжетімді"}],"welcome-page.offer-header":[{type:0,value:"Сізде әзірге Плюс мультижазылымы жоқ"}],"welcome-page.offer-text":[{type:0,value:"Қосымшаға қосылу үшін мультижазылымды ресімдеңіз."}],"windows-menu.close":[{type:0,value:"Жабу"}],"windows-menu.roll-up":[{type:0,value:"Жасыру"}],"windows-menu.unwrap":[{type:0,value:"Жаю"}],"wizard.button-done":[{type:0,value:"Дайын"}],"wizard.button-little-more":[{type:0,value:"Кішкене қалды"}],"wizard.button-one-more":[{type:0,value:"Тағы біреу, сонымен болды"}],"wizard.button-tune":[{type:0,value:"Сізге лайықты етіп баптап жатырмыз"}],"wizard.buttonText":[{type:0,value:"Орындаушыларды таңдау"}],"wizard.description":[{type:0,value:"Сізге ұнамды музыка ұсыну үшін сіз туралы көбірек білгіміз келеді. Сүйікті орындаушыларыңызды таңдаңыз, сонда ұсынымдар сізге бейімделеді."}],"wizard.modal-text":[{type:0,value:"Бұл мейлінше нақты және қызықты ұсынымдарды алуға көмектеседі"}],"wizard.modal-title":[{type:0,value:"Сүйікті орындаушыларды таңдаңыз"}],"wizard.title":[{type:0,value:"Өзіңіз туралы айтып беріңіз"}],"words.ai-description":[{type:0,value:"AI қателесуі мүмкін, маңызды ақпаратты тексеріп отырыңыз"}],"words.dislike":[{type:0,value:"Жарамайды"}],"words.dislike-feedback":[{type:0,value:"Мені жақсартуға көмектесіп жатқаныңыз үшін рақмет"}],"words.like":[{type:0,value:"Осындайдан көбірек"}],"words.like-feedback":[{type:0,value:"Баға қойғаныңыз үшін рақмет"}],"words.loading-phrase-catching":[{type:0,value:"Ырғақ ұстаудамын"}],"words.loading-phrase-collecting-interesting":[{type:0,value:"ЖИ күшімен қызық нәрселерді жинаймын"}],"words.loading-phrase-reading":[{type:0,value:"Әртіс туралы оқып жатырмын"}],"words.loading-phrase-studying":[{type:0,value:"Дыбысты зерттеп жатырмын"}],"words.loading-phrase-tuning":[{type:0,value:"Баптап жатырмын"}],"words.show-more":[{type:0,value:"Мұндайды жиірек көрсету керек пе?"}],"ynison.desktop-device-title":[{type:1,value:"platformName"},{type:0,value:" ("},{type:1,value:"hostname"},{type:0,value:") қосымшасы"}]};const TRANSLATIONS = {
  en: translationsEN,
  ru: translationsRU,
  uz: translationsUZ,
  kk: translationsKK
};
const isSupportedLanguage = (language) => {
  return config.app.systemLanguages.includes(language);
};
const getLocaleLanguage = (locale) => {
  let language;
  try {
    language = new Intl.Locale(locale).language;
  } catch {
    language = "";
  }
  return language;
};
const getSystemLanguage = () => {
  const supportedLanguage = electron.app.getPreferredSystemLanguages().map(getLocaleLanguage).find(isSupportedLanguage);
  return supportedLanguage || config.app.systemDefaultLanguage;
};
let systemLanguage;
const formatMessage = (params, values) => {
  if (!systemLanguage) {
    systemLanguage = getSystemLanguage();
  }
  const translations = TRANSLATIONS[systemLanguage];
  const value = translations?.[params.id];
  let message = "";
  if (Array.isArray(value) || typeof value === "string") {
    message = new intlMessageformat.IntlMessageFormat(value, systemLanguage).format(values);
  }
  return Array.isArray(message) ? message.join("") : message;
};
const formatDate = (params) => {
  const { date, options, language } = params;
  if (!systemLanguage) {
    systemLanguage = getSystemLanguage();
  }
  const currentLanguage = language && isSupportedLanguage(language) ? language : systemLanguage;
  try {
    let dateObj;
    dateObj = new Date(date);
    const formatter = new Intl.DateTimeFormat(currentLanguage, options);
    return formatter.format(dateObj);
  } catch {
    return date.toString();
  }
};const toggleWindowState = (window) => {
  if (state.isWindowHidden) {
    toggleWindowVisibility(window, true);
  } else if (window.isMinimized()) {
    window.restore();
    state.isMinimized = false;
  } else {
    window.minimize();
    state.isMinimized = true;
  }
  updateTrayMenu(window);
};var PlayerAction = /* @__PURE__ */ ((PlayerAction2) => {
  PlayerAction2["PLAY"] = "PLAY";
  PlayerAction2["PAUSE"] = "PAUSE";
  PlayerAction2["MOVE_BACKWARD"] = "MOVE_BACKWARD";
  PlayerAction2["MOVE_FORWARD"] = "MOVE_FORWARD";
  return PlayerAction2;
})(PlayerAction || {});var Events = /* @__PURE__ */ ((Events2) => {
  Events2["WINDOW_MINIMIZE"] = "WINDOW_MINIMIZE";
  Events2["WINDOW_MAXIMIZE"] = "WINDOW_MAXIMIZE";
  Events2["WINDOW_CLOSE"] = "WINDOW_CLOSE";
  Events2["INSTALL_UPDATE"] = "INSTALL_UPDATE";
  Events2["UPDATE_AVAILABLE"] = "UPDATE_AVAILABLE";
  Events2["APPLICATION_READY"] = "APPLICATION_READY";
  Events2["GET_PASSPORT_LOGIN"] = "GET_PASSPORT_LOGIN";
  Events2["GET_YANDEX_UID"] = "GET_YANDEX_UID";
  Events2["REFRESH_APPLICATION_DATA"] = "REFRESH_APPLICATION_DATA";
  Events2["PLAYER_STATE"] = "PLAYER_STATE";
  Events2["PLAYER_ACTION"] = "PLAYER_ACTION";
  Events2["OPEN_DEEPLINK"] = "OPEN_DEEPLINK";
  Events2["FIRST_LAUNCH"] = "FIRST_LAUNCH";
  Events2["APPLICATION_THEME"] = "APPLICATION_THEME";
  Events2["PROBABILITY_BUCKET"] = "PROBABILITY_BUCKET";
  Events2["LOAD_RELEASE_NOTES"] = "LOAD_RELEASE_NOTES";
  Events2["REFRESH_TRACKS_AVAILABILITY"] = "REFRESH_TRACKS_AVAILABILITY";
  Events2["REFRESH_REPOSITORY_META"] = "REFRESH_REPOSITORY_META";
  Events2["TRACKS_AVAILABILITY_UPDATED"] = "TRACKS_AVAILABILITY_UPDATED";
  Events2["REPOSITORY_META_UPDATED"] = "REPOSITORY_META_UPDATED";
  Events2["SAVE_PNG_IMAGE_TO_LOCAL_DISK"] = "SAVE_PNG_IMAGE_TO_LOCAL_DISK";
  return Events2;
})(Events || {});const toggleMaximize = (window) => {
  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
  state.isMinimized = false;
  updateTrayMenu(window);
};const minimize = (window) => {
  window.minimize();
  state.isMinimized = true;
  updateTrayMenu(window);
};function getPathnameFromUrl(url) {
  return url.split(/[?#]/)[0] ?? "";
}const encodedUnsafeCharacterAfterDecodeRegexp = /%(?:25|2e|2f|5c)/i;
const pathTraversalSegmentRegexp = /(^|[\\/])\.\.([\\/]|$)/;
function isSafeDecodedPathname(pathname) {
  return !pathTraversalSegmentRegexp.test(pathname) && !encodedUnsafeCharacterAfterDecodeRegexp.test(pathname);
}function isSafeUrlPathnameAfterDecode(url) {
  const pathname = getPathnameFromUrl(url);
  let decodedPathname;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return false;
  }
  return isSafeDecodedPathname(decodedPathname);
}function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}let deeplinkUrl = null;
const deeplinkLogger = new Logger("Deeplink");
const escapedDeeplinkProtocol = config.app.deeplinkProtocol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const deeplinkProtocolRegexp = new RegExp(`^${escapedDeeplinkProtocol}://`, "i");
const deeplinkRegexp = new RegExp(`^${escapedDeeplinkProtocol}://.*`, "i");
const normalizeInternalUrl = (url) => {
  return `/${url.replace(/^\/+/, "")}`;
};
const transformUrlToInternal = (url) => {
  if (!checkIsDeeplink(url)) {
    return null;
  }
  const internalUrl = url.replace(deeplinkProtocolRegexp, "/");
  const normalizedInternalUrl = normalizeInternalUrl(internalUrl);
  if (!isSafeUrlPathnameAfterDecode(normalizedInternalUrl)) {
    return null;
  }
  return normalizedInternalUrl;
};
const checkIsDeeplink = (value) => {
  return deeplinkRegexp.test(value);
};
const navigateToDeeplink = (window, url) => {
  if (!url) {
    return;
  }
  const pathname = transformUrlToInternal(url);
  if (!pathname) {
    deeplinkLogger.warn("Navigate prevented", url);
    window.focus();
    state.deeplink = null;
    return;
  }
  deeplinkLogger.info("Navigate to", url, pathname);
  sendOpenDeeplink(window, pathname);
  window.focus();
  state.deeplink = null;
};
const handleDeeplinkOnApplicationStartup = () => {
  const lastArgFromProccessArgs = process.argv.pop();
  if (lastArgFromProccessArgs && checkIsDeeplink(lastArgFromProccessArgs)) {
    state.deeplink = lastArgFromProccessArgs;
  }
  if (!electron.app.isDefaultProtocolClient(config.app.deeplinkProtocol)) {
    electron.app.setAsDefaultProtocolClient(config.app.deeplinkProtocol);
  }
  electron.app.on("open-url", (event, url) => {
    event.preventDefault();
    state.deeplink = url;
    deeplinkLogger.info("Open on startup", deeplinkUrl);
  });
};
const handleDeeplink = (window) => {
  electron.app.on("open-url", (event, url) => {
    event.preventDefault();
    navigateToDeeplink(window, url);
  });
  navigateToDeeplink(window, deeplinkUrl);
};const PNG_EXTENSION = "png";
const PNG_MIME_TYPE = "image/png";
const logger = new Logger("SavePngImageToLocalDisk");
const hasPngExtension = (filePath) => path.extname(filePath).toLowerCase() === `.${PNG_EXTENSION}`;
const isPngContent = async (buffer) => {
  const { fileTypeFromBuffer } = await import('file-type');
  const fileType = await fileTypeFromBuffer(buffer);
  return fileType?.mime === PNG_MIME_TYPE;
};
const handleSavePngImageToLocalDisk = async (defaultPath, buffer) => {
  if (!hasPngExtension(defaultPath)) {
    logger.warn("Default path is not a PNG image", defaultPath);
    return;
  }
  let isPng;
  try {
    isPng = await isPngContent(buffer);
  } catch (error) {
    logger.error("Error detecting file type", error);
    return;
  }
  if (!isPng) {
    logger.warn("File content is not a PNG image", defaultPath);
    return;
  }
  const { canceled, filePath } = await electron.dialog.showSaveDialog({
    defaultPath,
    filters: [{ name: "PNG", extensions: [PNG_EXTENSION] }]
  });
  if (canceled || !filePath) {
    return;
  }
  if (!hasPngExtension(filePath)) {
    logger.warn("Selected path is not a PNG image", filePath);
    return;
  }
  try {
    await fs.writeFile(filePath, Buffer.from(buffer));
  } catch (error) {
    logger.error("Error saving PNG image to local disk", error);
  }
};const commonLogger = new Logger("Common");
const loadReleaseNotes = async (language) => {
  const url = `${config.common.UPDATE_URL}release-notes/${language}.json`;
  try {
    const response = await electron.net.fetch(url, {
      cache: "no-store"
    });
    commonLogger.info(`Request to ${url} completed with status: `, response.status);
    return response.json();
  } catch (error) {
    commonLogger.error(`Release-notes loading failed with error: `, error);
    return;
  }
};const getRevision = (info) => {
  return node_crypto.createHash("md5").update(JSON.stringify(info)).digest("hex");
};const getCpu = () => {
  const cpu = os.cpus();
  return cpu[0]?.model;
};
const getHardwareInfo = async (params) => {
  const hardwareInfo = {};
  {
    hardwareInfo.cpu = getCpu();
  }
  return hardwareInfo;
};
const logHardwareInfo = async () => {
  try {
    const cpuInfo = await getHardwareInfo();
    if (isRevisionChanged(StoreKeys.DEVICE_CPU_REVISION, getRevision(cpuInfo))) {
      printObject(cpuInfo);
    }
  } catch (error) {
    deviceInfoLogger.error("Cannot get hardware info", error);
  }
};var debug_1;
var hasRequiredDebug;

function requireDebug () {
	if (hasRequiredDebug) return debug_1;
	hasRequiredDebug = 1;

	const debug = (
	  typeof process === 'object' &&
	  process.env &&
	  process.env.NODE_DEBUG &&
	  /\bsemver\b/i.test(process.env.NODE_DEBUG)
	) ? (...args) => console.error('SEMVER', ...args)
	  : () => {};

	debug_1 = debug;
	return debug_1;
}var constants;
var hasRequiredConstants;

function requireConstants () {
	if (hasRequiredConstants) return constants;
	hasRequiredConstants = 1;

	// Note: this is the semver.org version of the spec that it implements
	// Not necessarily the package version of this code.
	const SEMVER_SPEC_VERSION = '2.0.0';

	const MAX_LENGTH = 256;
	const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
	/* istanbul ignore next */ 9007199254740991;

	// Max safe segment length for coercion.
	const MAX_SAFE_COMPONENT_LENGTH = 16;

	// Max safe length for a build identifier. The max length minus 6 characters for
	// the shortest version with a build 0.0.0+BUILD.
	const MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;

	const RELEASE_TYPES = [
	  'major',
	  'premajor',
	  'minor',
	  'preminor',
	  'patch',
	  'prepatch',
	  'prerelease',
	];

	constants = {
	  MAX_LENGTH,
	  MAX_SAFE_COMPONENT_LENGTH,
	  MAX_SAFE_BUILD_LENGTH,
	  MAX_SAFE_INTEGER,
	  RELEASE_TYPES,
	  SEMVER_SPEC_VERSION,
	  FLAG_INCLUDE_PRERELEASE: 0b001,
	  FLAG_LOOSE: 0b010,
	};
	return constants;
}var re = {exports: {}};var hasRequiredRe;

function requireRe () {
	if (hasRequiredRe) return re.exports;
	hasRequiredRe = 1;
	(function (module, exports) {

		const {
		  MAX_SAFE_COMPONENT_LENGTH,
		  MAX_SAFE_BUILD_LENGTH,
		  MAX_LENGTH,
		} = /*@__PURE__*/ requireConstants();
		const debug = /*@__PURE__*/ requireDebug();
		exports = module.exports = {};

		// The actual regexps go on exports.re
		const re = exports.re = [];
		const safeRe = exports.safeRe = [];
		const src = exports.src = [];
		const safeSrc = exports.safeSrc = [];
		const t = exports.t = {};
		let R = 0;

		const LETTERDASHNUMBER = '[a-zA-Z0-9-]';

		// Replace some greedy regex tokens to prevent regex dos issues. These regex are
		// used internally via the safeRe object since all inputs in this library get
		// normalized first to trim and collapse all extra whitespace. The original
		// regexes are exported for userland consumption and lower level usage. A
		// future breaking change could export the safer regex only with a note that
		// all input should have extra whitespace removed.
		const safeRegexReplacements = [
		  ['\\s', 1],
		  ['\\d', MAX_LENGTH],
		  [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH],
		];

		const makeSafeRegex = (value) => {
		  for (const [token, max] of safeRegexReplacements) {
		    value = value
		      .split(`${token}*`).join(`${token}{0,${max}}`)
		      .split(`${token}+`).join(`${token}{1,${max}}`);
		  }
		  return value
		};

		const createToken = (name, value, isGlobal) => {
		  const safe = makeSafeRegex(value);
		  const index = R++;
		  debug(name, index, value);
		  t[name] = index;
		  src[index] = value;
		  safeSrc[index] = safe;
		  re[index] = new RegExp(value, isGlobal ? 'g' : undefined);
		  safeRe[index] = new RegExp(safe, isGlobal ? 'g' : undefined);
		};

		// The following Regular Expressions can be used for tokenizing,
		// validating, and parsing SemVer version strings.

		// ## Numeric Identifier
		// A single `0`, or a non-zero digit followed by zero or more digits.

		createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
		createToken('NUMERICIDENTIFIERLOOSE', '\\d+');

		// ## Non-numeric Identifier
		// Zero or more digits, followed by a letter or hyphen, and then zero or
		// more letters, digits, or hyphens.

		createToken('NONNUMERICIDENTIFIER', `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);

		// ## Main Version
		// Three dot-separated numeric identifiers.

		createToken('MAINVERSION', `(${src[t.NUMERICIDENTIFIER]})\\.` +
		                   `(${src[t.NUMERICIDENTIFIER]})\\.` +
		                   `(${src[t.NUMERICIDENTIFIER]})`);

		createToken('MAINVERSIONLOOSE', `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
		                        `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
		                        `(${src[t.NUMERICIDENTIFIERLOOSE]})`);

		// ## Pre-release Version Identifier
		// A numeric identifier, or a non-numeric identifier.
		// Non-numberic identifiers include numberic identifiers but can be longer.
		// Therefore non-numberic identifiers must go first.

		createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NONNUMERICIDENTIFIER]
		}|${src[t.NUMERICIDENTIFIER]})`);

		createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NONNUMERICIDENTIFIER]
		}|${src[t.NUMERICIDENTIFIERLOOSE]})`);

		// ## Pre-release Version
		// Hyphen, followed by one or more dot-separated pre-release version
		// identifiers.

		createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]
		}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);

		createToken('PRERELEASELOOSE', `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]
		}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);

		// ## Build Metadata Identifier
		// Any combination of digits, letters, or hyphens.

		createToken('BUILDIDENTIFIER', `${LETTERDASHNUMBER}+`);

		// ## Build Metadata
		// Plus sign, followed by one or more period-separated build metadata
		// identifiers.

		createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]
		}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);

		// ## Full Version String
		// A main version, followed optionally by a pre-release version and
		// build metadata.

		// Note that the only major, minor, patch, and pre-release sections of
		// the version string are capturing groups.  The build metadata is not a
		// capturing group, because it should not ever be used in version
		// comparison.

		createToken('FULLPLAIN', `v?${src[t.MAINVERSION]
		}${src[t.PRERELEASE]}?${
		  src[t.BUILD]}?`);

		createToken('FULL', `^${src[t.FULLPLAIN]}$`);

		// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
		// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
		// common in the npm registry.
		createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]
		}${src[t.PRERELEASELOOSE]}?${
		  src[t.BUILD]}?`);

		createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`);

		createToken('GTLT', '((?:<|>)?=?)');

		// Something like "2.*" or "1.2.x".
		// Note that "x.x" is a valid xRange identifer, meaning "any version"
		// Only the first item is strictly required.
		createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
		createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);

		createToken('XRANGEPLAIN', `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})` +
		                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
		                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
		                   `(?:${src[t.PRERELEASE]})?${
		                     src[t.BUILD]}?` +
		                   `)?)?`);

		createToken('XRANGEPLAINLOOSE', `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})` +
		                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
		                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
		                        `(?:${src[t.PRERELEASELOOSE]})?${
		                          src[t.BUILD]}?` +
		                        `)?)?`);

		createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
		createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);

		// Coercion.
		// Extract anything that could conceivably be a part of a valid semver
		createToken('COERCEPLAIN', `${'(^|[^\\d])' +
		              '(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})` +
		              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
		              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
		createToken('COERCE', `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
		createToken('COERCEFULL', src[t.COERCEPLAIN] +
		              `(?:${src[t.PRERELEASE]})?` +
		              `(?:${src[t.BUILD]})?` +
		              `(?:$|[^\\d])`);
		createToken('COERCERTL', src[t.COERCE], true);
		createToken('COERCERTLFULL', src[t.COERCEFULL], true);

		// Tilde ranges.
		// Meaning is "reasonably at or greater than"
		createToken('LONETILDE', '(?:~>?)');

		createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true);
		exports.tildeTrimReplace = '$1~';

		createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
		createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);

		// Caret ranges.
		// Meaning is "at least and backwards compatible with"
		createToken('LONECARET', '(?:\\^)');

		createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true);
		exports.caretTrimReplace = '$1^';

		createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
		createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);

		// A simple gt/lt/eq thing, or just "" to indicate "any version"
		createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
		createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);

		// An expression to strip any whitespace between the gtlt and the thing
		// it modifies, so that `> 1.2.3` ==> `>1.2.3`
		createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]
		}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
		exports.comparatorTrimReplace = '$1$2$3';

		// Something like `1.2.3 - 1.2.4`
		// Note that these all use the loose form, because they'll be
		// checked against either the strict or loose comparator form
		// later.
		createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})` +
		                   `\\s+-\\s+` +
		                   `(${src[t.XRANGEPLAIN]})` +
		                   `\\s*$`);

		createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})` +
		                        `\\s+-\\s+` +
		                        `(${src[t.XRANGEPLAINLOOSE]})` +
		                        `\\s*$`);

		// Star ranges basically just allow anything at all.
		createToken('STAR', '(<|>)?=?\\s*\\*');
		// >=0.0.0 is like a star
		createToken('GTE0', '^\\s*>=\\s*0\\.0\\.0\\s*$');
		createToken('GTE0PRE', '^\\s*>=\\s*0\\.0\\.0-0\\s*$'); 
	} (re, re.exports));
	return re.exports;
}var parseOptions_1;
var hasRequiredParseOptions;

function requireParseOptions () {
	if (hasRequiredParseOptions) return parseOptions_1;
	hasRequiredParseOptions = 1;

	// parse out just the options we care about
	const looseOption = Object.freeze({ loose: true });
	const emptyOpts = Object.freeze({ });
	const parseOptions = options => {
	  if (!options) {
	    return emptyOpts
	  }

	  if (typeof options !== 'object') {
	    return looseOption
	  }

	  return options
	};
	parseOptions_1 = parseOptions;
	return parseOptions_1;
}var identifiers;
var hasRequiredIdentifiers;

function requireIdentifiers () {
	if (hasRequiredIdentifiers) return identifiers;
	hasRequiredIdentifiers = 1;

	const numeric = /^[0-9]+$/;
	const compareIdentifiers = (a, b) => {
	  if (typeof a === 'number' && typeof b === 'number') {
	    return a === b ? 0 : a < b ? -1 : 1
	  }

	  const anum = numeric.test(a);
	  const bnum = numeric.test(b);

	  if (anum && bnum) {
	    a = +a;
	    b = +b;
	  }

	  return a === b ? 0
	    : (anum && !bnum) ? -1
	    : (bnum && !anum) ? 1
	    : a < b ? -1
	    : 1
	};

	const rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);

	identifiers = {
	  compareIdentifiers,
	  rcompareIdentifiers,
	};
	return identifiers;
}var semver;
var hasRequiredSemver;

function requireSemver () {
	if (hasRequiredSemver) return semver;
	hasRequiredSemver = 1;

	const debug = /*@__PURE__*/ requireDebug();
	const { MAX_LENGTH, MAX_SAFE_INTEGER } = /*@__PURE__*/ requireConstants();
	const { safeRe: re, t } = /*@__PURE__*/ requireRe();

	const parseOptions = /*@__PURE__*/ requireParseOptions();
	const { compareIdentifiers } = /*@__PURE__*/ requireIdentifiers();
	class SemVer {
	  constructor (version, options) {
	    options = parseOptions(options);

	    if (version instanceof SemVer) {
	      if (version.loose === !!options.loose &&
	        version.includePrerelease === !!options.includePrerelease) {
	        return version
	      } else {
	        version = version.version;
	      }
	    } else if (typeof version !== 'string') {
	      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`)
	    }

	    if (version.length > MAX_LENGTH) {
	      throw new TypeError(
	        `version is longer than ${MAX_LENGTH} characters`
	      )
	    }

	    debug('SemVer', version, options);
	    this.options = options;
	    this.loose = !!options.loose;
	    // this isn't actually relevant for versions, but keep it so that we
	    // don't run into trouble passing this.options around.
	    this.includePrerelease = !!options.includePrerelease;

	    const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);

	    if (!m) {
	      throw new TypeError(`Invalid Version: ${version}`)
	    }

	    this.raw = version;

	    // these are actually numbers
	    this.major = +m[1];
	    this.minor = +m[2];
	    this.patch = +m[3];

	    if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
	      throw new TypeError('Invalid major version')
	    }

	    if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
	      throw new TypeError('Invalid minor version')
	    }

	    if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
	      throw new TypeError('Invalid patch version')
	    }

	    // numberify any prerelease numeric ids
	    if (!m[4]) {
	      this.prerelease = [];
	    } else {
	      this.prerelease = m[4].split('.').map((id) => {
	        if (/^[0-9]+$/.test(id)) {
	          const num = +id;
	          if (num >= 0 && num < MAX_SAFE_INTEGER) {
	            return num
	          }
	        }
	        return id
	      });
	    }

	    this.build = m[5] ? m[5].split('.') : [];
	    this.format();
	  }

	  format () {
	    this.version = `${this.major}.${this.minor}.${this.patch}`;
	    if (this.prerelease.length) {
	      this.version += `-${this.prerelease.join('.')}`;
	    }
	    return this.version
	  }

	  toString () {
	    return this.version
	  }

	  compare (other) {
	    debug('SemVer.compare', this.version, this.options, other);
	    if (!(other instanceof SemVer)) {
	      if (typeof other === 'string' && other === this.version) {
	        return 0
	      }
	      other = new SemVer(other, this.options);
	    }

	    if (other.version === this.version) {
	      return 0
	    }

	    return this.compareMain(other) || this.comparePre(other)
	  }

	  compareMain (other) {
	    if (!(other instanceof SemVer)) {
	      other = new SemVer(other, this.options);
	    }

	    if (this.major < other.major) {
	      return -1
	    }
	    if (this.major > other.major) {
	      return 1
	    }
	    if (this.minor < other.minor) {
	      return -1
	    }
	    if (this.minor > other.minor) {
	      return 1
	    }
	    if (this.patch < other.patch) {
	      return -1
	    }
	    if (this.patch > other.patch) {
	      return 1
	    }
	    return 0
	  }

	  comparePre (other) {
	    if (!(other instanceof SemVer)) {
	      other = new SemVer(other, this.options);
	    }

	    // NOT having a prerelease is > having one
	    if (this.prerelease.length && !other.prerelease.length) {
	      return -1
	    } else if (!this.prerelease.length && other.prerelease.length) {
	      return 1
	    } else if (!this.prerelease.length && !other.prerelease.length) {
	      return 0
	    }

	    let i = 0;
	    do {
	      const a = this.prerelease[i];
	      const b = other.prerelease[i];
	      debug('prerelease compare', i, a, b);
	      if (a === undefined && b === undefined) {
	        return 0
	      } else if (b === undefined) {
	        return 1
	      } else if (a === undefined) {
	        return -1
	      } else if (a === b) {
	        continue
	      } else {
	        return compareIdentifiers(a, b)
	      }
	    } while (++i)
	  }

	  compareBuild (other) {
	    if (!(other instanceof SemVer)) {
	      other = new SemVer(other, this.options);
	    }

	    let i = 0;
	    do {
	      const a = this.build[i];
	      const b = other.build[i];
	      debug('build compare', i, a, b);
	      if (a === undefined && b === undefined) {
	        return 0
	      } else if (b === undefined) {
	        return 1
	      } else if (a === undefined) {
	        return -1
	      } else if (a === b) {
	        continue
	      } else {
	        return compareIdentifiers(a, b)
	      }
	    } while (++i)
	  }

	  // preminor will bump the version up to the next minor release, and immediately
	  // down to pre-release. premajor and prepatch work the same way.
	  inc (release, identifier, identifierBase) {
	    if (release.startsWith('pre')) {
	      if (!identifier && identifierBase === false) {
	        throw new Error('invalid increment argument: identifier is empty')
	      }
	      // Avoid an invalid semver results
	      if (identifier) {
	        const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
	        if (!match || match[1] !== identifier) {
	          throw new Error(`invalid identifier: ${identifier}`)
	        }
	      }
	    }

	    switch (release) {
	      case 'premajor':
	        this.prerelease.length = 0;
	        this.patch = 0;
	        this.minor = 0;
	        this.major++;
	        this.inc('pre', identifier, identifierBase);
	        break
	      case 'preminor':
	        this.prerelease.length = 0;
	        this.patch = 0;
	        this.minor++;
	        this.inc('pre', identifier, identifierBase);
	        break
	      case 'prepatch':
	        // If this is already a prerelease, it will bump to the next version
	        // drop any prereleases that might already exist, since they are not
	        // relevant at this point.
	        this.prerelease.length = 0;
	        this.inc('patch', identifier, identifierBase);
	        this.inc('pre', identifier, identifierBase);
	        break
	      // If the input is a non-prerelease version, this acts the same as
	      // prepatch.
	      case 'prerelease':
	        if (this.prerelease.length === 0) {
	          this.inc('patch', identifier, identifierBase);
	        }
	        this.inc('pre', identifier, identifierBase);
	        break
	      case 'release':
	        if (this.prerelease.length === 0) {
	          throw new Error(`version ${this.raw} is not a prerelease`)
	        }
	        this.prerelease.length = 0;
	        break

	      case 'major':
	        // If this is a pre-major version, bump up to the same major version.
	        // Otherwise increment major.
	        // 1.0.0-5 bumps to 1.0.0
	        // 1.1.0 bumps to 2.0.0
	        if (
	          this.minor !== 0 ||
	          this.patch !== 0 ||
	          this.prerelease.length === 0
	        ) {
	          this.major++;
	        }
	        this.minor = 0;
	        this.patch = 0;
	        this.prerelease = [];
	        break
	      case 'minor':
	        // If this is a pre-minor version, bump up to the same minor version.
	        // Otherwise increment minor.
	        // 1.2.0-5 bumps to 1.2.0
	        // 1.2.1 bumps to 1.3.0
	        if (this.patch !== 0 || this.prerelease.length === 0) {
	          this.minor++;
	        }
	        this.patch = 0;
	        this.prerelease = [];
	        break
	      case 'patch':
	        // If this is not a pre-release version, it will increment the patch.
	        // If it is a pre-release it will bump up to the same patch version.
	        // 1.2.0-5 patches to 1.2.0
	        // 1.2.0 patches to 1.2.1
	        if (this.prerelease.length === 0) {
	          this.patch++;
	        }
	        this.prerelease = [];
	        break
	      // This probably shouldn't be used publicly.
	      // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
	      case 'pre': {
	        const base = Number(identifierBase) ? 1 : 0;

	        if (this.prerelease.length === 0) {
	          this.prerelease = [base];
	        } else {
	          let i = this.prerelease.length;
	          while (--i >= 0) {
	            if (typeof this.prerelease[i] === 'number') {
	              this.prerelease[i]++;
	              i = -2;
	            }
	          }
	          if (i === -1) {
	            // didn't increment anything
	            if (identifier === this.prerelease.join('.') && identifierBase === false) {
	              throw new Error('invalid increment argument: identifier already exists')
	            }
	            this.prerelease.push(base);
	          }
	        }
	        if (identifier) {
	          // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
	          // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
	          let prerelease = [identifier, base];
	          if (identifierBase === false) {
	            prerelease = [identifier];
	          }
	          if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
	            if (isNaN(this.prerelease[1])) {
	              this.prerelease = prerelease;
	            }
	          } else {
	            this.prerelease = prerelease;
	          }
	        }
	        break
	      }
	      default:
	        throw new Error(`invalid increment argument: ${release}`)
	    }
	    this.raw = this.format();
	    if (this.build.length) {
	      this.raw += `+${this.build.join('.')}`;
	    }
	    return this
	  }
	}

	semver = SemVer;
	return semver;
}var compare_1;
var hasRequiredCompare;

function requireCompare () {
	if (hasRequiredCompare) return compare_1;
	hasRequiredCompare = 1;

	const SemVer = /*@__PURE__*/ requireSemver();
	const compare = (a, b, loose) =>
	  new SemVer(a, loose).compare(new SemVer(b, loose));

	compare_1 = compare;
	return compare_1;
}var rcompare_1;
var hasRequiredRcompare;

function requireRcompare () {
	if (hasRequiredRcompare) return rcompare_1;
	hasRequiredRcompare = 1;

	const compare = /*@__PURE__*/ requireCompare();
	const rcompare = (a, b, loose) => compare(b, a, loose);
	rcompare_1 = rcompare;
	return rcompare_1;
}var rcompareExports = /*@__PURE__*/ requireRcompare();
const rcompare = /*@__PURE__*/getDefaultExportFromCjs(rcompareExports);const RELEASE_NOTES_KEY_PREFIX = "desktop-release-notes.";
const KEY_DESKTOP_RELEASE_NOTES_DEFAULT = `${RELEASE_NOTES_KEY_PREFIX}default`;const extractVersion = (key) => {
  return key.split(RELEASE_NOTES_KEY_PREFIX)[1] ?? "";
};
const getSortedDescReleaseNotesKeys = (dictionary) => {
  return Object.keys(dictionary).filter((key) => key.startsWith(RELEASE_NOTES_KEY_PREFIX)).sort((key1, key2) => {
    const version1 = extractVersion(key1) ?? "";
    const version2 = extractVersion(key2) ?? "";
    return rcompare(version1, version2);
  });
};const removeNewerReleaseNotes = (data, version) => {
  const currentReleaseNotes = {};
  if (!version) {
    return currentReleaseNotes;
  }
  const keysToAdd = Object.keys(data).filter((key) => {
    const extractedVersion = extractVersion(key);
    return rcompare(extractedVersion, version) >= 0;
  });
  keysToAdd.forEach((key) => {
    const value = data[key];
    if (value) {
      currentReleaseNotes[key] = value;
    }
  });
  return currentReleaseNotes;
};function stringToAST(text) {
  if (!text) {
    return [];
  }
  const trimmedText = text.trim();
  try {
    return icuMessageformatParser.parse(trimmedText);
  } catch {
    return [
      {
        type: 0,
        value: trimmedText
      }
    ];
  }
}var gt_1;
var hasRequiredGt;

function requireGt () {
	if (hasRequiredGt) return gt_1;
	hasRequiredGt = 1;

	const compare = /*@__PURE__*/ requireCompare();
	const gt = (a, b, loose) => compare(a, b, loose) > 0;
	gt_1 = gt;
	return gt_1;
}var gtExports = /*@__PURE__*/ requireGt();
const gt = /*@__PURE__*/getDefaultExportFromCjs(gtExports);var parse_1;
var hasRequiredParse;

function requireParse () {
	if (hasRequiredParse) return parse_1;
	hasRequiredParse = 1;

	const SemVer = /*@__PURE__*/ requireSemver();
	const parse = (version, options, throwErrors = false) => {
	  if (version instanceof SemVer) {
	    return version
	  }
	  try {
	    return new SemVer(version, options)
	  } catch (er) {
	    if (!throwErrors) {
	      return null
	    }
	    throw er
	  }
	};

	parse_1 = parse;
	return parse_1;
}var valid_1;
var hasRequiredValid;

function requireValid () {
	if (hasRequiredValid) return valid_1;
	hasRequiredValid = 1;

	const parse = /*@__PURE__*/ requireParse();
	const valid = (version, options) => {
	  const v = parse(version, options);
	  return v ? v.version : null
	};
	valid_1 = valid;
	return valid_1;
}var validExports = /*@__PURE__*/ requireValid();
const valid = /*@__PURE__*/getDefaultExportFromCjs(validExports);const dateToDDMonthYYYYProps = () => {
  return {
    year: "numeric",
    month: "long",
    day: "numeric"
  };
};const eventsLogger = new Logger("Events");
const isBoolean = (value) => {
  return typeof value === "boolean";
};
const handleApplicationEvents = (window) => {
  const updater = getUpdater();
  electron.ipcMain.on(Events.WINDOW_MINIMIZE, () => {
    eventsLogger.info("Event received", Events.WINDOW_MINIMIZE);
    minimize(window);
  });
  electron.ipcMain.on(Events.WINDOW_MAXIMIZE, () => {
    eventsLogger.info("Event received", Events.WINDOW_MAXIMIZE);
    toggleMaximize(window);
  });
  electron.ipcMain.on(Events.WINDOW_CLOSE, () => {
    eventsLogger.info("Event received", Events.WINDOW_CLOSE);
    if ([Platform.WINDOWS, Platform.LINUX].includes(devicePlatform)) {
      if (state.player.isPlaying) {
        toggleWindowVisibility(window, false);
      } else {
        electron.app.quit();
      }
    } else {
      electron.app.quit();
    }
  });
  electron.ipcMain.on(Events.INSTALL_UPDATE, () => {
    eventsLogger.info("Event received", Events.INSTALL_UPDATE);
    updater.install();
  });
  electron.ipcMain.on(Events.APPLICATION_READY, async (event, language) => {
    eventsLogger.info("Event received", Events.APPLICATION_READY);
    logHardwareInfo();
    if (state.deeplink) {
      navigateToDeeplink(window, state.deeplink);
    }
    if (updater.latestAvailableVersion) {
      sendUpdateAvailable(window, updater.latestAvailableVersion);
    }
    if (isFirstLaunch()) {
      sendAnalyticsOnFirstLaunch(window);
    }
    sendProbabilityBucket(window, updater.getProbabilityBucket());
    const version = electron.app.getVersion();
    const releaseNotes = await loadReleaseNotes(language);
    if (!releaseNotes) {
      return;
    }
    const { [`${KEY_DESKTOP_RELEASE_NOTES_DEFAULT}`]: defaultReleaseNote, ...otherNotes } = releaseNotes;
    let translationsReleaseNotes = removeNewerReleaseNotes(otherNotes, version);
    const sortedDescReleaseNotesKeys = getSortedDescReleaseNotesKeys(translationsReleaseNotes);
    const latestVersion = sortedDescReleaseNotesKeys[0];
    if (!latestVersion) {
      return;
    }
    const extractedVersion = extractVersion(latestVersion);
    if (valid(extractedVersion) && valid(version) && gt(version, extractedVersion) && Array.isArray(defaultReleaseNote)) {
      const dateString = `<date>${formatDate({
        date: config.buildInfo.BUILD_TIME,
        options: dateToDDMonthYYYYProps(),
        language
      })}</date>
`;
      const dateAST = stringToAST(dateString);
      translationsReleaseNotes = {
        ...translationsReleaseNotes,
        [`${RELEASE_NOTES_KEY_PREFIX}${version}`]: [...dateAST, ...defaultReleaseNote]
      };
      sortedDescReleaseNotesKeys.unshift(`${RELEASE_NOTES_KEY_PREFIX}${version}`);
    }
    sendLoadReleaseNotes({
      window,
      needToShowReleaseNotes: needToShowReleaseNotes(),
      sortedDescReleaseNotesKeys,
      translationsReleaseNotes
    });
  });
  electron.ipcMain.on(Events.APPLICATION_THEME, (event, backgroundColor) => {
    eventsLogger.info("Event received", Events.APPLICATION_THEME);
    window.setBackgroundColor(backgroundColor);
  });
  electron.ipcMain.on(Events.TRACKS_AVAILABILITY_UPDATED, (event) => {
    const [, setTracksAvailabilityUpdatedAt] = tracksAvailabilityUpdatedAt;
    eventsLogger.info("Event received", Events.TRACKS_AVAILABILITY_UPDATED);
    setTracksAvailabilityUpdatedAt(Date.now());
  });
  electron.ipcMain.on(Events.REPOSITORY_META_UPDATED, (event) => {
    const [, setRepositoryMetaUpdatedAtStoreValue] = repositoryMetaUpdatedAt;
    eventsLogger.info("Event received", Events.REPOSITORY_META_UPDATED);
    setRepositoryMetaUpdatedAtStoreValue(Date.now());
  });
  electron.ipcMain.on(Events.PLAYER_STATE, (event, { isPlaying, canMoveBackward, canMoveForward }) => {
    eventsLogger.info(`Event received`, Events.PLAYER_STATE, isPlaying, canMoveBackward, canMoveForward);
    if (isBoolean(isPlaying)) {
      state.player.isPlaying = isPlaying;
      toggleAppSuspension(isPlaying);
    }
    if (isBoolean(canMoveBackward)) {
      state.player.canMoveBackward = canMoveBackward;
    }
    if (isBoolean(canMoveForward)) {
      state.player.canMoveForward = canMoveForward;
    }
    updateTrayMenu(window);
  });
  electron.ipcMain.on(Events.SAVE_PNG_IMAGE_TO_LOCAL_DISK, async (_, defaultPath, buffer) => {
    eventsLogger.info("Event handle", Events.SAVE_PNG_IMAGE_TO_LOCAL_DISK);
    await handleSavePngImageToLocalDisk(defaultPath, buffer);
  });
  electron.ipcMain.handle(Events.GET_PASSPORT_LOGIN, async () => {
    eventsLogger.info("Event handle", Events.GET_PASSPORT_LOGIN);
    try {
      const cookie = await electron.session.defaultSession.cookies.get({
        name: PASSPORT_LOGIN,
        domain: PASSPORT_LOGIN_DOMAIN
      });
      return cookie?.[0]?.value;
    } catch (error) {
      eventsLogger.error(`${Events.GET_PASSPORT_LOGIN} event failed.`, error);
      return;
    }
  });
  electron.ipcMain.handle(Events.GET_YANDEX_UID, async () => {
    eventsLogger.info("Event handle", Events.GET_YANDEX_UID);
    try {
      const cookie = await electron.session.defaultSession.cookies.get({
        name: YANDEX_ID,
        domain: PASSPORT_LOGIN_DOMAIN
      });
      return cookie?.[0]?.value;
    } catch (error) {
      eventsLogger.error(`${Events.GET_YANDEX_UID} event failed.`, error);
      return;
    }
  });
};
const sendProbabilityBucket = (window, bucket) => {
  window.webContents.send(Events.PROBABILITY_BUCKET, bucket);
  eventsLogger.info("Event sent", Events.PROBABILITY_BUCKET, bucket);
};
const sendLoadReleaseNotes = ({
  window,
  needToShowReleaseNotes: needToShowReleaseNotes2,
  sortedDescReleaseNotesKeys,
  translationsReleaseNotes
}) => {
  window.webContents.send(Events.LOAD_RELEASE_NOTES, {
    needToShowReleaseNotes: needToShowReleaseNotes2,
    sortedDescReleaseNotesKeys,
    translationsReleaseNotes
  });
  eventsLogger.info("Event sent", Events.LOAD_RELEASE_NOTES);
};
const sendUpdateAvailable = (window, version) => {
  window.webContents.send(Events.UPDATE_AVAILABLE, version);
  eventsLogger.info("Event sent", Events.UPDATE_AVAILABLE, version);
};
const sendRefreshApplicationData = (window) => {
  window.webContents.send(Events.REFRESH_APPLICATION_DATA);
  eventsLogger.info("Event sent", Events.REFRESH_APPLICATION_DATA);
};
const sendPlayerAction = (window, action) => {
  window.webContents.send(Events.PLAYER_ACTION, action);
  eventsLogger.info("Event sent", Events.PLAYER_ACTION, action);
};
const sendOpenDeeplink = (window, pathname) => {
  window.webContents.send(Events.OPEN_DEEPLINK, pathname);
  eventsLogger.info("Event sent", Events.OPEN_DEEPLINK);
};
const sendAnalyticsOnFirstLaunch = (window) => {
  window.webContents.send(Events.FIRST_LAUNCH);
  eventsLogger.info("Event send", Events.FIRST_LAUNCH);
};
const sendRefreshTracksAvailability = (window) => {
  window.webContents.send(Events.REFRESH_TRACKS_AVAILABILITY);
  eventsLogger.info("Event sent", Events.REFRESH_TRACKS_AVAILABILITY);
};
const sendRefreshRepositoryMeta = (window) => {
  window.webContents.send(Events.REFRESH_REPOSITORY_META);
  eventsLogger.info("Event send", Events.REFRESH_REPOSITORY_META);
};const createSupportChatUrl = () => {
  const context = JSON.stringify({ entrypoint: "web_desktop" });
  return `https://yandex.ru/chat?context=${encodeURIComponent(context)}#${config.common.SUPPORT_URL}`;
};let tray = null;
const createPngIcon = () => {
  const sizes = [22, 24, 32, 48, 16];
  const iconsPath = path.join(process.resourcesPath, "assets", "icons");
  const icon = electron.nativeImage.createEmpty();
  for (const size of sizes) {
    const iconPath = path.join(iconsPath, `icon_${size}x${size}.png`);
    const sizeIcon = electron.nativeImage.createFromPath(iconPath);
    icon.addRepresentation({
      width: size,
      height: size,
      buffer: sizeIcon.toPNG()
    });
  }
  return icon;
};
const createIcoIcon = () => {
  const iconPath = path.join(process.resourcesPath, "assets", "icon.ico");
  return electron.nativeImage.createFromPath(iconPath);
};
const trayIcon = () => {
  if (devicePlatform === Platform.LINUX) {
    return createPngIcon();
  }
  return createIcoIcon();
};
const createContextMenu$1 = (window) => {
  const updater = getUpdater();
  const windowStateLabel = state.isMinimized ? formatMessage({ id: "windows-menu.unwrap" }) : formatMessage({ id: "windows-menu.roll-up" });
  const playButtonLabel = state.player.isPlaying ? formatMessage({ id: "player-actions.pause" }) : formatMessage({ id: "player-actions.play" });
  const template = [
    {
      label: windowStateLabel,
      click() {
        toggleWindowState(window);
      }
    },
    {
      label: formatMessage({ id: "desktop.check-for-updates" }),
      click() {
        updater.check();
      }
    },
    {
      type: "separator"
    },
    {
      label: playButtonLabel,
      click() {
        if (state.player.isPlaying) {
          sendPlayerAction(window, PlayerAction.PAUSE);
        } else {
          sendPlayerAction(window, PlayerAction.PLAY);
        }
      }
    },
    {
      label: formatMessage({ id: "player-actions.previous-track" }),
      enabled: state.player.canMoveBackward,
      click() {
        sendPlayerAction(window, PlayerAction.MOVE_BACKWARD);
      }
    },
    {
      label: formatMessage({ id: "player-actions.next-track" }),
      enabled: state.player.canMoveForward,
      click() {
        sendPlayerAction(window, PlayerAction.MOVE_FORWARD);
      }
    },
    {
      type: "separator"
    },
    {
      label: formatMessage({ id: "desktop.about" }),
      submenu: [
        {
          label: formatMessage({ id: "desktop.terms" }),
          click() {
            electron.shell.openExternal(config.common.TERMS_OF_USE_URL);
          }
        },
        {
          label: formatMessage({ id: "desktop.recommendations" }),
          click() {
            electron.shell.openExternal(config.common.RECOMMENDATIONS_URL);
          }
        },
        {
          label: formatMessage({ id: "desktop.support" }),
          click() {
            electron.shell.openExternal(createSupportChatUrl());
          }
        }
      ]
    },
    {
      type: "separator"
    },
    {
      label: formatMessage({ id: "desktop.quit" }),
      role: "quit"
    }
  ];
  return electron.Menu.buildFromTemplate(template);
};
const updateTrayMenu = (window) => {
  tray?.setContextMenu(createContextMenu$1(window));
};
const setupTray = (window) => {
  tray = new electron.Tray(trayIcon());
  tray.setToolTip(config.meta.PRODUCT_NAME_LOCALIZED);
  updateTrayMenu(window);
  tray.on("click", () => {
    toggleWindowState(window);
  });
  tray.on("double-click", () => {
    toggleWindowState(window);
  });
};const toggleWindowVisibility = (window, isVisible) => {
  if (isVisible) {
    window.show();
    window.setSkipTaskbar(false);
    state.isWindowHidden = false;
    state.isMinimized = false;
  } else {
    window.hide();
    window.setSkipTaskbar(true);
    state.isWindowHidden = true;
    state.isMinimized = true;
  }
  updateTrayMenu(window);
};const createContextMenu = (window) => {
  const updater = getUpdater();
  const template = [];
  if (devicePlatform === Platform.MACOS) {
    template.push({
      label: formatMessage({ id: "about-app.app-name" }),
      submenu: [
        {
          label: formatMessage({ id: "desktop.about" }),
          role: "about"
        },
        {
          label: formatMessage({ id: "desktop.check-for-updates" }),
          click() {
            updater.check();
          }
        },
        {
          type: "separator"
        },
        {
          label: formatMessage({ id: "desktop.terms" }),
          click() {
            electron.shell.openExternal(config.common.TERMS_OF_USE_URL);
          }
        },
        {
          label: formatMessage({ id: "desktop.recommendations" }),
          click() {
            electron.shell.openExternal(config.common.RECOMMENDATIONS_URL);
          }
        },
        {
          label: formatMessage({ id: "desktop.support" }),
          click() {
            electron.shell.openExternal(createSupportChatUrl());
          }
        },
        {
          type: "separator"
        },
        {
          label: formatMessage({ id: "desktop.hide-yandex-music" }),
          role: "hide"
        },
        {
          label: formatMessage({ id: "desktop.close-yandex-music" }),
          accelerator: "CmdOrCtrl+W",
          click() {
            if (window) {
              toggleWindowVisibility(window, false);
            }
          }
        },
        {
          label: formatMessage({ id: "desktop.quit-yandex-music" }),
          role: "quit"
        }
      ]
    });
    template.push({
      label: formatMessage({ id: "desktop.edit" }),
      submenu: [
        {
          label: formatMessage({ id: "desktop.undo" }),
          accelerator: "CmdOrCtrl+Z",
          role: "undo"
        },
        {
          label: formatMessage({ id: "desktop.redo" }),
          accelerator: "Shift+CmdOrCtrl+Z",
          role: "redo"
        },
        {
          type: "separator"
        },
        {
          label: formatMessage({ id: "desktop.cut" }),
          accelerator: "CmdOrCtrl+X",
          role: "cut"
        },
        {
          label: formatMessage({ id: "desktop.copy" }),
          accelerator: "CmdOrCtrl+C",
          role: "copy"
        },
        {
          label: formatMessage({ id: "desktop.paste" }),
          accelerator: "CmdOrCtrl+V",
          role: "paste"
        },
        {
          label: formatMessage({ id: "desktop.select-all" }),
          accelerator: "CmdOrCtrl+A",
          role: "selectAll"
        }
      ]
    });
    template.push({
      label: formatMessage({ id: "desktop.window" }),
      submenu: [
        {
          label: formatMessage({ id: "desktop.minimize" }),
          accelerator: "CmdOrCtrl+M",
          role: "minimize"
        }
      ]
    });
  }
  return electron.Menu.buildFromTemplate(template);
};
const setupSystemMenu = (window) => {
  electron.Menu.setApplicationMenu(createContextMenu(window));
};const singleInstanceLogger = new Logger("SingleInstance");
const isFirstInstance = electron.app.requestSingleInstanceLock();
const checkForSingleInstance = () => {
  if (isFirstInstance) {
    electron.app.on("second-instance", (event, commandLine) => {
      const [window] = electron.BrowserWindow.getAllWindows();
      if (window) {
        if (window.isMinimized()) {
          window.restore();
          singleInstanceLogger.log("Restore window");
        }
        const lastCommandLineArg = commandLine.pop();
        if (lastCommandLineArg && checkIsDeeplink(lastCommandLineArg)) {
          navigateToDeeplink(window, lastCommandLineArg);
        }
        toggleWindowVisibility(window, true);
        singleInstanceLogger.log("Show window");
      }
    });
  } else {
    electron.app.quit();
  }
};const createWindow = async () => {
  const webPreferences = {
    webSecurity: false,
    nodeIntegrationInWorker: true,
    nodeIntegration: false,
    contextIsolation: true,
    autoplayPolicy: "no-user-gesture-required",
    preload: path.join(__dirname, "preload.js")
  };
  const window = new electron.BrowserWindow({
    show: true,
    center: true,
    frame: [Platform.WINDOWS, Platform.MACOS].includes(devicePlatform),
    titleBarStyle: "hidden",
    trafficLightPosition: {
      x: 16,
      y: 10
    },
    minWidth: 768,
    minHeight: 650,
    width: 1280,
    height: 800,
    webPreferences
  });
  window.show();
  window.once("ready-to-show", () => {
    toggleWindowVisibility(window, true);
  });
  return window;
};const SUPPORTED_TLDS = ["ru", "com", "kz", "by", "uz"];const TLD_PATTERN = `(?:${SUPPORTED_TLDS.join("|")})`;
const isApplicationHostname = (hostname) => {
  return hostname === config.app.appHostname;
};
const yandexHostnamePattern = new RegExp(`^yandex\\.${TLD_PATTERN}$`);
const oldMusicHostnamePattern = new RegExp(`^music\\.(?:qa\\.)?yandex\\.${TLD_PATTERN}$`);
const oAuthHostnamePattern = new RegExp(`^oauth\\.yandex\\.${TLD_PATTERN}$`);
const passportYandexHostnamePattern = new RegExp(`^passport\\.yandex\\.${TLD_PATTERN}$`);
const ssoPassportYandexHostnamePattern = new RegExp(`^sso\\.passport\\.yandex\\.${TLD_PATTERN}$`);
const ssoPassportYaHostnamePattern = new RegExp(`^sso\\.ya\\.${TLD_PATTERN}$`);const isAllowed = (hostname) => {
  return passportYandexHostnamePattern.test(hostname);
};
const styleTemplate = () => {
  return `
        #ym-title-bar {
            display: flex;
            position: absolute;
            inset-block-start: 0;
            inset-inline-end: 0;
            inset-inline-start: 0;

            z-index: 9999;
            flex-direction: row;
            align-items: center;
            justify-content: flex-end;

            width: 100%;
            height: 32px;
            user-select: none;
            -webkit-app-region: drag;

            overflow: hidden;
        }

        #ym-close-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            margin: 0;
            outline: 0;
            border: 0;
            background: transparent;
            cursor: pointer;
            padding: 0;

            width: 46px;
            height: 32px;
            -webkit-app-region: no-drag;

            &:hover {
                background-color: #f23f42;
            }
        }
    `;
};
const closeIconTemplate = () => {
  return `
        <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M5 5.70801L0.854492 9.85352C0.756836 9.95117 0.639648 10 0.50293 10C0.359701 10 0.239258 9.9528 0.141602 9.8584C0.0472005 9.76074 0 9.6403 0 9.49707C0 9.36035 0.0488281 9.24316 0.146484 9.14551L4.29199 5L0.146484 0.854492C0.0488281 0.756836 0 0.638021 0 0.498047C0 0.429688 0.0130208 0.364583 0.0390625 0.302734C0.0651042 0.240885 0.100911 0.188802 0.146484 0.146484C0.192057 0.100911 0.245768 0.0651042 0.307617 0.0390625C0.369466 0.0130208 0.43457 0 0.50293 0C0.639648 0 0.756836 0.0488281 0.854492 0.146484L5 4.29199L9.14551 0.146484C9.24316 0.0488281 9.36198 0 9.50195 0C9.57031 0 9.63379 0.0130208 9.69238 0.0390625C9.75423 0.0651042 9.80794 0.100911 9.85352 0.146484C9.89909 0.192057 9.9349 0.245768 9.96094 0.307617C9.98698 0.366211 10 0.429688 10 0.498047C10 0.638021 9.95117 0.756836 9.85352 0.854492L5.70801 5L9.85352 9.14551C9.95117 9.24316 10 9.36035 10 9.49707C10 9.56543 9.98698 9.63053 9.96094 9.69238C9.9349 9.75423 9.89909 9.80794 9.85352 9.85352C9.8112 9.89909 9.75911 9.9349 9.69727 9.96094C9.63542 9.98698 9.57031 10 9.50195 10C9.36198 10 9.24316 9.95117 9.14551 9.85352L5 5.70801Z"
                fill="white"
            />
        </svg>
    `;
};
const render = () => {
  const ariaLabel = formatMessage({ id: "windows-menu.close" });
  return `
        const style = document.createElement('style');
        style.innerHTML = \`${styleTemplate()}\`;
        document.head.appendChild(style);

        const button = document.createElement('button');
        button.id = 'ym-close-button';
        button.type = 'button';
        button.ariaLabel = \`${ariaLabel}\`;
        button.innerHTML = \`${closeIconTemplate()}\`;
        button.onclick = () => {
            window.desktopEvents.send('WINDOW_CLOSE');
        };

        const container = document.createElement('div');
        container.id = 'ym-title-bar';
        container.appendChild(button);

        document.body.appendChild(container);
    `;
};
const createCustomTitleBar = (window) => {
  window.webContents.on("did-navigate", (event, targetUrl) => {
    const { hostname } = url.parse(targetUrl);
    if (hostname && isAllowed(hostname)) {
      window.webContents.executeJavaScript(render());
    }
  });
};function isPathInsideDirectory(directoryPath, filePath) {
  const normalizedDirectoryPath = path__namespace.resolve(directoryPath);
  const normalizedFilePath = path__namespace.resolve(filePath);
  const relativePath = path__namespace.relative(normalizedDirectoryPath, normalizedFilePath);
  return relativePath === "" || relativePath !== ".." && !relativePath.startsWith(`..${path__namespace.sep}`) && !path__namespace.isAbsolute(relativePath);
}const FILE_NOT_FOUND = -6;
const isSafeFileProtocolPathToServe = async (buildPath, filePath) => {
  const normalizedBuildPath = path.resolve(buildPath);
  const normalizedFilePath = path.resolve(filePath);
  if (!isPathInsideDirectory(normalizedBuildPath, normalizedFilePath)) {
    return false;
  }
  try {
    const relativeSegments = path.relative(normalizedBuildPath, normalizedFilePath).split(path.sep).filter(Boolean);
    let currentPath = normalizedBuildPath;
    const segmentPaths = relativeSegments.map((segment) => {
      currentPath = path.join(currentPath, segment);
      return currentPath;
    });
    const results = await Promise.all(segmentPaths.map((segmentPath) => fs.lstat(segmentPath)));
    if (results.some((result) => result.isSymbolicLink())) {
      return false;
    }
  } catch (error) {
    return false;
  }
  return true;
};
const resolveFileProtocolPath = (buildPath, pathname) => {
  const normalizedBuildPath = path.resolve(buildPath);
  let decodedPathname;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch (error) {
    return null;
  }
  if (!isSafeDecodedPathname(decodedPathname)) {
    return null;
  }
  const filePath = path.resolve(normalizedBuildPath, `.${decodedPathname}`);
  if (!isPathInsideDirectory(normalizedBuildPath, filePath)) {
    return null;
  }
  return filePath;
};
const resolvePath = async (filePath) => {
  try {
    const extension = path.extname(filePath);
    const normalizedFilePath = filePath && extension ? filePath : `${filePath}.html`;
    const result = await fs.stat(normalizedFilePath);
    if (result.isFile()) {
      return normalizedFilePath;
    }
    if (result.isDirectory()) {
      return await resolvePath(path.join(normalizedFilePath, "index.html"));
    }
  } catch (error) {
  }
  return null;
};
const loader = (options) => {
  const serveOptions = {
    protocol: options.protocol,
    hostname: options.hostname,
    buildPath: path.resolve(electron.app.getAppPath(), "app")
  };
  const fileProtocolHandler = async (request, callback) => {
    const pathname = new URL(request.url).pathname;
    const filePath = resolveFileProtocolPath(serveOptions.buildPath, pathname);
    if (!filePath) {
      callback({ error: FILE_NOT_FOUND });
      return;
    }
    const resolvedIndexPath = await resolvePath(filePath);
    const fileExtension = path.extname(filePath);
    if (resolvedIndexPath || !fileExtension || [".html", ".asar"].includes(fileExtension)) {
      const fallbackIndexPath = path.join(
        serveOptions.buildPath,
        pathname === "/" ? "index.html" : "not-found.html"
      );
      const responsePath = resolvedIndexPath || fallbackIndexPath;
      if (resolvedIndexPath && !await isSafeFileProtocolPathToServe(serveOptions.buildPath, resolvedIndexPath)) {
        callback({ error: FILE_NOT_FOUND });
        return;
      }
      callback({
        path: responsePath
      });
    } else {
      callback({ error: FILE_NOT_FOUND });
    }
  };
  electron.protocol.registerSchemesAsPrivileged([
    {
      scheme: serveOptions.protocol,
      privileges: {
        standard: true,
        secure: true,
        allowServiceWorkers: true,
        supportFetchAPI: true,
        corsEnabled: true
      }
    }
  ]);
  electron.app.on("ready", () => {
    electron.session.defaultSession.protocol.registerFileProtocol(serveOptions.protocol, fileProtocolHandler);
  });
  return async (window, path2) => {
    const pathname = path2 ? `/${path2}` : "";
    await window.loadURL(`${serveOptions.protocol}://${serveOptions.hostname}${pathname}`);
  };
};const loadUrlInWindow = loader({
  protocol: config.app.appProtocol,
  hostname: config.app.appHostname
});
const loadURL = async (window) => {
  await loadUrlInWindow(window);
};
const loadUnavailableErrorPage = async (window) => {
  await loadUrlInWindow(window, "unavailable.html");
};const ALLOWED_HOSTNAME_PATTERNS = [
  yandexHostnamePattern,
  oAuthHostnamePattern,
  passportYandexHostnamePattern,
  ssoPassportYandexHostnamePattern,
  ssoPassportYaHostnamePattern,
  oldMusicHostnamePattern
];
const safeRedirectsLogger = new Logger("SafeRedirects");
const isSafeHostname = (hostname) => {
  return isApplicationHostname(hostname) || ALLOWED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname));
};
const safeRedirects = (window) => {
  window.webContents.on("will-navigate", (event, targetUrl) => {
    const { hostname } = url.parse(targetUrl);
    if (hostname && !isSafeHostname(hostname)) {
      safeRedirectsLogger.warn("Redirect prevented", window.webContents.getURL(), hostname);
      event.preventDefault();
    }
  });
};const applicationCrashLogger = new Logger("ApplicationCrash");
const REASON_CRASHED = "crashed";
const REASON_OOM = "oom";
const handleCrash = () => {
  electron.app.on("render-process-gone", (event, webContents, detailed) => {
    applicationCrashLogger.error("Application crashed", detailed.reason, detailed.exitCode);
    if ([REASON_CRASHED, REASON_OOM].includes(detailed.reason)) {
      if (detailed.reason === REASON_CRASHED) {
        applicationCrashLogger.info("Relaunching");
        electron.app.relaunch({
          args: process.argv.slice(1)
        });
      }
      electron.app.exit(0);
    }
  });
};const externalLinkLogger = new Logger("ExternalLink");
const BLOCKED_URL_PROTOCOLS = [
  "file:",
  "javascript:",
  "vbscript:",
  "data:",
  "about:",
  "chrome:",
  "ms-cxh:",
  "ms-cxh-full:",
  "ms-word:"
];
const shouldOpenExternalUrl = (protocol) => {
  return !BLOCKED_URL_PROTOCOLS.includes(protocol);
};
const handleExternalLink = (window) => {
  window.webContents.setWindowOpenHandler(({ url }) => {
    setImmediate(() => {
      if (shouldOpenExternalUrl(url)) {
        externalLinkLogger.warn("Open external link", url);
        electron.shell.openExternal(url);
      }
    });
    return { action: "deny" };
  });
};const lifecycleLogger = new Logger("WindowLifecycle");
const USER_ID_IFRAME_URL_REGEXP = /^https:\/\/yandex.\w{2,3}\/user-id/;
const CONNECTION_ERROR_CODES = [-15, -21];
const checkAndUpdateApplicationData = (window) => {
  const diff = Date.now() - state.lastWindowBlurredOrHiddenTime;
  if (diff >= config.common.REFRESH_EVENT_TRIGGER_TIME_MS) {
    sendRefreshApplicationData(window);
  }
};
const setBlurredTime = () => {
  state.lastWindowBlurredOrHiddenTime = Date.now();
};
const handleWindowLifecycleEvents = (window) => {
  electron.app.on("activate", () => {
    toggleWindowVisibility(window, true);
  });
  electron.app.on("before-quit", () => {
    state.willQuit = true;
  });
  electron.app.on("window-all-closed", () => {
    if ([Platform.WINDOWS, Platform.LINUX].includes(devicePlatform)) {
      electron.app.quit();
    }
  });
  electron.app.on("browser-window-blur", () => {
    setBlurredTime();
  });
  electron.app.on("browser-window-focus", () => {
    checkAndUpdateApplicationData(window);
  });
  window.on("show", () => {
    state.isMinimized = false;
    updateTrayMenu(window);
  });
  window.on("hide", () => {
    setBlurredTime();
    state.isMinimized = true;
    updateTrayMenu(window);
  });
  window.on("minimize", () => {
    setBlurredTime();
    state.isMinimized = true;
    updateTrayMenu(window);
  });
  window.on("maximize", () => {
    checkAndUpdateApplicationData(window);
    state.isMinimized = false;
    updateTrayMenu(window);
  });
  window.on("restore", () => {
    checkAndUpdateApplicationData(window);
    state.isMinimized = false;
    updateTrayMenu(window);
  });
  window.on("close", (event) => {
    if (devicePlatform !== Platform.MACOS) {
      return;
    }
    if (state.willQuit) {
      return;
    }
    event.preventDefault();
    if (window.isFullScreen()) {
      window.once("leave-full-screen", () => {
        toggleWindowVisibility(window, false);
      });
      window.setFullScreen(false);
    } else {
      toggleWindowVisibility(window, false);
    }
  });
  const webContents = window.webContents;
  webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedUrl) => {
    const message = `Failed to load ${validatedUrl}: ${errorDescription} (${errorCode})`;
    lifecycleLogger.error(message);
    if ((errorCode <= -100 || CONNECTION_ERROR_CODES.includes(errorCode)) && !USER_ID_IFRAME_URL_REGEXP.test(validatedUrl)) {
      loadUnavailableErrorPage(window);
    }
  });
  webContents.on("did-finish-load", () => {
    webContents.insertCSS(`
                body {
                    a, button, input, textarea, select {
                        -webkit-app-region: no-drag;
                    }

                    .passp-page {
                        -webkit-app-region: drag;
                    }
                }
            `);
  });
};const uncaughtExceptionLogger = new Logger("UncaughtException");
const handleUncaughtException = () => {
  process.on("uncaughtException", (error) => {
    uncaughtExceptionLogger.error(error);
  });
  Logger.startCatching({
    showDialog: false,
    onError({ error }) {
      uncaughtExceptionLogger.error("UncaughtException log from handleUncaughtException", error);
    }
  });
};const handleWindowSessionEvents = (window) => {
  // Session download handling
};const getOs = () => {
  return {
    type: os.type(),
    release: os.release(),
    arch: os.arch(),
    version: os.version(),
    platform: devicePlatform,
    machine: os.machine()
  };
};
const getLanguage = () => {
  const locale = electron.app.getLocale();
  const countryCode = electron.app.getLocaleCountryCode();
  const preferredSystemLanguages = electron.app.getPreferredSystemLanguages();
  return {
    locale,
    countryCode,
    preferredSystemLanguages
  };
};
const getSoftwareInfo = () => {
  return {
    application: {
      version: electron.app.getVersion(),
      build: `${config.buildInfo.VERSION}/${config.buildInfo.BRANCH}`
    },
    language: getLanguage(),
    os: getOs()
  };
};
const logSoftwareInfo = () => {
  try {
    const softwareInfo = getSoftwareInfo();
    if (isRevisionChanged(StoreKeys.DEVICE_SOFTWARE_REVISION, getRevision(softwareInfo))) {
      printObject(softwareInfo);
    }
  } catch (error) {
    deviceInfoLogger.error("Cannot get software info", error);
  }
};function handleWindowReady(window) {
  window.once("ready-to-show", async () => {
    logSoftwareInfo();
    logSystemMetrics();
  });
}const FRAME_ANCESTORS = "frame-ancestors";
const ALLOWED_SOURCE = "music-application:";
const getFrameAncestorsFromCsp = (csp) => {
  const directives = csp.split(";");
  const frameAncestors = directives.find((directive) => directive.trim().startsWith(FRAME_ANCESTORS));
  return frameAncestors?.trim() ?? null;
};
const handleCsp = (originalCsp) => {
  const originalFrameAncestors = getFrameAncestorsFromCsp(originalCsp);
  if (!originalFrameAncestors) {
    return originalCsp;
  }
  const [, ...originalFrameAncestorsSources] = originalFrameAncestors.split(" ");
  if (originalFrameAncestors.includes(ALLOWED_SOURCE)) {
    return originalCsp;
  }
  const frameAncestorsSources = [
    ALLOWED_SOURCE,
    ...originalFrameAncestorsSources.filter((source) => source !== "'none'")
  ];
  return originalCsp.replace(originalFrameAncestors, `${FRAME_ANCESTORS} ${frameAncestorsSources.join(" ")}`);
};
function framesHandler(responseHeaders, details) {
  const newResponseHeaders = structuredClone(responseHeaders);
  if (details.resourceType !== "subFrame") {
    return newResponseHeaders;
  }
  delete newResponseHeaders["x-frame-options"];
  delete newResponseHeaders["X-Frame-Options"];
  const originalCsp = newResponseHeaders["content-security-policy"] ?? newResponseHeaders["Content-Security-Policy"];
  if (!originalCsp?.length) {
    return newResponseHeaders;
  }
  newResponseHeaders["content-security-policy"] = originalCsp.map(handleCsp);
  delete newResponseHeaders["Content-Security-Policy"];
  return newResponseHeaders;
}const METRIKA_DOMAIN = "mc.yandex";
const DIRECT_DOMAIN = "yandex";
const TLDS = SUPPORTED_TLDS.map((tld) => `.${tld}`);
const PROTOCOL = "https://";
const ALLOWED_HOSTS = ["music-application:"];const METRIKA_URLS = TLDS.map((tld) => PROTOCOL + METRIKA_DOMAIN + tld);
const DIRECT_URLS = TLDS.map((tld) => PROTOCOL + DIRECT_DOMAIN + tld);
const ACCESS_CONTROL_ALLOW_ORIGIN_HEADER = "access-control-allow-origin";
const NEW_HEADER_VALUE = [`${config.app.appProtocol}://${config.app.appHostname}`];
function corsHandler(responseHeaders, details) {
  const newResponseHeaders = structuredClone(responseHeaders);
  newResponseHeaders["access-control-allow-origin"] = ["*"];
  newResponseHeaders["access-control-allow-headers"] = ["*"];
  newResponseHeaders["access-control-allow-methods"] = ["GET, POST, OPTIONS, HEAD"];
  newResponseHeaders["access-control-allow-credentials"] = ["true"];
  return newResponseHeaders;
}const filter = { urls: ["*://*/*"] };
const handlers = [corsHandler, framesHandler];
const handleHeadersReceived = (window) => {
  window.webContents.session.webRequest.onHeadersReceived(filter, (details, callback) => {
    const responseHeaders = handlers.reduce((acc, value) => {
      return value(acc, details);
    }, details.responseHeaders ?? {});
    callback({
      responseHeaders
    });
  });
};const random = (min, max) => {
  return Math.floor(min + Math.random() * (max + 1 - min));
};
const TRACKS_AVAILABILITY_UPDATE_INTERVAL = 15 * 60 * 1e3;
const REPOSITORY_META_UPDATE_INTERVAL = 24 * 60 * 60 * 1e3;
const handleBackgroundTasks = (window) => {
  cron.schedule(`${random(0, 59)} */${random(5, 10)} * * * *`, () => {
    if (!state.isWindowHidden) {
      const [getTracksAvailabilityUpdatedAtValue] = tracksAvailabilityUpdatedAt;
      const tracksAvailabilityUpdatedAtValue = getTracksAvailabilityUpdatedAtValue();
      if (typeof tracksAvailabilityUpdatedAtValue === "number") {
        if (Date.now() - tracksAvailabilityUpdatedAtValue > TRACKS_AVAILABILITY_UPDATE_INTERVAL) {
          sendRefreshTracksAvailability(window);
        }
      } else {
        sendRefreshTracksAvailability(window);
      }
    }
  });
  cron.schedule(`${random(0, 59)} */${random(30, 35)} * * * *`, () => {
    if (!state.isWindowHidden) {
      const [getRepositoryMetaUpdatedAtValue] = repositoryMetaUpdatedAt;
      const repositoryMetaUpdatedAtValue = getRepositoryMetaUpdatedAtValue();
      if (typeof repositoryMetaUpdatedAtValue === "number") {
        if (Date.now() - repositoryMetaUpdatedAtValue > REPOSITORY_META_UPDATE_INTERVAL) {
          sendRefreshRepositoryMeta(window);
        }
      } else {
        sendRefreshRepositoryMeta(window);
      }
    }
  });
};const CERTIFICATE_VERIFICATION_SESSION_NAMES = {
  chromium: "chromium",
  updater: "updater"
};
const certificateVerificationLogger = new Logger("CertificateVerification");
const reportLocalCertificateVerificationRejection = (decision) => {
  if (decision.source !== "local" || decision.result !== "rejected") {
    return;
  }
  certificateVerificationLogger.error("Certificate verification rejected locally", {
    sessionName: decision.sessionName,
    hostname: decision.hostname,
    authority: decision.authority,
    failureStage: decision.failureStage,
    rejectionReason: decision.rejectionReason,
    chromiumVerificationResult: decision.chromiumVerificationResult,
    chromiumErrorCode: decision.chromiumErrorCode
  });
};
const createCertificateVerificationHosts = (additionalHosts) => {
  return {
    yandexInternal: [
      ...config.certificates.yandexInternalHosts,
      ...additionalHosts?.yandexInternal ?? []
    ],
    nuc: [...config.certificates.nucHosts, ...additionalHosts?.nuc ?? []],
    revocationDefense: [
      ...config.certificates.revocationDefenseHosts,
      ...additionalHosts?.revocationDefense ?? []
    ]
  };
};
const setupCertificateVerification = async ({
  updater,
  policyOverrides = {},
  onDecision
}) => {
  const coordinatorHandle = electronCertificateVerification.setupCertificateVerificationCoordinator({
    sessions: [
      {
        sessionName: CERTIFICATE_VERIFICATION_SESSION_NAMES.chromium,
        session: electron.session.defaultSession
      },
      {
        sessionName: CERTIFICATE_VERIFICATION_SESSION_NAMES.updater,
        session: updater.netSession
      }
    ],
    hosts: createCertificateVerificationHosts(policyOverrides.additionalHosts),
    isEnabled: () => config.common.CERTIFICATE_VERIFICATION_ENABLED,
    revocationDefense: {
      isEnabled: () => config.common.REVOCATION_DEFENSE_ENABLED,
      buildTime: policyOverrides.revocationDefenseBuildTime ?? config.buildInfo.BUILD_TIME
    },
    certificateTransparencyLogList: {
      fetchCertificateTransparencyLogList: (certificateTransparencyLogListUrl, requestOptions) => electron.net.fetch(certificateTransparencyLogListUrl, requestOptions)
    },
    logger: certificateVerificationLogger,
    onDecision: (decision) => {
      reportLocalCertificateVerificationRejection(decision);
      onDecision?.(decision);
    }
  });
  await Promise.all([
    electron.session.defaultSession.closeAllConnections(),
    updater.netSession.closeAllConnections()
  ]);
  coordinatorHandle?.refreshCertificateTransparencyLogList().catch(() => void 0);
  return coordinatorHandle;
};Logger.setupLogger();
const yandexMod = require('./mod/main');
handleUncaughtException();
checkForSingleInstance();
handleDeeplinkOnApplicationStartup();
(async () => {
  const updater = getUpdater();
  await electron.app.whenReady();
  await setupCertificateVerification({ updater });
  const window = await createWindow();
  yandexMod.initMod(window);
  setupSystemMenu(window);
  if ([Platform.WINDOWS, Platform.LINUX].includes(devicePlatform)) {
    setupTray(window);
  }
  safeRedirects(window);
  handleWindowReady(window);
  handleWindowLifecycleEvents(window);
  handleWindowSessionEvents(window);
  handleApplicationEvents(window);
  handleExternalLink(window);
  handleDeeplink(window);
  handleHeadersReceived(window);
  handleBackgroundTasks(window);
  handleCrash();
  await loadURL(window);
  toggleWindowVisibility(window, true);
  window.show();
  window.focus();
  if ([Platform.WINDOWS, Platform.LINUX].includes(devicePlatform)) {
    createCustomTitleBar(window);
  }
  if (!yandexMod.settings.get('preventAutoUpdate')) {
    updater.start();
    updater.onUpdate((version) => {
      sendUpdateAvailable(window, version);
    });
  }
})();