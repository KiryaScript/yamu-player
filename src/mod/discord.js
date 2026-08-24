const net = require('net');

class DiscordRpc {
  constructor(clientId = '745261937092198532') {
    this.clientId = clientId;
    this.socket = null;
    this.connected = false;
    this.reconnectTimer = null;
    this.currentActivity = null;
    this.enabled = true;
    this.isConnecting = false;
  }

  start() {
    this.enabled = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.connect();
  }

  stop() {
    this.enabled = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.clearActivity();
    this.cleanup();
  }

  cleanup() {
    this.connected = false;
    this.isConnecting = false;
    if (this.socket) {
      this.socket.removeAllListeners();
      try {
        this.socket.destroy();
      } catch (e) {}
      this.socket = null;
    }
  }

  async connect() {
    if (!this.enabled || this.connected || this.isConnecting) return;
    this.isConnecting = true;

    for (let i = 0; i < 10; i++) {
      if (!this.enabled) break;

      const pipePath = process.platform === 'win32'
        ? `\\\\.\\pipe\\discord-ipc-${i}`
        : `${process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || process.env.TMP || '/tmp'}/discord-ipc-${i}`;

      const ok = await this._tryConnectPipe(pipePath);
      if (ok) {
        this.isConnecting = false;
        console.log(`[DiscordRPC] Connected to Discord pipe: discord-ipc-${i}`);
        return;
      }
    }

    this.isConnecting = false;
    this.scheduleReconnect();
  }

  _tryConnectPipe(pipePath) {
    return new Promise((resolve) => {
      let settled = false;
      let socket;
      try {
        socket = net.createConnection(pipePath);
      } catch (e) {
        return resolve(false);
      }

      const onConnect = () => {
        if (settled) return;
        settled = true;
        this.socket = socket;
        this.connected = true;

        this.socket.on('data', (d) => {
          try {
            const op = d.readInt32LE(0);
            const len = d.readInt32LE(4);
            const json = JSON.parse(d.toString('utf8', 8, 8 + len));
            if (op === 1 && json.cmd === 'DISPATCH' && json.evt === 'READY') {
              console.log('[DiscordRPC] Discord Handshake READY');
              if (this.currentActivity) {
                this.setActivity(this.currentActivity);
              }
            }
          } catch (e) {}
        });

        this.socket.on('error', () => {
          this.cleanup();
          this.scheduleReconnect();
        });
        this.socket.on('close', () => {
          this.cleanup();
          this.scheduleReconnect();
        });

        this.sendHandshake();
        if (this.currentActivity) {
          this.setActivity(this.currentActivity);
        }
        resolve(true);
      };

      const onError = () => {
        if (settled) return;
        settled = true;
        try {
          socket.removeAllListeners();
          socket.destroy();
        } catch (e) {}
        resolve(false);
      };

      socket.once('connect', onConnect);
      socket.once('error', onError);
      socket.setTimeout(1000, () => onError());
    });
  }

  scheduleReconnect() {
    if (this.reconnectTimer || !this.enabled) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.enabled) {
        this.connect();
      }
    }, 10000);
  }

  encode(op, data) {
    const json = JSON.stringify(data);
    const len = Buffer.byteLength(json);
    const buf = Buffer.alloc(8 + len);
    buf.writeInt32LE(op, 0);
    buf.writeInt32LE(len, 4);
    buf.write(json, 8, len, 'utf8');
    return buf;
  }

  send(op, data) {
    if (!this.connected || !this.socket || !this.enabled) return;
    try {
      this.socket.write(this.encode(op, data));
    } catch (e) {
      this.cleanup();
      this.scheduleReconnect();
    }
  }

  sendHandshake() {
    this.send(0, { v: 1, client_id: this.clientId });
  }

  setActivity(activity) {
    this.currentActivity = activity;
    if (!this.connected || !this.enabled) return;

    let payloadActivity = null;
    if (activity) {
      payloadActivity = {
        details: activity.details ? String(activity.details).slice(0, 128) : 'Слушает музыку',
        state: activity.state ? String(activity.state).slice(0, 128) : undefined,
        timestamps: activity.timestamps,
        assets: activity.assets || {
          large_image: 'https://music.yandex.ru/favicon.png',
          large_text: 'Яндекс Музыка'
        }
      };

      if (activity.buttons && Array.isArray(activity.buttons) && activity.buttons.length > 0) {
        payloadActivity.buttons = activity.buttons.slice(0, 2).map(b => ({
          label: String(b.label).slice(0, 32),
          url: b.url
        }));
      }
    }

    this.send(1, {
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: payloadActivity
      },
      nonce: Math.random().toString(36).slice(2)
    });
  }

  clearActivity() {
    this.currentActivity = null;
    if (this.connected && this.enabled) {
      this.send(1, {
        cmd: 'SET_ACTIVITY',
        args: { pid: process.pid, activity: null },
        nonce: Math.random().toString(36).slice(2)
      });
    }
  }
}

module.exports = new DiscordRpc();
