"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/index.ts
  var ReactDOM = __toESM(__require("react-dom/client"), 1);
  var React2 = __toESM(__require("react"), 1);

  // src/hooks/useVehicleRuntimeState.ts
  var import_react = __require("react");

  // node_modules/engine.io-parser/build/esm/commons.js
  var PACKET_TYPES = /* @__PURE__ */ Object.create(null);
  PACKET_TYPES["open"] = "0";
  PACKET_TYPES["close"] = "1";
  PACKET_TYPES["ping"] = "2";
  PACKET_TYPES["pong"] = "3";
  PACKET_TYPES["message"] = "4";
  PACKET_TYPES["upgrade"] = "5";
  PACKET_TYPES["noop"] = "6";
  var PACKET_TYPES_REVERSE = /* @__PURE__ */ Object.create(null);
  Object.keys(PACKET_TYPES).forEach((key) => {
    PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
  });
  var ERROR_PACKET = { type: "error", data: "parser error" };

  // node_modules/engine.io-parser/build/esm/encodePacket.browser.js
  var withNativeBlob = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
  var withNativeArrayBuffer = typeof ArrayBuffer === "function";
  var isView = (obj) => {
    return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
  };
  var encodePacket = ({ type, data }, supportsBinary, callback) => {
    if (withNativeBlob && data instanceof Blob) {
      if (supportsBinary) {
        return callback(data);
      } else {
        return encodeBlobAsBase64(data, callback);
      }
    } else if (withNativeArrayBuffer && (data instanceof ArrayBuffer || isView(data))) {
      if (supportsBinary) {
        return callback(data);
      } else {
        return encodeBlobAsBase64(new Blob([data]), callback);
      }
    }
    return callback(PACKET_TYPES[type] + (data || ""));
  };
  var encodeBlobAsBase64 = (data, callback) => {
    const fileReader = new FileReader();
    fileReader.onload = function() {
      const content = fileReader.result.split(",")[1];
      callback("b" + (content || ""));
    };
    return fileReader.readAsDataURL(data);
  };
  function toArray(data) {
    if (data instanceof Uint8Array) {
      return data;
    } else if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    } else {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
  }
  var TEXT_ENCODER;
  function encodePacketToBinary(packet, callback) {
    if (withNativeBlob && packet.data instanceof Blob) {
      return packet.data.arrayBuffer().then(toArray).then(callback);
    } else if (withNativeArrayBuffer && (packet.data instanceof ArrayBuffer || isView(packet.data))) {
      return callback(toArray(packet.data));
    }
    encodePacket(packet, false, (encoded) => {
      if (!TEXT_ENCODER) {
        TEXT_ENCODER = new TextEncoder();
      }
      callback(TEXT_ENCODER.encode(encoded));
    });
  }

  // node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var lookup = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  var decode = (base64) => {
    let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }
    const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
    for (i = 0; i < len; i += 4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i + 1)];
      encoded3 = lookup[base64.charCodeAt(i + 2)];
      encoded4 = lookup[base64.charCodeAt(i + 3)];
      bytes[p++] = encoded1 << 2 | encoded2 >> 4;
      bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
      bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
    }
    return arraybuffer;
  };

  // node_modules/engine.io-parser/build/esm/decodePacket.browser.js
  var withNativeArrayBuffer2 = typeof ArrayBuffer === "function";
  var decodePacket = (encodedPacket, binaryType) => {
    if (typeof encodedPacket !== "string") {
      return {
        type: "message",
        data: mapBinary(encodedPacket, binaryType)
      };
    }
    const type = encodedPacket.charAt(0);
    if (type === "b") {
      return {
        type: "message",
        data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
      };
    }
    const packetType = PACKET_TYPES_REVERSE[type];
    if (!packetType) {
      return ERROR_PACKET;
    }
    return encodedPacket.length > 1 ? {
      type: PACKET_TYPES_REVERSE[type],
      data: encodedPacket.substring(1)
    } : {
      type: PACKET_TYPES_REVERSE[type]
    };
  };
  var decodeBase64Packet = (data, binaryType) => {
    if (withNativeArrayBuffer2) {
      const decoded = decode(data);
      return mapBinary(decoded, binaryType);
    } else {
      return { base64: true, data };
    }
  };
  var mapBinary = (data, binaryType) => {
    switch (binaryType) {
      case "blob":
        if (data instanceof Blob) {
          return data;
        } else {
          return new Blob([data]);
        }
      case "arraybuffer":
      default:
        if (data instanceof ArrayBuffer) {
          return data;
        } else {
          return data.buffer;
        }
    }
  };

  // node_modules/engine.io-parser/build/esm/index.js
  var SEPARATOR = String.fromCharCode(30);
  var encodePayload = (packets, callback) => {
    const length = packets.length;
    const encodedPackets = new Array(length);
    let count = 0;
    packets.forEach((packet, i) => {
      encodePacket(packet, false, (encodedPacket) => {
        encodedPackets[i] = encodedPacket;
        if (++count === length) {
          callback(encodedPackets.join(SEPARATOR));
        }
      });
    });
  };
  var decodePayload = (encodedPayload, binaryType) => {
    const encodedPackets = encodedPayload.split(SEPARATOR);
    const packets = [];
    for (let i = 0; i < encodedPackets.length; i++) {
      const decodedPacket = decodePacket(encodedPackets[i], binaryType);
      packets.push(decodedPacket);
      if (decodedPacket.type === "error") {
        break;
      }
    }
    return packets;
  };
  function createPacketEncoderStream() {
    return new TransformStream({
      transform(packet, controller) {
        encodePacketToBinary(packet, (encodedPacket) => {
          const payloadLength = encodedPacket.length;
          let header;
          if (payloadLength < 126) {
            header = new Uint8Array(1);
            new DataView(header.buffer).setUint8(0, payloadLength);
          } else if (payloadLength < 65536) {
            header = new Uint8Array(3);
            const view = new DataView(header.buffer);
            view.setUint8(0, 126);
            view.setUint16(1, payloadLength);
          } else {
            header = new Uint8Array(9);
            const view = new DataView(header.buffer);
            view.setUint8(0, 127);
            view.setBigUint64(1, BigInt(payloadLength));
          }
          if (packet.data && typeof packet.data !== "string") {
            header[0] |= 128;
          }
          controller.enqueue(header);
          controller.enqueue(encodedPacket);
        });
      }
    });
  }
  var TEXT_DECODER;
  function totalLength(chunks) {
    return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  }
  function concatChunks(chunks, size) {
    if (chunks[0].length === size) {
      return chunks.shift();
    }
    const buffer = new Uint8Array(size);
    let j = 0;
    for (let i = 0; i < size; i++) {
      buffer[i] = chunks[0][j++];
      if (j === chunks[0].length) {
        chunks.shift();
        j = 0;
      }
    }
    if (chunks.length && j < chunks[0].length) {
      chunks[0] = chunks[0].slice(j);
    }
    return buffer;
  }
  function createPacketDecoderStream(maxPayload, binaryType) {
    if (!TEXT_DECODER) {
      TEXT_DECODER = new TextDecoder();
    }
    const chunks = [];
    let state = 0;
    let expectedLength = -1;
    let isBinary2 = false;
    return new TransformStream({
      transform(chunk, controller) {
        chunks.push(chunk);
        while (true) {
          if (state === 0) {
            if (totalLength(chunks) < 1) {
              break;
            }
            const header = concatChunks(chunks, 1);
            isBinary2 = (header[0] & 128) === 128;
            expectedLength = header[0] & 127;
            if (expectedLength < 126) {
              state = 3;
            } else if (expectedLength === 126) {
              state = 1;
            } else {
              state = 2;
            }
          } else if (state === 1) {
            if (totalLength(chunks) < 2) {
              break;
            }
            const headerArray = concatChunks(chunks, 2);
            expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
            state = 3;
          } else if (state === 2) {
            if (totalLength(chunks) < 8) {
              break;
            }
            const headerArray = concatChunks(chunks, 8);
            const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
            const n = view.getUint32(0);
            if (n > Math.pow(2, 53 - 32) - 1) {
              controller.enqueue(ERROR_PACKET);
              break;
            }
            expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
            state = 3;
          } else {
            if (totalLength(chunks) < expectedLength) {
              break;
            }
            const data = concatChunks(chunks, expectedLength);
            controller.enqueue(decodePacket(isBinary2 ? data : TEXT_DECODER.decode(data), binaryType));
            state = 0;
          }
          if (expectedLength === 0 || expectedLength > maxPayload) {
            controller.enqueue(ERROR_PACKET);
            break;
          }
        }
      }
    });
  }
  var protocol = 4;

  // node_modules/@socket.io/component-emitter/lib/esm/index.js
  function Emitter(obj) {
    if (obj)
      return mixin(obj);
  }
  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
    return obj;
  }
  Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
    this._callbacks = this._callbacks || {};
    (this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
    return this;
  };
  Emitter.prototype.once = function(event, fn) {
    function on2() {
      this.off(event, on2);
      fn.apply(this, arguments);
    }
    on2.fn = fn;
    this.on(event, on2);
    return this;
  };
  Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
    this._callbacks = this._callbacks || {};
    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    }
    var callbacks = this._callbacks["$" + event];
    if (!callbacks)
      return this;
    if (1 == arguments.length) {
      delete this._callbacks["$" + event];
      return this;
    }
    var cb;
    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];
      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }
    if (callbacks.length === 0) {
      delete this._callbacks["$" + event];
    }
    return this;
  };
  Emitter.prototype.emit = function(event) {
    this._callbacks = this._callbacks || {};
    var args = new Array(arguments.length - 1), callbacks = this._callbacks["$" + event];
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
    if (callbacks) {
      callbacks = callbacks.slice(0);
      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }
    return this;
  };
  Emitter.prototype.emitReserved = Emitter.prototype.emit;
  Emitter.prototype.listeners = function(event) {
    this._callbacks = this._callbacks || {};
    return this._callbacks["$" + event] || [];
  };
  Emitter.prototype.hasListeners = function(event) {
    return !!this.listeners(event).length;
  };

  // node_modules/engine.io-client/build/esm/globals.js
  var nextTick = (() => {
    const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
    if (isPromiseAvailable) {
      return (cb) => Promise.resolve().then(cb);
    } else {
      return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
    }
  })();
  var globalThisShim = (() => {
    if (typeof self !== "undefined") {
      return self;
    } else if (typeof window !== "undefined") {
      return window;
    } else {
      return Function("return this")();
    }
  })();
  var defaultBinaryType = "arraybuffer";
  function createCookieJar() {
  }

  // node_modules/engine.io-client/build/esm/util.js
  function pick(obj, ...attr) {
    return attr.reduce((acc, k) => {
      if (obj.hasOwnProperty(k)) {
        acc[k] = obj[k];
      }
      return acc;
    }, {});
  }
  var NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
  var NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
  function installTimerFunctions(obj, opts) {
    if (opts.useNativeTimers) {
      obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
      obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
    } else {
      obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
      obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
    }
  }
  var BASE64_OVERHEAD = 1.33;
  function byteLength(obj) {
    if (typeof obj === "string") {
      return utf8Length(obj);
    }
    return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
  }
  function utf8Length(str) {
    let c = 0, length = 0;
    for (let i = 0, l = str.length; i < l; i++) {
      c = str.charCodeAt(i);
      if (c < 128) {
        length += 1;
      } else if (c < 2048) {
        length += 2;
      } else if (c < 55296 || c >= 57344) {
        length += 3;
      } else {
        i++;
        length += 4;
      }
    }
    return length;
  }
  function randomString() {
    return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
  }

  // node_modules/engine.io-client/build/esm/contrib/parseqs.js
  function encode(obj) {
    let str = "";
    for (let i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (str.length)
          str += "&";
        str += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
      }
    }
    return str;
  }
  function decode2(qs) {
    let qry = {};
    let pairs = qs.split("&");
    for (let i = 0, l = pairs.length; i < l; i++) {
      let pair = pairs[i].split("=");
      qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return qry;
  }

  // node_modules/engine.io-client/build/esm/transport.js
  var TransportError = class extends Error {
    constructor(reason, description, context) {
      super(reason);
      this.description = description;
      this.context = context;
      this.type = "TransportError";
    }
  };
  var Transport = class extends Emitter {
    /**
     * Transport abstract constructor.
     *
     * @param {Object} opts - options
     * @protected
     */
    constructor(opts) {
      super();
      this.writable = false;
      installTimerFunctions(this, opts);
      this.opts = opts;
      this.query = opts.query;
      this.socket = opts.socket;
      this.supportsBinary = !opts.forceBase64;
    }
    /**
     * Emits an error.
     *
     * @param {String} reason
     * @param description
     * @param context - the error context
     * @return {Transport} for chaining
     * @protected
     */
    onError(reason, description, context) {
      super.emitReserved("error", new TransportError(reason, description, context));
      return this;
    }
    /**
     * Opens the transport.
     */
    open() {
      this.readyState = "opening";
      this.doOpen();
      return this;
    }
    /**
     * Closes the transport.
     */
    close() {
      if (this.readyState === "opening" || this.readyState === "open") {
        this.doClose();
        this.onClose();
      }
      return this;
    }
    /**
     * Sends multiple packets.
     *
     * @param {Array} packets
     */
    send(packets) {
      if (this.readyState === "open") {
        this.write(packets);
      } else {
      }
    }
    /**
     * Called upon open
     *
     * @protected
     */
    onOpen() {
      this.readyState = "open";
      this.writable = true;
      super.emitReserved("open");
    }
    /**
     * Called with data.
     *
     * @param {String} data
     * @protected
     */
    onData(data) {
      const packet = decodePacket(data, this.socket.binaryType);
      this.onPacket(packet);
    }
    /**
     * Called with a decoded packet.
     *
     * @protected
     */
    onPacket(packet) {
      super.emitReserved("packet", packet);
    }
    /**
     * Called upon close.
     *
     * @protected
     */
    onClose(details) {
      this.readyState = "closed";
      super.emitReserved("close", details);
    }
    /**
     * Pauses the transport, in order not to lose packets during an upgrade.
     *
     * @param onPause
     */
    pause(onPause) {
    }
    createUri(schema, query = {}) {
      return schema + "://" + this._hostname() + this._port() + this.opts.path + this._query(query);
    }
    _hostname() {
      const hostname = this.opts.hostname;
      return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
    }
    _port() {
      if (this.opts.port && (this.opts.secure && Number(this.opts.port) !== 443 || !this.opts.secure && Number(this.opts.port) !== 80)) {
        return ":" + this.opts.port;
      } else {
        return "";
      }
    }
    _query(query) {
      const encodedQuery = encode(query);
      return encodedQuery.length ? "?" + encodedQuery : "";
    }
  };

  // node_modules/engine.io-client/build/esm/transports/polling.js
  var Polling = class extends Transport {
    constructor() {
      super(...arguments);
      this._polling = false;
    }
    get name() {
      return "polling";
    }
    /**
     * Opens the socket (triggers polling). We write a PING message to determine
     * when the transport is open.
     *
     * @protected
     */
    doOpen() {
      this._poll();
    }
    /**
     * Pauses polling.
     *
     * @param {Function} onPause - callback upon buffers are flushed and transport is paused
     * @package
     */
    pause(onPause) {
      this.readyState = "pausing";
      const pause = () => {
        this.readyState = "paused";
        onPause();
      };
      if (this._polling || !this.writable) {
        let total = 0;
        if (this._polling) {
          total++;
          this.once("pollComplete", function() {
            --total || pause();
          });
        }
        if (!this.writable) {
          total++;
          this.once("drain", function() {
            --total || pause();
          });
        }
      } else {
        pause();
      }
    }
    /**
     * Starts polling cycle.
     *
     * @private
     */
    _poll() {
      this._polling = true;
      this.doPoll();
      this.emitReserved("poll");
    }
    /**
     * Overloads onData to detect payloads.
     *
     * @protected
     */
    onData(data) {
      const callback = (packet) => {
        if ("opening" === this.readyState && packet.type === "open") {
          this.onOpen();
        }
        if ("close" === packet.type) {
          this.onClose({ description: "transport closed by the server" });
          return false;
        }
        this.onPacket(packet);
      };
      decodePayload(data, this.socket.binaryType).forEach(callback);
      if ("closed" !== this.readyState) {
        this._polling = false;
        this.emitReserved("pollComplete");
        if ("open" === this.readyState) {
          this._poll();
        } else {
        }
      }
    }
    /**
     * For polling, send a close packet.
     *
     * @protected
     */
    doClose() {
      const close = () => {
        this.write([{ type: "close" }]);
      };
      if ("open" === this.readyState) {
        close();
      } else {
        this.once("open", close);
      }
    }
    /**
     * Writes a packets payload.
     *
     * @param {Array} packets - data packets
     * @protected
     */
    write(packets) {
      this.writable = false;
      encodePayload(packets, (data) => {
        this.doWrite(data, () => {
          this.writable = true;
          this.emitReserved("drain");
        });
      });
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
      const schema = this.opts.secure ? "https" : "http";
      const query = this.query || {};
      if (false !== this.opts.timestampRequests) {
        query[this.opts.timestampParam] = randomString();
      }
      if (!this.supportsBinary && !query.sid) {
        query.b64 = 1;
      }
      return this.createUri(schema, query);
    }
  };

  // node_modules/engine.io-client/build/esm/contrib/has-cors.js
  var value = false;
  try {
    value = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
  } catch (err) {
  }
  var hasCORS = value;

  // node_modules/engine.io-client/build/esm/transports/polling-xhr.js
  function empty() {
  }
  var BaseXHR = class extends Polling {
    /**
     * XHR Polling constructor.
     *
     * @param {Object} opts
     * @package
     */
    constructor(opts) {
      super(opts);
      if (typeof location !== "undefined") {
        const isSSL = "https:" === location.protocol;
        let port = location.port;
        if (!port) {
          port = isSSL ? "443" : "80";
        }
        this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
      }
    }
    /**
     * Sends data.
     *
     * @param {String} data to send.
     * @param {Function} called upon flush.
     * @private
     */
    doWrite(data, fn) {
      const req = this.request({
        method: "POST",
        data
      });
      req.on("success", fn);
      req.on("error", (xhrStatus, context) => {
        this.onError("xhr post error", xhrStatus, context);
      });
    }
    /**
     * Starts a poll cycle.
     *
     * @private
     */
    doPoll() {
      const req = this.request();
      req.on("data", this.onData.bind(this));
      req.on("error", (xhrStatus, context) => {
        this.onError("xhr poll error", xhrStatus, context);
      });
      this.pollXhr = req;
    }
  };
  var Request = class _Request extends Emitter {
    /**
     * Request constructor
     *
     * @param {Object} options
     * @package
     */
    constructor(createRequest, uri, opts) {
      super();
      this.createRequest = createRequest;
      installTimerFunctions(this, opts);
      this._opts = opts;
      this._method = opts.method || "GET";
      this._uri = uri;
      this._data = void 0 !== opts.data ? opts.data : null;
      this._create();
    }
    /**
     * Creates the XHR object and sends the request.
     *
     * @private
     */
    _create() {
      var _a;
      const opts = pick(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
      opts.xdomain = !!this._opts.xd;
      const xhr = this._xhr = this.createRequest(opts);
      try {
        xhr.open(this._method, this._uri, true);
        try {
          if (this._opts.extraHeaders) {
            xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
            for (let i in this._opts.extraHeaders) {
              if (this._opts.extraHeaders.hasOwnProperty(i)) {
                xhr.setRequestHeader(i, this._opts.extraHeaders[i]);
              }
            }
          }
        } catch (e) {
        }
        if ("POST" === this._method) {
          try {
            xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
          } catch (e) {
          }
        }
        try {
          xhr.setRequestHeader("Accept", "*/*");
        } catch (e) {
        }
        (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.addCookies(xhr);
        if ("withCredentials" in xhr) {
          xhr.withCredentials = this._opts.withCredentials;
        }
        if (this._opts.requestTimeout) {
          xhr.timeout = this._opts.requestTimeout;
        }
        xhr.onreadystatechange = () => {
          var _a2;
          if (xhr.readyState === 3) {
            (_a2 = this._opts.cookieJar) === null || _a2 === void 0 ? void 0 : _a2.parseCookies(
              // @ts-ignore
              xhr.getResponseHeader("set-cookie")
            );
          }
          if (4 !== xhr.readyState)
            return;
          if (200 === xhr.status || 1223 === xhr.status) {
            this._onLoad();
          } else {
            this.setTimeoutFn(() => {
              this._onError(typeof xhr.status === "number" ? xhr.status : 0);
            }, 0);
          }
        };
        xhr.send(this._data);
      } catch (e) {
        this.setTimeoutFn(() => {
          this._onError(e);
        }, 0);
        return;
      }
      if (typeof document !== "undefined") {
        this._index = _Request.requestsCount++;
        _Request.requests[this._index] = this;
      }
    }
    /**
     * Called upon error.
     *
     * @private
     */
    _onError(err) {
      this.emitReserved("error", err, this._xhr);
      this._cleanup(true);
    }
    /**
     * Cleans up house.
     *
     * @private
     */
    _cleanup(fromError) {
      if ("undefined" === typeof this._xhr || null === this._xhr) {
        return;
      }
      this._xhr.onreadystatechange = empty;
      if (fromError) {
        try {
          this._xhr.abort();
        } catch (e) {
        }
      }
      if (typeof document !== "undefined") {
        delete _Request.requests[this._index];
      }
      this._xhr = null;
    }
    /**
     * Called upon load.
     *
     * @private
     */
    _onLoad() {
      const data = this._xhr.responseText;
      if (data !== null) {
        this.emitReserved("data", data);
        this.emitReserved("success");
        this._cleanup();
      }
    }
    /**
     * Aborts the request.
     *
     * @package
     */
    abort() {
      this._cleanup();
    }
  };
  Request.requestsCount = 0;
  Request.requests = {};
  if (typeof document !== "undefined") {
    if (typeof attachEvent === "function") {
      attachEvent("onunload", unloadHandler);
    } else if (typeof addEventListener === "function") {
      const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
      addEventListener(terminationEvent, unloadHandler, false);
    }
  }
  function unloadHandler() {
    for (let i in Request.requests) {
      if (Request.requests.hasOwnProperty(i)) {
        Request.requests[i].abort();
      }
    }
  }
  var hasXHR2 = function() {
    const xhr = newRequest({
      xdomain: false
    });
    return xhr && xhr.responseType !== null;
  }();
  var XHR = class extends BaseXHR {
    constructor(opts) {
      super(opts);
      const forceBase64 = opts && opts.forceBase64;
      this.supportsBinary = hasXHR2 && !forceBase64;
    }
    request(opts = {}) {
      Object.assign(opts, { xd: this.xd }, this.opts);
      return new Request(newRequest, this.uri(), opts);
    }
  };
  function newRequest(opts) {
    const xdomain = opts.xdomain;
    try {
      if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
        return new XMLHttpRequest();
      }
    } catch (e) {
    }
    if (!xdomain) {
      try {
        return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
      } catch (e) {
      }
    }
  }

  // node_modules/engine.io-client/build/esm/transports/websocket.js
  var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
  var BaseWS = class extends Transport {
    get name() {
      return "websocket";
    }
    doOpen() {
      const uri = this.uri();
      const protocols = this.opts.protocols;
      const opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
      if (this.opts.extraHeaders) {
        opts.headers = this.opts.extraHeaders;
      }
      try {
        this.ws = this.createSocket(uri, protocols, opts);
      } catch (err) {
        return this.emitReserved("error", err);
      }
      this.ws.binaryType = this.socket.binaryType;
      this.addEventListeners();
    }
    /**
     * Adds event listeners to the socket
     *
     * @private
     */
    addEventListeners() {
      this.ws.onopen = () => {
        if (this.opts.autoUnref) {
          this.ws._socket.unref();
        }
        this.onOpen();
      };
      this.ws.onclose = (closeEvent) => this.onClose({
        description: "websocket connection closed",
        context: closeEvent
      });
      this.ws.onmessage = (ev) => this.onData(ev.data);
      this.ws.onerror = (e) => this.onError("websocket error", e);
    }
    write(packets) {
      this.writable = false;
      for (let i = 0; i < packets.length; i++) {
        const packet = packets[i];
        const lastPacket = i === packets.length - 1;
        encodePacket(packet, this.supportsBinary, (data) => {
          try {
            this.doWrite(packet, data);
          } catch (e) {
          }
          if (lastPacket) {
            nextTick(() => {
              this.writable = true;
              this.emitReserved("drain");
            }, this.setTimeoutFn);
          }
        });
      }
    }
    doClose() {
      if (typeof this.ws !== "undefined") {
        this.ws.onerror = () => {
        };
        this.ws.close();
        this.ws = null;
      }
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
      const schema = this.opts.secure ? "wss" : "ws";
      const query = this.query || {};
      if (this.opts.timestampRequests) {
        query[this.opts.timestampParam] = randomString();
      }
      if (!this.supportsBinary) {
        query.b64 = 1;
      }
      return this.createUri(schema, query);
    }
  };
  var WebSocketCtor = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
  var WS = class extends BaseWS {
    createSocket(uri, protocols, opts) {
      return !isReactNative ? protocols ? new WebSocketCtor(uri, protocols) : new WebSocketCtor(uri) : new WebSocketCtor(uri, protocols, opts);
    }
    doWrite(_packet, data) {
      this.ws.send(data);
    }
  };

  // node_modules/engine.io-client/build/esm/transports/webtransport.js
  var WT = class extends Transport {
    get name() {
      return "webtransport";
    }
    doOpen() {
      try {
        this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
      } catch (err) {
        return this.emitReserved("error", err);
      }
      this._transport.closed.then(() => {
        this.onClose();
      }).catch((err) => {
        this.onError("webtransport error", err);
      });
      this._transport.ready.then(() => {
        this._transport.createBidirectionalStream().then((stream) => {
          const decoderStream = createPacketDecoderStream(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
          const reader = stream.readable.pipeThrough(decoderStream).getReader();
          const encoderStream = createPacketEncoderStream();
          encoderStream.readable.pipeTo(stream.writable);
          this._writer = encoderStream.writable.getWriter();
          const read = () => {
            reader.read().then(({ done, value: value2 }) => {
              if (done) {
                return;
              }
              this.onPacket(value2);
              read();
            }).catch((err) => {
            });
          };
          read();
          const packet = { type: "open" };
          if (this.query.sid) {
            packet.data = `{"sid":"${this.query.sid}"}`;
          }
          this._writer.write(packet).then(() => this.onOpen());
        });
      });
    }
    write(packets) {
      this.writable = false;
      for (let i = 0; i < packets.length; i++) {
        const packet = packets[i];
        const lastPacket = i === packets.length - 1;
        this._writer.write(packet).then(() => {
          if (lastPacket) {
            nextTick(() => {
              this.writable = true;
              this.emitReserved("drain");
            }, this.setTimeoutFn);
          }
        });
      }
    }
    doClose() {
      var _a;
      (_a = this._transport) === null || _a === void 0 ? void 0 : _a.close();
    }
  };

  // node_modules/engine.io-client/build/esm/transports/index.js
  var transports = {
    websocket: WS,
    webtransport: WT,
    polling: XHR
  };

  // node_modules/engine.io-client/build/esm/contrib/parseuri.js
  var re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
  var parts = [
    "source",
    "protocol",
    "authority",
    "userInfo",
    "user",
    "password",
    "host",
    "port",
    "relative",
    "path",
    "directory",
    "file",
    "query",
    "anchor"
  ];
  function parse(str) {
    if (str.length > 8e3) {
      throw "URI too long";
    }
    const src = str, b = str.indexOf("["), e = str.indexOf("]");
    if (b != -1 && e != -1) {
      str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ";") + str.substring(e, str.length);
    }
    let m = re.exec(str || ""), uri = {}, i = 14;
    while (i--) {
      uri[parts[i]] = m[i] || "";
    }
    if (b != -1 && e != -1) {
      uri.source = src;
      uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");
      uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
      uri.ipv6uri = true;
    }
    uri.pathNames = pathNames(uri, uri["path"]);
    uri.queryKey = queryKey(uri, uri["query"]);
    return uri;
  }
  function pathNames(obj, path) {
    const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
    if (path.slice(0, 1) == "/" || path.length === 0) {
      names.splice(0, 1);
    }
    if (path.slice(-1) == "/") {
      names.splice(names.length - 1, 1);
    }
    return names;
  }
  function queryKey(uri, query) {
    const data = {};
    query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function($0, $1, $2) {
      if ($1) {
        data[$1] = $2;
      }
    });
    return data;
  }

  // node_modules/engine.io-client/build/esm/socket.js
  var withEventListeners = typeof addEventListener === "function" && typeof removeEventListener === "function";
  var OFFLINE_EVENT_LISTENERS = [];
  if (withEventListeners) {
    addEventListener("offline", () => {
      OFFLINE_EVENT_LISTENERS.forEach((listener) => listener());
    }, false);
  }
  var SocketWithoutUpgrade = class _SocketWithoutUpgrade extends Emitter {
    /**
     * Socket constructor.
     *
     * @param {String|Object} uri - uri or options
     * @param {Object} opts - options
     */
    constructor(uri, opts) {
      super();
      this.binaryType = defaultBinaryType;
      this.writeBuffer = [];
      this._prevBufferLen = 0;
      this._pingInterval = -1;
      this._pingTimeout = -1;
      this._maxPayload = -1;
      this._pingTimeoutTime = Infinity;
      if (uri && "object" === typeof uri) {
        opts = uri;
        uri = null;
      }
      if (uri) {
        const parsedUri = parse(uri);
        opts.hostname = parsedUri.host;
        opts.secure = parsedUri.protocol === "https" || parsedUri.protocol === "wss";
        opts.port = parsedUri.port;
        if (parsedUri.query)
          opts.query = parsedUri.query;
      } else if (opts.host) {
        opts.hostname = parse(opts.host).host;
      }
      installTimerFunctions(this, opts);
      this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;
      if (opts.hostname && !opts.port) {
        opts.port = this.secure ? "443" : "80";
      }
      this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
      this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : this.secure ? "443" : "80");
      this.transports = [];
      this._transportsByName = {};
      opts.transports.forEach((t) => {
        const transportName = t.prototype.name;
        this.transports.push(transportName);
        this._transportsByName[transportName] = t;
      });
      this.opts = Object.assign({
        path: "/engine.io",
        agent: false,
        withCredentials: false,
        upgrade: true,
        timestampParam: "t",
        rememberUpgrade: false,
        addTrailingSlash: true,
        rejectUnauthorized: true,
        perMessageDeflate: {
          threshold: 1024
        },
        transportOptions: {},
        closeOnBeforeunload: false
      }, opts);
      this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "");
      if (typeof this.opts.query === "string") {
        this.opts.query = decode2(this.opts.query);
      }
      if (withEventListeners) {
        if (this.opts.closeOnBeforeunload) {
          this._beforeunloadEventListener = () => {
            if (this.transport) {
              this.transport.removeAllListeners();
              this.transport.close();
            }
          };
          addEventListener("beforeunload", this._beforeunloadEventListener, false);
        }
        if (this.hostname !== "localhost") {
          this._offlineEventListener = () => {
            this._onClose("transport close", {
              description: "network connection lost"
            });
          };
          OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
        }
      }
      if (this.opts.withCredentials) {
        this._cookieJar = createCookieJar();
      }
      this._open();
    }
    /**
     * Creates transport of the given type.
     *
     * @param {String} name - transport name
     * @return {Transport}
     * @private
     */
    createTransport(name) {
      const query = Object.assign({}, this.opts.query);
      query.EIO = protocol;
      query.transport = name;
      if (this.id)
        query.sid = this.id;
      const opts = Object.assign({}, this.opts, {
        query,
        socket: this,
        hostname: this.hostname,
        secure: this.secure,
        port: this.port
      }, this.opts.transportOptions[name]);
      return new this._transportsByName[name](opts);
    }
    /**
     * Initializes transport to use and starts probe.
     *
     * @private
     */
    _open() {
      if (this.transports.length === 0) {
        this.setTimeoutFn(() => {
          this.emitReserved("error", "No transports available");
        }, 0);
        return;
      }
      const transportName = this.opts.rememberUpgrade && _SocketWithoutUpgrade.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
      this.readyState = "opening";
      const transport = this.createTransport(transportName);
      transport.open();
      this.setTransport(transport);
    }
    /**
     * Sets the current transport. Disables the existing one (if any).
     *
     * @private
     */
    setTransport(transport) {
      if (this.transport) {
        this.transport.removeAllListeners();
      }
      this.transport = transport;
      transport.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (reason) => this._onClose("transport close", reason));
    }
    /**
     * Called when connection is deemed open.
     *
     * @private
     */
    onOpen() {
      this.readyState = "open";
      _SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === this.transport.name;
      this.emitReserved("open");
      this.flush();
    }
    /**
     * Handles a packet.
     *
     * @private
     */
    _onPacket(packet) {
      if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
        this.emitReserved("packet", packet);
        this.emitReserved("heartbeat");
        switch (packet.type) {
          case "open":
            this.onHandshake(JSON.parse(packet.data));
            break;
          case "ping":
            this._sendPacket("pong");
            this.emitReserved("ping");
            this.emitReserved("pong");
            this._resetPingTimeout();
            break;
          case "error":
            const err = new Error("server error");
            err.code = packet.data;
            this._onError(err);
            break;
          case "message":
            this.emitReserved("data", packet.data);
            this.emitReserved("message", packet.data);
            break;
        }
      } else {
      }
    }
    /**
     * Called upon handshake completion.
     *
     * @param {Object} data - handshake obj
     * @private
     */
    onHandshake(data) {
      this.emitReserved("handshake", data);
      this.id = data.sid;
      this.transport.query.sid = data.sid;
      this._pingInterval = data.pingInterval;
      this._pingTimeout = data.pingTimeout;
      this._maxPayload = data.maxPayload;
      this.onOpen();
      if ("closed" === this.readyState)
        return;
      this._resetPingTimeout();
    }
    /**
     * Sets and resets ping timeout timer based on server pings.
     *
     * @private
     */
    _resetPingTimeout() {
      this.clearTimeoutFn(this._pingTimeoutTimer);
      const delay = this._pingInterval + this._pingTimeout;
      this._pingTimeoutTime = Date.now() + delay;
      this._pingTimeoutTimer = this.setTimeoutFn(() => {
        this._onClose("ping timeout");
      }, delay);
      if (this.opts.autoUnref) {
        this._pingTimeoutTimer.unref();
      }
    }
    /**
     * Called on `drain` event
     *
     * @private
     */
    _onDrain() {
      this.writeBuffer.splice(0, this._prevBufferLen);
      this._prevBufferLen = 0;
      if (0 === this.writeBuffer.length) {
        this.emitReserved("drain");
      } else {
        this.flush();
      }
    }
    /**
     * Flush write buffers.
     *
     * @private
     */
    flush() {
      if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
        const packets = this._getWritablePackets();
        this.transport.send(packets);
        this._prevBufferLen = packets.length;
        this.emitReserved("flush");
      }
    }
    /**
     * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
     * long-polling)
     *
     * @private
     */
    _getWritablePackets() {
      const shouldCheckPayloadSize = this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1;
      if (!shouldCheckPayloadSize) {
        return this.writeBuffer;
      }
      let payloadSize = 1;
      for (let i = 0; i < this.writeBuffer.length; i++) {
        const data = this.writeBuffer[i].data;
        if (data) {
          payloadSize += byteLength(data);
        }
        if (i > 0 && payloadSize > this._maxPayload) {
          return this.writeBuffer.slice(0, i);
        }
        payloadSize += 2;
      }
      return this.writeBuffer;
    }
    /**
     * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
     *
     * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
     * `write()` method then the message would not be buffered by the Socket.IO client.
     *
     * @return {boolean}
     * @private
     */
    /* private */
    _hasPingExpired() {
      if (!this._pingTimeoutTime)
        return true;
      const hasExpired = Date.now() > this._pingTimeoutTime;
      if (hasExpired) {
        this._pingTimeoutTime = 0;
        nextTick(() => {
          this._onClose("ping timeout");
        }, this.setTimeoutFn);
      }
      return hasExpired;
    }
    /**
     * Sends a message.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @return {Socket} for chaining.
     */
    write(msg, options, fn) {
      this._sendPacket("message", msg, options, fn);
      return this;
    }
    /**
     * Sends a message. Alias of {@link Socket#write}.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @return {Socket} for chaining.
     */
    send(msg, options, fn) {
      this._sendPacket("message", msg, options, fn);
      return this;
    }
    /**
     * Sends a packet.
     *
     * @param {String} type: packet type.
     * @param {String} data.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @private
     */
    _sendPacket(type, data, options, fn) {
      if ("function" === typeof data) {
        fn = data;
        data = void 0;
      }
      if ("function" === typeof options) {
        fn = options;
        options = null;
      }
      if ("closing" === this.readyState || "closed" === this.readyState) {
        return;
      }
      options = options || {};
      options.compress = false !== options.compress;
      const packet = {
        type,
        data,
        options
      };
      this.emitReserved("packetCreate", packet);
      this.writeBuffer.push(packet);
      if (fn)
        this.once("flush", fn);
      this.flush();
    }
    /**
     * Closes the connection.
     */
    close() {
      const close = () => {
        this._onClose("forced close");
        this.transport.close();
      };
      const cleanupAndClose = () => {
        this.off("upgrade", cleanupAndClose);
        this.off("upgradeError", cleanupAndClose);
        close();
      };
      const waitForUpgrade = () => {
        this.once("upgrade", cleanupAndClose);
        this.once("upgradeError", cleanupAndClose);
      };
      if ("opening" === this.readyState || "open" === this.readyState) {
        this.readyState = "closing";
        if (this.writeBuffer.length) {
          this.once("drain", () => {
            if (this.upgrading) {
              waitForUpgrade();
            } else {
              close();
            }
          });
        } else if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      }
      return this;
    }
    /**
     * Called upon transport error
     *
     * @private
     */
    _onError(err) {
      _SocketWithoutUpgrade.priorWebsocketSuccess = false;
      if (this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening") {
        this.transports.shift();
        return this._open();
      }
      this.emitReserved("error", err);
      this._onClose("transport error", err);
    }
    /**
     * Called upon transport close.
     *
     * @private
     */
    _onClose(reason, description) {
      if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
        this.clearTimeoutFn(this._pingTimeoutTimer);
        this.transport.removeAllListeners("close");
        this.transport.close();
        this.transport.removeAllListeners();
        if (withEventListeners) {
          if (this._beforeunloadEventListener) {
            removeEventListener("beforeunload", this._beforeunloadEventListener, false);
          }
          if (this._offlineEventListener) {
            const i = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
            if (i !== -1) {
              OFFLINE_EVENT_LISTENERS.splice(i, 1);
            }
          }
        }
        this.readyState = "closed";
        this.id = null;
        this.emitReserved("close", reason, description);
        this.writeBuffer = [];
        this._prevBufferLen = 0;
      }
    }
  };
  SocketWithoutUpgrade.protocol = protocol;
  var SocketWithUpgrade = class extends SocketWithoutUpgrade {
    constructor() {
      super(...arguments);
      this._upgrades = [];
    }
    onOpen() {
      super.onOpen();
      if ("open" === this.readyState && this.opts.upgrade) {
        for (let i = 0; i < this._upgrades.length; i++) {
          this._probe(this._upgrades[i]);
        }
      }
    }
    /**
     * Probes a transport.
     *
     * @param {String} name - transport name
     * @private
     */
    _probe(name) {
      let transport = this.createTransport(name);
      let failed = false;
      SocketWithoutUpgrade.priorWebsocketSuccess = false;
      const onTransportOpen = () => {
        if (failed)
          return;
        transport.send([{ type: "ping", data: "probe" }]);
        transport.once("packet", (msg) => {
          if (failed)
            return;
          if ("pong" === msg.type && "probe" === msg.data) {
            this.upgrading = true;
            this.emitReserved("upgrading", transport);
            if (!transport)
              return;
            SocketWithoutUpgrade.priorWebsocketSuccess = "websocket" === transport.name;
            this.transport.pause(() => {
              if (failed)
                return;
              if ("closed" === this.readyState)
                return;
              cleanup();
              this.setTransport(transport);
              transport.send([{ type: "upgrade" }]);
              this.emitReserved("upgrade", transport);
              transport = null;
              this.upgrading = false;
              this.flush();
            });
          } else {
            const err = new Error("probe error");
            err.transport = transport.name;
            this.emitReserved("upgradeError", err);
          }
        });
      };
      function freezeTransport() {
        if (failed)
          return;
        failed = true;
        cleanup();
        transport.close();
        transport = null;
      }
      const onerror = (err) => {
        const error = new Error("probe error: " + err);
        error.transport = transport.name;
        freezeTransport();
        this.emitReserved("upgradeError", error);
      };
      function onTransportClose() {
        onerror("transport closed");
      }
      function onclose() {
        onerror("socket closed");
      }
      function onupgrade(to) {
        if (transport && to.name !== transport.name) {
          freezeTransport();
        }
      }
      const cleanup = () => {
        transport.removeListener("open", onTransportOpen);
        transport.removeListener("error", onerror);
        transport.removeListener("close", onTransportClose);
        this.off("close", onclose);
        this.off("upgrading", onupgrade);
      };
      transport.once("open", onTransportOpen);
      transport.once("error", onerror);
      transport.once("close", onTransportClose);
      this.once("close", onclose);
      this.once("upgrading", onupgrade);
      if (this._upgrades.indexOf("webtransport") !== -1 && name !== "webtransport") {
        this.setTimeoutFn(() => {
          if (!failed) {
            transport.open();
          }
        }, 200);
      } else {
        transport.open();
      }
    }
    onHandshake(data) {
      this._upgrades = this._filterUpgrades(data.upgrades);
      super.onHandshake(data);
    }
    /**
     * Filters upgrades, returning only those matching client transports.
     *
     * @param {Array} upgrades - server upgrades
     * @private
     */
    _filterUpgrades(upgrades) {
      const filteredUpgrades = [];
      for (let i = 0; i < upgrades.length; i++) {
        if (~this.transports.indexOf(upgrades[i]))
          filteredUpgrades.push(upgrades[i]);
      }
      return filteredUpgrades;
    }
  };
  var Socket = class extends SocketWithUpgrade {
    constructor(uri, opts = {}) {
      const o = typeof uri === "object" ? uri : opts;
      if (!o.transports || o.transports && typeof o.transports[0] === "string") {
        o.transports = (o.transports || ["polling", "websocket", "webtransport"]).map((transportName) => transports[transportName]).filter((t) => !!t);
      }
      super(uri, o);
    }
  };

  // node_modules/engine.io-client/build/esm/index.js
  var protocol2 = Socket.protocol;

  // node_modules/socket.io-client/build/esm/url.js
  function url(uri, path = "", loc) {
    let obj = uri;
    loc = loc || typeof location !== "undefined" && location;
    if (null == uri)
      uri = loc.protocol + "//" + loc.host;
    if (typeof uri === "string") {
      if ("/" === uri.charAt(0)) {
        if ("/" === uri.charAt(1)) {
          uri = loc.protocol + uri;
        } else {
          uri = loc.host + uri;
        }
      }
      if (!/^(https?|wss?):\/\//.test(uri)) {
        if ("undefined" !== typeof loc) {
          uri = loc.protocol + "//" + uri;
        } else {
          uri = "https://" + uri;
        }
      }
      obj = parse(uri);
    }
    if (!obj.port) {
      if (/^(http|ws)$/.test(obj.protocol)) {
        obj.port = "80";
      } else if (/^(http|ws)s$/.test(obj.protocol)) {
        obj.port = "443";
      }
    }
    obj.path = obj.path || "/";
    const ipv6 = obj.host.indexOf(":") !== -1;
    const host = ipv6 ? "[" + obj.host + "]" : obj.host;
    obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
    obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
    return obj;
  }

  // node_modules/socket.io-parser/build/esm/index.js
  var esm_exports = {};
  __export(esm_exports, {
    Decoder: () => Decoder,
    Encoder: () => Encoder,
    PacketType: () => PacketType,
    isPacketValid: () => isPacketValid,
    protocol: () => protocol3
  });

  // node_modules/socket.io-parser/build/esm/is-binary.js
  var withNativeArrayBuffer3 = typeof ArrayBuffer === "function";
  var isView2 = (obj) => {
    return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
  };
  var toString = Object.prototype.toString;
  var withNativeBlob2 = typeof Blob === "function" || typeof Blob !== "undefined" && toString.call(Blob) === "[object BlobConstructor]";
  var withNativeFile = typeof File === "function" || typeof File !== "undefined" && toString.call(File) === "[object FileConstructor]";
  function isBinary(obj) {
    return withNativeArrayBuffer3 && (obj instanceof ArrayBuffer || isView2(obj)) || withNativeBlob2 && obj instanceof Blob || withNativeFile && obj instanceof File;
  }
  function hasBinary(obj, toJSON) {
    if (!obj || typeof obj !== "object") {
      return false;
    }
    if (Array.isArray(obj)) {
      for (let i = 0, l = obj.length; i < l; i++) {
        if (hasBinary(obj[i])) {
          return true;
        }
      }
      return false;
    }
    if (isBinary(obj)) {
      return true;
    }
    if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
      return hasBinary(obj.toJSON(), true);
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
        return true;
      }
    }
    return false;
  }

  // node_modules/socket.io-parser/build/esm/binary.js
  function deconstructPacket(packet) {
    const buffers = [];
    const packetData = packet.data;
    const pack = packet;
    pack.data = _deconstructPacket(packetData, buffers);
    pack.attachments = buffers.length;
    return { packet: pack, buffers };
  }
  function _deconstructPacket(data, buffers) {
    if (!data)
      return data;
    if (isBinary(data)) {
      const placeholder = { _placeholder: true, num: buffers.length };
      buffers.push(data);
      return placeholder;
    } else if (Array.isArray(data)) {
      const newData = new Array(data.length);
      for (let i = 0; i < data.length; i++) {
        newData[i] = _deconstructPacket(data[i], buffers);
      }
      return newData;
    } else if (typeof data === "object" && !(data instanceof Date)) {
      const newData = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          newData[key] = _deconstructPacket(data[key], buffers);
        }
      }
      return newData;
    }
    return data;
  }
  function reconstructPacket(packet, buffers) {
    packet.data = _reconstructPacket(packet.data, buffers);
    delete packet.attachments;
    return packet;
  }
  function _reconstructPacket(data, buffers) {
    if (!data)
      return data;
    if (data && data._placeholder === true) {
      const isIndexValid = typeof data.num === "number" && data.num >= 0 && data.num < buffers.length;
      if (isIndexValid) {
        return buffers[data.num];
      } else {
        throw new Error("illegal attachments");
      }
    } else if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        data[i] = _reconstructPacket(data[i], buffers);
      }
    } else if (typeof data === "object") {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          data[key] = _reconstructPacket(data[key], buffers);
        }
      }
    }
    return data;
  }

  // node_modules/socket.io-parser/build/esm/index.js
  var RESERVED_EVENTS = [
    "connect",
    // used on the client side
    "connect_error",
    // used on the client side
    "disconnect",
    // used on both sides
    "disconnecting",
    // used on the server side
    "newListener",
    // used by the Node.js EventEmitter
    "removeListener"
    // used by the Node.js EventEmitter
  ];
  var protocol3 = 5;
  var PacketType;
  (function(PacketType2) {
    PacketType2[PacketType2["CONNECT"] = 0] = "CONNECT";
    PacketType2[PacketType2["DISCONNECT"] = 1] = "DISCONNECT";
    PacketType2[PacketType2["EVENT"] = 2] = "EVENT";
    PacketType2[PacketType2["ACK"] = 3] = "ACK";
    PacketType2[PacketType2["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
    PacketType2[PacketType2["BINARY_EVENT"] = 5] = "BINARY_EVENT";
    PacketType2[PacketType2["BINARY_ACK"] = 6] = "BINARY_ACK";
  })(PacketType || (PacketType = {}));
  var Encoder = class {
    /**
     * Encoder constructor
     *
     * @param {function} replacer - custom replacer to pass down to JSON.parse
     */
    constructor(replacer) {
      this.replacer = replacer;
    }
    /**
     * Encode a packet as a single string if non-binary, or as a
     * buffer sequence, depending on packet type.
     *
     * @param {Object} obj - packet object
     */
    encode(obj) {
      if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
        if (hasBinary(obj)) {
          return this.encodeAsBinary({
            type: obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK,
            nsp: obj.nsp,
            data: obj.data,
            id: obj.id
          });
        }
      }
      return [this.encodeAsString(obj)];
    }
    /**
     * Encode packet as string.
     */
    encodeAsString(obj) {
      let str = "" + obj.type;
      if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
        str += obj.attachments + "-";
      }
      if (obj.nsp && "/" !== obj.nsp) {
        str += obj.nsp + ",";
      }
      if (null != obj.id) {
        str += obj.id;
      }
      if (null != obj.data) {
        str += JSON.stringify(obj.data, this.replacer);
      }
      return str;
    }
    /**
     * Encode packet as 'buffer sequence' by removing blobs, and
     * deconstructing packet into object with placeholders and
     * a list of buffers.
     */
    encodeAsBinary(obj) {
      const deconstruction = deconstructPacket(obj);
      const pack = this.encodeAsString(deconstruction.packet);
      const buffers = deconstruction.buffers;
      buffers.unshift(pack);
      return buffers;
    }
  };
  var Decoder = class _Decoder extends Emitter {
    /**
     * Decoder constructor
     *
     * @param {function} reviver - custom reviver to pass down to JSON.stringify
     */
    constructor(reviver) {
      super();
      this.reviver = reviver;
    }
    /**
     * Decodes an encoded packet string into packet JSON.
     *
     * @param {String} obj - encoded packet
     */
    add(obj) {
      let packet;
      if (typeof obj === "string") {
        if (this.reconstructor) {
          throw new Error("got plaintext data when reconstructing a packet");
        }
        packet = this.decodeString(obj);
        const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
        if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
          packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
          this.reconstructor = new BinaryReconstructor(packet);
          if (packet.attachments === 0) {
            super.emitReserved("decoded", packet);
          }
        } else {
          super.emitReserved("decoded", packet);
        }
      } else if (isBinary(obj) || obj.base64) {
        if (!this.reconstructor) {
          throw new Error("got binary data when not reconstructing a packet");
        } else {
          packet = this.reconstructor.takeBinaryData(obj);
          if (packet) {
            this.reconstructor = null;
            super.emitReserved("decoded", packet);
          }
        }
      } else {
        throw new Error("Unknown type: " + obj);
      }
    }
    /**
     * Decode a packet String (JSON data)
     *
     * @param {String} str
     * @return {Object} packet
     */
    decodeString(str) {
      let i = 0;
      const p = {
        type: Number(str.charAt(0))
      };
      if (PacketType[p.type] === void 0) {
        throw new Error("unknown packet type " + p.type);
      }
      if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
        const start = i + 1;
        while (str.charAt(++i) !== "-" && i != str.length) {
        }
        const buf = str.substring(start, i);
        if (buf != Number(buf) || str.charAt(i) !== "-") {
          throw new Error("Illegal attachments");
        }
        p.attachments = Number(buf);
      }
      if ("/" === str.charAt(i + 1)) {
        const start = i + 1;
        while (++i) {
          const c = str.charAt(i);
          if ("," === c)
            break;
          if (i === str.length)
            break;
        }
        p.nsp = str.substring(start, i);
      } else {
        p.nsp = "/";
      }
      const next = str.charAt(i + 1);
      if ("" !== next && Number(next) == next) {
        const start = i + 1;
        while (++i) {
          const c = str.charAt(i);
          if (null == c || Number(c) != c) {
            --i;
            break;
          }
          if (i === str.length)
            break;
        }
        p.id = Number(str.substring(start, i + 1));
      }
      if (str.charAt(++i)) {
        const payload = this.tryParse(str.substr(i));
        if (_Decoder.isPayloadValid(p.type, payload)) {
          p.data = payload;
        } else {
          throw new Error("invalid payload");
        }
      }
      return p;
    }
    tryParse(str) {
      try {
        return JSON.parse(str, this.reviver);
      } catch (e) {
        return false;
      }
    }
    static isPayloadValid(type, payload) {
      switch (type) {
        case PacketType.CONNECT:
          return isObject(payload);
        case PacketType.DISCONNECT:
          return payload === void 0;
        case PacketType.CONNECT_ERROR:
          return typeof payload === "string" || isObject(payload);
        case PacketType.EVENT:
        case PacketType.BINARY_EVENT:
          return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
        case PacketType.ACK:
        case PacketType.BINARY_ACK:
          return Array.isArray(payload);
      }
    }
    /**
     * Deallocates a parser's resources
     */
    destroy() {
      if (this.reconstructor) {
        this.reconstructor.finishedReconstruction();
        this.reconstructor = null;
      }
    }
  };
  var BinaryReconstructor = class {
    constructor(packet) {
      this.packet = packet;
      this.buffers = [];
      this.reconPack = packet;
    }
    /**
     * Method to be called when binary data received from connection
     * after a BINARY_EVENT packet.
     *
     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
     * @return {null | Object} returns null if more binary data is expected or
     *   a reconstructed packet object if all buffers have been received.
     */
    takeBinaryData(binData) {
      this.buffers.push(binData);
      if (this.buffers.length === this.reconPack.attachments) {
        const packet = reconstructPacket(this.reconPack, this.buffers);
        this.finishedReconstruction();
        return packet;
      }
      return null;
    }
    /**
     * Cleans up binary packet reconstruction variables.
     */
    finishedReconstruction() {
      this.reconPack = null;
      this.buffers = [];
    }
  };
  function isNamespaceValid(nsp) {
    return typeof nsp === "string";
  }
  var isInteger = Number.isInteger || function(value2) {
    return typeof value2 === "number" && isFinite(value2) && Math.floor(value2) === value2;
  };
  function isAckIdValid(id) {
    return id === void 0 || isInteger(id);
  }
  function isObject(value2) {
    return Object.prototype.toString.call(value2) === "[object Object]";
  }
  function isDataValid(type, payload) {
    switch (type) {
      case PacketType.CONNECT:
        return payload === void 0 || isObject(payload);
      case PacketType.DISCONNECT:
        return payload === void 0;
      case PacketType.EVENT:
        return Array.isArray(payload) && (typeof payload[0] === "number" || typeof payload[0] === "string" && RESERVED_EVENTS.indexOf(payload[0]) === -1);
      case PacketType.ACK:
        return Array.isArray(payload);
      case PacketType.CONNECT_ERROR:
        return typeof payload === "string" || isObject(payload);
      default:
        return false;
    }
  }
  function isPacketValid(packet) {
    return isNamespaceValid(packet.nsp) && isAckIdValid(packet.id) && isDataValid(packet.type, packet.data);
  }

  // node_modules/socket.io-client/build/esm/on.js
  function on(obj, ev, fn) {
    obj.on(ev, fn);
    return function subDestroy() {
      obj.off(ev, fn);
    };
  }

  // node_modules/socket.io-client/build/esm/socket.js
  var RESERVED_EVENTS2 = Object.freeze({
    connect: 1,
    connect_error: 1,
    disconnect: 1,
    disconnecting: 1,
    // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
    newListener: 1,
    removeListener: 1
  });
  var Socket2 = class extends Emitter {
    /**
     * `Socket` constructor.
     */
    constructor(io, nsp, opts) {
      super();
      this.connected = false;
      this.recovered = false;
      this.receiveBuffer = [];
      this.sendBuffer = [];
      this._queue = [];
      this._queueSeq = 0;
      this.ids = 0;
      this.acks = {};
      this.flags = {};
      this.io = io;
      this.nsp = nsp;
      if (opts && opts.auth) {
        this.auth = opts.auth;
      }
      this._opts = Object.assign({}, opts);
      if (this.io._autoConnect)
        this.open();
    }
    /**
     * Whether the socket is currently disconnected
     *
     * @example
     * const socket = io();
     *
     * socket.on("connect", () => {
     *   console.log(socket.disconnected); // false
     * });
     *
     * socket.on("disconnect", () => {
     *   console.log(socket.disconnected); // true
     * });
     */
    get disconnected() {
      return !this.connected;
    }
    /**
     * Subscribe to open, close and packet events
     *
     * @private
     */
    subEvents() {
      if (this.subs)
        return;
      const io = this.io;
      this.subs = [
        on(io, "open", this.onopen.bind(this)),
        on(io, "packet", this.onpacket.bind(this)),
        on(io, "error", this.onerror.bind(this)),
        on(io, "close", this.onclose.bind(this))
      ];
    }
    /**
     * Whether the Socket will try to reconnect when its Manager connects or reconnects.
     *
     * @example
     * const socket = io();
     *
     * console.log(socket.active); // true
     *
     * socket.on("disconnect", (reason) => {
     *   if (reason === "io server disconnect") {
     *     // the disconnection was initiated by the server, you need to manually reconnect
     *     console.log(socket.active); // false
     *   }
     *   // else the socket will automatically try to reconnect
     *   console.log(socket.active); // true
     * });
     */
    get active() {
      return !!this.subs;
    }
    /**
     * "Opens" the socket.
     *
     * @example
     * const socket = io({
     *   autoConnect: false
     * });
     *
     * socket.connect();
     */
    connect() {
      if (this.connected)
        return this;
      this.subEvents();
      if (!this.io["_reconnecting"])
        this.io.open();
      if ("open" === this.io._readyState)
        this.onopen();
      return this;
    }
    /**
     * Alias for {@link connect()}.
     */
    open() {
      return this.connect();
    }
    /**
     * Sends a `message` event.
     *
     * This method mimics the WebSocket.send() method.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
     *
     * @example
     * socket.send("hello");
     *
     * // this is equivalent to
     * socket.emit("message", "hello");
     *
     * @return self
     */
    send(...args) {
      args.unshift("message");
      this.emit.apply(this, args);
      return this;
    }
    /**
     * Override `emit`.
     * If the event is in `events`, it's emitted normally.
     *
     * @example
     * socket.emit("hello", "world");
     *
     * // all serializable datastructures are supported (no need to call JSON.stringify)
     * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
     *
     * // with an acknowledgement from the server
     * socket.emit("hello", "world", (val) => {
     *   // ...
     * });
     *
     * @return self
     */
    emit(ev, ...args) {
      var _a, _b, _c;
      if (RESERVED_EVENTS2.hasOwnProperty(ev)) {
        throw new Error('"' + ev.toString() + '" is a reserved event name');
      }
      args.unshift(ev);
      if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
        this._addToQueue(args);
        return this;
      }
      const packet = {
        type: PacketType.EVENT,
        data: args
      };
      packet.options = {};
      packet.options.compress = this.flags.compress !== false;
      if ("function" === typeof args[args.length - 1]) {
        const id = this.ids++;
        const ack = args.pop();
        this._registerAckCallback(id, ack);
        packet.id = id;
      }
      const isTransportWritable = (_b = (_a = this.io.engine) === null || _a === void 0 ? void 0 : _a.transport) === null || _b === void 0 ? void 0 : _b.writable;
      const isConnected = this.connected && !((_c = this.io.engine) === null || _c === void 0 ? void 0 : _c._hasPingExpired());
      const discardPacket = this.flags.volatile && !isTransportWritable;
      if (discardPacket) {
      } else if (isConnected) {
        this.notifyOutgoingListeners(packet);
        this.packet(packet);
      } else {
        this.sendBuffer.push(packet);
      }
      this.flags = {};
      return this;
    }
    /**
     * @private
     */
    _registerAckCallback(id, ack) {
      var _a;
      const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
      if (timeout === void 0) {
        this.acks[id] = ack;
        return;
      }
      const timer = this.io.setTimeoutFn(() => {
        delete this.acks[id];
        for (let i = 0; i < this.sendBuffer.length; i++) {
          if (this.sendBuffer[i].id === id) {
            this.sendBuffer.splice(i, 1);
          }
        }
        ack.call(this, new Error("operation has timed out"));
      }, timeout);
      const fn = (...args) => {
        this.io.clearTimeoutFn(timer);
        ack.apply(this, args);
      };
      fn.withError = true;
      this.acks[id] = fn;
    }
    /**
     * Emits an event and waits for an acknowledgement
     *
     * @example
     * // without timeout
     * const response = await socket.emitWithAck("hello", "world");
     *
     * // with a specific timeout
     * try {
     *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
     * } catch (err) {
     *   // the server did not acknowledge the event in the given delay
     * }
     *
     * @return a Promise that will be fulfilled when the server acknowledges the event
     */
    emitWithAck(ev, ...args) {
      return new Promise((resolve, reject) => {
        const fn = (arg1, arg2) => {
          return arg1 ? reject(arg1) : resolve(arg2);
        };
        fn.withError = true;
        args.push(fn);
        this.emit(ev, ...args);
      });
    }
    /**
     * Add the packet to the queue.
     * @param args
     * @private
     */
    _addToQueue(args) {
      let ack;
      if (typeof args[args.length - 1] === "function") {
        ack = args.pop();
      }
      const packet = {
        id: this._queueSeq++,
        tryCount: 0,
        pending: false,
        args,
        flags: Object.assign({ fromQueue: true }, this.flags)
      };
      args.push((err, ...responseArgs) => {
        if (packet !== this._queue[0]) {
        }
        const hasError = err !== null;
        if (hasError) {
          if (packet.tryCount > this._opts.retries) {
            this._queue.shift();
            if (ack) {
              ack(err);
            }
          }
        } else {
          this._queue.shift();
          if (ack) {
            ack(null, ...responseArgs);
          }
        }
        packet.pending = false;
        return this._drainQueue();
      });
      this._queue.push(packet);
      this._drainQueue();
    }
    /**
     * Send the first packet of the queue, and wait for an acknowledgement from the server.
     * @param force - whether to resend a packet that has not been acknowledged yet
     *
     * @private
     */
    _drainQueue(force = false) {
      if (!this.connected || this._queue.length === 0) {
        return;
      }
      const packet = this._queue[0];
      if (packet.pending && !force) {
        return;
      }
      packet.pending = true;
      packet.tryCount++;
      this.flags = packet.flags;
      this.emit.apply(this, packet.args);
    }
    /**
     * Sends a packet.
     *
     * @param packet
     * @private
     */
    packet(packet) {
      packet.nsp = this.nsp;
      this.io._packet(packet);
    }
    /**
     * Called upon engine `open`.
     *
     * @private
     */
    onopen() {
      if (typeof this.auth == "function") {
        this.auth((data) => {
          this._sendConnectPacket(data);
        });
      } else {
        this._sendConnectPacket(this.auth);
      }
    }
    /**
     * Sends a CONNECT packet to initiate the Socket.IO session.
     *
     * @param data
     * @private
     */
    _sendConnectPacket(data) {
      this.packet({
        type: PacketType.CONNECT,
        data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data) : data
      });
    }
    /**
     * Called upon engine or manager `error`.
     *
     * @param err
     * @private
     */
    onerror(err) {
      if (!this.connected) {
        this.emitReserved("connect_error", err);
      }
    }
    /**
     * Called upon engine `close`.
     *
     * @param reason
     * @param description
     * @private
     */
    onclose(reason, description) {
      this.connected = false;
      delete this.id;
      this.emitReserved("disconnect", reason, description);
      this._clearAcks();
    }
    /**
     * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
     * the server.
     *
     * @private
     */
    _clearAcks() {
      Object.keys(this.acks).forEach((id) => {
        const isBuffered = this.sendBuffer.some((packet) => String(packet.id) === id);
        if (!isBuffered) {
          const ack = this.acks[id];
          delete this.acks[id];
          if (ack.withError) {
            ack.call(this, new Error("socket has been disconnected"));
          }
        }
      });
    }
    /**
     * Called with socket packet.
     *
     * @param packet
     * @private
     */
    onpacket(packet) {
      const sameNamespace = packet.nsp === this.nsp;
      if (!sameNamespace)
        return;
      switch (packet.type) {
        case PacketType.CONNECT:
          if (packet.data && packet.data.sid) {
            this.onconnect(packet.data.sid, packet.data.pid);
          } else {
            this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          }
          break;
        case PacketType.EVENT:
        case PacketType.BINARY_EVENT:
          this.onevent(packet);
          break;
        case PacketType.ACK:
        case PacketType.BINARY_ACK:
          this.onack(packet);
          break;
        case PacketType.DISCONNECT:
          this.ondisconnect();
          break;
        case PacketType.CONNECT_ERROR:
          this.destroy();
          const err = new Error(packet.data.message);
          err.data = packet.data.data;
          this.emitReserved("connect_error", err);
          break;
      }
    }
    /**
     * Called upon a server event.
     *
     * @param packet
     * @private
     */
    onevent(packet) {
      const args = packet.data || [];
      if (null != packet.id) {
        args.push(this.ack(packet.id));
      }
      if (this.connected) {
        this.emitEvent(args);
      } else {
        this.receiveBuffer.push(Object.freeze(args));
      }
    }
    emitEvent(args) {
      if (this._anyListeners && this._anyListeners.length) {
        const listeners = this._anyListeners.slice();
        for (const listener of listeners) {
          listener.apply(this, args);
        }
      }
      super.emit.apply(this, args);
      if (this._pid && args.length && typeof args[args.length - 1] === "string") {
        this._lastOffset = args[args.length - 1];
      }
    }
    /**
     * Produces an ack callback to emit with an event.
     *
     * @private
     */
    ack(id) {
      const self2 = this;
      let sent = false;
      return function(...args) {
        if (sent)
          return;
        sent = true;
        self2.packet({
          type: PacketType.ACK,
          id,
          data: args
        });
      };
    }
    /**
     * Called upon a server acknowledgement.
     *
     * @param packet
     * @private
     */
    onack(packet) {
      const ack = this.acks[packet.id];
      if (typeof ack !== "function") {
        return;
      }
      delete this.acks[packet.id];
      if (ack.withError) {
        packet.data.unshift(null);
      }
      ack.apply(this, packet.data);
    }
    /**
     * Called upon server connect.
     *
     * @private
     */
    onconnect(id, pid) {
      this.id = id;
      this.recovered = pid && this._pid === pid;
      this._pid = pid;
      this.connected = true;
      this.emitBuffered();
      this._drainQueue(true);
      this.emitReserved("connect");
    }
    /**
     * Emit buffered events (received and emitted).
     *
     * @private
     */
    emitBuffered() {
      this.receiveBuffer.forEach((args) => this.emitEvent(args));
      this.receiveBuffer = [];
      this.sendBuffer.forEach((packet) => {
        this.notifyOutgoingListeners(packet);
        this.packet(packet);
      });
      this.sendBuffer = [];
    }
    /**
     * Called upon server disconnect.
     *
     * @private
     */
    ondisconnect() {
      this.destroy();
      this.onclose("io server disconnect");
    }
    /**
     * Called upon forced client/server side disconnections,
     * this method ensures the manager stops tracking us and
     * that reconnections don't get triggered for this.
     *
     * @private
     */
    destroy() {
      if (this.subs) {
        this.subs.forEach((subDestroy) => subDestroy());
        this.subs = void 0;
      }
      this.io["_destroy"](this);
    }
    /**
     * Disconnects the socket manually. In that case, the socket will not try to reconnect.
     *
     * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
     *
     * @example
     * const socket = io();
     *
     * socket.on("disconnect", (reason) => {
     *   // console.log(reason); prints "io client disconnect"
     * });
     *
     * socket.disconnect();
     *
     * @return self
     */
    disconnect() {
      if (this.connected) {
        this.packet({ type: PacketType.DISCONNECT });
      }
      this.destroy();
      if (this.connected) {
        this.onclose("io client disconnect");
      }
      return this;
    }
    /**
     * Alias for {@link disconnect()}.
     *
     * @return self
     */
    close() {
      return this.disconnect();
    }
    /**
     * Sets the compress flag.
     *
     * @example
     * socket.compress(false).emit("hello");
     *
     * @param compress - if `true`, compresses the sending data
     * @return self
     */
    compress(compress) {
      this.flags.compress = compress;
      return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
     * ready to send messages.
     *
     * @example
     * socket.volatile.emit("hello"); // the server may or may not receive it
     *
     * @returns self
     */
    get volatile() {
      this.flags.volatile = true;
      return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
     * given number of milliseconds have elapsed without an acknowledgement from the server:
     *
     * @example
     * socket.timeout(5000).emit("my-event", (err) => {
     *   if (err) {
     *     // the server did not acknowledge the event in the given delay
     *   }
     * });
     *
     * @returns self
     */
    timeout(timeout) {
      this.flags.timeout = timeout;
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * @example
     * socket.onAny((event, ...args) => {
     *   console.log(`got ${event}`);
     * });
     *
     * @param listener
     */
    onAny(listener) {
      this._anyListeners = this._anyListeners || [];
      this._anyListeners.push(listener);
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * @example
     * socket.prependAny((event, ...args) => {
     *   console.log(`got event ${event}`);
     * });
     *
     * @param listener
     */
    prependAny(listener) {
      this._anyListeners = this._anyListeners || [];
      this._anyListeners.unshift(listener);
      return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`got event ${event}`);
     * }
     *
     * socket.onAny(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAny(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAny();
     *
     * @param listener
     */
    offAny(listener) {
      if (!this._anyListeners) {
        return this;
      }
      if (listener) {
        const listeners = this._anyListeners;
        for (let i = 0; i < listeners.length; i++) {
          if (listener === listeners[i]) {
            listeners.splice(i, 1);
            return this;
          }
        }
      } else {
        this._anyListeners = [];
      }
      return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAny() {
      return this._anyListeners || [];
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.onAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    onAnyOutgoing(listener) {
      this._anyOutgoingListeners = this._anyOutgoingListeners || [];
      this._anyOutgoingListeners.push(listener);
      return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.prependAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    prependAnyOutgoing(listener) {
      this._anyOutgoingListeners = this._anyOutgoingListeners || [];
      this._anyOutgoingListeners.unshift(listener);
      return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`sent event ${event}`);
     * }
     *
     * socket.onAnyOutgoing(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAnyOutgoing(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAnyOutgoing();
     *
     * @param [listener] - the catch-all listener (optional)
     */
    offAnyOutgoing(listener) {
      if (!this._anyOutgoingListeners) {
        return this;
      }
      if (listener) {
        const listeners = this._anyOutgoingListeners;
        for (let i = 0; i < listeners.length; i++) {
          if (listener === listeners[i]) {
            listeners.splice(i, 1);
            return this;
          }
        }
      } else {
        this._anyOutgoingListeners = [];
      }
      return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAnyOutgoing() {
      return this._anyOutgoingListeners || [];
    }
    /**
     * Notify the listeners for each packet sent
     *
     * @param packet
     *
     * @private
     */
    notifyOutgoingListeners(packet) {
      if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
        const listeners = this._anyOutgoingListeners.slice();
        for (const listener of listeners) {
          listener.apply(this, packet.data);
        }
      }
    }
  };

  // node_modules/socket.io-client/build/esm/contrib/backo2.js
  function Backoff(opts) {
    opts = opts || {};
    this.ms = opts.min || 100;
    this.max = opts.max || 1e4;
    this.factor = opts.factor || 2;
    this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
    this.attempts = 0;
  }
  Backoff.prototype.duration = function() {
    var ms = this.ms * Math.pow(this.factor, this.attempts++);
    if (this.jitter) {
      var rand = Math.random();
      var deviation = Math.floor(rand * this.jitter * ms);
      ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
    }
    return Math.min(ms, this.max) | 0;
  };
  Backoff.prototype.reset = function() {
    this.attempts = 0;
  };
  Backoff.prototype.setMin = function(min) {
    this.ms = min;
  };
  Backoff.prototype.setMax = function(max) {
    this.max = max;
  };
  Backoff.prototype.setJitter = function(jitter) {
    this.jitter = jitter;
  };

  // node_modules/socket.io-client/build/esm/manager.js
  var Manager = class extends Emitter {
    constructor(uri, opts) {
      var _a;
      super();
      this.nsps = {};
      this.subs = [];
      if (uri && "object" === typeof uri) {
        opts = uri;
        uri = void 0;
      }
      opts = opts || {};
      opts.path = opts.path || "/socket.io";
      this.opts = opts;
      installTimerFunctions(this, opts);
      this.reconnection(opts.reconnection !== false);
      this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
      this.reconnectionDelay(opts.reconnectionDelay || 1e3);
      this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);
      this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
      this.backoff = new Backoff({
        min: this.reconnectionDelay(),
        max: this.reconnectionDelayMax(),
        jitter: this.randomizationFactor()
      });
      this.timeout(null == opts.timeout ? 2e4 : opts.timeout);
      this._readyState = "closed";
      this.uri = uri;
      const _parser = opts.parser || esm_exports;
      this.encoder = new _parser.Encoder();
      this.decoder = new _parser.Decoder();
      this._autoConnect = opts.autoConnect !== false;
      if (this._autoConnect)
        this.open();
    }
    reconnection(v) {
      if (!arguments.length)
        return this._reconnection;
      this._reconnection = !!v;
      if (!v) {
        this.skipReconnect = true;
      }
      return this;
    }
    reconnectionAttempts(v) {
      if (v === void 0)
        return this._reconnectionAttempts;
      this._reconnectionAttempts = v;
      return this;
    }
    reconnectionDelay(v) {
      var _a;
      if (v === void 0)
        return this._reconnectionDelay;
      this._reconnectionDelay = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
      return this;
    }
    randomizationFactor(v) {
      var _a;
      if (v === void 0)
        return this._randomizationFactor;
      this._randomizationFactor = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
      return this;
    }
    reconnectionDelayMax(v) {
      var _a;
      if (v === void 0)
        return this._reconnectionDelayMax;
      this._reconnectionDelayMax = v;
      (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
      return this;
    }
    timeout(v) {
      if (!arguments.length)
        return this._timeout;
      this._timeout = v;
      return this;
    }
    /**
     * Starts trying to reconnect if reconnection is enabled and we have not
     * started reconnecting yet
     *
     * @private
     */
    maybeReconnectOnOpen() {
      if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
        this.reconnect();
      }
    }
    /**
     * Sets the current transport `socket`.
     *
     * @param {Function} fn - optional, callback
     * @return self
     * @public
     */
    open(fn) {
      if (~this._readyState.indexOf("open"))
        return this;
      this.engine = new Socket(this.uri, this.opts);
      const socket = this.engine;
      const self2 = this;
      this._readyState = "opening";
      this.skipReconnect = false;
      const openSubDestroy = on(socket, "open", function() {
        self2.onopen();
        fn && fn();
      });
      const onError = (err) => {
        this.cleanup();
        this._readyState = "closed";
        this.emitReserved("error", err);
        if (fn) {
          fn(err);
        } else {
          this.maybeReconnectOnOpen();
        }
      };
      const errorSub = on(socket, "error", onError);
      if (false !== this._timeout) {
        const timeout = this._timeout;
        const timer = this.setTimeoutFn(() => {
          openSubDestroy();
          onError(new Error("timeout"));
          socket.close();
        }, timeout);
        if (this.opts.autoUnref) {
          timer.unref();
        }
        this.subs.push(() => {
          this.clearTimeoutFn(timer);
        });
      }
      this.subs.push(openSubDestroy);
      this.subs.push(errorSub);
      return this;
    }
    /**
     * Alias for open()
     *
     * @return self
     * @public
     */
    connect(fn) {
      return this.open(fn);
    }
    /**
     * Called upon transport open.
     *
     * @private
     */
    onopen() {
      this.cleanup();
      this._readyState = "open";
      this.emitReserved("open");
      const socket = this.engine;
      this.subs.push(
        on(socket, "ping", this.onping.bind(this)),
        on(socket, "data", this.ondata.bind(this)),
        on(socket, "error", this.onerror.bind(this)),
        on(socket, "close", this.onclose.bind(this)),
        // @ts-ignore
        on(this.decoder, "decoded", this.ondecoded.bind(this))
      );
    }
    /**
     * Called upon a ping.
     *
     * @private
     */
    onping() {
      this.emitReserved("ping");
    }
    /**
     * Called with data.
     *
     * @private
     */
    ondata(data) {
      try {
        this.decoder.add(data);
      } catch (e) {
        this.onclose("parse error", e);
      }
    }
    /**
     * Called when parser fully decodes a packet.
     *
     * @private
     */
    ondecoded(packet) {
      nextTick(() => {
        this.emitReserved("packet", packet);
      }, this.setTimeoutFn);
    }
    /**
     * Called upon socket error.
     *
     * @private
     */
    onerror(err) {
      this.emitReserved("error", err);
    }
    /**
     * Creates a new socket for the given `nsp`.
     *
     * @return {Socket}
     * @public
     */
    socket(nsp, opts) {
      let socket = this.nsps[nsp];
      if (!socket) {
        socket = new Socket2(this, nsp, opts);
        this.nsps[nsp] = socket;
      } else if (this._autoConnect && !socket.active) {
        socket.connect();
      }
      return socket;
    }
    /**
     * Called upon a socket close.
     *
     * @param socket
     * @private
     */
    _destroy(socket) {
      const nsps = Object.keys(this.nsps);
      for (const nsp of nsps) {
        const socket2 = this.nsps[nsp];
        if (socket2.active) {
          return;
        }
      }
      this._close();
    }
    /**
     * Writes a packet.
     *
     * @param packet
     * @private
     */
    _packet(packet) {
      const encodedPackets = this.encoder.encode(packet);
      for (let i = 0; i < encodedPackets.length; i++) {
        this.engine.write(encodedPackets[i], packet.options);
      }
    }
    /**
     * Clean up transport subscriptions and packet buffer.
     *
     * @private
     */
    cleanup() {
      this.subs.forEach((subDestroy) => subDestroy());
      this.subs.length = 0;
      this.decoder.destroy();
    }
    /**
     * Close the current socket.
     *
     * @private
     */
    _close() {
      this.skipReconnect = true;
      this._reconnecting = false;
      this.onclose("forced close");
    }
    /**
     * Alias for close()
     *
     * @private
     */
    disconnect() {
      return this._close();
    }
    /**
     * Called when:
     *
     * - the low-level engine is closed
     * - the parser encountered a badly formatted packet
     * - all sockets are disconnected
     *
     * @private
     */
    onclose(reason, description) {
      var _a;
      this.cleanup();
      (_a = this.engine) === null || _a === void 0 ? void 0 : _a.close();
      this.backoff.reset();
      this._readyState = "closed";
      this.emitReserved("close", reason, description);
      if (this._reconnection && !this.skipReconnect) {
        this.reconnect();
      }
    }
    /**
     * Attempt a reconnection.
     *
     * @private
     */
    reconnect() {
      if (this._reconnecting || this.skipReconnect)
        return this;
      const self2 = this;
      if (this.backoff.attempts >= this._reconnectionAttempts) {
        this.backoff.reset();
        this.emitReserved("reconnect_failed");
        this._reconnecting = false;
      } else {
        const delay = this.backoff.duration();
        this._reconnecting = true;
        const timer = this.setTimeoutFn(() => {
          if (self2.skipReconnect)
            return;
          this.emitReserved("reconnect_attempt", self2.backoff.attempts);
          if (self2.skipReconnect)
            return;
          self2.open((err) => {
            if (err) {
              self2._reconnecting = false;
              self2.reconnect();
              this.emitReserved("reconnect_error", err);
            } else {
              self2.onreconnect();
            }
          });
        }, delay);
        if (this.opts.autoUnref) {
          timer.unref();
        }
        this.subs.push(() => {
          this.clearTimeoutFn(timer);
        });
      }
    }
    /**
     * Called upon successful reconnect.
     *
     * @private
     */
    onreconnect() {
      const attempt = this.backoff.attempts;
      this._reconnecting = false;
      this.backoff.reset();
      this.emitReserved("reconnect", attempt);
    }
  };

  // node_modules/socket.io-client/build/esm/index.js
  var cache = {};
  function lookup2(uri, opts) {
    if (typeof uri === "object") {
      opts = uri;
      uri = void 0;
    }
    opts = opts || {};
    const parsed = url(uri, opts.path || "/socket.io");
    const source = parsed.source;
    const id = parsed.id;
    const path = parsed.path;
    const sameNamespace = cache[id] && path in cache[id]["nsps"];
    const newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
    let io;
    if (newConnection) {
      io = new Manager(source, opts);
    } else {
      if (!cache[id]) {
        cache[id] = new Manager(source, opts);
      }
      io = cache[id];
    }
    if (parsed.query && !opts.query) {
      opts.query = parsed.queryKey;
    }
    return io.socket(parsed.path, opts);
  }
  Object.assign(lookup2, {
    Manager,
    Socket: Socket2,
    io: lookup2,
    connect: lookup2
  });

  // src/services/runtime.service.ts
  var VehicleRuntimeService = class {
    constructor(websocketUrl = "https://kit.digitalauto.tech", kitId) {
      this.websocketUrl = websocketUrl;
      this.kitId = kitId;
      if (websocketUrl.startsWith("ws://") || websocketUrl.startsWith("wss://")) {
        this.websocketUrl = websocketUrl.replace(/^wss?:\/\//, "https://");
      }
    }
    socket = null;
    isConnected = false;
    messageHandlers = /* @__PURE__ */ new Map();
    pendingRequests = /* @__PURE__ */ new Map();
    // Set the target kit ID
    setKitId(kitId) {
      this.kitId = kitId;
      console.log("[VehicleRuntime] Target kit ID set to:", kitId);
    }
    async connect() {
      if (this.isConnected || this.socket && this.socket.connected) {
        return;
      }
      return new Promise((resolve, reject) => {
        try {
          console.log("[VehicleRuntime] Connecting to Socket.IO:", this.websocketUrl);
          this.socket = lookup2(this.websocketUrl, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1e3
          });
          const connectionTimeout = setTimeout(() => {
            reject(new Error("Connection timeout"));
          }, 1e4);
          this.socket.on("connect", () => {
            clearTimeout(connectionTimeout);
            this.isConnected = true;
            this.setupEventHandlers();
            console.log("[VehicleRuntime] \u2705 Connected to Kit Manager");
            resolve();
          });
          this.socket.on("connect_error", (error) => {
            clearTimeout(connectionTimeout);
            console.error("[VehicleRuntime] Socket.IO connection error:", error);
            reject(new Error("Socket.IO connection failed: " + error.message));
          });
          this.socket.on("disconnect", () => {
            console.log("[VehicleRuntime] Socket.IO disconnected");
            this.isConnected = false;
          });
        } catch (error) {
          reject(error);
        }
      });
    }
    disconnect() {
      this.isConnected = false;
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      this.pendingRequests.forEach((request) => {
        clearTimeout(request.timeout);
        request.reject(new Error("Connection closed"));
      });
      this.pendingRequests.clear();
      console.log("[VehicleRuntime] Disconnected");
    }
    setupEventHandlers() {
      if (!this.socket)
        return;
      this.socket.on("messageToKit-kitReply", (message) => {
        this.handleMessage(message);
      });
      this.socket.on("broadcastToClient", (message) => {
        this.handleMessage(message);
      });
      console.log("[VehicleRuntime] Event handlers registered");
    }
    handleMessage(message) {
      if (message.id && this.pendingRequests.has(message.id)) {
        const request = this.pendingRequests.get(message.id);
        clearTimeout(request.timeout);
        this.pendingRequests.delete(message.id);
        if (message.type === "error" || message.error) {
          request.reject(new Error(message.error || "Unknown error"));
        } else {
          request.resolve(message);
        }
        return;
      }
      if (message.type) {
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message);
        }
      }
    }
    sendCommand(cmd, data = {}) {
      if (!this.isConnected || !this.socket) {
        return Promise.reject(new Error("Not connected to Kit Manager"));
      }
      if (!this.kitId) {
        return Promise.reject(new Error("No kit ID set. Call setKitId() first."));
      }
      const messageId = "msg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(messageId);
          reject(new Error("Request timeout"));
        }, 15e3);
        this.pendingRequests.set(messageId, { resolve, reject, timeout });
        const message = {
          id: messageId,
          cmd,
          to_kit_id: this.kitId,
          ...data
          // Spread data fields directly, not wrapped
        };
        console.log("[VehicleRuntime] Sending command:", cmd, "to kit:", this.kitId);
        console.log("[VehicleRuntime] Message:", message);
        try {
          this.socket.emit("messageToKit", message);
        } catch (error) {
          clearTimeout(timeout);
          this.pendingRequests.delete(messageId);
          reject(error);
        }
      });
    }
    // Application management methods
    async deployPythonApp(config) {
      const data = {
        code: config.code,
        prototype: {
          id: config.name,
          name: config.displayName || config.name,
          description: `Python application: ${config.name}`,
          version: "1.0.0"
        },
        language: "python",
        vehicleId: "default-vehicle",
        dependencies: config.dependencies || []
      };
      const response = await this.sendCommand("deploy_request", data);
      if (response.status === "started" || response.result === "success") {
        return response.appId || response.executionId || response.app_id || config.name;
      } else {
        throw new Error(response.result || response.message || "Deployment failed");
      }
    }
    async getDeployedApps() {
      const response = await this.sendCommand("get-runtime-info", {});
      if (response.lsOfRunner && Array.isArray(response.lsOfRunner)) {
        return {
          applications: response.lsOfRunner.map((app) => ({
            app_id: app.app_id || app.appId || app.name,
            name: app.name || app.app_name || "Unknown",
            status: app.status || "unknown",
            type: app.type || "python",
            deploy_time: app.deploy_time || app.startTime || (/* @__PURE__ */ new Date()).toISOString()
          }))
        };
      }
      return { applications: [] };
    }
    async startApp(appId) {
      return this.sendCommand("run_python_app", { appId });
    }
    async stopApp(appId) {
      return this.sendCommand("stop_python_app", {});
    }
    async pauseApp(appId) {
      return this.sendCommand("pause_app", { appId });
    }
    async resumeApp(appId) {
      return this.sendCommand("resume_app", { appId });
    }
    async uninstallApp(appId) {
      return this.sendCommand("uninstall_app", { appId });
    }
    async getRuntimeState() {
      return this.sendCommand("get-runtime-info", {});
    }
    // Console subscription methods
    async subscribeConsole(appId) {
      await this.sendCommand("console_subscribe", { appId });
    }
    async unsubscribeConsole(appId) {
      await this.sendCommand("console_unsubscribe", { appId });
    }
    async getAppOutput(appId, lines = 100) {
      return this.sendCommand("app_output", { appId, lines });
    }
    // Event listeners
    onConsoleOutput(callback) {
      this.messageHandlers.set("console_output", callback);
    }
    onAppStatus(callback) {
      this.messageHandlers.set("app_status_update", callback);
    }
    onDeployedAppsList(callback) {
      this.messageHandlers.set("list_deployed_apps-response", callback);
    }
    // Connection status
    isServiceConnected() {
      return this.isConnected;
    }
    removeAllListeners() {
      this.messageHandlers.clear();
    }
    // Service deployment methods
    async deployKuksaServer() {
      const data = {
        prototype: {
          id: "VEA-kuksa-databroker",
          name: "KUKSA Databroker",
          type: "docker",
          description: "Eclipse KUKSA Vehicle Signal Databroker",
          config: {
            dockerCommand: [
              "run",
              "-d",
              "--name",
              "VEA-kuksa-databroker",
              "--network",
              "host",
              "-p",
              "55555:55555",
              "-p",
              "8090:8090",
              "ghcr.io/eclipse-kuksa/kuksa-databroker:0.4.4",
              "--insecure"
            ]
          }
        },
        vehicle_id: "default-vehicle"
      };
      const response = await this.sendCommand("deploy_request", data);
      const isSuccess = !response || typeof response === "object" && !response.error && response.type !== "error";
      if (isSuccess) {
        return response?.executionId || response?.id || "VEA-kuksa-databroker";
      } else {
        throw new Error(response?.error || response?.result || "KUKSA deployment failed");
      }
    }
    async deployMockService(mode = "echo-all", signals) {
      const data = { mode, ...signals && { signals } };
      const response = await this.sendCommand("mock_service_start", data);
      const isSuccess = !response || response.success === true || typeof response === "object" && !response.error && response.type !== "error";
      if (isSuccess) {
        return response?.status?.appId || response?.id || "VEA-mock-service";
      } else {
        throw new Error(response?.error || response?.message || "Mock service deployment failed");
      }
    }
  };

  // src/services/kitManager.service.ts
  var KitManagerService = class {
    baseUrl;
    constructor(baseUrl = "https://kit.digitalauto.tech") {
      this.baseUrl = baseUrl;
    }
    getBaseUrl() {
      return this.baseUrl;
    }
    async listKits() {
      try {
        const response = await fetch(`${this.baseUrl}/listAllKits`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("[KitManager] Failed to fetch kits:", error);
        throw error;
      }
    }
    async convertCode(code) {
      try {
        const response = await fetch(`${this.baseUrl}/convertCode`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ code })
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("[KitManager] Failed to convert code:", error);
        throw error;
      }
    }
  };

  // src/hooks/useVehicleRuntimeState.ts
  function useVehicleRuntimeState(websocketUrl, kitManagerUrl) {
    const [isRuntimeConnected, setIsRuntimeConnected] = (0, import_react.useState)(false);
    const [isKitManagerConnected, setIsKitManagerConnected] = (0, import_react.useState)(false);
    const [isKitManagerLoading, setIsKitManagerLoading] = (0, import_react.useState)(false);
    const [kitManagerError, setKitManagerError] = (0, import_react.useState)(null);
    const [kits, setKits] = (0, import_react.useState)([]);
    const [selectedKit, setSelectedKit] = (0, import_react.useState)(null);
    const [vehicleApps, setVehicleApps] = (0, import_react.useState)([]);
    const [isRefreshingApps, setIsRefreshingApps] = (0, import_react.useState)(false);
    const [appConsoleOutputs, setAppConsoleOutputs] = (0, import_react.useState)({});
    const [isDeployingKuksa, setIsDeployingKuksa] = (0, import_react.useState)(false);
    const [isDeployingMock, setIsDeployingMock] = (0, import_react.useState)(false);
    const [connectionError, setConnectionError] = (0, import_react.useState)(null);
    const runtimeServiceRef = (0, import_react.useRef)(null);
    const kitManagerServiceRef = (0, import_react.useRef)(null);
    (0, import_react.useEffect)(() => {
      runtimeServiceRef.current = new VehicleRuntimeService(websocketUrl);
      kitManagerServiceRef.current = new KitManagerService(kitManagerUrl);
      return () => {
        runtimeServiceRef.current?.disconnect();
      };
    }, [websocketUrl, kitManagerUrl]);
    const connectRuntime = (0, import_react.useCallback)(async () => {
      try {
        setConnectionError(null);
        console.log("[VehicleRuntime] Connecting to WebSocket:", websocketUrl);
        await runtimeServiceRef.current?.connect();
        setIsRuntimeConnected(true);
        console.log("[VehicleRuntime] \u2705 Connected via Kit Manager proxy");
        const runtime = runtimeServiceRef.current;
        if (!runtime)
          return;
        runtime.onAppStatus((message) => {
          console.log("[VehicleRuntime] App status update:", message);
          setVehicleApps((prev) => prev.map(
            (app) => app.app_id === message.appId ? { ...app, status: message.currentStatus } : app
          ));
        });
        runtime.onDeployedAppsList((message) => {
          console.log("[VehicleRuntime] Deployed apps list:", message);
          const appsArray = Array.isArray(message?.applications) ? message.applications : [];
          setVehicleApps(appsArray);
        });
        runtime.onConsoleOutput((message) => {
          console.log("[VehicleRuntime] Console output:", message);
          const appId = message.executionId || message.appId;
          if (appId && message.output) {
            setAppConsoleOutputs((prev) => ({
              ...prev,
              [appId]: [
                ...prev[appId] || [],
                {
                  stream: message.stream || "stdout",
                  content: message.output,
                  timestamp: message.timestamp || (/* @__PURE__ */ new Date()).toISOString()
                }
              ].slice(-500)
              // Keep last 500 lines per app
            }));
          }
        });
      } catch (error) {
        console.warn("[VehicleRuntime] WebSocket connection failed (Kit Manager proxy may not have /runtime endpoint):", error);
        setIsRuntimeConnected(false);
      }
    }, [websocketUrl]);
    const connectKitManager = (0, import_react.useCallback)(async () => {
      setIsKitManagerLoading(true);
      setKitManagerError(null);
      try {
        const kitManager = kitManagerServiceRef.current;
        if (!kitManager) {
          setKitManagerError("Kit Manager service not initialized");
          setIsKitManagerConnected(false);
          setIsKitManagerLoading(false);
          return;
        }
        console.log("[KitManager] Connecting to", kitManager.getBaseUrl());
        const response = await kitManager.listKits();
        const kitsList = response.content || [];
        setKits(kitsList);
        setIsKitManagerConnected(true);
        setKitManagerError(null);
        const onlineEdgeRuntimeKits = kitsList.filter((k) => k.is_online && k.name.includes("Edge-Runtime"));
        if (onlineEdgeRuntimeKits.length > 0 && !selectedKit) {
          const kit = onlineEdgeRuntimeKits[0];
          setSelectedKit(kit);
          runtimeServiceRef.current?.setKitId(kit.kit_id);
          console.log("[KitManager] Auto-selected kit:", kit.name, "kit_id:", kit.kit_id);
        }
        console.log("[KitManager] \u2705 Connected - Loaded", kitsList.length, "kits", `(${onlineEdgeRuntimeKits.length} Edge-Runtime online)`);
      } catch (error) {
        console.error("[KitManager] \u274C Connection failed:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to connect to Kit Manager";
        setKitManagerError(errorMsg);
        setIsKitManagerConnected(false);
      } finally {
        setIsKitManagerLoading(false);
      }
    }, [selectedKit]);
    const refreshApps = (0, import_react.useCallback)(async () => {
      if (!isRuntimeConnected || !runtimeServiceRef.current?.isServiceConnected()) {
        console.warn("[VehicleRuntime] Not connected, skipping refresh");
        return;
      }
      setIsRefreshingApps(true);
      try {
        const response = await runtimeServiceRef.current.getDeployedApps();
        const appsArray = Array.isArray(response?.applications) ? response.applications : [];
        setVehicleApps(appsArray);
        console.log("[VehicleRuntime] Refreshed", appsArray.length, "apps");
      } catch (error) {
        console.error("[VehicleRuntime] Failed to refresh apps:", error);
        setConnectionError(error instanceof Error ? error.message : "Failed to refresh apps");
      } finally {
        setIsRefreshingApps(false);
      }
    }, [isRuntimeConnected]);
    const selectKit = (0, import_react.useCallback)((kit) => {
      setSelectedKit(kit);
      runtimeServiceRef.current?.setKitId(kit.kit_id);
      console.log("[KitManager] Selected kit:", kit.name, "kit_id:", kit.kit_id, "online:", kit.is_online);
    }, []);
    (0, import_react.useEffect)(() => {
      if (!isRuntimeConnected)
        return;
      refreshApps();
      const interval = setInterval(() => {
        refreshApps();
      }, 1e4);
      return () => clearInterval(interval);
    }, [isRuntimeConnected, selectedKit]);
    const startApp = (0, import_react.useCallback)(async (appId) => {
      if (!isRuntimeConnected || !runtimeServiceRef.current?.isServiceConnected()) {
        throw new Error("Not connected to Vehicle Runtime");
      }
      try {
        await runtimeServiceRef.current.startApp(appId);
        await refreshApps();
      } catch (error) {
        console.error("[VehicleRuntime] Failed to start app:", error);
        throw error;
      }
    }, [isRuntimeConnected, refreshApps]);
    const stopApp = (0, import_react.useCallback)(async (appId) => {
      if (!isRuntimeConnected || !runtimeServiceRef.current?.isServiceConnected()) {
        throw new Error("Not connected to Vehicle Runtime");
      }
      try {
        await runtimeServiceRef.current.stopApp(appId);
        await refreshApps();
      } catch (error) {
        console.error("[VehicleRuntime] Failed to stop app:", error);
        throw error;
      }
    }, [isRuntimeConnected, refreshApps]);
    const uninstallApp = (0, import_react.useCallback)(async (appId) => {
      if (!isRuntimeConnected || !runtimeServiceRef.current?.isServiceConnected()) {
        throw new Error("Not connected to Vehicle Runtime");
      }
      try {
        await runtimeServiceRef.current.uninstallApp(appId);
        await refreshApps();
      } catch (error) {
        console.error("[VehicleRuntime] Failed to uninstall app:", error);
        throw error;
      }
    }, [isRuntimeConnected, refreshApps]);
    const deployApp = (0, import_react.useCallback)(async (config) => {
      if (!isRuntimeConnected || !runtimeServiceRef.current?.isServiceConnected()) {
        throw new Error("Not connected to Vehicle Runtime");
      }
      try {
        const appId = await runtimeServiceRef.current.deployPythonApp(config);
        await refreshApps();
        return appId || "unknown";
      } catch (error) {
        console.error("[VehicleRuntime] Failed to deploy app:", error);
        throw error;
      }
    }, [isRuntimeConnected, refreshApps]);
    const deployKuksa = (0, import_react.useCallback)(async () => {
      setIsDeployingKuksa(true);
      try {
        const appId = await runtimeServiceRef.current?.deployKuksaServer();
        await refreshApps();
        return appId || "VEA-kuksa-databroker";
      } catch (error) {
        console.error("[VehicleRuntime] Failed to deploy KUKSA:", error);
        throw error;
      } finally {
        setIsDeployingKuksa(false);
      }
    }, [refreshApps]);
    const deployMock = (0, import_react.useCallback)(async (mode = "echo-all", signals) => {
      setIsDeployingMock(true);
      try {
        const appId = await runtimeServiceRef.current?.deployMockService(mode, signals);
        await refreshApps();
        return appId || "VEA-mock-service";
      } catch (error) {
        console.error("[VehicleRuntime] Failed to deploy Mock service:", error);
        throw error;
      } finally {
        setIsDeployingMock(false);
      }
    }, [refreshApps]);
    const subscribeAppConsole = (0, import_react.useCallback)(async (appId) => {
      try {
        await runtimeServiceRef.current?.subscribeConsole(appId);
        setAppConsoleOutputs((prev) => ({
          ...prev,
          [appId]: []
        }));
        const output = await runtimeServiceRef.current?.getAppOutput(appId, 100);
        if (output?.output && Array.isArray(output.output)) {
          setAppConsoleOutputs((prev) => ({
            ...prev,
            [appId]: output.output.slice(-500).map((line) => ({
              stream: line.stream || "stdout",
              content: line.output || line.content || "",
              timestamp: line.timestamp || (/* @__PURE__ */ new Date()).toISOString()
            }))
          }));
        }
      } catch (error) {
        console.error("[VehicleRuntime] Failed to subscribe to console:", error);
        setAppConsoleOutputs((prev) => ({
          ...prev,
          [appId]: []
        }));
      }
    }, []);
    const unsubscribeAppConsole = (0, import_react.useCallback)(async (appId) => {
      try {
        await runtimeServiceRef.current?.unsubscribeConsole(appId);
      } catch (error) {
        console.error("[VehicleRuntime] Failed to unsubscribe from console:", error);
      }
    }, []);
    const clearAppConsole = (0, import_react.useCallback)((appId) => {
      setAppConsoleOutputs((prev) => ({ ...prev, [appId]: [] }));
    }, []);
    return {
      isRuntimeConnected,
      isKitManagerConnected,
      isKitManagerLoading,
      kitManagerError,
      kits,
      selectedKit,
      vehicleApps,
      isRefreshingApps,
      appConsoleOutputs,
      isDeployingKuksa,
      isDeployingMock,
      connectionError,
      connectRuntime,
      connectKitManager,
      selectKit,
      refreshApps,
      startApp,
      stopApp,
      uninstallApp,
      deployApp,
      deployKuksa,
      deployMock,
      subscribeAppConsole,
      unsubscribeAppConsole,
      clearAppConsole
    };
  }

  // src/utils/helpers.ts
  function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  // src/utils/dependencyDetector.ts
  var STANDARD_LIBRARY_MODULES = [
    "os",
    "sys",
    "time",
    "datetime",
    "json",
    "csv",
    "re",
    "math",
    "random",
    "collections",
    "itertools",
    "functools",
    "operator",
    "pathlib",
    "urllib",
    "http",
    "socket",
    "threading",
    "multiprocessing",
    "asyncio",
    "logging",
    "unittest",
    "argparse",
    "configparser",
    "sqlite3",
    "pickle",
    "base64",
    "hashlib",
    "hmac",
    "uuid",
    "decimal",
    "fractions",
    "statistics",
    "typing",
    "dataclasses",
    "enum",
    "contextlib",
    "abc",
    "inspect",
    "importlib",
    "warnings",
    "copy",
    "io",
    "string",
    "textwrap",
    "pprint",
    "enum"
  ];
  function detectPythonDependencies(sourceCode) {
    const imports = /* @__PURE__ */ new Set();
    const cleanedCode = removeCommentsAndStrings(sourceCode);
    const patterns = [
      // import xxx or import xxx as yyy
      /^\s*import\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)(?:\s+as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*$/gm,
      // from xxx import yyy
      /^\s*from\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s+import\s+(?:\*|\(?:(?:[a-zA-Z_][a-zA-Z0-9_]*)(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*\))?\s*$/gm
    ];
    patterns.forEach((pattern) => {
      const matches = cleanedCode.matchAll(pattern);
      for (const match of matches) {
        const importPath = match[1];
        const packageName = importPath.split(".")[0].toLowerCase();
        if (!isStandardLibraryModule(packageName) && !isLocalModule(importPath, cleanedCode)) {
          if (packageName === "kuksa" || packageName === "kuksa_client") {
            imports.add("kuksa_client==0.4.3");
          } else if (packageName === "velocitas") {
            imports.add("velocitas-sdk==0.14.1");
          } else if (packageName === "sdv") {
            imports.add(packageName);
          } else {
            imports.add(packageName);
          }
        }
      }
    });
    return Array.from(imports).sort();
  }
  function removeCommentsAndStrings(sourceCode) {
    let result = sourceCode;
    result = result.replace(/'''[\s\S]*?'''/g, "");
    result = result.replace(/"""[\s\S]*?"""/g, "");
    result = result.replace(/#.*$/gm, "");
    result = result.replace(/'[^']*'/g, "''");
    result = result.replace(/"[^"]*"/g, '""');
    return result;
  }
  function isStandardLibraryModule(moduleName) {
    return STANDARD_LIBRARY_MODULES.includes(moduleName.toLowerCase());
  }
  function isLocalModule(importPath, sourceCode) {
    const relativeImportPattern = /^\s*from\s+\.\.?\s+import/;
    if (relativeImportPattern.test(sourceCode)) {
      return true;
    }
    return false;
  }
  function getDefaultDependencies() {
    return ["kuksa_client==0.4.3", "velocitas-sdk==0.14.1"];
  }
  var EXAMPLE_TEMPLPS = {
    velocitas: `import asyncio
from sdv import VehicleApp
from vehicle import vehicle


class LightControllerApp(VehicleApp):
    def __init__(self, vehicle_client):
        super().__init__()
        self.Vehicle = vehicle_client

    async def on_start(self):
        print("Light controller started!")
        print("Cycling through light states...")
        print("-" * 50)

        while True:
            # State 1: Low Beam ON, High Beam OFF
            await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(True)
            await self.Vehicle.Body.Lights.Beam.High.IsOn.set(False)
            print(f"[Set] Low Beam: ON  | High Beam: OFF")
            await asyncio.sleep(3)

            # State 2: Low Beam OFF, High Beam OFF
            await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(False)
            await self.Vehicle.Body.Lights.Beam.High.IsOn.set(False)
            print(f"[Set] Low Beam: OFF | High Beam: OFF")
            await asyncio.sleep(2)

            # State 3: Low Beam ON, High Beam ON
            await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(True)
            await self.Vehicle.Body.Lights.Beam.High.IsOn.set(True)
            print(f"[Set] Low Beam: ON  | High Beam: ON ")
            await asyncio.sleep(3)

            # State 4: Low Beam OFF, High Beam OFF
            await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(False)
            await self.Vehicle.Body.Lights.Beam.High.IsOn.set(False)
            print(f"[Set] Low Beam: OFF | High Beam: OFF")
            await asyncio.sleep(2)


async def main():
    app = LightControllerApp(vehicle)
    await app.run()


if __name__ == "__main__":
    asyncio.run(main())`,
    velocitasReadSpeed: `import asyncio
from sdv import VehicleApp
from vehicle import vehicle


class LightReaderApp(VehicleApp):
    def __init__(self, vehicle_client):
        super().__init__()
        self.Vehicle = vehicle_client

    async def on_start(self):
        print("Light reader started!")
        print("Reading Low Beam and High Beam status...")
        print("-" * 50)

        while True:
            try:
                # Read both beam states
                low_val = await self.Vehicle.Body.Lights.Beam.Low.IsOn.get()
                high_val = await self.Vehicle.Body.Lights.Beam.High.IsOn.get()

                # Compact one-line output
                low_status = "ON" if low_val.value else "OFF"
                high_status = "ON" if high_val.value else "OFF"
                print(f"[Get] Low Beam: {low_status:3s} | High Beam: {high_status:3s}")

            except Exception as e:
                print(f"[Get] Error reading lights: {e}")

            await asyncio.sleep(1)


async def main():
    app = LightReaderApp(vehicle)
    await app.run()


if __name__ == "__main__":
    asyncio.run(main())`,
    kuksaSetValue: `# kuksa_set_value.py
from kuksa_client.grpc import VSSClient
from kuksa_client.grpc import Datapoint
import time
import math

# --- Configuration ---
SERVER_HOST = "127.0.0.1"
SERVER_PORT = 55555
VSS_PATH_SPEED = 'Vehicle.Speed'
LOOP_INTERVAL = 1.0  # seconds

def main():
    """
    Connects to KUKSA and continuously sets random speed values in a loop.
    Runs forever with 1-second intervals.
    """
    try:
        with VSSClient(SERVER_HOST, SERVER_PORT) as client:
            print(f"Connected to KUKSA at {SERVER_HOST}:{SERVER_PORT}")
            print(f"Starting to set {VSS_PATH_SPEED} every {LOOP_INTERVAL} seconds...")
            print("Press Ctrl+C to stop")

            speed = 0.0
            loop_count = 0

            # Infinite loop with 1-second interval
            while True:
                try:
                    # Generate a smooth sine wave speed pattern
                    speed = 50 + 45 * math.sin(math.radians(loop_count * 6))
                    speed = round(speed, 1)

                    client.set_current_values({
                        VSS_PATH_SPEED: Datapoint(speed)
                    })

                    timestamp = time.strftime('%H:%M:%S')
                    print(f"[{timestamp}] Set {VSS_PATH_SPEED}: {speed} km/h")

                    loop_count += 1
                    time.sleep(LOOP_INTERVAL)

                except Exception as loop_error:
                    print(f"Error in loop iteration {loop_count}: {loop_error}")
                    time.sleep(LOOP_INTERVAL)

    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()`,
    kuksaPoll: `# poll_speed.py
from kuksa_client.grpc import VSSClient
import time

# --- Configuration ---
SERVER_HOST = "127.0.0.1"
SERVER_PORT = 55555
VSS_PATH_SPEED = 'Vehicle.Speed'
POLL_INTERVAL = 1.0

def main():
    """
    Connects to KUKSA and polls for speed values in an infinite loop.
    Runs forever with 1-second intervals.
    """
    try:
        with VSSClient(SERVER_HOST, SERVER_PORT) as client:
            print(f"Connected to KUKSA at {SERVER_HOST}:{SERVER_PORT}")
            print(f"Polling {VSS_PATH_SPEED} every {POLL_INTERVAL} seconds...")
            print("Press Ctrl+C to stop")

            poll_count = 0

            while True:
                try:
                    # Get current value
                    current_values = client.get_current_values([VSS_PATH_SPEED])
                    speed_value = current_values[VSS_PATH_SPEED]

                    timestamp = time.strftime('%H:%M:%S')
                    print(f"[{timestamp}] Get {VSS_PATH_SPEED}: {speed_value.value} km/h")

                    poll_count += 1
                    time.sleep(POLL_INTERVAL)

                except Exception as poll_error:
                    print(f"Error polling value: {poll_error}")
                    time.sleep(POLL_INTERVAL)

    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    main()`,
    simple: `import time
import asyncio

print("\u{1F697} Vehicle Edge Runtime Application")
print("=" * 50)

try:
    for i in range(60):  # 60 cycles = 10 minutes (10 seconds each)
        print(f"\u{1F4E1} Processing cycle {i + 1}/60")
        print(f"\u23F0 Timestamp: {time.strftime('%H:%M:%S')}")
        await asyncio.sleep(10)
        print(f"\u2705 Cycle {i + 1} completed")
        print("-" * 30)
    print("\u{1F389} Application completed successfully!")
except Exception as e:
    print(f"\u274C Error: {e}")
print("\u{1F4CA} Application execution finished")`
  };

  // src/components/Page.tsx
  var import_jsx_runtime = __require("react/jsx-runtime");
  var React = globalThis.React;
  var Icons = {
    Rocket: () => "\u{1F680}",
    Terminal: () => "\u{1F4BB}",
    Play: () => "\u25B6\uFE0F",
    Stop: () => "\u23F9\uFE0F",
    Pause: () => "\u23F8\uFE0F",
    Refresh: () => "\u{1F504}",
    Trash: () => "\u{1F5D1}\uFE0F",
    Settings: () => "\u2699\uFE0F",
    Alert: () => "\u26A0\uFE0F",
    Check: () => "\u2705",
    Server: () => "\u{1F5A5}\uFE0F",
    Package: () => "\u{1F4E6}",
    Clock: () => "\u{1F550}",
    Wifi: () => "\u{1F4F6}",
    WifiOff: () => "\u{1F4F5}",
    Loading: () => "\u23F3",
    Cube: () => "\u{1F4E6}",
    Code: () => "\u{1F4BB}",
    Download: () => "\u2B07\uFE0F",
    Edit: () => "\u270F\uFE0F",
    Plus: () => "\u2795",
    X: () => "\u2716\uFE0F",
    Search: () => "\u{1F50D}",
    ChevronDown: () => "\u25BC",
    ChevronRight: () => "\u25B6",
    Sparkles: () => "\u2728",
    Brain: () => "\u{1F9E0}"
  };
  function getStatusInfo(status) {
    switch (status) {
      case "running":
        return {
          label: "Running",
          color: "#22c55e",
          bgColor: "#dcfce7",
          borderColor: "#86efac",
          textColor: "#15803d",
          dotColor: "#22c55e"
        };
      case "stopped":
        return {
          label: "Stopped",
          color: "#6b7280",
          bgColor: "#f3f4f6",
          borderColor: "#d1d5db",
          textColor: "#374151",
          dotColor: "#6b7280"
        };
      case "error":
        return {
          label: "Error",
          color: "#ef4444",
          bgColor: "#fee2e2",
          borderColor: "#fca5a5",
          textColor: "#b91c1c",
          dotColor: "#ef4444"
        };
      case "starting":
        return {
          label: "Starting",
          color: "#3b82f6",
          bgColor: "#dbeafe",
          borderColor: "#93c5fd",
          textColor: "#1d4ed8",
          dotColor: "#3b82f6"
        };
      case "paused":
        return {
          label: "Paused",
          color: "#f59e0b",
          bgColor: "#fef3c7",
          borderColor: "#fcd34d",
          textColor: "#b45309",
          dotColor: "#f59e0b"
        };
      default:
        return {
          label: status || "Unknown",
          color: "#6b7280",
          bgColor: "#f3f4f6",
          borderColor: "#d1d5db",
          textColor: "#374151",
          dotColor: "#6b7280"
        };
    }
  }
  var DEFAULT_RUNTIME_URL = "https://kit.digitalauto.tech";
  var DEFAULT_KIT_MANAGER_URL = "https://kit.digitalauto.tech";
  var TEMPLATE_OPTIONS = [
    { id: "velocitas", label: "Velocitas SDK: Set Lights", icon: "\u{1F697}", defaultId: "velocitas-set-lights", defaultName: "Velocitas Set Lights" },
    { id: "velocitasReadSpeed", label: "Velocitas SDK: Read Lights", icon: "\u{1F4CA}", defaultId: "velocitas-read-lights", defaultName: "Velocitas Read Lights" },
    { id: "kuksaSetValue", label: "KUKSA Client: Set Speed", icon: "\u{1F4E1}", defaultId: "kuksa-set-speed", defaultName: "KUKSA Set Speed" },
    { id: "kuksaPoll", label: "KUKSA Client: Read Speed", icon: "\u{1F4D6}", defaultId: "kuksa-read-speed", defaultName: "KUKSA Read Speed" },
    { id: "simple", label: "Simple: Loop Example", icon: "\u{1F40D}", defaultId: "simple-loop-app", defaultName: "Simple Loop App" }
  ];
  async function getCodeFromApi(api, data, prototypeId) {
    try {
      console.log("[Deployment Hub] Trying to fetch code from API...");
      if (data) {
        console.log("[Deployment Hub] Data keys:", Object.keys(data));
        if (data.content)
          return data.content;
        if (data.code)
          return data.code;
        if (data.source)
          return data.source;
        if (data.main_script)
          return data.main_script;
        if (data.prototype) {
          if (data.prototype.content)
            return data.prototype.content;
          if (data.prototype.code)
            return data.prototype.code;
        }
      }
      const url2 = `/api/prototypes/${prototypeId}`;
      console.log("[Deployment Hub] Fetching from:", url2);
      const response = await fetch(url2);
      if (response.ok) {
        const responseData = await response.json();
        console.log("[Deployment Hub] API response:", responseData);
        if (responseData.content)
          return responseData.content;
        if (responseData.code)
          return responseData.code;
        if (responseData.source)
          return responseData.source;
        if (responseData.main_script)
          return responseData.main_script;
        if (responseData.prototype && responseData.prototype.content)
          return responseData.prototype.content;
      }
      return null;
    } catch (error) {
      console.warn("[Deployment Hub] Error fetching from API:", error);
      return null;
    }
  }
  function getCodeFromParentEditor(pluginTextarea) {
    try {
      if (window.monaco && window.monaco.editor) {
        const editors = window.monaco.editor.getEditors();
        for (const editor of editors) {
          const code = editor.getValue();
          if (code && code.length > 100) {
            console.log("[Deployment Hub] Loaded code from Monaco editor");
            return code;
          }
        }
      }
      const allMonacoEditors = document.querySelectorAll(".monaco-editor");
      for (const editor of Array.from(allMonacoEditors)) {
        const viewLines = editor.querySelectorAll(".view-line");
        if (viewLines && viewLines.length > 0) {
          const lines = [];
          for (const line of Array.from(viewLines)) {
            const text = line.textContent?.trim() || "";
            if (text)
              lines.push(text);
          }
          const code = lines.join("\n");
          if (code.length > 100 && (code.includes("import ") || code.includes("def ") || code.includes("class "))) {
            console.log("[Deployment Hub] Loaded code from view-lines");
            return code;
          }
        }
      }
      const allTextareas = document.querySelectorAll("textarea");
      let bestCode = null;
      let bestLength = 0;
      for (const textarea of Array.from(allTextareas)) {
        if (textarea === pluginTextarea)
          continue;
        const val = textarea.value;
        if (val && val.length > 100) {
          const hasPython = val.includes("import ") || val.includes("def ") || val.includes("class ");
          if (hasPython && val.length > bestLength) {
            bestCode = val;
            bestLength = val.length;
          }
        }
      }
      if (bestCode) {
        console.log("[Deployment Hub] Loaded code from textarea");
        return bestCode;
      }
      return null;
    } catch (error) {
      console.warn("[Deployment Hub] Error getting code from parent editor:", error);
      return null;
    }
  }
  function Page({ data, config, api }) {
    const runtimeUrl = config?.runtimeUrl || DEFAULT_RUNTIME_URL;
    const kitManagerUrl = config?.kitManagerUrl || DEFAULT_KIT_MANAGER_URL;
    const {
      isRuntimeConnected,
      isKitManagerConnected,
      isKitManagerLoading,
      kitManagerError,
      kits,
      selectedKit,
      vehicleApps,
      isRefreshingApps,
      appConsoleOutputs,
      isDeployingKuksa,
      isDeployingMock,
      connectionError,
      connectRuntime,
      connectKitManager,
      selectKit,
      refreshApps,
      startApp,
      stopApp,
      uninstallApp,
      deployApp,
      deployKuksa,
      deployMock,
      subscribeAppConsole,
      unsubscribeAppConsole,
      clearAppConsole
    } = useVehicleRuntimeState(runtimeUrl, kitManagerUrl);
    const edgeRuntimeKits = React.useMemo(() => {
      return kits.filter((kit) => kit.name.includes("Edge-Runtime"));
    }, [kits]);
    const [selectedConsoleApp, setSelectedConsoleApp] = React.useState(null);
    const pluginTextareaRef = React.useRef(null);
    const [appId, setAppId] = React.useState("my-vehicle-app");
    const [appName, setAppName] = React.useState("My Vehicle App");
    const getInitialCode = () => {
      const urlMatch = window.location.href.match(/prototype\/([a-f0-9]+)/);
      const prototypeId = urlMatch ? urlMatch[1] : null;
      if (prototypeId) {
        const savedCode = sessionStorage.getItem(`deployment-hub-code-${prototypeId}`);
        if (savedCode) {
          console.log("[Deployment Hub] Restored saved code from sessionStorage");
          return savedCode;
        }
      }
      return EXAMPLE_TEMPLPS.velocitas;
    };
    const [appCode, setAppCode] = React.useState(getInitialCode);
    const [dependencies, setDependencies] = React.useState(getDefaultDependencies());
    const [autoDetectEnabled, setAutoDetectEnabled] = React.useState(true);
    const [detectedDependencies, setDetectedDependencies] = React.useState([]);
    const [isDeploying, setIsDeploying] = React.useState(false);
    const [showTemplates, setShowTemplates] = React.useState(false);
    const [dropdownPosition, setDropdownPosition] = React.useState(null);
    const [manualDependency, setManualDependency] = React.useState("");
    const templatesButtonRef = React.useRef(null);
    const splitContainerRef = React.useRef(null);
    const [leftPanelWidth, setLeftPanelWidth] = React.useState(66.67);
    const [isResizing, setIsResizing] = React.useState(false);
    const handleMouseDown = (e) => {
      e.preventDefault();
      setIsResizing(true);
    };
    React.useEffect(() => {
      const handleMouseMove = (e) => {
        if (!isResizing || !splitContainerRef.current)
          return;
        const containerRect = splitContainerRef.current.getBoundingClientRect();
        const newLeftWidth = (e.clientX - containerRect.left) / containerRect.width * 100;
        const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
        setLeftPanelWidth(constrainedWidth);
      };
      const handleMouseUp = () => {
        setIsResizing(false);
      };
      if (isResizing) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
      }
    }, [isResizing]);
    const logInfo = (msg) => console.log("[Plugin]", msg);
    const logSuccess = (msg) => console.log("[Plugin] \u2705", msg);
    const logError = (msg) => console.error("[Plugin] \u274C", msg);
    React.useEffect(() => {
      const initializeConnections = async () => {
        logInfo("Connecting to Kit Manager...", "info");
        await connectKitManager();
        connectRuntime().catch((error) => {
          console.warn("[Plugin] Vehicle Runtime not available:", error);
          logInfo("Vehicle Runtime not available - deployment disabled", "info");
        });
      };
      initializeConnections();
    }, [connectKitManager, connectRuntime]);
    React.useEffect(() => {
      const loadCode = async () => {
        const urlMatch = window.location.href.match(/prototype\/([a-f0-9]+)/);
        const prototypeId = urlMatch ? urlMatch[1] : null;
        console.log("[Deployment Hub] Component mounted, prototypeId:", prototypeId);
        const sessionKey = `deployment-hub-loaded-${prototypeId}`;
        const alreadyLoaded = prototypeId ? sessionStorage.getItem(sessionKey) : null;
        console.log("[Deployment Hub] sessionStorage key:", sessionKey, "alreadyLoaded:", alreadyLoaded);
        if (alreadyLoaded) {
          console.log("[Deployment Hub] Code already loaded this browser session, skipping auto-load");
          return;
        }
        console.log("[Deployment Hub] Loading code from API/DOM...");
        if (prototypeId && (api || data)) {
          const code = await getCodeFromApi(api, data, prototypeId);
          if (code && code.length > 100) {
            setAppCode(code);
            sessionStorage.setItem(sessionKey, "true");
            sessionStorage.setItem(`deployment-hub-code-${prototypeId}`, code);
            console.log("[Deployment Hub] Auto-loaded code from API (once per browser session)");
          }
        } else {
          setTimeout(() => {
            const parentCode = getCodeFromParentEditor(pluginTextareaRef.current);
            if (parentCode && parentCode.length > 100) {
              setAppCode(parentCode);
              if (prototypeId) {
                sessionStorage.setItem(sessionKey, "true");
                sessionStorage.setItem(`deployment-hub-code-${prototypeId}`, parentCode);
              }
              console.log("[Deployment Hub] Auto-loaded code from DOM (once per browser session)");
            }
          }, 500);
        }
      };
      loadCode();
    }, []);
    React.useEffect(() => {
      if (autoDetectEnabled && appCode) {
        const timeoutId = setTimeout(() => {
          const detected = detectPythonDependencies(appCode);
          setDetectedDependencies(detected);
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }, [appCode, autoDetectEnabled]);
    React.useEffect(() => {
      const urlMatch = window.location.href.match(/prototype\/([a-f0-9]+)/);
      const prototypeId = urlMatch ? urlMatch[1] : null;
      if (prototypeId && appCode && appCode !== EXAMPLE_TEMPLPS.velocitas) {
        sessionStorage.setItem(`deployment-hub-code-${prototypeId}`, appCode);
      }
    }, [appCode]);
    React.useEffect(() => {
      if (!showTemplates)
        return;
      const handleClickOutside = (e) => {
        const target = e.target;
        if (templatesButtonRef.current && !templatesButtonRef.current.contains(target) && !target.closest?.("[data-dropdown-menu]")) {
          setShowTemplates(false);
          setDropdownPosition(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showTemplates]);
    const handleToggleTemplates = () => {
      if (!showTemplates && templatesButtonRef.current) {
        const rect = templatesButtonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left
        });
      } else {
        setDropdownPosition(null);
      }
      setShowTemplates(!showTemplates);
    };
    const allDependencies = React.useMemo(() => {
      const base = getDefaultDependencies();
      const detected = autoDetectEnabled ? detectedDependencies : [];
      const manual = dependencies.filter(
        (d) => !base.includes(d) && !detected.includes(d.toLowerCase())
      );
      return [...base, ...detected, ...manual];
    }, [dependencies, detectedDependencies, autoDetectEnabled]);
    const handleDeploy = async () => {
      if (!selectedKit?.is_online) {
        logError("No online runtime selected");
        return;
      }
      if (!appId.trim()) {
        logError("Please enter an application ID");
        return;
      }
      if (!appCode.trim()) {
        logError("Please enter application code");
        return;
      }
      setIsDeploying(true);
      logInfo(`Starting deployment of Python app to ${selectedKit.name}...`, "info");
      try {
        const deployedAppId = await deployApp({
          name: appId,
          displayName: appName,
          code: appCode,
          dependencies: allDependencies
        });
        logSuccess(`Application "${appName}" deployed successfully! ID: ${deployedAppId}`);
      } catch (error) {
        logError(`Deployment failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setIsDeploying(false);
      }
    };
    const handleLoadTemplate = (templateId) => {
      const template = EXAMPLE_TEMPLPS[templateId];
      const templateConfig = TEMPLATE_OPTIONS.find((t) => t.id === templateId);
      if (template) {
        setAppCode(template);
        if (templateConfig) {
          setAppId(templateConfig.defaultId);
          setAppName(templateConfig.defaultName);
        }
        setShowTemplates(false);
        logInfo(`Loaded template: ${templateConfig?.label}`, "info");
      }
    };
    const handleAddDependency = () => {
      if (manualDependency.trim() && !dependencies.includes(manualDependency.trim())) {
        setDependencies([...dependencies, manualDependency.trim()]);
        setManualDependency("");
      }
    };
    const handleRemoveDependency = (dep) => {
      setDependencies(dependencies.filter((d) => d !== dep));
    };
    const handleKitChange = (kitId) => {
      const kit = kits.find((k) => k.kit_id === kitId);
      if (kit) {
        selectKit(kit);
        logInfo(`Selected kit: ${kit.name}`, "info");
        refreshApps();
      }
    };
    const handleStartApp = async (appId2) => {
      try {
        logInfo(`Starting application: ${appId2}...`, "info");
        await startApp(appId2);
        logSuccess(`Application ${appId2} started`);
      } catch (error) {
        logError(`Failed to start app: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    const handleStopApp = async (appId2) => {
      try {
        logInfo(`Stopping application: ${appId2}...`, "info");
        await stopApp(appId2);
        logSuccess(`Application ${appId2} stopped`);
      } catch (error) {
        logError(`Failed to stop app: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    const handleUninstallApp = async (appId2) => {
      if (!confirm(`Are you sure you want to uninstall "${appId2}"?`)) {
        return;
      }
      try {
        logInfo(`Uninstalling application: ${appId2}...`, "info");
        await uninstallApp(appId2);
        logSuccess(`Application ${appId2} uninstalled`);
      } catch (error) {
        logError(`Failed to uninstall app: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    const handleDeployKuksa = async () => {
      if (!isRuntimeConnected) {
        logError("Runtime not connected");
        return;
      }
      try {
        logInfo("Deploying KUKSA Databroker server...", "info");
        const appId2 = await deployKuksa();
        logSuccess(`KUKSA Databroker deployed! App ID: ${appId2}`);
      } catch (error) {
        logError(`Failed to deploy KUKSA: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    const handleDeployMock = async () => {
      if (!isRuntimeConnected) {
        logError("Runtime not connected");
        return;
      }
      try {
        logInfo("Deploying Mock service...", "info");
        const appId2 = await deployMock("echo-all");
        logSuccess(`Mock service deployed! App ID: ${appId2}`);
      } catch (error) {
        logError(`Failed to deploy Mock service: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    const styles = {
      container: {
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        color: "#333",
        display: "flex",
        flexDirection: "column"
      },
      header: {
        backgroundColor: "white",
        borderBottom: "1px solid #e5e5e5",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      },
      headerTitle: {
        fontSize: "18px",
        fontWeight: "600",
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: "8px"
      },
      connectionStatus: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "12px"
      },
      statusItem: {
        display: "flex",
        alignItems: "center",
        gap: "4px"
      },
      splitContainer: {
        display: "flex",
        flex: 1,
        overflow: "hidden",
        position: "relative"
      },
      leftPanel: (width) => ({
        width: `${width}%`,
        minWidth: "20%",
        maxWidth: "80%",
        borderRight: "1px solid #e5e5e5",
        overflowY: "auto",
        backgroundColor: "#fafafa"
      }),
      resizeHandle: {
        width: "6px",
        cursor: "col-resize",
        backgroundColor: "#e5e5e5",
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        transition: "background-color 0.15s",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      resizeHandleHover: {
        backgroundColor: "#0066cc"
      },
      resizeHandleLine: {
        width: "2px",
        height: "40px",
        backgroundColor: "#999",
        borderRadius: "1px"
      },
      rightPanel: (leftWidth) => ({
        width: `${100 - leftWidth}%`,
        overflowY: "auto",
        backgroundColor: "#f5f5f5"
      }),
      panelContent: {
        padding: "16px"
      },
      card: {
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e5e5e5",
        marginBottom: "16px"
      },
      cardHeader: {
        padding: "12px 16px",
        borderBottom: "1px solid #e5e5e5",
        fontWeight: "600",
        fontSize: "14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      },
      cardBody: {
        padding: "16px"
      },
      label: {
        display: "block",
        marginBottom: "6px",
        fontSize: "13px",
        fontWeight: "500"
      },
      input: {
        width: "100%",
        padding: "8px 12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "13px",
        boxSizing: "border-box"
      },
      textarea: {
        width: "100%",
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "12px",
        fontFamily: "monospace",
        minHeight: "250px",
        resize: "vertical",
        boxSizing: "border-box"
      },
      button: {
        padding: "8px 16px",
        border: "none",
        borderRadius: "4px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        backgroundColor: "#0066cc",
        color: "white"
      },
      buttonDisabled: {
        backgroundColor: "#ccc",
        cursor: "not-allowed"
      },
      buttonSecondary: {
        backgroundColor: "#6c757d"
      },
      buttonDanger: {
        backgroundColor: "#dc3545"
      },
      buttonSmall: {
        padding: "4px 8px",
        fontSize: "11px"
      },
      badge: (color) => ({
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "500",
        backgroundColor: color
      }),
      dependencyItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 8px",
        backgroundColor: "#f8f9fa",
        border: "1px solid #e5e5e5",
        borderRadius: "4px",
        marginBottom: "4px",
        fontSize: "12px"
      },
      grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "12px"
      },
      appCard: {
        border: "1px solid #e5e5e5",
        borderRadius: "6px",
        padding: "12px",
        backgroundColor: "white"
      },
      templateDropdown: {
        position: "relative"
      },
      dropdownMenu: {
        position: "fixed",
        minWidth: "280px",
        backgroundColor: "white",
        border: "1px solid #e5e5e5",
        borderRadius: "4px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        zIndex: 99999,
        maxHeight: "300px",
        overflowY: "auto"
      },
      dropdownItem: {
        padding: "10px 12px",
        cursor: "pointer",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        fontSize: "13px",
        borderBottom: "1px solid #f0f0f0",
        lineHeight: "1.4"
      },
      dropdownItemHover: {
        backgroundColor: "#f5f5f5"
      }
    };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.container, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { style: styles.headerTitle, children: [
          Icons.Rocket(),
          " Deployment Hub"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.connectionStatus, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                ...styles.statusItem,
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                backgroundColor: isKitManagerLoading ? "#fff3cd" : isKitManagerConnected ? "#d4edda" : kitManagerError ? "#f8d7da" : "#e2e3e5"
              },
              children: [
                isKitManagerLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  Icons.Loading(),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Connecting..." })
                ] }) : isKitManagerConnected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  Icons.Wifi(),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                    "Kit Manager ",
                    Icons.Check()
                  ] })
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                  Icons.WifiOff(),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                    "Kit Manager ",
                    kitManagerError ? "\u274C" : "\u23F8"
                  ] })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    onClick: connectKitManager,
                    style: {
                      ...styles.button,
                      ...styles.buttonSmall,
                      marginLeft: "4px",
                      padding: "2px 6px",
                      minWidth: "20px"
                    },
                    title: "Refresh Kit Manager",
                    children: Icons.Refresh()
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              style: {
                ...styles.statusItem,
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                backgroundColor: isRuntimeConnected ? "#d4edda" : "#e2e3e5"
              },
              children: isRuntimeConnected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                Icons.Wifi(),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                  "Runtime ",
                  Icons.Check()
                ] })
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                Icons.WifiOff(),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Runtime" })
              ] })
            }
          ),
          isKitManagerConnected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "select",
            {
              value: selectedKit?.kit_id || "",
              onChange: (e) => handleKitChange(e.target.value),
              style: {
                padding: "6px 10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "12px"
              },
              children: edgeRuntimeKits.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", disabled: true, children: "Select Edge-Runtime device..." }),
                edgeRuntimeKits.map((kit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", { value: kit.kit_id, children: [
                  kit.name,
                  " ",
                  kit.is_online ? "\u{1F7E2}" : "\u{1F534}"
                ] }, kit.kit_id))
              ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "", disabled: true, children: "No edge runtime" })
            }
          )
        ] })
      ] }),
      kitManagerError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
        backgroundColor: "#f8d7da",
        borderBottom: "1px solid #f5c6cb",
        padding: "10px 20px",
        fontSize: "13px",
        color: "#721c24",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }, children: [
        Icons.Alert(),
        " ",
        kitManagerError,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            onClick: connectKitManager,
            style: {
              ...styles.button,
              ...styles.buttonSmall,
              marginLeft: "auto",
              backgroundColor: "#721c24"
            },
            children: "Retry"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref: splitContainerRef, style: styles.splitContainer, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.leftPanel(leftPanelWidth), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.panelContent, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.cardHeader, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
              Icons.Cube(),
              " Application Details"
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.cardBody, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "12px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: styles.label, children: "Application ID *" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    type: "text",
                    value: appId,
                    onChange: (e) => setAppId(e.target.value),
                    placeholder: "my-vehicle-app",
                    style: styles.input
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "12px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: styles.label, children: "Display Name" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    type: "text",
                    value: appName,
                    onChange: (e) => setAppName(e.target.value),
                    placeholder: "My Vehicle App",
                    style: styles.input
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.card, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.cardBody, padding: "12px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: styles.label, children: [
                Icons.Code(),
                " Application Code (Python)"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "4px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    onClick: async () => {
                      const urlMatch = window.location.href.match(/prototype\/([a-f0-9]+)/);
                      const prototypeId = urlMatch ? urlMatch[1] : null;
                      if (prototypeId && (api || data)) {
                        const code = await getCodeFromApi(api, data, prototypeId);
                        if (code && code !== appCode) {
                          setAppCode(code);
                          console.log("[Deployment Hub] Code updated from API");
                          return;
                        }
                      }
                      const parentCode = getCodeFromParentEditor(pluginTextareaRef.current);
                      if (parentCode && parentCode !== appCode) {
                        setAppCode(parentCode);
                        console.log("[Deployment Hub] Code updated from DOM");
                      } else {
                        console.warn("[Deployment Hub] No code found");
                      }
                    },
                    style: { ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary },
                    title: "Load code from SDV Code editor",
                    children: [
                      Icons.Refresh(),
                      " From Editor"
                    ]
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.templateDropdown, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    "button",
                    {
                      ref: templatesButtonRef,
                      onClick: handleToggleTemplates,
                      style: { ...styles.button, ...styles.buttonSmall, ...styles.buttonSecondary },
                      children: [
                        Icons.Download(),
                        " Templates ",
                        Icons.ChevronDown()
                      ]
                    }
                  ),
                  showTemplates && dropdownPosition && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "div",
                    {
                      "data-dropdown-menu": true,
                      style: {
                        ...styles.dropdownMenu,
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`
                      },
                      children: TEMPLATE_OPTIONS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "div",
                        {
                          onClick: () => handleLoadTemplate(t.id),
                          style: styles.dropdownItem,
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "18px", minWidth: "24px", textAlign: "center" }, children: t.icon }),
                            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 }, children: t.label })
                          ]
                        },
                        t.id
                      ))
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "textarea",
              {
                ref: pluginTextareaRef,
                value: appCode,
                onChange: (e) => setAppCode(e.target.value),
                style: styles.textarea
              }
            )
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.cardHeader, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                Icons.Package(),
                " Dependencies (",
                allDependencies.length,
                ")"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "normal" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    type: "checkbox",
                    checked: autoDetectEnabled,
                    onChange: (e) => setAutoDetectEnabled(e.target.checked)
                  }
                ),
                "Auto-detect"
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.cardBody, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "12px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.badge("#e3f2fd"), color: "#1565c0", marginBottom: "8px" }, children: [
                  Icons.Check(),
                  " Required (",
                  getDefaultDependencies().length,
                  ")"
                ] }),
                getDefaultDependencies().map((dep) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.dependencyItem, backgroundColor: "#f0f7ff" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: dep }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "10px", color: "#666" }, children: "fixed" })
                ] }, dep))
              ] }),
              autoDetectEnabled && detectedDependencies.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "12px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.badge("#fff3e0"), color: "#e65100", marginBottom: "8px" }, children: [
                  Icons.Sparkles(),
                  " Detected (",
                  detectedDependencies.length,
                  ")"
                ] }),
                detectedDependencies.map((dep) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.dependencyItem, backgroundColor: "#fff8f0" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: dep }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "10px", color: "#666" }, children: "auto" })
                ] }, dep))
              ] }),
              dependencies.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "12px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.badge("#f3e5f5"), color: "#7b1fa2", marginBottom: "8px" }, children: [
                  Icons.Edit(),
                  " Manual (",
                  dependencies.length,
                  ")"
                ] }),
                dependencies.map((dep) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.dependencyItem, backgroundColor: "#faf5ff" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: dep }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "button",
                    {
                      onClick: () => handleRemoveDependency(dep),
                      style: { ...styles.button, ...styles.buttonSmall, ...styles.buttonDanger, padding: "2px 6px" },
                      children: Icons.X()
                    }
                  )
                ] }, dep))
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "input",
                  {
                    type: "text",
                    value: manualDependency,
                    onChange: (e) => setManualDependency(e.target.value),
                    placeholder: "Add dependency (e.g., numpy==1.24.0)",
                    onKeyPress: (e) => e.key === "Enter" && handleAddDependency(),
                    style: { ...styles.input, flex: 1 }
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    onClick: handleAddDependency,
                    style: { ...styles.button, ...styles.buttonSmall },
                    children: [
                      Icons.Plus(),
                      " Add"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: "12px", padding: "8px", backgroundColor: "#e8f5e9", borderRadius: "4px", fontSize: "12px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
                  "Total: ",
                  allDependencies.length,
                  " packages"
                ] }),
                " will be installed"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: handleDeploy,
              disabled: isDeploying || !selectedKit?.is_online || !isRuntimeConnected,
              style: {
                ...styles.button,
                width: "100%",
                padding: "12px",
                fontSize: "14px",
                ...isDeploying || !selectedKit?.is_online || !isRuntimeConnected ? styles.buttonDisabled : {}
              },
              children: isDeploying ? `${Icons.Loading()} Deploying...` : `${Icons.Rocket()} Deploy Application`
            }
          )
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            onMouseDown: handleMouseDown,
            style: {
              ...styles.resizeHandle,
              left: `${leftPanelWidth}%`,
              ...isResizing ? styles.resizeHandleHover : {}
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.resizeHandleLine })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.rightPanel(leftPanelWidth), children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.panelContent, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.card, marginBottom: "16px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.cardHeader, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
              Icons.Server(),
              " Services"
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...styles.cardBody, padding: "12px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  onClick: handleDeployKuksa,
                  disabled: !isRuntimeConnected || isDeployingKuksa,
                  style: {
                    ...styles.button,
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "12px",
                    ...isDeployingKuksa || !isRuntimeConnected ? styles.buttonDisabled : {}
                  },
                  children: isDeployingKuksa ? `${Icons.Loading()} KUKSA...` : `${Icons.Server()} KUKSA`
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  onClick: handleDeployMock,
                  disabled: !isRuntimeConnected || isDeployingMock,
                  style: {
                    ...styles.button,
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "12px",
                    ...isDeployingMock || !isRuntimeConnected ? styles.buttonDisabled : {}
                  },
                  children: isDeployingMock ? `${Icons.Loading()} Mock...` : `${Icons.Brain()} Mock`
                }
              )
            ] }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.card, marginBottom: "16px", overflow: "hidden" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.cardHeader, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                Icons.Terminal(),
                " Console Output",
                selectedConsoleApp && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { marginLeft: "8px", fontSize: "12px", fontWeight: "normal", color: "#666" }, children: [
                  "\u2192 ",
                  vehicleApps.find((a) => a.app_id === selectedConsoleApp)?.name || selectedConsoleApp
                ] })
              ] }),
              selectedConsoleApp && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "4px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    onClick: () => clearAppConsole(selectedConsoleApp),
                    style: { ...styles.button, ...styles.buttonSmall, padding: "4px 8px", fontSize: "11px" },
                    title: "Clear console output",
                    children: "Clear"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "button",
                  {
                    onClick: () => {
                      if (selectedConsoleApp) {
                        unsubscribeAppConsole(selectedConsoleApp);
                      }
                      setSelectedConsoleApp(null);
                    },
                    style: { ...styles.button, ...styles.buttonSmall, padding: "4px 8px", fontSize: "11px" },
                    children: [
                      Icons.X(),
                      " Close"
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...styles.cardBody, padding: "0", overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: "300px", display: "flex", flexDirection: "column" }, children: !selectedConsoleApp ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              textAlign: "center"
            }, children: [
              Icons.Terminal(),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { marginTop: "12px", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }, children: "Click on an application to view its console" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", color: "#aaa" }, children: "Console output will appear here" })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
              flex: 1,
              backgroundColor: "#1e1e1e",
              overflowY: "auto",
              overflowX: "hidden",
              padding: "12px",
              fontFamily: "monospace",
              fontSize: "11px",
              lineHeight: "1.4"
            }, children: (appConsoleOutputs[selectedConsoleApp] || []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { color: "#666", fontStyle: "italic", textAlign: "center", padding: "40px 0" }, children: "Waiting for console output..." }) : (appConsoleOutputs[selectedConsoleApp] || []).map((line, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "div",
              {
                style: {
                  color: line.stream === "stderr" ? "#f48771" : "#d4d4d4",
                  marginBottom: "2px",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { color: "#6a9955", fontSize: "10px", flexShrink: 0 }, children: [
                    "[",
                    new Date(line.timestamp).toLocaleTimeString(),
                    " ",
                    line.stream,
                    "]"
                  ] }),
                  " ",
                  line.content
                ]
              },
              idx
            )) }) }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.card, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: styles.cardHeader, children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                Icons.Package(),
                " Deployed Applications (",
                vehicleApps.length,
                ")",
                isRefreshingApps && ` (${Icons.Loading()})`
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "button",
                {
                  onClick: refreshApps,
                  style: { ...styles.button, ...styles.buttonSmall },
                  children: [
                    Icons.Refresh(),
                    " Refresh"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.cardBody, children: vehicleApps.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center", padding: "40px 20px", color: "#666" }, children: [
              Icons.Package(),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { marginTop: "12px", marginBottom: "16px" }, children: "No applications deployed yet." }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { fontSize: "12px", color: "#999" }, children: "Use the form on the left to deploy your first application." })
            ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: styles.grid, children: vehicleApps.map((app) => {
              const isRunning = app.status === "running";
              const isStopped = app.status === "stopped" || app.status === "error";
              const isStarting = app.status === "starting";
              const statusInfo = getStatusInfo(app.status);
              const isSelected = selectedConsoleApp === app.app_id;
              return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "div",
                {
                  onClick: () => {
                    if (selectedConsoleApp !== app.app_id) {
                      setSelectedConsoleApp(app.app_id);
                      subscribeAppConsole(app.app_id);
                    }
                  },
                  style: {
                    ...styles.appCard,
                    borderLeft: `4px solid ${statusInfo.color}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    ...isSelected ? {
                      boxShadow: "0 0 0 2px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.2)",
                      transform: "scale(1.01)"
                    } : {},
                    ":hover": {
                      transform: "scale(1.01)",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
                    }
                  },
                  title: "Click to view console output",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { style: { margin: "0 0 4px 0", fontSize: "15px", fontWeight: "600", wordBreak: "break-word" }, children: app.name }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: "0 0 2px 0", fontSize: "11px", color: "#888" }, children: app.type }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { style: { margin: "0 0 4px 0", fontSize: "10px", color: "#999" }, children: [
                          "ID: ",
                          app.app_id
                        ] }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: 0, fontSize: "10px", color: "#999" }, children: formatTimestamp(app.deploy_time) })
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        backgroundColor: statusInfo.bgColor,
                        border: `1px solid ${statusInfo.borderColor}`
                      }, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: statusInfo.dotColor,
                          animation: isStarting ? "pulse 1.5s infinite" : "none"
                        } }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
                          fontSize: "12px",
                          fontWeight: "600",
                          color: statusInfo.textColor,
                          textTransform: "capitalize"
                        }, children: statusInfo.label })
                      ] })
                    ] }),
                    app.resources && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "11px", color: "#666", marginBottom: "12px", padding: "8px", backgroundColor: "#f8f9fa", borderRadius: "6px" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between" }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                        "CPU: ",
                        app.resources.cpu_limit || "N/A"
                      ] }),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                        "Memory: ",
                        app.resources.memory_limit || "N/A"
                      ] })
                    ] }) }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: "8px" }, children: [
                      isStopped ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "button",
                        {
                          onClick: (e) => {
                            e.stopPropagation();
                            handleStartApp(app.app_id);
                          },
                          style: {
                            ...styles.button,
                            flex: 1,
                            padding: "8px 12px",
                            backgroundColor: "#22c55e",
                            fontSize: "13px",
                            fontWeight: "600"
                          },
                          title: "Start this application",
                          children: [
                            Icons.Play(),
                            " Start"
                          ]
                        }
                      ) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                        "button",
                        {
                          onClick: (e) => {
                            e.stopPropagation();
                            handleStopApp(app.app_id);
                          },
                          style: {
                            ...styles.button,
                            flex: 1,
                            padding: "8px 12px",
                            backgroundColor: isRunning ? "#ef4444" : "#f97316",
                            fontSize: "13px",
                            fontWeight: "600"
                          },
                          title: isRunning ? "Stop this application" : "Stop this application",
                          children: [
                            Icons.Stop(),
                            " ",
                            isRunning ? "Stop" : "Kill"
                          ]
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "button",
                        {
                          onClick: (e) => {
                            e.stopPropagation();
                            handleUninstallApp(app.app_id);
                          },
                          style: {
                            ...styles.button,
                            ...styles.buttonSmall,
                            padding: "8px 12px",
                            backgroundColor: "#dc2626",
                            fontSize: "13px",
                            fontWeight: "600"
                          },
                          title: "Uninstall this application",
                          children: Icons.Trash()
                        }
                      )
                    ] })
                  ]
                },
                app.app_id
              );
            }) }) })
          ] })
        ] }) })
      ] }),
      connectionError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...styles.card, margin: "16px", backgroundColor: "#fee", borderColor: "#fcc" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...styles.cardBody, color: "#c33", padding: "12px" }, children: [
        Icons.Alert(),
        " ",
        connectionError
      ] }) })
    ] });
  }

  // src/index.ts
  var components = { Page };
  function mount(el, props) {
    const root = ReactDOM.createRoot(el);
    root.render(React2.createElement(Page, props || {}));
    el.__aw_root = root;
  }
  function unmount(el) {
    const r = el.__aw_root;
    if (r && r.unmount)
      r.unmount();
    delete el.__aw_root;
  }
  if (typeof window !== "undefined") {
    ;
    window.DAPlugins = window.DAPlugins || {};
    window.DAPlugins["page-plugin"] = { components, mount, unmount };
    console.log("Deployment Hub plugin registered as page-plugin");
  }
})();
//# sourceMappingURL=index.js.map
