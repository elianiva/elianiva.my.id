import {randomBytes, createHash} from "crypto";
import http from "http";
import https from "https";
import zlib from "zlib";
import Stream, {PassThrough, pipeline} from "stream";
import {types} from "util";
import {format, parse, resolve, URLSearchParams as URLSearchParams$1} from "url";
import fs from "fs";
import frontmatter from "front-matter";
import path from "path";
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data2 = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data2, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
var src = dataUriToBuffer;
const {Readable} = Stream;
const wm = new WeakMap();
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
class Blob {
  constructor(blobParts = [], options = {type: ""}) {
    let size = 0;
    const parts = blobParts.map((element) => {
      let buffer;
      if (element instanceof Buffer) {
        buffer = element;
      } else if (ArrayBuffer.isView(element)) {
        buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
      } else if (element instanceof ArrayBuffer) {
        buffer = Buffer.from(element);
      } else if (element instanceof Blob) {
        buffer = element;
      } else {
        buffer = Buffer.from(typeof element === "string" ? element : String(element));
      }
      size += buffer.length || buffer.size || 0;
      return buffer;
    });
    const type = options.type === void 0 ? "" : String(options.type).toLowerCase();
    wm.set(this, {
      type: /[^\u0020-\u007E]/.test(type) ? "" : type,
      size,
      parts
    });
  }
  get size() {
    return wm.get(this).size;
  }
  get type() {
    return wm.get(this).type;
  }
  async text() {
    return Buffer.from(await this.arrayBuffer()).toString();
  }
  async arrayBuffer() {
    const data2 = new Uint8Array(this.size);
    let offset = 0;
    for await (const chunk of this.stream()) {
      data2.set(chunk, offset);
      offset += chunk.length;
    }
    return data2.buffer;
  }
  stream() {
    return Readable.from(read(wm.get(this).parts));
  }
  slice(start = 0, end = this.size, type = "") {
    const {size} = this;
    let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
    const span = Math.max(relativeEnd - relativeStart, 0);
    const parts = wm.get(this).parts.values();
    const blobParts = [];
    let added = 0;
    for (const part of parts) {
      const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
      if (relativeStart && size2 <= relativeStart) {
        relativeStart -= size2;
        relativeEnd -= size2;
      } else {
        const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
        blobParts.push(chunk);
        added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
        relativeStart = 0;
        if (added >= span) {
          break;
        }
      }
    }
    const blob = new Blob([], {type});
    Object.assign(wm.get(blob), {size: span, parts: blobParts});
    return blob;
  }
  get [Symbol.toStringTag]() {
    return "Blob";
  }
  static [Symbol.hasInstance](object) {
    return typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
  }
}
Object.defineProperties(Blob.prototype, {
  size: {enumerable: true},
  type: {enumerable: true},
  slice: {enumerable: true}
});
var fetchBlob = Blob;
class FetchBaseError extends Error {
  constructor(message, type) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.type = type;
  }
  get name() {
    return this.constructor.name;
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}
class FetchError extends FetchBaseError {
  constructor(message, type, systemError) {
    super(message, type);
    if (systemError) {
      this.code = this.errno = systemError.code;
      this.erroredSysCall = systemError.syscall;
    }
  }
}
const NAME = Symbol.toStringTag;
const isURLSearchParameters = (object) => {
  return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
};
const isBlob = (object) => {
  return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
};
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
const isAbortSignal = (object) => {
  return typeof object === "object" && object[NAME] === "AbortSignal";
};
const carriage = "\r\n";
const dashes = "-".repeat(2);
const carriageLength = Buffer.byteLength(carriage);
const getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
const getBoundary = () => randomBytes(8).toString("hex");
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
const INTERNALS$2 = Symbol("Body internals");
class Body {
  constructor(body, {
    size = 0
  } = {}) {
    let boundary = null;
    if (body === null) {
      body = null;
    } else if (isURLSearchParameters(body)) {
      body = Buffer.from(body.toString());
    } else if (isBlob(body))
      ;
    else if (Buffer.isBuffer(body))
      ;
    else if (types.isAnyArrayBuffer(body)) {
      body = Buffer.from(body);
    } else if (ArrayBuffer.isView(body)) {
      body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    } else if (body instanceof Stream)
      ;
    else if (isFormData(body)) {
      boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
      body = Stream.Readable.from(formDataIterator(body, boundary));
    } else {
      body = Buffer.from(String(body));
    }
    this[INTERNALS$2] = {
      body,
      boundary,
      disturbed: false,
      error: null
    };
    this.size = size;
    if (body instanceof Stream) {
      body.on("error", (err) => {
        const error2 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
        this[INTERNALS$2].error = error2;
      });
    }
  }
  get body() {
    return this[INTERNALS$2].body;
  }
  get bodyUsed() {
    return this[INTERNALS$2].disturbed;
  }
  async arrayBuffer() {
    const {buffer, byteOffset, byteLength} = await consumeBody(this);
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  async blob() {
    const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
    const buf = await this.buffer();
    return new fetchBlob([buf], {
      type: ct
    });
  }
  async json() {
    const buffer = await consumeBody(this);
    return JSON.parse(buffer.toString());
  }
  async text() {
    const buffer = await consumeBody(this);
    return buffer.toString();
  }
  buffer() {
    return consumeBody(this);
  }
}
Object.defineProperties(Body.prototype, {
  body: {enumerable: true},
  bodyUsed: {enumerable: true},
  arrayBuffer: {enumerable: true},
  blob: {enumerable: true},
  json: {enumerable: true},
  text: {enumerable: true}
});
async function consumeBody(data2) {
  if (data2[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data2.url}`);
  }
  data2[INTERNALS$2].disturbed = true;
  if (data2[INTERNALS$2].error) {
    throw data2[INTERNALS$2].error;
  }
  let {body} = data2;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof Stream)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data2.size > 0 && accumBytes + chunk.length > data2.size) {
        const err = new FetchError(`content size at ${data2.url} over limit: ${data2.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    if (error2 instanceof FetchBaseError) {
      throw error2;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data2.url}: ${error2.message}`, "system", error2);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data2.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data2.url}`);
  }
}
const clone = (instance, highWaterMark) => {
  let p1;
  let p2;
  let {body} = instance;
  if (instance.bodyUsed) {
    throw new Error("cannot clone body after it is used");
  }
  if (body instanceof Stream && typeof body.getBoundary !== "function") {
    p1 = new PassThrough({highWaterMark});
    p2 = new PassThrough({highWaterMark});
    body.pipe(p1);
    body.pipe(p2);
    instance[INTERNALS$2].body = p1;
    body = p2;
  }
  return body;
};
const extractContentType = (body, request) => {
  if (body === null) {
    return null;
  }
  if (typeof body === "string") {
    return "text/plain;charset=UTF-8";
  }
  if (isURLSearchParameters(body)) {
    return "application/x-www-form-urlencoded;charset=UTF-8";
  }
  if (isBlob(body)) {
    return body.type || null;
  }
  if (Buffer.isBuffer(body) || types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
    return null;
  }
  if (body && typeof body.getBoundary === "function") {
    return `multipart/form-data;boundary=${body.getBoundary()}`;
  }
  if (isFormData(body)) {
    return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
  }
  if (body instanceof Stream) {
    return null;
  }
  return "text/plain;charset=UTF-8";
};
const getTotalBytes = (request) => {
  const {body} = request;
  if (body === null) {
    return 0;
  }
  if (isBlob(body)) {
    return body.size;
  }
  if (Buffer.isBuffer(body)) {
    return body.length;
  }
  if (body && typeof body.getLengthSync === "function") {
    return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
  }
  if (isFormData(body)) {
    return getFormDataLength(request[INTERNALS$2].boundary);
  }
  return null;
};
const writeToStream = (dest, {body}) => {
  if (body === null) {
    dest.end();
  } else if (isBlob(body)) {
    body.stream().pipe(dest);
  } else if (Buffer.isBuffer(body)) {
    dest.write(body);
    dest.end();
  } else {
    body.pipe(dest);
  }
};
const validateHeaderName = typeof http.validateHeaderName === "function" ? http.validateHeaderName : (name) => {
  if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
    const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
    Object.defineProperty(err, "code", {value: "ERR_INVALID_HTTP_TOKEN"});
    throw err;
  }
};
const validateHeaderValue = typeof http.validateHeaderValue === "function" ? http.validateHeaderValue : (name, value) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
    const err = new TypeError(`Invalid character in header content ["${name}"]`);
    Object.defineProperty(err, "code", {value: "ERR_INVALID_CHAR"});
    throw err;
  }
};
class Headers extends URLSearchParams {
  constructor(init2) {
    let result = [];
    if (init2 instanceof Headers) {
      const raw = init2.raw();
      for (const [name, values] of Object.entries(raw)) {
        result.push(...values.map((value) => [name, value]));
      }
    } else if (init2 == null)
      ;
    else if (typeof init2 === "object" && !types.isBoxedPrimitive(init2)) {
      const method = init2[Symbol.iterator];
      if (method == null) {
        result.push(...Object.entries(init2));
      } else {
        if (typeof method !== "function") {
          throw new TypeError("Header pairs must be iterable");
        }
        result = [...init2].map((pair) => {
          if (typeof pair !== "object" || types.isBoxedPrimitive(pair)) {
            throw new TypeError("Each header pair must be an iterable object");
          }
          return [...pair];
        }).map((pair) => {
          if (pair.length !== 2) {
            throw new TypeError("Each header pair must be a name/value tuple");
          }
          return [...pair];
        });
      }
    } else {
      throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
    }
    result = result.length > 0 ? result.map(([name, value]) => {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return [String(name).toLowerCase(), String(value)];
    }) : void 0;
    super(result);
    return new Proxy(this, {
      get(target, p, receiver) {
        switch (p) {
          case "append":
          case "set":
            return (name, value) => {
              validateHeaderName(name);
              validateHeaderValue(name, String(value));
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
            };
          case "delete":
          case "has":
          case "getAll":
            return (name) => {
              validateHeaderName(name);
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
            };
          case "keys":
            return () => {
              target.sort();
              return new Set(URLSearchParams.prototype.keys.call(target)).keys();
            };
          default:
            return Reflect.get(target, p, receiver);
        }
      }
    });
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
  toString() {
    return Object.prototype.toString.call(this);
  }
  get(name) {
    const values = this.getAll(name);
    if (values.length === 0) {
      return null;
    }
    let value = values.join(", ");
    if (/^content-encoding$/i.test(name)) {
      value = value.toLowerCase();
    }
    return value;
  }
  forEach(callback) {
    for (const name of this.keys()) {
      callback(this.get(name), name);
    }
  }
  *values() {
    for (const name of this.keys()) {
      yield this.get(name);
    }
  }
  *entries() {
    for (const name of this.keys()) {
      yield [name, this.get(name)];
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  raw() {
    return [...this.keys()].reduce((result, key) => {
      result[key] = this.getAll(key);
      return result;
    }, {});
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this.keys()].reduce((result, key) => {
      const values = this.getAll(key);
      if (key === "host") {
        result[key] = values[0];
      } else {
        result[key] = values.length > 1 ? values : values[0];
      }
      return result;
    }, {});
  }
}
Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
  result[property] = {enumerable: true};
  return result;
}, {}));
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch (e) {
      return false;
    }
  }));
}
const redirectStatus = new Set([301, 302, 303, 307, 308]);
const isRedirect = (code) => {
  return redirectStatus.has(code);
};
const INTERNALS$1 = Symbol("Response internals");
class Response extends Body {
  constructor(body = null, options = {}) {
    super(body, options);
    const status = options.status || 200;
    const headers = new Headers(options.headers);
    if (body !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(body);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    this[INTERNALS$1] = {
      url: options.url,
      status,
      statusText: options.statusText || "",
      headers,
      counter: options.counter,
      highWaterMark: options.highWaterMark
    };
  }
  get url() {
    return this[INTERNALS$1].url || "";
  }
  get status() {
    return this[INTERNALS$1].status;
  }
  get ok() {
    return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
  }
  get redirected() {
    return this[INTERNALS$1].counter > 0;
  }
  get statusText() {
    return this[INTERNALS$1].statusText;
  }
  get headers() {
    return this[INTERNALS$1].headers;
  }
  get highWaterMark() {
    return this[INTERNALS$1].highWaterMark;
  }
  clone() {
    return new Response(clone(this, this.highWaterMark), {
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected,
      size: this.size
    });
  }
  static redirect(url, status = 302) {
    if (!isRedirect(status)) {
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
    }
    return new Response(null, {
      headers: {
        location: new URL(url).toString()
      },
      status
    });
  }
  get [Symbol.toStringTag]() {
    return "Response";
  }
}
Object.defineProperties(Response.prototype, {
  url: {enumerable: true},
  status: {enumerable: true},
  ok: {enumerable: true},
  redirected: {enumerable: true},
  statusText: {enumerable: true},
  headers: {enumerable: true},
  clone: {enumerable: true}
});
const getSearch = (parsedURL) => {
  if (parsedURL.search) {
    return parsedURL.search;
  }
  const lastOffset = parsedURL.href.length - 1;
  const hash = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
  return parsedURL.href[lastOffset - hash.length] === "?" ? "?" : "";
};
const INTERNALS = Symbol("Request internals");
const isRequest = (object) => {
  return typeof object === "object" && typeof object[INTERNALS] === "object";
};
class Request extends Body {
  constructor(input, init2 = {}) {
    let parsedURL;
    if (isRequest(input)) {
      parsedURL = new URL(input.url);
    } else {
      parsedURL = new URL(input);
      input = {};
    }
    let method = init2.method || input.method || "GET";
    method = method.toUpperCase();
    if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
      throw new TypeError("Request with GET/HEAD method cannot have body");
    }
    const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
    super(inputBody, {
      size: init2.size || input.size || 0
    });
    const headers = new Headers(init2.headers || input.headers || {});
    if (inputBody !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(inputBody, this);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    let signal = isRequest(input) ? input.signal : null;
    if ("signal" in init2) {
      signal = init2.signal;
    }
    if (signal !== null && !isAbortSignal(signal)) {
      throw new TypeError("Expected signal to be an instanceof AbortSignal");
    }
    this[INTERNALS] = {
      method,
      redirect: init2.redirect || input.redirect || "follow",
      headers,
      parsedURL,
      signal
    };
    this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
    this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
    this.counter = init2.counter || input.counter || 0;
    this.agent = init2.agent || input.agent;
    this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
    this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
  }
  get method() {
    return this[INTERNALS].method;
  }
  get url() {
    return format(this[INTERNALS].parsedURL);
  }
  get headers() {
    return this[INTERNALS].headers;
  }
  get redirect() {
    return this[INTERNALS].redirect;
  }
  get signal() {
    return this[INTERNALS].signal;
  }
  clone() {
    return new Request(this);
  }
  get [Symbol.toStringTag]() {
    return "Request";
  }
}
Object.defineProperties(Request.prototype, {
  method: {enumerable: true},
  url: {enumerable: true},
  headers: {enumerable: true},
  redirect: {enumerable: true},
  clone: {enumerable: true},
  signal: {enumerable: true}
});
const getNodeRequestOptions = (request) => {
  const {parsedURL} = request[INTERNALS];
  const headers = new Headers(request[INTERNALS].headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "*/*");
  }
  let contentLengthValue = null;
  if (request.body === null && /^(post|put)$/i.test(request.method)) {
    contentLengthValue = "0";
  }
  if (request.body !== null) {
    const totalBytes = getTotalBytes(request);
    if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
      contentLengthValue = String(totalBytes);
    }
  }
  if (contentLengthValue) {
    headers.set("Content-Length", contentLengthValue);
  }
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "node-fetch");
  }
  if (request.compress && !headers.has("Accept-Encoding")) {
    headers.set("Accept-Encoding", "gzip,deflate,br");
  }
  let {agent} = request;
  if (typeof agent === "function") {
    agent = agent(parsedURL);
  }
  if (!headers.has("Connection") && !agent) {
    headers.set("Connection", "close");
  }
  const search = getSearch(parsedURL);
  const requestOptions = {
    path: parsedURL.pathname + search,
    pathname: parsedURL.pathname,
    hostname: parsedURL.hostname,
    protocol: parsedURL.protocol,
    port: parsedURL.port,
    hash: parsedURL.hash,
    search: parsedURL.search,
    query: parsedURL.query,
    href: parsedURL.href,
    method: request.method,
    headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
    insecureHTTPParser: request.insecureHTTPParser,
    agent
  };
  return requestOptions;
};
class AbortError extends FetchBaseError {
  constructor(message, type = "aborted") {
    super(message, type);
  }
}
const supportedSchemas = new Set(["data:", "http:", "https:"]);
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options.protocol === "data:") {
      const data2 = src(request.url);
      const response2 = new Response(data2, {headers: {"Content-Type": data2.typeFull}});
      resolve2(response2);
      return;
    }
    const send = (options.protocol === "https:" ? https : http).request;
    const {signal} = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof Stream.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error2) {
                reject(error2);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof Stream.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = pipeline(response_, new PassThrough(), (error2) => {
        reject(error2);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: zlib.Z_SYNC_FLUSH,
        finishFlush: zlib.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = pipeline(body, zlib.createGunzip(zlibOptions), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = pipeline(response_, new PassThrough(), (error2) => {
          reject(error2);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = pipeline(body, zlib.createInflate(), (error2) => {
              reject(error2);
            });
          } else {
            body = pipeline(body, zlib.createInflateRaw(), (error2) => {
              reject(error2);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = pipeline(body, zlib.createBrotliDecompress(), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
function noop$1() {
}
function safe_not_equal$1(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
const subscriber_queue$1 = [];
function writable$1(value, start = noop$1) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal$1(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue$1.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s = subscribers[i];
          s[1]();
          subscriber_queue$1.push(s, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue$1.length; i += 2) {
            subscriber_queue$1[i][0](subscriber_queue$1[i + 1]);
          }
          subscriber_queue$1.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop$1) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop$1;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return {set, update, subscribe: subscribe2};
}
function normalize(loaded) {
  if (loaded.error) {
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return {status: 500, error: error2};
    }
    return {status, error: error2};
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
async function get_response({request, options, $session, route, status = 200, error: error2}) {
  const host = options.host || request.headers[options.host_header];
  const dependencies = {};
  const serialized_session = try_serialize($session, (error3) => {
    throw new Error(`Failed to serialize session data: ${error3.message}`);
  });
  const serialized_data = [];
  const match = route && route.pattern.exec(request.path);
  const params = route && route.params(match);
  const page2 = {
    host,
    path: request.path,
    query: request.query,
    params
  };
  let uses_credentials = false;
  const fetcher = async (resource, opts = {}) => {
    let url;
    if (typeof resource === "string") {
      url = resource;
    } else {
      url = resource.url;
      opts = {
        method: resource.method,
        headers: resource.headers,
        body: resource.body,
        mode: resource.mode,
        credentials: resource.credentials,
        cache: resource.cache,
        redirect: resource.redirect,
        referrer: resource.referrer,
        integrity: resource.integrity,
        ...opts
      };
    }
    if (options.local && url.startsWith(options.paths.assets)) {
      url = url.replace(options.paths.assets, "");
    }
    const parsed = parse(url);
    if (opts.credentials !== "omit") {
      uses_credentials = true;
    }
    let response;
    if (parsed.protocol) {
      response = await fetch(parsed.href, opts);
    } else {
      const resolved = resolve(request.path, parsed.pathname);
      const filename = resolved.slice(1);
      const filename_html = `${filename}/index.html`;
      const asset = options.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
      if (asset) {
        if (options.get_static_file) {
          response = new Response(options.get_static_file(asset.file), {
            headers: {
              "content-type": asset.type
            }
          });
        } else {
          response = await fetch(`http://${page2.host}/${asset.file}`, opts);
        }
      }
      if (!response) {
        const rendered2 = await ssr({
          host: request.host,
          method: opts.method || "GET",
          headers: opts.headers || {},
          path: resolved,
          body: opts.body,
          query: new URLSearchParams$1(parsed.query || "")
        }, {
          ...options,
          fetched: url,
          initiator: route
        });
        if (rendered2) {
          dependencies[resolved] = rendered2;
          response = new Response(rendered2.body, {
            status: rendered2.status,
            headers: rendered2.headers
          });
        }
      }
    }
    if (response) {
      const clone2 = response.clone();
      const headers2 = {};
      clone2.headers.forEach((value, key) => {
        if (key !== "etag")
          headers2[key] = value;
      });
      const payload = JSON.stringify({
        status: clone2.status,
        statusText: clone2.statusText,
        headers: headers2,
        body: await clone2.text()
      });
      serialized_data.push({url, payload});
      return response;
    }
    return new Response("Not found", {
      status: 404
    });
  };
  const component_promises = error2 ? [options.manifest.layout()] : [options.manifest.layout(), ...route.parts.map((part) => part.load())];
  const components2 = [];
  const props_promises = [];
  let context = {};
  let maxage;
  if (options.only_render_prerenderable_pages) {
    if (error2)
      return;
    const mod = await component_promises[component_promises.length - 1];
    if (!mod.prerender)
      return;
  }
  for (let i = 0; i < component_promises.length; i += 1) {
    let loaded;
    try {
      const mod = await component_promises[i];
      components2[i] = mod.default;
      if (mod.preload) {
        throw new Error("preload has been deprecated in favour of load. Please consult the documentation: https://kit.svelte.dev/docs#load");
      }
      if (mod.load) {
        loaded = await mod.load.call(null, {
          page: page2,
          get session() {
            uses_credentials = true;
            return $session;
          },
          fetch: fetcher,
          context: {...context}
        });
        if (!loaded)
          return;
      }
    } catch (e) {
      if (error2)
        throw e instanceof Error ? e : new Error(e);
      loaded = {
        error: e instanceof Error ? e : {name: "Error", message: e.toString()},
        status: 500
      };
    }
    if (loaded) {
      loaded = normalize(loaded);
      if (loaded.error) {
        return await get_response({
          request,
          options,
          $session,
          route,
          status: loaded.status,
          error: loaded.error
        });
      }
      if (loaded.redirect) {
        return {
          status: loaded.status,
          headers: {
            location: loaded.redirect
          }
        };
      }
      if (loaded.context) {
        context = {
          ...context,
          ...loaded.context
        };
      }
      maxage = loaded.maxage || 0;
      props_promises[i] = loaded.props;
    }
  }
  const session = writable$1($session);
  let session_tracking_active = false;
  const unsubscribe = session.subscribe(() => {
    if (session_tracking_active)
      uses_credentials = true;
  });
  session_tracking_active = true;
  if (error2) {
    if (options.dev) {
      error2.stack = await options.get_stack(error2);
    } else {
      error2.stack = String(error2);
    }
  }
  const props = {
    status,
    error: error2,
    stores: {
      page: writable$1(null),
      navigating: writable$1(null),
      session
    },
    page: page2,
    components: components2
  };
  for (let i = 0; i < props_promises.length; i += 1) {
    props[`props_${i}`] = await props_promises[i];
  }
  let rendered;
  try {
    rendered = options.root.render(props);
  } catch (e) {
    if (error2)
      throw e instanceof Error ? e : new Error(e);
    return await get_response({
      request,
      options,
      $session,
      route,
      status: 500,
      error: e instanceof Error ? e : {name: "Error", message: e.toString()}
    });
  }
  unsubscribe();
  const js_deps = route ? route.js : [];
  const css_deps = route ? route.css : [];
  const style = route ? route.style : "";
  const s = JSON.stringify;
  const prefix = `${options.paths.assets}/${options.app_dir}`;
  const links = options.amp ? `<style amp-custom>${style || (await Promise.all(css_deps.map((dep) => options.get_amp_css(dep)))).join("\n")}</style>` : [
    ...js_deps.map((dep) => `<link rel="modulepreload" href="${prefix}/${dep}">`),
    ...css_deps.map((dep) => `<link rel="stylesheet" href="${prefix}/${dep}">`)
  ].join("\n			");
  const init2 = options.amp ? `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"></script>` : `
		<script type="module">
			import { start } from ${s(options.entry)};
			start({
				target: ${options.target ? `document.querySelector(${s(options.target)})` : "document.body"},
				paths: ${s(options.paths)},
				status: ${status},
				error: ${serialize_error(error2)},
				session: ${serialized_session},
				nodes: [
					${(route ? route.parts : []).map((part) => `import(${s(options.get_component_path(part.id))})`).join(",\n					")}
				],
				page: {
					host: ${host ? s(host) : "location.host"},
					path: ${s(request.path)},
					query: new URLSearchParams(${s(request.query.toString())}),
					params: ${s(params)}
				}
			});
		</script>`;
  const head = [
    rendered.head,
    style && !options.amp ? `<style data-svelte>${style}</style>` : "",
    links,
    init2
  ].join("\n\n");
  const body = options.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({url, payload}) => `<script type="svelte-data" url="${url}">${payload}</script>`).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${uses_credentials ? "private" : "public"}, max-age=${maxage}`;
  }
  return {
    status,
    headers,
    body: options.template({head, body}),
    dependencies
  };
}
async function render_page(request, route, context, options) {
  if (options.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await (options.setup.getSession && options.setup.getSession({context}));
  const response = await get_response({
    request,
    options,
    $session,
    route,
    status: route ? 200 : 404,
    error: route ? null : new Error(`Not found: ${request.path}`)
  });
  if (response) {
    return response;
  }
  if (options.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${options.fetched}`
    };
  }
}
function try_serialize(data2, fail) {
  try {
    return devalue(data2);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const {name, message, stack} = error2;
    serialized = try_serialize({name, message, stack});
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
async function render_route(request, route, context, options) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler) {
    const match = route.pattern.exec(request.path);
    const params = route.params(match);
    const response = await handler({
      host: options.host || request.headers[options.host_header || "host"],
      path: request.path,
      headers: request.headers,
      query: request.query,
      body: request.body,
      params
    }, context);
    if (response) {
      if (typeof response !== "object" || response.body == null) {
        return {
          status: 500,
          body: `Invalid response from route ${request.path}; ${response.body == null ? "body is missing" : `expected an object, got ${typeof response}`}`,
          headers: {}
        };
      }
      let {status = 200, body, headers = {}} = response;
      headers = lowercase_keys(headers);
      if (typeof body === "object" && !("content-type" in headers) || headers["content-type"] === "application/json") {
        headers = {...headers, "content-type": "application/json"};
        body = JSON.stringify(body);
      }
      return {status, body, headers};
    }
  }
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function md5(body) {
  return createHash("md5").update(body).digest("hex");
}
async function ssr(request, options) {
  if (request.path.endsWith("/") && request.path !== "/") {
    const q = request.query.toString();
    return {
      status: 301,
      headers: {
        location: request.path.slice(0, -1) + (q ? `?${q}` : "")
      }
    };
  }
  const {context, headers = {}} = await (options.setup.prepare && options.setup.prepare({headers: request.headers})) || {};
  try {
    for (const route of options.manifest.routes) {
      if (route.pattern.test(request.path)) {
        const response = route.type === "endpoint" ? await render_route(request, route, context, options) : await render_page(request, route, context, options);
        if (response) {
          if (response.status === 200) {
            if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
              const etag = `"${md5(response.body)}"`;
              if (request.headers["if-none-match"] === etag) {
                return {
                  status: 304,
                  headers: {},
                  body: null
                };
              }
              response.headers["etag"] = etag;
            }
          }
          return {
            status: response.status,
            headers: {...headers, ...response.headers},
            body: response.body,
            dependencies: response.dependencies
          };
        }
      }
    }
    return await render_page(request, null, context, options);
  } catch (e) {
    if (e && e.stack) {
      e.stack = await options.get_stack(e);
    }
    console.error(e && e.stack || e);
    return {
      status: 500,
      headers,
      body: options.dev ? e.stack : e.message
    };
  }
}
function noop() {
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
const escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
const missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
let on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({$$});
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, options = {}) => {
      on_destroy = [];
      const result = {title: "", head: "", css: new Set()};
      const html = $$render(result, props, {}, options);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
const Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {status} = $$props;
  let {error: error2} = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  return `<h1>${escape(status)}</h1>

<p>${escape(error2.message)}</p>


${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
});
var error = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Error$1
});
var root_svelte = "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}";
const css$h = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\timport ErrorComponent from \\"../components/error.svelte\\";\\n\\n\\t// error handling\\n\\texport let status = undefined;\\n\\texport let error = undefined;\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\n\\tconst Layout = components[0];\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title;\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n</script>\\n\\n<Layout {...(props_0 || {})}>\\n\\t{#if error}\\n\\t\\t<ErrorComponent {status} {error}/>\\n\\t{:else}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}/>\\n\\t{/if}\\n</Layout>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\tNavigated to {title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AA0DC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
const Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {status = void 0} = $$props;
  let {error: error2 = void 0} = $$props;
  let {stores} = $$props;
  let {page: page2} = $$props;
  let {components: components2} = $$props;
  let {props_0 = null} = $$props;
  let {props_1 = null} = $$props;
  const Layout = components2[0];
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title;
      }
    });
    mounted = true;
    return unsubscribe;
  });
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page2 !== void 0)
    $$bindings.page(page2);
  if ($$props.components === void 0 && $$bindings.components && components2 !== void 0)
    $$bindings.components(components2);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  $$result.css.add(css$h);
  {
    stores.page.set(page2);
  }
  return `


${validate_component(Layout, "Layout").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${error2 ? `${validate_component(Error$1, "ErrorComponent").$$render($$result, {status, error: error2}, {}, {})}` : `${validate_component(components2[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {})}`}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1j55zn5"}">${navigated ? `Navigated to ${escape(title)}` : ``}</div>` : ``}`;
});
var setup = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
const template = ({head, body}) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <meta name="theme-color" content="#20263a" />
    <meta name="supported-color-scheme" content="dark light" />
    <meta name="color-scheme" content="light dark" />
    <link
      rel="alternate"
      type="application/rss+xml"
      href="https://elianiva.me/rss.xml"
    />

    <!-- don't load global.css async because it's critical -->
    <link href="/global.css" rel="stylesheet" />
    <link rel="manifest" href="manifest.json" crossorigin="use-credentials" />
    <link rel="icon" type="image/png" href="favicon.png" />

    <!-- external resources (fonts) -->
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin="anonymous"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Overpass&display=swap"
      rel="preload"
      as="style"
      onload="this.rel='stylesheet'"
    />
    <link
      href="https://dev-cats.github.io/code-snippets/JetBrainsMono.css"
      rel="preload"
      as="style"
      onload="this.rel='stylesheet'"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap"
      rel="preload"
      as="style"
      onload="this.rel='stylesheet'"
    />

    ` + head + '\n  </head>\n  <body>\n    <div id="svelte">' + body + "</div>\n  </body>\n</html>\n";
function init({paths}) {
}
const empty = () => ({});
const components = [
  () => Promise.resolve().then(function() {
    return index$C;
  }),
  () => Promise.resolve().then(function() {
    return index$B;
  }),
  () => Promise.resolve().then(function() {
    return index$A;
  }),
  () => Promise.resolve().then(function() {
    return index$z;
  }),
  () => Promise.resolve().then(function() {
    return index$y;
  }),
  () => Promise.resolve().then(function() {
    return index$x;
  }),
  () => Promise.resolve().then(function() {
    return index$w;
  }),
  () => Promise.resolve().then(function() {
    return index$v;
  }),
  () => Promise.resolve().then(function() {
    return index$u;
  }),
  () => Promise.resolve().then(function() {
    return index$t;
  }),
  () => Promise.resolve().then(function() {
    return index$s;
  }),
  () => Promise.resolve().then(function() {
    return index$r;
  }),
  () => Promise.resolve().then(function() {
    return index$q;
  }),
  () => Promise.resolve().then(function() {
    return index$p;
  }),
  () => Promise.resolve().then(function() {
    return about;
  }),
  () => Promise.resolve().then(function() {
    return index$o;
  }),
  () => Promise.resolve().then(function() {
    return index$n;
  }),
  () => Promise.resolve().then(function() {
    return index$m;
  }),
  () => Promise.resolve().then(function() {
    return index$l;
  }),
  () => Promise.resolve().then(function() {
    return index$k;
  }),
  () => Promise.resolve().then(function() {
    return index$j;
  }),
  () => Promise.resolve().then(function() {
    return index$i;
  }),
  () => Promise.resolve().then(function() {
    return index$h;
  }),
  () => Promise.resolve().then(function() {
    return index$g;
  }),
  () => Promise.resolve().then(function() {
    return index$f;
  }),
  () => Promise.resolve().then(function() {
    return index$e;
  }),
  () => Promise.resolve().then(function() {
    return index$d;
  }),
  () => Promise.resolve().then(function() {
    return index$c;
  }),
  () => Promise.resolve().then(function() {
    return index$b;
  }),
  () => Promise.resolve().then(function() {
    return index$a;
  }),
  () => Promise.resolve().then(function() {
    return index$9;
  }),
  () => Promise.resolve().then(function() {
    return index$8;
  }),
  () => Promise.resolve().then(function() {
    return index$7;
  }),
  () => Promise.resolve().then(function() {
    return index$6;
  }),
  () => Promise.resolve().then(function() {
    return index$5;
  }),
  () => Promise.resolve().then(function() {
    return index$4;
  }),
  () => Promise.resolve().then(function() {
    return index$3;
  }),
  () => Promise.resolve().then(function() {
    return index$2;
  }),
  () => Promise.resolve().then(function() {
    return index$1;
  }),
  () => Promise.resolve().then(function() {
    return index;
  })
];
const client_component_lookup = {".svelte/build/runtime/internal/start.js": "start-feebe716.js", "src/pages/index.svelte": "pages/index.svelte-a1a44989.js", "src/pages/project/index.svelte": "pages/project/index.svelte-2c549f1a.js", "src/pages/project/brainly-scraper-ts/index.svx": "pages/project/brainly-scraper-ts/index.svx-733f9f8b.js", "src/pages/project/old-personal-site/index.svx": "pages/project/old-personal-site/index.svx-ff4a222a.js", "src/pages/project/nyaa-si-scraper/index.svx": "pages/project/nyaa-si-scraper/index.svx-0f6f4161.js", "src/pages/project/covid-info-v2/index.svx": "pages/project/covid-info-v2/index.svx-449962d7.js", "src/pages/project/svelteception/index.svx": "pages/project/svelteception/index.svx-2aceff78.js", "src/pages/project/school-stuff/index.svx": "pages/project/school-stuff/index.svx-34b83dc3.js", "src/pages/project/covid-info/index.svx": "pages/project/covid-info/index.svx-4de6785a.js", "src/pages/project/kana-board/index.svx": "pages/project/kana-board/index.svx-72aca63a.js", "src/pages/project/umaru-chat/index.svx": "pages/project/umaru-chat/index.svx-84dcb149.js", "src/pages/project/kanaizu/index.svx": "pages/project/kanaizu/index.svx-d7b16fa7.js", "src/pages/project/gh-job/index.svx": "pages/project/gh-job/index.svx-a6844c75.js", "src/pages/project/skaga/index.svx": "pages/project/skaga/index.svx-e8e927e2.js", "src/pages/about.svelte": "pages/about.svelte-9e26e935.js", "src/pages/post/index.svelte": "pages/post/index.svelte-7c4ff67c.js", "src/pages/post/prettify-screenshot-using-imagemagick/index.svx": "pages/post/prettify-screenshot-using-imagemagick/index.svx-4aa67900.js", "src/pages/post/comments-widget-using-utterance/index.svx": "pages/post/comments-widget-using-utterance/index.svx-b6074487.js", "src/pages/post/i-rebuild-my-site-using-sapper/index.svx": "pages/post/i-rebuild-my-site-using-sapper/index.svx-78faca9d.js", "src/pages/post/japanese-input-method-on-linux/index.svx": "pages/post/japanese-input-method-on-linux/index.svx-a7ac99cc.js", "src/pages/post/my-experience-with-svelte/index.svx": "pages/post/my-experience-with-svelte/index.svx-bbcea53f.js", "src/pages/post/how-i-remember-heijitsu/index.svx": "pages/post/how-i-remember-heijitsu/index.svx-3f9d21f0.js", "src/pages/post/neovim-lua-statusline/index.svx": "pages/post/neovim-lua-statusline/index.svx-f28a8c46.js", "src/pages/post/chrome-custom-newtab/index.svx": "pages/post/chrome-custom-newtab/index.svx-0c041cde.js", "src/pages/post/my-spotify-tui-setup/index.svx": "pages/post/my-spotify-tui-setup/index.svx-9e8abac2.js", "src/pages/post/trying-out-sveltekit/index.svx": "pages/post/trying-out-sveltekit/index.svx-163cd0fa.js", "src/pages/post/making-of-my-site-2/index.svx": "pages/post/making-of-my-site-2/index.svx-20b6679a.js", "src/pages/post/making-of-my-site-3/index.svx": "pages/post/making-of-my-site-3/index.svx-06fb39c0.js", "src/pages/post/rest-client-for-vim/index.svx": "pages/post/rest-client-for-vim/index.svx-d6e8b65f.js", "src/pages/post/es6-array-methods/index.svx": "pages/post/es6-array-methods/index.svx-aa7ee9be.js", "src/pages/post/making-of-my-site/index.svx": "pages/post/making-of-my-site/index.svx-4502c57f.js", "src/pages/post/my-nvim-lsp-setup/index.svx": "pages/post/my-nvim-lsp-setup/index.svx-c19eb50c.js", "src/pages/post/my-suckless-setup/index.svx": "pages/post/my-suckless-setup/index.svx-05a39378.js", "src/pages/post/why-i-use-linux/index.svx": "pages/post/why-i-use-linux/index.svx-967c528d.js", "src/pages/post/github-actions/index.svx": "pages/post/github-actions/index.svx-7c46ab41.js", "src/pages/post/vim-statusline/index.svx": "pages/post/vim-statusline/index.svx-2549ab3e.js", "src/pages/post/site-redesign/index.svx": "pages/post/site-redesign/index.svx-fb66ddaf.js", "src/pages/post/thinkpad-x220/index.svx": "pages/post/thinkpad-x220/index.svx-2fea2732.js", "src/pages/post/defx-nvim/index.svx": "pages/post/defx-nvim/index.svx-c73eb244.js", "src/pages/post/2bwm/index.svx": "pages/post/2bwm/index.svx-fc615d65.js"};
const manifest = {
  assets: [{file: "assets/logo/apexcharts.png", size: 8554, type: "image/png"}, {file: "assets/logo/chartjs.png", size: 6940, type: "image/png"}, {file: "assets/logo/deno.png", size: 6360, type: "image/png"}, {file: "assets/logo/firebase.png", size: 10892, type: "image/png"}, {file: "assets/logo/gatsby.png", size: 6833, type: "image/png"}, {file: "assets/logo/leaflet.png", size: 5967, type: "image/png"}, {file: "assets/logo/nextjs.png", size: 1796, type: "image/png"}, {file: "assets/logo/reactjs.png", size: 27890, type: "image/png"}, {file: "assets/logo/redux.png", size: 28351, type: "image/png"}, {file: "assets/logo/routify.png", size: 10304, type: "image/png"}, {file: "assets/logo/rust.png", size: 6452, type: "image/png"}, {file: "assets/logo/sapper.png", size: 6155, type: "image/png"}, {file: "assets/logo/snowpack.png", size: 26535, type: "image/png"}, {file: "assets/logo/svelte-kit.png", size: 3388, type: "image/png"}, {file: "assets/logo/svelte.png", size: 3388, type: "image/png"}, {file: "assets/logo/tailwindcss.png", size: 5417, type: "image/png"}, {file: "assets/logo/twindcss.png", size: 10111, type: "image/png"}, {file: "assets/logo/typescript.png", size: 2397, type: "image/png"}, {file: "assets/logo/vercel.png", size: 3054, type: "image/png"}, {file: "assets/opensauce/mdsvex.png", size: 13412, type: "image/png"}, {file: "assets/opensauce/tinyhttp.png", size: 29057, type: "image/png"}, {file: "assets/opensauce/yrv.png", size: 4908, type: "image/png"}, {file: "assets/post/chrome-custom-newtab/new.png", size: 153525, type: "image/png"}, {file: "assets/post/chrome-custom-newtab/newer.webp", size: 36386, type: "image/webp"}, {file: "assets/post/chrome-custom-newtab/old.png", size: 51258, type: "image/png"}, {file: "assets/post/defx-nvim/after.png", size: 40641, type: "image/png"}, {file: "assets/post/defx-nvim/before.png", size: 9183, type: "image/png"}, {file: "assets/post/defx-nvim/preview.png", size: 5335, type: "image/png"}, {file: "assets/post/github-actions/1.png", size: 39740, type: "image/png"}, {file: "assets/post/github-actions/2.png", size: 4109, type: "image/png"}, {file: "assets/post/github-actions/3.png", size: 59222, type: "image/png"}, {file: "assets/post/github-actions/4.png", size: 5582, type: "image/png"}, {file: "assets/post/github-actions/5.png", size: 26976, type: "image/png"}, {file: "assets/post/japanese-input-method-on-linux/configtool-2.png", size: 44275, type: "image/png"}, {file: "assets/post/japanese-input-method-on-linux/configtool-3.png", size: 18993, type: "image/png"}, {file: "assets/post/japanese-input-method-on-linux/configtool-4.png", size: 12925, type: "image/png"}, {file: "assets/post/japanese-input-method-on-linux/configtool.png", size: 18993, type: "image/png"}, {file: "assets/post/japanese-input-method-on-linux/cover.png", size: 13582, type: "image/png"}, {file: "assets/post/japanese-input-method-on-linux/preview.png", size: 4033, type: "image/png"}, {file: "assets/post/making-of-my-site/button.png", size: 47718, type: "image/png"}, {file: "assets/post/making-of-my-site/cover.png", size: 4070, type: "image/png"}, {file: "assets/post/making-of-my-site/finished-partial.png", size: 59208, type: "image/png"}, {file: "assets/post/making-of-my-site/mobile-finished.png", size: 59669, type: "image/png"}, {file: "assets/post/making-of-my-site/no-button.png", size: 40479, type: "image/png"}, {file: "assets/post/making-of-my-site-2/card.png", size: 22955, type: "image/png"}, {file: "assets/post/making-of-my-site-2/cover.png", size: 4067, type: "image/png"}, {file: "assets/post/making-of-my-site-2/navbar.png", size: 1621, type: "image/png"}, {file: "assets/post/making-of-my-site-2/toc.png", size: 24186, type: "image/png"}, {file: "assets/post/my-experience-with-svelte/kanaizu.png", size: 22681, type: "image/png"}, {file: "assets/post/my-experience-with-svelte/tos.png", size: 67058, type: "image/png"}, {file: "assets/post/neovim-lua-statusline/gitstatus.png", size: 6004, type: "image/png"}, {file: "assets/post/neovim-lua-statusline/result.png", size: 20158, type: "image/png"}, {file: "assets/post/prettify-screenshot-using-imagemagick/rounded.png", size: 43426, type: "image/png"}, {file: "assets/post/prettify-screenshot-using-imagemagick/square.png", size: 31784, type: "image/png"}, {file: "assets/post/site-redesign/new-tag.png", size: 14748, type: "image/png"}, {file: "assets/post/site-redesign/new.png", size: 63954, type: "image/png"}, {file: "assets/post/site-redesign/old-tag.png", size: 34909, type: "image/png"}, {file: "assets/post/site-redesign/old.png", size: 30250, type: "image/png"}, {file: "assets/post/trying-out-sveltekit/preview-2.webp", size: 33630, type: "image/webp"}, {file: "assets/post/trying-out-sveltekit/preview.webp", size: 32444, type: "image/webp"}, {file: "assets/post/trying-out-sveltekit/stop.webp", size: 31238, type: "image/webp"}, {file: "assets/post/vim-statusline/new.png", size: 5575, type: "image/png"}, {file: "assets/post/vim-statusline/old.png", size: 5706, type: "image/png"}, {file: "assets/post/why-i-use-linux/manjaro.png", size: 210455, type: "image/png"}, {file: "assets/project/brainly-scraper-ts/cover.webp", size: 8242, type: "image/webp"}, {file: "assets/project/covid-info/cover.webp", size: 32040, type: "image/webp"}, {file: "assets/project/covid-info-v2/cover.webp", size: 54342, type: "image/webp"}, {file: "assets/project/gh-job/cover.webp", size: 32444, type: "image/webp"}, {file: "assets/project/kana-board/cover.webp", size: 18910, type: "image/webp"}, {file: "assets/project/kanaizu/cover.webp", size: 17784, type: "image/webp"}, {file: "assets/project/nyaa-si-scraper/cover.webp", size: 9504, type: "image/webp"}, {file: "assets/project/nyaa-si-scraper/preview.webp", size: 62550, type: "image/webp"}, {file: "assets/project/old-personal-site/cover.webp", size: 52592, type: "image/webp"}, {file: "assets/project/school-stuff/cover.webp", size: 20164, type: "image/webp"}, {file: "assets/project/skaga/cover.webp", size: 52628, type: "image/webp"}, {file: "assets/project/svelteception/cover.webp", size: 39852, type: "image/webp"}, {file: "assets/project/umaru-chat/cover.webp", size: 10976, type: "image/webp"}, {file: "favicon.png", size: 17217, type: "image/png"}, {file: "global.css", size: 3752, type: "text/css"}, {file: "logo-192.png", size: 17217, type: "image/png"}, {file: "logo-512.png", size: 80087, type: "image/png"}, {file: "manifest.json", size: 448, type: "application/json"}, {file: "prism-night-owl.css", size: 2494, type: "text/css"}, {file: "robots.txt", size: 56, type: "text/plain"}],
  layout: () => Promise.resolve().then(function() {
    return $layout$1;
  }),
  error: () => Promise.resolve().then(function() {
    return error;
  }),
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      parts: [{id: "src/pages/index.svelte", load: components[0]}],
      css: ["assets/start-f3eec3cd.css", "assets/pages/index.svelte-9661a8f0.css", "assets/ProgressButton-42b56f44.css", "assets/PostCard-011f2f01.css", "assets/ProjectCard-e00cf040.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/index.svelte-a1a44989.js", "chunks/ProgressButton-a8e9a313.js", "chunks/PostCard-d8668559.js", "chunks/ProjectCard-0eb22189.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/index.svelte", load: components[1]}],
      css: ["assets/start-f3eec3cd.css", "assets/pages/project/index.svelte-8a40e89b.css", "assets/ProgressButton-42b56f44.css", "assets/ProjectCard-e00cf040.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/index.svelte-2c549f1a.js", "chunks/ProgressButton-a8e9a313.js", "chunks/ProjectCard-0eb22189.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/brainly-scraper-ts\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/brainly-scraper-ts/index.svx", load: components[2]}],
      css: ["assets/start-f3eec3cd.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/brainly-scraper-ts/index.svx-733f9f8b.js", "chunks/project-50086ca8.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/old-personal-site\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/old-personal-site/index.svx", load: components[3]}],
      css: ["assets/start-f3eec3cd.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/old-personal-site/index.svx-ff4a222a.js", "chunks/project-50086ca8.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/nyaa-si-scraper\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/nyaa-si-scraper/index.svx", load: components[4]}],
      css: ["assets/start-f3eec3cd.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/nyaa-si-scraper/index.svx-0f6f4161.js", "chunks/project-50086ca8.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/covid-info-v2\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/covid-info-v2/index.svx", load: components[5]}],
      css: ["assets/start-f3eec3cd.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/covid-info-v2/index.svx-449962d7.js", "chunks/project-50086ca8.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/svelteception\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/svelteception/index.svx", load: components[6]}],
      css: ["assets/start-f3eec3cd.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/svelteception/index.svx-2aceff78.js", "chunks/project-50086ca8.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/school-stuff\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/school-stuff/index.svx", load: components[7]}],
      css: ["assets/start-f3eec3cd.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/school-stuff/index.svx-34b83dc3.js", "chunks/project-50086ca8.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/covid-info\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/covid-info/index.svx", load: components[8]}],
      css: ["assets/start-f3eec3cd.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/covid-info/index.svx-4de6785a.js", "chunks/project-50086ca8.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Chrome-a9500c65.js", "chunks/Update-3be84f0f.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/kana-board\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/kana-board/index.svx", load: components[9]}],
      css: ["assets/start-f3eec3cd.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/kana-board/index.svx-72aca63a.js", "chunks/project-50086ca8.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/umaru-chat\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/umaru-chat/index.svx", load: components[10]}],
      css: ["assets/start-f3eec3cd.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/umaru-chat/index.svx-84dcb149.js", "chunks/project-50086ca8.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/kanaizu\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/kanaizu/index.svx", load: components[11]}],
      css: ["assets/start-f3eec3cd.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/kanaizu/index.svx-d7b16fa7.js", "chunks/project-50086ca8.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/gh-job\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/gh-job/index.svx", load: components[12]}],
      css: ["assets/start-f3eec3cd.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/gh-job/index.svx-a6844c75.js", "chunks/project-50086ca8.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/project\/skaga\/?$/,
      params: empty,
      parts: [{id: "src/pages/project/skaga/index.svx", load: components[13]}],
      css: ["assets/start-f3eec3cd.css", "assets/project-3ffd95cd.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/project/skaga/index.svx-e8e927e2.js", "chunks/project-50086ca8.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Chrome-a9500c65.js"]
    },
    {
      type: "page",
      pattern: /^\/about\/?$/,
      params: empty,
      parts: [{id: "src/pages/about.svelte", load: components[14]}],
      css: ["assets/start-f3eec3cd.css", "assets/pages/about.svelte-04db3cbf.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/about.svelte-9e26e935.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/index.svelte", load: components[15]}],
      css: ["assets/start-f3eec3cd.css", "assets/pages/post/index.svelte-ac1110d4.css", "assets/ProgressButton-42b56f44.css", "assets/PostCard-011f2f01.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/index.svelte-7c4ff67c.js", "chunks/ProgressButton-a8e9a313.js", "chunks/PostCard-d8668559.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/prettify-screenshot-using-imagemagick\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/prettify-screenshot-using-imagemagick/index.svx", load: components[16]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/prettify-screenshot-using-imagemagick/index.svx-4aa67900.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/comments-widget-using-utterance\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/comments-widget-using-utterance/index.svx", load: components[17]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/comments-widget-using-utterance/index.svx-b6074487.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/i-rebuild-my-site-using-sapper\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/i-rebuild-my-site-using-sapper/index.svx", load: components[18]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/i-rebuild-my-site-using-sapper/index.svx-78faca9d.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Update-3be84f0f.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/japanese-input-method-on-linux\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/japanese-input-method-on-linux/index.svx", load: components[19]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/japanese-input-method-on-linux/index.svx-a7ac99cc.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Update-3be84f0f.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/my-experience-with-svelte\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/my-experience-with-svelte/index.svx", load: components[20]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/my-experience-with-svelte/index.svx-bbcea53f.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Update-3be84f0f.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/how-i-remember-heijitsu\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/how-i-remember-heijitsu/index.svx", load: components[21]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/how-i-remember-heijitsu/index.svx-3f9d21f0.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/neovim-lua-statusline\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/neovim-lua-statusline/index.svx", load: components[22]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/neovim-lua-statusline/index.svx-f28a8c46.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Update-3be84f0f.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/chrome-custom-newtab\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/chrome-custom-newtab/index.svx", load: components[23]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/chrome-custom-newtab/index.svx-0c041cde.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Update-3be84f0f.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/my-spotify-tui-setup\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/my-spotify-tui-setup/index.svx", load: components[24]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/my-spotify-tui-setup/index.svx-9e8abac2.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/trying-out-sveltekit\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/trying-out-sveltekit/index.svx", load: components[25]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/trying-out-sveltekit/index.svx-163cd0fa.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Update-3be84f0f.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/making-of-my-site-2\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/making-of-my-site-2/index.svx", load: components[26]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/making-of-my-site-2/index.svx-20b6679a.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/making-of-my-site-3\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/making-of-my-site-3/index.svx", load: components[27]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/making-of-my-site-3/index.svx-06fb39c0.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/rest-client-for-vim\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/rest-client-for-vim/index.svx", load: components[28]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/rest-client-for-vim/index.svx-d6e8b65f.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/es6-array-methods\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/es6-array-methods/index.svx", load: components[29]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/es6-array-methods/index.svx-aa7ee9be.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/making-of-my-site\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/making-of-my-site/index.svx", load: components[30]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/making-of-my-site/index.svx-4502c57f.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/my-nvim-lsp-setup\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/my-nvim-lsp-setup/index.svx", load: components[31]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/my-nvim-lsp-setup/index.svx-c19eb50c.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Update-3be84f0f.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/my-suckless-setup\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/my-suckless-setup/index.svx", load: components[32]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/my-suckless-setup/index.svx-05a39378.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Update-3be84f0f.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/why-i-use-linux\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/why-i-use-linux/index.svx", load: components[33]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/why-i-use-linux/index.svx-967c528d.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/github-actions\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/github-actions/index.svx", load: components[34]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/github-actions/index.svx-7c46ab41.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/vim-statusline\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/vim-statusline/index.svx", load: components[35]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/vim-statusline/index.svx-2549ab3e.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Update-3be84f0f.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/site-redesign\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/site-redesign/index.svx", load: components[36]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css", "assets/Update-fa0093d0.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/site-redesign/index.svx-fb66ddaf.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js", "chunks/Update-3be84f0f.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/thinkpad-x220\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/thinkpad-x220/index.svx", load: components[37]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/thinkpad-x220/index.svx-2fea2732.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/defx-nvim\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/defx-nvim/index.svx", load: components[38]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/defx-nvim/index.svx-c73eb244.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "page",
      pattern: /^\/post\/2bwm\/?$/,
      params: empty,
      parts: [{id: "src/pages/post/2bwm/index.svx", load: components[39]}],
      css: ["assets/start-f3eec3cd.css", "assets/post-b66d8946.css", "assets/ProgressButton-42b56f44.css"],
      js: ["start-feebe716.js", "chunks/stores-bccdb558.js", "chunks/preload-helper-9f12a5fd.js", "chunks/theme-9d96e3c6.js", "pages/post/2bwm/index.svx-fc615d65.js", "chunks/post-00e69cc0.js", "chunks/ProgressButton-a8e9a313.js"]
    },
    {
      type: "endpoint",
      pattern: /^\/api\/project\.json$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return project_json;
      })
    },
    {
      type: "endpoint",
      pattern: /^\/api\/post\.json$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return post_json;
      })
    }
  ]
};
function render(request, {
  paths = {base: "", assets: "/."},
  local = false,
  only_render_prerenderable_pages = false,
  get_static_file
} = {}) {
  return ssr(request, {
    paths,
    local,
    template,
    manifest,
    target: "#svelte",
    entry: "/./_app/start-feebe716.js",
    root: Root,
    setup,
    dev: false,
    amp: false,
    only_render_prerenderable_pages,
    app_dir: "_app",
    host: null,
    host_header: null,
    get_component_path: (id) => "/./_app/" + client_component_lookup[id],
    get_stack: (error2) => error2.stack,
    get_static_file,
    get_amp_css: (dep) => amp_css_lookup[dep]
  });
}
const getStores = () => {
  const stores = getContext("__svelte__");
  return {
    page: {
      subscribe: stores.page.subscribe
    },
    navigating: {
      subscribe: stores.navigating.subscribe
    },
    get preloading() {
      console.error("stores.preloading is deprecated; use stores.navigating instead");
      return {
        subscribe: stores.navigating.subscribe
      };
    },
    session: stores.session
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
const navigating = {
  subscribe(fn) {
    const store = getStores().navigating;
    return store.subscribe(fn);
  }
};
var data = {
  siteName: "Elianiva",
  siteUrl: "https://elianiva.me",
  github: "https://github.com/elianiva",
  twitter: "https://twitter.com/@elianiva_",
  email: "dicha.arkana03@gmail.com",
  desc: "Elianiva's personal website",
  keywords: ["personal", "website", "blog", "article"]
};
const SEO = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const {siteName, siteUrl} = data;
  let {title} = $$props;
  let {isPost = false} = $$props;
  let {thumbnail = false} = $$props;
  let {desc = data.desc} = $$props;
  let {keywords = data.keywords} = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.isPost === void 0 && $$bindings.isPost && isPost !== void 0)
    $$bindings.isPost(isPost);
  if ($$props.thumbnail === void 0 && $$bindings.thumbnail && thumbnail !== void 0)
    $$bindings.thumbnail(thumbnail);
  if ($$props.desc === void 0 && $$bindings.desc && desc !== void 0)
    $$bindings.desc(desc);
  if ($$props.keywords === void 0 && $$bindings.keywords && keywords !== void 0)
    $$bindings.keywords(keywords);
  $$unsubscribe_page();
  return `${$$result.head += `${$$result.title = `<title>${escape(title)} | ${escape(siteName)}</title>`, ""}<link rel="${"canonical"}" href="${escape(siteUrl) + escape($page.path)}" data-svelte="svelte-1piz2fp"><meta name="${"description"}"${add_attribute("content", desc, 0)} data-svelte="svelte-1piz2fp"><meta name="${"keywords"}"${add_attribute("content", keywords.join(",").toLowerCase(), 0)} data-svelte="svelte-1piz2fp"><meta property="${"og:type"}"${add_attribute("content", isPost ? "blog" : "website", 0)} data-svelte="svelte-1piz2fp"><meta property="${"og:url"}" content="${escape(siteUrl) + escape($page.path)}" data-svelte="svelte-1piz2fp"><meta property="${"og:title"}"${add_attribute("content", title || siteName, 0)} data-svelte="svelte-1piz2fp"><meta property="${"og:description"}"${add_attribute("content", desc, 0)} data-svelte="svelte-1piz2fp"><meta property="${"og:image"}"${add_attribute("content", thumbnail ? thumbnail.toString() : "https://avatars3.githubusercontent.com/u/51877647?s=240&v=4", 0)} data-svelte="svelte-1piz2fp"><meta property="${"twitter:card"}"${add_attribute("content", thumbnail ? "summary_large_image" : "summary", 0)} data-svelte="svelte-1piz2fp"><meta property="${"twitter:url"}" content="${escape(siteUrl) + escape($page.path)}" data-svelte="svelte-1piz2fp"><meta property="${"twitter:title"}"${add_attribute("content", title || siteName, 0)} data-svelte="svelte-1piz2fp"><meta property="${"twitter:description"}"${add_attribute("content", desc, 0)} data-svelte="svelte-1piz2fp">${thumbnail ? `<meta property="${"twitter:image"}"${add_attribute("content", thumbnail ? thumbnail.toString() : "", 0)} data-svelte="svelte-1piz2fp">` : ``}`, ""}`;
});
const Circle = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {className} = $$props;
  if ($$props.className === void 0 && $$bindings.className && className !== void 0)
    $$bindings.className(className);
  return `<svg version="${"1.0"}" xmlns="${"http://www.w3.org/2000/svg"}" width="${"1280.000000pt"}" height="${"1280.000000pt"}" viewBox="${"0 0 1280.000000 1280.000000"}" preserveAspectRatio="${"xMidYMid meet"}"${add_attribute("class", className, 0)}><metadata>Created by potrace 1.15, written by Peter Selinger 2001-2017
  </metadata><g transform="${"translate(0.000000,1280.000000) scale(0.100000,-0.100000)"}" fill="${"currentColor"}" stroke="${"none"}"><path d="${"M550 12465 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M1830 12465 c-151 -50 -253 -216 -222 -362 25 -119 136 -230 254\n-255 194 -41 395 142 375 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217\n16z"}"></path><path d="${"M3110 12465 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M4390 12465 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M5670 12465 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M6950 12465 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M8230 12465 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M9510 12465 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M10790 12465 c-105 -35 -200 -141 -222 -248 -25 -117 32 -244 142\n-319 107 -74 229 -75 337 -3 177 118 201 338 53 485 -85 86 -207 119 -310 85z"}"></path><path d="${"M12070 12465 c-105 -35 -200 -141 -222 -248 -25 -117 32 -244 142\n-319 107 -74 229 -75 337 -3 177 118 201 338 53 485 -85 86 -207 119 -310 85z"}"></path><path d="${"M550 11185 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M1830 11185 c-151 -50 -253 -216 -222 -362 25 -119 136 -230 254\n-255 194 -41 395 142 375 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217\n16z"}"></path><path d="${"M3110 11185 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M4390 11185 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M5670 11185 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M6950 11185 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M8230 11185 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M9510 11185 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M10790 11185 c-105 -35 -200 -141 -222 -248 -25 -117 32 -244 142\n-319 107 -74 229 -75 337 -3 177 118 201 338 53 485 -85 86 -207 119 -310 85z"}"></path><path d="${"M12070 11185 c-105 -35 -200 -141 -222 -248 -25 -117 32 -244 142\n-319 107 -74 229 -75 337 -3 177 118 201 338 53 485 -85 86 -207 119 -310 85z"}"></path><path d="${"M550 9905 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M1830 9905 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M3110 9905 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M4390 9905 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M5670 9905 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M6950 9905 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M8230 9905 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M9510 9905 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M10790 9905 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M12070 9905 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M550 8625 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M1830 8625 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M3110 8625 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M4390 8625 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M5670 8625 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M6950 8625 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M8230 8625 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M9510 8625 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M10790 8625 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M12070 8625 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M550 7345 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M1830 7345 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M3110 7345 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M4390 7345 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M5670 7345 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M6950 7345 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M8230 7345 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M9510 7345 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M10790 7345 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M12070 7345 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M550 6065 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M1830 6065 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M3110 6065 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M4390 6065 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M5670 6065 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M6950 6065 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M8230 6065 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M9510 6065 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M10790 6065 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M12070 6065 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M550 4785 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M1830 4785 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M3110 4785 c-105 -35 -200 -141 -222 -248 -25 -117 32 -244 142 -319\n107 -74 229 -75 337 -3 177 118 201 338 53 485 -85 86 -207 119 -310 85z"}"></path><path d="${"M4390 4785 c-105 -35 -200 -141 -222 -248 -25 -117 32 -244 142 -319\n107 -74 229 -75 337 -3 177 118 201 338 53 485 -85 86 -207 119 -310 85z"}"></path><path d="${"M5670 4785 c-151 -50 -253 -216 -222 -362 25 -119 136 -230 255 -255\n193 -41 394 142 374 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M6950 4785 c-151 -50 -253 -216 -222 -362 25 -119 136 -230 255 -255\n193 -41 394 142 374 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M8230 4785 c-151 -50 -253 -216 -222 -362 25 -119 136 -230 255 -255\n193 -41 394 142 374 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M9510 4785 c-151 -50 -253 -216 -222 -362 25 -119 136 -230 255 -255\n193 -41 394 142 374 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M10790 4785 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M12070 4785 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M550 3505 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M1830 3505 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M3110 3505 c-105 -35 -200 -141 -222 -248 -25 -117 32 -244 142 -319\n107 -74 229 -75 337 -3 177 118 201 338 53 485 -85 86 -207 119 -310 85z"}"></path><path d="${"M4390 3505 c-105 -35 -200 -141 -222 -248 -25 -117 32 -244 142 -319\n107 -74 229 -75 337 -3 177 118 201 338 53 485 -85 86 -207 119 -310 85z"}"></path><path d="${"M5670 3505 c-151 -50 -253 -216 -222 -362 25 -119 136 -230 255 -255\n193 -41 394 142 374 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M6950 3505 c-151 -50 -253 -216 -222 -362 25 -119 136 -230 255 -255\n193 -41 394 142 374 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M8230 3505 c-151 -50 -253 -216 -222 -362 25 -119 136 -230 255 -255\n193 -41 394 142 374 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M9510 3505 c-151 -50 -253 -216 -222 -362 25 -119 136 -230 255 -255\n193 -41 394 142 374 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M10790 3505 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M12070 3505 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M550 2225 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M1830 2225 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M3110 2225 c-105 -35 -200 -141 -222 -248 -25 -117 32 -244 142 -319\n107 -74 229 -75 337 -3 177 118 201 338 53 485 -85 86 -207 119 -310 85z"}"></path><path d="${"M4390 2225 c-105 -35 -200 -141 -222 -248 -25 -117 32 -244 142 -319\n107 -74 229 -75 337 -3 177 118 201 338 53 485 -85 86 -207 119 -310 85z"}"></path><path d="${"M5670 2225 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M6950 2225 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M8230 2225 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M9510 2225 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M10790 2225 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M12070 2225 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M550 945 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M1830 945 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M3110 945 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M4390 945 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M5670 945 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M6950 945 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M8230 945 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M9510 945 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369 -369\n155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M10790 945 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path><path d="${"M12070 945 c-105 -35 -200 -141 -222 -248 -43 -206 163 -412 369\n-369 155 32 275 190 260 339 -11 105 -90 213 -190 262 -61 29 -155 36 -217 16z"}"></path></g></svg>`;
});
var Hero_svelte = '.hero.svelte-1q7jx36{position:relative;display:grid;grid-template-columns:20rem 1fr;gap:2rem;align-items:center;justify-items:center;color:var(--color-main-text);max-width:1080px;margin:0 auto}.hero__greet.svelte-1q7jx36{font-size:1.25rem;font-family:"Overpass", sans-serif;font-weight:600;color:var(--color-main-accent)}.hero__name.svelte-1q7jx36{position:relative;display:block;font-family:"Overpass", sans-serif;font-size:clamp(1.25rem, calc(5vw + 1.25rem), 3.5rem);font-weight:600}.hero__role.svelte-1q7jx36{font-family:"Overpass", sans-serif;font-size:clamp(1rem, calc(5vw + 0.5rem), 2rem);display:block}.hero__desc.svelte-1q7jx36{position:relative;display:block;color:var(--color-alt-text);font-family:"Open Sans", sans-serif;font-size:clamp(0.8rem, calc(2vw + 0.5rem), 1.125rem);line-height:1.5em;margin:0 0 1rem}.hero__pict.svelte-1q7jx36{width:clamp(12rem, calc(20vw + 4rem), 16rem);height:clamp(12rem, calc(20vw + 4rem), 16rem);border-radius:10rem;border:0.5rem var(--color-alt-bg) solid;box-shadow:0 0.5rem 1rem rgba(0, 0, 0, 0.1)}.hero__pattern{position:absolute;right:-2rem;top:-2rem;width:clamp(6rem, calc(10vw + 4rem), 12rem);height:12rem;z-index:-1;color:var(--color-main-accent);opacity:0.1}.hero__right.svelte-1q7jx36{position:relative}.hero__right.svelte-1q7jx36::after{position:absolute;content:"</>";bottom:-2rem;left:-2rem;width:3rem;height:4rem;font-size:4rem;font-family:monospace;font-weight:900;color:var(--color-main-accent);opacity:0.1}@media only screen and (max-width: 960px){.hero.svelte-1q7jx36{gap:2rem;grid-template-columns:1fr;grid-template-rows:14rem 1fr;text-align:center;margin-top:0;gap:1rem}.hero__pattern{position:absolute;right:0;top:0;height:6rem;z-index:-1;color:rgba(255, 72, 81, 0.075)}}';
const css$g = {
  code: '.hero.svelte-1q7jx36{position:relative;display:grid;grid-template-columns:20rem 1fr;gap:2rem;align-items:center;justify-items:center;color:var(--color-main-text);max-width:1080px;margin:0 auto}.hero__greet.svelte-1q7jx36{font-size:1.25rem;font-family:"Overpass", sans-serif;font-weight:600;color:var(--color-main-accent)}.hero__name.svelte-1q7jx36{position:relative;display:block;font-family:"Overpass", sans-serif;font-size:clamp(1.25rem, calc(5vw + 1.25rem), 3.5rem);font-weight:600}.hero__role.svelte-1q7jx36{font-family:"Overpass", sans-serif;font-size:clamp(1rem, calc(5vw + 0.5rem), 2rem);display:block}.hero__desc.svelte-1q7jx36{position:relative;display:block;color:var(--color-alt-text);font-family:"Open Sans", sans-serif;font-size:clamp(0.8rem, calc(2vw + 0.5rem), 1.125rem);line-height:1.5em;margin:0 0 1rem}.hero__pict.svelte-1q7jx36{width:clamp(12rem, calc(20vw + 4rem), 16rem);height:clamp(12rem, calc(20vw + 4rem), 16rem);border-radius:10rem;border:0.5rem var(--color-alt-bg) solid;box-shadow:0 0.5rem 1rem rgba(0, 0, 0, 0.1)}.hero__pattern{position:absolute;right:-2rem;top:-2rem;width:clamp(6rem, calc(10vw + 4rem), 12rem);height:12rem;z-index:-1;color:var(--color-main-accent);opacity:0.1}.hero__right.svelte-1q7jx36{position:relative}.hero__right.svelte-1q7jx36::after{position:absolute;content:"</>";bottom:-2rem;left:-2rem;width:3rem;height:4rem;font-size:4rem;font-family:monospace;font-weight:900;color:var(--color-main-accent);opacity:0.1}@media only screen and (max-width: 960px){.hero.svelte-1q7jx36{gap:2rem;grid-template-columns:1fr;grid-template-rows:14rem 1fr;text-align:center;margin-top:0;gap:1rem}.hero__pattern{position:absolute;right:0;top:0;height:6rem;z-index:-1;color:rgba(255, 72, 81, 0.075)}}',
  map: `{"version":3,"file":"Hero.svelte","sources":["Hero.svelte"],"sourcesContent":["<style>\\n.hero {\\n  position: relative;\\n  display: grid;\\n  grid-template-columns: 20rem 1fr;\\n  gap: 2rem;\\n  align-items: center;\\n  justify-items: center;\\n  color: var(--color-main-text);\\n  max-width: 1080px;\\n  margin: 0 auto;\\n}\\n\\n.hero__greet {\\n  font-size: 1.25rem;\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-weight: 600;\\n  color: var(--color-main-accent);\\n}\\n\\n.hero__name {\\n  position: relative;\\n  display: block;\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: clamp(1.25rem, calc(5vw + 1.25rem), 3.5rem);\\n  font-weight: 600;\\n}\\n\\n.hero__role {\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: clamp(1rem, calc(5vw + 0.5rem), 2rem);\\n  display: block;\\n}\\n\\n.hero__desc {\\n  position: relative;\\n  display: block;\\n  color: var(--color-alt-text);\\n  font-family: \\"Open Sans\\", sans-serif;\\n  font-size: clamp(0.8rem, calc(2vw + 0.5rem), 1.125rem);\\n  line-height: 1.5em;\\n  margin: 0 0 1rem;\\n}\\n\\n.hero__pict {\\n  width: clamp(12rem, calc(20vw + 4rem), 16rem);\\n  height: clamp(12rem, calc(20vw + 4rem), 16rem);\\n  border-radius: 10rem;\\n  border: 0.5rem var(--color-alt-bg) solid;\\n  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);\\n}\\n\\n:global(.hero__pattern) {\\n  position: absolute;\\n  right: -2rem;\\n  top: -2rem;\\n  width: clamp(6rem, calc(10vw + 4rem), 12rem);\\n  height: 12rem;\\n  z-index: -1;\\n  color: var(--color-main-accent);\\n  opacity: 0.1;\\n}\\n\\n.hero__right {\\n  position: relative;\\n}\\n\\n.hero__right::after {\\n  position: absolute;\\n  content: \\"</>\\";\\n  bottom: -2rem;\\n  left: -2rem;\\n  width: 3rem;\\n  height: 4rem;\\n  font-size: 4rem;\\n  font-family: monospace;\\n  font-weight: 900;\\n  color: var(--color-main-accent);\\n  opacity: 0.1;\\n}\\n@media only screen and (max-width: 960px) {\\n  .hero {\\n    gap: 2rem;\\n    grid-template-columns: 1fr;\\n    grid-template-rows: 14rem 1fr;\\n    text-align: center;\\n    margin-top: 0;\\n    gap: 1rem;\\n  }\\n  :global(.hero__pattern) {\\n    position: absolute;\\n    right: 0;\\n    top: 0;\\n    height: 6rem;\\n    z-index: -1;\\n    color: rgba(255, 72, 81, 0.075);\\n  }\\n}\\n</style>\\n\\n<section class=\\"hero\\" in:fade={{ duration: 200 }}>\\n  <div class=\\"hero__left\\">\\n    <a href=\\"https://github.com/elianiva\\">\\n      <img\\n        class=\\"hero__pict\\"\\n        src=\\"https://avatars3.githubusercontent.com/u/51877647?s=240&v=4\\"\\n        alt=\\"github profile\\"\\n      />\\n    </a>\\n  </div>\\n  <div class=\\"hero__right\\">\\n    <span class=\\"hero__greet\\">Hi there!</span>\\n    <span class=\\"hero__name\\"> I'm Elianiva. </span>\\n    <span class=\\"hero__role\\">A Frontend Developer and I love Open Source!</span>\\n    <p class=\\"hero__desc\\">\\n      I'm a 17 y/o boi from Indonesia. I love making random websites and\\n      contribute to any open source projects that I like. I also love Anime and\\n      Linux related stuff, such perfect combination to lose your life eh? \u30C4\\n    </p>\\n    <Circle className=\\"hero__pattern\\" />\\n  </div>\\n</section>\\n\\n<script lang=\\"ts\\">import { fade } from \\"svelte/transition\\";\\nimport Circle from \\"$lib/icons/Circle.svelte\\";\\n</script>\\n"],"names":[],"mappings":"AACA,KAAK,eAAC,CAAC,AACL,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,KAAK,CAAC,GAAG,CAChC,GAAG,CAAE,IAAI,CACT,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,MAAM,CACrB,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,IAAI,AAChB,CAAC,AAED,YAAY,eAAC,CAAC,AACZ,SAAS,CAAE,OAAO,CAClB,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,mBAAmB,CAAC,AACjC,CAAC,AAED,WAAW,eAAC,CAAC,AACX,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,KAAK,CACd,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,MAAM,OAAO,CAAC,CAAC,KAAK,GAAG,CAAC,CAAC,CAAC,OAAO,CAAC,CAAC,CAAC,MAAM,CAAC,CACtD,WAAW,CAAE,GAAG,AAClB,CAAC,AAED,WAAW,eAAC,CAAC,AACX,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,MAAM,IAAI,CAAC,CAAC,KAAK,GAAG,CAAC,CAAC,CAAC,MAAM,CAAC,CAAC,CAAC,IAAI,CAAC,CAChD,OAAO,CAAE,KAAK,AAChB,CAAC,AAED,WAAW,eAAC,CAAC,AACX,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,KAAK,CACd,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,WAAW,CAAE,WAAW,CAAC,CAAC,UAAU,CACpC,SAAS,CAAE,MAAM,MAAM,CAAC,CAAC,KAAK,GAAG,CAAC,CAAC,CAAC,MAAM,CAAC,CAAC,CAAC,QAAQ,CAAC,CACtD,WAAW,CAAE,KAAK,CAClB,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,AAClB,CAAC,AAED,WAAW,eAAC,CAAC,AACX,KAAK,CAAE,MAAM,KAAK,CAAC,CAAC,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,KAAK,CAAC,CAC7C,MAAM,CAAE,MAAM,KAAK,CAAC,CAAC,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,KAAK,CAAC,CAC9C,aAAa,CAAE,KAAK,CACpB,MAAM,CAAE,MAAM,CAAC,IAAI,cAAc,CAAC,CAAC,KAAK,CACxC,UAAU,CAAE,CAAC,CAAC,MAAM,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AAC9C,CAAC,AAEO,cAAc,AAAE,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,KAAK,CACZ,GAAG,CAAE,KAAK,CACV,KAAK,CAAE,MAAM,IAAI,CAAC,CAAC,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAAC,CAAC,CAAC,KAAK,CAAC,CAC5C,MAAM,CAAE,KAAK,CACb,OAAO,CAAE,EAAE,CACX,KAAK,CAAE,IAAI,mBAAmB,CAAC,CAC/B,OAAO,CAAE,GAAG,AACd,CAAC,AAED,YAAY,eAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,AACpB,CAAC,AAED,2BAAY,OAAO,AAAC,CAAC,AACnB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,KAAK,CACd,MAAM,CAAE,KAAK,CACb,IAAI,CAAE,KAAK,CACX,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,SAAS,CACtB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,mBAAmB,CAAC,CAC/B,OAAO,CAAE,GAAG,AACd,CAAC,AACD,OAAO,IAAI,CAAC,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACzC,KAAK,eAAC,CAAC,AACL,GAAG,CAAE,IAAI,CACT,qBAAqB,CAAE,GAAG,CAC1B,kBAAkB,CAAE,KAAK,CAAC,GAAG,CAC7B,UAAU,CAAE,MAAM,CAClB,UAAU,CAAE,CAAC,CACb,GAAG,CAAE,IAAI,AACX,CAAC,AACO,cAAc,AAAE,CAAC,AACvB,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,CAAC,CACR,GAAG,CAAE,CAAC,CACN,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,EAAE,CACX,KAAK,CAAE,KAAK,GAAG,CAAC,CAAC,EAAE,CAAC,CAAC,EAAE,CAAC,CAAC,KAAK,CAAC,AACjC,CAAC,AACH,CAAC"}`
};
const Hero = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$g);
  return `<section class="${"hero svelte-1q7jx36"}"><div class="${"hero__left"}"><a href="${"https://github.com/elianiva"}"><img class="${"hero__pict svelte-1q7jx36"}" src="${"https://avatars3.githubusercontent.com/u/51877647?s=240&v=4"}" alt="${"github profile"}"></a></div>
  <div class="${"hero__right svelte-1q7jx36"}"><span class="${"hero__greet svelte-1q7jx36"}">Hi there!</span>
    <span class="${"hero__name svelte-1q7jx36"}">I&#39;m Elianiva. </span>
    <span class="${"hero__role svelte-1q7jx36"}">A Frontend Developer and I love Open Source!</span>
    <p class="${"hero__desc svelte-1q7jx36"}">I&#39;m a 17 y/o boi from Indonesia. I love making random websites and
      contribute to any open source projects that I like. I also love Anime and
      Linux related stuff, such perfect combination to lose your life eh? \u30C4
    </p>
    ${validate_component(Circle, "Circle").$$render($$result, {className: "hero__pattern"}, {}, {})}</div>
</section>`;
});
const Pattern = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {className} = $$props;
  if ($$props.className === void 0 && $$bindings.className && className !== void 0)
    $$bindings.className(className);
  return `<svg width="${"400"}" height="${"166"}" xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("class", className, 0)}><g fill="${"none"}" fill-rule="${"evenodd"}"><g opacity="${".515"}"><path d="${"M1.848 165.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM20.326 162a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM75.76 162a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.305 3.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM205.326 162a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.523 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696z"}" opacity="${".503"}" fill="${"currentColor"}"></path></g><g opacity="${".9"}"><g opacity="${".515"}" fill="${"currentColor"}"><path d="${"M1.848 147.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM20.326 144a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM75.76 144a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.305 3.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM205.326 144a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.523 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696z"}" opacity="${".503"}"></path></g></g><g opacity="${".8"}"><g opacity="${".515"}" fill="${"currentColor"}"><path d="${"M1.848 129.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM20.326 126a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM75.76 126a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.305 3.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM205.326 126a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.523 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696z"}" opacity="${".503"}"></path></g></g><g opacity="${".7"}"><g opacity="${".515"}" fill="${"currentColor"}"><path d="${"M1.848 111.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM20.326 108a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM75.76 108a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.305 3.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM205.326 108a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.523 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696z"}" opacity="${".503"}"></path></g></g><g opacity="${".6"}"><g opacity="${".515"}" fill="${"currentColor"}"><path d="${"M1.848 93.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM20.326 90a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM38.804 90a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM57.283 90a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM75.76 90a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM94.24 90a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.305 3.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM205.326 90a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM260.76 90a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696z"}" opacity="${".503"}"></path></g></g><g opacity="${".5"}"><g opacity="${".515"}" fill="${"currentColor"}"><path d="${"M1.848 75.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM20.326 72a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM38.804 72a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM57.283 72a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM75.76 72a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM94.24 72a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.305 3.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM205.326 72a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM260.76 72a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696z"}" opacity="${".503"}"></path></g></g><g opacity="${".4"}"><g opacity="${".515"}" fill="${"currentColor"}"><path d="${"M1.848 57.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM20.326 54a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM38.804 54a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM57.283 54a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM75.76 54a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM94.24 54a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.305 3.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM205.326 54a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM260.76 54a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696z"}" opacity="${".503"}"></path></g></g><g opacity="${".3"}"><g opacity="${".515"}" fill="${"currentColor"}"><path d="${"M1.848 39.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM20.326 36a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM38.804 36a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM57.283 36a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM75.76 36a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM94.24 36a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.305 3.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM205.326 36a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM260.76 36a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696z"}" opacity="${".503"}"></path></g></g><g opacity="${".2"}"><g opacity="${".515"}" fill="${"currentColor"}"><path d="${"M1.848 21.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM20.326 18a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM38.804 18a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM57.283 18a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM75.76 18a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM94.24 18a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.305 3.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM205.326 18a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM260.76 18a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.52 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.521 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm-351.522 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696z"}" opacity="${".503"}"></path></g></g><g opacity="${".1"}"><g opacity="${".515"}" fill="${"currentColor"}"><path d="${"M1.848 3.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM20.326 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM38.804 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM57.283 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM75.76 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM94.24 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM112.718 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM131.197 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM149.675 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM168.153 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM186.848 3.696a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zm370 0a1.848 1.848 0 1 1 0-3.696 1.848 1.848 0 0 1 0 3.696zM205.326 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM223.804 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM242.283 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM260.76 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM279.24 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM297.718 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM316.197 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM334.675 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zM353.153 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696zm370 0a1.848 1.848 0 1 1 0 3.696 1.848 1.848 0 0 1 0-3.696z"}" opacity="${".503"}"></path></g></g></g></svg>`;
});
const Calendar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {className} = $$props;
  if ($$props.className === void 0 && $$bindings.className && className !== void 0)
    $$bindings.className(className);
  return `<svg width="${"16"}" height="${"16"}" viewBox="${"0 0 24 24"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("class", className, 0)}><path d="${"M8 9C7.44772 9 7 9.44771 7 10C7 10.5523 7.44772 11 8 11H16C16.5523 11 17 10.5523 17 10C17 9.44771 16.5523 9 16 9H8Z"}" fill="${"currentColor"}"></path><path fill-rule="${"evenodd"}" clip-rule="${"evenodd"}" d="${"M6 3C4.34315 3 3 4.34315 3 6V18C3 19.6569 4.34315 21 6 21H18C19.6569 21 21 19.6569 21 18V6C21 4.34315 19.6569 3 18 3H6ZM5 18V7H19V18C19 18.5523 18.5523 19 18 19H6C5.44772 19 5 18.5523 5 18Z"}" fill="${"currentColor"}"></path></svg>`;
});
var PostCard_svelte = '.card.svelte-1ykhpzu.svelte-1ykhpzu{overflow:hidden;border:0.0625rem var(--color-borders) solid;text-align:left;background-color:var(--color-alt-bg);z-index:2}.card__details.svelte-1ykhpzu.svelte-1ykhpzu{color:var(--color-main-text);text-decoration:none;padding:1rem;display:grid;grid-template-rows:3.5rem 2rem 5.5rem 1fr}.card__title.svelte-1ykhpzu.svelte-1ykhpzu{font-family:"Overpass", sans-serif;font-size:1.25rem;font-weight:600;line-height:1.5em;text-transform:capitalize;transition:all ease-out 0.1s}.card__desc.svelte-1ykhpzu.svelte-1ykhpzu{border-top:0.0625rem var(--color-borders) solid;font-family:"Open Sans", sans-serif;line-height:1.5em;color:var(--color-alt-text);margin-top:0.25rem;padding-top:0.5rem}.card__date.svelte-1ykhpzu.svelte-1ykhpzu{font-family:"Overpass", sans-serif;display:flex;gap:0.4rem;align-items:center;justify-self:start;font-size:0.8rem;color:var(--color-alt-text)}.card__date.svelte-1ykhpzu .date__icon{width:1rem;height:1rem;display:block;margin-top:-0.25rem}.card__tags.svelte-1ykhpzu.svelte-1ykhpzu{display:flex;gap:0.5rem}.card__tag.svelte-1ykhpzu.svelte-1ykhpzu{background-color:var(--color-special-bg);font-family:"Overpass", sans-serif;font-weight:600;color:var(--color-main-text);font-size:0.8rem;text-decoration:none;gap:0.5rem;padding:0.25rem 0.5rem;margin-top:0.5rem;border-radius:0.25rem;transition:filter ease-out 0.2s;text-transform:capitalize}.card__tag.svelte-1ykhpzu.svelte-1ykhpzu:hover{filter:brightness(1.2)}.card__tag.svelte-1ykhpzu.svelte-1ykhpzu::before{content:"# ";font-weight:600}@media only screen and (min-width: 480px){.card__details.svelte-1ykhpzu:hover .card__title.svelte-1ykhpzu{color:var(--color-main-accent)}}';
const css$f = {
  code: '.card.svelte-1ykhpzu.svelte-1ykhpzu{overflow:hidden;border:0.0625rem var(--color-borders) solid;text-align:left;background-color:var(--color-alt-bg);z-index:2}.card__details.svelte-1ykhpzu.svelte-1ykhpzu{color:var(--color-main-text);text-decoration:none;padding:1rem;display:grid;grid-template-rows:3.5rem 2rem 5.5rem 1fr}.card__title.svelte-1ykhpzu.svelte-1ykhpzu{font-family:"Overpass", sans-serif;font-size:1.25rem;font-weight:600;line-height:1.5em;text-transform:capitalize;transition:all ease-out 0.1s}.card__desc.svelte-1ykhpzu.svelte-1ykhpzu{border-top:0.0625rem var(--color-borders) solid;font-family:"Open Sans", sans-serif;line-height:1.5em;color:var(--color-alt-text);margin-top:0.25rem;padding-top:0.5rem}.card__date.svelte-1ykhpzu.svelte-1ykhpzu{font-family:"Overpass", sans-serif;display:flex;gap:0.4rem;align-items:center;justify-self:start;font-size:0.8rem;color:var(--color-alt-text)}.card__date.svelte-1ykhpzu .date__icon{width:1rem;height:1rem;display:block;margin-top:-0.25rem}.card__tags.svelte-1ykhpzu.svelte-1ykhpzu{display:flex;gap:0.5rem}.card__tag.svelte-1ykhpzu.svelte-1ykhpzu{background-color:var(--color-special-bg);font-family:"Overpass", sans-serif;font-weight:600;color:var(--color-main-text);font-size:0.8rem;text-decoration:none;gap:0.5rem;padding:0.25rem 0.5rem;margin-top:0.5rem;border-radius:0.25rem;transition:filter ease-out 0.2s;text-transform:capitalize}.card__tag.svelte-1ykhpzu.svelte-1ykhpzu:hover{filter:brightness(1.2)}.card__tag.svelte-1ykhpzu.svelte-1ykhpzu::before{content:"# ";font-weight:600}@media only screen and (min-width: 480px){.card__details.svelte-1ykhpzu:hover .card__title.svelte-1ykhpzu{color:var(--color-main-accent)}}',
  map: '{"version":3,"file":"PostCard.svelte","sources":["PostCard.svelte"],"sourcesContent":["<style>\\n.card {\\n  overflow: hidden;\\n  border: 0.0625rem var(--color-borders) solid;\\n  text-align: left;\\n  background-color: var(--color-alt-bg);\\n  z-index: 2;\\n}\\n\\n.card__details {\\n  color: var(--color-main-text);\\n  text-decoration: none;\\n  padding: 1rem;\\n  display: grid;\\n  grid-template-rows: 3.5rem 2rem 5.5rem 1fr;\\n}\\n\\n.card__title {\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: 1.25rem;\\n  font-weight: 600;\\n  line-height: 1.5em;\\n  text-transform: capitalize;\\n  transition: all ease-out 0.1s;\\n}\\n\\n.card__desc {\\n  border-top: 0.0625rem var(--color-borders) solid;\\n  font-family: \\"Open Sans\\", sans-serif;\\n  line-height: 1.5em;\\n  color: var(--color-alt-text);\\n  margin-top: 0.25rem;\\n  padding-top: 0.5rem;\\n}\\n\\n.card__date {\\n  font-family: \\"Overpass\\", sans-serif;\\n  display: flex;\\n  gap: 0.4rem;\\n  align-items: center;\\n  justify-self: start;\\n  font-size: 0.8rem;\\n  color: var(--color-alt-text);\\n}\\n\\n.card__date :global(.date__icon) {\\n  width: 1rem;\\n  height: 1rem;\\n  display: block;\\n  margin-top: -0.25rem;\\n}\\n\\n.card__tags {\\n  display: flex;\\n  gap: 0.5rem;\\n}\\n\\n.card__tag {\\n  background-color: var(--color-special-bg);\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-weight: 600;\\n  color: var(--color-main-text);\\n  font-size: 0.8rem;\\n  text-decoration: none;\\n  gap: 0.5rem;\\n  padding: 0.25rem 0.5rem;\\n  margin-top: 0.5rem;\\n  border-radius: 0.25rem;\\n  transition: filter ease-out 0.2s;\\n  text-transform: capitalize;\\n}\\n\\n.card__tag:hover {\\n  filter: brightness(1.2);\\n}\\n\\n.card__tag::before {\\n  content: \\"# \\";\\n  font-weight: 600;\\n}\\n\\n@media only screen and (min-width: 480px) {\\n  .card__details:hover .card__title {\\n    color: var(--color-main-accent);\\n  }\\n}\\n</style>\\n\\n<div class=\\"card\\" in:fade={{ duration: 200 }}>\\n  <a rel=\\"prefetch\\" {href} class=\\"card__details\\">\\n    <span class=\\"card__title\\">{title}</span>\\n    <div class=\\"card__date\\">\\n      <Calendar className=\\"date__icon\\" />\\n      <span class=\\"date__label\\">\\n        {new Date(date).toLocaleDateString(\\"en-GB\\", {\\n          day: \\"numeric\\",\\n          month: \\"long\\",\\n          year: \\"numeric\\",\\n        })}\\n      </span>\\n    </div>\\n    <p class=\\"card__desc\\">{desc}</p>\\n    <div class=\\"card__tags\\">\\n      {#each tags as tag}<span class=\\"card__tag\\">{tag}</span>{/each}\\n    </div>\\n  </a>\\n</div>\\n\\n<script lang=\\"ts\\">import { fade } from \\"svelte/transition\\";\\nimport Calendar from \\"$lib/icons/Calendar.svelte\\";\\nexport let title;\\nexport let desc;\\nexport let href;\\nexport let date;\\nexport let tags;\\n</script>\\n"],"names":[],"mappings":"AACA,KAAK,8BAAC,CAAC,AACL,QAAQ,CAAE,MAAM,CAChB,MAAM,CAAE,SAAS,CAAC,IAAI,eAAe,CAAC,CAAC,KAAK,CAC5C,UAAU,CAAE,IAAI,CAChB,gBAAgB,CAAE,IAAI,cAAc,CAAC,CACrC,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,cAAc,8BAAC,CAAC,AACd,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,eAAe,CAAE,IAAI,CACrB,OAAO,CAAE,IAAI,CACb,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,MAAM,CAAC,IAAI,CAAC,MAAM,CAAC,GAAG,AAC5C,CAAC,AAED,YAAY,8BAAC,CAAC,AACZ,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,OAAO,CAClB,WAAW,CAAE,GAAG,CAChB,WAAW,CAAE,KAAK,CAClB,cAAc,CAAE,UAAU,CAC1B,UAAU,CAAE,GAAG,CAAC,QAAQ,CAAC,IAAI,AAC/B,CAAC,AAED,WAAW,8BAAC,CAAC,AACX,UAAU,CAAE,SAAS,CAAC,IAAI,eAAe,CAAC,CAAC,KAAK,CAChD,WAAW,CAAE,WAAW,CAAC,CAAC,UAAU,CACpC,WAAW,CAAE,KAAK,CAClB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,UAAU,CAAE,OAAO,CACnB,WAAW,CAAE,MAAM,AACrB,CAAC,AAED,WAAW,8BAAC,CAAC,AACX,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,MAAM,CACX,WAAW,CAAE,MAAM,CACnB,YAAY,CAAE,KAAK,CACnB,SAAS,CAAE,MAAM,CACjB,KAAK,CAAE,IAAI,gBAAgB,CAAC,AAC9B,CAAC,AAED,0BAAW,CAAC,AAAQ,WAAW,AAAE,CAAC,AAChC,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,KAAK,CACd,UAAU,CAAE,QAAQ,AACtB,CAAC,AAED,WAAW,8BAAC,CAAC,AACX,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,MAAM,AACb,CAAC,AAED,UAAU,8BAAC,CAAC,AACV,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,CACzC,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,SAAS,CAAE,MAAM,CACjB,eAAe,CAAE,IAAI,CACrB,GAAG,CAAE,MAAM,CACX,OAAO,CAAE,OAAO,CAAC,MAAM,CACvB,UAAU,CAAE,MAAM,CAClB,aAAa,CAAE,OAAO,CACtB,UAAU,CAAE,MAAM,CAAC,QAAQ,CAAC,IAAI,CAChC,cAAc,CAAE,UAAU,AAC5B,CAAC,AAED,wCAAU,MAAM,AAAC,CAAC,AAChB,MAAM,CAAE,WAAW,GAAG,CAAC,AACzB,CAAC,AAED,wCAAU,QAAQ,AAAC,CAAC,AAClB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,GAAG,AAClB,CAAC,AAED,OAAO,IAAI,CAAC,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACzC,6BAAc,MAAM,CAAC,YAAY,eAAC,CAAC,AACjC,KAAK,CAAE,IAAI,mBAAmB,CAAC,AACjC,CAAC,AACH,CAAC"}'
};
const PostCard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {title} = $$props;
  let {desc} = $$props;
  let {href} = $$props;
  let {date} = $$props;
  let {tags} = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.desc === void 0 && $$bindings.desc && desc !== void 0)
    $$bindings.desc(desc);
  if ($$props.href === void 0 && $$bindings.href && href !== void 0)
    $$bindings.href(href);
  if ($$props.date === void 0 && $$bindings.date && date !== void 0)
    $$bindings.date(date);
  if ($$props.tags === void 0 && $$bindings.tags && tags !== void 0)
    $$bindings.tags(tags);
  $$result.css.add(css$f);
  return `<div class="${"card svelte-1ykhpzu"}"><a rel="${"prefetch"}"${add_attribute("href", href, 0)} class="${"card__details svelte-1ykhpzu"}"><span class="${"card__title svelte-1ykhpzu"}">${escape(title)}</span>
    <div class="${"card__date svelte-1ykhpzu"}">${validate_component(Calendar, "Calendar").$$render($$result, {className: "date__icon"}, {}, {})}
      <span class="${"date__label"}">${escape(new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }))}</span></div>
    <p class="${"card__desc svelte-1ykhpzu"}">${escape(desc)}</p>
    <div class="${"card__tags svelte-1ykhpzu"}">${each(tags, (tag) => `<span class="${"card__tag svelte-1ykhpzu"}">${escape(tag)}</span>`)}</div></a>
</div>`;
});
const Code = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {className} = $$props;
  if ($$props.className === void 0 && $$bindings.className && className !== void 0)
    $$bindings.className(className);
  return `<svg xmlns="${"http://www.w3.org/2000/svg"}" width="${"24"}" height="${"24"}" viewBox="${"0 0 24 24"}" fill="${"none"}" stroke="${"currentColor"}" stroke-width="${"2"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}"${add_attribute("class", "feather feather-code" + className, 0)}><polyline points="${"16 18 22 12 16 6"}"></polyline><polyline points="${"8 6 2 12 8 18"}"></polyline></svg>`;
});
const Chrome = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {className} = $$props;
  if ($$props.className === void 0 && $$bindings.className && className !== void 0)
    $$bindings.className(className);
  return `<svg xmlns="${"http://www.w3.org/2000/svg"}" width="${"24"}" height="${"24"}" viewBox="${"0 0 24 24"}" fill="${"none"}" stroke="${"currentColor"}" stroke-width="${"2"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}"${add_attribute("class", "feather feather-chrome" + className, 0)}><circle cx="${"12"}" cy="${"12"}" r="${"10"}"></circle><circle cx="${"12"}" cy="${"12"}" r="${"4"}"></circle><line x1="${"21.17"}" y1="${"8"}" x2="${"12"}" y2="${"8"}"></line><line x1="${"3.95"}" y1="${"6.06"}" x2="${"8.54"}" y2="${"14"}"></line><line x1="${"10.88"}" y1="${"21.94"}" x2="${"15.46"}" y2="${"14"}"></line></svg>`;
});
var ProjectCard_svelte = '.card.svelte-171a7r5{overflow:hidden;border:0.0625rem var(--color-borders) solid;text-align:left;background-color:var(--color-alt-bg)}.card__img.svelte-171a7r5{position:relative;display:block;width:100%;height:12rem;object-fit:cover;background-color:var(--color-borders);z-index:2}.card__details.svelte-171a7r5{padding:1rem;display:grid;grid-template-rows:2rem 4.5rem 1fr;border-top:0.0625rem var(--color-borders) solid}.card__title.svelte-171a7r5{text-decoration:none;color:var(--color-main-text);font-family:"Overpass", sans-serif;font-size:1.25rem;font-weight:600;line-height:1.5em;transition:all ease-out 0.2s}.card__title.svelte-171a7r5:hover{color:var(--color-main-accent)}.card__desc.svelte-171a7r5{font-family:"Open Sans", sans-serif;line-height:1.5em;color:var(--color-alt-text)}.card__links.svelte-171a7r5{display:flex;gap:0.75rem;margin-top:0.5rem}.card__demo.svelte-171a7r5,.card__source.svelte-171a7r5{font-family:"Overpass", sans-serif;text-decoration:none;display:flex;align-items:center;gap:0.5rem;padding:0.25rem 0.5rem;border-radius:0.25rem;transition:filter ease-out 0.2s}.card__demo.svelte-171a7r5:hover,.card__source.svelte-171a7r5:hover{filter:brightness(1.2)}.card__demo.svelte-171a7r5{background-color:var(--color-main-accent);color:#f4f4f4}.card__source.svelte-171a7r5{background-color:var(--color-special-bg);color:var(--color-alt-text)}.card__icon{width:1.125rem;height:1.125rem}.card.svelte-171a7r5 .wrapper{display:block}@media only screen and (min-width: 480px){.card__details.svelte-171a7r5:hover{color:var(--color-main-accent)}}';
const css$e = {
  code: '.card.svelte-171a7r5{overflow:hidden;border:0.0625rem var(--color-borders) solid;text-align:left;background-color:var(--color-alt-bg)}.card__img.svelte-171a7r5{position:relative;display:block;width:100%;height:12rem;object-fit:cover;background-color:var(--color-borders);z-index:2}.card__details.svelte-171a7r5{padding:1rem;display:grid;grid-template-rows:2rem 4.5rem 1fr;border-top:0.0625rem var(--color-borders) solid}.card__title.svelte-171a7r5{text-decoration:none;color:var(--color-main-text);font-family:"Overpass", sans-serif;font-size:1.25rem;font-weight:600;line-height:1.5em;transition:all ease-out 0.2s}.card__title.svelte-171a7r5:hover{color:var(--color-main-accent)}.card__desc.svelte-171a7r5{font-family:"Open Sans", sans-serif;line-height:1.5em;color:var(--color-alt-text)}.card__links.svelte-171a7r5{display:flex;gap:0.75rem;margin-top:0.5rem}.card__demo.svelte-171a7r5,.card__source.svelte-171a7r5{font-family:"Overpass", sans-serif;text-decoration:none;display:flex;align-items:center;gap:0.5rem;padding:0.25rem 0.5rem;border-radius:0.25rem;transition:filter ease-out 0.2s}.card__demo.svelte-171a7r5:hover,.card__source.svelte-171a7r5:hover{filter:brightness(1.2)}.card__demo.svelte-171a7r5{background-color:var(--color-main-accent);color:#f4f4f4}.card__source.svelte-171a7r5{background-color:var(--color-special-bg);color:var(--color-alt-text)}.card__icon{width:1.125rem;height:1.125rem}.card.svelte-171a7r5 .wrapper{display:block}@media only screen and (min-width: 480px){.card__details.svelte-171a7r5:hover{color:var(--color-main-accent)}}',
  map: `{"version":3,"file":"ProjectCard.svelte","sources":["ProjectCard.svelte"],"sourcesContent":["<style>\\n.card {\\n  overflow: hidden;\\n  border: 0.0625rem var(--color-borders) solid;\\n  text-align: left;\\n  background-color: var(--color-alt-bg);\\n}\\n\\n.card__img {\\n  position: relative;\\n  display: block;\\n  width: 100%;\\n  height: 12rem;\\n  object-fit: cover;\\n  background-color: var(--color-borders);\\n  z-index: 2;\\n}\\n\\n.card__details {\\n  padding: 1rem;\\n  display: grid;\\n  grid-template-rows: 2rem 4.5rem 1fr;\\n  border-top: 0.0625rem var(--color-borders) solid;\\n}\\n\\n.card__title {\\n  text-decoration: none;\\n  color: var(--color-main-text);\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: 1.25rem;\\n  font-weight: 600;\\n  line-height: 1.5em;\\n  transition: all ease-out 0.2s;\\n}\\n\\n.card__title:hover {\\n  color: var(--color-main-accent);\\n}\\n\\n.card__desc {\\n  font-family: \\"Open Sans\\", sans-serif;\\n  line-height: 1.5em;\\n  color: var(--color-alt-text);\\n}\\n\\n.card__links {\\n  display: flex;\\n  gap: 0.75rem;\\n  margin-top: 0.5rem;\\n}\\n\\n.card__demo,\\n.card__source {\\n  font-family: \\"Overpass\\", sans-serif;\\n  text-decoration: none;\\n  display: flex;\\n  align-items: center;\\n  gap: 0.5rem;\\n  padding: 0.25rem 0.5rem;\\n  border-radius: 0.25rem;\\n  transition: filter ease-out 0.2s;\\n}\\n\\n.card__demo:hover,\\n.card__source:hover {\\n  filter: brightness(1.2);\\n}\\n\\n.card__demo {\\n  background-color: var(--color-main-accent);\\n  color: #f4f4f4;\\n}\\n\\n.card__source {\\n  background-color: var(--color-special-bg);\\n  color: var(--color-alt-text);\\n}\\n\\n:global(.card__icon) {\\n  width: 1.125rem;\\n  height: 1.125rem;\\n}\\n\\n.card :global(.wrapper) {\\n  display: block;\\n}\\n\\n@media only screen and (min-width: 480px) {\\n  .card__details:hover {\\n    color: var(--color-main-accent);\\n  }\\n}\\n</style>\\n\\n<div class=\\"card\\" in:fade={{ duration: 200 }}>\\n  <svelte:component this={Waypoint} throttle=\\"500\\" offset=\\"320\\">\\n    <img class=\\"card__img\\" src={imgSrc} alt={title} loading=\\"lazy\\" />\\n  </svelte:component>\\n  <div class=\\"card__details\\">\\n    <a rel=\\"prefetch\\" {href} class=\\"card__title\\">{title}</a>\\n    <p class=\\"card__desc\\">{desc}</p>\\n    <div class=\\"card__links\\">\\n      {#if demo}\\n        <a\\n          class=\\"card__demo\\"\\n          href={demo ? demo : \\"#\\"}\\n          target=\\"_blank\\"\\n          rel=\\"norel noreferrer\\"><Chrome className=\\"card__icon\\" />Demo</a\\n        >\\n      {/if}\\n      <a\\n        class=\\"card__source\\"\\n        href={source}\\n        target=\\"_blank\\"\\n        rel=\\"norel noreferrer\\"><Code className=\\"card__icon\\" />Source</a\\n      >\\n    </div>\\n  </div>\\n</div>\\n\\n<script lang=\\"ts\\">import { fade } from \\"svelte/transition\\";\\nimport Code from \\"$lib/icons/Code.svelte\\";\\nimport Chrome from \\"$lib/icons/Chrome.svelte\\";\\nimport { onMount } from \\"svelte\\";\\nlet Waypoint; // this doesn't have TS declaration so..\\nonMount(async () => {\\n    const module = await import(\\"svelte-waypoint\\");\\n    Waypoint = module.default;\\n});\\nexport let title;\\nexport let imgSrc;\\nexport let desc;\\nexport let href;\\nexport let demo;\\nexport let source;\\n</script>\\n"],"names":[],"mappings":"AACA,KAAK,eAAC,CAAC,AACL,QAAQ,CAAE,MAAM,CAChB,MAAM,CAAE,SAAS,CAAC,IAAI,eAAe,CAAC,CAAC,KAAK,CAC5C,UAAU,CAAE,IAAI,CAChB,gBAAgB,CAAE,IAAI,cAAc,CAAC,AACvC,CAAC,AAED,UAAU,eAAC,CAAC,AACV,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,KAAK,CACd,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,KAAK,CACb,UAAU,CAAE,KAAK,CACjB,gBAAgB,CAAE,IAAI,eAAe,CAAC,CACtC,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,cAAc,eAAC,CAAC,AACd,OAAO,CAAE,IAAI,CACb,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,IAAI,CAAC,MAAM,CAAC,GAAG,CACnC,UAAU,CAAE,SAAS,CAAC,IAAI,eAAe,CAAC,CAAC,KAAK,AAClD,CAAC,AAED,YAAY,eAAC,CAAC,AACZ,eAAe,CAAE,IAAI,CACrB,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,OAAO,CAClB,WAAW,CAAE,GAAG,CAChB,WAAW,CAAE,KAAK,CAClB,UAAU,CAAE,GAAG,CAAC,QAAQ,CAAC,IAAI,AAC/B,CAAC,AAED,2BAAY,MAAM,AAAC,CAAC,AAClB,KAAK,CAAE,IAAI,mBAAmB,CAAC,AACjC,CAAC,AAED,WAAW,eAAC,CAAC,AACX,WAAW,CAAE,WAAW,CAAC,CAAC,UAAU,CACpC,WAAW,CAAE,KAAK,CAClB,KAAK,CAAE,IAAI,gBAAgB,CAAC,AAC9B,CAAC,AAED,YAAY,eAAC,CAAC,AACZ,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,OAAO,CACZ,UAAU,CAAE,MAAM,AACpB,CAAC,AAED,0BAAW,CACX,aAAa,eAAC,CAAC,AACb,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,eAAe,CAAE,IAAI,CACrB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,GAAG,CAAE,MAAM,CACX,OAAO,CAAE,OAAO,CAAC,MAAM,CACvB,aAAa,CAAE,OAAO,CACtB,UAAU,CAAE,MAAM,CAAC,QAAQ,CAAC,IAAI,AAClC,CAAC,AAED,0BAAW,MAAM,CACjB,4BAAa,MAAM,AAAC,CAAC,AACnB,MAAM,CAAE,WAAW,GAAG,CAAC,AACzB,CAAC,AAED,WAAW,eAAC,CAAC,AACX,gBAAgB,CAAE,IAAI,mBAAmB,CAAC,CAC1C,KAAK,CAAE,OAAO,AAChB,CAAC,AAED,aAAa,eAAC,CAAC,AACb,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,CACzC,KAAK,CAAE,IAAI,gBAAgB,CAAC,AAC9B,CAAC,AAEO,WAAW,AAAE,CAAC,AACpB,KAAK,CAAE,QAAQ,CACf,MAAM,CAAE,QAAQ,AAClB,CAAC,AAED,oBAAK,CAAC,AAAQ,QAAQ,AAAE,CAAC,AACvB,OAAO,CAAE,KAAK,AAChB,CAAC,AAED,OAAO,IAAI,CAAC,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACzC,6BAAc,MAAM,AAAC,CAAC,AACpB,KAAK,CAAE,IAAI,mBAAmB,CAAC,AACjC,CAAC,AACH,CAAC"}`
};
const ProjectCard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let Waypoint;
  onMount(async () => {
    const module = await import("svelte-waypoint");
    Waypoint = module.default;
  });
  let {title} = $$props;
  let {imgSrc} = $$props;
  let {desc} = $$props;
  let {href} = $$props;
  let {demo} = $$props;
  let {source} = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.imgSrc === void 0 && $$bindings.imgSrc && imgSrc !== void 0)
    $$bindings.imgSrc(imgSrc);
  if ($$props.desc === void 0 && $$bindings.desc && desc !== void 0)
    $$bindings.desc(desc);
  if ($$props.href === void 0 && $$bindings.href && href !== void 0)
    $$bindings.href(href);
  if ($$props.demo === void 0 && $$bindings.demo && demo !== void 0)
    $$bindings.demo(demo);
  if ($$props.source === void 0 && $$bindings.source && source !== void 0)
    $$bindings.source(source);
  $$result.css.add(css$e);
  return `<div class="${"card svelte-171a7r5"}">${validate_component(Waypoint || missing_component, "svelte:component").$$render($$result, {throttle: "500", offset: "320"}, {}, {
    default: () => `<img class="${"card__img svelte-171a7r5"}"${add_attribute("src", imgSrc, 0)}${add_attribute("alt", title, 0)} loading="${"lazy"}">`
  })}
  <div class="${"card__details svelte-171a7r5"}"><a rel="${"prefetch"}"${add_attribute("href", href, 0)} class="${"card__title svelte-171a7r5"}">${escape(title)}</a>
    <p class="${"card__desc svelte-171a7r5"}">${escape(desc)}</p>
    <div class="${"card__links svelte-171a7r5"}">${demo ? `<a class="${"card__demo svelte-171a7r5"}"${add_attribute("href", demo ? demo : "#", 0)} target="${"_blank"}" rel="${"norel noreferrer"}">${validate_component(Chrome, "Chrome").$$render($$result, {className: "card__icon"}, {}, {})}Demo</a>` : ``}
      <a class="${"card__source svelte-171a7r5"}"${add_attribute("href", source, 0)} target="${"_blank"}" rel="${"norel noreferrer"}">${validate_component(Code, "Code").$$render($$result, {className: "card__icon"}, {}, {})}Source</a></div></div>
</div>`;
});
var Section_svelte = '.section.svelte-1myyfxf{position:relative;margin-top:4rem;font-family:"Open Sans", sans-serif;color:var(--color-main-text);text-align:center;z-index:2}.section__title.svelte-1myyfxf{font-family:"Overpass", sans-serif;position:relative;display:inline-block;font-size:2rem;font-weight:600;margin-bottom:2rem}.section__title.svelte-1myyfxf::before{content:"";position:absolute;bottom:-0.25rem;height:0.25rem;left:2rem;right:2rem;border-radius:0.25rem;background-color:var(--color-main-accent)}.section__cards.svelte-1myyfxf{display:grid;grid-template-columns:repeat(auto-fit, minmax(18rem, 1fr));gap:1.25rem}.section__button.svelte-1myyfxf{display:inline-block;margin-top:2rem;padding:1rem 1.5rem 0.75rem;color:#f4f4f4;background-color:var(--color-main-accent);text-decoration:none;font-family:"Overpass", sans-serif;font-size:1.25rem;border-radius:0.25rem;transition:all ease-out 0.2s}.section__button.svelte-1myyfxf:hover{transform:translate3d(0, -0.25rem, 0);filter:brightness(1.2)}.section__pattern{color:var(--color-main-accent);position:absolute;top:0;left:-2rem;width:14rem;height:10rem}@media only screen and (max-width: 480px){.section.svelte-1myyfxf::after{right:0}}';
const css$d = {
  code: '.section.svelte-1myyfxf{position:relative;margin-top:4rem;font-family:"Open Sans", sans-serif;color:var(--color-main-text);text-align:center;z-index:2}.section__title.svelte-1myyfxf{font-family:"Overpass", sans-serif;position:relative;display:inline-block;font-size:2rem;font-weight:600;margin-bottom:2rem}.section__title.svelte-1myyfxf::before{content:"";position:absolute;bottom:-0.25rem;height:0.25rem;left:2rem;right:2rem;border-radius:0.25rem;background-color:var(--color-main-accent)}.section__cards.svelte-1myyfxf{display:grid;grid-template-columns:repeat(auto-fit, minmax(18rem, 1fr));gap:1.25rem}.section__button.svelte-1myyfxf{display:inline-block;margin-top:2rem;padding:1rem 1.5rem 0.75rem;color:#f4f4f4;background-color:var(--color-main-accent);text-decoration:none;font-family:"Overpass", sans-serif;font-size:1.25rem;border-radius:0.25rem;transition:all ease-out 0.2s}.section__button.svelte-1myyfxf:hover{transform:translate3d(0, -0.25rem, 0);filter:brightness(1.2)}.section__pattern{color:var(--color-main-accent);position:absolute;top:0;left:-2rem;width:14rem;height:10rem}@media only screen and (max-width: 480px){.section.svelte-1myyfxf::after{right:0}}',
  map: '{"version":3,"file":"Section.svelte","sources":["Section.svelte"],"sourcesContent":["<style>\\n.section {\\n  position: relative;\\n  margin-top: 4rem;\\n  font-family: \\"Open Sans\\", sans-serif;\\n  color: var(--color-main-text);\\n  text-align: center;\\n  z-index: 2;\\n}\\n\\n.section__title {\\n  font-family: \\"Overpass\\", sans-serif;\\n  position: relative;\\n  display: inline-block;\\n  font-size: 2rem;\\n  font-weight: 600;\\n  margin-bottom: 2rem;\\n}\\n\\n.section__title::before {\\n  content: \\"\\";\\n  position: absolute;\\n  bottom: -0.25rem;\\n  height: 0.25rem;\\n  left: 2rem;\\n  right: 2rem;\\n  border-radius: 0.25rem;\\n  background-color: var(--color-main-accent);\\n}\\n\\n.section__cards {\\n  display: grid;\\n  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));\\n  gap: 1.25rem;\\n}\\n\\n.section__button {\\n  display: inline-block;\\n  margin-top: 2rem;\\n  padding: 1rem 1.5rem 0.75rem;\\n  color: #f4f4f4;\\n  background-color: var(--color-main-accent);\\n  text-decoration: none;\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: 1.25rem;\\n  border-radius: 0.25rem;\\n  transition: all ease-out 0.2s;\\n}\\n\\n.section__button:hover {\\n  transform: translate3d(0, -0.25rem, 0);\\n  filter: brightness(1.2);\\n}\\n\\n:global(.section__pattern) {\\n  color: var(--color-main-accent);\\n  position: absolute;\\n  top: 0;\\n  left: -2rem;\\n  width: 14rem;\\n  height: 10rem;\\n}\\n\\n@media only screen and (max-width: 480px) {\\n  .section::after {\\n    right: 0;\\n  }\\n}\\n</style>\\n\\n<section class=\\"section\\">\\n  <Pattern className=\\"section__pattern\\" />\\n  <h1 class=\\"section__title\\">{title}</h1>\\n  <div class=\\"section__cards\\">\\n    {#if type === \\"posts\\"}\\n      {#each data as item}\\n        <PostCard\\n          title={item.title}\\n          href={`/post/${item.slug}`}\\n          desc={item.desc}\\n          date={item.date}\\n          tags={item.tags}\\n        />\\n      {/each}\\n    {:else}\\n      {#each data as item}\\n        <ProjectCard\\n          title={item.title}\\n          imgSrc={`/assets/project/${item.slug}/cover.webp`}\\n          href={`/project/${item.slug}`}\\n          desc={item.desc}\\n          demo={item.demo}\\n          source={item.source}\\n        />\\n      {/each}\\n    {/if}\\n  </div>\\n  <a href={url} class=\\"section__button\\">{btnText}</a>\\n</section>\\n\\n<script lang=\\"ts\\">import Pattern from \\"$lib/icons/Pattern.svelte\\";\\nimport PostCard from \\"$lib/components/PostCard.svelte\\";\\nimport ProjectCard from \\"$lib/components/ProjectCard.svelte\\";\\nexport let title;\\nexport let data;\\nexport let btnText;\\nexport let url;\\nexport let type;\\n</script>\\n"],"names":[],"mappings":"AACA,QAAQ,eAAC,CAAC,AACR,QAAQ,CAAE,QAAQ,CAClB,UAAU,CAAE,IAAI,CAChB,WAAW,CAAE,WAAW,CAAC,CAAC,UAAU,CACpC,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,eAAe,eAAC,CAAC,AACf,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,CACrB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,GAAG,CAChB,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,8BAAe,QAAQ,AAAC,CAAC,AACvB,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,QAAQ,CAChB,MAAM,CAAE,OAAO,CACf,IAAI,CAAE,IAAI,CACV,KAAK,CAAE,IAAI,CACX,aAAa,CAAE,OAAO,CACtB,gBAAgB,CAAE,IAAI,mBAAmB,CAAC,AAC5C,CAAC,AAED,eAAe,eAAC,CAAC,AACf,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,OAAO,QAAQ,CAAC,CAAC,OAAO,KAAK,CAAC,CAAC,GAAG,CAAC,CAAC,CAC3D,GAAG,CAAE,OAAO,AACd,CAAC,AAED,gBAAgB,eAAC,CAAC,AAChB,OAAO,CAAE,YAAY,CACrB,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,IAAI,CAAC,MAAM,CAAC,OAAO,CAC5B,KAAK,CAAE,OAAO,CACd,gBAAgB,CAAE,IAAI,mBAAmB,CAAC,CAC1C,eAAe,CAAE,IAAI,CACrB,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,OAAO,CAClB,aAAa,CAAE,OAAO,CACtB,UAAU,CAAE,GAAG,CAAC,QAAQ,CAAC,IAAI,AAC/B,CAAC,AAED,+BAAgB,MAAM,AAAC,CAAC,AACtB,SAAS,CAAE,YAAY,CAAC,CAAC,CAAC,QAAQ,CAAC,CAAC,CAAC,CAAC,CACtC,MAAM,CAAE,WAAW,GAAG,CAAC,AACzB,CAAC,AAEO,iBAAiB,AAAE,CAAC,AAC1B,KAAK,CAAE,IAAI,mBAAmB,CAAC,CAC/B,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CACX,KAAK,CAAE,KAAK,CACZ,MAAM,CAAE,KAAK,AACf,CAAC,AAED,OAAO,IAAI,CAAC,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACzC,uBAAQ,OAAO,AAAC,CAAC,AACf,KAAK,CAAE,CAAC,AACV,CAAC,AACH,CAAC"}'
};
const Section = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {title} = $$props;
  let {data: data2} = $$props;
  let {btnText} = $$props;
  let {url} = $$props;
  let {type} = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.data === void 0 && $$bindings.data && data2 !== void 0)
    $$bindings.data(data2);
  if ($$props.btnText === void 0 && $$bindings.btnText && btnText !== void 0)
    $$bindings.btnText(btnText);
  if ($$props.url === void 0 && $$bindings.url && url !== void 0)
    $$bindings.url(url);
  if ($$props.type === void 0 && $$bindings.type && type !== void 0)
    $$bindings.type(type);
  $$result.css.add(css$d);
  return `<section class="${"section svelte-1myyfxf"}">${validate_component(Pattern, "Pattern").$$render($$result, {className: "section__pattern"}, {}, {})}
  <h1 class="${"section__title svelte-1myyfxf"}">${escape(title)}</h1>
  <div class="${"section__cards svelte-1myyfxf"}">${type === "posts" ? `${each(data2, (item) => `${validate_component(PostCard, "PostCard").$$render($$result, {
    title: item.title,
    href: `/post/${item.slug}`,
    desc: item.desc,
    date: item.date,
    tags: item.tags
  }, {}, {})}`)}` : `${each(data2, (item) => `${validate_component(ProjectCard, "ProjectCard").$$render($$result, {
    title: item.title,
    imgSrc: `/assets/project/${item.slug}/cover.webp`,
    href: `/project/${item.slug}`,
    desc: item.desc,
    demo: item.demo,
    source: item.source
  }, {}, {})}`)}`}</div>
  <a${add_attribute("href", url, 0)} class="${"section__button svelte-1myyfxf"}">${escape(btnText)}</a>
</section>`;
});
var ProgressButton_svelte = ".button.svelte-vkwyt0{position:fixed;right:2rem;bottom:2rem;width:2.5rem;height:2.5rem;border-radius:2rem;background-color:var(--color-alt-bg);box-shadow:0 0.25rem 1rem rgba(0, 0, 0, 0.2);z-index:5;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all ease-out 0.2s;color:var(--color-main-text)}.button.svelte-vkwyt0:hover{filter:brightness(1.2)}.button__icon{color:var(--color-main-text)}";
const css$c = {
  code: ".button.svelte-vkwyt0{position:fixed;right:2rem;bottom:2rem;width:2.5rem;height:2.5rem;border-radius:2rem;background-color:var(--color-alt-bg);box-shadow:0 0.25rem 1rem rgba(0, 0, 0, 0.2);z-index:5;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all ease-out 0.2s;color:var(--color-main-text)}.button.svelte-vkwyt0:hover{filter:brightness(1.2)}.button__icon{color:var(--color-main-text)}",
  map: '{"version":3,"file":"ProgressButton.svelte","sources":["ProgressButton.svelte"],"sourcesContent":["<style>\\n.button {\\n  position: fixed;\\n  right: 2rem;\\n  bottom: 2rem;\\n  width: 2.5rem;\\n  height: 2.5rem;\\n  border-radius: 2rem;\\n  background-color: var(--color-alt-bg);\\n  box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.2);\\n  z-index: 5;\\n  display: flex;\\n  align-items: center;\\n  justify-content: center;\\n  cursor: pointer;\\n  transition: all ease-out 0.2s;\\n  color: var(--color-main-text);\\n}\\n\\n.button:hover {\\n  filter: brightness(1.2);\\n}\\n\\n:global(.button__icon) {\\n  color: var(--color-main-text);\\n}\\n</style>\\n\\n<svelte:window bind:scrollY={currentPosition} />\\n\\n{#if currentPosition > 50}\\n  <div\\n    class=\\"button\\"\\n    on:click={scrollToTop}\\n    transition:fade={{ duration: 100 }}\\n  >\\n    <Up width=\\"1.5rem\\" height=\\"1.5rem\\" className=\\"button__icon\\" />\\n  </div>\\n{/if}\\n\\n<script lang=\\"ts\\">import { fade } from \\"svelte/transition\\";\\nimport Up from \\"$lib/icons/Up.svelte\\";\\nlet currentPosition;\\nconst scrollToTop = () => window.scrollTo({ top: 0, behavior: \\"smooth\\" });\\n</script>\\n"],"names":[],"mappings":"AACA,OAAO,cAAC,CAAC,AACP,QAAQ,CAAE,KAAK,CACf,KAAK,CAAE,IAAI,CACX,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,MAAM,CACb,MAAM,CAAE,MAAM,CACd,aAAa,CAAE,IAAI,CACnB,gBAAgB,CAAE,IAAI,cAAc,CAAC,CACrC,UAAU,CAAE,CAAC,CAAC,OAAO,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAC7C,OAAO,CAAE,CAAC,CACV,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,MAAM,CAAE,OAAO,CACf,UAAU,CAAE,GAAG,CAAC,QAAQ,CAAC,IAAI,CAC7B,KAAK,CAAE,IAAI,iBAAiB,CAAC,AAC/B,CAAC,AAED,qBAAO,MAAM,AAAC,CAAC,AACb,MAAM,CAAE,WAAW,GAAG,CAAC,AACzB,CAAC,AAEO,aAAa,AAAE,CAAC,AACtB,KAAK,CAAE,IAAI,iBAAiB,CAAC,AAC/B,CAAC"}'
};
const ProgressButton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$c);
  return `

${``}`;
});
var index_svelte$2 = ".main.svelte-1aulcmk{max-width:1080px;margin:0 auto;padding:2rem 1rem 0;z-index:2}";
const css$b = {
  code: ".main.svelte-1aulcmk{max-width:1080px;margin:0 auto;padding:2rem 1rem 0;z-index:2}",
  map: '{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<style>\\n.main {\\n  max-width: 1080px;\\n  margin: 0 auto;\\n  padding: 2rem 1rem 0;\\n  z-index: 2;\\n}\\n</style>\\n\\n<SEO title=\\"Home\\" />\\n\\n<main class=\\"main\\">\\n  <Hero />\\n  <Section\\n    title=\\"Recent Posts\\"\\n    data={posts}\\n    btnText=\\"More Posts\\"\\n    url=\\"/post\\"\\n    type=\\"posts\\"\\n  />\\n  <Section\\n    title=\\"Recent Projects\\"\\n    data={projects}\\n    btnText=\\"More Projects\\"\\n    url=\\"/project\\"\\n    type=\\"projects\\"\\n  />\\n</main>\\n<ProgressButton />\\n\\n<script context=\\"module\\">\\nexport async function load({ fetch }) {\\n  const posts = await (await fetch(`/api/post.json?limit=3`)).json()\\n  const projects = await (await fetch(`/api/project.json?limit=3`)).json()\\n\\n  return { props: { posts, projects } }\\n}\\n</script>\\n\\n<script lang=\\"ts\\">import SEO from \\"$lib/components/SEO.svelte\\";\\nimport Hero from \\"$lib/parts/Hero.svelte\\";\\nimport Section from \\"$lib/parts/Section.svelte\\";\\nimport ProgressButton from \\"$lib/components/ProgressButton.svelte\\";\\nexport let posts;\\nexport let projects;\\n</script>\\n"],"names":[],"mappings":"AACA,KAAK,eAAC,CAAC,AACL,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,OAAO,CAAE,IAAI,CAAC,IAAI,CAAC,CAAC,CACpB,OAAO,CAAE,CAAC,AACZ,CAAC"}'
};
async function load$2({fetch: fetch2}) {
  const posts = await (await fetch2(`/api/post.json?limit=3`)).json();
  const projects = await (await fetch2(`/api/project.json?limit=3`)).json();
  return {props: {posts, projects}};
}
const Pages = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {posts} = $$props;
  let {projects} = $$props;
  if ($$props.posts === void 0 && $$bindings.posts && posts !== void 0)
    $$bindings.posts(posts);
  if ($$props.projects === void 0 && $$bindings.projects && projects !== void 0)
    $$bindings.projects(projects);
  $$result.css.add(css$b);
  return `${validate_component(SEO, "SEO").$$render($$result, {title: "Home"}, {}, {})}

<main class="${"main svelte-1aulcmk"}">${validate_component(Hero, "Hero").$$render($$result, {}, {}, {})}
  ${validate_component(Section, "Section").$$render($$result, {
    title: "Recent Posts",
    data: posts,
    btnText: "More Posts",
    url: "/post",
    type: "posts"
  }, {}, {})}
  ${validate_component(Section, "Section").$$render($$result, {
    title: "Recent Projects",
    data: projects,
    btnText: "More Projects",
    url: "/project",
    type: "projects"
  }, {}, {})}</main>
${validate_component(ProgressButton, "ProgressButton").$$render($$result, {}, {}, {})}`;
});
var index$C = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Pages,
  load: load$2
});
var index_svelte$1 = '.posts.svelte-bpffgc{max-width:1080px;margin:0 auto;padding:2rem 1rem 0;text-align:center}.posts__title.svelte-bpffgc{font-family:"Open Sans", sans-serif;position:relative;display:inline-block;font-size:2rem;font-weight:600;margin-bottom:2rem;color:var(--color-main-text)}.posts__title.svelte-bpffgc::before{content:"";position:absolute;bottom:-0.25rem;height:0.25rem;left:2rem;right:2rem;border-radius:0.25rem;background-color:var(--color-main-accent)}.posts__cards.svelte-bpffgc{display:grid;grid-template-columns:repeat(auto-fit, minmax(20rem, 1fr));gap:1.25rem}';
const css$a = {
  code: '.posts.svelte-bpffgc{max-width:1080px;margin:0 auto;padding:2rem 1rem 0;text-align:center}.posts__title.svelte-bpffgc{font-family:"Open Sans", sans-serif;position:relative;display:inline-block;font-size:2rem;font-weight:600;margin-bottom:2rem;color:var(--color-main-text)}.posts__title.svelte-bpffgc::before{content:"";position:absolute;bottom:-0.25rem;height:0.25rem;left:2rem;right:2rem;border-radius:0.25rem;background-color:var(--color-main-accent)}.posts__cards.svelte-bpffgc{display:grid;grid-template-columns:repeat(auto-fit, minmax(20rem, 1fr));gap:1.25rem}',
  map: '{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<style>\\n.posts {\\n  max-width: 1080px;\\n  margin: 0 auto;\\n  padding: 2rem 1rem 0;\\n  text-align: center;\\n}\\n\\n.posts__title {\\n  font-family: \\"Open Sans\\", sans-serif;\\n  position: relative;\\n  display: inline-block;\\n  font-size: 2rem;\\n  font-weight: 600;\\n  margin-bottom: 2rem;\\n  color: var(--color-main-text);\\n}\\n\\n.posts__title::before {\\n  content: \\"\\";\\n  position: absolute;\\n  bottom: -0.25rem;\\n  height: 0.25rem;\\n  left: 2rem;\\n  right: 2rem;\\n  border-radius: 0.25rem;\\n  background-color: var(--color-main-accent);\\n}\\n\\n.posts__cards {\\n  display: grid;\\n  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));\\n  gap: 1.25rem;\\n}\\n</style>\\n\\n<SEO title=\\"Projects\\" />\\n\\n<section class=\\"posts\\">\\n  <h1 class=\\"posts__title\\">All Projects</h1>\\n  <div class=\\"posts__cards\\">\\n    {#each projects as project}\\n      <ProjectCard\\n        title={project.title}\\n        imgSrc={`/assets/project/${project.slug}/cover.webp`}\\n        href={`/project/${project.slug}`}\\n        desc={project.desc}\\n        demo={project.demo}\\n        source={project.source}\\n      />\\n    {/each}\\n  </div>\\n</section>\\n<ProgressButton />\\n\\n<script context=\\"module\\">\\nexport async function load({ fetch }) {\\n  const projects = await (await fetch(`/api/project.json`)).json()\\n  return { props: { projects } }\\n}\\n</script>\\n\\n<script lang=\\"ts\\">import SEO from \\"$lib/components/SEO.svelte\\";\\nimport ProjectCard from \\"$lib/components/ProjectCard.svelte\\";\\nimport ProgressButton from \\"$lib/components/ProgressButton.svelte\\";\\nexport let projects;\\n</script>\\n"],"names":[],"mappings":"AACA,MAAM,cAAC,CAAC,AACN,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,OAAO,CAAE,IAAI,CAAC,IAAI,CAAC,CAAC,CACpB,UAAU,CAAE,MAAM,AACpB,CAAC,AAED,aAAa,cAAC,CAAC,AACb,WAAW,CAAE,WAAW,CAAC,CAAC,UAAU,CACpC,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,CACrB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,GAAG,CAChB,aAAa,CAAE,IAAI,CACnB,KAAK,CAAE,IAAI,iBAAiB,CAAC,AAC/B,CAAC,AAED,2BAAa,QAAQ,AAAC,CAAC,AACrB,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,QAAQ,CAChB,MAAM,CAAE,OAAO,CACf,IAAI,CAAE,IAAI,CACV,KAAK,CAAE,IAAI,CACX,aAAa,CAAE,OAAO,CACtB,gBAAgB,CAAE,IAAI,mBAAmB,CAAC,AAC5C,CAAC,AAED,aAAa,cAAC,CAAC,AACb,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,OAAO,QAAQ,CAAC,CAAC,OAAO,KAAK,CAAC,CAAC,GAAG,CAAC,CAAC,CAC3D,GAAG,CAAE,OAAO,AACd,CAAC"}'
};
async function load$1({fetch: fetch2}) {
  const projects = await (await fetch2(`/api/project.json`)).json();
  return {props: {projects}};
}
const Project$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {projects} = $$props;
  if ($$props.projects === void 0 && $$bindings.projects && projects !== void 0)
    $$bindings.projects(projects);
  $$result.css.add(css$a);
  return `${validate_component(SEO, "SEO").$$render($$result, {title: "Projects"}, {}, {})}

<section class="${"posts svelte-bpffgc"}"><h1 class="${"posts__title svelte-bpffgc"}">All Projects</h1>
  <div class="${"posts__cards svelte-bpffgc"}">${each(projects, (project) => `${validate_component(ProjectCard, "ProjectCard").$$render($$result, {
    title: project.title,
    imgSrc: `/assets/project/${project.slug}/cover.webp`,
    href: `/project/${project.slug}`,
    desc: project.desc,
    demo: project.demo,
    source: project.source
  }, {}, {})}`)}</div></section>
${validate_component(ProgressButton, "ProgressButton").$$render($$result, {}, {}, {})}`;
});
var index$B = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Project$1,
  load: load$1
});
var project_svelte = '.project.svelte-ank5nd.svelte-ank5nd{max-width:1080px;display:grid;grid-template-columns:2fr 1fr;grid-template-rows:repeat(3, minmax(min-content, max-content));grid-auto-flow:dense;align-items:flex-start;margin:2rem auto;padding:0 1rem;gap:1rem}.project__cover.svelte-ank5nd.svelte-ank5nd{grid-column:1/2;width:100%}.project__wrapper.svelte-ank5nd.svelte-ank5nd{overflow:hidden;border:0.0625rem var(--color-special-bg) solid}.project__img.svelte-ank5nd.svelte-ank5nd{display:block;height:100%;width:100%}.project__header.svelte-ank5nd.svelte-ank5nd{display:flex;gap:1rem;align-items:center;margin-bottom:1rem}.project__title.svelte-ank5nd.svelte-ank5nd{color:var(--color-main-text);font-family:"Overpass", sans-serif;font-size:2rem}.project__buttons.svelte-ank5nd.svelte-ank5nd{display:flex;gap:0.5rem}.project__demo.svelte-ank5nd.svelte-ank5nd,.project__source.svelte-ank5nd.svelte-ank5nd{font-family:"Open Sans", sans-serif;text-decoration:none;display:flex;align-items:center;gap:0.5rem;padding:0.25rem 0.5rem;border-radius:0.25rem;transition:filter ease-out 0.2s}.project__demo.svelte-ank5nd.svelte-ank5nd:hover,.project__source.svelte-ank5nd.svelte-ank5nd:hover{filter:brightness(1.2)}.project__demo.svelte-ank5nd.svelte-ank5nd{background-color:var(--color-main-accent);color:#ffffff}.project__source.svelte-ank5nd.svelte-ank5nd{background-color:var(--color-special-bg);color:var(--color-alt-text)}.project__icon{width:1.125rem;height:1.125rem}.project__divider.svelte-ank5nd.svelte-ank5nd{border:none;height:0.125rem;margin:0.5rem 0 1rem;background-color:var(--color-special-bg)}.project__content.svelte-ank5nd.svelte-ank5nd{grid-column:1/2;font-family:"Open Sans", sans-serif;font-size:1.125rem;line-height:1.75rem}.project__stack.svelte-ank5nd.svelte-ank5nd{grid-column:2/3;grid-row:1/-1;width:100%;padding:1rem;border:0.0625rem var(--color-borders) solid}.stack__title.svelte-ank5nd.svelte-ank5nd{color:var(--color-main-text);font-family:"Overpass", sans-serif;font-weight:600;font-size:1.5rem}.stack__divider.svelte-ank5nd.svelte-ank5nd{height:0.125rem;border:none;background-color:var(--color-borders);margin:0.5rem 0}.stack__item.svelte-ank5nd.svelte-ank5nd{display:grid;grid-template-columns:3.5rem 1fr;gap:1rem;align-items:center;padding:1rem 0;border-bottom:0.0625rem var(--color-borders) solid}.stack__item.svelte-ank5nd.svelte-ank5nd:last-child{border:none}.stack__logo.svelte-ank5nd.svelte-ank5nd{display:flex;align-items:center;justify-content:center;padding:0.5rem;border-radius:0.5rem;background-color:var(--color-special-bg);overflow:hidden}.stack__logo.svelte-ank5nd img.svelte-ank5nd{width:100%}.stack__name.svelte-ank5nd.svelte-ank5nd{color:var(--color-main-text);font-family:"Overpass", sans-serif;font-size:1.25rem;text-decoration:none;transition:color ease-out 0.2s}.stack__name.svelte-ank5nd.svelte-ank5nd:hover{color:var(--color-main-accent)}.stack__name.svelte-ank5nd.svelte-ank5nd::after{content:"\u2197";font-size:1rem;vertical-align:top}.project__content.svelte-ank5nd p{color:var(--color-main-text);margin-bottom:1rem}.project__content.svelte-ank5nd p a{position:relative;display:inline-block;color:var(--color-main-accent);text-decoration:none;margin:0 0.125rem;transition:all ease-out 0.2s}.project__content.svelte-ank5nd p a::before{position:absolute;content:"";bottom:0;left:-0.25rem;right:-0.25rem;top:0;transform:scale3d(0, 0.1, 1);transform-origin:0 100%;background-image:linear-gradient(\n    to right,\n    var(--color-main-accent),\n    rgba(0, 0, 0, 0)\n  );z-index:-1;transition:transform ease-out 0.2s}.project__content.svelte-ank5nd img{width:100%;margin-top:1rem}.project__content.svelte-ank5nd a:hover::before{transform:scale3d(1, 0.1, 1)}.project__content.svelte-ank5nd code{font-family:"JetBrains Mono", monospace;color:var(--color-main-accent);padding:0.125rem 0.25rem;font-size:1rem}.project__content.svelte-ank5nd pre{border-radius:0.5rem;margin:0.5rem 0;scrollbar-color:var(--color-thin) var(--color-special-bg);border:0.125rem var(--color-borders) solid}.project__content.svelte-ank5nd pre::-webkit-scrollbar-thumb{background-color:var(--color-thin)}.project__content.svelte-ank5nd pre::-webkit-scrollbar{background-color:var(--color-special-bg);height:0.5rem}.project__content.svelte-ank5nd pre code{padding:0;border-radius:0}.project__content.svelte-ank5nd blockquote p{font-size:1.125rem;letter-spacing:0.02em;color:var(--color-alt-text);font-style:italic;font-family:serif;margin:1rem 0}.project__content.svelte-ank5nd blockquote p::before{content:"\u201C	"}.project__content.svelte-ank5nd blockquote p::after{content:" \u201D"}@media only screen and (max-width: 480px){.project__content.svelte-ank5nd pre{margin-left:-1rem !important;margin-right:-1rem !important;border-radius:0}}@media only screen and (max-width: 880px){.project__cover.svelte-ank5nd.svelte-ank5nd{grid-column:1/3}.project__content.svelte-ank5nd.svelte-ank5nd{grid-column:1/3}.project__stack.svelte-ank5nd.svelte-ank5nd{grid-row:2/3;grid-column:1/3}.project__header.svelte-ank5nd.svelte-ank5nd{flex-direction:column}}';
const css$9 = {
  code: '.project.svelte-ank5nd.svelte-ank5nd{max-width:1080px;display:grid;grid-template-columns:2fr 1fr;grid-template-rows:repeat(3, minmax(min-content, max-content));grid-auto-flow:dense;align-items:flex-start;margin:2rem auto;padding:0 1rem;gap:1rem}.project__cover.svelte-ank5nd.svelte-ank5nd{grid-column:1/2;width:100%}.project__wrapper.svelte-ank5nd.svelte-ank5nd{overflow:hidden;border:0.0625rem var(--color-special-bg) solid}.project__img.svelte-ank5nd.svelte-ank5nd{display:block;height:100%;width:100%}.project__header.svelte-ank5nd.svelte-ank5nd{display:flex;gap:1rem;align-items:center;margin-bottom:1rem}.project__title.svelte-ank5nd.svelte-ank5nd{color:var(--color-main-text);font-family:"Overpass", sans-serif;font-size:2rem}.project__buttons.svelte-ank5nd.svelte-ank5nd{display:flex;gap:0.5rem}.project__demo.svelte-ank5nd.svelte-ank5nd,.project__source.svelte-ank5nd.svelte-ank5nd{font-family:"Open Sans", sans-serif;text-decoration:none;display:flex;align-items:center;gap:0.5rem;padding:0.25rem 0.5rem;border-radius:0.25rem;transition:filter ease-out 0.2s}.project__demo.svelte-ank5nd.svelte-ank5nd:hover,.project__source.svelte-ank5nd.svelte-ank5nd:hover{filter:brightness(1.2)}.project__demo.svelte-ank5nd.svelte-ank5nd{background-color:var(--color-main-accent);color:#ffffff}.project__source.svelte-ank5nd.svelte-ank5nd{background-color:var(--color-special-bg);color:var(--color-alt-text)}.project__icon{width:1.125rem;height:1.125rem}.project__divider.svelte-ank5nd.svelte-ank5nd{border:none;height:0.125rem;margin:0.5rem 0 1rem;background-color:var(--color-special-bg)}.project__content.svelte-ank5nd.svelte-ank5nd{grid-column:1/2;font-family:"Open Sans", sans-serif;font-size:1.125rem;line-height:1.75rem}.project__stack.svelte-ank5nd.svelte-ank5nd{grid-column:2/3;grid-row:1/-1;width:100%;padding:1rem;border:0.0625rem var(--color-borders) solid}.stack__title.svelte-ank5nd.svelte-ank5nd{color:var(--color-main-text);font-family:"Overpass", sans-serif;font-weight:600;font-size:1.5rem}.stack__divider.svelte-ank5nd.svelte-ank5nd{height:0.125rem;border:none;background-color:var(--color-borders);margin:0.5rem 0}.stack__item.svelte-ank5nd.svelte-ank5nd{display:grid;grid-template-columns:3.5rem 1fr;gap:1rem;align-items:center;padding:1rem 0;border-bottom:0.0625rem var(--color-borders) solid}.stack__item.svelte-ank5nd.svelte-ank5nd:last-child{border:none}.stack__logo.svelte-ank5nd.svelte-ank5nd{display:flex;align-items:center;justify-content:center;padding:0.5rem;border-radius:0.5rem;background-color:var(--color-special-bg);overflow:hidden}.stack__logo.svelte-ank5nd img.svelte-ank5nd{width:100%}.stack__name.svelte-ank5nd.svelte-ank5nd{color:var(--color-main-text);font-family:"Overpass", sans-serif;font-size:1.25rem;text-decoration:none;transition:color ease-out 0.2s}.stack__name.svelte-ank5nd.svelte-ank5nd:hover{color:var(--color-main-accent)}.stack__name.svelte-ank5nd.svelte-ank5nd::after{content:"\u2197";font-size:1rem;vertical-align:top}.project__content.svelte-ank5nd p{color:var(--color-main-text);margin-bottom:1rem}.project__content.svelte-ank5nd p a{position:relative;display:inline-block;color:var(--color-main-accent);text-decoration:none;margin:0 0.125rem;transition:all ease-out 0.2s}.project__content.svelte-ank5nd p a::before{position:absolute;content:"";bottom:0;left:-0.25rem;right:-0.25rem;top:0;transform:scale3d(0, 0.1, 1);transform-origin:0 100%;background-image:linear-gradient(\n    to right,\n    var(--color-main-accent),\n    rgba(0, 0, 0, 0)\n  );z-index:-1;transition:transform ease-out 0.2s}.project__content.svelte-ank5nd img{width:100%;margin-top:1rem}.project__content.svelte-ank5nd a:hover::before{transform:scale3d(1, 0.1, 1)}.project__content.svelte-ank5nd code{font-family:"JetBrains Mono", monospace;color:var(--color-main-accent);padding:0.125rem 0.25rem;font-size:1rem}.project__content.svelte-ank5nd pre{border-radius:0.5rem;margin:0.5rem 0;scrollbar-color:var(--color-thin) var(--color-special-bg);border:0.125rem var(--color-borders) solid}.project__content.svelte-ank5nd pre::-webkit-scrollbar-thumb{background-color:var(--color-thin)}.project__content.svelte-ank5nd pre::-webkit-scrollbar{background-color:var(--color-special-bg);height:0.5rem}.project__content.svelte-ank5nd pre code{padding:0;border-radius:0}.project__content.svelte-ank5nd blockquote p{font-size:1.125rem;letter-spacing:0.02em;color:var(--color-alt-text);font-style:italic;font-family:serif;margin:1rem 0}.project__content.svelte-ank5nd blockquote p::before{content:"\u201C	"}.project__content.svelte-ank5nd blockquote p::after{content:" \u201D"}@media only screen and (max-width: 480px){.project__content.svelte-ank5nd pre{margin-left:-1rem !important;margin-right:-1rem !important;border-radius:0}}@media only screen and (max-width: 880px){.project__cover.svelte-ank5nd.svelte-ank5nd{grid-column:1/3}.project__content.svelte-ank5nd.svelte-ank5nd{grid-column:1/3}.project__stack.svelte-ank5nd.svelte-ank5nd{grid-row:2/3;grid-column:1/3}.project__header.svelte-ank5nd.svelte-ank5nd{flex-direction:column}}',
  map: '{"version":3,"file":"project.svelte","sources":["project.svelte"],"sourcesContent":["<style>\\n.project {\\n  max-width: 1080px;\\n  display: grid;\\n  grid-template-columns: 2fr 1fr;\\n  grid-template-rows: repeat(3, minmax(min-content, max-content));\\n  grid-auto-flow: dense;\\n  align-items: flex-start;\\n  margin: 2rem auto;\\n  padding: 0 1rem;\\n  gap: 1rem;\\n}\\n\\n.project__cover {\\n  grid-column: 1/2;\\n  width: 100%;\\n}\\n\\n.project__wrapper {\\n  overflow: hidden;\\n  border: 0.0625rem var(--color-special-bg) solid;\\n}\\n\\n.project__img {\\n  display: block;\\n  height: 100%;\\n  width: 100%;\\n}\\n\\n.project__header {\\n  display: flex;\\n  gap: 1rem;\\n  align-items: center;\\n  margin-bottom: 1rem;\\n}\\n\\n.project__title {\\n  color: var(--color-main-text);\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: 2rem;\\n}\\n\\n.project__buttons {\\n  display: flex;\\n  gap: 0.5rem;\\n}\\n\\n.project__demo,\\n.project__source {\\n  font-family: \\"Open Sans\\", sans-serif;\\n  text-decoration: none;\\n  display: flex;\\n  align-items: center;\\n  gap: 0.5rem;\\n  padding: 0.25rem 0.5rem;\\n  border-radius: 0.25rem;\\n  transition: filter ease-out 0.2s;\\n}\\n\\n.project__demo:hover,\\n.project__source:hover {\\n  filter: brightness(1.2);\\n}\\n.project__demo {\\n  background-color: var(--color-main-accent);\\n  color: #ffffff;\\n}\\n.project__source {\\n  background-color: var(--color-special-bg);\\n  color: var(--color-alt-text);\\n}\\n:global(.project__icon) {\\n  width: 1.125rem;\\n  height: 1.125rem;\\n}\\n.project__divider {\\n  border: none;\\n  height: 0.125rem;\\n  margin: 0.5rem 0 1rem;\\n  background-color: var(--color-special-bg);\\n}\\n\\n.project__content {\\n  grid-column: 1/2;\\n  font-family: \\"Open Sans\\", sans-serif;\\n  font-size: 1.125rem;\\n  line-height: 1.75rem;\\n}\\n\\n.project__stack {\\n  grid-column: 2/3;\\n  grid-row: 1/-1;\\n  width: 100%;\\n  padding: 1rem;\\n  border: 0.0625rem var(--color-borders) solid;\\n}\\n\\n.stack__title {\\n  color: var(--color-main-text);\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-weight: 600;\\n  font-size: 1.5rem;\\n}\\n\\n.stack__divider {\\n  height: 0.125rem;\\n  border: none;\\n  background-color: var(--color-borders);\\n  margin: 0.5rem 0;\\n}\\n\\n.stack__item {\\n  display: grid;\\n  grid-template-columns: 3.5rem 1fr;\\n  gap: 1rem;\\n  align-items: center;\\n  padding: 1rem 0;\\n  border-bottom: 0.0625rem var(--color-borders) solid;\\n}\\n\\n.stack__item:last-child {\\n  border: none;\\n}\\n\\n.stack__logo {\\n  display: flex;\\n  align-items: center;\\n  justify-content: center;\\n  padding: 0.5rem;\\n  border-radius: 0.5rem;\\n  background-color: var(--color-special-bg);\\n  overflow: hidden;\\n}\\n\\n.stack__logo img {\\n  width: 100%;\\n}\\n\\n.stack__name {\\n  color: var(--color-main-text);\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: 1.25rem;\\n  text-decoration: none;\\n  transition: color ease-out 0.2s;\\n}\\n\\n.stack__name:hover {\\n  color: var(--color-main-accent);\\n}\\n\\n.stack__name::after {\\n  content: \\"\u2197\\";\\n  font-size: 1rem;\\n  vertical-align: top;\\n}\\n\\n.project__content :global(p) {\\n  color: var(--color-main-text);\\n  margin-bottom: 1rem;\\n}\\n\\n.project__content :global(p a) {\\n  position: relative;\\n  display: inline-block;\\n  color: var(--color-main-accent);\\n  text-decoration: none;\\n  margin: 0 0.125rem;\\n  transition: all ease-out 0.2s;\\n}\\n\\n.project__content :global(p a::before) {\\n  position: absolute;\\n  content: \\"\\";\\n  bottom: 0;\\n  left: -0.25rem;\\n  right: -0.25rem;\\n  top: 0;\\n  transform: scale3d(0, 0.1, 1);\\n  transform-origin: 0 100%;\\n  background-image: linear-gradient(\\n    to right,\\n    var(--color-main-accent),\\n    rgba(0, 0, 0, 0)\\n  );\\n  z-index: -1;\\n  transition: transform ease-out 0.2s;\\n}\\n\\n.project__content :global(img) {\\n  width: 100%;\\n  margin-top: 1rem;\\n}\\n\\n.project__content :global(a:hover::before) {\\n  transform: scale3d(1, 0.1, 1);\\n}\\n\\n.project__content :global(code) {\\n  font-family: \\"JetBrains Mono\\", monospace;\\n  color: var(--color-main-accent);\\n  padding: 0.125rem 0.25rem;\\n  font-size: 1rem;\\n}\\n\\n.project__content :global(pre) {\\n  border-radius: 0.5rem;\\n  margin: 0.5rem 0;\\n  scrollbar-color: var(--color-thin) var(--color-special-bg);\\n  border: 0.125rem var(--color-borders) solid;\\n}\\n\\n.project__content :global(pre::-webkit-scrollbar-thumb) {\\n  background-color: var(--color-thin);\\n}\\n\\n.project__content :global(pre::-webkit-scrollbar) {\\n  background-color: var(--color-special-bg);\\n  height: 0.5rem;\\n}\\n\\n.project__content :global(pre code) {\\n  padding: 0;\\n  border-radius: 0;\\n}\\n\\n.project__content :global(blockquote p) {\\n  font-size: 1.125rem;\\n  letter-spacing: 0.02em;\\n  color: var(--color-alt-text);\\n  font-style: italic;\\n  font-family: serif;\\n  margin: 1rem 0;\\n}\\n\\n.project__content :global(blockquote p::before) {\\n  content: \\"\u201C\\t\\";\\n}\\n\\n.project__content :global(blockquote p::after) {\\n  content: \\" \u201D\\";\\n}\\n\\n@media only screen and (max-width: 480px) {\\n  .project__content :global(pre) {\\n    margin-left: -1rem !important;\\n    margin-right: -1rem !important;\\n    border-radius: 0;\\n  }\\n}\\n\\n@media only screen and (max-width: 880px) {\\n  .project__cover {\\n    grid-column: 1/3;\\n  }\\n\\n  .project__content {\\n    grid-column: 1/3;\\n  }\\n\\n  .project__stack {\\n    grid-row: 2/3;\\n    grid-column: 1/3;\\n  }\\n\\n  .project__header {\\n    flex-direction: column;\\n  }\\n}\\n</style>\\n\\n<svelte:head>\\n  <link\\n    rel=\\"preload\\"\\n    href=\\"/prism-night-owl.css\\"\\n    as=\\"style\\"\\n    on:load={function () {\\n      this.rel = \\"stylesheet\\"\\n    }}\\n  />\\n</svelte:head>\\n\\n<SEO {title} {desc} thumbnail={`${data.siteUrl}/${currentSlug}/cover.webp`} />\\n\\n<section class=\\"project\\">\\n  <div class=\\"project__cover\\">\\n    <div class=\\"project__wrapper\\">\\n      <img\\n        src={`/assets/${currentSlug}/cover.webp`}\\n        alt={title}\\n        class=\\"project__img\\"\\n        loading=\\"lazy\\"\\n      />\\n    </div>\\n  </div>\\n  <div class=\\"project__content\\">\\n    <div class=\\"project__header\\">\\n      <h1 class=\\"project__title\\">{title}</h1>\\n      <div class=\\"project__buttons\\">\\n        {#if demo}\\n          <a\\n            class=\\"project__demo\\"\\n            href={demo}\\n            target=\\"_blank\\"\\n            rel=\\"norel noreferrer\\"><Chrome className=\\"project__icon\\" />Demo</a\\n          >\\n        {/if}\\n        <a\\n          class=\\"project__source\\"\\n          href={source}\\n          target=\\"_blank\\"\\n          rel=\\"norel noreferrer\\"><Code className=\\"card__icon\\" />Source</a\\n        >\\n      </div>\\n    </div>\\n    <hr class=\\"project__divider\\" />\\n    <slot />\\n  </div>\\n  <div class=\\"project__stack\\">\\n    <span class=\\"stack__title\\">Tech Stack</span>\\n    <hr class=\\"stack__divider\\" />\\n    {#each stack as item}\\n      <div class=\\"stack__item\\">\\n        <div class=\\"stack__logo\\">\\n          <img\\n            src=\\"/assets/logo/{item[0].toLowerCase()}.png\\"\\n            alt={item}\\n            style=\\"filter: {item[0].toLowerCase() === \'nextjs\'\\n              ? \'var(--filter-invert)\'\\n              : \'\'} \\"\\n          />\\n        </div>\\n        <a\\n          href={item[1]}\\n          class=\\"stack__name\\"\\n          target=\\"_blank\\"\\n          rel=\\"norel noreferrer\\">{item[0]}</a\\n        >\\n      </div>\\n    {/each}\\n  </div>\\n</section>\\n<ProgressButton />\\n\\n<script>\\nimport { page } from \\"$app/stores\\"\\nimport SEO from \\"$lib/components/SEO.svelte\\"\\nimport Chrome from \\"$lib/icons/Chrome.svelte\\"\\nimport Code from \\"$lib/icons/Code.svelte\\"\\nimport ProgressButton from \\"$lib/components/ProgressButton.svelte\\"\\nimport data from \\"$lib/data/site\\"\\n\\nexport let title\\nexport let desc\\nexport let demo\\nexport let source\\nexport let stack\\n\\nconst currentSlug = $page.path\\n</script>\\n"],"names":[],"mappings":"AACA,QAAQ,4BAAC,CAAC,AACR,SAAS,CAAE,MAAM,CACjB,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,GAAG,CAAC,GAAG,CAC9B,kBAAkB,CAAE,OAAO,CAAC,CAAC,CAAC,OAAO,WAAW,CAAC,CAAC,WAAW,CAAC,CAAC,CAC/D,cAAc,CAAE,KAAK,CACrB,WAAW,CAAE,UAAU,CACvB,MAAM,CAAE,IAAI,CAAC,IAAI,CACjB,OAAO,CAAE,CAAC,CAAC,IAAI,CACf,GAAG,CAAE,IAAI,AACX,CAAC,AAED,eAAe,4BAAC,CAAC,AACf,WAAW,CAAE,CAAC,CAAC,CAAC,CAChB,KAAK,CAAE,IAAI,AACb,CAAC,AAED,iBAAiB,4BAAC,CAAC,AACjB,QAAQ,CAAE,MAAM,CAChB,MAAM,CAAE,SAAS,CAAC,IAAI,kBAAkB,CAAC,CAAC,KAAK,AACjD,CAAC,AAED,aAAa,4BAAC,CAAC,AACb,OAAO,CAAE,KAAK,CACd,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,AACb,CAAC,AAED,gBAAgB,4BAAC,CAAC,AAChB,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,IAAI,CACT,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,eAAe,4BAAC,CAAC,AACf,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,IAAI,AACjB,CAAC,AAED,iBAAiB,4BAAC,CAAC,AACjB,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,MAAM,AACb,CAAC,AAED,0CAAc,CACd,gBAAgB,4BAAC,CAAC,AAChB,WAAW,CAAE,WAAW,CAAC,CAAC,UAAU,CACpC,eAAe,CAAE,IAAI,CACrB,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,GAAG,CAAE,MAAM,CACX,OAAO,CAAE,OAAO,CAAC,MAAM,CACvB,aAAa,CAAE,OAAO,CACtB,UAAU,CAAE,MAAM,CAAC,QAAQ,CAAC,IAAI,AAClC,CAAC,AAED,0CAAc,MAAM,CACpB,4CAAgB,MAAM,AAAC,CAAC,AACtB,MAAM,CAAE,WAAW,GAAG,CAAC,AACzB,CAAC,AACD,cAAc,4BAAC,CAAC,AACd,gBAAgB,CAAE,IAAI,mBAAmB,CAAC,CAC1C,KAAK,CAAE,OAAO,AAChB,CAAC,AACD,gBAAgB,4BAAC,CAAC,AAChB,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,CACzC,KAAK,CAAE,IAAI,gBAAgB,CAAC,AAC9B,CAAC,AACO,cAAc,AAAE,CAAC,AACvB,KAAK,CAAE,QAAQ,CACf,MAAM,CAAE,QAAQ,AAClB,CAAC,AACD,iBAAiB,4BAAC,CAAC,AACjB,MAAM,CAAE,IAAI,CACZ,MAAM,CAAE,QAAQ,CAChB,MAAM,CAAE,MAAM,CAAC,CAAC,CAAC,IAAI,CACrB,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,AAC3C,CAAC,AAED,iBAAiB,4BAAC,CAAC,AACjB,WAAW,CAAE,CAAC,CAAC,CAAC,CAChB,WAAW,CAAE,WAAW,CAAC,CAAC,UAAU,CACpC,SAAS,CAAE,QAAQ,CACnB,WAAW,CAAE,OAAO,AACtB,CAAC,AAED,eAAe,4BAAC,CAAC,AACf,WAAW,CAAE,CAAC,CAAC,CAAC,CAChB,QAAQ,CAAE,CAAC,CAAC,EAAE,CACd,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,SAAS,CAAC,IAAI,eAAe,CAAC,CAAC,KAAK,AAC9C,CAAC,AAED,aAAa,4BAAC,CAAC,AACb,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,WAAW,CAAE,GAAG,CAChB,SAAS,CAAE,MAAM,AACnB,CAAC,AAED,eAAe,4BAAC,CAAC,AACf,MAAM,CAAE,QAAQ,CAChB,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,IAAI,eAAe,CAAC,CACtC,MAAM,CAAE,MAAM,CAAC,CAAC,AAClB,CAAC,AAED,YAAY,4BAAC,CAAC,AACZ,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,MAAM,CAAC,GAAG,CACjC,GAAG,CAAE,IAAI,CACT,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,IAAI,CAAC,CAAC,CACf,aAAa,CAAE,SAAS,CAAC,IAAI,eAAe,CAAC,CAAC,KAAK,AACrD,CAAC,AAED,wCAAY,WAAW,AAAC,CAAC,AACvB,MAAM,CAAE,IAAI,AACd,CAAC,AAED,YAAY,4BAAC,CAAC,AACZ,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,MAAM,CACf,aAAa,CAAE,MAAM,CACrB,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,CACzC,QAAQ,CAAE,MAAM,AAClB,CAAC,AAED,0BAAY,CAAC,GAAG,cAAC,CAAC,AAChB,KAAK,CAAE,IAAI,AACb,CAAC,AAED,YAAY,4BAAC,CAAC,AACZ,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,OAAO,CAClB,eAAe,CAAE,IAAI,CACrB,UAAU,CAAE,KAAK,CAAC,QAAQ,CAAC,IAAI,AACjC,CAAC,AAED,wCAAY,MAAM,AAAC,CAAC,AAClB,KAAK,CAAE,IAAI,mBAAmB,CAAC,AACjC,CAAC,AAED,wCAAY,OAAO,AAAC,CAAC,AACnB,OAAO,CAAE,GAAG,CACZ,SAAS,CAAE,IAAI,CACf,cAAc,CAAE,GAAG,AACrB,CAAC,AAED,+BAAiB,CAAC,AAAQ,CAAC,AAAE,CAAC,AAC5B,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,+BAAiB,CAAC,AAAQ,GAAG,AAAE,CAAC,AAC9B,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,CACrB,KAAK,CAAE,IAAI,mBAAmB,CAAC,CAC/B,eAAe,CAAE,IAAI,CACrB,MAAM,CAAE,CAAC,CAAC,QAAQ,CAClB,UAAU,CAAE,GAAG,CAAC,QAAQ,CAAC,IAAI,AAC/B,CAAC,AAED,+BAAiB,CAAC,AAAQ,WAAW,AAAE,CAAC,AACtC,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,EAAE,CACX,MAAM,CAAE,CAAC,CACT,IAAI,CAAE,QAAQ,CACd,KAAK,CAAE,QAAQ,CACf,GAAG,CAAE,CAAC,CACN,SAAS,CAAE,QAAQ,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAC7B,gBAAgB,CAAE,CAAC,CAAC,IAAI,CACxB,gBAAgB,CAAE;IAChB,EAAE,CAAC,KAAK,CAAC;IACT,IAAI,mBAAmB,CAAC,CAAC;IACzB,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;GACjB,CACD,OAAO,CAAE,EAAE,CACX,UAAU,CAAE,SAAS,CAAC,QAAQ,CAAC,IAAI,AACrC,CAAC,AAED,+BAAiB,CAAC,AAAQ,GAAG,AAAE,CAAC,AAC9B,KAAK,CAAE,IAAI,CACX,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,+BAAiB,CAAC,AAAQ,eAAe,AAAE,CAAC,AAC1C,SAAS,CAAE,QAAQ,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,AAC/B,CAAC,AAED,+BAAiB,CAAC,AAAQ,IAAI,AAAE,CAAC,AAC/B,WAAW,CAAE,gBAAgB,CAAC,CAAC,SAAS,CACxC,KAAK,CAAE,IAAI,mBAAmB,CAAC,CAC/B,OAAO,CAAE,QAAQ,CAAC,OAAO,CACzB,SAAS,CAAE,IAAI,AACjB,CAAC,AAED,+BAAiB,CAAC,AAAQ,GAAG,AAAE,CAAC,AAC9B,aAAa,CAAE,MAAM,CACrB,MAAM,CAAE,MAAM,CAAC,CAAC,CAChB,eAAe,CAAE,IAAI,YAAY,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAC1D,MAAM,CAAE,QAAQ,CAAC,IAAI,eAAe,CAAC,CAAC,KAAK,AAC7C,CAAC,AAED,+BAAiB,CAAC,AAAQ,4BAA4B,AAAE,CAAC,AACvD,gBAAgB,CAAE,IAAI,YAAY,CAAC,AACrC,CAAC,AAED,+BAAiB,CAAC,AAAQ,sBAAsB,AAAE,CAAC,AACjD,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,CACzC,MAAM,CAAE,MAAM,AAChB,CAAC,AAED,+BAAiB,CAAC,AAAQ,QAAQ,AAAE,CAAC,AACnC,OAAO,CAAE,CAAC,CACV,aAAa,CAAE,CAAC,AAClB,CAAC,AAED,+BAAiB,CAAC,AAAQ,YAAY,AAAE,CAAC,AACvC,SAAS,CAAE,QAAQ,CACnB,cAAc,CAAE,MAAM,CACtB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,UAAU,CAAE,MAAM,CAClB,WAAW,CAAE,KAAK,CAClB,MAAM,CAAE,IAAI,CAAC,CAAC,AAChB,CAAC,AAED,+BAAiB,CAAC,AAAQ,oBAAoB,AAAE,CAAC,AAC/C,OAAO,CAAE,IAAI,AACf,CAAC,AAED,+BAAiB,CAAC,AAAQ,mBAAmB,AAAE,CAAC,AAC9C,OAAO,CAAE,IAAI,AACf,CAAC,AAED,OAAO,IAAI,CAAC,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACzC,+BAAiB,CAAC,AAAQ,GAAG,AAAE,CAAC,AAC9B,WAAW,CAAE,KAAK,CAAC,UAAU,CAC7B,YAAY,CAAE,KAAK,CAAC,UAAU,CAC9B,aAAa,CAAE,CAAC,AAClB,CAAC,AACH,CAAC,AAED,OAAO,IAAI,CAAC,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACzC,eAAe,4BAAC,CAAC,AACf,WAAW,CAAE,CAAC,CAAC,CAAC,AAClB,CAAC,AAED,iBAAiB,4BAAC,CAAC,AACjB,WAAW,CAAE,CAAC,CAAC,CAAC,AAClB,CAAC,AAED,eAAe,4BAAC,CAAC,AACf,QAAQ,CAAE,CAAC,CAAC,CAAC,CACb,WAAW,CAAE,CAAC,CAAC,CAAC,AAClB,CAAC,AAED,gBAAgB,4BAAC,CAAC,AAChB,cAAc,CAAE,MAAM,AACxB,CAAC,AACH,CAAC"}'
};
const Project = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let {title} = $$props;
  let {desc} = $$props;
  let {demo} = $$props;
  let {source} = $$props;
  let {stack} = $$props;
  const currentSlug = $page.path;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.desc === void 0 && $$bindings.desc && desc !== void 0)
    $$bindings.desc(desc);
  if ($$props.demo === void 0 && $$bindings.demo && demo !== void 0)
    $$bindings.demo(demo);
  if ($$props.source === void 0 && $$bindings.source && source !== void 0)
    $$bindings.source(source);
  if ($$props.stack === void 0 && $$bindings.stack && stack !== void 0)
    $$bindings.stack(stack);
  $$result.css.add(css$9);
  $$unsubscribe_page();
  return `${$$result.head += `<link rel="${"preload"}" href="${"/prism-night-owl.css"}" as="${"style"}" data-svelte="svelte-vz1hne">`, ""}

${validate_component(SEO, "SEO").$$render($$result, {
    title,
    desc,
    thumbnail: `${data.siteUrl}/${currentSlug}/cover.webp`
  }, {}, {})}

<section class="${"project svelte-ank5nd"}"><div class="${"project__cover svelte-ank5nd"}"><div class="${"project__wrapper svelte-ank5nd"}"><img${add_attribute("src", `/assets/${currentSlug}/cover.webp`, 0)}${add_attribute("alt", title, 0)} class="${"project__img svelte-ank5nd"}" loading="${"lazy"}"></div></div>
  <div class="${"project__content svelte-ank5nd"}"><div class="${"project__header svelte-ank5nd"}"><h1 class="${"project__title svelte-ank5nd"}">${escape(title)}</h1>
      <div class="${"project__buttons svelte-ank5nd"}">${demo ? `<a class="${"project__demo svelte-ank5nd"}"${add_attribute("href", demo, 0)} target="${"_blank"}" rel="${"norel noreferrer"}">${validate_component(Chrome, "Chrome").$$render($$result, {className: "project__icon"}, {}, {})}Demo</a>` : ``}
        <a class="${"project__source svelte-ank5nd"}"${add_attribute("href", source, 0)} target="${"_blank"}" rel="${"norel noreferrer"}">${validate_component(Code, "Code").$$render($$result, {className: "card__icon"}, {}, {})}Source</a></div></div>
    <hr class="${"project__divider svelte-ank5nd"}">
    ${slots.default ? slots.default({}) : ``}</div>
  <div class="${"project__stack svelte-ank5nd"}"><span class="${"stack__title svelte-ank5nd"}">Tech Stack</span>
    <hr class="${"stack__divider svelte-ank5nd"}">
    ${each(stack, (item) => `<div class="${"stack__item svelte-ank5nd"}"><div class="${"stack__logo svelte-ank5nd"}"><img src="${"/assets/logo/" + escape(item[0].toLowerCase()) + ".png"}"${add_attribute("alt", item, 0)} style="${"filter: " + escape(item[0].toLowerCase() === "nextjs" ? "var(--filter-invert)" : "") + " "}" class="${"svelte-ank5nd"}"></div>
        <a${add_attribute("href", item[1], 0)} class="${"stack__name svelte-ank5nd"}" target="${"_blank"}" rel="${"norel noreferrer"}">${escape(item[0])}</a>
      </div>`)}</div></section>
${validate_component(ProgressButton, "ProgressButton").$$render($$result, {}, {}, {})}`;
});
const metadata$z = {
  title: "Brainly Scraper",
  date: "2020-09-12T00:00:00.000Z",
  desc: "A tiny (~2KB) library to scrape data from brainly written in Typescript.",
  demo: false,
  source: "https://github.com/elianiva/brainly-scraper-ts",
  layout: "project",
  stack: [["Typescript", "https://typescriptlang.org"]]
};
const Brainly_scraper_ts = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Project, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$z), {}, {
    default: () => `<p><strong>Brainly Scraper</strong> is a tiny (~2KB) library that I made for <a href="${"https://github.com/elianiva/img-to-sticker-bot"}" rel="${"nofollow"}">my whatsapp bot</a> which is now dead. I made this just for fun and learn Typescript.</p>
<p>After creating this library, I learned some stuff about HTTP request like headers which allow me to get the data from brainly. If the header isn\u2019t present then my request would get rejected.</p>
<p>I also learned that you can query into GraphQL server using <code>query</code> object on the request body. I thought you can only get a request from a GraphQL server using GraphQL client like Apollo, urql, and Relay.</p>
<p>This library might be buggy. I never found an error though, if you\u2019re interested with this library then feel free to give it a try.</p>`
  })}`;
});
var index$A = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Brainly_scraper_ts,
  metadata: metadata$z
});
const metadata$y = {
  title: "Old Personal Website",
  date: "2020-05-02T00:00:00.000Z",
  desc: "My old website made with Gatsby",
  demo: "https://old.elianiva.me",
  source: "https://github.com/elianiva/elianiva.github.io",
  layout: "project",
  stack: [["Gatsby", "https://gatsbyjs.org"], ["Vercel", "https://vercel.app"]]
};
const Old_personal_site = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Project, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$y), {}, {
    default: () => `<p>My previous website was made with GatsbyJS. It went through 2 iterations but the one that you\u2019re seeing now is the second iteration. The first one is way too ugly to a point where it\u2019s not worth to even show it :p</p>
<p>This is my first website that I\u2019ve put my whole effort into, I made it around February 2020 and redesign it around May 2020. I\u2019m actually quite surprised that I managed to make this website and maintain it overtime.</p>
<p>I learned a lot during the process of making this, not only about HTML/CSS/JS, but also about CI/CD. I used <a href="${"https://travis-ci.org"}" rel="${"nofollow"}">TravisCI</a> then moved to <a href="${"https://github.com/features/actions"}" rel="${"nofollow"}">Github Action</a> for this.</p>
<p>It was hosted on Github Page but I now moved it to Vercel just because I\u2019m hosting the rest of my stuff there. It\u2019s also nice that I don\u2019t have to care about CI/CD.</p>
<p>Don\u2019t expect any content there, they\u2019re all outdated and saved for historical purpose. Just pretend that they are some lorem ipsum text ;)</p>`
  })}`;
});
var index$z = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Old_personal_site,
  metadata: metadata$y
});
const metadata$x = {
  title: "Nyaa.si Scraper",
  date: "2021-01-17T00:00:00.000Z",
  desc: "Scraper for nyaa.si made with Rust and Typescript.",
  demo: false,
  source: "https://github.com/elianiva/nyaa-si-scraper",
  layout: "project",
  stack: [["Deno", "https://deno.land"], ["Rust", "https://www.rust-lang.org/"]]
};
const Nyaa_si_scraper = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Project, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$x), {}, {
    default: () => `<p><strong>Nyaa.si Scraper</strong> is a scraper that I made to play around with Rust and Deno. The idea came from my friend, but he made this using Golang.</p>
<p>It was a fun little thing to do in my spare time. It\u2019s also the first thing I made with Deno. Feel free to try it if you want :)</p>
<p>Both Rust and Deno version looks the same. Here\u2019s how it looks.</p>
<p><img src="${"/assets/project/nyaa-si-scraper/preview.webp"}" alt="${"preview"}"></p>`
  })}`;
});
var index$y = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Nyaa_si_scraper,
  metadata: metadata$x
});
const metadata$w = {
  title: "Covid Info v2",
  date: "2021-01-07T00:00:00.000Z",
  desc: "A remake of my previous app that shows the current COVID19 data. Made with Next, Typescript, and Twind",
  demo: "https://covid-info-v2.vercel.app",
  source: "https://github.com/elianiva/covid-info-v2",
  layout: "project",
  stack: [
    ["Typescript", "https://typescriptlang.org"],
    ["Apexcharts", "https://apexcharts.com"],
    ["Leaflet", "https://leafletjs.com"],
    ["TwindCSS", "https://twind.dev"],
    ["Vercel", "https://vercel.app"]
  ]
};
const Covid_info_v2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Project, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$w), {}, {
    default: () => `<p><strong>Covid Info v2</strong> is a remake of my previous version which you can check <a href="${"https://elianiva.me/project/covid-info"}" rel="${"nofollow"}">over here</a>.</p>
<p>I made the first version a few months ago, around May 2020. It was my first React app that I ever made with a third party API instead of static data. It was made with React, Javascript, and Vanilla CSS.</p>
<p>Since that time, I\u2019ve learned <em>a lot</em> about Javascript. Turns out there\u2019s this thing called Typescript which is an <em>awesome</em> thing, it\u2019s Javscript but statically typed/strong typed. I also found out about <a href="${"https://nextjs.org"}" rel="${"nofollow"}">NextJS</a> which is basically <a href="${"https://reactjs.org"}" rel="${"nofollow"}">React</a> + more features like SSR, SSG, and a bunch more cool features.</p>
<p>I decided to remake this app to see how far I\u2019ve learned these technologies. It\u2019s also because my friend want to make a similar app, hence I decided to make this so I can help him along the way.</p>
<p>I chose Typescript because it\u2019s like a godsend for Javascript developers, it\u2019s so pleasant to work with. It provides a better development experience. I also decided to use <a href="${"https://twind.dev"}" rel="${"nofollow"}">twind</a> that I found recently. It\u2019s also my first css-in-js library that I\u2019ve ever used. TwindCSS is basically one of css-in-js solution for <a href="${"https://tailwindcss.com"}" rel="${"nofollow"}">TailwindCSS</a>. I chose it because it\u2019s really unique in my opinion, instead of shipping the prebuilt CSS to the end user, it ships the compiler. So, no matter how many styles you have, the end result would be ~10KB. Quoting from its official docs.</p>
<blockquote><p>Another big advantage we see of shipping the interpreter compiler itself (rather than pre-compiled output) is that the effective size of the CSS for your whole app is deterministic and fixed. The weight of the compiler itself along with your theme file is all that users will ever download, no matter how many styles you use.</p></blockquote>
<blockquote><p>Currently the compiler weighs around 10KB which is smaller than styled-components and the average tailwind output.</p></blockquote>
<p>I use the API provided by <a href="${"https://disease.sh/"}" rel="${"nofollow"}">disease.sh</a>. They have quite a lot of endpoints that you can use. More than enough for my needs.</p>
<p>Design wise, I took some of it from this <a href="${"https://dribbble.com/shots/10803637-Corona-Virus-Covid-19-Dashboard"}" rel="${"nofollow"}">beautiful dribbble shot</a>. It\u2019s easy enough to implement since I\u2019m quite good at CSS (at least that\u2019s what I think :p) because I am so used to implement a design every week for <a href="${"https://elianiva.me/project/svelteception"}" rel="${"nofollow"}">svelteception</a>. All goes well, except for the world map section.</p>
<p>I never made any map related thing, so this is the first time I use a map library like <a href="${"https://leafletjs.com"}" rel="${"nofollow"}">LeafletJS</a>. Since I use NextJS which utilize SSR, I can\u2019t just import Leaflet as is because it needs a <code>window</code> object. At first, I\u2019m using <a href="${"https://github.com/masotime/react-leaflet-universal"}" rel="${"nofollow"}">react-leaflet-universal</a> but I\u2019m not sure if that\u2019s the best solution.
The next day, I found out that NextJS can import a module <em>only</em> if the page has been rendered on the client side by using its <code>dynamic</code> module, I was blown away the first time I found it. I no longer need a thin wrapper like react-leaflet-universal.</p>
<p>I was going to make a feature where if you click on a country, it would zoom the map but ended up not doing it because I have no idea how to do it, I\u2019ve Google it up and still couldn\u2019t find any solution.</p>
<p>Initially, I want to make it responsive/mobile friendly. Twind has this nice feature where you can group tailwindcss directives. It looks something like this <code>md:(col(start-1 end-2) row(start-2 end-4))</code>, this saves me a lot of time. After doing that for maybe half and hour, I thought it doesn\u2019t look that good in terms of UI/UX so I threw it away.</p>
<p>I use <a href="${"https://vercel.com/"}" rel="${"nofollow"}">Vercel</a> to deploy this app. I really love Vercel because they provide so many features yet it\u2019s still free. Deploying NextJS app on Vercel is really easy because NextJS is also made by Vercel so they must have optimised their platform for NextJS app. You can even get analytics if you deploy your NextJS app on Vercel.</p>
<p>Honestly, I am quite proud of this one. I learned a lot along the way, seeing them compared side by side made me happy. I didn\u2019t waste a year doing nothing, I made some progress.</p>`
  })}`;
});
var index$x = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Covid_info_v2,
  metadata: metadata$w
});
const metadata$v = {
  title: "Svelteception",
  date: "2020-09-28T00:00:00.000Z",
  desc: "A website where I put the result of a small challenge that I did every week",
  demo: "https://svelteception.elianiva.me",
  source: "https://github.com/elianiva/svelteception",
  layout: "project",
  stack: [["Routify", "https://routify.dev"], ["Vercel", "https://vercel.app"]]
};
const Svelteception = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Project, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$v), {}, {
    default: () => `<p><strong>Svelteception</strong> is a website that I made to put all of website that I made for a challenge that I did every week with my friends. <a href="${"https://github.com/nikarashihatsu/"}" rel="${"nofollow"}">NikarashiHatsu</a> and <a href="${"https://github.com/lynsotera/"}" rel="${"nofollow"}">LynSotera</a>. It\u2019s basically converting UI designs that we found on the internet. Initially, we want to make 3 website each week. But man, we\u2019re so busy that we only have time to make one :p</p>
<p>I didn\u2019t have the idea to make a dedicated site just to showcase all of the design. <a href="${"https://github.com/nikarashihatsu/"}" rel="${"nofollow"}">NikarashiHatsu</a> made his homepage then I thought it was a good idea to have a dedicated website for it. I was going to just put it on the repo readme.</p>
<p>This challenge has been quite a fun experience so far. I\u2019m looking forward to how many designs that I\u2019ll be able to implement before I decided to stop or don\u2019t have time to do this anymore.</p>
<p>If you want to know more about this project, please visit the website :)</p>`
  })}`;
});
var index$w = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Svelteception,
  metadata: metadata$v
});
const metadata$u = {
  title: "School Stuff",
  date: "2020-07-19T00:00:00.000Z",
  desc: "A website where I put some of my school assignment cuz why not. Made with Next.js",
  demo: "https://school-stuff.vercel.app",
  source: "https://github.com/elianiva/school-log",
  layout: "project",
  stack: [["NextJS", "https://nextjs.org"], ["Vercel", "https://vercel.app"]]
};
const School_stuff = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Project, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$u), {}, {
    default: () => `<p><strong>School Stuff</strong> is a website that I made to write some of my assignment that I got during covid pandemic because I\u2019m way too lazy to write it down on a paper so I ended up making a website for it. I also made this to make it easier to share it with my friend.</p>
<p>I also learned how to make a route using 2 parameters on NextJS. Thanks to <a href="${"http://github.com/talentlessguy/"}" rel="${"nofollow"}">v1rtl</a> who gave me this idea.</p>
<p>The site is pretty basic. I just need it to write some markdown, nothing fancy going on.</p>
<p>And yes, the name is a throw away name.</p>`
  })}`;
});
var index$v = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: School_stuff,
  metadata: metadata$u
});
var Update_svelte = '.update.svelte-1xo4abp{background-color:var(--color-alt-bg);border:0.0625rem var(--color-borders) solid;border-left:0.125rem var(--color-main-accent) solid}.update__header.svelte-1xo4abp{padding:0.5rem 1rem;background-color:var(--color-main-bg);color:var(--color-main-text);font-family:"Overpass", sans-serif;display:flex;align-items:center;justify-content:space-between}.update__title.svelte-1xo4abp{font-weight:600}.update__date.svelte-1xo4abp{color:var(--color-alt-text)}.update__content.svelte-1xo4abp{padding:1rem;color:var(--color-main-text);background-color:var(--color-alt-bg);font-size:1.125rem;line-height:1.75em}';
const css$8 = {
  code: '.update.svelte-1xo4abp{background-color:var(--color-alt-bg);border:0.0625rem var(--color-borders) solid;border-left:0.125rem var(--color-main-accent) solid}.update__header.svelte-1xo4abp{padding:0.5rem 1rem;background-color:var(--color-main-bg);color:var(--color-main-text);font-family:"Overpass", sans-serif;display:flex;align-items:center;justify-content:space-between}.update__title.svelte-1xo4abp{font-weight:600}.update__date.svelte-1xo4abp{color:var(--color-alt-text)}.update__content.svelte-1xo4abp{padding:1rem;color:var(--color-main-text);background-color:var(--color-alt-bg);font-size:1.125rem;line-height:1.75em}',
  map: '{"version":3,"file":"Update.svelte","sources":["Update.svelte"],"sourcesContent":["<style>\\n.update {\\n  background-color: var(--color-alt-bg);\\n  border: 0.0625rem var(--color-borders) solid;\\n  border-left: 0.125rem var(--color-main-accent) solid;\\n}\\n\\n.update__header {\\n  padding: 0.5rem 1rem;\\n  background-color: var(--color-main-bg);\\n  color: var(--color-main-text);\\n  font-family: \\"Overpass\\", sans-serif;\\n  display: flex;\\n  align-items: center;\\n  justify-content: space-between;\\n}\\n\\n.update__title {\\n  font-weight: 600;\\n}\\n\\n.update__date {\\n  color: var(--color-alt-text);\\n}\\n\\n.update__content {\\n  padding: 1rem;\\n  color: var(--color-main-text);\\n  background-color: var(--color-alt-bg);\\n  font-size: 1.125rem;\\n  line-height: 1.75em;\\n}\\n</style>\\n\\n<section class=\\"update\\">\\n  <div class=\\"update__header\\">\\n    <span class=\\"update__title\\">UPDATE</span>\\n    <span class=\\"update__date\\">{formattedDate}</span>\\n  </div>\\n  <div class=\\"update__content\\">\\n    <slot />\\n  </div>\\n</section>\\n\\n<script lang=\\"ts\\">export let date = \\"\\";\\nconst d = new Date(parseInt(date.substring(6, 10)), parseInt(date.substring(3, 5)), parseInt(date.substring(0, 2)));\\nconst formattedDate = d.toLocaleDateString(\\"en-UK\\", {\\n    weekday: \\"short\\",\\n    year: \\"numeric\\",\\n    month: \\"long\\",\\n    day: \\"numeric\\",\\n});\\n</script>\\n"],"names":[],"mappings":"AACA,OAAO,eAAC,CAAC,AACP,gBAAgB,CAAE,IAAI,cAAc,CAAC,CACrC,MAAM,CAAE,SAAS,CAAC,IAAI,eAAe,CAAC,CAAC,KAAK,CAC5C,WAAW,CAAE,QAAQ,CAAC,IAAI,mBAAmB,CAAC,CAAC,KAAK,AACtD,CAAC,AAED,eAAe,eAAC,CAAC,AACf,OAAO,CAAE,MAAM,CAAC,IAAI,CACpB,gBAAgB,CAAE,IAAI,eAAe,CAAC,CACtC,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,aAAa,AAChC,CAAC,AAED,cAAc,eAAC,CAAC,AACd,WAAW,CAAE,GAAG,AAClB,CAAC,AAED,aAAa,eAAC,CAAC,AACb,KAAK,CAAE,IAAI,gBAAgB,CAAC,AAC9B,CAAC,AAED,gBAAgB,eAAC,CAAC,AAChB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,gBAAgB,CAAE,IAAI,cAAc,CAAC,CACrC,SAAS,CAAE,QAAQ,CACnB,WAAW,CAAE,MAAM,AACrB,CAAC"}'
};
const Update = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {date = ""} = $$props;
  const d = new Date(parseInt(date.substring(6, 10)), parseInt(date.substring(3, 5)), parseInt(date.substring(0, 2)));
  const formattedDate = d.toLocaleDateString("en-UK", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  if ($$props.date === void 0 && $$bindings.date && date !== void 0)
    $$bindings.date(date);
  $$result.css.add(css$8);
  return `<section class="${"update svelte-1xo4abp"}"><div class="${"update__header svelte-1xo4abp"}"><span class="${"update__title svelte-1xo4abp"}">UPDATE</span>
    <span class="${"update__date svelte-1xo4abp"}">${escape(formattedDate)}</span></div>
  <div class="${"update__content svelte-1xo4abp"}">${slots.default ? slots.default({}) : ``}</div>
</section>`;
});
const metadata$t = {
  title: "Covid Info",
  date: "2020-04-22T00:00:00.000Z",
  desc: "A simple app to get current covid data. Made with React.",
  demo: "https://covid-info.now.sh",
  source: "https://github.com/elianiva/covid-info",
  layout: "project",
  stack: [
    ["ReactJS", "https://reactjs.org"],
    ["ChartJS", "https://chartjs.org"],
    ["Vercel", "https://vercel.app"]
  ]
};
const Covid_info = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Project, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$t), {}, {
    default: () => `<p><strong>Covid Info</strong> is the first React app I made that uses a third party API as its data source. This app is also kinda buggy because when I made it, I don\u2019t really care about any other feature except the homepage that shows current covid data.</p>
<p>I\u2019m planning on remaking this if I got time for it using Svelte.</p>
${validate_component(Update, "Update").$$render($$result, {date: "01-05-2021"}, {}, {
      default: () => `<p>I\u2019ve made a remake using NextJS. I didn\u2019t choose Svelte because I want to explore more stuff about NextJS and I\u2019ve done quite a bit of Svelte recently, so doing something different is nice. You can check it out <a href="${"https://elianiva.me/project/covid-info-v2"}" rel="${"nofollow"}">here</a></p>`
    })}`
  })}`;
});
var index$u = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Covid_info,
  metadata: metadata$t
});
const metadata$s = {
  title: "Kana Board",
  date: "2020-06-25T00:00:00.000Z",
  desc: "An app to help me memorise Japanese vocab. Made with React, Redux, and Tailwind",
  demo: "https://kana-board.vercel.app",
  source: "https://github.com/elianiva/kana-board",
  layout: "project",
  stack: [
    ["ReactJS", "https://reactjs.org"],
    ["Redux", "https://redux.js.org"],
    ["TailwindCSS", "https://tailwindcss.com"],
    ["Vercel", "https://vercel.app"]
  ]
};
const Kana_board = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Project, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$s), {}, {
    default: () => `<p><strong>Kana Board</strong> is a simple app that I made with React + Redux. The reason why I made this is to help me memorize Japanese vocabulary. Another reason is that I am learning Redux and todolist app is hella boring to make. I won\u2019t use it either since I never arrange my activities :p I just do something whenever I feel like it.</p>
<p>I got this idea from a Youtube video from a channel called Japanese Ammo With Misa. She did this by using a book, but I can\u2019t be bothered to grab a pen and write it using my hand because my handwriting is ugly as heck. Most likely I ended up not reading it because I couldn\u2019t read it. So I made this app instead.
Basically, you have some sort of table with 5 columns in it. The first column is used to write the kana of that Japanese word. The second column is used to write the meaning of that word in English. Then the third column is to write an example of that word in a sentence, it will highlight the word that is written in the first column to make it more clear on which part of a sentence that word is used. The fourth column is used to write the context, it explains briefly when to use that word. Finally, the last column is used to write my own example.</p>
<p>I made the table so that it can only be edited when the date of the table creation is the same as your current date. Basically, it\u2019s only editable for a day (it\u2019s not always 24 hours, it depends on when you create it). I did this because I want to see how many words I learned in a day and I don\u2019t want to cheat by adding a new word in a table that is created a week ago.</p>
<p>I don\u2019t use this app anymore since I moved to Anki.</p>`
  })}`;
});
var index$t = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Kana_board,
  metadata: metadata$s
});
const metadata$r = {
  title: "Umaru Chat",
  date: "2020-09-19T00:00:00.000Z",
  desc: "A realtime chat app made with React, Firebase, and Typescript",
  demo: false,
  source: "https://github.com/elianiva/umaru-chat",
  layout: "project",
  stack: [
    ["ReactJS", "https://reactjs.com"],
    ["Typescript", "https://typescriptlang.org"],
    ["Firebase", "https://firebase.google.com"]
  ]
};
const Umaru_chat = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Project, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$r), {}, {
    default: () => `<p><strong>Umaru Chat</strong> is a chat app that I made to push my skillset further. I never made a fullstack app before and barely know about backend stuff so what I ended up doing is using BaaS (Backend as a Service) which is Firebase. I also want to try to make a React app using Typescript. Honestly, I proud that I\u2019m able to make this app but at the same time I\u2019m not really proud of this app because it\u2019s my first time and obviously the code is a mess.</p>
<p>I don\u2019t know the type definition for Firebase so I used <code>any</code> which should be avoided when using Typescript. I don\u2019t follow any tutorial (which I probably should), I just google stuff up if I got confused and just slapp dem code with the solution that I found from the internet.</p>
<p>There\u2019s some issue with this app which is if you don\u2019t leave the room using the <strong>quit</strong> button then the usercount for the room won\u2019t go down. I have experienced enough pain that I don\u2019t want to touch this app ever again.</p>
<p>Basic chatting feature works though, so it\u2019s not a broken app. The reason why I chose the name <strong>Umaru Chat</strong> is because I saw Umaru-chan when I was randomly scrolling twitter and thought \u201Caight, that\u2019ll be my chatapp name\u201D. As you may or may not have known, I can\u2019t choose a good name for <em>anything</em>.</p>`
  })}`;
});
var index$s = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Umaru_chat,
  metadata: metadata$r
});
const metadata$q = {
  title: "Kanaizu",
  date: "2020-09-29T00:00:00.000Z",
  desc: "A japanese kana quiz app built using Routify and TailwindCSS",
  demo: "https://kanaizu.vercel.app",
  source: "https://github.com/elianiva/kanaizu",
  layout: "project",
  stack: [
    ["Routify", "https://routify.dev"],
    ["TailwindCSS", "https://tailwindcss.com"],
    ["Vercel", "https://vercel.app"]
  ]
};
const Kanaizu = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Project, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$q), {}, {
    default: () => `<p><strong>Kanaizu</strong> is an app that I made when I was starting to learn Svelte. I made this app because I want to help my friend memorise Japanese kana because we\u2019re both learning Japanese at the time I\u2019m writing this. It\u2019s also because I want to try Routify. I made this app for about a week, maybe that\u2019s way too long but hey, it was my second time so I barely know the basics.</p>
<p>I got the data from <a href="${"https://en.wikibooks.org/wiki/JLPT_Guide"}" rel="${"nofollow"}">Wikibooks</a>. It has around ~508 words. I picked them randomly, most of them are N5 and N4. I picked them using a weird method. As you can see, the words that they provide has kanji because that\u2019s how you would use it, with kanji. I only want the hiragana or katakana version. So what I did was scrape the data and make this tiny and unefficient script using js that would transform the data that I got from the site which is an array of words into an object that looks something like this.</p>
<pre class="${"language-json"}">${`<code class="language-json"><span class="token punctuation">&#123;</span>
  <span class="token property">"data"</span><span class="token operator">:</span> <span class="token punctuation">[</span>
    <span class="token punctuation">&#123;</span>
      <span class="token property">"hiragana"</span><span class="token operator">:</span> <span class="token string">"\u305F\u3079\u308B"</span><span class="token punctuation">,</span>
      <span class="token property">"romaji"</span><span class="token operator">:</span> <span class="token string">"taberu"</span>
    <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
    <span class="token punctuation">&#123;</span>
      <span class="token property">"hiragana"</span><span class="token operator">:</span> <span class="token string">"\u308F\u304B\u308B"</span><span class="token punctuation">,</span>
      <span class="token property">"romaji"</span><span class="token operator">:</span> <span class="token string">"wakaru"</span>
    <span class="token punctuation">&#125;</span>
  <span class="token punctuation">]</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<p>I converted it from kanji to hiragana/katakana using <a href="${"https://nihongodera.com/tools/kana-converter"}" rel="${"nofollow"}">this tool</a>. Big thanks for the creator of that tool. It would be <em>very</em> tedious if it didn\u2019t exist. Imagine converting hundreds of words manually.</p>
<p>I use Tailwind CSS for this project which means that I have to setup postcss. Again, because this is my second time trying Routify and my first time setting up Tailwind CSS specifically for Routify, as expected, I messed up. I have no idea what I was doing until a few hours later but it\u2019s worth it. I learned something new.</p>
<p>I you\u2019re interested with this app, go ahead and try it yourself \u30C4</p>
<p>There\u2019s some inconsistency though, but it\u2019s <em>rarely</em> appear. I can\u2019t fix it because it\u2019s quite unpredictable. Basically, it won\u2019t show your score. Just refresh the app if this happen.</p>`
  })}`;
});
var index$r = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Kanaizu,
  metadata: metadata$q
});
const metadata$p = {
  title: "GH Jobs",
  date: "2021-02-13T00:00:00.000Z",
  desc: "Simple app that I made when trying out Svelte-Kit which uses Github Job API",
  demo: "https://svlt.elianiva.me",
  source: "https://github.com/elianiva/gh-job",
  layout: "project",
  stack: [
    ["Svelte-Kit", "https://svelte.dev"],
    ["Typescript", "https://typescriptlang.org"],
    ["Snowpack", "https://www.snowpack.dev"]
  ]
};
const Gh_job = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Project, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$p), {}, {
    default: () => `<p><strong>GH Job</strong> is a simple app that I made when I was trying out Svelte-Kit. It gets its data from Github Job API and display it using a simple card.</p>
<p>You can read more about my thoughts about this app and Svelte-Kit in general <a href="${"/post/trying-out-sveltekit"}">here</a>.</p>
<p>It can filter the result by the title, location, and whether if it\u2019s a full-time job or not. It also has dark mode.</p>
<p>It\u2019s pretty basic since I only made this for an experimental purpose.</p>`
  })}`;
});
var index$q = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Gh_job,
  metadata: metadata$p
});
const metadata$o = {
  title: "Skaga",
  date: "2020-07-23T00:00:00.000Z",
  desc: "SMKN 3 Jember's site remake using NextJS and TailwindCSS",
  demo: "https://skaga.vercel.app",
  source: "https://github.com/elianiva/skaga",
  layout: "project",
  stack: [
    ["NextJS", "https://nextjs.org"],
    ["TailwindCSS", "https://tailwindcss.com"],
    ["Vercel", "https://vercel.app"]
  ]
};
const Skaga = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Project, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$o), {}, {
    default: () => `<p><strong>Skaga</strong> is a website that I made as an attempt to remake my <a href="${"https://smk3jember.sch.id"}" rel="${"nofollow"}">school\u2019s website</a>. This is my first website that I built using NextJS. It was a pleasant experience using NextJS for the first time. All goes well and nothing messed up.</p>
<p>This website is also the first time I made a dropdown for the navbar and surprisingly it works the first time I made it. I\u2019m quite proud of the design of this website. I personally think this is <em>way better</em> than the old one.</p>
<p>Initially, I want to try to integrate it with <a href="${"https://strapi.io/"}" rel="${"nofollow"}">strapi</a> but it got cancelled. I changed my mind because I don\u2019t see any point of me doing this. Simple markdown files for the post is enough.</p>
<p>There\u2019s one issue though. I couldn\u2019t make the lazy-loaded images work so you\u2019d have to suffer when you visit the website for the first time.</p>
<p>Not all of the content is completed since I just want to make the \u2018big picture\u2019 of the website. It\u2019s not going to be used so why would I even bother to complete it.</p>`
  })}`;
});
var index$p = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Skaga,
  metadata: metadata$o
});
var about_svelte = '.about.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{max-width:1080px;margin:0 auto;color:var(--color-main-text);padding:2rem 1rem 0}.about__section.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{max-width:80ch;margin:auto}.about__section.svelte-1968ri5 p.svelte-1968ri5+p.svelte-1968ri5{margin-top:1.5rem}.about__heading.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{position:relative;font-family:"Overpass", sans-serif;color:var(--color-main-text);font-size:2rem;margin:0 0 1rem}.about__heading.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5:not(:first-child){margin-top:2rem}.about__heading.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5::after{content:"";position:absolute;left:0;right:0;bottom:0;height:0.125rem;background-image:linear-gradient(\n    to right,\n    var(--color-main-accent),\n    rgba(0, 0, 0, 0)\n  )}.about__text.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{font-family:"Open Sans", sans-serif;color:var(--color-main-text);font-size:1.125rem;line-height:2em}.about__details.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{margin:1rem 0;font-family:"Open Sans", sans-serif}.about__summary.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{color:var(--color-main-text);transition:color ease-out 0.2s;font-size:1.125rem;cursor:pointer;outline:none}.about__summary.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5:hover{color:var(--color-main-accent)}.about__link.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{position:relative;display:inline-block;color:var(--color-main-accent);text-decoration:none;transition:all ease-out 0.2s}.about__link.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5::before{position:absolute;content:"";bottom:0.25rem;left:-0.25rem;right:-0.25rem;top:0.25rem;transform:scale3d(0, 0.1, 1);transform-origin:0 100%;background-image:linear-gradient(\n    to right,\n    var(--color-main-accent),\n    rgba(0, 0, 0, 0)\n  );z-index:-1;transition:transform ease-out 0.2s}.about__link.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5:hover::before{transform:scale3d(1, 0.1, 1)}.about__paren.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{color:var(--color-alt-text)}';
const css$7 = {
  code: '.about.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{max-width:1080px;margin:0 auto;color:var(--color-main-text);padding:2rem 1rem 0}.about__section.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{max-width:80ch;margin:auto}.about__section.svelte-1968ri5 p.svelte-1968ri5+p.svelte-1968ri5{margin-top:1.5rem}.about__heading.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{position:relative;font-family:"Overpass", sans-serif;color:var(--color-main-text);font-size:2rem;margin:0 0 1rem}.about__heading.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5:not(:first-child){margin-top:2rem}.about__heading.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5::after{content:"";position:absolute;left:0;right:0;bottom:0;height:0.125rem;background-image:linear-gradient(\n    to right,\n    var(--color-main-accent),\n    rgba(0, 0, 0, 0)\n  )}.about__text.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{font-family:"Open Sans", sans-serif;color:var(--color-main-text);font-size:1.125rem;line-height:2em}.about__details.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{margin:1rem 0;font-family:"Open Sans", sans-serif}.about__summary.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{color:var(--color-main-text);transition:color ease-out 0.2s;font-size:1.125rem;cursor:pointer;outline:none}.about__summary.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5:hover{color:var(--color-main-accent)}.about__link.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{position:relative;display:inline-block;color:var(--color-main-accent);text-decoration:none;transition:all ease-out 0.2s}.about__link.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5::before{position:absolute;content:"";bottom:0.25rem;left:-0.25rem;right:-0.25rem;top:0.25rem;transform:scale3d(0, 0.1, 1);transform-origin:0 100%;background-image:linear-gradient(\n    to right,\n    var(--color-main-accent),\n    rgba(0, 0, 0, 0)\n  );z-index:-1;transition:transform ease-out 0.2s}.about__link.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5:hover::before{transform:scale3d(1, 0.1, 1)}.about__paren.svelte-1968ri5.svelte-1968ri5.svelte-1968ri5{color:var(--color-alt-text)}',
  map: `{"version":3,"file":"about.svelte","sources":["about.svelte"],"sourcesContent":["<style>\\n.about {\\n  max-width: 1080px;\\n  margin: 0 auto;\\n  color: var(--color-main-text);\\n  padding: 2rem 1rem 0;\\n}\\n\\n.about__section {\\n  max-width: 80ch;\\n  margin: auto;\\n}\\n\\n.about__section p + p {\\n  margin-top: 1.5rem;\\n}\\n\\n.about__heading {\\n  position: relative;\\n  font-family: \\"Overpass\\", sans-serif;\\n  color: var(--color-main-text);\\n  font-size: 2rem;\\n  margin: 0 0 1rem;\\n}\\n\\n.about__heading:not(:first-child) {\\n  margin-top: 2rem;\\n}\\n\\n.about__heading::after {\\n  content: \\"\\";\\n  position: absolute;\\n  left: 0;\\n  right: 0;\\n  bottom: 0;\\n  height: 0.125rem;\\n  background-image: linear-gradient(\\n    to right,\\n    var(--color-main-accent),\\n    rgba(0, 0, 0, 0)\\n  );\\n}\\n\\n.about__text {\\n  font-family: \\"Open Sans\\", sans-serif;\\n  color: var(--color-main-text);\\n  font-size: 1.125rem;\\n  line-height: 2em;\\n}\\n\\n.about__details {\\n  margin: 1rem 0;\\n  font-family: \\"Open Sans\\", sans-serif;\\n}\\n\\n.about__summary {\\n  color: var(--color-main-text);\\n  transition: color ease-out 0.2s;\\n  font-size: 1.125rem;\\n  cursor: pointer;\\n  outline: none;\\n}\\n\\n.about__summary:hover {\\n  color: var(--color-main-accent);\\n}\\n\\n.about__link {\\n  position: relative;\\n  display: inline-block;\\n  color: var(--color-main-accent);\\n  text-decoration: none;\\n  transition: all ease-out 0.2s;\\n}\\n\\n.about__link::before {\\n  position: absolute;\\n  content: \\"\\";\\n  bottom: 0.25rem;\\n  left: -0.25rem;\\n  right: -0.25rem;\\n  top: 0.25rem;\\n  transform: scale3d(0, 0.1, 1);\\n  transform-origin: 0 100%;\\n  background-image: linear-gradient(\\n    to right,\\n    var(--color-main-accent),\\n    rgba(0, 0, 0, 0)\\n  );\\n  z-index: -1;\\n  transition: transform ease-out 0.2s;\\n}\\n\\n.about__link:hover::before {\\n  transform: scale3d(1, 0.1, 1);\\n}\\n\\n.about__paren {\\n  color: var(--color-alt-text);\\n}\\n</style>\\n\\n<SEO title=\\"About\\" />\\n\\n<section class=\\"about\\">\\n  <section class=\\"about__section\\">\\n    <h1 class=\\"about__heading\\">About Me</h1>\\n    <p class=\\"about__text\\">\\n      Hi there! I'm Elianiva. My online alias was taken from my middle name\\n      without the first and last letter. My name is Dicha Zelianivan Arkana. I'm\\n      a 17 y/o Asian boi who loves to build websites (or any software related\\n      things at this point) and contribute to any open source projects that I\\n      like.\\n    </p>\\n    <p class=\\"about__text\\">\\n      I've been learning web development since Q3 2019. I know HTML, CSS, and\\n      JS/TS and all that jazz quite well. Currently interested on learning lower\\n      level language like Rust. I also quite like Lua since I use Neovim and\\n      AwesomeWM.\\n    </p>\\n    <p class=\\"about__text\\">\\n      I was born and raised in Indonesia. I can speak Indonesian natively\\n      <span class=\\"about__paren\\">(obviously)</span>, and English quite fluently.\\n      I am currently learning Japanese because I want to be able to speak a\\n      language that uses a different writing system. Also, I want to try to live\\n      abroad in the future.\\n    </p>\\n    <p class=\\"about__text\\">\\n      If you want to reach me then feel free to hit me up on\\n      <a\\n        class=\\"about__link\\"\\n        href=\\"https://twitter.com/@elianiva_\\"\\n        target=\\"_blank\\"\\n        rel=\\"norel noreferrer\\">Twitter</a\\n      >\\n      or Discord @elianiva#1558. I rarely checked Twitter and only use it for Vtuber\\n      or Art related stuff. I became more active on Discord lately though, so that'd\\n      be a better option to reach me out. Or you can just\\n      <a\\n        class=\\"about__link\\"\\n        href=\\"mailto:dicha.arkana03@gmail.com\\"\\n        target=\\"_blank\\"\\n        rel=\\"norel noreferrer\\">email me</a\\n      >, I check my email quite often.\\n    </p>\\n    <details class=\\"about__details\\">\\n      <summary class=\\"about__summary\\">\\n        Fun fact about me (click this if you really want to know me ;)\\n      </summary>\\n      <p class=\\"about__text\\" style=\\"margin-top: 1rem;\\" transition:fade>\\n        I'm that guy who easily gets obsessed with something that I found\\n        interesting. One of them is\\n        <a\\n          class=\\"about__link\\"\\n          target=\\"_blank\\"\\n          rel=\\"norel noreferrer\\"\\n          href=\\"https://www.youtube.com/user/BABYMETALofficial\\">Babymetal</a\\n        >, I found them out around March 2020 and got instantly obsessed with\\n        them. They are the main reason why I decided to learn Japanese and\\n        appreciate Japanese culture.\\n      </p>\\n      <p class=\\"about__text\\">\\n        I also love an anime called Kill La Kill (as you might have known\\n        judging by my github profile), I took Senketsu and Junketsu colour for\\n        my website \u30C4\\n      </p>\\n      <p class=\\"about__text\\">\\n        I also love Vtubers. Before I watch them, I said to myself \\"why would I\\n        watch some random 2D anime character streaming on Youtube?\\" but here I\\n        am, ended up watching\\n        <i>a lot</i>\\n        of vtubers on my free time. It also helped me learn Japanese a bit.\\n      </p>\\n      <p class=\\"about__text\\">\\n        Some weird thing about me is, I don't really like to discuss stuff that\\n        I like with other people (not all of them, I do enjoy talking about\\n        anime related stuff with my friends). I don't know why, I like some\\n        things better if I just enjoy it myself and not talk about it with other\\n        people.\\n      </p>\\n    </details>\\n    <h1 class=\\"about__heading\\">My Website</h1>\\n    <p class=\\"about__text\\">\\n      I made this website mainly because I want to keep a note to myself, but I\\n      thought it's a good idea to make it public. I sometimes forgot stuff that\\n      I did. By having this website, I can just revisit what I've done in the\\n      past.\\n    </p>\\n    <p class=\\"about__text\\">\\n      I use Sapper and MDSveX to build this website and it's hosted on Vercel.\\n      If you want more detail about my website the you might want to read\\n      <a\\n        class=\\"about__link\\"\\n        href=\\"{data.siteUrl}/post/i-rebuild-my-site-using-sapper\\">this post</a\\n      >\\n      where I explain the process of making this site.\\n    </p>\\n    <p class=\\"about__text\\">\\n      The picture that you see on the home page is Ryuko Matoi from Kill La\\n      Kill. It was commissioned from\\n      <a\\n        class=\\"about__link\\"\\n        href=\\"https://twitter.com/enzore_\\"\\n        target=\\"_blank\\"\\n        rel=\\"noreferrer norel\\">Enzore</a\\n      >, such a cool artist. Do yourself a favour by checking his artworks! I\\n      took it from my\\n      <a\\n        class=\\"about__link\\"\\n        href={data.github}\\n        target=\\"_blank\\"\\n        rel=\\"noreferrer norel\\">github pfp</a\\n      >\\n      so that might change in the future. Also, if you noticed the icon for my website,\\n      it's a shitty drawing of\\n      <a\\n        class=\\"about__link\\"\\n        href=\\"https://knowyourmeme.com/photos/709240-kill-la-kill\\"\\n        target=\\"_blank\\"\\n        rel=\\"noreferrer norel\\">derp eyed Ryuko</a\\n      >\\n      that I made a while back. I like to draw every now and then just for fun.\\n    </p>\\n    <h1 class=\\"about__heading\\">My Setup</h1>\\n    <p class=\\"about__text\\">\\n      My laptop is Thinkpad X220. I use Linux as my Operating System.\\n      <a href=\\"https://archlinux.org\\" class=\\"about__link\\" rel=\\"norel noreferrer\\"\\n        >Archlinux</a\\n      >\\n      to be more specific. I've used Linux since around Q3 of 2019. I spent most\\n      of my time inside terminal and rest of it inside a browser or random GUI app.\\n      I prefer using my keyboard over my mouse everywhere if possible (except browsing\\n      the internet, mouse is way better)\\n    </p>\\n    <p class=\\"about__text\\">\\n      I use a Window Manager called\\n      <a href=\\"https://awesomewm.org\\" class=\\"about__link\\" rel=\\"norel noreferrer\\"\\n        >AwesomeWM</a\\n      >, such an\\n      <i>awesome</i>\\n      window manager. I also use a text editor called\\n      <a href=\\"https://neovim.io\\" class=\\"about__link\\" rel=\\"norel noreferrer\\"\\n        >Neovim</a\\n      >. I've been using it fulltime since around Q4 of 2019. It's actually my\\n      first text editor that I feel comfortable with and do something serious. I\\n      started using it when I got my first laptop. After using it for quite a\\n      while my config is has grown quite a lot. It is now written in Lua and is\\n      quite lengthy. I've written some post explaining some of my config if\\n      you're interested on that. Anyway, here's\\n      <a\\n        class=\\"about__link\\"\\n        href=\\"https://github.com/elianiva/dotfiles\\"\\n        rel=\\"norel noreferrer\\"\\n      >\\n        my dotfiles\\n      </a>\\n      if you want.\\n    </p>\\n    <p class=\\"about__text\\">\\n      Well, I guess that's about it. Thanks for visiting my website and I hope\\n      you found something useful from my site. Have a wonderful day! =)\\n    </p>\\n  </section>\\n</section>\\n<ProgressButton />\\n\\n<script>\\nimport { fade } from \\"svelte/transition\\"\\nimport data from \\"$lib/data/site\\"\\nimport SEO from \\"$lib/components/SEO.svelte\\"\\nimport ProgressButton from \\"$lib/components/ProgressButton.svelte\\"\\n</script>\\n"],"names":[],"mappings":"AACA,MAAM,6CAAC,CAAC,AACN,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,OAAO,CAAE,IAAI,CAAC,IAAI,CAAC,CAAC,AACtB,CAAC,AAED,eAAe,6CAAC,CAAC,AACf,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,IAAI,AACd,CAAC,AAED,8BAAe,CAAC,gBAAC,CAAG,CAAC,eAAC,CAAC,AACrB,UAAU,CAAE,MAAM,AACpB,CAAC,AAED,eAAe,6CAAC,CAAC,AACf,QAAQ,CAAE,QAAQ,CAClB,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,IAAI,AAClB,CAAC,AAED,4DAAe,KAAK,YAAY,CAAC,AAAC,CAAC,AACjC,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,4DAAe,OAAO,AAAC,CAAC,AACtB,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,CAAC,CACT,MAAM,CAAE,QAAQ,CAChB,gBAAgB,CAAE;IAChB,EAAE,CAAC,KAAK,CAAC;IACT,IAAI,mBAAmB,CAAC,CAAC;IACzB,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;GACjB,AACH,CAAC,AAED,YAAY,6CAAC,CAAC,AACZ,WAAW,CAAE,WAAW,CAAC,CAAC,UAAU,CACpC,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,SAAS,CAAE,QAAQ,CACnB,WAAW,CAAE,GAAG,AAClB,CAAC,AAED,eAAe,6CAAC,CAAC,AACf,MAAM,CAAE,IAAI,CAAC,CAAC,CACd,WAAW,CAAE,WAAW,CAAC,CAAC,UAAU,AACtC,CAAC,AAED,eAAe,6CAAC,CAAC,AACf,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,UAAU,CAAE,KAAK,CAAC,QAAQ,CAAC,IAAI,CAC/B,SAAS,CAAE,QAAQ,CACnB,MAAM,CAAE,OAAO,CACf,OAAO,CAAE,IAAI,AACf,CAAC,AAED,4DAAe,MAAM,AAAC,CAAC,AACrB,KAAK,CAAE,IAAI,mBAAmB,CAAC,AACjC,CAAC,AAED,YAAY,6CAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,CACrB,KAAK,CAAE,IAAI,mBAAmB,CAAC,CAC/B,eAAe,CAAE,IAAI,CACrB,UAAU,CAAE,GAAG,CAAC,QAAQ,CAAC,IAAI,AAC/B,CAAC,AAED,yDAAY,QAAQ,AAAC,CAAC,AACpB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,EAAE,CACX,MAAM,CAAE,OAAO,CACf,IAAI,CAAE,QAAQ,CACd,KAAK,CAAE,QAAQ,CACf,GAAG,CAAE,OAAO,CACZ,SAAS,CAAE,QAAQ,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAC7B,gBAAgB,CAAE,CAAC,CAAC,IAAI,CACxB,gBAAgB,CAAE;IAChB,EAAE,CAAC,KAAK,CAAC;IACT,IAAI,mBAAmB,CAAC,CAAC;IACzB,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;GACjB,CACD,OAAO,CAAE,EAAE,CACX,UAAU,CAAE,SAAS,CAAC,QAAQ,CAAC,IAAI,AACrC,CAAC,AAED,yDAAY,MAAM,QAAQ,AAAC,CAAC,AAC1B,SAAS,CAAE,QAAQ,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,AAC/B,CAAC,AAED,aAAa,6CAAC,CAAC,AACb,KAAK,CAAE,IAAI,gBAAgB,CAAC,AAC9B,CAAC"}`
};
const About = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$7);
  return `${validate_component(SEO, "SEO").$$render($$result, {title: "About"}, {}, {})}

<section class="${"about svelte-1968ri5"}"><section class="${"about__section svelte-1968ri5"}"><h1 class="${"about__heading svelte-1968ri5"}">About Me</h1>
    <p class="${"about__text svelte-1968ri5"}">Hi there! I&#39;m Elianiva. My online alias was taken from my middle name
      without the first and last letter. My name is Dicha Zelianivan Arkana. I&#39;m
      a 17 y/o Asian boi who loves to build websites (or any software related
      things at this point) and contribute to any open source projects that I
      like.
    </p>
    <p class="${"about__text svelte-1968ri5"}">I&#39;ve been learning web development since Q3 2019. I know HTML, CSS, and
      JS/TS and all that jazz quite well. Currently interested on learning lower
      level language like Rust. I also quite like Lua since I use Neovim and
      AwesomeWM.
    </p>
    <p class="${"about__text svelte-1968ri5"}">I was born and raised in Indonesia. I can speak Indonesian natively
      <span class="${"about__paren svelte-1968ri5"}">(obviously)</span>, and English quite fluently.
      I am currently learning Japanese because I want to be able to speak a
      language that uses a different writing system. Also, I want to try to live
      abroad in the future.
    </p>
    <p class="${"about__text svelte-1968ri5"}">If you want to reach me then feel free to hit me up on
      <a class="${"about__link svelte-1968ri5"}" href="${"https://twitter.com/@elianiva_"}" target="${"_blank"}" rel="${"norel noreferrer"}">Twitter</a>
      or Discord @elianiva#1558. I rarely checked Twitter and only use it for Vtuber
      or Art related stuff. I became more active on Discord lately though, so that&#39;d
      be a better option to reach me out. Or you can just
      <a class="${"about__link svelte-1968ri5"}" href="${"mailto:dicha.arkana03@gmail.com"}" target="${"_blank"}" rel="${"norel noreferrer"}">email me</a>, I check my email quite often.
    </p>
    <details class="${"about__details svelte-1968ri5"}"><summary class="${"about__summary svelte-1968ri5"}">Fun fact about me (click this if you really want to know me ;)
      </summary>
      <p class="${"about__text svelte-1968ri5"}" style="${"margin-top: 1rem;"}">I&#39;m that guy who easily gets obsessed with something that I found
        interesting. One of them is
        <a class="${"about__link svelte-1968ri5"}" target="${"_blank"}" rel="${"norel noreferrer"}" href="${"https://www.youtube.com/user/BABYMETALofficial"}">Babymetal</a>, I found them out around March 2020 and got instantly obsessed with
        them. They are the main reason why I decided to learn Japanese and
        appreciate Japanese culture.
      </p>
      <p class="${"about__text svelte-1968ri5"}">I also love an anime called Kill La Kill (as you might have known
        judging by my github profile), I took Senketsu and Junketsu colour for
        my website \u30C4
      </p>
      <p class="${"about__text svelte-1968ri5"}">I also love Vtubers. Before I watch them, I said to myself &quot;why would I
        watch some random 2D anime character streaming on Youtube?&quot; but here I
        am, ended up watching
        <i>a lot</i>
        of vtubers on my free time. It also helped me learn Japanese a bit.
      </p>
      <p class="${"about__text svelte-1968ri5"}">Some weird thing about me is, I don&#39;t really like to discuss stuff that
        I like with other people (not all of them, I do enjoy talking about
        anime related stuff with my friends). I don&#39;t know why, I like some
        things better if I just enjoy it myself and not talk about it with other
        people.
      </p></details>
    <h1 class="${"about__heading svelte-1968ri5"}">My Website</h1>
    <p class="${"about__text svelte-1968ri5"}">I made this website mainly because I want to keep a note to myself, but I
      thought it&#39;s a good idea to make it public. I sometimes forgot stuff that
      I did. By having this website, I can just revisit what I&#39;ve done in the
      past.
    </p>
    <p class="${"about__text svelte-1968ri5"}">I use Sapper and MDSveX to build this website and it&#39;s hosted on Vercel.
      If you want more detail about my website the you might want to read
      <a class="${"about__link svelte-1968ri5"}" href="${escape(data.siteUrl) + "/post/i-rebuild-my-site-using-sapper"}">this post</a>
      where I explain the process of making this site.
    </p>
    <p class="${"about__text svelte-1968ri5"}">The picture that you see on the home page is Ryuko Matoi from Kill La
      Kill. It was commissioned from
      <a class="${"about__link svelte-1968ri5"}" href="${"https://twitter.com/enzore_"}" target="${"_blank"}" rel="${"noreferrer norel"}">Enzore</a>, such a cool artist. Do yourself a favour by checking his artworks! I
      took it from my
      <a class="${"about__link svelte-1968ri5"}"${add_attribute("href", data.github, 0)} target="${"_blank"}" rel="${"noreferrer norel"}">github pfp</a>
      so that might change in the future. Also, if you noticed the icon for my website,
      it&#39;s a shitty drawing of
      <a class="${"about__link svelte-1968ri5"}" href="${"https://knowyourmeme.com/photos/709240-kill-la-kill"}" target="${"_blank"}" rel="${"noreferrer norel"}">derp eyed Ryuko</a>
      that I made a while back. I like to draw every now and then just for fun.
    </p>
    <h1 class="${"about__heading svelte-1968ri5"}">My Setup</h1>
    <p class="${"about__text svelte-1968ri5"}">My laptop is Thinkpad X220. I use Linux as my Operating System.
      <a href="${"https://archlinux.org"}" class="${"about__link svelte-1968ri5"}" rel="${"norel noreferrer"}">Archlinux</a>
      to be more specific. I&#39;ve used Linux since around Q3 of 2019. I spent most
      of my time inside terminal and rest of it inside a browser or random GUI app.
      I prefer using my keyboard over my mouse everywhere if possible (except browsing
      the internet, mouse is way better)
    </p>
    <p class="${"about__text svelte-1968ri5"}">I use a Window Manager called
      <a href="${"https://awesomewm.org"}" class="${"about__link svelte-1968ri5"}" rel="${"norel noreferrer"}">AwesomeWM</a>, such an
      <i>awesome</i>
      window manager. I also use a text editor called
      <a href="${"https://neovim.io"}" class="${"about__link svelte-1968ri5"}" rel="${"norel noreferrer"}">Neovim</a>. I&#39;ve been using it fulltime since around Q4 of 2019. It&#39;s actually my
      first text editor that I feel comfortable with and do something serious. I
      started using it when I got my first laptop. After using it for quite a
      while my config is has grown quite a lot. It is now written in Lua and is
      quite lengthy. I&#39;ve written some post explaining some of my config if
      you&#39;re interested on that. Anyway, here&#39;s
      <a class="${"about__link svelte-1968ri5"}" href="${"https://github.com/elianiva/dotfiles"}" rel="${"norel noreferrer"}">my dotfiles
      </a>
      if you want.
    </p>
    <p class="${"about__text svelte-1968ri5"}">Well, I guess that&#39;s about it. Thanks for visiting my website and I hope
      you found something useful from my site. Have a wonderful day! =)
    </p></section></section>
${validate_component(ProgressButton, "ProgressButton").$$render($$result, {}, {}, {})}`;
});
var about = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: About
});
var Tag_svelte = '.tag.svelte-1c4m01i{background-color:var(--color-special-bg);border-radius:0.25rem;font-family:"Overpass", sans-serif;font-size:1.125rem;display:inline-grid;grid-template-columns:1fr 2rem;align-items:center;justify-content:space-between;color:var(--color-alt-text)}.tag__name.svelte-1c4m01i{padding:0.5rem}.tag__remove.svelte-1c4m01i{display:flex;align-items:center;padding:0.5rem;border-radius:0 0.25rem 0.25rem 0;background-color:var(--color-borders);cursor:pointer}';
const css$6 = {
  code: '.tag.svelte-1c4m01i{background-color:var(--color-special-bg);border-radius:0.25rem;font-family:"Overpass", sans-serif;font-size:1.125rem;display:inline-grid;grid-template-columns:1fr 2rem;align-items:center;justify-content:space-between;color:var(--color-alt-text)}.tag__name.svelte-1c4m01i{padding:0.5rem}.tag__remove.svelte-1c4m01i{display:flex;align-items:center;padding:0.5rem;border-radius:0 0.25rem 0.25rem 0;background-color:var(--color-borders);cursor:pointer}',
  map: '{"version":3,"file":"Tag.svelte","sources":["Tag.svelte"],"sourcesContent":["<style>\\n.tag {\\n  background-color: var(--color-special-bg);\\n  border-radius: 0.25rem;\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: 1.125rem;\\n  display: inline-grid;\\n  grid-template-columns: 1fr 2rem;\\n  align-items: center;\\n  justify-content: space-between;\\n  color: var(--color-alt-text);\\n}\\n\\n.tag__name {\\n  padding: 0.5rem;\\n}\\n\\n.tag__remove {\\n  display: flex;\\n  align-items: center;\\n  padding: 0.5rem;\\n  border-radius: 0 0.25rem 0.25rem 0;\\n  background-color: var(--color-borders);\\n  cursor: pointer;\\n}\\n</style>\\n\\n<div class=\\"tag\\">\\n  <div class=\\"tag__name\\"><b>#</b> {label}</div>\\n  <div class=\\"tag__remove\\" on:click={onClick}>&times;</div>\\n</div>\\n\\n<script lang=\\"ts\\">export let label;\\nexport let onClick;\\n</script>\\n"],"names":[],"mappings":"AACA,IAAI,eAAC,CAAC,AACJ,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,CACzC,aAAa,CAAE,OAAO,CACtB,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,QAAQ,CACnB,OAAO,CAAE,WAAW,CACpB,qBAAqB,CAAE,GAAG,CAAC,IAAI,CAC/B,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,aAAa,CAC9B,KAAK,CAAE,IAAI,gBAAgB,CAAC,AAC9B,CAAC,AAED,UAAU,eAAC,CAAC,AACV,OAAO,CAAE,MAAM,AACjB,CAAC,AAED,YAAY,eAAC,CAAC,AACZ,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,OAAO,CAAE,MAAM,CACf,aAAa,CAAE,CAAC,CAAC,OAAO,CAAC,OAAO,CAAC,CAAC,CAClC,gBAAgB,CAAE,IAAI,eAAe,CAAC,CACtC,MAAM,CAAE,OAAO,AACjB,CAAC"}'
};
const Tag = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {label} = $$props;
  let {onClick} = $$props;
  if ($$props.label === void 0 && $$bindings.label && label !== void 0)
    $$bindings.label(label);
  if ($$props.onClick === void 0 && $$bindings.onClick && onClick !== void 0)
    $$bindings.onClick(onClick);
  $$result.css.add(css$6);
  return `<div class="${"tag svelte-1c4m01i"}"><div class="${"tag__name svelte-1c4m01i"}"><b>#</b> ${escape(label)}</div>
  <div class="${"tag__remove svelte-1c4m01i"}">\xD7</div>
</div>`;
});
var index_svelte = '.posts.svelte-1liriru{max-width:1080px;margin:0 auto;padding:2rem 1rem 0;text-align:center}.posts__title.svelte-1liriru{font-family:"Overpass", sans-serif;position:relative;display:inline-block;font-size:2rem;font-weight:600;color:var(--color-main-text);margin-bottom:1rem}.posts__title.svelte-1liriru::before{content:"";position:absolute;bottom:-0.25rem;height:0.25rem;left:2rem;right:2rem;border-radius:0.25rem;background-color:var(--color-main-accent)}.post__input.svelte-1liriru{position:relative}.input__box.svelte-1liriru{display:block;margin:0 auto 1rem;width:100%;padding:0.75rem;font-size:1.125rem;border:none;background-color:var(--color-special-bg);border-radius:0.25rem;outline:none;color:var(--color-main-text)}.input__box.svelte-1liriru::placeholder{color:var(--color-alt-text)}.posts__cards.svelte-1liriru{display:grid;grid-template-columns:repeat(auto-fill, minmax(20rem, 1fr));gap:1.25rem;margin-top:1rem}.input__autocomplete.svelte-1liriru{position:absolute;top:3.5rem;left:0;right:0;z-index:5;background-color:var(--color-special-bg);color:var(--color-main-text);border-radius:0.5rem;padding:0.5rem;box-shadow:0 0.25rem 1rem rgba(0, 0, 0, 0.2)}.autocomplete__item.svelte-1liriru{display:block;text-align:left;font-family:"Overpass", sans-serif;font-size:1.125rem;padding:0.5rem;color:var(--color-alt-text);cursor:pointer;border-radius:0.25rem;transition:all ease-out 0.05s}.autocomplete__item.svelte-1liriru:hover{backdrop-filter:brightness(1.5);color:var(--color-main-text)}.posts__tags.svelte-1liriru{display:flex;justify-items:center;gap:1rem}';
const css$5 = {
  code: '.posts.svelte-1liriru{max-width:1080px;margin:0 auto;padding:2rem 1rem 0;text-align:center}.posts__title.svelte-1liriru{font-family:"Overpass", sans-serif;position:relative;display:inline-block;font-size:2rem;font-weight:600;color:var(--color-main-text);margin-bottom:1rem}.posts__title.svelte-1liriru::before{content:"";position:absolute;bottom:-0.25rem;height:0.25rem;left:2rem;right:2rem;border-radius:0.25rem;background-color:var(--color-main-accent)}.post__input.svelte-1liriru{position:relative}.input__box.svelte-1liriru{display:block;margin:0 auto 1rem;width:100%;padding:0.75rem;font-size:1.125rem;border:none;background-color:var(--color-special-bg);border-radius:0.25rem;outline:none;color:var(--color-main-text)}.input__box.svelte-1liriru::placeholder{color:var(--color-alt-text)}.posts__cards.svelte-1liriru{display:grid;grid-template-columns:repeat(auto-fill, minmax(20rem, 1fr));gap:1.25rem;margin-top:1rem}.input__autocomplete.svelte-1liriru{position:absolute;top:3.5rem;left:0;right:0;z-index:5;background-color:var(--color-special-bg);color:var(--color-main-text);border-radius:0.5rem;padding:0.5rem;box-shadow:0 0.25rem 1rem rgba(0, 0, 0, 0.2)}.autocomplete__item.svelte-1liriru{display:block;text-align:left;font-family:"Overpass", sans-serif;font-size:1.125rem;padding:0.5rem;color:var(--color-alt-text);cursor:pointer;border-radius:0.25rem;transition:all ease-out 0.05s}.autocomplete__item.svelte-1liriru:hover{backdrop-filter:brightness(1.5);color:var(--color-main-text)}.posts__tags.svelte-1liriru{display:flex;justify-items:center;gap:1rem}',
  map: '{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<style>\\n.posts {\\n  max-width: 1080px;\\n  margin: 0 auto;\\n  padding: 2rem 1rem 0;\\n  text-align: center;\\n}\\n\\n.posts__title {\\n  font-family: \\"Overpass\\", sans-serif;\\n  position: relative;\\n  display: inline-block;\\n  font-size: 2rem;\\n  font-weight: 600;\\n  color: var(--color-main-text);\\n  margin-bottom: 1rem;\\n}\\n\\n.posts__title::before {\\n  content: \\"\\";\\n  position: absolute;\\n  bottom: -0.25rem;\\n  height: 0.25rem;\\n  left: 2rem;\\n  right: 2rem;\\n  border-radius: 0.25rem;\\n  background-color: var(--color-main-accent);\\n}\\n\\n.post__input {\\n  position: relative;\\n}\\n\\n.input__box {\\n  display: block;\\n  margin: 0 auto 1rem;\\n  width: 100%;\\n  padding: 0.75rem;\\n  font-size: 1.125rem;\\n  border: none;\\n  background-color: var(--color-special-bg);\\n  border-radius: 0.25rem;\\n  outline: none;\\n  color: var(--color-main-text);\\n}\\n\\n.input__box::placeholder {\\n  color: var(--color-alt-text);\\n}\\n\\n.posts__cards {\\n  display: grid;\\n  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));\\n  gap: 1.25rem;\\n  margin-top: 1rem;\\n}\\n\\n.input__autocomplete {\\n  position: absolute;\\n  top: 3.5rem;\\n  left: 0;\\n  right: 0;\\n  z-index: 5;\\n  background-color: var(--color-special-bg);\\n  color: var(--color-main-text);\\n  border-radius: 0.5rem;\\n  padding: 0.5rem;\\n  box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.2);\\n}\\n\\n.autocomplete__item {\\n  display: block;\\n  text-align: left;\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: 1.125rem;\\n  padding: 0.5rem;\\n  color: var(--color-alt-text);\\n  cursor: pointer;\\n  border-radius: 0.25rem;\\n  transition: all ease-out 0.05s;\\n}\\n\\n.autocomplete__item:hover {\\n  backdrop-filter: brightness(1.5);\\n  color: var(--color-main-text);\\n}\\n\\n.posts__tags {\\n  display: flex;\\n  justify-items: center;\\n  gap: 1rem;\\n}\\n</style>\\n\\n<SEO title=\\"Posts\\" />\\n\\n<section class=\\"posts\\">\\n  <h1 class=\\"posts__title\\">All Posts</h1>\\n  <div class=\\"post__input\\">\\n    <input\\n      class=\\"input__box\\"\\n      id=\\"posts__input\\"\\n      type=\\"text\\"\\n      placeholder=\\"Find post... (start with # to find tags)\\"\\n      aria-label=\\"search post\\"\\n      on:input={filterPost}\\n      bind:this={inputBox}\\n    />\\n    {#if isCompletionVisible}\\n      <div\\n        transition:fly={{ duration: 100, y: -50 }}\\n        class=\\"input__autocomplete\\"\\n      >\\n        {#each [...new Set(tags)] as tag}\\n          {#if tag.match(new RegExp(tagKeyword.substr(1)))}\\n            <!-- prettier-ignore -->\\n            <span\\n              class=\\"autocomplete__item\\"\\n              on:click={() => {\\n                tagFilter = [...tagFilter, tag]\\n                inputBox.value = \\"\\"\\n                tagKeyword = \\"\\"\\n                isCompletionVisible = false\\n              }}\\n            >\\n              {tag} \u2022 {count[tag]} result{count[tag] > 1 ? \'s\' : \'\'}\\n            </span>\\n          {/if}\\n        {/each}\\n      </div>\\n    {/if}\\n  </div>\\n  <div class=\\"posts__tags\\">\\n    {#each tagFilter as filter}\\n      <Tag\\n        label={filter}\\n        onClick={() => (tagFilter = tagFilter.filter(x => x !== filter))}\\n      />\\n    {/each}\\n  </div>\\n  <div class=\\"posts__cards\\">\\n    {#each filteredPosts as post}\\n      <PostCard\\n        title={post.title}\\n        href={`/post/${post.slug}`}\\n        desc={post.desc}\\n        date={post.date}\\n        tags={post.tags}\\n      />\\n    {/each}\\n  </div>\\n</section>\\n<ProgressButton />\\n\\n<script context=\\"module\\">\\nexport const prerender = true\\nexport async function load({ fetch }) {\\n  const posts = await (await fetch(`/api/post.json`)).json()\\n  return { props: { posts } }\\n}\\n</script>\\n\\n<script lang=\\"ts\\">import { fly } from \\"svelte/transition\\";\\nimport SEO from \\"$lib/components/SEO.svelte\\";\\nimport PostCard from \\"$lib/components/PostCard.svelte\\";\\nimport ProgressButton from \\"$lib/components/ProgressButton.svelte\\";\\nimport Tag from \\"$lib/components/Tag.svelte\\";\\n// eslint-disable-next-line\\nexport let posts;\\nlet inputBox = null;\\nlet keyword = \\"\\";\\nlet tagKeyword = \\"\\";\\nlet filteredPosts = [];\\nlet tagFilter = [];\\nlet isCompletionVisible = false;\\n// count available tags and insert it to an object, ex: `{a: 2, b: 3}`\\nconst tags = posts.map(post => post.tags).flat();\\nlet count = {};\\nfor (const x of tags) {\\n    count[x] = (count[x] || 0) + 1;\\n}\\n$: filteredPosts = posts.filter(post => {\\n    const query = keyword.substr(1).toLowerCase();\\n    const title = post.title.toLowerCase().includes(query);\\n    const slug = post.slug.toLowerCase().includes(query);\\n    const tags = tagFilter.length > 0 ? tagFilter.every(x => post.tags.includes(x)) : true;\\n    return (title || slug) && tags;\\n});\\n// TODO(elianiva): figure out the correct type for this\\nconst filterPost = ({ target: { value } }) => {\\n    // always reset the completion visibility\\n    isCompletionVisible = false;\\n    if (!value.match(/^#/)) {\\n        keyword = value;\\n        return;\\n    }\\n    tagKeyword = value;\\n    isCompletionVisible = true;\\n};\\n</script>\\n"],"names":[],"mappings":"AACA,MAAM,eAAC,CAAC,AACN,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,OAAO,CAAE,IAAI,CAAC,IAAI,CAAC,CAAC,CACpB,UAAU,CAAE,MAAM,AACpB,CAAC,AAED,aAAa,eAAC,CAAC,AACb,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,CACrB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,aAAa,CAAE,IAAI,AACrB,CAAC,AAED,4BAAa,QAAQ,AAAC,CAAC,AACrB,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,QAAQ,CAChB,MAAM,CAAE,OAAO,CACf,IAAI,CAAE,IAAI,CACV,KAAK,CAAE,IAAI,CACX,aAAa,CAAE,OAAO,CACtB,gBAAgB,CAAE,IAAI,mBAAmB,CAAC,AAC5C,CAAC,AAED,YAAY,eAAC,CAAC,AACZ,QAAQ,CAAE,QAAQ,AACpB,CAAC,AAED,WAAW,eAAC,CAAC,AACX,OAAO,CAAE,KAAK,CACd,MAAM,CAAE,CAAC,CAAC,IAAI,CAAC,IAAI,CACnB,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,OAAO,CAChB,SAAS,CAAE,QAAQ,CACnB,MAAM,CAAE,IAAI,CACZ,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,CACzC,aAAa,CAAE,OAAO,CACtB,OAAO,CAAE,IAAI,CACb,KAAK,CAAE,IAAI,iBAAiB,CAAC,AAC/B,CAAC,AAED,0BAAW,aAAa,AAAC,CAAC,AACxB,KAAK,CAAE,IAAI,gBAAgB,CAAC,AAC9B,CAAC,AAED,aAAa,eAAC,CAAC,AACb,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,OAAO,SAAS,CAAC,CAAC,OAAO,KAAK,CAAC,CAAC,GAAG,CAAC,CAAC,CAC5D,GAAG,CAAE,OAAO,CACZ,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,oBAAoB,eAAC,CAAC,AACpB,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,MAAM,CACX,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,OAAO,CAAE,CAAC,CACV,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,CACzC,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,aAAa,CAAE,MAAM,CACrB,OAAO,CAAE,MAAM,CACf,UAAU,CAAE,CAAC,CAAC,OAAO,CAAC,IAAI,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AAC/C,CAAC,AAED,mBAAmB,eAAC,CAAC,AACnB,OAAO,CAAE,KAAK,CACd,UAAU,CAAE,IAAI,CAChB,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,QAAQ,CACnB,OAAO,CAAE,MAAM,CACf,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,MAAM,CAAE,OAAO,CACf,aAAa,CAAE,OAAO,CACtB,UAAU,CAAE,GAAG,CAAC,QAAQ,CAAC,KAAK,AAChC,CAAC,AAED,kCAAmB,MAAM,AAAC,CAAC,AACzB,eAAe,CAAE,WAAW,GAAG,CAAC,CAChC,KAAK,CAAE,IAAI,iBAAiB,CAAC,AAC/B,CAAC,AAED,YAAY,eAAC,CAAC,AACZ,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,MAAM,CACrB,GAAG,CAAE,IAAI,AACX,CAAC"}'
};
const prerender = true;
async function load({fetch: fetch2}) {
  const posts = await (await fetch2(`/api/post.json`)).json();
  return {props: {posts}};
}
const Post$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {posts} = $$props;
  let inputBox = null;
  let keyword = "";
  let filteredPosts = [];
  let tagFilter = [];
  const tags = posts.map((post) => post.tags).flat();
  for (const x of tags) {
  }
  if ($$props.posts === void 0 && $$bindings.posts && posts !== void 0)
    $$bindings.posts(posts);
  $$result.css.add(css$5);
  filteredPosts = posts.filter((post) => {
    const query = keyword.substr(1).toLowerCase();
    const title = post.title.toLowerCase().includes(query);
    const slug = post.slug.toLowerCase().includes(query);
    const tags2 = tagFilter.length > 0 ? tagFilter.every((x) => post.tags.includes(x)) : true;
    return (title || slug) && tags2;
  });
  return `${validate_component(SEO, "SEO").$$render($$result, {title: "Posts"}, {}, {})}

<section class="${"posts svelte-1liriru"}"><h1 class="${"posts__title svelte-1liriru"}">All Posts</h1>
  <div class="${"post__input svelte-1liriru"}"><input class="${"input__box svelte-1liriru"}" id="${"posts__input"}" type="${"text"}" placeholder="${"Find post... (start with # to find tags)"}" aria-label="${"search post"}"${add_attribute("this", inputBox, 1)}>
    ${``}</div>
  <div class="${"posts__tags svelte-1liriru"}">${each(tagFilter, (filter) => `${validate_component(Tag, "Tag").$$render($$result, {
    label: filter,
    onClick: () => tagFilter = tagFilter.filter((x) => x !== filter)
  }, {}, {})}`)}</div>
  <div class="${"posts__cards svelte-1liriru"}">${each(filteredPosts, (post) => `${validate_component(PostCard, "PostCard").$$render($$result, {
    title: post.title,
    href: `/post/${post.slug}`,
    desc: post.desc,
    date: post.date,
    tags: post.tags
  }, {}, {})}`)}</div></section>
${validate_component(ProgressButton, "ProgressButton").$$render($$result, {}, {}, {})}`;
});
var index$o = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Post$1,
  prerender,
  load
});
const subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s = subscribers[i];
          s[1]();
          subscriber_queue.push(s, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return {set, update, subscribe: subscribe2};
}
const theme = writable("light");
var post_svelte = '.post.svelte-5m0jjt{max-width:1080px;padding:1rem;margin:0 auto;color:var(--color-main-text);text-align:center}.post__title.svelte-5m0jjt{font-family:"Overpass", sans-serif;font-size:2.5rem;margin-top:2rem;text-transform:uppercase;max-width:30ch;margin:0 auto}.post__date.svelte-5m0jjt{font-family:"Overpass", sans-serif;display:block;text-align:center;font-size:1.125rem;line-height:2em;color:var(--color-alt-text)}.post__edit.svelte-5m0jjt{position:relative;font-family:"Overpass", sans-serif;text-align:center;font-size:1.125rem;line-height:2em;color:var(--color-main-accent);transition:color ease-out 0.2s;text-decoration:none}.post__edit.svelte-5m0jjt:hover{color:var(--color-main-text)}.post__edit.svelte-5m0jjt:hover::before{transform:scale3d(1, 1, 1)}.post__content.svelte-5m0jjt{font-family:"Open Sans", sans-serif;max-width:70ch;margin:0 auto;font-size:1.125rem;text-align:left}.post__content.svelte-5m0jjt p{line-height:1.75em;font-size:1.125rem}.post__content > * + *{margin-top:1rem}.post__content.svelte-5m0jjt h1{position:relative;font-family:"Overpass", sans-serif;font-size:2rem;line-height:1.75em}.post__content.svelte-5m0jjt h1::after{content:"";position:absolute;left:0;right:0;bottom:0;height:0.125rem;background-image:linear-gradient(\n    to right,\n    var(--color-main-accent),\n    rgba(0, 0, 0, 0)\n  )}.post__content.svelte-5m0jjt h2{position:relative;font-family:"Overpass", sans-serif;line-height:1.5em;font-size:1.625rem;padding-left:1.5rem}.post__content.svelte-5m0jjt h3{position:relative;font-family:"Overpass", sans-serif;font-size:1.5rem;line-height:2em;padding-left:0.5rem;padding-left:1.5rem}.post__content.svelte-5m0jjt h3::after{content:"\u2022 ";position:absolute;left:0;color:var(--color-main-accent)}.post__content.svelte-5m0jjt h2::after{content:"# ";position:absolute;left:0;color:var(--color-main-accent)}.post__content.svelte-5m0jjt img{width:100%}.post__content.svelte-5m0jjt pre{scrollbar-color:var(--color-thin) var(--color-special-bg);border:0.0625rem var(--color-borders) solid}.post__content.svelte-5m0jjt pre::-webkit-scrollbar{background-color:var(--color-alt-bg);height:0.5rem}.post__content.svelte-5m0jjt pre:hover::-webkit-scrollbar{background-color:var(--color-special-bg);cursor:pointer}.post__content.svelte-5m0jjt pre::-webkit-scrollbar-thumb{background-color:var(--color-alt-bg);cursor:pointer}.post__content.svelte-5m0jjt pre:hover::-webkit-scrollbar-thumb{background-color:var(--color-thin)}.post__content.svelte-5m0jjt a{font-weight:600;position:relative;display:inline-block;color:var(--color-main-accent);text-decoration:none;transition:all ease-out 0.2s;z-index:5}.post__content.svelte-5m0jjt a::before{position:absolute;content:"";bottom:0.25rem;left:-0.25rem;right:-0.25rem;top:0.25rem;transform:scale3d(0, 0.1, 1);transform-origin:0 100%;background-image:linear-gradient(\n    to right,\n    var(--color-main-accent),\n    rgba(0, 0, 0, 0)\n  );z-index:-1;transition:transform ease-out 0.2s}.post__content.svelte-5m0jjt a:hover::before{transform:scale3d(1, 0.1, 1)}.post__content.svelte-5m0jjt code{font-family:"JetBrains Mono", monospace;color:var(--color-main-accent);padding:0.125rem 0.25rem;border-radius:0.25rem;font-size:1rem;background-color:var(--color-alt-bg);box-shadow:0 0 0.25em rgba(0, 0, 0, 0.1)}.post__content.svelte-5m0jjt pre code{font-family:"JetBrains Mono", monospace;font-weight:400;padding:0;border-radius:0;background:none;box-shadow:none;color:var(--color-main-text)}.post__content.svelte-5m0jjt ul{list-style:none}.post__content.svelte-5m0jjt ul li{position:relative;font-size:1.125rem;line-height:1.75em;padding-left:1rem}.post__content.svelte-5m0jjt ul li::before{content:"\\203A";color:var(--color-main-text);font-size:1.5rem;line-height:1.5em;margin-right:0.5rem}.post__content.svelte-5m0jjt ul li p{display:inline-block;margin:0}.post__content.svelte-5m0jjt ul li > ul *{font-size:1.125rem}.post__content.svelte-5m0jjt table{width:100%;border-radius:0.2rem;overflow:hidden}.post__content.svelte-5m0jjt table a{transition:all ease-out 0.2s;font-weight:600;line-height:1.25em;font-style:italic}.post__content.svelte-5m0jjt table tr:nth-child(odd){background-color:var(--color-special-bg)}.post__content.svelte-5m0jjt table th{background-color:var(--color-main-accent);color:var(--color-alt-bg);font-size:1.25rem}.post__content.svelte-5m0jjt table th,.post__content.svelte-5m0jjt table td{padding:0.75rem 1rem}.post__content.svelte-5m0jjt blockquote p{font-size:1.125rem;letter-spacing:0.02em;color:var(--color-thin);font-style:italic;font-family:serif;margin:1rem 0}.post__content.svelte-5m0jjt blockquote p::before{content:"\u201C	"}.post__content.svelte-5m0jjt blockquote p::after{content:" \u201D"}:target:before{content:"";display:block;height:4.5rem;margin-top:-4.5rem}.post__content.svelte-5m0jjt h1 a,.post__content.svelte-5m0jjt h2 a,.post__content.svelte-5m0jjt h3 a{color:var(--color-main-text)}.post__content.svelte-5m0jjt del,.post__content.svelte-5m0jjt del *{color:var(--color-alt-text) !important;font-style:italic;text-decoration:line-through}.post__content.svelte-5m0jjt h1 a::before,.post__content.svelte-5m0jjt h2 a::before,.post__content.svelte-5m0jjt h3 a::before{display:none}.post__tags.svelte-5m0jjt{display:flex;gap:0.5rem;justify-content:center}.post__tag.svelte-5m0jjt{padding:0.25rem 0.5rem;background-color:var(--color-special-bg);color:var(--color-main-text);border-radius:0.25rem;font-family:"Overpass", sans-serif;font-weight:500}.post__tag.svelte-5m0jjt::before{content:"# "}@media only screen and (max-width: 480px){.post__content pre{margin-left:-1rem !important;margin-right:-1rem !important;border:none;border-radius:0}.post__content ul *{font-size:0.95rem !important}.post__content p{font-size:1rem}}';
const css$4 = {
  code: '.post.svelte-5m0jjt{max-width:1080px;padding:1rem;margin:0 auto;color:var(--color-main-text);text-align:center}.post__title.svelte-5m0jjt{font-family:"Overpass", sans-serif;font-size:2.5rem;margin-top:2rem;text-transform:uppercase;max-width:30ch;margin:0 auto}.post__date.svelte-5m0jjt{font-family:"Overpass", sans-serif;display:block;text-align:center;font-size:1.125rem;line-height:2em;color:var(--color-alt-text)}.post__edit.svelte-5m0jjt{position:relative;font-family:"Overpass", sans-serif;text-align:center;font-size:1.125rem;line-height:2em;color:var(--color-main-accent);transition:color ease-out 0.2s;text-decoration:none}.post__edit.svelte-5m0jjt:hover{color:var(--color-main-text)}.post__edit.svelte-5m0jjt:hover::before{transform:scale3d(1, 1, 1)}.post__content.svelte-5m0jjt{font-family:"Open Sans", sans-serif;max-width:70ch;margin:0 auto;font-size:1.125rem;text-align:left}.post__content.svelte-5m0jjt p{line-height:1.75em;font-size:1.125rem}.post__content > * + *{margin-top:1rem}.post__content.svelte-5m0jjt h1{position:relative;font-family:"Overpass", sans-serif;font-size:2rem;line-height:1.75em}.post__content.svelte-5m0jjt h1::after{content:"";position:absolute;left:0;right:0;bottom:0;height:0.125rem;background-image:linear-gradient(\n    to right,\n    var(--color-main-accent),\n    rgba(0, 0, 0, 0)\n  )}.post__content.svelte-5m0jjt h2{position:relative;font-family:"Overpass", sans-serif;line-height:1.5em;font-size:1.625rem;padding-left:1.5rem}.post__content.svelte-5m0jjt h3{position:relative;font-family:"Overpass", sans-serif;font-size:1.5rem;line-height:2em;padding-left:0.5rem;padding-left:1.5rem}.post__content.svelte-5m0jjt h3::after{content:"\u2022 ";position:absolute;left:0;color:var(--color-main-accent)}.post__content.svelte-5m0jjt h2::after{content:"# ";position:absolute;left:0;color:var(--color-main-accent)}.post__content.svelte-5m0jjt img{width:100%}.post__content.svelte-5m0jjt pre{scrollbar-color:var(--color-thin) var(--color-special-bg);border:0.0625rem var(--color-borders) solid}.post__content.svelte-5m0jjt pre::-webkit-scrollbar{background-color:var(--color-alt-bg);height:0.5rem}.post__content.svelte-5m0jjt pre:hover::-webkit-scrollbar{background-color:var(--color-special-bg);cursor:pointer}.post__content.svelte-5m0jjt pre::-webkit-scrollbar-thumb{background-color:var(--color-alt-bg);cursor:pointer}.post__content.svelte-5m0jjt pre:hover::-webkit-scrollbar-thumb{background-color:var(--color-thin)}.post__content.svelte-5m0jjt a{font-weight:600;position:relative;display:inline-block;color:var(--color-main-accent);text-decoration:none;transition:all ease-out 0.2s;z-index:5}.post__content.svelte-5m0jjt a::before{position:absolute;content:"";bottom:0.25rem;left:-0.25rem;right:-0.25rem;top:0.25rem;transform:scale3d(0, 0.1, 1);transform-origin:0 100%;background-image:linear-gradient(\n    to right,\n    var(--color-main-accent),\n    rgba(0, 0, 0, 0)\n  );z-index:-1;transition:transform ease-out 0.2s}.post__content.svelte-5m0jjt a:hover::before{transform:scale3d(1, 0.1, 1)}.post__content.svelte-5m0jjt code{font-family:"JetBrains Mono", monospace;color:var(--color-main-accent);padding:0.125rem 0.25rem;border-radius:0.25rem;font-size:1rem;background-color:var(--color-alt-bg);box-shadow:0 0 0.25em rgba(0, 0, 0, 0.1)}.post__content.svelte-5m0jjt pre code{font-family:"JetBrains Mono", monospace;font-weight:400;padding:0;border-radius:0;background:none;box-shadow:none;color:var(--color-main-text)}.post__content.svelte-5m0jjt ul{list-style:none}.post__content.svelte-5m0jjt ul li{position:relative;font-size:1.125rem;line-height:1.75em;padding-left:1rem}.post__content.svelte-5m0jjt ul li::before{content:"\\203A";color:var(--color-main-text);font-size:1.5rem;line-height:1.5em;margin-right:0.5rem}.post__content.svelte-5m0jjt ul li p{display:inline-block;margin:0}.post__content.svelte-5m0jjt ul li > ul *{font-size:1.125rem}.post__content.svelte-5m0jjt table{width:100%;border-radius:0.2rem;overflow:hidden}.post__content.svelte-5m0jjt table a{transition:all ease-out 0.2s;font-weight:600;line-height:1.25em;font-style:italic}.post__content.svelte-5m0jjt table tr:nth-child(odd){background-color:var(--color-special-bg)}.post__content.svelte-5m0jjt table th{background-color:var(--color-main-accent);color:var(--color-alt-bg);font-size:1.25rem}.post__content.svelte-5m0jjt table th,.post__content.svelte-5m0jjt table td{padding:0.75rem 1rem}.post__content.svelte-5m0jjt blockquote p{font-size:1.125rem;letter-spacing:0.02em;color:var(--color-thin);font-style:italic;font-family:serif;margin:1rem 0}.post__content.svelte-5m0jjt blockquote p::before{content:"\u201C	"}.post__content.svelte-5m0jjt blockquote p::after{content:" \u201D"}:target:before{content:"";display:block;height:4.5rem;margin-top:-4.5rem}.post__content.svelte-5m0jjt h1 a,.post__content.svelte-5m0jjt h2 a,.post__content.svelte-5m0jjt h3 a{color:var(--color-main-text)}.post__content.svelte-5m0jjt del,.post__content.svelte-5m0jjt del *{color:var(--color-alt-text) !important;font-style:italic;text-decoration:line-through}.post__content.svelte-5m0jjt h1 a::before,.post__content.svelte-5m0jjt h2 a::before,.post__content.svelte-5m0jjt h3 a::before{display:none}.post__tags.svelte-5m0jjt{display:flex;gap:0.5rem;justify-content:center}.post__tag.svelte-5m0jjt{padding:0.25rem 0.5rem;background-color:var(--color-special-bg);color:var(--color-main-text);border-radius:0.25rem;font-family:"Overpass", sans-serif;font-weight:500}.post__tag.svelte-5m0jjt::before{content:"# "}@media only screen and (max-width: 480px){.post__content pre{margin-left:-1rem !important;margin-right:-1rem !important;border:none;border-radius:0}.post__content ul *{font-size:0.95rem !important}.post__content p{font-size:1rem}}',
  map: '{"version":3,"file":"post.svelte","sources":["post.svelte"],"sourcesContent":["<style>\\n.post {\\n  max-width: 1080px;\\n  padding: 1rem;\\n  margin: 0 auto;\\n  color: var(--color-main-text);\\n  text-align: center;\\n}\\n\\n.post__title {\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: 2.5rem;\\n  margin-top: 2rem;\\n  text-transform: uppercase;\\n  max-width: 30ch;\\n  margin: 0 auto;\\n}\\n\\n.post__date {\\n  font-family: \\"Overpass\\", sans-serif;\\n  display: block;\\n  text-align: center;\\n  font-size: 1.125rem;\\n  line-height: 2em;\\n  color: var(--color-alt-text);\\n}\\n\\n.post__edit {\\n  position: relative;\\n  font-family: \\"Overpass\\", sans-serif;\\n  text-align: center;\\n  font-size: 1.125rem;\\n  line-height: 2em;\\n  color: var(--color-main-accent);\\n  transition: color ease-out 0.2s;\\n  text-decoration: none;\\n}\\n\\n.post__edit:hover {\\n  color: var(--color-main-text);\\n}\\n\\n.post__edit:hover::before {\\n  transform: scale3d(1, 1, 1);\\n}\\n\\n.post__content {\\n  font-family: \\"Open Sans\\", sans-serif;\\n  max-width: 70ch;\\n  margin: 0 auto;\\n  font-size: 1.125rem;\\n  text-align: left;\\n}\\n\\n.post__content :global(p) {\\n  line-height: 1.75em;\\n  font-size: 1.125rem;\\n}\\n\\n:global(.post__content > * + *) {\\n  margin-top: 1rem;\\n}\\n\\n.post__content :global(h1) {\\n  position: relative;\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: 2rem;\\n  line-height: 1.75em;\\n}\\n\\n.post__content :global(h1::after) {\\n  content: \\"\\";\\n  position: absolute;\\n  left: 0;\\n  right: 0;\\n  bottom: 0;\\n  height: 0.125rem;\\n  background-image: linear-gradient(\\n    to right,\\n    var(--color-main-accent),\\n    rgba(0, 0, 0, 0)\\n  );\\n}\\n\\n.post__content :global(h2) {\\n  position: relative;\\n  font-family: \\"Overpass\\", sans-serif;\\n  line-height: 1.5em;\\n  font-size: 1.625rem;\\n  padding-left: 1.5rem;\\n}\\n\\n.post__content :global(h3) {\\n  position: relative;\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: 1.5rem;\\n  line-height: 2em;\\n  padding-left: 0.5rem;\\n  padding-left: 1.5rem;\\n}\\n\\n.post__content :global(h3::after) {\\n  content: \\"\u2022 \\";\\n  position: absolute;\\n  left: 0;\\n  color: var(--color-main-accent);\\n}\\n\\n.post__content :global(h2::after) {\\n  content: \\"# \\";\\n  position: absolute;\\n  left: 0;\\n  color: var(--color-main-accent);\\n}\\n\\n.post__content :global(img) {\\n  width: 100%;\\n}\\n\\n.post__content :global(pre) {\\n  scrollbar-color: var(--color-thin) var(--color-special-bg);\\n  border: 0.0625rem var(--color-borders) solid;\\n}\\n\\n.post__content :global(pre::-webkit-scrollbar) {\\n  background-color: var(--color-alt-bg);\\n  height: 0.5rem;\\n}\\n\\n.post__content :global(pre:hover::-webkit-scrollbar) {\\n  background-color: var(--color-special-bg);\\n  cursor: pointer;\\n}\\n\\n.post__content :global(pre::-webkit-scrollbar-thumb) {\\n  background-color: var(--color-alt-bg);\\n  cursor: pointer;\\n}\\n\\n.post__content :global(pre:hover::-webkit-scrollbar-thumb) {\\n  background-color: var(--color-thin);\\n}\\n\\n.post__content :global(a) {\\n  font-weight: 600;\\n  position: relative;\\n  display: inline-block;\\n  color: var(--color-main-accent);\\n  text-decoration: none;\\n  transition: all ease-out 0.2s;\\n  z-index: 5;\\n}\\n\\n.post__content :global(a::before) {\\n  position: absolute;\\n  content: \\"\\";\\n  bottom: 0.25rem;\\n  left: -0.25rem;\\n  right: -0.25rem;\\n  top: 0.25rem;\\n  transform: scale3d(0, 0.1, 1);\\n  transform-origin: 0 100%;\\n  background-image: linear-gradient(\\n    to right,\\n    var(--color-main-accent),\\n    rgba(0, 0, 0, 0)\\n  );\\n  z-index: -1;\\n  transition: transform ease-out 0.2s;\\n}\\n\\n.post__content :global(a:hover::before) {\\n  transform: scale3d(1, 0.1, 1);\\n}\\n\\n.post__content :global(code) {\\n  font-family: \\"JetBrains Mono\\", monospace;\\n  color: var(--color-main-accent);\\n  padding: 0.125rem 0.25rem;\\n  border-radius: 0.25rem;\\n  font-size: 1rem;\\n  background-color: var(--color-alt-bg);\\n  box-shadow: 0 0 0.25em rgba(0, 0, 0, 0.1);\\n}\\n\\n.post__content :global(pre code) {\\n  font-family: \\"JetBrains Mono\\", monospace;\\n  font-weight: 400;\\n  padding: 0;\\n  border-radius: 0;\\n  background: none;\\n  box-shadow: none;\\n  color: var(--color-main-text);\\n}\\n\\n.post__content :global(ul) {\\n  list-style: none;\\n}\\n\\n.post__content :global(ul li) {\\n  position: relative;\\n  font-size: 1.125rem;\\n  line-height: 1.75em;\\n  padding-left: 1rem;\\n}\\n\\n.post__content :global(ul li::before) {\\n  content: \\"\\\\203A\\";\\n  color: var(--color-main-text);\\n  font-size: 1.5rem;\\n  line-height: 1.5em;\\n  margin-right: 0.5rem;\\n}\\n\\n.post__content :global(ul li p) {\\n  display: inline-block;\\n  margin: 0;\\n}\\n\\n.post__content :global(ul li > ul *) {\\n  font-size: 1.125rem;\\n}\\n\\n.post__content :global(table) {\\n  width: 100%;\\n  border-radius: 0.2rem;\\n  overflow: hidden;\\n}\\n\\n.post__content :global(table a) {\\n  transition: all ease-out 0.2s;\\n  font-weight: 600;\\n  line-height: 1.25em;\\n  font-style: italic;\\n}\\n\\n.post__content :global(table tr:nth-child(odd)) {\\n  background-color: var(--color-special-bg);\\n}\\n\\n.post__content :global(table th) {\\n  background-color: var(--color-main-accent);\\n  color: var(--color-alt-bg);\\n  font-size: 1.25rem;\\n}\\n\\n.post__content :global(table th),\\n.post__content :global(table td) {\\n  padding: 0.75rem 1rem;\\n}\\n\\n.post__content :global(blockquote p) {\\n  font-size: 1.125rem;\\n  letter-spacing: 0.02em;\\n  color: var(--color-thin);\\n  font-style: italic;\\n  font-family: serif;\\n  margin: 1rem 0;\\n}\\n\\n.post__content :global(blockquote p::before) {\\n  content: \\"\u201C\\t\\";\\n}\\n\\n.post__content :global(blockquote p::after) {\\n  content: \\" \u201D\\";\\n}\\n\\n:global(:target:before) {\\n  content: \\"\\";\\n  display: block;\\n  height: 4.5rem;\\n  margin-top: -4.5rem;\\n}\\n\\n.post__content :global(h1 a),\\n.post__content :global(h2 a),\\n.post__content :global(h3 a) {\\n  color: var(--color-main-text);\\n}\\n\\n.post__content :global(del),\\n.post__content :global(del *) {\\n  color: var(--color-alt-text) !important;\\n  font-style: italic;\\n  text-decoration: line-through;\\n}\\n\\n.post__content :global(h1 a::before),\\n.post__content :global(h2 a::before),\\n.post__content :global(h3 a::before) {\\n  display: none;\\n}\\n\\n.post__tags {\\n  display: flex;\\n  gap: 0.5rem;\\n  justify-content: center;\\n}\\n\\n.post__tag {\\n  padding: 0.25rem 0.5rem;\\n  background-color: var(--color-special-bg);\\n  color: var(--color-main-text);\\n  border-radius: 0.25rem;\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-weight: 500;\\n}\\n\\n.post__tag::before {\\n  content: \\"# \\";\\n}\\n\\n@media only screen and (max-width: 480px) {\\n  :global(.post__content pre) {\\n    margin-left: -1rem !important;\\n    margin-right: -1rem !important;\\n    border: none;\\n    border-radius: 0;\\n  }\\n\\n  :global(.post__content ul *) {\\n    font-size: 0.95rem !important;\\n  }\\n\\n  :global(.post__content p) {\\n    font-size: 1rem;\\n  }\\n}\\n</style>\\n\\n<svelte:head>\\n  <link\\n    rel=\\"preload\\"\\n    href=\\"/prism-night-owl.css\\"\\n    as=\\"style\\"\\n    on:load={function () {\\n      this.rel = \\"stylesheet\\"\\n    }}\\n  />\\n</svelte:head>\\n\\n<SEO {desc} {title} />\\n\\n<section class=\\"post\\">\\n  <h1 class=\\"post__title\\">{title}</h1>\\n  <span class=\\"post__date\\">\\n    Posted on\\n    {new Date(date).toLocaleDateString(\\"en-Gb\\", { weekday: \\"long\\" })},\\n    {new Date(date).toLocaleDateString(\\"en-GB\\", {\\n      day: \\"numeric\\",\\n      month: \\"long\\",\\n      year: \\"numeric\\",\\n    })}\\n  </span>\\n  <a\\n    class=\\"post__edit\\"\\n    href=\\"https://github.com/elianiva/elianiva.me/blob/master/src/pages/post/{currentSlug}/index.svx\\"\\n    target=\\"_blank\\"\\n    rel=\\"norel noreferrer\\">Suggest An Edit</a\\n  >\\n  <div class=\\"post__tags\\">\\n    {#each tags as tag}\\n      <div class=\\"post__tag\\">{tag}</div>\\n    {/each}\\n  </div>\\n  <main class=\\"post__content\\" bind:this={content}>\\n    <slot />\\n    <h1>Comments</h1>\\n    {#if $theme === \\"dark\\"}\\n      <div>\\n        <script\\n          src=\\"https://utteranc.es/client.js\\"\\n          repo=\\"elianiva/elianiva.me\\"\\n          issue-term=\\"pathname\\"\\n          label=\\"Comments\\"\\n          theme=\\"dark-blue\\"\\n          crossorigin=\\"anonymous\\"\\n          async></script>\\n      </div>\\n    {:else}\\n      <div>\\n        <script\\n          src=\\"https://utteranc.es/client.js\\"\\n          repo=\\"elianiva/elianiva.me\\"\\n          issue-term=\\"pathname\\"\\n          label=\\"Comments\\"\\n          theme=\\"github-light\\"\\n          crossorigin=\\"anonymous\\"\\n          async></script>\\n      </div>\\n    {/if}\\n  </main>\\n</section>\\n<ProgressButton />\\n\\n<script>\\n// TODO(elianiva): change utterance theme to github-dark once the new version came out\\n// TODO(elianiva): convert to typescript someday\\nimport { onMount } from \\"svelte\\"\\nimport { page } from \\"$app/stores\\"\\nimport SEO from \\"$lib/components/SEO.svelte\\"\\nimport ProgressButton from \\"$lib/components/ProgressButton.svelte\\"\\nimport { theme } from \\"$lib/utils/theme\\"\\n\\nexport let title\\nexport let date\\nexport let desc\\nexport let tags\\n\\nconst currentSlug = $page.path\\n\\nlet content\\n\\nonMount(() => {\\n  content.querySelectorAll(\\"a\\").forEach(a => {\\n    // use `decodeURIComponent` to handle Japanese characters\\n    // prettier-ignore\\n    if (\\n      !a.hash ||\\n      !content.querySelectorAll(decodeURIComponent(a.hash)).length\\n    ) return\\n\\n    a.addEventListener(\\"click\\", e => {\\n      e.preventDefault()\\n      window.location.hash = e.target.getAttribute(\\"href\\")\\n    })\\n  })\\n})\\n</script>\\n"],"names":[],"mappings":"AACA,KAAK,cAAC,CAAC,AACL,SAAS,CAAE,MAAM,CACjB,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,UAAU,CAAE,MAAM,AACpB,CAAC,AAED,YAAY,cAAC,CAAC,AACZ,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,MAAM,CACjB,UAAU,CAAE,IAAI,CAChB,cAAc,CAAE,SAAS,CACzB,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,CAAC,CAAC,IAAI,AAChB,CAAC,AAED,WAAW,cAAC,CAAC,AACX,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,OAAO,CAAE,KAAK,CACd,UAAU,CAAE,MAAM,CAClB,SAAS,CAAE,QAAQ,CACnB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,gBAAgB,CAAC,AAC9B,CAAC,AAED,WAAW,cAAC,CAAC,AACX,QAAQ,CAAE,QAAQ,CAClB,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,UAAU,CAAE,MAAM,CAClB,SAAS,CAAE,QAAQ,CACnB,WAAW,CAAE,GAAG,CAChB,KAAK,CAAE,IAAI,mBAAmB,CAAC,CAC/B,UAAU,CAAE,KAAK,CAAC,QAAQ,CAAC,IAAI,CAC/B,eAAe,CAAE,IAAI,AACvB,CAAC,AAED,yBAAW,MAAM,AAAC,CAAC,AACjB,KAAK,CAAE,IAAI,iBAAiB,CAAC,AAC/B,CAAC,AAED,yBAAW,MAAM,QAAQ,AAAC,CAAC,AACzB,SAAS,CAAE,QAAQ,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,AAC7B,CAAC,AAED,cAAc,cAAC,CAAC,AACd,WAAW,CAAE,WAAW,CAAC,CAAC,UAAU,CACpC,SAAS,CAAE,IAAI,CACf,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,SAAS,CAAE,QAAQ,CACnB,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,4BAAc,CAAC,AAAQ,CAAC,AAAE,CAAC,AACzB,WAAW,CAAE,MAAM,CACnB,SAAS,CAAE,QAAQ,AACrB,CAAC,AAEO,sBAAsB,AAAE,CAAC,AAC/B,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,4BAAc,CAAC,AAAQ,EAAE,AAAE,CAAC,AAC1B,QAAQ,CAAE,QAAQ,CAClB,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,MAAM,AACrB,CAAC,AAED,4BAAc,CAAC,AAAQ,SAAS,AAAE,CAAC,AACjC,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,CAAC,CACT,MAAM,CAAE,QAAQ,CAChB,gBAAgB,CAAE;IAChB,EAAE,CAAC,KAAK,CAAC;IACT,IAAI,mBAAmB,CAAC,CAAC;IACzB,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;GACjB,AACH,CAAC,AAED,4BAAc,CAAC,AAAQ,EAAE,AAAE,CAAC,AAC1B,QAAQ,CAAE,QAAQ,CAClB,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,WAAW,CAAE,KAAK,CAClB,SAAS,CAAE,QAAQ,CACnB,YAAY,CAAE,MAAM,AACtB,CAAC,AAED,4BAAc,CAAC,AAAQ,EAAE,AAAE,CAAC,AAC1B,QAAQ,CAAE,QAAQ,CAClB,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,GAAG,CAChB,YAAY,CAAE,MAAM,CACpB,YAAY,CAAE,MAAM,AACtB,CAAC,AAED,4BAAc,CAAC,AAAQ,SAAS,AAAE,CAAC,AACjC,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,mBAAmB,CAAC,AACjC,CAAC,AAED,4BAAc,CAAC,AAAQ,SAAS,AAAE,CAAC,AACjC,OAAO,CAAE,IAAI,CACb,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,IAAI,mBAAmB,CAAC,AACjC,CAAC,AAED,4BAAc,CAAC,AAAQ,GAAG,AAAE,CAAC,AAC3B,KAAK,CAAE,IAAI,AACb,CAAC,AAED,4BAAc,CAAC,AAAQ,GAAG,AAAE,CAAC,AAC3B,eAAe,CAAE,IAAI,YAAY,CAAC,CAAC,IAAI,kBAAkB,CAAC,CAC1D,MAAM,CAAE,SAAS,CAAC,IAAI,eAAe,CAAC,CAAC,KAAK,AAC9C,CAAC,AAED,4BAAc,CAAC,AAAQ,sBAAsB,AAAE,CAAC,AAC9C,gBAAgB,CAAE,IAAI,cAAc,CAAC,CACrC,MAAM,CAAE,MAAM,AAChB,CAAC,AAED,4BAAc,CAAC,AAAQ,4BAA4B,AAAE,CAAC,AACpD,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,CACzC,MAAM,CAAE,OAAO,AACjB,CAAC,AAED,4BAAc,CAAC,AAAQ,4BAA4B,AAAE,CAAC,AACpD,gBAAgB,CAAE,IAAI,cAAc,CAAC,CACrC,MAAM,CAAE,OAAO,AACjB,CAAC,AAED,4BAAc,CAAC,AAAQ,kCAAkC,AAAE,CAAC,AAC1D,gBAAgB,CAAE,IAAI,YAAY,CAAC,AACrC,CAAC,AAED,4BAAc,CAAC,AAAQ,CAAC,AAAE,CAAC,AACzB,WAAW,CAAE,GAAG,CAChB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,CACrB,KAAK,CAAE,IAAI,mBAAmB,CAAC,CAC/B,eAAe,CAAE,IAAI,CACrB,UAAU,CAAE,GAAG,CAAC,QAAQ,CAAC,IAAI,CAC7B,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,4BAAc,CAAC,AAAQ,SAAS,AAAE,CAAC,AACjC,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,EAAE,CACX,MAAM,CAAE,OAAO,CACf,IAAI,CAAE,QAAQ,CACd,KAAK,CAAE,QAAQ,CACf,GAAG,CAAE,OAAO,CACZ,SAAS,CAAE,QAAQ,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,CAC7B,gBAAgB,CAAE,CAAC,CAAC,IAAI,CACxB,gBAAgB,CAAE;IAChB,EAAE,CAAC,KAAK,CAAC;IACT,IAAI,mBAAmB,CAAC,CAAC;IACzB,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC;GACjB,CACD,OAAO,CAAE,EAAE,CACX,UAAU,CAAE,SAAS,CAAC,QAAQ,CAAC,IAAI,AACrC,CAAC,AAED,4BAAc,CAAC,AAAQ,eAAe,AAAE,CAAC,AACvC,SAAS,CAAE,QAAQ,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC,AAC/B,CAAC,AAED,4BAAc,CAAC,AAAQ,IAAI,AAAE,CAAC,AAC5B,WAAW,CAAE,gBAAgB,CAAC,CAAC,SAAS,CACxC,KAAK,CAAE,IAAI,mBAAmB,CAAC,CAC/B,OAAO,CAAE,QAAQ,CAAC,OAAO,CACzB,aAAa,CAAE,OAAO,CACtB,SAAS,CAAE,IAAI,CACf,gBAAgB,CAAE,IAAI,cAAc,CAAC,CACrC,UAAU,CAAE,CAAC,CAAC,CAAC,CAAC,MAAM,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,AAC3C,CAAC,AAED,4BAAc,CAAC,AAAQ,QAAQ,AAAE,CAAC,AAChC,WAAW,CAAE,gBAAgB,CAAC,CAAC,SAAS,CACxC,WAAW,CAAE,GAAG,CAChB,OAAO,CAAE,CAAC,CACV,aAAa,CAAE,CAAC,CAChB,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,IAAI,CAChB,KAAK,CAAE,IAAI,iBAAiB,CAAC,AAC/B,CAAC,AAED,4BAAc,CAAC,AAAQ,EAAE,AAAE,CAAC,AAC1B,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,4BAAc,CAAC,AAAQ,KAAK,AAAE,CAAC,AAC7B,QAAQ,CAAE,QAAQ,CAClB,SAAS,CAAE,QAAQ,CACnB,WAAW,CAAE,MAAM,CACnB,YAAY,CAAE,IAAI,AACpB,CAAC,AAED,4BAAc,CAAC,AAAQ,aAAa,AAAE,CAAC,AACrC,OAAO,CAAE,OAAO,CAChB,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,SAAS,CAAE,MAAM,CACjB,WAAW,CAAE,KAAK,CAClB,YAAY,CAAE,MAAM,AACtB,CAAC,AAED,4BAAc,CAAC,AAAQ,OAAO,AAAE,CAAC,AAC/B,OAAO,CAAE,YAAY,CACrB,MAAM,CAAE,CAAC,AACX,CAAC,AAED,4BAAc,CAAC,AAAQ,YAAY,AAAE,CAAC,AACpC,SAAS,CAAE,QAAQ,AACrB,CAAC,AAED,4BAAc,CAAC,AAAQ,KAAK,AAAE,CAAC,AAC7B,KAAK,CAAE,IAAI,CACX,aAAa,CAAE,MAAM,CACrB,QAAQ,CAAE,MAAM,AAClB,CAAC,AAED,4BAAc,CAAC,AAAQ,OAAO,AAAE,CAAC,AAC/B,UAAU,CAAE,GAAG,CAAC,QAAQ,CAAC,IAAI,CAC7B,WAAW,CAAE,GAAG,CAChB,WAAW,CAAE,MAAM,CACnB,UAAU,CAAE,MAAM,AACpB,CAAC,AAED,4BAAc,CAAC,AAAQ,uBAAuB,AAAE,CAAC,AAC/C,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,AAC3C,CAAC,AAED,4BAAc,CAAC,AAAQ,QAAQ,AAAE,CAAC,AAChC,gBAAgB,CAAE,IAAI,mBAAmB,CAAC,CAC1C,KAAK,CAAE,IAAI,cAAc,CAAC,CAC1B,SAAS,CAAE,OAAO,AACpB,CAAC,AAED,4BAAc,CAAC,AAAQ,QAAQ,AAAC,CAChC,4BAAc,CAAC,AAAQ,QAAQ,AAAE,CAAC,AAChC,OAAO,CAAE,OAAO,CAAC,IAAI,AACvB,CAAC,AAED,4BAAc,CAAC,AAAQ,YAAY,AAAE,CAAC,AACpC,SAAS,CAAE,QAAQ,CACnB,cAAc,CAAE,MAAM,CACtB,KAAK,CAAE,IAAI,YAAY,CAAC,CACxB,UAAU,CAAE,MAAM,CAClB,WAAW,CAAE,KAAK,CAClB,MAAM,CAAE,IAAI,CAAC,CAAC,AAChB,CAAC,AAED,4BAAc,CAAC,AAAQ,oBAAoB,AAAE,CAAC,AAC5C,OAAO,CAAE,IAAI,AACf,CAAC,AAED,4BAAc,CAAC,AAAQ,mBAAmB,AAAE,CAAC,AAC3C,OAAO,CAAE,IAAI,AACf,CAAC,AAEO,cAAc,AAAE,CAAC,AACvB,OAAO,CAAE,EAAE,CACX,OAAO,CAAE,KAAK,CACd,MAAM,CAAE,MAAM,CACd,UAAU,CAAE,OAAO,AACrB,CAAC,AAED,4BAAc,CAAC,AAAQ,IAAI,AAAC,CAC5B,4BAAc,CAAC,AAAQ,IAAI,AAAC,CAC5B,4BAAc,CAAC,AAAQ,IAAI,AAAE,CAAC,AAC5B,KAAK,CAAE,IAAI,iBAAiB,CAAC,AAC/B,CAAC,AAED,4BAAc,CAAC,AAAQ,GAAG,AAAC,CAC3B,4BAAc,CAAC,AAAQ,KAAK,AAAE,CAAC,AAC7B,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAAC,UAAU,CACvC,UAAU,CAAE,MAAM,CAClB,eAAe,CAAE,YAAY,AAC/B,CAAC,AAED,4BAAc,CAAC,AAAQ,YAAY,AAAC,CACpC,4BAAc,CAAC,AAAQ,YAAY,AAAC,CACpC,4BAAc,CAAC,AAAQ,YAAY,AAAE,CAAC,AACpC,OAAO,CAAE,IAAI,AACf,CAAC,AAED,WAAW,cAAC,CAAC,AACX,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,MAAM,CACX,eAAe,CAAE,MAAM,AACzB,CAAC,AAED,UAAU,cAAC,CAAC,AACV,OAAO,CAAE,OAAO,CAAC,MAAM,CACvB,gBAAgB,CAAE,IAAI,kBAAkB,CAAC,CACzC,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,aAAa,CAAE,OAAO,CACtB,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,WAAW,CAAE,GAAG,AAClB,CAAC,AAED,wBAAU,QAAQ,AAAC,CAAC,AAClB,OAAO,CAAE,IAAI,AACf,CAAC,AAED,OAAO,IAAI,CAAC,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACjC,kBAAkB,AAAE,CAAC,AAC3B,WAAW,CAAE,KAAK,CAAC,UAAU,CAC7B,YAAY,CAAE,KAAK,CAAC,UAAU,CAC9B,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,CAAC,AAClB,CAAC,AAEO,mBAAmB,AAAE,CAAC,AAC5B,SAAS,CAAE,OAAO,CAAC,UAAU,AAC/B,CAAC,AAEO,gBAAgB,AAAE,CAAC,AACzB,SAAS,CAAE,IAAI,AACjB,CAAC,AACH,CAAC"}'
};
const Post = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  let $theme, $$unsubscribe_theme;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_theme = subscribe(theme, (value) => $theme = value);
  let {title} = $$props;
  let {date} = $$props;
  let {desc} = $$props;
  let {tags} = $$props;
  const currentSlug = $page.path;
  let content;
  onMount(() => {
    content.querySelectorAll("a").forEach((a) => {
      if (!a.hash || !content.querySelectorAll(decodeURIComponent(a.hash)).length)
        return;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.hash = e.target.getAttribute("href");
      });
    });
  });
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.date === void 0 && $$bindings.date && date !== void 0)
    $$bindings.date(date);
  if ($$props.desc === void 0 && $$bindings.desc && desc !== void 0)
    $$bindings.desc(desc);
  if ($$props.tags === void 0 && $$bindings.tags && tags !== void 0)
    $$bindings.tags(tags);
  $$result.css.add(css$4);
  $$unsubscribe_page();
  $$unsubscribe_theme();
  return `${$$result.head += `<link rel="${"preload"}" href="${"/prism-night-owl.css"}" as="${"style"}" data-svelte="svelte-vz1hne">`, ""}

${validate_component(SEO, "SEO").$$render($$result, {desc, title}, {}, {})}

<section class="${"post svelte-5m0jjt"}"><h1 class="${"post__title svelte-5m0jjt"}">${escape(title)}</h1>
  <span class="${"post__date svelte-5m0jjt"}">Posted on
    ${escape(new Date(date).toLocaleDateString("en-Gb", {weekday: "long"}))},
    ${escape(new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }))}</span>
  <a class="${"post__edit svelte-5m0jjt"}" href="${"https://github.com/elianiva/elianiva.me/blob/master/src/pages/post/" + escape(currentSlug) + "/index.svx"}" target="${"_blank"}" rel="${"norel noreferrer"}">Suggest An Edit</a>
  <div class="${"post__tags svelte-5m0jjt"}">${each(tags, (tag) => `<div class="${"post__tag svelte-5m0jjt"}">${escape(tag)}</div>`)}</div>
  <main class="${"post__content svelte-5m0jjt"}"${add_attribute("this", content, 1)}>${slots.default ? slots.default({}) : ``}
    <h1>Comments</h1>
    ${$theme === "dark" ? `<div><script src="${"https://utteranc.es/client.js"}" repo="${"elianiva/elianiva.me"}" issue-term="${"pathname"}" label="${"Comments"}" theme="${"dark-blue"}" crossorigin="${"anonymous"}" async></script></div>` : `<div><script src="${"https://utteranc.es/client.js"}" repo="${"elianiva/elianiva.me"}" issue-term="${"pathname"}" label="${"Comments"}" theme="${"github-light"}" crossorigin="${"anonymous"}" async></script></div>`}</main></section>
${validate_component(ProgressButton, "ProgressButton").$$render($$result, {}, {}, {})}`;
});
const metadata$n = {
  title: "Prettify your screenshot using imagemagick",
  date: "2020-08-06T00:00:00.000Z",
  desc: "Wanna make your screenshot a bit more fancy? Say no more, Imagemagick got you covered",
  tags: ["linux"]
};
const Prettify_screenshot_using_imagemagick = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$n), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#prerequisite"}">Prerequisite</a></p></li>
<li><p><a href="${"#making-the-script"}">Making The Script</a></p>
<ul><li><a href="${"#backdrop"}">Backdrop</a></li>
<li><a href="${"#border"}">Border</a></li>
<li><a href="${"#shadow"}">Shadow</a></li>
<li><a href="${"#rounded-corner"}">Rounded Corner</a></li>
<li><a href="${"#combining-them-all"}">Combining Them All</a></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Let\u2019s make our screenshot prettier by using a software called <a href="${"https://imagemagick.org"}" rel="${"nofollow"}">Imagemagick</a>. In this post, we will add some fancy effects like backdrop, shadow, border, and rounded corner with a simple script.</p>
<h1 id="${"prerequisite"}"><a href="${"#prerequisite"}">Prerequisite</a></h1>
<p>Before we make the script, there are a few things that you\u2019ll need to prepare.</p>
<ul><li><strong>Imagemagick</strong> - obviously</li>
<li><strong>Any screenshot software</strong> - I use <a href="${"https://flameshot.js.org/"}" rel="${"nofollow"}">flameshot</a></li>
<li><strong>Clipboard</strong> - I use <a href="${"https://github.com/astrand/xclip"}" rel="${"nofollow"}">xclip</a> (optional)</li></ul>
<p>After having all of that, let\u2019s make the script.</p>
<h1 id="${"making-the-script"}"><a href="${"#making-the-script"}">Making The Script</a></h1>
<h2 id="${"backdrop"}"><a href="${"#backdrop"}">Backdrop</a></h2>
<p>Backdrop is actually just a really thicc border. Here\u2019s how to do that on imagemagick.</p>
<pre class="${"language-bash"}">${`<code class="language-bash">convert source.png -bordercolor white -border <span class="token number">10</span> result.png</code>`}</pre>
<p>You can adjust the color by changing the <code>bordercolor</code> value. I use white because it looks nice to me. You can use HEX, RGB, and RGBA format. For more references, go to <a href="${"https://imagemagick.org/script/color.php"}" rel="${"nofollow"}">their website</a>.</p>
<p>To adjust the thickness of it, you change the <code>border</code> value. I use 10 here because it\u2019s not too big and it\u2019s not too small for me.</p>
<h2 id="${"border"}"><a href="${"#border"}">Border</a></h2>
<p>Previously, we made a thicc border as a backdrop, this time we make a thin border before the shadow</p>
<pre class="${"language-bash"}">${`<code class="language-bash">convert source.png -bordercolor white -border <span class="token number">4</span> result.png</code>`}</pre>
<p>It\u2019s basically the same, just with a different value.</p>
<h2 id="${"shadow"}"><a href="${"#shadow"}">Shadow</a></h2>
<p>To give you screenshot a shadow is quite simple. Here\u2019s how to do it.</p>
<pre class="${"language-bash"}">${`<code class="language-bash">convert source.png <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -background black -shadow 40x5+0+0 <span class="token punctuation"></span><span class="token punctuation">)</span> <span class="token punctuation"></span>
+swap -background none -layers merge +repage result.png<span class="token punctuation">;</span> <span class="token punctuation"></span></code>`}</pre>
<p>To change the shadow color, adjust the first <code>background</code> value. I use black because black shadow is the only one that is acceptable to me. The <code>40</code> here is the shadow opacity, you can change it to whatever you like. The shadow radius here is <code>5</code>. This will add to your backdrop thickness. If you have <code>10</code> of backdrop and you have <code>5</code> of border radius then you\u2019ll end up with <code>15</code> of backdrop.</p>
<h2 id="${"rounded-corner"}"><a href="${"#rounded-corner"}">Rounded Corner</a></h2>
<p>It\u2019s quite a lengthy one, but don\u2019t worry. The only thing we\u2019d change is the border radius.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token comment"># rounded corners</span>
convert /tmp/image.png <span class="token punctuation"></span>
     <span class="token punctuation"></span><span class="token punctuation">(</span> +clone  -alpha extract <span class="token punctuation"></span>
        -draw <span class="token string">'fill black polygon 0,0 0,5 5,0 fill white circle 5,5 5,0'</span> <span class="token punctuation"></span>
        <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -flip <span class="token punctuation"></span><span class="token punctuation">)</span> -compose Multiply -composite <span class="token punctuation"></span>
        <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -flop <span class="token punctuation"></span><span class="token punctuation">)</span> -compose Multiply -composite <span class="token punctuation"></span>
     <span class="token punctuation"></span><span class="token punctuation">)</span> -alpha off -compose CopyOpacity -composite /tmp/image.png</code>`}</pre>
<p>The border radius here is <code>5</code>. Change every <code>5</code> to whatever you want like <code>10</code> for example but <code>5</code> is the sweet spot for me. For more technical explanation and details you can refer to <a href="${"http://www.imagemagick.org/Usage/thumbnails/#rounded"}" rel="${"nofollow"}">their website</a></p>
<h2 id="${"combining-them-all"}"><a href="${"#combining-them-all"}">Combining Them All</a></h2>
<p>Those are all the parts that we need. Let\u2019s combine them together. Make a file called whatever you want and make it executable by using <code>chmod +x filename</code> and edit the file.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token shebang important">#!/bin/dash</span></code>`}</pre>
<p>I use <code>dash</code> for my script, but <code>bash</code> or <code>zsh</code> will do just fine. I don\u2019t know if it\u2019ll work with <code>fish</code> though, I suppose it\u2019ll work just fine. Add your screenshot program to take the image that we will be using. I\u2019m using <a href="${"https://flameshot.js.org/"}" rel="${"nofollow"}">Flameshot</a> so it will look like this.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token shebang important">#!/bin/dash</span>

flameshot gui --raw <span class="token operator">></span> /tmp/image.png</code>`}</pre>
<p>I store the image on <code>/tmp</code> directory because I will copy it to my clipboard and won\u2019t be using the original image.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token shebang important">#!/bin/dash</span>

flameshot gui --raw <span class="token operator">></span> /tmp/image.png

<span class="token comment"># rounded corners</span>
convert /tmp/image.png <span class="token punctuation"></span>
     <span class="token punctuation"></span><span class="token punctuation">(</span> +clone  -alpha extract <span class="token punctuation"></span>
        -draw <span class="token string">'fill black polygon 0,0 0,5 5,0 fill white circle 5,5 5,0'</span> <span class="token punctuation"></span>
        <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -flip <span class="token punctuation"></span><span class="token punctuation">)</span> -compose Multiply -composite <span class="token punctuation"></span>
        <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -flop <span class="token punctuation"></span><span class="token punctuation">)</span> -compose Multiply -composite <span class="token punctuation"></span>
     <span class="token punctuation"></span><span class="token punctuation">)</span> -alpha off -compose CopyOpacity -composite /tmp/image.png</code>`}</pre>
<p>The first effect I apply is the rounded corner and store the result in <code>/tmp/image.png</code>.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token shebang important">#!/bin/dash</span>

flameshot gui --raw <span class="token operator">></span> /tmp/image.png

<span class="token comment"># rounded corners</span>
convert /tmp/image.png <span class="token punctuation"></span>
     <span class="token punctuation"></span><span class="token punctuation">(</span> +clone  -alpha extract <span class="token punctuation"></span>
        -draw <span class="token string">'fill black polygon 0,0 0,5 5,0 fill white circle 5,5 5,0'</span> <span class="token punctuation"></span>
        <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -flip <span class="token punctuation"></span><span class="token punctuation">)</span> -compose Multiply -composite <span class="token punctuation"></span>
        <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -flop <span class="token punctuation"></span><span class="token punctuation">)</span> -compose Multiply -composite <span class="token punctuation"></span>
     <span class="token punctuation"></span><span class="token punctuation">)</span> -alpha off -compose CopyOpacity -composite /tmp/image.png

<span class="token comment"># shadow</span>
convert /tmp/image.png <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -background black -shadow 40x5+0+0 <span class="token punctuation"></span><span class="token punctuation">)</span> <span class="token punctuation"></span>
+swap -background none -layers merge +repage /tmp/image.png<span class="token punctuation">;</span> <span class="token punctuation"></span></code>`}</pre>
<p>Next one is the shadow. I don\u2019t use the small border because it looks weird on a smaller screenshot. You can use it if you like.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token shebang important">#!/bin/dash</span>

flameshot gui --raw <span class="token operator">></span> /tmp/image.png

<span class="token comment"># rounded corners</span>
convert /tmp/image.png <span class="token punctuation"></span>
     <span class="token punctuation"></span><span class="token punctuation">(</span> +clone  -alpha extract <span class="token punctuation"></span>
        -draw <span class="token string">'fill black polygon 0,0 0,5 5,0 fill white circle 5,5 5,0'</span> <span class="token punctuation"></span>
        <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -flip <span class="token punctuation"></span><span class="token punctuation">)</span> -compose Multiply -composite <span class="token punctuation"></span>
        <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -flop <span class="token punctuation"></span><span class="token punctuation">)</span> -compose Multiply -composite <span class="token punctuation"></span>
     <span class="token punctuation"></span><span class="token punctuation">)</span> -alpha off -compose CopyOpacity -composite /tmp/image.png

<span class="token comment"># shadow</span>
convert /tmp/image.png <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -background black -shadow 40x5+0+0 <span class="token punctuation"></span><span class="token punctuation">)</span> <span class="token punctuation"></span>
+swap -background none -layers merge +repage /tmp/image.png<span class="token punctuation">;</span> <span class="token punctuation"></span>

<span class="token comment"># white backdrop</span>
convert /tmp/image.png -bordercolor white -border <span class="token number">10</span> /tmp/image.png</code>`}</pre>
<p>The last effect I apply is white backdrop. Next step is optional, but if you want to you can add it as well.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token shebang important">#!/bin/dash</span>

flameshot gui --raw <span class="token operator">></span> /tmp/image.png

<span class="token comment"># rounded corners</span>
convert /tmp/image.png <span class="token punctuation"></span>
     <span class="token punctuation"></span><span class="token punctuation">(</span> +clone  -alpha extract <span class="token punctuation"></span>
        -draw <span class="token string">'fill black polygon 0,0 0,5 5,0 fill white circle 5,5 5,0'</span> <span class="token punctuation"></span>
        <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -flip <span class="token punctuation"></span><span class="token punctuation">)</span> -compose Multiply -composite <span class="token punctuation"></span>
        <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -flop <span class="token punctuation"></span><span class="token punctuation">)</span> -compose Multiply -composite <span class="token punctuation"></span>
     <span class="token punctuation"></span><span class="token punctuation">)</span> -alpha off -compose CopyOpacity -composite /tmp/image.png

<span class="token comment"># shadow</span>
convert /tmp/image.png <span class="token punctuation"></span><span class="token punctuation">(</span> +clone -background black -shadow 40x5+0+0 <span class="token punctuation"></span><span class="token punctuation">)</span> <span class="token punctuation"></span>
+swap -background none -layers merge +repage /tmp/image.png<span class="token punctuation">;</span> <span class="token punctuation"></span>

<span class="token comment"># white backdrop</span>
convert /tmp/image.png -bordercolor white -border <span class="token number">10</span> /tmp/image.png

<span class="token comment"># copy to clipboard</span>
xclip -selection clipboard -i /tmp/image.png -t image/png</code>`}</pre>
<p>I added the last line to copy the result into my clipboard so I can easily paste it anywhere and don\u2019t have to delete the screenshot when I no longer need it. Here\u2019s the result.</p>
<p><img src="${"/assets/post/prettify-screenshot-using-imagemagick/rounded.png"}" alt="${"rounded"}"></p>
<p>Here\u2019s another version</p>
<p><img src="${"/assets/post/prettify-screenshot-using-imagemagick/square.png"}" alt="${"square"}"></p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>Imagemagick is a powerful CLI tools to manipulate an image. It can do so much more, if you\u2019re interested on that then you can go to <a href="${"https://www.imagemagick.org/"}" rel="${"nofollow"}">their website</a> for some advanced guide. That\u2019s all for this post, thanks for reading and have a nice day \u30C4</p>`
  })}`;
});
var index$n = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Prettify_screenshot_using_imagemagick,
  metadata: metadata$n
});
const metadata$m = {
  title: "Utterances - Comment section that just works",
  date: "2021-02-22T00:00:00.000Z",
  desc: "I've been wanting to add a comment section to my website because why not, and I've found the best solution for me",
  tags: ["website"]
};
const Comments_widget_using_utterance = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$m), {}, {
    default: () => `<h1 id="${"table-of-contents"}"><a href="${"#table-of-contents"}">Table Of Contents</a></h1>
<ul><li><a href="${"#introduction"}">Introduction</a></li>
<li><a href="${"#installation"}">Installation</a></li>
<li><a href="${"#closing-note"}">Closing Note</a></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>If you\u2019ve been following my website long enough, you might have known that I remake my website quite a while ago. I went from [Gatsby][gatsby-link] which uses <a href="${"https://reactjs.org/"}" rel="${"nofollow"}">React</a> + MD to <a href="${"https://sapper.svelte.dev/"}" rel="${"nofollow"}">Sapper</a> which uses <a href="${"https://svelte.dev/"}" rel="${"nofollow"}">Svelte</a> + <a href="${"https://mdsvex.com/"}" rel="${"nofollow"}">MDsveX</a>.</p>
<p>I had a comment section on my old website using <a href="${"https://disqus.com/"}" rel="${"nofollow"}">Disqus</a>. I want to add that to my new website but I think that\u2019s not really what I want because it requires a Disqus Account. While I was browsing through Github, I found <a href="${"https://github.com/utterance/utterances"}" rel="${"nofollow"}">Utterances</a>. It uses Github issues to store the comments, I think this is great! I\u2019m pretty sure most people who visit my website already have a Github account, they wouldn\u2019t need to create a new account.</p>
<h1 id="${"installation"}"><a href="${"#installation"}">Installation</a></h1>
<p>Adding <strong>utterances</strong> is really straightforward, you just need to go to <a href="${"https://utteranc.es/"}" rel="${"nofollow"}">their website</a>, fill the configuration, and grab the snippet. The next step is putting it where you want it to appear. In my case, it\u2019s below every post. Here\u2019s a short snippet to illustrate what I meant.</p>
<pre class="${"language-html"}">${`<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>section</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>main</span><span class="token punctuation">></span></span>
    <span class="token comment">&lt;!-- This is the main content --></span>
    <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span>Comments<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>h1</span><span class="token punctuation">></span></span>
    &#123;#if $theme === "dark"&#125;
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span>
          <span class="token attr-name">src</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>https://utteranc.es/client.js<span class="token punctuation">"</span></span>
          <span class="token attr-name">repo</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>elianiva/elianiva.me<span class="token punctuation">"</span></span>
          <span class="token attr-name">issue-term</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>pathname<span class="token punctuation">"</span></span>
          <span class="token attr-name">label</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>Comments<span class="token punctuation">"</span></span>
          <span class="token attr-name">theme</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>dark-blue<span class="token punctuation">"</span></span>
          <span class="token attr-name">crossorigin</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>anonymous<span class="token punctuation">"</span></span>
          <span class="token attr-name">async</span>
        <span class="token punctuation">></span></span><span class="token script"></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>
    &#123;:else&#125;
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span><span class="token punctuation">></span></span>
        <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span>
          <span class="token attr-name">src</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>https://utteranc.es/client.js<span class="token punctuation">"</span></span>
          <span class="token attr-name">repo</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>elianiva/elianiva.me<span class="token punctuation">"</span></span>
          <span class="token attr-name">issue-term</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>pathname<span class="token punctuation">"</span></span>
          <span class="token attr-name">label</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>Comments<span class="token punctuation">"</span></span>
          <span class="token attr-name">theme</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>github-light<span class="token punctuation">"</span></span>
          <span class="token attr-name">crossorigin</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>anonymous<span class="token punctuation">"</span></span>
          <span class="token attr-name">async</span>
        <span class="token punctuation">></span></span><span class="token script"></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span>
      <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>
    &#123;/if&#125;
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>main</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>section</span><span class="token punctuation">></span></span></code>`}</pre>
<p>I added an <code>if-statement</code> because my website has light-theme and dark-theme and <strong>utterances</strong> doesn\u2019t support changing the theme on-the-fly, at least <em>yet</em>. It\u2019s an <a href="${"https://github.com/utterance/utterances/issues/427"}" rel="${"nofollow"}">open issue</a>. You could do something similar with CSS where you hide one of the comment sections depending on the active theme.</p>
<h1 id="${"closing-note"}"><a href="${"#closing-note"}">Closing Note</a></h1>
<p>I wasn\u2019t thinking about making this post but ended up making it so I can test the comment section XD</p>
<p>It\u2019s a lot shorter than usual, but still, thank you if you\u2019ve read this far. Have a wonderful day! :)</p>`
  })}`;
});
var index$m = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Comments_widget_using_utterance,
  metadata: metadata$m
});
const metadata$l = {
  title: "I rebuild my site using Sapper and MDsveX from scratch",
  date: "2020-10-20T00:00:00.000Z",
  desc: "A post where I explain why I migrate my website using Svelte/Sapper",
  tags: ["svelte", "website"]
};
const I_rebuild_my_site_using_sapper = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$l), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#reasons"}">Reasons</a></p>
<ul><li><a href="${"#why-did-i-rebuild-my-site"}">Why did I rebuild my site?</a></li>
<li><a href="${"#why-did-i-choose-sveltesapper"}">Why did I choose Svelte/Sapper?</a></li></ul></li>
<li><p><a href="${"#my-experience"}">My Experience</a></p>
<ul><li><a href="${"#how-was-the-development-experience"}">How was the development experience?</a></li>
<li><a href="${"#issues-that-i-encountered"}">Issues that I encountered</a></li></ul></li>
<li><p><a href="${"#technologies-i-use"}">Technologies I Use</a></p>
<ul><li><a href="${"#the-core"}">The core</a></li>
<li><a href="${"#post-and-project-pages"}">Post and project pages</a></li>
<li><a href="${"#stylings"}">Stylings</a></li>
<li><a href="${"#optimisation"}">Optimisation</a></li>
<li><a href="${"#hosting"}">Hosting</a></li></ul></li>
<li><p><a href="${"#resources"}">Resources</a></p></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Well, I\u2019ve been trying out Svelte lately and so far I love it. I finally rebuild my site using Sapper. Previously I was using Gatsby, it was an awesome DX but I want to try something new and fresh.</p>
<h1 id="${"reasons"}"><a href="${"#reasons"}">Reasons</a></h1>
<h2 id="${"why-did-i-rebuild-my-site"}"><a href="${"#why-did-i-rebuild-my-site"}">Why did I rebuild my site?</a></h2>
<p>Of course, I want to try this new technology called Svelte. If you read my <a href="${"https://elianiva.me/post/my-experience-with-svelte"}" rel="${"nofollow"}">previous post</a>, I said that I want to rebuild my website using <a href="${"https://svelte.dev"}" rel="${"nofollow"}">Svelte</a>. Using <a href="${"https://sapper.svelte.dev"}" rel="${"nofollow"}">Sapper</a>, to be more specific.</p>
<p>I only use my previous website as a blog. A place where I put some random post with the main reason of \u201Cself-documenting\u201D. I also found it useful when you learned something new and you try to explain it to else. It makes me understand it even better.</p>
<h2 id="${"why-did-i-choose-sveltesapper"}"><a href="${"#why-did-i-choose-sveltesapper"}">Why did I choose Svelte/Sapper?</a></h2>
<p>I choose Svelte (or Sapper to be more specific) because it\u2019s a unique framework. Actually, <a href="${"https://gist.github.com/Rich-Harris/0f910048478c2a6505d1c32185b61934"}" rel="${"nofollow"}">Svelte is a language</a>. Why didn\u2019t I choose something like Vue/Nuxt? Because it\u2019s kinda similar to React/Next in my opinion.</p>
<p>They both use Virtual DOM while Svelte does not. Svelte converts our app into ideal JavaScript at <em>build time</em>, rather than interpreting our application code at <em>runtime</em>.</p>
<blockquote><p>Rethinking Reactivity with Svelte</p></blockquote>
<h1 id="${"my-experience"}"><a href="${"#my-experience"}">My Experience</a></h1>
<h2 id="${"how-was-the-development-experience"}"><a href="${"#how-was-the-development-experience"}">How was the development experience?</a></h2>
<p>Well, I came from Gatsby which has <em>a lot</em> of plugins. This time I made it using Sapper which has no plugins. I have to do stuff by myself. It\u2019s still a great experience nonetheless.</p>
<p>Svelte is a new technology, meaning that nvim-lsp most likely doesn\u2019t support it (yet). nvim-lsp is a builtin lsp client for a text editor that I use which is <a href="${"https://neovim.io"}" rel="${"nofollow"}">Neovim</a>. Thankfully, adding an LSP config for that is quite easy so I made one and opened <a href="${"https://github.com/neovim/nvim-lspconfig/pull/385"}" rel="${"nofollow"}">a pull request</a> for it.</p>
<p>Because of this project, I also have a chance to tinker around even more with Lua stuff in Neovim which I\u2019ll talk about in a different post.</p>
<h2 id="${"issues-that-i-encountered"}"><a href="${"#issues-that-i-encountered"}">Issues that I encountered</a></h2>
<p>Initially, I want to use <a href="${"https://sass-lang.com/"}" rel="${"nofollow"}">SCSS</a> instead of plain CSS. As always, nothing goes smoothly in our life. It conflicts with <code>svelte-image</code> which throws a bunch of errors. To be fair, it doesn\u2019t affect anything, it\u2019s just hurt for me to see those errors whenever I start the dev server. I decided to just use the good ol\u2019 plain CSS.</p>
<p>Another issue that I encountered is the table of content. You see, the table of content has a list of links which has an href of a heading ID. At the time of writing this, Sapper has an issue where if an URL has an href of <code>#heading-id</code> (started with a hash) then it will go to <code>/#heading-id</code> instead of adding the href to the end of the URL like <code>/post/slug#heading-id</code>. This issue is currently being tracked <a href="${"https://github.com/sveltejs/sapper/issues/331"}" rel="${"nofollow"}">here</a>.</p>
<p>The solution for it was quite simple, I just need to add this piece of code (thanks to <a href="${"https://github.com/sveltejs/sapper/issues/331#issuecomment-706627790"}" rel="${"nofollow"}">this comment</a>) on my post layout and poof, problem\u2019s solved.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">import</span> <span class="token punctuation">&#123;</span> onMount <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">'svelte'</span>
<span class="token function">onMount</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  document<span class="token punctuation">.</span><span class="token function">querySelectorAll</span><span class="token punctuation">(</span><span class="token string">'a'</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">forEach</span><span class="token punctuation">(</span><span class="token parameter">a</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>a<span class="token punctuation">.</span>hash <span class="token operator">||</span> <span class="token operator">!</span>document<span class="token punctuation">.</span><span class="token function">querySelectorAll</span><span class="token punctuation">(</span>a<span class="token punctuation">.</span>hash<span class="token punctuation">)</span><span class="token punctuation">.</span>length<span class="token punctuation">)</span> <span class="token keyword">return</span>
    a<span class="token punctuation">.</span><span class="token function">addEventListener</span><span class="token punctuation">(</span><span class="token string">'click'</span><span class="token punctuation">,</span> <span class="token parameter">event</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
      event<span class="token punctuation">.</span><span class="token function">preventDefault</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
      window<span class="token punctuation">.</span>location<span class="token punctuation">.</span>hash <span class="token operator">=</span> event<span class="token punctuation">.</span>target<span class="token punctuation">.</span><span class="token function">getAttribute</span><span class="token punctuation">(</span><span class="token string">'href'</span><span class="token punctuation">)</span>
    <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span></code>`}</pre>
<p>You might want to change <code>document</code> to something else because if you use <code>document</code> then it will change the <code>a</code> behaviour of the entire document. You can see mine <a href="${"https://github.com/elianiva/elianiva.me/blob/a0c824de5b372ff210a1e3f44d10ef80e2be4190/src/layouts/post.svelte#L340-L356"}" rel="${"nofollow"}">here</a>.
I also use <code>decodeURIComponent</code> to handle Japanese characters.</p>
<p>I also couldn\u2019t make <a href="${"https://shiki.matsu.io"}" rel="${"nofollow"}">shiki</a> work with MDsveX. There\u2019s nothing wrong with the default highlighter of MDsveX (which is <a href="${"https://prismjs.com"}" rel="${"nofollow"}">prismjs</a>) but I want to use Shiki because it has the same syntax grammar as VScode and it looks better in my opinion. Though, MDsveX will use Shiki in the future version according to <a href="${"https://github.com/pngwn/MDsveX/issues/139#issuecomment-688478536"}" rel="${"nofollow"}">pngwn\u2019s comment</a>.</p>
<h1 id="${"technologies-i-use"}"><a href="${"#technologies-i-use"}">Technologies I Use</a></h1>
<h2 id="${"the-core"}"><a href="${"#the-core"}">The core</a></h2>
<p>I use Sapper (obviously) for this website. Why did I choose Sapper, you might ask. Well, because Sapper supports SSR. Though at the time of writing this, there has been a Svelte Summit and there\u2019s a panel where Rich Harris, the creator of Svelte said that Sapper will be discontinued and Svelte will support SSR instead.</p>
<p>I am so hyped for this. Svelte will also use <a href="${"https://snowpack.dev"}" rel="${"nofollow"}">Snowpack</a> instead of Rollup so it will support Hot Module Reloading. Couldn\u2019t wait for it to be released to Master branch. As of time of writing this, it\u2019s still in a private repo and quite unstable.</p>
<p>It looks so cool at a first glance. If you want to see it yourself, <a href="${"https://www.youtube.com/watch?v=qSfdtmcZ4d0&t=53s"}" rel="${"nofollow"}">there you go</a>. I found a <a href="${"https://codechips.me/snowpack-svelte-typescript-tailwindcss/"}" rel="${"nofollow"}">good article</a> that you might also want to read.</p>
<p>I have an intention of moving this site to Svelte in the future once it supports SSR. Rich Harris said that the future version of Svelte will be quite similar with Sapper so it won\u2019t be a hassle to migrate.</p>
<h2 id="${"post-and-project-pages"}"><a href="${"#post-and-project-pages"}">Post and project pages</a></h2>
<p>I use <a href="${"https://mdsvex.com"}" rel="${"nofollow"}">MDsveX</a> as a source for my post and project page. It\u2019s basically like <a href="${"https://mdxjs.com/"}" rel="${"nofollow"}">MDX</a> but for Svelte. I use Markdown on my previous site. I chose MDsveX because of <a href="${"https://www.youtube.com/watch?v=Tr9wJYvnA24"}" rel="${"nofollow"}">this talk</a>. It was a great talk, props to Svelte Indonesia community. The talk convinced me enough to use MDsveX instead of plain Markdown.</p>
<p>I have two separate layouts which are <a href="${"https://github.com/elianiva/elianiva.me/blob/master/src/layouts/post.svelte"}" rel="${"nofollow"}">post layout</a> and <a href="${"https://github.com/elianiva/elianiva.me/blob/master/src/layouts/project.svelte"}" rel="${"nofollow"}">project layout</a>. If you want to know the differences, just check it out yourself \u30C4</p>
<h2 id="${"stylings"}"><a href="${"#stylings"}">Stylings</a></h2>
<p>As I mentioned earlier, I was going to use SCSS but got canceled. I use PostCSS instead to utilize its rich plugin ecosystem. Currently, I use <a href="${"https://github.com/postcss/autoprefixer"}" rel="${"nofollow"}">autoprefixer</a> to prefix all of my CSS and <a href="${"https://cssnano.co/"}" rel="${"nofollow"}">cssnano</a> to minify my CSS.</p>
<h2 id="${"optimisation"}"><a href="${"#optimisation"}">Optimisation</a></h2>
<p>I use <a href="${"https://github.com/matyunya/svelte-image"}" rel="${"nofollow"}">svelte-image</a> to lazyload images for my site. Though, I\u2019m having some issue right now. There\u2019s a warning which says</p>
<pre class="${"language-null"}">${`<code class="language-null">Cannot process a dynamic value: MustacheTag</code>`}</pre>
<p>This is caused by passing a variable to <code>svelte-image</code> component like this.</p>
<pre class="${"language-html"}">${`<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>Image</span> <span class="token attr-name">src</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span>&#123;src&#125;</span> <span class="token punctuation">/></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
<span class="token keyword">export</span> <span class="token keyword">let</span> src
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span></code>`}</pre>
<p>In other words, <code>svelte-image</code> doesn\u2019t support dynamic path. I just use <code>svelte-waypoint</code> to lazyload my images until this problem got fixed.</p>
<p>This issue is currently tracked <a href="${"https://github.com/matyunya/svelte-image/issues/6"}" rel="${"nofollow"}">here</a>. At the moment, this issue is not possible to fix because of <a href="${"https://github.com/matyunya/svelte-image/issues/31#issuecomment-550711822"}" rel="${"nofollow"}">this reason</a>. I really hope this issue will get fixed soon in the future.</p>
${validate_component(Update, "Update").$$render($$result, {date: "12-11-2020"}, {}, {
      default: () => `<p>I no longer uses svelte-image because for some reason, <a href="${"https://github.com/lovell/sharp"}" rel="${"nofollow"}">sharp</a> made the image filesize bigger even though the resolution is smaller.</p>`
    })}
<h2 id="${"hosting"}"><a href="${"#hosting"}">Hosting</a></h2>
<p>I use <a href="${"https://vercel.com"}" rel="${"nofollow"}">Vercel</a> to host my site. I used Vercel quite a few in the past and it\u2019s been great. It\u2019s simple to set up and integrate with Github. It\u2019s also free!</p>
<h1 id="${"resources"}"><a href="${"#resources"}">Resources</a></h1>
<p>Here are some resources that helped me making this website. Hope you find this useful \u30C4</p>
<ul><li><a href="${"https://github.com/iamyuu/iamyuu"}" rel="${"nofollow"}">https://github.com/iamyuu/iamyuu</a></li>
<li><a href="${"https://web.dev/"}" rel="${"nofollow"}">https://web.dev/</a></li>
<li><a href="${"https://fatihkalifa.com/dark-mode-web"}" rel="${"nofollow"}">https://fatihkalifa.com/dark-mode-web</a></li>
<li><a href="${"https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/"}" rel="${"nofollow"}">https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/</a></li></ul>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>All in all, I\u2019m glad that finally decided to rebuild my site using Sapper. It was a great experience. I am really looking forward to <code>svelte@next</code> release because man, that thing looks so damn cool.</p>`
  })}`;
});
var index$l = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: I_rebuild_my_site_using_sapper,
  metadata: metadata$l
});
const metadata$k = {
  title: "Setting up Japanese input method on Linux",
  date: "2020-06-05T00:00:00.000Z",
  desc: "Installing fcitx and mozc for Japanese input method so you can type \u65E5\u672C\u8A9E on Linux",
  tags: ["linux", "japanese"]
};
const Japanese_input_method_on_linux = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$k), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#fcitx"}">Fcitx</a></p>
<ul><li><a href="${"#what-is-fcitx"}">What Is Fcitx?</a></li>
<li><a href="${"#installation"}">Installation</a></li>
<li><a href="${"#configuration"}">Configuration</a></li></ul></li>
<li><p><a href="${"#mozc"}">Mozc</a></p>
<ul><li><a href="${"#what-is-mozc"}">What Is Mozc?</a></li>
<li><a href="${"#installation-1"}">Installation</a></li>
<li><a href="${"#configuration-1"}">Configuration</a></li>
<li><a href="${"#usage"}">Usage</a></li>
<li><a href="${"#tips"}">Tips</a></li></ul></li>
<li><p><a href="${"#closing-note"}">Closing Note</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>So I\u2019ve been learning Japanese lately then I came across this question, \u201CHow do I input a japanese character on my laptop?\u201D I use a 12-keys layout to insert japanese characters on my phone. It takes time to adapt but eventually I got comfortable enough with it.</p>
<p>At first, I tried to change the keyboard layout but it doesn\u2019t work. I then came across this combination, <strong>Fcitx</strong> and <strong>Mozc</strong>. It\u2019s been a great experience using them, it\u2019s also very easy to set up and use.</p>
<h1 id="${"fcitx"}"><a href="${"#fcitx"}">Fcitx</a></h1>
<h2 id="${"what-is-fcitx"}"><a href="${"#what-is-fcitx"}">What Is Fcitx?</a></h2>
<p>According to <a href="${"https://en.wikipedia.org/wiki/Fcitx"}" rel="${"nofollow"}">Wikipedia</a>, <strong>Fcitx</strong> is an input method framework with extension support for the X Window System that supports multiple input method engines.</p>
<p>It supports multiple input engines like <code>fcitx-hangul</code> for Korean, <code>fcitx-mozc</code> for Japanese, <code>fcitx-googlepinyin</code> for Chinese, and more.</p>
<p>It also has a lot of addons that you can use like <code>clipboard</code> for clipboard management, <code>spell</code> for spellchecking, and many more.</p>
<h2 id="${"installation"}"><a href="${"#installation"}">Installation</a></h2>
<p>Installing Fcitx is pretty simple. It\u2019s available on most Linux distro official repository. I use Archlinux so mine will looks like this, you might use another distro but it\u2019s basically the same.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token comment"># Arch</span>
$ <span class="token function">sudo</span> pacman -S fcitx

<span class="token comment"># Debian / Ubuntu</span>
$ <span class="token function">sudo</span> <span class="token function">apt-get</span> <span class="token function">install</span> fcitx</code>`}</pre>
<p>After installing it, we need to set our input method variable to <code>fcitx</code>.</p>
<h2 id="${"configuration"}"><a href="${"#configuration"}">Configuration</a></h2>
<p>To set our input method to <code>fcitx</code>, we need to change our environment variable.
I set it on <code>~/.pam_environment</code>, but you can set it on <code>~/.xprofile</code>, <code>~/.profile</code>, <code>~/.xinitrc</code> or anything that gets sourced on login. Mine\u2019s looks like this.</p>
<pre class="${"language-bash"}">${`<code class="language-bash">GTK_IM_MODULE <span class="token assign-left variable">DEFAULT</span><span class="token operator">=</span>fcitx
QT_IM_MODULE  <span class="token assign-left variable">DEFAULT</span><span class="token operator">=</span>fcitx
<span class="token environment constant">XMODIFIERS</span>    <span class="token assign-left variable">DEFAULT</span><span class="token operator">=</span><span class="token punctuation"></span>@im<span class="token operator">=</span>fcitx
SDL_IM_MODULE <span class="token assign-left variable">DEFAULT</span><span class="token operator">=</span>fcitx
<span class="token assign-left variable">IBUS_USE_PORTAL</span><span class="token operator">=</span><span class="token number">1</span></code>`}</pre>
<p>You need to add <code>export</code> if you put it on <code>~/.xprofile</code> or <code>~/.xinitrc</code>.</p>
<h1 id="${"mozc"}"><a href="${"#mozc"}">Mozc</a></h1>
<h2 id="${"what-is-mozc"}"><a href="${"#what-is-mozc"}">What Is Mozc?</a></h2>
<p>According to the project <a href="${"https://github.com/google/mozc"}" rel="${"nofollow"}">home page</a> itself, Mozc is a Japanese input method editor (IME) designed for multi-platform such as Android OS, Apple OS X, Chromium OS, GNU/Linux and Microsoft Windows. This OpenSource project originates from <a href="${"http://www.google.com/intl/ja/ime/"}" rel="${"nofollow"}">Google Japanese Input</a>.</p>
<p>We need this for <code>fcitx</code> that we\u2019ve installed previously to be able to input Japanese characters.</p>
<h2 id="${"installation-1"}"><a href="${"#installation-1"}">Installation</a></h2>
<p>We are using Fcitx as our input method framework so what we need to install is <code>fcitx-mozc</code>. It\u2019s also available on most Linux distro official repository.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token comment"># Archlinux</span>
$ <span class="token function">sudo</span> pacman -S fcitx-mozc

<span class="token comment"># Debian / Ubuntu</span>
$ <span class="token function">sudo</span> <span class="token function">apt-get</span> <span class="token function">install</span> fcitx-mozc</code>`}</pre>
<p>After installing it, it will be available to Fcitx as an input method.</p>
<h2 id="${"configuration-1"}"><a href="${"#configuration-1"}">Configuration</a></h2>
<p>Now what we need to do is set Mozc as Fcitx input method. To do that, open up the <code>fcitx-configtool</code>. It will roughly look like this, it may look different because of your theme.</p>
<p><img src="${"/assets/post/japanese-input-method-on-linux/configtool.png"}" alt="${"fcitx configtool"}"></p>
<p>Press the <strong><code>+</code></strong> sign on the bottom left corner. A pop-up will appear and make sure you uncheck the checkbox that says <code>Only Show Current Language</code>, otherwise the <code>Mozc</code> input method won\u2019t show up.</p>
<p><img src="${"/assets/post/japanese-input-method-on-linux/configtool-2.png"}" alt="${"fcitx configtool"}"></p>
<p>After you uncheck the box, search for <code>Mozc</code> then press OK. Here\u2019s the end result.</p>
<p><img src="${"/assets/post/japanese-input-method-on-linux/configtool-3.png"}" alt="${"fcitx configtool"}"></p>
<p>After setting it all up, execute <code>fcitx</code> on startup depending on your DE/WM. I put it in <code>~/.xprofile</code> like so.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token comment"># ~/.xprofile</span>
fcitx <span class="token operator">&amp;</span></code>`}</pre>
<p>If you put it on <code>~/.xprofile</code>, it will get executed when you log in regardless of your DE/WM (this isn\u2019t the case if you\u2019re using a display manager like <a href="${"https://wiki.archlinux.org/index.php/SLiM"}" rel="${"nofollow"}">slim</a>). After doing that, make sure you restart your DE/WM.</p>
${validate_component(Update, "Update").$$render($$result, {date: "01-01-2021"}, {}, {
      default: () => `<p>I now use SLIM which doesn\u2019t execute <code>~/.xprofile</code>, it executes <code>~/.xinitrc</code> so I just move it there.</p>`
    })}
<p>Fcitx is toggleable using a keybind that you can change from the <code>fcitx-confgitool</code> which looks like this.</p>
<p><img src="${"/assets/post/japanese-input-method-on-linux/configtool-4.png"}" alt="${"fcitx configtool"}"></p>
<p>You can change the <code>Trigger Input Method</code> to whatever key you like. I personally use <code>alt+space</code>.</p>
<h2 id="${"usage"}"><a href="${"#usage"}">Usage</a></h2>
<p>If you\u2019ve done configuring it, try to activate it by pressing the keybind that you\u2019ve defined before then try to type on something. It will look like this.</p>
<p><img src="${"/assets/post/japanese-input-method-on-linux/preview.png"}" alt="${"fcitx completion preview"}"></p>
<p>It looks like an autocomplete from a text editor. The way it works is if you write <code>romaji</code>, it auto converts it to <code>hiragana</code> which you can then press <code>TAB</code> to scroll the options.</p>
<p>For example, if you write <code>watashi</code> then it will show <code>\u308F\u305F\u3057</code> and if you continue pressing <code>TAB</code> it will be the kanji form of it which is <code>\u79C1</code>. This also applies to <code>katakana</code>.</p>
<h2 id="${"tips"}"><a href="${"#tips"}">Tips</a></h2>
${validate_component(Update, "Update").$$render($$result, {date: "01-01-2021"}, {}, {
      default: () => `<p>If you don\u2019t like the default light theme, you can change the appearance of it by changing the skin. Click the <code>fcitx</code> icon on you systray, under the skin section, there should be 3 default theme. I personally use the dark one because I\u2019m a big fan of dark mode.</p>`
    })}
<p>You might want to install <code>fcitx-qt</code> to be able to use it inside QT app. You might also need to add <code>IBUS_USE_PORTAL=1</code> in <code>~/.pam_environment</code> to make it work inside Telegram Desktop. I didn\u2019t need to add this when I was using KDE Plasma but I need to add it now because I use AwesomeWM.</p>
<h1 id="${"closing-note"}"><a href="${"#closing-note"}">Closing Note</a></h1>
<p>All in all, I\u2019m pretty satisfied with this setup. I don\u2019t have to learn a new keyboard layout to insert Japanese characters. I can just write romaji and it will turn into hiragana, katakana, or kanji.</p>
<p>Anyway, thanks for reading this post. I hope you find this post useful and have a good day!</p>`
  })}`;
});
var index$k = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Japanese_input_method_on_linux,
  metadata: metadata$k
});
const metadata$j = {
  title: "My Experience Trying Out Svelte For The First Time",
  date: "2020-09-27T00:00:00.000Z",
  desc: "Phew lads, I finally tried svelte after a while and boi oh boi do I love it",
  tags: ["svelte", "website"]
};
const My_experience_with_svelte = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$j), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#why-svelte"}">Why Svelte?</a></p></li>
<li><p><a href="${"#my-experience"}">My Experience</a></p>
<ul><li><p><a href="${"#almost-feel-like-not-using-any-framework"}">Almost feel like not using any framework</a></p></li>
<li><p><a href="${"#what-ive-made-with-svelte"}">What I\u2019ve made with Svelte</a></p></li>
<li><p><a href="${"#what-ive-learned-so-far"}">What I\u2019ve learned so far</a></p>
<ul><li><a href="${"#components"}">Components</a></li>
<li><a href="${"#props"}">Props</a></li>
<li><a href="${"#scoped-stylings"}">Scoped stylings</a></li>
<li><a href="${"#global-state"}">Global state</a></li>
<li><a href="${"#animation-and-transition-directive"}">Animation and transition directive</a></li>
<li><a href="${"#logic-blocks"}">Logic blocks</a></li></ul></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Phew lads, I finally tried using Svelte and boi oh boi was it an awesome experience. I\u2019ve been holding my self to try svelte because the editor that I\u2019m using which is <strong>Neovim</strong> doesn\u2019t support svelte really well back then. I decided to try it again this time and it works great now.</p>
<h1 id="${"why-svelte"}"><a href="${"#why-svelte"}">Why Svelte?</a></h1>
<p>If you don\u2019t know, I usually use React for building a website. I love React and its concept but I want to try something else that is different. Why not Vue? you might ask. Well, to be honest it\u2019s hard for me to wrap around my head on how Vue works. It\u2019s also because Svelte is quite a new library and it is unique. It doesn\u2019t use Virtual DOM like most of SPA framework does.</p>
<p>To be fair, Svelte is <a href="${"https://gist.github.com/Rich-Harris/0f910048478c2a6505d1c32185b61934"}" rel="${"nofollow"}">actually a language</a> that compiles to pure javascript that we all know and <em><del>hate</del></em> love. There are other languages that also tries to desribe interactive user interface such as <a href="${"https://www.imba.io/"}" rel="${"nofollow"}">Imba</a>, <a href="${"https://elm-lang.org/"}" rel="${"nofollow"}">Elm</a>, <a href="${"https://markojs.com/"}" rel="${"nofollow"}">Marko</a> and many more.</p>
<h1 id="${"my-experience"}"><a href="${"#my-experience"}">My Experience</a></h1>
<h2 id="${"almost-feel-like-not-using-any-framework"}"><a href="${"#almost-feel-like-not-using-any-framework"}">Almost feel like not using any framework</a></h2>
<p>My first impression was like, man, this is just like a vanilla html with some sugar on top of it. It looks similar to Vue syntax but more flexible so to speak. Vue\u2019s html has to be placed inside of <code>&lt;template/&gt;</code> tag whereas Svelte isn\u2019t. You can place it literally anywhere. Take a look at this.</p>
<pre class="${"language-html"}">${`<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>style</span><span class="token punctuation">></span></span><span class="token style"><span class="token language-css">
  <span class="token selector">.heading</span> <span class="token punctuation">&#123;</span>
    <span class="token property">color</span><span class="token punctuation">:</span> aqua<span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>style</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>Navbar</span> <span class="token attr-name">title</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>An epic title<span class="token punctuation">"</span></span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span> <span class="token attr-name">class</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>heading<span class="token punctuation">"</span></span><span class="token punctuation">></span></span>&#123;heading&#125;<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>h1</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span><span class="token punctuation">></span></span>
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>p</span><span class="token punctuation">></span></span>&#123;paragraph&#125;<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>p</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>Footer</span> <span class="token punctuation">/></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> Footer <span class="token keyword">from</span> <span class="token string">"./_components/Footer.svelte"</span>
  <span class="token keyword">let</span> heading <span class="token operator">=</span> <span class="token string">"This is a heading"</span>
  <span class="token keyword">let</span> paragraph <span class="token operator">=</span> <span class="token string">"This is a heading"</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span></code>`}</pre>
<p>It looks very similar to pure html isn\u2019t it? I also prefer Svelte syntax over Vue syntax because it looks more similar to React. What I mean by that is, if you want to run a javascipt expression, they both uses <code>{}</code>. For example.</p>
<pre class="${"language-html"}">${`<code class="language-html"><span class="token comment">&lt;!-- React --></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>Counter</span> <span class="token attr-name">count</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span>&#123;count&#125;/</span><span class="token punctuation">></span></span>

<span class="token comment">&lt;!-- Svelte --></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>Counter</span> <span class="token attr-name">count</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span>&#123;count&#125;/</span><span class="token punctuation">></span></span>
<span class="token comment">&lt;!-- or shorthand if you prefer --></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>Counter</span> <span class="token attr-name">&#123;count&#125;</span><span class="token punctuation">/></span></span>

<span class="token comment">&lt;!-- Vue --></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>Counter</span> <span class="token attr-name"><span class="token namespace">v-bind:</span>count</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>count<span class="token punctuation">"</span></span><span class="token punctuation">/></span></span></code>`}</pre>
<h2 id="${"what-ive-made-with-svelte"}"><a href="${"#what-ive-made-with-svelte"}">What I\u2019ve made with Svelte</a></h2>
<p>I\u2019ve made 2 websites using Svelte. The first one is <a href="${"https://three-of-something.vercel.app/"}" rel="${"nofollow"}">Three Of Something</a> which is a place where I put the result of small challenge where I implement a UI design that I found to code. I do this challenge every week with both of my friends, <a href="${"https://github.com/nikarashihatsu"}" rel="${"nofollow"}">NikarashiHatsu</a> and <a href="${"https://github.com/LynSotera"}" rel="${"nofollow"}">LynSotera</a>. Here\u2019s a screenshot of the homepage.</p>
<p><img src="${"/assets/post/my-experience-with-svelte/tos.png"}" alt="${"three of  something"}"></p>
<p>Go visit the website if you\u2019re interested \u30C4</p>
<p>The second website that I made is <a href="${"https://kanaizu.vercel.app/"}" rel="${"nofollow"}">Kanaizu</a>. It\u2019s basically some sort of quiz app where you need to type the correct romaji for the shown kana. The main reason of why I made this app is because I want to learn more about Svelte and to help my friend memorise Japanese kana. Here\u2019s the homepage of it.</p>
<p><img src="${"/assets/post/my-experience-with-svelte/kanaizu.png"}" alt="${"kanaizu"}"></p>
<p>Again, go visit the website if you\u2019re interested \u30C4</p>
<p>To be fair, I made those using <a href="${"https://routify.dev/"}" rel="${"nofollow"}">Routify</a>. Basically, <strong>Routify handles the routing</strong>. I didn\u2019t use <a href="${"https://sapper.dev"}" rel="${"nofollow"}">Sapper</a> because it\u2019s too much for what I need. I just need a basic routing and Routify is perfect.</p>
<h2 id="${"what-ive-learned-so-far"}"><a href="${"#what-ive-learned-so-far"}">What I\u2019ve learned so far</a></h2>
<p>After making those 2 sites, I of course learned some new stuff and I\u2019m so happy that I finally decided to try Svelte.</p>
<h3 id="${"components"}"><a href="${"#components"}">Components</a></h3>
<p>On React, a component is a function that returns a JSX. It looks something like this.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">export</span> <span class="token keyword">default</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token operator">&lt;</span>p<span class="token operator">></span>Hello World<span class="token operator">!</span><span class="token operator">&lt;</span><span class="token operator">/</span>p<span class="token operator">></span></code>`}</pre>
<p>On Svelte, the whole file is a component. It uses <code>.svelte</code> extension and the syntax is basically a superset of HTML. It looks something like this.</p>
<pre class="${"language-html"}">${`<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>style</span><span class="token punctuation">></span></span><span class="token style"><span class="token language-css">
  <span class="token comment">/* some stylings */</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>style</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span><span class="token punctuation">></span></span>I'm an HTML<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token comment">// some logic goes here</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span></code>`}</pre>
<p>The order doesn\u2019t really matter but I prefer <code>style-markup-script</code> because I like the markup to be in the middle of the stylings and the script.</p>
<h3 id="${"props"}"><a href="${"#props"}">Props</a></h3>
<p>Apparently, props in svelte is just an exported <code>let</code> variable. So what you would do to make a prop is something like this.</p>
<p><code>Counter.svelte</code></p>
<pre class="${"language-html"}">${`<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span><span class="token punctuation">></span></span>
  &#123;count&#125;
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">export</span> <span class="token keyword">let</span> count
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span></code>`}</pre>
<p><code>App.svelte</code></p>
<pre class="${"language-html"}">${`<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span><span class="token punctuation">></span></span>
 <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>Counter</span> <span class="token attr-name">count</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">"</span>&#123;1&#125;<span class="token punctuation">"</span></span><span class="token punctuation">/></span></span>
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> Counter <span class="token keyword">from</span> <span class="token string">"./counter.svelte"</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span></code>`}</pre>
<h3 id="${"scoped-stylings"}"><a href="${"#scoped-stylings"}">Scoped stylings</a></h3>
<p>Styling in Svelte is scoped! Because you write the styling on the same file as the rest of the component, it became scoped. You can still change the global styling using <code>:global()</code> though.</p>
<h3 id="${"global-state"}"><a href="${"#global-state"}">Global state</a></h3>
<p>Next thing that I learned is global state or store. Usually in React, I need <code>React.Context</code> to store a global state. On Svelte, I need to use <code>svelte/store</code>. Global state is much simpler in Svelte in my opinion. Here\u2019s a comparison between them.</p>
<p><code>context.js</code></p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">import</span> React<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> createContext<span class="token punctuation">,</span> useState <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">"react"</span>

<span class="token keyword">export</span> <span class="token keyword">const</span> CountContext <span class="token operator">=</span> <span class="token function">createContext</span><span class="token punctuation">(</span><span class="token keyword">null</span><span class="token punctuation">)</span>

<span class="token keyword">export</span> <span class="token keyword">const</span> <span class="token function-variable function">CountProvider</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token parameter"><span class="token punctuation">&#123;</span> children <span class="token punctuation">&#125;</span></span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  <span class="token keyword">const</span> <span class="token punctuation">[</span>count<span class="token punctuation">,</span> setCount<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token function">useState</span><span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    <span class="token operator">&lt;</span>CountContext<span class="token punctuation">.</span>Provider value<span class="token operator">=</span><span class="token punctuation">&#123;</span><span class="token punctuation">&#123;</span> count<span class="token punctuation">,</span> setCount <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token operator">></span>
      <span class="token punctuation">&#123;</span>children<span class="token punctuation">&#125;</span>
    <span class="token operator">&lt;</span><span class="token operator">/</span>CountContext<span class="token punctuation">.</span>Provider<span class="token operator">></span>
  <span class="token punctuation">)</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<p><code>app.js</code></p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">import</span> React<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> useContext <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">"react"</span>
<span class="token keyword">import</span> <span class="token punctuation">&#123;</span> CountProvider<span class="token punctuation">,</span> CountContext <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">"./context"</span>

<span class="token keyword">export</span> <span class="token keyword">default</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">&#123;</span>
  <span class="token keyword">const</span> <span class="token punctuation">&#123;</span> count<span class="token punctuation">,</span> setCount <span class="token punctuation">&#125;</span> <span class="token operator">=</span> <span class="token function">useContext</span><span class="token punctuation">(</span>CountContext<span class="token punctuation">)</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    <span class="token operator">&lt;</span>CountProvider<span class="token operator">></span>
      <span class="token operator">&lt;</span>p<span class="token operator">></span><span class="token punctuation">&#123;</span>count<span class="token punctuation">&#125;</span><span class="token operator">&lt;</span><span class="token operator">/</span>p<span class="token operator">></span>
      <span class="token operator">&lt;</span>button onClick<span class="token operator">=</span><span class="token punctuation">&#123;</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token function">setCount</span><span class="token punctuation">(</span>count <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">&#125;</span><span class="token operator">></span>Increment<span class="token operator">&lt;</span><span class="token operator">/</span>button<span class="token operator">></span>
      <span class="token operator">&lt;</span>button onClick<span class="token operator">=</span><span class="token punctuation">&#123;</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token function">setCount</span><span class="token punctuation">(</span>count <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">&#125;</span><span class="token operator">></span>Decrement<span class="token operator">&lt;</span><span class="token operator">/</span>button<span class="token operator">></span>
    <span class="token operator">&lt;</span><span class="token operator">/</span>CountProvider<span class="token operator">></span>
  <span class="token punctuation">)</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<p>Well, it looks like a lot but it\u2019s actually quite simple if you know how React Context works. Now let\u2019s compare it with Svelte.</p>
<p><code>stores.js</code></p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">import</span> <span class="token punctuation">&#123;</span> writable <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">"svelte/store"</span>

<span class="token keyword">export</span> <span class="token keyword">const</span> count <span class="token operator">=</span> <span class="token function">writable</span><span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span></code>`}</pre>
<p><code>app.svelte</code></p>
<pre class="${"language-html"}">${`<code class="language-html"><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>p</span><span class="token punctuation">></span></span>&#123;$count&#125;<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>p</span><span class="token punctuation">></span></span>
&lt;button on:click=&#123;count.update(n => n + 1)&#125;>Increment<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span>
&lt;button on:click=&#123;count.update(n => n - 1)&#125;>Decrement<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> count <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">"./stores"</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span></code>`}</pre>
<p>I mean, just look at how simple it is. Bare in mind that this post isn\u2019t meant to explain every single thing that Svelte has to offer so please refer to the <a href="${"https://svelte.dev/tutorial/writable-stores"}" rel="${"nofollow"}">official website</a> for more explanation \u30C4</p>
<p>Actually, Svelte also has <a href="${"https://svelte.dev/tutorial/context-api"}" rel="${"nofollow"}">Context API</a>. Since I\u2019m still learning, please read <a href="${"https://medium.com/better-programming/6-ways-to-do-component-communications-in-svelte-b3f2a483913c"}" rel="${"nofollow"}">this article</a> for better understanding. It\u2019s such a good article and you should definitely check it out!</p>
<h3 id="${"animation-and-transition-directive"}"><a href="${"#animation-and-transition-directive"}">Animation and transition directive</a></h3>
<p>Svelte provides <a href="${"https://svelte.dev/tutorial/animate"}" rel="${"nofollow"}">animation</a> and <a href="${"https://svelte.dev/tutorial/transition"}" rel="${"nofollow"}">transition</a> that you can use to animate your components. The usage is also simple, what you would do is just something like this.</p>
<p><code>Transition.svelte</code></p>
<pre class="${"language-html"}">${`<code class="language-html">&lt;button on:click=&#123;isVisible = !isVisible&#125;>Toggle<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span>
&#123;#if isVisible&#125;
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>p</span> <span class="token attr-name"><span class="token namespace">transition:</span>fade</span><span class="token punctuation">></span></span>This text is visible<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>p</span><span class="token punctuation">></span></span>
&#123;/if&#125;

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
  <span class="token keyword">import</span> <span class="token punctuation">&#123;</span> fade <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">"svelte/transition"</span>
  <span class="token keyword">let</span> isVisible <span class="token operator">=</span> <span class="token boolean">false</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span></code>`}</pre>
<p>The transition directive is triggered whenever an element leaves or enter the DOM tree. More details about transition directive is available <a href="${"https://svelte.dev/docs#transition_fn"}" rel="${"nofollow"}">here</a>.</p>
<p>I used transition for <a href="${"https://kanaizu.vercel.app"}" rel="${"nofollow"}">Kanaizu</a> but I haven\u2019t tried the animate directive since I haven\u2019t found the use case for it.</p>
<h3 id="${"logic-blocks"}"><a href="${"#logic-blocks"}">Logic blocks</a></h3>
<p>Last one is logic blocks. On React, you can use curly braces <code>{}</code> to write some Javascript logics and return something that will get rendered. Here\u2019s an example.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">import</span> React<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> useState <span class="token punctuation">&#125;</span> <span class="token keyword">from</span> <span class="token string">"react"</span>

<span class="token keyword">export</span> <span class="token keyword">default</span> <span class="token keyword">function</span> <span class="token function">Counter</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
  <span class="token keyword">const</span> <span class="token punctuation">[</span>isVisible<span class="token punctuation">,</span> setVisible<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token boolean">false</span>
  <span class="token keyword">return</span> <span class="token punctuation">(</span>
    <span class="token operator">&lt;</span>div<span class="token operator">></span>
      <span class="token punctuation">&#123;</span>isVisible <span class="token operator">&amp;&amp;</span> <span class="token operator">&lt;</span>div<span class="token operator">></span><span class="token constant">I</span>'m Visible<span class="token operator">!</span><span class="token operator">&lt;</span><span class="token operator">/</span>div<span class="token operator">></span><span class="token punctuation">&#125;</span>
      <span class="token operator">&lt;</span>button onClick<span class="token operator">=</span><span class="token punctuation">&#123;</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token function">setVisible</span><span class="token punctuation">(</span><span class="token operator">!</span>isVisible<span class="token punctuation">)</span><span class="token punctuation">&#125;</span><span class="token operator">></span>Toggle<span class="token operator">&lt;</span><span class="token operator">/</span>button<span class="token operator">></span>
    <span class="token operator">&lt;</span><span class="token operator">/</span>div<span class="token operator">></span>
  <span class="token punctuation">)</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<p>It\u2019s a little bit different on Svelte. It looks something like this.</p>
<pre class="${"language-html"}">${`<code class="language-html">&#123;#if isVisible&#125;
  <span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>p</span><span class="token punctuation">></span></span>I'm Visible!<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>p</span><span class="token punctuation">></span></span>
&#123;/f&#125;
&lt;button on:clock=&#123;isVisible = !isVisible&#125;>Toggle<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>button</span><span class="token punctuation">></span></span>

<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>script</span><span class="token punctuation">></span></span><span class="token script"><span class="token language-javascript">
<span class="token keyword">let</span> isVisible <span class="token operator">=</span> <span class="token boolean">false</span>
</span></span><span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>script</span><span class="token punctuation">></span></span></code>`}</pre>
<p>I like them both so it doesn\u2019t really matter. There\u2019s also quite a few on <a href="${"https://svelte.dev/docs#if"}" rel="${"nofollow"}">Svelte\u2019s docs</a>.</p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>Well, I fell in love with this <em>language</em>. It\u2019s so simple yet it\u2019s so good. Sorry if the highlighting looks weird in this post because I couldn\u2019t make it work for Svelte or JSX syntax :p</p>
<p>I want to rebuild this blog using <a href="${"https://sapper.dev"}" rel="${"nofollow"}">Sapper</a> + <a href="${"https://mdsvex.com/"}" rel="${"nofollow"}">MDSveX</a> in the future. Don\u2019t get me wrong, <a href="${"https://www.gatsbyjs.com/"}" rel="${"nofollow"}">Gatsby</a> is great. I just want to try out something new. <i style="${"color: #eaeaea"}">Svelte\u2019s bundle size is also smaller compared to React, that\u2019s also why \u30C4</i></p>
${validate_component(Update, "Update").$$render($$result, {date: "01-11-2020"}, {}, {
      default: () => `<p>If you\u2019re reading this then you\u2019re currently at my \u2018new\u2019 website that I mentioned earlier =)</p>`
    })}
<p>Thanks for reading this! You should definitely try Svelte, you wouldn\u2019t regret it. Anyway, have a good day folks! =)</p>`
  })}`;
});
var index$j = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: My_experience_with_svelte,
  metadata: metadata$j
});
const metadata$i = {
  title: "How I Remember Japanese Weekdays",
  date: "2020-09-17T00:00:00.000Z",
  desc: "A post where I try to explain how I remember Japanese weekdays in my own weird way.",
  tags: ["japanese"]
};
const How_i_remember_heijitsu = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$i), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#heijitsu"}">Heijitsu</a></p>
<ul><li><a href="${"#sunday-%E6%97%A5%E6%9B%9C%E6%97%A5"}">Sunday (\u65E5\u66DC\u65E5)</a></li>
<li><a href="${"#monday-%E6%9C%88%E6%9B%9C%E6%97%A5"}">Monday (\u6708\u66DC\u65E5)</a></li>
<li><a href="${"#tuesday-%E7%81%AB%E6%9B%9C%E6%97%A5"}">Tuesday (\u706B\u66DC\u65E5)</a></li>
<li><a href="${"#wednesday-%E6%B0%B4%E6%9B%9C%E6%97%A5"}">Wednesday (\u6C34\u66DC\u65E5)</a></li>
<li><a href="${"#thursday-%E6%9C%A8%E6%9B%9C%E6%97%A5"}">Thursday (\u6728\u66DC\u65E5)</a></li>
<li><a href="${"#friday-%E9%87%91%E6%9B%9C%E6%97%A5"}">Friday (\u91D1\u66DC\u65E5)</a></li>
<li><a href="${"#saturday-%E5%9C%9F%E6%9B%9C%E6%97%A5"}">Saturday (\u571F\u66DC\u65E5)</a></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>This will be a short post. I just want to share how I memorise Japanese weekdays (\u5E73\u65E5) or heijitsu. I am no expert at japanese just to clarify. Maybe someone will find this useful so might as well share my way of memorising it.</p>
<h1 id="${"heijitsu"}"><a href="${"#heijitsu"}">Heijitsu</a></h1>
<p>Weekdays in japanese is called <strong>Heijitsu</strong> or <strong>\u5E73\u65E5</strong>. It has a <strong>youbi</strong> or <strong>\u66DC\u65E5</strong> prefix so in order to remember it, we only need to remember the first kanji. Easy enough right?</p>
<h2 id="${"sunday-\u65E5\u66DC\u65E5"}"><a href="${"#sunday-\u65E5\u66DC\u65E5"}">Sunday (\u65E5\u66DC\u65E5)</a></h2>
<p>The first one is Monday (nichiyoubi). In order to remember it, I simply take <strong>Sun</strong> in <strong>Sunday</strong> and refer it as <strong>Sun</strong>. The \u65E5 kanji means sun. Also, because I love Babymetal so much, I remember it as <strong>Su</strong>(nday). Why? you might ask. Well, Metal Galaxy live album is divided into 2 parts and the one that has <strong>Su</strong> in it has a <strong>Sun</strong> background. Maybe it\u2019s weird, but meh, I don\u2019t care. I mean, it works \u30C4</p>
<h2 id="${"monday-\u6708\u66DC\u65E5"}"><a href="${"#monday-\u6708\u66DC\u65E5"}">Monday (\u6708\u66DC\u65E5)</a></h2>
<p>Second one is Monday (getsuyoubi). Similar to the first one, I take <strong>Mon</strong> from <strong>Monday</strong> and refer it as <strong>Moon</strong>. The \u6708 kanji means <strong>Moon</strong> or <strong>Month</strong>. Also, same as before, I also remember this <strong>Moa</strong> from Babymetal. You might have guessed it. Yes, it has <strong>Moon</strong> background for the album cover. I mean, as long as it works, who cares \u30C4</p>
<h2 id="${"tuesday-\u706B\u66DC\u65E5"}"><a href="${"#tuesday-\u706B\u66DC\u65E5"}">Tuesday (\u706B\u66DC\u65E5)</a></h2>
<p>Third one is Tuesday (kayoubi). I remember this as it is. The kanji <strong>\u706B</strong> (hi) means <strong>Fire</strong>. For some reason I always think this sentence, \u201CTuesday is on fire\u201D. I don\u2019t know why, but it is what it is.</p>
<h2 id="${"wednesday-\u6C34\u66DC\u65E5"}"><a href="${"#wednesday-\u6C34\u66DC\u65E5"}">Wednesday (\u6C34\u66DC\u65E5)</a></h2>
<p>Fourth one is Wednesday (suiyoubi). I take <strong>Wed</strong> from <strong>Wednesday</strong> and refer it as <strong>Wet</strong> because the kanji <strong>\u6C34</strong> means <strong>Water</strong>. Simple enough, nothing weird with this one.</p>
<h2 id="${"thursday-\u6728\u66DC\u65E5"}"><a href="${"#thursday-\u6728\u66DC\u65E5"}">Thursday (\u6728\u66DC\u65E5)</a></h2>
<p>Fifth one is Thursday (mokuyoubi). The kanji <strong>\u6728</strong> means <strong>Tree</strong> and <strong>Thurs</strong> to me is similar enough with the word <strong>Tree</strong>. So that\u2019s how I memorise it.</p>
<h2 id="${"friday-\u91D1\u66DC\u65E5"}"><a href="${"#friday-\u91D1\u66DC\u65E5"}">Friday (\u91D1\u66DC\u65E5)</a></h2>
<p>Sixth one is Friday (kinyoubi). The kanji <strong>\u91D1</strong> (kane) means <strong>Money</strong> (\u304A\u91D1). I remember it as it is, no weird mnemonic or anything. Friday is \u91D1\u66DC\u65E5.</p>
<h2 id="${"saturday-\u571F\u66DC\u65E5"}"><a href="${"#saturday-\u571F\u66DC\u65E5"}">Saturday (\u571F\u66DC\u65E5)</a></h2>
<p>Last one is Saturday (doyoubi). I remember this as <strong>Saturn day</strong>. The kanji <strong>\u571F</strong> (do or tsuchi) means earth or land. Why do I memorise it as Saturn? You might ask. Well, if you look at the saturn symbol it has a similar shape with <strong>\u571F</strong>.</p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>That\u2019s about it for this post. Once again, I am no expert at Japanese but I just want to share how I memorise it and maybe someone will find this useful. Thanks for reading this! \u30C4</p>`
  })}`;
});
var index$i = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: How_i_remember_heijitsu,
  metadata: metadata$i
});
const metadata$h = {
  title: "How I made my Neovim statusline in Lua",
  date: "2020-11-29T00:00:00.000Z",
  desc: "A post where I explain how I made my custom statusline in Lua",
  tags: ["neovim"]
};
const Neovim_lua_statusline = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$h), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#prerequisite"}">Prerequisite</a></p></li>
<li><p><a href="${"#creating-the-statusline"}">Creating The Statusline</a></p>
<ul><li><a href="${"#initial-setup"}">Initial Setup</a></li>
<li><a href="${"#first-function"}">First Function</a></li>
<li><a href="${"#highlight-groups"}">Highlight groups</a></li>
<li><a href="${"#separators"}">Separators</a></li>
<li><a href="${"#mode-component"}">Mode Component</a></li>
<li><a href="${"#git-status-component"}">Git Status Component</a></li>
<li><a href="${"#filename-component"}">Filename Component</a></li>
<li><a href="${"#filetype-component"}">Filetype Component</a></li>
<li><a href="${"#line-component"}">Line Component</a></li>
<li><a href="${"#lsp-diagnostic"}">LSP Diagnostic</a></li></ul></li>
<li><p><a href="${"#different-statusline"}">Different Statusline</a></p>
<ul><li><a href="${"#active-statusline"}">Active Statusline</a></li>
<li><a href="${"#inactive-statusline"}">Inactive Statusline</a></li>
<li><a href="${"#inactive-statusline-1"}">Inactive Statusline</a></li>
<li><a href="${"#dynamic-statusline"}">Dynamic statusline</a></li></ul></li>
<li><p><a href="${"#result"}">Result</a></p></li>
<li><p><a href="${"#closing-note"}">Closing Note</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Hello there! So, I\u2019ve been playing around with the latest Neovim feature and
that is it can now use Lua for its config. Quite a while ago I wrote <a href="${"https://elianiva.me/post/vim-statusline"}" rel="${"nofollow"}">this post</a> where I explain how I made my statusline. Now, it\u2019s time to update that post using Lua :)</p>
<h1 id="${"prerequisite"}"><a href="${"#prerequisite"}">Prerequisite</a></h1>
<p>If you want to follow along, then these are the prerequisite.</p>
<ul><li>Neovim 0.5 (we need this version for lua support)</li>
<li><a href="${"https://github.com/lewis6991/gitsigns.nvim"}" rel="${"nofollow"}">gitsigns.nvim</a></li>
<li><a href="${"https://nerdfonts.com"}" rel="${"nofollow"}">nerdfont</a></li>
<li><a href="${"https://github.com/kyazdani42/nvim-web-devicons"}" rel="${"nofollow"}">nvim-web-devicons</a></li>
<li>Terminal that supports true colour (I use <a href="${"https://github.com/alacritty/alacritty"}" rel="${"nofollow"}">Alacritty</a>)</li>
<li>Patience</li>
<li>Googling skills in case something doesn\u2019t work correctly :p</li></ul>
<h1 id="${"creating-the-statusline"}"><a href="${"#creating-the-statusline"}">Creating The Statusline</a></h1>
<h2 id="${"initial-setup"}"><a href="${"#initial-setup"}">Initial Setup</a></h2>
<p>I wrote my statusline on <code>~/.config/nvim/lua/modules/_statusline.lua</code> along with my other lua modules so it will get picked up by Neovim and I can import it by using <code>require(&#39;modules._statusline&#39;)</code></p>
<h2 id="${"first-function"}"><a href="${"#first-function"}">First Function</a></h2>
<p>I create an empty table for my statusline and alias for <code>vim.fn</code> and <code>vim.api</code> to make it shorter. You can call it whatever you want, I call it <code>M</code> since this variable is just a \u2018temporary\u2019 table that I\u2019m going to use for a metatable. My current file now looks something like this.</p>
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token keyword">local</span> fn <span class="token operator">=</span> vim<span class="token punctuation">.</span>fn
<span class="token keyword">local</span> api <span class="token operator">=</span> vim<span class="token punctuation">.</span>api
<span class="token keyword">local</span> M <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token punctuation">&#125;</span></code>`}</pre>
<p>This first function is going to be a helper function that will return <code>true</code> of <code>false</code> based on the current window width. I use this to decide whether or not a component should display a full or a truncated version of it.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">M<span class="token punctuation">.</span>trunc_width <span class="token operator">=</span> <span class="token function">setmetatable</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  <span class="token comment">-- You can adjust these values to your liking, if you want</span>
  <span class="token comment">-- I promise this will all makes sense later :)</span>
  mode       <span class="token operator">=</span> <span class="token number">80</span><span class="token punctuation">,</span>
  git_status <span class="token operator">=</span> <span class="token number">90</span><span class="token punctuation">,</span>
  filename   <span class="token operator">=</span> <span class="token number">140</span><span class="token punctuation">,</span>
  line_col   <span class="token operator">=</span> <span class="token number">60</span><span class="token punctuation">,</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span>
  __index <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">return</span> <span class="token number">80</span> <span class="token comment">-- handle edge cases, if there's any</span>
  <span class="token keyword">end</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span>

M<span class="token punctuation">.</span>is_truncated <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>_<span class="token punctuation">,</span> width<span class="token punctuation">)</span>
  <span class="token keyword">local</span> current_width <span class="token operator">=</span> api<span class="token punctuation">.</span><span class="token function">nvim_win_get_width</span><span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span>
  <span class="token keyword">return</span> current_width <span class="token operator">&lt;</span> width
<span class="token keyword">end</span></code>`}</pre>
<p>This function calls <code>vim.api.nvim_win_get_width</code> for the current active window which will return its width. This function will return <code>true</code> if the current window width is less than the passed argument thus telling a component to truncate its content.</p>
${validate_component(Update, "Update").$$render($$result, {date: "26-02-2021"}, {}, {
      default: () => `<p>Thanks @Evgeni for the suggestion on creating a table for each section truncation width, it\u2019s easier to keep track of which component has how many width.</p>`
    })}
<h2 id="${"highlight-groups"}"><a href="${"#highlight-groups"}">Highlight groups</a></h2>
<p>I have this table that contains a string for the highlight group. I can then concatenate one of its items with a component and apply the highlight group for that component.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">M<span class="token punctuation">.</span>colors <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
  active        <span class="token operator">=</span> <span class="token string">'%#StatusLine#'</span><span class="token punctuation">,</span>
  inactive      <span class="token operator">=</span> <span class="token string">'%#StatuslineNC#'</span><span class="token punctuation">,</span>
  mode          <span class="token operator">=</span> <span class="token string">'%#Mode#'</span><span class="token punctuation">,</span>
  mode_alt      <span class="token operator">=</span> <span class="token string">'%#ModeAlt#'</span><span class="token punctuation">,</span>
  git           <span class="token operator">=</span> <span class="token string">'%#Git#'</span><span class="token punctuation">,</span>
  git_alt       <span class="token operator">=</span> <span class="token string">'%#GitAlt#'</span><span class="token punctuation">,</span>
  filetype      <span class="token operator">=</span> <span class="token string">'%#Filetype#'</span><span class="token punctuation">,</span>
  filetype_alt  <span class="token operator">=</span> <span class="token string">'%#FiletypeAlt#'</span><span class="token punctuation">,</span>
  line_col      <span class="token operator">=</span> <span class="token string">'%#LineCol#'</span><span class="token punctuation">,</span>
  line_col_alt  <span class="token operator">=</span> <span class="token string">'%#LineColAlt#'</span><span class="token punctuation">,</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<p>I made the highlight groups on my <code>~/.config/nvim/lua/modules/_appearances.lua</code> along with my other hl-group definitions, but here\u2019s the important snippet.</p>
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token keyword">local</span> set_hl <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>group<span class="token punctuation">,</span> options<span class="token punctuation">)</span>
  <span class="token keyword">local</span> bg <span class="token operator">=</span> options<span class="token punctuation">.</span>bg <span class="token operator">==</span> <span class="token keyword">nil</span> <span class="token keyword">and</span> <span class="token string">''</span> <span class="token keyword">or</span> <span class="token string">'guibg='</span> <span class="token operator">..</span> options<span class="token punctuation">.</span>bg
  <span class="token keyword">local</span> fg <span class="token operator">=</span> options<span class="token punctuation">.</span>fg <span class="token operator">==</span> <span class="token keyword">nil</span> <span class="token keyword">and</span> <span class="token string">''</span> <span class="token keyword">or</span> <span class="token string">'guifg='</span> <span class="token operator">..</span> options<span class="token punctuation">.</span>fg
  <span class="token keyword">local</span> gui <span class="token operator">=</span> options<span class="token punctuation">.</span>gui <span class="token operator">==</span> <span class="token keyword">nil</span> <span class="token keyword">and</span> <span class="token string">''</span> <span class="token keyword">or</span> <span class="token string">'gui='</span> <span class="token operator">..</span> options<span class="token punctuation">.</span>gui

  vim<span class="token punctuation">.</span><span class="token function">cmd</span><span class="token punctuation">(</span>string<span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span><span class="token string">'hi %s %s %s %s'</span><span class="token punctuation">,</span> group<span class="token punctuation">,</span> bg<span class="token punctuation">,</span> fg<span class="token punctuation">,</span> gui<span class="token punctuation">)</span><span class="token punctuation">)</span>
<span class="token keyword">end</span>

<span class="token comment">-- you can of course pick whatever colour you want, I picked these colours</span>
<span class="token comment">-- because I use Gruvbox and I like them</span>
<span class="token keyword">local</span> highlights <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
  <span class="token punctuation">&#123;</span><span class="token string">'StatusLine'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> fg <span class="token operator">=</span> <span class="token string">'#3C3836'</span><span class="token punctuation">,</span> bg <span class="token operator">=</span> <span class="token string">'#EBDBB2'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span><span class="token string">'StatusLineNC'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> fg <span class="token operator">=</span> <span class="token string">'#3C3836'</span><span class="token punctuation">,</span> bg <span class="token operator">=</span> <span class="token string">'#928374'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span><span class="token string">'Mode'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> bg <span class="token operator">=</span> <span class="token string">'#928374'</span><span class="token punctuation">,</span> fg <span class="token operator">=</span> <span class="token string">'#1D2021'</span><span class="token punctuation">,</span> gui<span class="token operator">=</span><span class="token string">"bold"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span><span class="token string">'LineCol'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> bg <span class="token operator">=</span> <span class="token string">'#928374'</span><span class="token punctuation">,</span> fg <span class="token operator">=</span> <span class="token string">'#1D2021'</span><span class="token punctuation">,</span> gui<span class="token operator">=</span><span class="token string">"bold"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span><span class="token string">'Git'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> bg <span class="token operator">=</span> <span class="token string">'#504945'</span><span class="token punctuation">,</span> fg <span class="token operator">=</span> <span class="token string">'#EBDBB2'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span><span class="token string">'Filetype'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> bg <span class="token operator">=</span> <span class="token string">'#504945'</span><span class="token punctuation">,</span> fg <span class="token operator">=</span> <span class="token string">'#EBDBB2'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span><span class="token string">'Filename'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> bg <span class="token operator">=</span> <span class="token string">'#504945'</span><span class="token punctuation">,</span> fg <span class="token operator">=</span> <span class="token string">'#EBDBB2'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span><span class="token string">'ModeAlt'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> bg <span class="token operator">=</span> <span class="token string">'#504945'</span><span class="token punctuation">,</span> fg <span class="token operator">=</span> <span class="token string">'#928374'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span><span class="token string">'GitAlt'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> bg <span class="token operator">=</span> <span class="token string">'#3C3836'</span><span class="token punctuation">,</span> fg <span class="token operator">=</span> <span class="token string">'#504945'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span><span class="token string">'LineColAlt'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> bg <span class="token operator">=</span> <span class="token string">'#504945'</span><span class="token punctuation">,</span> fg <span class="token operator">=</span> <span class="token string">'#928374'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span><span class="token string">'FiletypeAlt'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> bg <span class="token operator">=</span> <span class="token string">'#3C3836'</span><span class="token punctuation">,</span> fg <span class="token operator">=</span> <span class="token string">'#504945'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
<span class="token punctuation">&#125;</span>

<span class="token keyword">for</span> _<span class="token punctuation">,</span> highlight <span class="token keyword">in</span> <span class="token function">ipairs</span><span class="token punctuation">(</span>highlights<span class="token punctuation">)</span> <span class="token keyword">do</span>
  <span class="token function">set_hl</span><span class="token punctuation">(</span>highlight<span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">,</span> highlight<span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
<span class="token keyword">end</span></code>`}</pre>
<p>You can define this using VimL but I prefer doing it in Lua because 99% of my config is in Lua and I don\u2019t really like using VimL.</p>
<h2 id="${"separators"}"><a href="${"#separators"}">Separators</a></h2>
<p>Since I use <a href="${"https://nerdfonts.com"}" rel="${"nofollow"}">nerdfont</a>, I have fancy symbols that I can use. I use these symbols as a separator.</p>
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token comment">-- I keep this here just in case I changed my mind so I don't have to find these icons again when I need them</span>
<span class="token comment">-- you can of course just store one of them if you want</span>
M<span class="token punctuation">.</span>separators <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
  arrow <span class="token operator">=</span> <span class="token punctuation">&#123;</span> <span class="token string">'\uE0B0'</span><span class="token punctuation">,</span> <span class="token string">'\uE0B2'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  rounded <span class="token operator">=</span> <span class="token punctuation">&#123;</span> <span class="token string">'\uE0B4'</span><span class="token punctuation">,</span> <span class="token string">'\uE0B6'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  blank <span class="token operator">=</span> <span class="token punctuation">&#123;</span> <span class="token string">''</span><span class="token punctuation">,</span> <span class="token string">''</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
<span class="token punctuation">&#125;</span>

<span class="token keyword">local</span> active_sep <span class="token operator">=</span> <span class="token string">'blank'</span></code>`}</pre>
<p>I use the arrow separator, either one is fine. It will look empty here because my website doesn\u2019t use Nerdfont.</p>
${validate_component(Update, "Update").$$render($$result, {date: "30-01-2021"}, {}, {
      default: () => `<p>I now use the blank separator.</p>`
    })}
<h2 id="${"mode-component"}"><a href="${"#mode-component"}">Mode Component</a></h2>
<p>The first component for my statusline is the one that shows the current mode.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">M<span class="token punctuation">.</span>modes <span class="token operator">=</span> <span class="token function">setmetatable</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  <span class="token punctuation">[</span><span class="token string">'n'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Normal'</span><span class="token punctuation">,</span> <span class="token string">'N'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'no'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'N\xB7Pending'</span><span class="token punctuation">,</span> <span class="token string">'N\xB7P'</span><span class="token punctuation">&#125;</span> <span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'v'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Visual'</span><span class="token punctuation">,</span> <span class="token string">'V'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'V'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'V\xB7Line'</span><span class="token punctuation">,</span> <span class="token string">'V\xB7L'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">''</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'V\xB7Block'</span><span class="token punctuation">,</span> <span class="token string">'V\xB7B'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'s'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Select'</span><span class="token punctuation">,</span> <span class="token string">'S'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'S'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'S\xB7Line'</span><span class="token punctuation">,</span> <span class="token string">'S\xB7L'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">''</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'S\xB7Block'</span><span class="token punctuation">,</span> <span class="token string">'S\xB7B'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'i'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Insert'</span><span class="token punctuation">,</span> <span class="token string">'I'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'ic'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Insert'</span><span class="token punctuation">,</span> <span class="token string">'I'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'R'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Replace'</span><span class="token punctuation">,</span> <span class="token string">'R'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'Rv'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'V\xB7Replace'</span><span class="token punctuation">,</span> <span class="token string">'V\xB7R'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'c'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Command'</span><span class="token punctuation">,</span> <span class="token string">'C'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'cv'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Vim\xB7Ex '</span><span class="token punctuation">,</span> <span class="token string">'V\xB7E'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'ce'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Ex '</span><span class="token punctuation">,</span> <span class="token string">'E'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'r'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Prompt '</span><span class="token punctuation">,</span> <span class="token string">'P'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'rm'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'More '</span><span class="token punctuation">,</span> <span class="token string">'M'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'r?'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Confirm '</span><span class="token punctuation">,</span> <span class="token string">'C'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'!'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Shell '</span><span class="token punctuation">,</span> <span class="token string">'S'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'t'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Terminal '</span><span class="token punctuation">,</span> <span class="token string">'T'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span>
  __index <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
      <span class="token keyword">return</span> <span class="token punctuation">&#123;</span><span class="token string">'Unknown'</span><span class="token punctuation">,</span> <span class="token string">'U'</span><span class="token punctuation">&#125;</span> <span class="token comment">-- handle edge cases</span>
  <span class="token keyword">end</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span>

M<span class="token punctuation">.</span>get_current_mode <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> current_mode <span class="token operator">=</span> api<span class="token punctuation">.</span><span class="token function">nvim_get_mode</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span>mode

  <span class="token keyword">if</span> self<span class="token punctuation">:</span><span class="token function">is_truncated</span><span class="token punctuation">(</span>self<span class="token punctuation">.</span>trunc_width<span class="token punctuation">.</span>mode<span class="token punctuation">)</span> <span class="token keyword">then</span>
    <span class="token keyword">return</span> string<span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span><span class="token string">' %s '</span><span class="token punctuation">,</span> modes<span class="token punctuation">[</span>current_mode<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">:</span><span class="token function">upper</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">end</span>

  <span class="token keyword">return</span> string<span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span><span class="token string">' %s '</span><span class="token punctuation">,</span> modes<span class="token punctuation">[</span>current_mode<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">:</span><span class="token function">upper</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token keyword">end</span></code>`}</pre>
<p>You probably notice that <code>V\xB7Block</code> and <code>S\xB7Block</code> look empty but they\u2019re not. It\u2019s a special character of <code>C-V</code> and <code>C-S</code>. If you go to (Neo)vim and press <code>C-V</code> in insert mode twice, it will insert something like <code>^V</code>. It\u2019s not the same as <code>^V</code>, I thought they\u2019re the same but they\u2019re not.</p>
<p>What that code does is creates a key-value pair table with string as a key and a table as its value. I use the table\u2019s key to match what <code>vim.api.nvim_get_mode().mode</code> returns.</p>
<p>Depending on the current window width, it will return different output. For example, if my current window isn\u2019t wide enough, it will return <code>N</code> instead of <code>Normal</code>. If you want to change when it will start to change then adjust the argument that is passed to the <code>is_truncated</code> function. Remember that <code>trunc_width</code> table from earlier? We use <code>mode</code> value here so that my Mode component will get truncated if my window width is less than <code>80</code>.</p>
${validate_component(Update, "Update").$$render($$result, {date: "26-02-2021"}, {}, {
      default: () => `<p>Thanks to @Evgeni for pointing me out, I moved the <code>mode</code> table outside of the function because previously I was putting it inside a function which will get created every time the function is executed.</p>
<br>
Also, since I moved from \`vim.fn.mode\` to \`vim.api.nvim_get_mode().mode\`, there are *a lot* of missing keys on my \`mode\` table; Hence a metatable is used so it will give me an \`Unknown\` mode instead of throwing an error when there&#39;s no matching key on the table. (Also thanks @Evgeni :)
`
    })}
<h2 id="${"git-status-component"}"><a href="${"#git-status-component"}">Git Status Component</a></h2>
<p>I use <a href="${"https://github.com/lewis6991/gitsigns.nvim"}" rel="${"nofollow"}">gitsigns.nvim</a> to show the git hunk status on <code>signcolumn</code>. It provides some details like how many lines have been changed, added, or removed. It also provides the branch name. So, I\u2019d like to integrate this functionality into my statusline.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">M<span class="token punctuation">.</span>get_git_status <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token comment">-- use fallback because it doesn't set this variable on the initial &#96;BufEnter&#96;</span>
  <span class="token keyword">local</span> signs <span class="token operator">=</span> vim<span class="token punctuation">.</span>b<span class="token punctuation">.</span>gitsigns_status_dict <span class="token keyword">or</span> <span class="token punctuation">&#123;</span>head <span class="token operator">=</span> <span class="token string">''</span><span class="token punctuation">,</span> added <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">,</span> changed <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">,</span> removed <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">&#125;</span>
  <span class="token keyword">local</span> is_head_empty <span class="token operator">=</span> signs<span class="token punctuation">.</span>head <span class="token operator">~=</span> <span class="token string">''</span>

  <span class="token keyword">if</span> self<span class="token punctuation">:</span><span class="token function">is_truncated</span><span class="token punctuation">(</span>self<span class="token punctuation">.</span>trunc_width<span class="token punctuation">.</span>git_status<span class="token punctuation">)</span> <span class="token keyword">then</span>
    <span class="token keyword">return</span> is_head_empty <span class="token keyword">and</span> string<span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span><span class="token string">' \uE725 %s '</span><span class="token punctuation">,</span> signs<span class="token punctuation">.</span>head <span class="token keyword">or</span> <span class="token string">''</span><span class="token punctuation">)</span> <span class="token keyword">or</span> <span class="token string">''</span>
  <span class="token keyword">end</span>

  <span class="token keyword">return</span> is_head_empty
    <span class="token keyword">and</span> string<span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span>
      <span class="token string">' +%s ~%s -%s | \uE725 %s '</span><span class="token punctuation">,</span>
      signs<span class="token punctuation">.</span>added<span class="token punctuation">,</span> signs<span class="token punctuation">.</span>changed<span class="token punctuation">,</span> signs<span class="token punctuation">.</span>removed<span class="token punctuation">,</span> signs<span class="token punctuation">.</span>head
    <span class="token punctuation">)</span>
    <span class="token keyword">or</span> <span class="token string">''</span>
<span class="token keyword">end</span></code>`}</pre>
<p>What that code does is it gets the git hunk status from <a href="${"https://github.com/lewis6991/gitsigns.nvim"}" rel="${"nofollow"}">gitsigns.nvim</a> and store it on a variable. I use fallback here because it doesn\u2019t get set on initial <code>BufEnter</code> so I\u2019ll get a <code>nil</code> error if I don\u2019t do that.</p>
<p>The next bit is it checks if the branch name exists or not (basically checking if we\u2019re in a git repo or not), if it exists then it will return a formatted status that will look something like this.</p>
<p><img src="${"/assets/post/neovim-lua-statusline/gitstatus.png"}" alt="${"gitstatus"}"></p>
<p>If the current window isn\u2019t wide enough, it will remove the git hunk summary and just display the branch name.</p>
<p>If you get confused with <code>and</code> and <code>or</code>, it\u2019s similar to ternary operator. <code>cond and true or false</code> is the same as <code>cond ? true : false</code> because <code>and</code> and <code>or</code> is a <a href="${"https://en.m.wikipedia.org/wiki/Short-circuit_evaluation"}" rel="${"nofollow"}">short circuit</a> in Lua.</p>
<h2 id="${"filename-component"}"><a href="${"#filename-component"}">Filename Component</a></h2>
<p>My next component is a filename component. I\u2019d like to be able to see the filename without having to press <code>&lt;C-G&gt;</code> every time I want to check the filename and its full path.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">M<span class="token punctuation">.</span>get_filename <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token keyword">if</span> self<span class="token punctuation">:</span><span class="token function">is_truncated</span><span class="token punctuation">(</span>self<span class="token punctuation">.</span>trunc_width<span class="token punctuation">.</span>filename<span class="token punctuation">)</span> <span class="token keyword">then</span> <span class="token keyword">return</span> <span class="token string">" %&lt;%f "</span> <span class="token keyword">end</span>
  <span class="token keyword">return</span> <span class="token string">" %&lt;%F "</span>
<span class="token keyword">end</span></code>`}</pre>
<p>Depending on the current window width, it will display an absolute path, relative path to our <code>$CWD</code>, or just the current filename.</p>
<p>The <code>%&lt;</code> is to tell the statusline to truncate this component if it\u2019s too long or doesn\u2019t have enough space instead of truncating the first component.</p>
<h2 id="${"filetype-component"}"><a href="${"#filetype-component"}">Filetype Component</a></h2>
<p>I want to see the filetype of the current buffer, so I\u2019d like to include this on my statusline as well.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">M<span class="token punctuation">.</span>get_filetype <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> file_name<span class="token punctuation">,</span> file_ext <span class="token operator">=</span> fn<span class="token punctuation">.</span><span class="token function">expand</span><span class="token punctuation">(</span><span class="token string">"%:t"</span><span class="token punctuation">)</span><span class="token punctuation">,</span> fn<span class="token punctuation">.</span><span class="token function">expand</span><span class="token punctuation">(</span><span class="token string">"%:e"</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> icon <span class="token operator">=</span> require<span class="token string">'nvim-web-devicons'</span><span class="token punctuation">.</span><span class="token function">get_icon</span><span class="token punctuation">(</span>file_name<span class="token punctuation">,</span> file_ext<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> default <span class="token operator">=</span> <span class="token keyword">true</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> filetype <span class="token operator">=</span> vim<span class="token punctuation">.</span>bo<span class="token punctuation">.</span>filetype

  <span class="token keyword">if</span> filetype <span class="token operator">==</span> <span class="token string">''</span> <span class="token keyword">then</span> <span class="token keyword">return</span> <span class="token string">''</span> <span class="token keyword">end</span>
  <span class="token keyword">return</span> string<span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span><span class="token string">' %s %s '</span><span class="token punctuation">,</span> icon<span class="token punctuation">,</span> filetype<span class="token punctuation">)</span><span class="token punctuation">:</span><span class="token function">lower</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token keyword">end</span></code>`}</pre>
<p>It gets a value from <code>vim.bo.filetype</code> which will return a filetype and I transform it to lowercase using the <code>lower()</code> method. If the current buffer doesn\u2019t have a filetype, it will return nothing.</p>
<p>I also use <a href="${"https://github.com/kyazdani42/nvim-web-devicons"}" rel="${"nofollow"}">nvim-web-devicons</a> to get the fancy icon for the current filetype.</p>
<h2 id="${"line-component"}"><a href="${"#line-component"}">Line Component</a></h2>
<p>Even though I have <code>number</code> and <code>relativenumber</code> turned on, I\u2019d like to have this on my statusline as well.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">M<span class="token punctuation">.</span>get_line_col <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token keyword">if</span> self<span class="token punctuation">:</span><span class="token function">is_truncated</span><span class="token punctuation">(</span>self<span class="token punctuation">.</span>trunc_width<span class="token punctuation">.</span>line_col<span class="token punctuation">)</span> <span class="token keyword">then</span> <span class="token keyword">return</span> <span class="token string">' %l:%c '</span> <span class="token keyword">end</span>
  <span class="token keyword">return</span> <span class="token string">' Ln %l, Col %c '</span>
<span class="token keyword">end</span></code>`}</pre>
<p>It will display something like <code>Ln 12, Col 2</code> which means the cursor is at Line 12 and Column 2. This component also depends on the current window width, if it\u2019s not wide enough then it will display something like <code>12:2</code>.</p>
<h2 id="${"lsp-diagnostic"}"><a href="${"#lsp-diagnostic"}">LSP Diagnostic</a></h2>
<p>I use the built-in LSP client and it has the diagnostic capability. I can get the diagnostic summary using <code>vim.lsp.diagnostic.get_count(bufnr, severity)</code>.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">M<span class="token punctuation">.</span>get_lsp_diagnostic <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token keyword">local</span> result <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token punctuation">&#125;</span>
  <span class="token keyword">local</span> levels <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
    errors <span class="token operator">=</span> <span class="token string">'Error'</span><span class="token punctuation">,</span>
    warnings <span class="token operator">=</span> <span class="token string">'Warning'</span><span class="token punctuation">,</span>
    info <span class="token operator">=</span> <span class="token string">'Information'</span><span class="token punctuation">,</span>
    hints <span class="token operator">=</span> <span class="token string">'Hint'</span>
  <span class="token punctuation">&#125;</span>

  <span class="token keyword">for</span> k<span class="token punctuation">,</span> level <span class="token keyword">in</span> <span class="token function">pairs</span><span class="token punctuation">(</span>levels<span class="token punctuation">)</span> <span class="token keyword">do</span>
    result<span class="token punctuation">[</span>k<span class="token punctuation">]</span> <span class="token operator">=</span> vim<span class="token punctuation">.</span>lsp<span class="token punctuation">.</span>diagnostic<span class="token punctuation">.</span><span class="token function">get_count</span><span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">,</span> level<span class="token punctuation">)</span>
  <span class="token keyword">end</span>

  <span class="token keyword">if</span> self<span class="token punctuation">:</span><span class="token function">is_truncated</span><span class="token punctuation">(</span>self<span class="token punctuation">.</span>trunc_width<span class="token punctuation">.</span>diagnostic<span class="token punctuation">)</span> <span class="token keyword">then</span>
    <span class="token keyword">return</span> <span class="token string">''</span>
  <span class="token keyword">else</span>
    <span class="token keyword">return</span> string<span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span>
      <span class="token string">"| \uF00D:%s \uF12A:%s \uF129:%s \uF834:%s "</span><span class="token punctuation">,</span>
      result<span class="token punctuation">[</span><span class="token string">'errors'</span><span class="token punctuation">]</span> <span class="token keyword">or</span> <span class="token number">0</span><span class="token punctuation">,</span> result<span class="token punctuation">[</span><span class="token string">'warnings'</span><span class="token punctuation">]</span> <span class="token keyword">or</span> <span class="token number">0</span><span class="token punctuation">,</span>
      result<span class="token punctuation">[</span><span class="token string">'info'</span><span class="token punctuation">]</span> <span class="token keyword">or</span> <span class="token number">0</span><span class="token punctuation">,</span> result<span class="token punctuation">[</span><span class="token string">'hints'</span><span class="token punctuation">]</span> <span class="token keyword">or</span> <span class="token number">0</span>
    <span class="token punctuation">)</span>
  <span class="token keyword">end</span>
<span class="token keyword">end</span></code>`}</pre>
<p>I got this section from <a href="${"https://github.com/nvim-lua/lsp-status.nvim"}" rel="${"nofollow"}">this repo</a> with some modification. It will be hidden when the current window width is less than <code>120</code>. I don\u2019t personally use this because I use a small monitor.</p>
${validate_component(Update, "Update").$$render($$result, {date: "30-01-2021"}, {}, {
      default: () => `<p>I display this at my <code>tabline</code> instead, I took it from <a href="${"https://github.com/cooper-anderson/dotfiles/blob/2ddc280f3da7b6fc1e77be79393f92652326dd69/nvim/lua/ampersand/plugins/bufferline.lua"}" rel="${"nofollow"}">cooper-anderson\u2019s</a> config and heavily modify it. <a href="${"https://github.com/elianiva/dotfiles/blob/dcac8bce32b521e94da8c165426f948ee7507f13/nvim/.config/nvim/lua/plugin/_bufferline.lua"}" rel="${"nofollow"}">Here\u2019s</a> the relevant file for that. It will show the available diagnostics at the top right corner of the screen and update them in real-time.</p>`
    })}
<h1 id="${"different-statusline"}"><a href="${"#different-statusline"}">Different Statusline</a></h1>
<p>I want to have 3 different statusline for different states which are <em>Active</em> for the currently active window, <em>Inactive</em> for the inactive window, and <em>Explorer</em> for the file explorer window.</p>
<h2 id="${"active-statusline"}"><a href="${"#active-statusline"}">Active Statusline</a></h2>
<p>I combine all of my components as follows.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">M<span class="token punctuation">.</span>set_active <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token keyword">local</span> colors <span class="token operator">=</span> self<span class="token punctuation">.</span>colors

  <span class="token keyword">local</span> mode <span class="token operator">=</span> colors<span class="token punctuation">.</span>mode <span class="token operator">..</span> self<span class="token punctuation">:</span><span class="token function">get_current_mode</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> mode_alt <span class="token operator">=</span> colors<span class="token punctuation">.</span>mode_alt <span class="token operator">..</span> self<span class="token punctuation">.</span>separators<span class="token punctuation">[</span>active_sep<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span>
  <span class="token keyword">local</span> git <span class="token operator">=</span> colors<span class="token punctuation">.</span>git <span class="token operator">..</span> self<span class="token punctuation">:</span><span class="token function">get_git_status</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> git_alt <span class="token operator">=</span> colors<span class="token punctuation">.</span>git_alt <span class="token operator">..</span> self<span class="token punctuation">.</span>separators<span class="token punctuation">[</span>active_sep<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span>
  <span class="token keyword">local</span> filename <span class="token operator">=</span> colors<span class="token punctuation">.</span>inactive <span class="token operator">..</span> self<span class="token punctuation">:</span><span class="token function">get_filename</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> filetype_alt <span class="token operator">=</span> colors<span class="token punctuation">.</span>filetype_alt <span class="token operator">..</span> self<span class="token punctuation">.</span>separators<span class="token punctuation">[</span>active_sep<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span>
  <span class="token keyword">local</span> filetype <span class="token operator">=</span> colors<span class="token punctuation">.</span>filetype <span class="token operator">..</span> self<span class="token punctuation">:</span><span class="token function">get_filetype</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> line_col <span class="token operator">=</span> colors<span class="token punctuation">.</span>line_col <span class="token operator">..</span> self<span class="token punctuation">:</span><span class="token function">get_line_col</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> line_col_alt <span class="token operator">=</span> colors<span class="token punctuation">.</span>line_col_alt <span class="token operator">..</span> self<span class="token punctuation">.</span>separators<span class="token punctuation">[</span>active_sep<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span>

  <span class="token keyword">return</span> table<span class="token punctuation">.</span><span class="token function">concat</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
    colors<span class="token punctuation">.</span>active<span class="token punctuation">,</span> mode<span class="token punctuation">,</span> mode_alt<span class="token punctuation">,</span> git<span class="token punctuation">,</span> git_alt<span class="token punctuation">,</span>
    <span class="token string">"%="</span><span class="token punctuation">,</span> filename<span class="token punctuation">,</span> <span class="token string">"%="</span><span class="token punctuation">,</span>
    filetype_alt<span class="token punctuation">,</span> filetype<span class="token punctuation">,</span> line_col_alt<span class="token punctuation">,</span> line_col
  <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
<span class="token keyword">end</span></code>`}</pre>
<p>The <code>%=</code> acts like a separator. It will place all of the next components to the right, since I want my filename indicator to be in the middle, I put 2 of them around my filename indicator. It will basically center it. You can play around with it and find which one you like.</p>
<h2 id="${"inactive-statusline"}"><a href="${"#inactive-statusline"}">Inactive Statusline</a></h2>
<p>I want this inactive statusline to be as boring as possible so it won\u2019t distract me.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">M<span class="token punctuation">.</span>set_inactive <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token keyword">return</span> self<span class="token punctuation">.</span>colors<span class="token punctuation">.</span>inactive <span class="token operator">..</span> <span class="token string">'%= %F %='</span>
<span class="token keyword">end</span></code>`}</pre>
<p>It\u2019s just displaying the full path of the file with a dimmed colour, super simple.</p>
<h2 id="${"inactive-statusline-1"}"><a href="${"#inactive-statusline-1"}">Inactive Statusline</a></h2>
<p>I have [nvim-tree.lua][nvim-tree-lua] as my file explorer and I want to have different statusline for it, so I made this simple statusline.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">M<span class="token punctuation">.</span>set_explorer <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token keyword">local</span> title <span class="token operator">=</span> self<span class="token punctuation">.</span>colors<span class="token punctuation">.</span>mode <span class="token operator">..</span> <span class="token string">' \uF414  '</span>
  <span class="token keyword">local</span> title_alt <span class="token operator">=</span> self<span class="token punctuation">.</span>colors<span class="token punctuation">.</span>mode_alt <span class="token operator">..</span> self<span class="token punctuation">.</span>separators<span class="token punctuation">[</span>active_sep<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span>

  <span class="token keyword">return</span> table<span class="token punctuation">.</span><span class="token function">concat</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> self<span class="token punctuation">.</span>colors<span class="token punctuation">.</span>active<span class="token punctuation">,</span> title<span class="token punctuation">,</span> title_alt <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
<span class="token keyword">end</span></code>`}</pre>
<h2 id="${"dynamic-statusline"}"><a href="${"#dynamic-statusline"}">Dynamic statusline</a></h2>
<p>I use metatable to set the statusline from autocmd because the <code>:</code> symbol conflicts with VimL syntax. I\u2019m probably going to change this once Neovim has the ability to define autocmd using Lua natively.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">Statusline <span class="token operator">=</span> <span class="token function">setmetatable</span><span class="token punctuation">(</span>M<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span>
  __call <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>statusline<span class="token punctuation">,</span> mode<span class="token punctuation">)</span>
    <span class="token keyword">if</span> mode <span class="token operator">==</span> <span class="token string">"active"</span> <span class="token keyword">then</span> <span class="token keyword">return</span> statusline<span class="token punctuation">:</span><span class="token function">set_active</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">end</span>
    <span class="token keyword">if</span> mode <span class="token operator">==</span> <span class="token string">"inactive"</span> <span class="token keyword">then</span> <span class="token keyword">return</span> statusline<span class="token punctuation">:</span><span class="token function">set_inactive</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">end</span>
    <span class="token keyword">if</span> mode <span class="token operator">==</span> <span class="token string">"explorer"</span> <span class="token keyword">then</span> <span class="token keyword">return</span> statusline<span class="token punctuation">:</span><span class="token function">set_explorer</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">end</span>
  <span class="token keyword">end</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span>

api<span class="token punctuation">.</span><span class="token function">nvim_exec</span><span class="token punctuation">(</span><span class="token string">[[
  augroup Statusline
  au!
  au WinEnter,BufEnter * setlocal statusline=%!v:lua.Statusline('active')
  au WinLeave,BufLeave * setlocal statusline=%!v:lua.Statusline('inactive')
  au WinEnter,BufEnter,FileType NvimTree setlocal statusline=%!v:lua.Statusline('explorer')
  augroup END
]]</span><span class="token punctuation">,</span> <span class="token keyword">false</span><span class="token punctuation">)</span></code>`}</pre>
<p>This auto command runs every time we enter or leave a buffer and set the corresponding statusline. It needs to be done using VimL because it doesn\u2019t have lua version <em>yet</em>. It\u2019s currently a <a href="${"https://github.com/neovim/neovim/pull/12378"}" rel="${"nofollow"}">work in progress</a> at the time of writing this post.</p>
<h1 id="${"result"}"><a href="${"#result"}">Result</a></h1>
<p>Here\u2019s how my entire file looks and <a href="${"https://github.com/elianiva/dotfiles/blob/934fe3dd54aab909c396bf0fafae285946fa7fb5/nvim/.config/nvim/lua/modules/_appearances.lua"}" rel="${"nofollow"}">here\u2019s</a> the corresponding highlight-groups definition.</p>
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token keyword">local</span> fn <span class="token operator">=</span> vim<span class="token punctuation">.</span>fn
<span class="token keyword">local</span> api <span class="token operator">=</span> vim<span class="token punctuation">.</span>api

<span class="token keyword">local</span> M <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token punctuation">&#125;</span>

<span class="token comment">-- possible values are 'arrow' | 'rounded' | 'blank'</span>
<span class="token keyword">local</span> active_sep <span class="token operator">=</span> <span class="token string">'blank'</span>

<span class="token comment">-- change them if you want to different separator</span>
M<span class="token punctuation">.</span>separators <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
  arrow <span class="token operator">=</span> <span class="token punctuation">&#123;</span> <span class="token string">'\uE0B0'</span><span class="token punctuation">,</span> <span class="token string">'\uE0B2'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  rounded <span class="token operator">=</span> <span class="token punctuation">&#123;</span> <span class="token string">'\uE0B4'</span><span class="token punctuation">,</span> <span class="token string">'\uE0B6'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  blank <span class="token operator">=</span> <span class="token punctuation">&#123;</span> <span class="token string">''</span><span class="token punctuation">,</span> <span class="token string">''</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">-- highlight groups</span>
M<span class="token punctuation">.</span>colors <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
  active        <span class="token operator">=</span> <span class="token string">'%#StatusLine#'</span><span class="token punctuation">,</span>
  inactive      <span class="token operator">=</span> <span class="token string">'%#StatuslineNC#'</span><span class="token punctuation">,</span>
  mode          <span class="token operator">=</span> <span class="token string">'%#Mode#'</span><span class="token punctuation">,</span>
  mode_alt      <span class="token operator">=</span> <span class="token string">'%#ModeAlt#'</span><span class="token punctuation">,</span>
  git           <span class="token operator">=</span> <span class="token string">'%#Git#'</span><span class="token punctuation">,</span>
  git_alt       <span class="token operator">=</span> <span class="token string">'%#GitAlt#'</span><span class="token punctuation">,</span>
  filetype      <span class="token operator">=</span> <span class="token string">'%#Filetype#'</span><span class="token punctuation">,</span>
  filetype_alt  <span class="token operator">=</span> <span class="token string">'%#FiletypeAlt#'</span><span class="token punctuation">,</span>
  line_col      <span class="token operator">=</span> <span class="token string">'%#LineCol#'</span><span class="token punctuation">,</span>
  line_col_alt  <span class="token operator">=</span> <span class="token string">'%#LineColAlt#'</span><span class="token punctuation">,</span>
<span class="token punctuation">&#125;</span>

M<span class="token punctuation">.</span>trunc_width <span class="token operator">=</span> <span class="token function">setmetatable</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  mode       <span class="token operator">=</span> <span class="token number">80</span><span class="token punctuation">,</span>
  git_status <span class="token operator">=</span> <span class="token number">90</span><span class="token punctuation">,</span>
  filename   <span class="token operator">=</span> <span class="token number">140</span><span class="token punctuation">,</span>
  line_col   <span class="token operator">=</span> <span class="token number">60</span><span class="token punctuation">,</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span>
  __index <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
      <span class="token keyword">return</span> <span class="token number">80</span>
  <span class="token keyword">end</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span>

M<span class="token punctuation">.</span>is_truncated <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>_<span class="token punctuation">,</span> width<span class="token punctuation">)</span>
  <span class="token keyword">local</span> current_width <span class="token operator">=</span> api<span class="token punctuation">.</span><span class="token function">nvim_win_get_width</span><span class="token punctuation">(</span><span class="token number">0</span><span class="token punctuation">)</span>
  <span class="token keyword">return</span> current_width <span class="token operator">&lt;</span> width
<span class="token keyword">end</span>

M<span class="token punctuation">.</span>modes <span class="token operator">=</span> <span class="token function">setmetatable</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  <span class="token punctuation">[</span><span class="token string">'n'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Normal'</span><span class="token punctuation">,</span> <span class="token string">'N'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'no'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'N\xB7Pending'</span><span class="token punctuation">,</span> <span class="token string">'N\xB7P'</span><span class="token punctuation">&#125;</span> <span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'v'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Visual'</span><span class="token punctuation">,</span> <span class="token string">'V'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'V'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'V\xB7Line'</span><span class="token punctuation">,</span> <span class="token string">'V\xB7L'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">''</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'V\xB7Block'</span><span class="token punctuation">,</span> <span class="token string">'V\xB7B'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span> <span class="token comment">-- this is not ^V, but it's , they're different</span>
  <span class="token punctuation">[</span><span class="token string">'s'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Select'</span><span class="token punctuation">,</span> <span class="token string">'S'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'S'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'S\xB7Line'</span><span class="token punctuation">,</span> <span class="token string">'S\xB7L'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">''</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'S\xB7Block'</span><span class="token punctuation">,</span> <span class="token string">'S\xB7B'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span> <span class="token comment">-- same with this one, it's not ^S but it's </span>
  <span class="token punctuation">[</span><span class="token string">'i'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Insert'</span><span class="token punctuation">,</span> <span class="token string">'I'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'ic'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Insert'</span><span class="token punctuation">,</span> <span class="token string">'I'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'R'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Replace'</span><span class="token punctuation">,</span> <span class="token string">'R'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'Rv'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'V\xB7Replace'</span><span class="token punctuation">,</span> <span class="token string">'V\xB7R'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'c'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Command'</span><span class="token punctuation">,</span> <span class="token string">'C'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'cv'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Vim\xB7Ex '</span><span class="token punctuation">,</span> <span class="token string">'V\xB7E'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'ce'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Ex '</span><span class="token punctuation">,</span> <span class="token string">'E'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'r'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Prompt '</span><span class="token punctuation">,</span> <span class="token string">'P'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'rm'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'More '</span><span class="token punctuation">,</span> <span class="token string">'M'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'r?'</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Confirm '</span><span class="token punctuation">,</span> <span class="token string">'C'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'!'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Shell '</span><span class="token punctuation">,</span> <span class="token string">'S'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
  <span class="token punctuation">[</span><span class="token string">'t'</span><span class="token punctuation">]</span>  <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">'Terminal '</span><span class="token punctuation">,</span> <span class="token string">'T'</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span>
  __index <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
      <span class="token keyword">return</span> <span class="token punctuation">&#123;</span><span class="token string">'Unknown'</span><span class="token punctuation">,</span> <span class="token string">'U'</span><span class="token punctuation">&#125;</span> <span class="token comment">-- handle edge cases</span>
  <span class="token keyword">end</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span>

M<span class="token punctuation">.</span>get_current_mode <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token keyword">local</span> current_mode <span class="token operator">=</span> api<span class="token punctuation">.</span><span class="token function">nvim_get_mode</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span>mode

  <span class="token keyword">if</span> self<span class="token punctuation">:</span><span class="token function">is_truncated</span><span class="token punctuation">(</span>self<span class="token punctuation">.</span>trunc_width<span class="token punctuation">.</span>mode<span class="token punctuation">)</span> <span class="token keyword">then</span>
    <span class="token keyword">return</span> string<span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span><span class="token string">' %s '</span><span class="token punctuation">,</span> self<span class="token punctuation">.</span>modes<span class="token punctuation">[</span>current_mode<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">:</span><span class="token function">upper</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">end</span>
  <span class="token keyword">return</span> string<span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span><span class="token string">' %s '</span><span class="token punctuation">,</span> self<span class="token punctuation">.</span>modes<span class="token punctuation">[</span>current_mode<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">:</span><span class="token function">upper</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token keyword">end</span>

M<span class="token punctuation">.</span>get_git_status <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token comment">-- use fallback because it doesn't set this variable on the initial &#96;BufEnter&#96;</span>
  <span class="token keyword">local</span> signs <span class="token operator">=</span> vim<span class="token punctuation">.</span>b<span class="token punctuation">.</span>gitsigns_status_dict <span class="token keyword">or</span> <span class="token punctuation">&#123;</span>head <span class="token operator">=</span> <span class="token string">''</span><span class="token punctuation">,</span> added <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">,</span> changed <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">,</span> removed <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">&#125;</span>
  <span class="token keyword">local</span> is_head_empty <span class="token operator">=</span> signs<span class="token punctuation">.</span>head <span class="token operator">~=</span> <span class="token string">''</span>

  <span class="token keyword">if</span> self<span class="token punctuation">:</span><span class="token function">is_truncated</span><span class="token punctuation">(</span>self<span class="token punctuation">.</span>trunc_width<span class="token punctuation">.</span>git_status<span class="token punctuation">)</span> <span class="token keyword">then</span>
    <span class="token keyword">return</span> is_head_empty <span class="token keyword">and</span> string<span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span><span class="token string">' \uE725 %s '</span><span class="token punctuation">,</span> signs<span class="token punctuation">.</span>head <span class="token keyword">or</span> <span class="token string">''</span><span class="token punctuation">)</span> <span class="token keyword">or</span> <span class="token string">''</span>
  <span class="token keyword">end</span>

  <span class="token keyword">return</span> is_head_empty
    <span class="token keyword">and</span> string<span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span>
      <span class="token string">' +%s ~%s -%s | \uE725 %s '</span><span class="token punctuation">,</span>
      signs<span class="token punctuation">.</span>added<span class="token punctuation">,</span> signs<span class="token punctuation">.</span>changed<span class="token punctuation">,</span> signs<span class="token punctuation">.</span>removed<span class="token punctuation">,</span> signs<span class="token punctuation">.</span>head
    <span class="token punctuation">)</span>
    <span class="token keyword">or</span> <span class="token string">''</span>
<span class="token keyword">end</span>

M<span class="token punctuation">.</span>get_filename <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token keyword">if</span> self<span class="token punctuation">:</span><span class="token function">is_truncated</span><span class="token punctuation">(</span>self<span class="token punctuation">.</span>trunc_width<span class="token punctuation">.</span>filename<span class="token punctuation">)</span> <span class="token keyword">then</span> <span class="token keyword">return</span> <span class="token string">" %&lt;%f "</span> <span class="token keyword">end</span>
  <span class="token keyword">return</span> <span class="token string">" %&lt;%F "</span>
<span class="token keyword">end</span>

M<span class="token punctuation">.</span>get_filetype <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> file_name<span class="token punctuation">,</span> file_ext <span class="token operator">=</span> fn<span class="token punctuation">.</span><span class="token function">expand</span><span class="token punctuation">(</span><span class="token string">"%:t"</span><span class="token punctuation">)</span><span class="token punctuation">,</span> fn<span class="token punctuation">.</span><span class="token function">expand</span><span class="token punctuation">(</span><span class="token string">"%:e"</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> icon <span class="token operator">=</span> require<span class="token string">'nvim-web-devicons'</span><span class="token punctuation">.</span><span class="token function">get_icon</span><span class="token punctuation">(</span>file_name<span class="token punctuation">,</span> file_ext<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> default <span class="token operator">=</span> <span class="token keyword">true</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> filetype <span class="token operator">=</span> vim<span class="token punctuation">.</span>bo<span class="token punctuation">.</span>filetype

  <span class="token keyword">if</span> filetype <span class="token operator">==</span> <span class="token string">''</span> <span class="token keyword">then</span> <span class="token keyword">return</span> <span class="token string">''</span> <span class="token keyword">end</span>
  <span class="token keyword">return</span> string<span class="token punctuation">.</span><span class="token function">format</span><span class="token punctuation">(</span><span class="token string">' %s %s '</span><span class="token punctuation">,</span> icon<span class="token punctuation">,</span> filetype<span class="token punctuation">)</span><span class="token punctuation">:</span><span class="token function">lower</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token keyword">end</span>

M<span class="token punctuation">.</span>get_line_col <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token keyword">if</span> self<span class="token punctuation">:</span><span class="token function">is_truncated</span><span class="token punctuation">(</span>self<span class="token punctuation">.</span>trunc_width<span class="token punctuation">.</span>line_col<span class="token punctuation">)</span> <span class="token keyword">then</span> <span class="token keyword">return</span> <span class="token string">' %l:%c '</span> <span class="token keyword">end</span>
  <span class="token keyword">return</span> <span class="token string">' Ln %l, Col %c '</span>
<span class="token keyword">end</span>


M<span class="token punctuation">.</span>set_active <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token keyword">local</span> colors <span class="token operator">=</span> self<span class="token punctuation">.</span>colors

  <span class="token keyword">local</span> mode <span class="token operator">=</span> colors<span class="token punctuation">.</span>mode <span class="token operator">..</span> self<span class="token punctuation">:</span><span class="token function">get_current_mode</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> mode_alt <span class="token operator">=</span> colors<span class="token punctuation">.</span>mode_alt <span class="token operator">..</span> self<span class="token punctuation">.</span>separators<span class="token punctuation">[</span>active_sep<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span>
  <span class="token keyword">local</span> git <span class="token operator">=</span> colors<span class="token punctuation">.</span>git <span class="token operator">..</span> self<span class="token punctuation">:</span><span class="token function">get_git_status</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> git_alt <span class="token operator">=</span> colors<span class="token punctuation">.</span>git_alt <span class="token operator">..</span> self<span class="token punctuation">.</span>separators<span class="token punctuation">[</span>active_sep<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">]</span>
  <span class="token keyword">local</span> filename <span class="token operator">=</span> colors<span class="token punctuation">.</span>inactive <span class="token operator">..</span> self<span class="token punctuation">:</span><span class="token function">get_filename</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> filetype_alt <span class="token operator">=</span> colors<span class="token punctuation">.</span>filetype_alt <span class="token operator">..</span> self<span class="token punctuation">.</span>separators<span class="token punctuation">[</span>active_sep<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span>
  <span class="token keyword">local</span> filetype <span class="token operator">=</span> colors<span class="token punctuation">.</span>filetype <span class="token operator">..</span> self<span class="token punctuation">:</span><span class="token function">get_filetype</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> line_col <span class="token operator">=</span> colors<span class="token punctuation">.</span>line_col <span class="token operator">..</span> self<span class="token punctuation">:</span><span class="token function">get_line_col</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> line_col_alt <span class="token operator">=</span> colors<span class="token punctuation">.</span>line_col_alt <span class="token operator">..</span> self<span class="token punctuation">.</span>separators<span class="token punctuation">[</span>active_sep<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span>

  <span class="token keyword">return</span> table<span class="token punctuation">.</span><span class="token function">concat</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
    colors<span class="token punctuation">.</span>active<span class="token punctuation">,</span> mode<span class="token punctuation">,</span> mode_alt<span class="token punctuation">,</span> git<span class="token punctuation">,</span> git_alt<span class="token punctuation">,</span>
    <span class="token string">"%="</span><span class="token punctuation">,</span> filename<span class="token punctuation">,</span> <span class="token string">"%="</span><span class="token punctuation">,</span>
    filetype_alt<span class="token punctuation">,</span> filetype<span class="token punctuation">,</span> line_col_alt<span class="token punctuation">,</span> line_col
  <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
<span class="token keyword">end</span>

M<span class="token punctuation">.</span>set_inactive <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token keyword">return</span> self<span class="token punctuation">.</span>colors<span class="token punctuation">.</span>inactive <span class="token operator">..</span> <span class="token string">'%= %F %='</span>
<span class="token keyword">end</span>

M<span class="token punctuation">.</span>set_explorer <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>self<span class="token punctuation">)</span>
  <span class="token keyword">local</span> title <span class="token operator">=</span> self<span class="token punctuation">.</span>colors<span class="token punctuation">.</span>mode <span class="token operator">..</span> <span class="token string">' \uF414  '</span>
  <span class="token keyword">local</span> title_alt <span class="token operator">=</span> self<span class="token punctuation">.</span>colors<span class="token punctuation">.</span>mode_alt <span class="token operator">..</span> self<span class="token punctuation">.</span>separators<span class="token punctuation">[</span>active_sep<span class="token punctuation">]</span><span class="token punctuation">[</span><span class="token number">2</span><span class="token punctuation">]</span>

  <span class="token keyword">return</span> table<span class="token punctuation">.</span><span class="token function">concat</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> self<span class="token punctuation">.</span>colors<span class="token punctuation">.</span>active<span class="token punctuation">,</span> title<span class="token punctuation">,</span> title_alt <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
<span class="token keyword">end</span>

Statusline <span class="token operator">=</span> <span class="token function">setmetatable</span><span class="token punctuation">(</span>M<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span>
  __call <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>statusline<span class="token punctuation">,</span> mode<span class="token punctuation">)</span>
    <span class="token keyword">if</span> mode <span class="token operator">==</span> <span class="token string">"active"</span> <span class="token keyword">then</span> <span class="token keyword">return</span> statusline<span class="token punctuation">:</span><span class="token function">set_active</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">end</span>
    <span class="token keyword">if</span> mode <span class="token operator">==</span> <span class="token string">"inactive"</span> <span class="token keyword">then</span> <span class="token keyword">return</span> statusline<span class="token punctuation">:</span><span class="token function">set_inactive</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">end</span>
    <span class="token keyword">if</span> mode <span class="token operator">==</span> <span class="token string">"explorer"</span> <span class="token keyword">then</span> <span class="token keyword">return</span> statusline<span class="token punctuation">:</span><span class="token function">set_explorer</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">end</span>
  <span class="token keyword">end</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span>

<span class="token comment">-- set statusline</span>
<span class="token comment">-- TODO: replace this once we can define autocmd using lua</span>
api<span class="token punctuation">.</span><span class="token function">nvim_exec</span><span class="token punctuation">(</span><span class="token string">[[
  augroup Statusline
  au!
  au WinEnter,BufEnter * setlocal statusline=%!v:lua.Statusline('active')
  au WinLeave,BufLeave * setlocal statusline=%!v:lua.Statusline('inactive')
  au WinEnter,BufEnter,FileType NvimTree setlocal statusline=%!v:lua.Statusline('explorer')
  augroup END
]]</span><span class="token punctuation">,</span> <span class="token keyword">false</span><span class="token punctuation">)</span>

<span class="token comment">----[[</span>
<span class="token comment">--  NOTE: I don't use this since the statusline already has</span>
<span class="token comment">--  so much stuff going on. Feel free to use it!</span>
<span class="token comment">--  credit: https://github.com/nvim-lua/lsp-status.nvim</span>
<span class="token comment">--</span>
<span class="token comment">--  I now use &#96;tabline&#96; to display these errors, go to &#96;_bufferline.lua&#96; if you</span>
<span class="token comment">--  want to check that out</span>
<span class="token comment">----]]</span>
<span class="token comment">-- Statusline.get_lsp_diagnostic = function(self)</span>
<span class="token comment">--   local result = &#123;&#125;</span>
<span class="token comment">--   local levels = &#123;</span>
<span class="token comment">--     errors = 'Error',</span>
<span class="token comment">--     warnings = 'Warning',</span>
<span class="token comment">--     info = 'Information',</span>
<span class="token comment">--     hints = 'Hint'</span>
<span class="token comment">--   &#125;</span>

<span class="token comment">--   for k, level in pairs(levels) do</span>
<span class="token comment">--     result[k] = vim.lsp.diagnostic.get_count(0, level)</span>
<span class="token comment">--   end</span>

<span class="token comment">--   if self:is_truncated(120) then</span>
<span class="token comment">--     return ''</span>
<span class="token comment">--   else</span>
<span class="token comment">--     return string.format(</span>
<span class="token comment">--       "| \uF00D:%s \uF12A:%s \uF129:%s \uF834:%s ",</span>
<span class="token comment">--       result['errors'] or 0, result['warnings'] or 0,</span>
<span class="token comment">--       result['info'] or 0, result['hints'] or 0</span>
<span class="token comment">--     )</span>
<span class="token comment">--   end</span>
<span class="token comment">-- end</span></code>`}</pre>
<p>And here\u2019s the result.</p>
<p><img src="${"/assets/post/neovim-lua-statusline/result.png"}" alt="${"result"}"></p>
<p>Also a <a href="${"https://streamable.com/arzm3q"}" rel="${"nofollow"}">preview video</a> for a better demonstration. As you can see in the video, they change their appearance based on the window width.</p>
<p>That\u2019s the active statusline, I don\u2019t think I need to put a screenshot for the inactive one because nothing is interesting going on there :p.</p>
<p>Here\u2019s <a href="${"https://github.com/elianiva/dotfiles/blob/master/nvim/.config/nvim/lua/modules/_statusline.lua"}" rel="${"nofollow"}">my statusline file</a> for a reference.</p>
<p>There are also some great statusline plugins written in lua if you want to get started quickly such as [tjdevries/express_line.nvim][express-line], <a href="${"https://github.com/glepnir/galaxyline.nvim"}" rel="${"nofollow"}">glepnir/galaxyline.nvim</a>, <a href="${"https://github.com/adelarsq/neoline.vim"}" rel="${"nofollow"}">adelarsq/neoline.vim</a> and so on.</p>
<h1 id="${"closing-note"}"><a href="${"#closing-note"}">Closing Note</a></h1>
<p>I really like how it turned out, Lua support on Neovim is probably the best update I\u2019ve ever experienced. It makes me want to play around with Neovim\u2019s API even more. Kudos to all of Neovim contributors!</p>
<p>Anyway, thanks for reading, and gave a great day! :)</p>`
  })}`;
});
var index$h = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Neovim_lua_statusline,
  metadata: metadata$h
});
const metadata$g = {
  title: "Making You Own Custom Startpage For Chrome",
  date: "2020-09-15T00:00:00.000Z",
  desc: "An attempt of creating a custom startpage so that I don't get bored whenever I open a new tab on chrome.",
  tags: ["website"]
};
const Chrome_custom_newtab = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$g), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#making-the-extension"}">Making the extension</a></p>
<ul><li><a href="${"#prerequisite"}">Prerequisite</a></li>
<li><a href="${"#preparing-the-project"}">Preparing the project</a></li>
<li><a href="${"#making-the-page"}">Making the page</a></li>
<li><a href="${"#applying-the-homepage"}">Applying the homepage</a></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Well, I\u2019ve been wanting to make my own homepage or newtab page. I thought this kind of thing is only possible in firefox. You might have seen some cool custom firefox startpage like <a href="${"https://www.reddit.com/r/startpages/comments/hfuoqg/a_simple_startpage_i_have_been_working_on"}" rel="${"nofollow"}">this one</a>. Turns out, if you want a custom newtab page on chrome, you have to make an extension for that. Fortunately, it is super simple.</p>
<h1 id="${"making-the-extension"}"><a href="${"#making-the-extension"}">Making the extension</a></h1>
<h2 id="${"prerequisite"}"><a href="${"#prerequisite"}">Prerequisite</a></h2>
<p>Before we start, we must prepare several things.</p>
<ul><li>Basic knowledge of HTML, CSS and JS (JS isn\u2019t required though, it\u2019s optional).</li>
<li>Text editor</li>
<li>Chrome based browser (duh? obviously)</li></ul>
<h2 id="${"preparing-the-project"}"><a href="${"#preparing-the-project"}">Preparing the project</a></h2>
<p>First thing first, make a directory with the name of your choice anywhere you prefer. I\u2019ll have mine at <code>~/codes/chrome-page</code>. Then inside that directory, create a <code>manifest.json</code> file. Fill it with this.</p>
<pre class="${"language-json"}">${`<code class="language-json"><span class="token punctuation">&#123;</span>
  <span class="token property">"name"</span><span class="token operator">:</span> <span class="token string">"Startpage"</span><span class="token punctuation">,</span>
  <span class="token property">"version"</span><span class="token operator">:</span> <span class="token string">"1.0"</span><span class="token punctuation">,</span>
  <span class="token property">"description"</span><span class="token operator">:</span> <span class="token string">"My personal custom startpage"</span><span class="token punctuation">,</span>
  <span class="token property">"manifest_version"</span><span class="token operator">:</span> <span class="token number">2</span><span class="token punctuation">,</span>
  <span class="token property">"chrome_url_overrides"</span><span class="token operator">:</span> <span class="token punctuation">&#123;</span>
    <span class="token property">"newtab"</span><span class="token operator">:</span> <span class="token string">"index.html"</span>
  <span class="token punctuation">&#125;</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<p>If you want to know this file even more, <a href="${"https://developer.chrome.com/extensions/manifest"}" rel="${"nofollow"}">google has it covered</a> for you. The important part here is the <code>chrome_url_overrides.newtab</code> field. You should point that to an HTML file that you want to make as a startpage.</p>
<h2 id="${"making-the-page"}"><a href="${"#making-the-page"}">Making the page</a></h2>
<p>Honestly, nothing much to tell here. You can go as overkill as you want for a startpage or just go ahead and pick one from the internet. I suggest you to go to <a href="${"https://reddit.com/r/startpage"}" rel="${"nofollow"}">r/startpage</a> subreddit for a start. Here\u2019s mine.</p>
<p><img src="${"/assets/post/chrome-custom-newtab/old.png"}" alt="${"old startpage"}"></p>
<p>It\u2019s super simple, I just set some vim-like shortcut (prefixed with colon) like <code>:o</code> to open a new website, <code>:s</code> to do google search, <code>:gh</code> to open github, etc. If you want mine, you can get it <a href="${"https://github.com/elianiva/dotfiles/blob/master/misc/codes/chrome-page"}" rel="${"nofollow"}">here</a>.</p>
${validate_component(Update, "Update").$$render($$result, {date: "17-10-2020"}, {}, {
      default: () => `<p>I made a new once since the old one is too minimal. Here\u2019s the new one.</p>`
    })}
<p><img src="${"/assets/post/chrome-custom-newtab/new.png"}" alt="${"new startpage"}"></p>
<p>You can get it <a href="${"https://github.com/elianiva/dotfiles/blob/master/misc/codes/startpage"}" rel="${"nofollow"}">here</a></p>
${validate_component(Update, "Update").$$render($$result, {date: "26-02-2021"}, {}, {
      default: () => `<p>I simplified my previous startpage by removing the icons and changing the font and the background. I also added a random sentence at the top so I will always memorise a word everytime I open a newtab page. There\u2019s also a link to <a href="${"https://jisho.org"}" rel="${"nofollow"}">jisho.org</a> in case I got interested on that word.</p>`
    })}
<p><img src="${"/assets/post/chrome-custom-newtab/newer.webp"}" alt="${"newer startpage"}"></p>
<p>You can get this new one <a href="${"https://github.com/elianiva/dotfiles/blob/master/codes/startpage"}" rel="${"nofollow"}">here</a> and I have an API that serves random word <a href="${"https://github.com/elianiva/random-jp-api"}" rel="${"nofollow"}">here</a>.</p>
<h2 id="${"applying-the-homepage"}"><a href="${"#applying-the-homepage"}">Applying the homepage</a></h2>
<p>To apply the homepage that you\u2019ve made, go ahead to <code>chrome://extensions</code> and activate <strong>Developer Mode</strong> at the top right corner. A new menu should appeared. Click on the button that says <strong>Load Unpacked</strong>. A file manager will appear, go ahead and navigate to your project directory and click <strong>OK</strong> or <strong>Choose</strong> or whatever your file manager gives you. New extension should appear with the name that you choose earlier on <code>manifest.json</code>. Activate it and that\u2019s it, your custom startpage should appear whenever you open a new tab.</p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>Making a custom startpage for google chrome isn\u2019t that hard. I thought it requires some weird trick or something but it\u2019s not. Hope you find this post useful and see ya later, have a nice day! \u30C4</p>`
  })}`;
});
var index$g = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Chrome_custom_newtab,
  metadata: metadata$g
});
const metadata$f = {
  title: "My /comfy/ and less bloated spotify-tui setup",
  date: "2020-06-03T00:00:00.000Z",
  desc: "Since I use my terminal quite often, why don't I use spotify inside my terminal as well \u30C4",
  tags: ["linux"]
};
const My_spotify_tui_setup = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$f), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#spotifyd"}">Spotifyd</a></p>
<ul><li><a href="${"#what-is-spotifyd"}">What Is Spotifyd?</a></li>
<li><a href="${"#installation"}">Installation</a></li>
<li><a href="${"#configuration"}">Configuration</a></li></ul></li>
<li><p><a href="${"#spotify-tui"}">Spotify TUI</a></p>
<ul><li><a href="${"#what-is-spotify-tui"}">What Is Spotify Tui?</a></li>
<li><a href="${"#installation-1"}">Installation</a></li>
<li><a href="${"#authentication"}">Authentication</a></li>
<li><a href="${"#configuration-1"}">Configuration</a></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Hi! This time I will explain about how I setup my spotifyd + spotify-tui to enjoy music from spotify without their resource heavy app. It\u2019s not Spotify\u2019s fault, it\u2019s Electron. Not that I hate it, I think it\u2019s awesome. It just feels heavy on my machine. I still have 4GB of RAMs lol, so that\u2019s reasonable.</p>
<h1 id="${"spotifyd"}"><a href="${"#spotifyd"}">Spotifyd</a></h1>
<h2 id="${"what-is-spotifyd"}"><a href="${"#what-is-spotifyd"}">What Is Spotifyd?</a></h2>
<p>Spotifyd is the daemon that is used to run spotify-tui. So, basically spotify-tui is just a front-end for spotify that needs some sort of daemon. You can use spotify-tui with any official Spotify client. For example, spotify-tui will read your phone as an available device but that will be a hassle having to open spotify on your phone to use spotify on your desktop.</p>
<p>Spotifyd provides a service that can be used to play spotify. It\u2019s more lightweight and supports more platform than the official client. You can check their <a href="${"https://github.com/Spotifyd/spotifyd/"}" rel="${"nofollow"}">github page</a> for more details.</p>
<h2 id="${"installation"}"><a href="${"#installation"}">Installation</a></h2>
<p>I\u2019m using Arch so I will use the almighty AUR to make my life easier. If you\u2019re on any other distro, you can either take the binary or build it yourself. To install it on Arch (or any Arch based distro), you can use any AUR helper or download the <code>PKGBUILD</code> and run <code>makepkg -si</code>.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token comment"># yay</span>
$ yay -S spotifyd-full

<span class="token comment"># trizen</span>
$ trizen spotifyd-full</code>`}</pre>
<p>I personally use <code>spotifyd-full</code> from AUR. Spotify-full is spotifyd with all feature flags enabled. If you want a minimal install, you can use <code>spotifyd</code> instead. If you don\u2019t like to wait for it to compile, just take one with <code>-bin</code> suffix. For more details on feature flags, you can refer to their <a href="${"https://github.com/Spotifyd/spotifyd/blob/master/README.md#feature-flags"}" rel="${"nofollow"}">github page</a>.</p>
<h2 id="${"configuration"}"><a href="${"#configuration"}">Configuration</a></h2>
<p>Configuring spotifyd is quite easy actually, they gave you a <a href="${"https://github.com/Spotifyd/spotifyd#configuration"}" rel="${"nofollow"}">default configuration</a> to help you get going. Here\u2019s mine.</p>
<pre class="${"language-ini"}">${`<code class="language-ini"><span class="token selector">[global]</span>
<span class="token constant">username</span> <span class="token attr-value"><span class="token punctuation">=</span> &lt;your username></span>
<span class="token constant">password</span> <span class="token attr-value"><span class="token punctuation">=</span> &lt;your password></span>
<span class="token comment"># password_cmd = command_that_writes_password_to_stdout</span>
<span class="token comment"># use_keyring = true</span>
<span class="token constant">backend</span> <span class="token attr-value"><span class="token punctuation">=</span> pulseaudio</span>
<span class="token comment"># device = alsa_audio_device</span>
<span class="token comment"># control = alsa_audio_device</span>
<span class="token comment"># mixer = PCM</span>
<span class="token constant">volume_controller</span> <span class="token attr-value"><span class="token punctuation">=</span> alsa_linear</span>
<span class="token constant">device_name</span> <span class="token attr-value"><span class="token punctuation">=</span> arch</span>
<span class="token constant">bitrate</span> <span class="token attr-value"><span class="token punctuation">=</span> 320</span>
<span class="token constant">cache_path</span> <span class="token attr-value"><span class="token punctuation">=</span> /home/elianiva/.config/spotifyd</span>
<span class="token constant">no_audio_cache</span> <span class="token attr-value"><span class="token punctuation">=</span> false</span>
<span class="token constant">volume_normalisation</span> <span class="token attr-value"><span class="token punctuation">=</span> true</span>
<span class="token constant">normalisation_pregain</span> <span class="token attr-value"><span class="token punctuation">=</span> -4</span>
<span class="token constant">device_type</span> <span class="token attr-value"><span class="token punctuation">=</span> computer</span></code>`}</pre>
<p>I\u2019ll explain the configuration briefly.</p>
<ul><li><p><strong>Username</strong></p>
<p>Fill this field with your <em>real</em> username. You can get one from <a href="${"https://www.spotify.com/us/account/set-device-password/"}" rel="${"nofollow"}">here</a> and it\u2019s roughly looks like <strong>21zu9n5i8jtipipiwxrfyglhohmq</strong>. It\u2019s <strong>NOT</strong> your usual username that you can change, this username is given by Spotify.</p></li>
<li><p><strong>Password</strong></p>
<p>Fill this field with your spotify device password which you can make by visiting <a href="${"https://www.spotify.com/us/account/set-device-password/"}" rel="${"nofollow"}">this link</a>. If you want to put this configuration on github or something like that, <strong>DO NOT USE THIS METHOD</strong>. If you use this method, don\u2019t include it on your repo.</p></li>
<li><p><strong>Password Cmd</strong></p>
<p>Fill this field with a program that outputs your password through stdout. <code>pass</code> can do this. For more details, you can check out <a href="${"https://www.passwordstore.org/"}" rel="${"nofollow"}">their website</a>. I personally don\u2019t use this so I can\u2019t give you any guide.</p></li>
<li><p><strong>Use Keyring</strong></p>
<p>Fill this field if you want spotifyd to look up any password on your machine. I don\u2019t have any experience with keyrings and such so I can\u2019t give you any guide on this. It\u2019s explained on <a href="${"https://github.com/Spotifyd/spotifyd#configuration-file"}" rel="${"nofollow"}">spotifyd readme</a> though, so you can check that.</p></li>
<li><p><strong>Backend</strong></p>
<p>As the name suggest, this field sets the backend used by spotifyd. I use pulseaudio because pulseaudio is able to set per-app volume. I know that ALSA can do that as well but it\u2019s just way too much tinkering.</p></li>
<li><p><strong>Device</strong></p>
<p>This field sets the device that is used for ALSA to stream audio to which can be listed by running <code>aplay -L</code>. If you are using pulseaudio like me, just comment this section.</p></li>
<li><p><strong>Control</strong></p>
<p>This field sets the controller that is used for ALSA to control its audio to. If you are using pulseaudio like me, you can comment this section as well.</p></li>
<li><p><strong>Mixer</strong></p>
<p>This field sets the ALSA that is used by spotifyd. Again, you can comment this is you\u2019re using pulseaudio.</p></li>
<li><p><strong>Volume Controller</strong></p>
<p>This field sets the volume controller for spotifyd. Available options are <code>alsa</code>, <code>alsa_linear</code> and <code>softvol</code>.</p></li>
<li><p><strong>Device Name</strong></p>
<p>This field sets the device name for spotifyd. You can fill this with whatever you want.</p></li>
<li><p><strong>Bitrate</strong></p>
<p>This field sets the bitrate for your audio. Available options are <strong>96</strong>, <strong>160</strong>, and <strong>320</strong>. I use 320 which is the highest option available cuz why not \u30C4</p></li>
<li><p><strong>Cache Path</strong></p>
<p>This field defines where to put the cached audio. It can\u2019t accept <code>~</code> or <code>$HOME</code> for home directory shorthand, so you have to fill the full path like <code>/home/username/</code>.</p></li>
<li><p><strong>No Audio Cache</strong></p>
<p>If this field sets to true, spotifyd won\u2019t cache the audio. I set this to false because I want my audio to be cached so it loads faster and it saves <em>a lot</em> of bandwith.</p></li>
<li><p><strong>Volume Normalisation</strong></p>
<p>This field set whether or not spotifyd normalize the volume of an audio that you\u2019re playing. I enable this because I want all my song to be played with the same volume.</p></li>
<li><p><strong>Normalisation Pregain</strong></p>
<p>Basically, it sets how loud or quiet the song will be. The higher you set it, then it will be louder and vice versa. For example, if you set it <code>-10</code> which is the default option then it won\u2019t be as loud as if you set it to <code>-4</code>. You might tinker around with this to get what you like.</p></li>
<li><p><strong>Device Type</strong></p>
<p>This sets the device type for spotifyd that is displayed on Spotify clients. You can fill this whatever you want, but I set mine to <code>computer</code> because it\u2019s a computer. Other available options are <code>unknown</code>, <code>computer</code>, <code>tablet</code>, <code>smartphone</code>, <code>speaker</code>, <code>tv</code>, <code>avr</code> (Audio/Video Receiver), <code>stb</code> (Set-Top Box), and <code>audiodongle</code>.</p></li></ul>
<p>Now that spotifyd has been configured, let\u2019s move on to spotify-tui itself.</p>
<h1 id="${"spotify-tui"}"><a href="${"#spotify-tui"}">Spotify TUI</a></h1>
<h2 id="${"what-is-spotify-tui"}"><a href="${"#what-is-spotify-tui"}">What Is Spotify Tui?</a></h2>
<p>Spotify TUI is a spotify client or frontend based on Terminal User Interface written in Rust. It\u2019s an awesome alternative for the official Spotify client.</p>
<p>I like this software because it\u2019s lightweight and it\u2019s based on TUI which can be controlled fully with a keyboard. I also like its UI, it\u2019s simple and straight forward. For more details about this software, you can visit their <a href="${"https://github.com/Rigellute/spotify-tui"}" rel="${"nofollow"}">github page</a>.</p>
<h2 id="${"installation-1"}"><a href="${"#installation-1"}">Installation</a></h2>
<p>Installing spotify-tui is pretty straight forward. I use Arch so I can just use AUR. If you\u2019re on the other distro, check out their <a href="${"https://github.com/Rigellute/spotify-tui/blob/master/README.md"}" rel="${"nofollow"}">readme</a> for installation.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token comment"># yay</span>
$ yay -S spotify-tui

<span class="token comment"># trizen</span>
$ trizen spotify-tui</code>`}</pre>
<p>After installing it, the executable binary is called <code>spt</code>. I got confused the first time I installed it because I missed the part where it says</p>
<blockquote><p>The binary executable is <code>spt</code></p></blockquote>
<p>So don\u2019t get confused when you type <code>spotify-tui</code> and nothing happens.</p>
<h2 id="${"authentication"}"><a href="${"#authentication"}">Authentication</a></h2>
<p>Spotify-tui needs to be authenticated by spotify. Don\u2019t worry though, it\u2019s super simple. Just run <code>spt</code> and fill out the needed field which are:</p>
<ul><li><p><strong>Client ID</strong></p>
<p>Your spotify client ID which can be acquired from <a href="${"https://developer.spotify.com/dashboard/applications"}" rel="${"nofollow"}">Spotify Dashboard</a> then click on <code>Create a Client iD</code>. Then go to <code>Edit Settings</code>, add <code>http://localhost:8888/callback</code> to Redirect URIs</p></li>
<li><p><strong>Client Secret</strong></p>
<p>Your spotify client secret which available on the same website as your spotify client ID.</p></li></ul>
<p>After filling those out, you will get redirected to Spotify website that ask for your permissions.</p>
<h2 id="${"configuration-1"}"><a href="${"#configuration-1"}">Configuration</a></h2>
<p>There\u2019s a lot of spotify-tui configuration which can make this post longer. I use the default configuration for it and satisfied enough. If you want to configure it yourself, please refer to <a href="${"https://github.com/Rigellute/spotify-tui/blob/master/README.md#configuration"}" rel="${"nofollow"}">their guide</a>.</p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>There we have it. Spotifyd + Spotify-tui. A Lightweight alternative for the official spotify client. Unfortunately, this setup doesn\u2019t support offline mode yet. I would really like to see this feature implemented. Huge thank you goes to the developers of spotifyd and spotify-tui. Anyway, thanks for reading my post and have a nice day!</p>`
  })}`;
});
var index$f = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: My_spotify_tui_setup,
  metadata: metadata$f
});
const metadata$e = {
  title: "I tried Svelte-Kit, it was Unsurprisingly good",
  date: "2021-02-13T00:00:00.000Z",
  desc: "I've run out of my patience waiting for the stable release and got too hyped for it",
  tags: ["svelte", "website"]
};
const Trying_out_sveltekit = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$e), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table Of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#my-experience"}">My Experience</a></p>
<ul><li><a href="${"#project-setup"}">Project Setup</a></li>
<li><a href="${"#i-am-speeeeedd"}">I am Speeeeedd</a></li>
<li><a href="${"#hot-module-reloading"}">Hot Module Reloading</a></li>
<li><a href="${"#adapters"}">Adapters</a></li>
<li><a href="${"#issues"}">Issues</a></li></ul></li>
<li><p><a href="${"#making-a-simple-app"}">Making A Simple App</a></p>
<ul><li><a href="${"#github-job"}">Github Job</a></li>
<li><a href="${"#i-dont-really-like-the-reserved-filename"}">I Don\u2019t Really Like The Reserved Filename</a></li>
<li><a href="${"#server-routes"}">Server Routes</a></li>
<li><a href="${"#pre-rendering"}">Pre-rendering</a></li>
<li><a href="${"#path-alias"}">Path Alias</a></li>
<li><a href="${"#dynamic-pages"}">Dynamic Pages</a></li>
<li><a href="${"#loading-feedback"}">Loading Feedback</a></li>
<li><a href="${"#dark-mode"}">Dark Mode</a></li>
<li><a href="${"#deployment"}">Deployment</a></li></ul></li>
<li><p><a href="${"#closing-note"}">Closing Note</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>As you may or may not know, I love Svelte. I think it\u2019s a really good Framework (technically a language but whatever) for building a single page application. Long story short, in October 2020 there\u2019s a Svelte Summit in which Rich Harris teased us about Svelte-Kit. It is a new way of building a website using Svelte, it\u2019s meant to replace Sapper.</p>
<p>It has been a few months since that summit and it still hasn\u2019t been released yet. So, I\u2019ve run out of my patience, I want to try this cool and new stuff, and so I did. I made a simple website to try it out.</p>
<h1 id="${"my-experience"}"><a href="${"#my-experience"}">My Experience</a></h1>
<h2 id="${"project-setup"}"><a href="${"#project-setup"}">Project Setup</a></h2>
<p>Since I never tried it out myself nor do I watch someone else try it, I was quite surprised. It broke from the start. I mean, that\u2019s what you get from experimental software. It turns out it was caused by the new release of <a href="${"snowpack-v3-link"}">Snowpack v3</a>.</p>
<p>Thankfully, the Svelte team is super responsive and fixed it in a couple of days or so. I tried it out and it works.</p>
<p>I was expecting it to be this good but I didn\u2019t know that it\u2019s <em>this</em> good. So yeah, I\u2019m quite surprised.</p>
<p>By the way, upon installing I was also surprised by this huge message.</p>
<p><img src="${"/assets/post/trying-out-sveltekit/stop.webp"}" alt="${"stop"}"></p>
<h2 id="${"i-am-speeeeedd"}"><a href="${"#i-am-speeeeedd"}">I am Speeeeedd</a></h2>
<p>I never used Snowpack before, man, it is <em>super fast</em>. I saw it in action from a video and I know it\u2019s fast, but trying it out myself is a different feeling. Starting the dev server is near instant, it only took like 1-2 seconds on my old laptop. I like the direction that we\u2019re going with this. <a href="${"https://www.snowpack.dev"}" rel="${"nofollow"}">Snowpack</a>, <a href="${"https://vitejs.dev"}" rel="${"nofollow"}">Vite</a>, and <a href="${"https://github.com/evanw/esbuild"}" rel="${"nofollow"}">ESbuild</a>, they\u2019re the future of Web Development ;)</p>
<h2 id="${"hot-module-reloading"}"><a href="${"#hot-module-reloading"}">Hot Module Reloading</a></h2>
<p>This is one of the best features in my opinion. When you change some part of your website, it doesn\u2019t do a full reload. It also keeps the state of your application which is great.</p>
<p>When I make my website, I need to give the error message a styling. Without HMR, I would need to either trigger the error every time I changed the CSS or make it to an error state temporarily. Thanks to HMR, I only need to trigger it once and change the style as many times as I want.</p>
<h2 id="${"adapters"}"><a href="${"#adapters"}">Adapters</a></h2>
<p>Svelte-Kit use this new concept called <strong>adapter</strong>. There are a number of adapters available like <a href="${"https://npmjs.com/package/@sveltejs/adapter-node"}" rel="${"nofollow"}">@sveltejs/adapter-node</a>, <a href="${"https://npmjs.com/package/@sveltejs/adapter-static"}" rel="${"nofollow"}">@sveltejs/adapter-static</a>, <a href="${"https://npmjs.com/package/@sveltejs/adapter-vercel"}" rel="${"nofollow"}">@sveltejs/adapter-vercel</a>, etc.</p>
<p>As their name suggests, they <em>adapt</em> your code to a specific environment. For example, if you use <strong>adapter-node</strong> then it will spit out a code that could be run on a server using Node for SSR. If you use <strong>adapter-static</strong>, it will spit out a static build, similar to <code>sapper export</code> if you\u2019ve used Sapper before.</p>
<h2 id="${"issues"}"><a href="${"#issues"}">Issues</a></h2>
<p>While trying out Svelte-Kit, I found out that Svelte\u2019s ESlint plugin doesn\u2019t work with Typescript so I couldn\u2019t use ESlint for this project. That\u2019s just a minor issue though.</p>
<h1 id="${"making-a-simple-app"}"><a href="${"#making-a-simple-app"}">Making A Simple App</a></h1>
<h2 id="${"github-job"}"><a href="${"#github-job"}">Github Job</a></h2>
<p>I decided to make a simple app that utilises Github Job API. You can view available jobs in form of a card and you can filter based on its name, location, or whether or not it\u2019s a full-time job. Here\u2019s some screenshot</p>
<p><img src="${"/assets/post/trying-out-sveltekit/preview.webp"}" alt="${"preview"}">
<img src="${"/assets/post/trying-out-sveltekit/preview-2.webp"}" alt="${"preview-2"}"></p>
<p>I took the design from <a href="${"https://www.frontendmentor.io/challenges/github-jobs-api-93L-NL6rP"}" rel="${"nofollow"}">frontendmentor.io</a> and over-simplify it. It\u2019s just an experiment so I wouldn\u2019t care that much about the design.</p>
<p>It also has a dark mode, by the way, I only took the screenshot of the light mode version.</p>
<h2 id="${"i-dont-really-like-the-reserved-filename"}"><a href="${"#i-dont-really-like-the-reserved-filename"}">I Don\u2019t Really Like The Reserved Filename</a></h2>
<p>Right now, Svelte-Kit uses <code>$layout.svelte</code> for its layout. I don\u2019t like this name, it conflicts with the shell variable. I prefer the old one on sapper which uses <code>_</code> instead of <code>$</code>.</p>
<p>I thought I was editing a <code>$layout.svelte</code> file but I was editing a <code>.svelte</code> file instead because ZSH thought <code>$layout</code> is a variable name. I need to escape it so it would open a <code>\\$layout.svelte</code> instead.</p>
<p>Two plugins that I use for my editor which are <a href="${"https://github.com/nvim-telescope/telescope.nvim"}" rel="${"nofollow"}">telescope.nvim</a> and <a href="${"https://github.com/kyazdani42/nvim-tree.lua"}" rel="${"nofollow"}">nvim-tree.lua</a> has an issue with this filename, it doesn\u2019t escape it before opening it. So I fixed them both which then made me distracted and doing other stuff instead of finishing this app :p</p>
<h2 id="${"server-routes"}"><a href="${"#server-routes"}">Server Routes</a></h2>
<p>Github API has CORS protection so I had to make my own proxy server. Thankfully, Svelte-Kit did a great job with this one. I only need to create a file with a suffix of <code>.json.ts</code> or <code>.json.js</code>.</p>
<p>It\u2019s actually the first time I made a server route, but I already knew how it works so it\u2019s easy. Though I had to go to Svelte\u2019s Discord to find out how to do this in Svelte-Kit.</p>
<h2 id="${"pre-rendering"}"><a href="${"#pre-rendering"}">Pre-rendering</a></h2>
<p>To load your data before rendering it to a user, you need to export a <code>preload</code> function with a <code>module</code> context in Sapper. It\u2019s pretty much the same in Svelte-Kit. The only difference is the function signature is changed a bit. It\u2019s similar to <code>getInitialProps</code> or <code>getServerSideProps</code> in NextJS.</p>
<h2 id="${"path-alias"}"><a href="${"#path-alias"}">Path Alias</a></h2>
<p>At first, I don\u2019t know how Snowpack works at all. After a little bit of reading through its documentation, turns out you can make an alias for an import path. I use <code>#</code> as my prefix for the import path so I could just do something like <code>#components/SEO.svelte</code> instead of typing in the full relative path.</p>
<p>I also did this to <code>tsconfig.json</code> so I get that sweet path completion from tsserver.</p>
<h2 id="${"dynamic-pages"}"><a href="${"#dynamic-pages"}">Dynamic Pages</a></h2>
<p>For the job detail page, I use the Svelte-Kit dynamic page feature. You would make a file with <code>[slug].svelte</code> as its name and you\u2019ll have access to the <code>slug</code> variable which you can then use to fetch specific data for that page.</p>
<p>The <code>slug</code> page could be whatever you want. So if you have <code>pages/job/[id]</code> So if you have <code>pages/job/[id].svelte</code> and you go to <code>/job/foobar</code>, you\u2019ll have <code>foobar</code> as the <code>id</code> value. In my case, it\u2019s a long random ID that I can use to fetch a specific job detail.</p>
<p>Github Job API gave me an HTML string that I could directly use using <code>@html</code> in Svelte, I don\u2019t think this is harmful since it\u2019s Github API after all, but you need to be really careful when using <code>@html</code> since it opens a possibility for XSS.</p>
<h2 id="${"loading-feedback"}"><a href="${"#loading-feedback"}">Loading Feedback</a></h2>
<p>I couldn\u2019t figure out how to get the current loading state in Svelte-Kit. I used Sapper <code>preloading</code> state in the past for my website but I don\u2019t know how to do the same thing in Svelte-Kit.</p>
<p>I added a loading animation when you try to find a job using the search bar but that\u2019s it. I took it from <a href="${"https://icons8.com/cssload/en/horizontal-bars"}" rel="${"nofollow"}">here</a> and convert it to a Svelte component.</p>
<h2 id="${"dark-mode"}"><a href="${"#dark-mode"}">Dark Mode</a></h2>
<p>The original design has a dark mode, and I\u2019m a big fan of dark mode so, why not implement this just for fun. I\u2019ve implemented this feature before for my website so it\u2019s smooth sailing ;)</p>
<p>I use <code>localStorage</code> to store the current theme data and load the state to Svelte\u2019s store <em>before</em> the user sees the page so they won\u2019t see Flash Of Incorrect Theme or whatever you want to call it by putting the loading mechanism <em>before</em> the HTML body.</p>
<h2 id="${"deployment"}"><a href="${"#deployment"}">Deployment</a></h2>
<p>I was trying to deploy this app to Vercel but it keeps changing constantly so stuff breaks easily. I decided not to deploy this in the end.</p>
${validate_component(Update, "Update").$$render($$result, {date: "21-03-2021"}, {}, {
      default: () => `<p>I managed to deploy this app <a href="${"https://svlt.elianiva.me"}" rel="${"nofollow"}">here</a> using <code>@sveltejs/adapter-vercel</code>. <del>Though I\u2019m using a temporary fork of mine to make it work</del> It\u2019s been fixed. It\u2019s <em>really</em> satisfying knowing that it finally works :DD</p>`
    })}
<h1 id="${"closing-note"}"><a href="${"#closing-note"}">Closing Note</a></h1>
<p>So far, Svelte-Kit lives up to my expectation. I\u2019m really excited to wait for its final stable release. Anyway, <a href="${"https://github.com/elianiva/gh-job"}" rel="${"nofollow"}">here</a> is the repo if you want to check it out yourself, and thanks for reading this post. Have a wonderful day! ;)</p>`
  })}`;
});
var index$e = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Trying_out_sveltekit,
  metadata: metadata$e
});
const metadata$d = {
  title: "The process of making my website (Part 2)",
  date: "2020-02-13T00:00:00.000Z",
  desc: "Continuation of my previous post which is me telling my experience about how I made my blog using Gatsby",
  tags: ["react", "website"]
};
const Making_of_my_site_2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$d), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#preparation"}">Preparation</a></p></li>
<li><p><a href="${"#coding-session"}">Coding Session</a></p>
<ul><li><a href="${"#cleaning-up"}">Cleaning Up</a></li>
<li><a href="${"#header-and-footer"}">Header and Footer</a></li>
<li><a href="${"#pages"}">Pages</a></li>
<li><a href="${"#dealing-with-images"}">Dealing with Images</a></li>
<li><a href="${"#stylings-the-page"}">Stylings the page</a></li>
<li><a href="${"#testing"}">Testing</a></li>
<li><a href="${"#tags-category-and-pagination"}">Tags, category, and pagination</a></li>
<li><a href="${"#making-the-desktop-site"}">Making the desktop site</a></li>
<li><a href="${"#themes"}">Themes</a></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Hello everyone, I hope you all doing great! Welcome to my second part of my process of creating this blog using Gatsby SSG. Last time, I tell you about the design process in Figma which you can read over <a href="${"https://irrellia.github.io/blog/making-of-my-site"}" rel="${"nofollow"}">Here</a>. In this part, I will talk about my \u2018coding\u2019 process.</p>
<h1 id="${"preparation"}"><a href="${"#preparation"}">Preparation</a></h1>
<p>I initialize the Gatsby project using gatsby-cli. To install gatsby-cli is dead simple, you just need to run <code>npm i gatsby-cli -g</code> and there you have it. Then I initialize gatsby project using <code>gatsby new &lt;project-name&gt;</code> command. After having the project created, I ran <code>gatsby develop</code> to start the development server. Now everything is set up, it\u2019s time to jump to my favorite text editor of all time which is Neovim.</p>
<h1 id="${"coding-session"}"><a href="${"#coding-session"}">Coding Session</a></h1>
<h2 id="${"cleaning-up"}"><a href="${"#cleaning-up"}">Cleaning Up</a></h2>
<p>First thing first, I make my gatsby project to be a plain project by deleting unnecessary stuff like images, header and footer. After cleaning up, I installed <a href="${"https://postcss.org"}" rel="${"nofollow"}">PostCSS</a> and <a href="${"https://github.com/postcss/autoprefixer"}" rel="${"nofollow"}">Autoprefixer</a>. Basically, it adds prefix for browser compatibility to my css so I don\u2019t have to add it manually.</p>
<h2 id="${"header-and-footer"}"><a href="${"#header-and-footer"}">Header and Footer</a></h2>
<p>As per usual, I make the mobile version first. I started by making the fixed navbar. I quite struggle on the hamburger menu since I never make an animated hamburger menu, but thanks to <a href="${"https://codepen.io/erikterwan/pen/EVzeRP"}" rel="${"nofollow"}">This</a> I figure it out. It uses checkbox to decide the hamburger state, I never use that technique before. Props to the author for that pen.</p>
<p>After finishing the navbar, I made the overlay menu when you click the hamburger and gave it a fade effect when opening and closing. Mobile navbar is completed, so I moved to footer. When I first made the footer, I hardcoded the links of my social media to the JSX but after watching videos about Gatsby <a href="${"https://www.youtube.com/watch?v=8t0vNu2fCCM"}" rel="${"nofollow"}">Here</a>, it is better to use the graphql query to load the links from gatsby-config. I highly recomend checking that out if you don\u2019t know what Gatsby JS is and want to get started</p>
<h2 id="${"pages"}"><a href="${"#pages"}">Pages</a></h2>
<p>After finishing Navbar and Footer, It is time to make the about page because it\u2019s the easiest.</p>
<p>I added the slight move up animation when you go to the home page to make it look a bit nice. I didn\u2019t create the posts list yet on home page because I haven\u2019t created any post. I made the archives page after that, just the layout of it so all of the buttons on the navbar have a destination page. Then I make the post page which is the most challenging part for me.</p>
<p>First of all, I installed gatsby-transformer-remark which will transform my markdown files to html that can be used for the blog post. I made the place holder posts just to make sure that it\u2019s all working also to use it as a placeholder for the latest posts list.</p>
<h2 id="${"dealing-with-images"}"><a href="${"#dealing-with-images"}">Dealing with Images</a></h2>
<p>I use gatsby-image to display the card image on the card component to improve my website performance. Gatsby-image is just great. It blurs your image when it\u2019s not fully loaded so it doesn\u2019t messed up your dom and you won\u2019t see those grey backgrounds or weird stutter that you usually see when the image isn\u2019t fully loaded.</p>
<p>The card component that I made contains several stuff that comes from graphql query which takes data from markdown frontmatter. After finishing the card component, I made the page template for each post. When I made it, I changed my mind from being a colorful website to a monochromatic website.</p>
<p>I hosted the image on <a href="${"https://cloudinary.com"}" rel="${"nofollow"}">Cloudinary</a> so it doesn\u2019t take my repository space just for images. If you have a better solution, feel free to hit me up!</p>
<h2 id="${"stylings-the-page"}"><a href="${"#stylings-the-page"}">Stylings the page</a></h2>
<p>I make the css for my blog page, it was just a simple thing, nothing really special except for the typography. I changed some of my initial mockup design because I think it doesn\u2019t look that good. Who would\u2019ve thought that choosing a font for your website could be so difficult. I went through several iteration to find the one that I like the most.</p>
<p>I also added the table of contents to make it easier for the user when navigating through my blog posts.</p>
<p><img src="${"/assets/post/making-of-my-site-2/toc.png"}" alt="${"table of content"}"></p>
<p>After making the TOC, I added the <code>&lt;pre&gt;</code> tag which I really like from a blog using a plugin called <code>gatsby-remark-prismjs</code>. As the name says, it utilize <a href="${"https://prismjs.com"}" rel="${"nofollow"}">Prism JS</a> to highlight my code. When I designing the page, I didn\u2019t think that I could make this feature. But it is so simple, like stupid simple. You just add the plugin and the theme, that\u2019s it. I made the theme on <a href="${"http://k88hudson.github.io/syntax-highlighting-theme-generator/www/"}" rel="${"nofollow"}">this site</a>. It was <em>very</em> helpful. Here\u2019s an example of prismjs in action.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">const</span> a <span class="token operator">=</span> <span class="token string">'this is'</span><span class="token punctuation">;</span>
<span class="token keyword">const</span> b <span class="token operator">=</span> <span class="token string">'just a'</span><span class="token punctuation">;</span>
<span class="token keyword">const</span> c <span class="token operator">=</span> <span class="token string">'test'</span><span class="token punctuation">;</span>
<span class="token keyword">const</span> thing <span class="token operator">=</span> <span class="token template-string"><span class="token template-punctuation string">&#96;</span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">$&#123;</span>a<span class="token interpolation-punctuation punctuation">&#125;</span></span><span class="token string"> </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">$&#123;</span>b<span class="token interpolation-punctuation punctuation">&#125;</span></span><span class="token string"> </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">$&#123;</span>c<span class="token interpolation-punctuation punctuation">&#125;</span></span><span class="token template-punctuation string">&#96;</span></span><span class="token punctuation">;</span>
console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>thing<span class="token punctuation">)</span><span class="token punctuation">;</span></code>`}</pre>
<pre class="${"language-bash"}">${`<code class="language-bash">$ <span class="token function">sudo</span> pacman -S neovim</code>`}</pre>
<h2 id="${"testing"}"><a href="${"#testing"}">Testing</a></h2>
<p>Finally, I can test the page using the real markdown and not stupid placeholder that I made lol. I decided to use my previous post which is the design process in figma. All looks good. I moved to other features.</p>
<h2 id="${"tags-category-and-pagination"}"><a href="${"#tags-category-and-pagination"}">Tags, category, and pagination</a></h2>
<p>My blogs have tags and category for each of them. So, making a page that index all of the tags and category would be a good idea. It was quite a simple process by utilizing node api that can be configured in <code>gatsby-node.js</code> file just like when I made the blog page.</p>
<p>As for the pagination, it was a bit tricky. I found a good tutorial that helped me made the pagination. <a href="${"https://nickymeuleman.netlify.com/blog/gatsby-pagination/"}" rel="${"nofollow"}">Here it is.</a></p>
<h2 id="${"making-the-desktop-site"}"><a href="${"#making-the-desktop-site"}">Making the desktop site</a></h2>
<p>The mobile version is finished. (Yay!) I can finally make the desktop version. First thing first, I changed to navbar to make it more suitable for the desktop. I removed the hamburger and changed it to text menu that has a hover effect.</p>
<p><img src="${"/assets/post/making-of-my-site-2/card.png"}" alt="${"navbar"}"></p>
<p>After doing that, I made the card component to be side by side. Here\u2019s what I mean.</p>
<p><img src="${"/assets/post/making-of-my-site-2/card.png"}" alt="${"card"}"></p>
<h2 id="${"themes"}"><a href="${"#themes"}">Themes</a></h2>
<p>Now this is what I liked the most. Creating another theme brings you to another perspective of your website. Of course I make the light theme that is switchable automatically by default according to the time of the day and manually. Since I didn\u2019t use CSS variables from the start, I have to replace all of the colours in css manually to variables to be able to make the switch for the theme. (Duh, silly me.)</p>
<p>I utilize react context for storing the colours variables. Big thanks to <a href="${"https://medium.com/better-programming/react-context-api-part-1-dark-theme-3f00666cbacb"}" rel="${"nofollow"}">this article</a> for making the theme toggler possible for me. I changed quite a bit of the colours from my design earlier.</p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>The coding process took the longest time to do. According to github, it took around about 17 days. Well, it wouldn\u2019t be that long if I\u2019m not being a lazy person lol. I also got a lot of school stuff (homework, etc). Like, <em>a lot</em>.</p>
<p>Alright, let\u2019s end this post since it\u2019s quite a lengthy one. The next part is about deploying to github pages and other stuff. See ya next time!</p>`
  })}`;
});
var index$d = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Making_of_my_site_2,
  metadata: metadata$d
});
const metadata$c = {
  title: "The process of making my website (Part 3)",
  date: "2020-02-14T00:00:00.000Z",
  desc: "Last post where I talk about my experience about how I made my website using Gatsby",
  tags: ["react", "website"]
};
const Making_of_my_site_3 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$c), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#deployment"}">Deployment</a></p>
<ul><li><a href="${"#manually-using-gh-pages"}">Manually using gh-pages</a></li>
<li><a href="${"#the-life-saver-travisci"}">The life saver: TravisCI</a></li></ul></li>
<li><p><a href="${"#special-thanks"}">Special Thanks</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Hi everyone. Welcome to the last part of the 3 part series. This time, I will talk about how I deploy my site to Github Pages. It\u2019s a simple yet a fun process. So, let\u2019s get into the first step shall we.</p>
<h1 id="${"deployment"}"><a href="${"#deployment"}">Deployment</a></h1>
<h2 id="${"manually-using-gh-pages"}"><a href="${"#manually-using-gh-pages"}">Manually using gh-pages</a></h2>
<p>First of all, I installed <code>gh-page</code> package from npm by executing</p>
<pre class="${"language-bash"}">${`<code class="language-bash">$ <span class="token function">npm</span> <span class="token function">install</span> gh-pages</code>`}</pre>
<p>and creating a custom script to my <code>package.json</code> like so:</p>
<pre class="${"language-json"}">${`<code class="language-json"><span class="token property">"deploy"</span><span class="token operator">:</span> <span class="token string">"gatsby build &amp;&amp; gh-pages -d public -b master"</span><span class="token punctuation">,</span></code>`}</pre>
<p>and to deploy my site, I would simply run <code>npm run deploy</code>. It will automatically deploy my site to github pages.</p>
<p>But, I have to move my source code to other branch because the <code>master</code> branch will be used for the compiled code/the actual site. So I made a new branch called <code>source</code>. Everything seems great, until something bothers me.</p>
<h2 id="${"the-life-saver-travisci"}"><a href="${"#the-life-saver-travisci"}">The life saver: TravisCI</a></h2>
<p>Initially, what I want to do is <code>commit</code> to the repo, <code>push</code> it, and <code>deploy</code> it manually. Could you imagine how frustrating it is to do all of those things? It would be tedious. Then, I came across an article that talk about TravisCI. <a href="${"https://okitavera.me/article/github-pages-static-site-generator-and-travisci/"}" rel="${"nofollow"}">Here it is</a> if you want to read it yourself, it was a good one.</p>
<p>After configuring TravisCI, I can just simply push to the repo and TravisCI will build the site for me automatically. Isn\u2019t that cool?</p>
<h1 id="${"special-thanks"}"><a href="${"#special-thanks"}">Special Thanks</a></h1>
<p>Before I end this blog, I have quite a list of people that I want to say thank you. Big thanks even! So, here we go.</p>
<ul><li><p><a href="${"https://ypraw.github.io"}" rel="${"nofollow"}">ypraw.github.io</a></p>
<p>Thanks to him, I know that you can host your page on github. I used to use random free hosting service to host my static site. He\u2019s also the reason why I choose Gatsby JS because his site also using it.</p></li>
<li><p><a href="${"https://addy-dclxvi.github.io"}" rel="${"nofollow"}">addy-dclxvi.github.io</a></p>
<p>Because of him, I know there is this thing called Static Site Generator. He\u2019s using Hugo for his site.</p></li>
<li><p><a href="${"https://okitavera.me"}" rel="${"nofollow"}">okitavera.me</a></p>
<p>She is my main inspiration for the design of this site. Her site is just beautiful. She\u2019s using Eleventy for her website.</p></li>
<li><p><a href="${"https://bandithijo.com"}" rel="${"nofollow"}">bandithijo.com</a></p>
<p>He is the reason why I decided to make my own blog. It looks like a fun thing to do. He\u2019s using Jekyll for his site.</p></li>
<li><p><a href="${"https://epsi-rns.github.io"}" rel="${"nofollow"}">epsi-rns.github.io</a></p>
<p>His site is filled with quality content that makes me want to make it as well. He\u2019s using Jekyll for his site.</p></li>
<li><p>You</p>
<p>If you\u2019ve gone this far, I just wanna say a big thanks for reading my article. I hope you\u2019re having a nice day :)</p></li></ul>`
  })}`;
});
var index$c = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Making_of_my_site_3,
  metadata: metadata$c
});
const metadata$b = {
  title: "Simple TUI-based Rest Client for (Neo)vim",
  date: "2020-07-16T00:00:00.000Z",
  desc: "A post where I try to find a TUI alternative to Postman. In other word, REST client but in TUI",
  tags: ["neovim"]
};
const Rest_client_for_vim = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$b), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#rest-clients"}">Rest Clients</a></p>
<ul><li><a href="${"#vim-http"}">Vim HTTP</a></li>
<li><a href="${"#vim-rest-console"}">Vim Rest Console</a></li>
<li><a href="${"#coc-rest-client"}">COC Rest Client</a></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>I\u2019ve been learning backend web development stuff lately to create an API and whatnot. We all know that a popular REST client to test API is <a href="${"https://postman.com"}" rel="${"nofollow"}">Postman</a>. I like it but it is using Electron which means that it is quite heavy. Well, to be honest it is not that heavy but if I can save more RAM then why won\u2019t I find an alternative for it.</p>
<p>I found a really cool extension on vscode where you just need a file with the specified syntax to make a request. You might know that I use Neovim as my main editor, so I\u2019m pretty sure there\u2019s a few that works like this. Guess what, there is.</p>
<h1 id="${"rest-clients"}"><a href="${"#rest-clients"}">Rest Clients</a></h1>
<h2 id="${"vim-http"}"><a href="${"#vim-http"}">Vim HTTP</a></h2>
<p>I came across this nice plugin called <a href="${"https://github.com/nicwest/vim-http"}" rel="${"nofollow"}">vim-http</a>. I like how it works, it has syntax highlighting for .http file which is basically a temporary file that you use to make a request. But the drawback to me is that it doesn\u2019t format json response. So I have to format it through the API which I don\u2019t like. So in the end, I try to find another restclient.</p>
<h2 id="${"vim-rest-console"}"><a href="${"#vim-rest-console"}">Vim Rest Console</a></h2>
<p>I found this plugin called <a href="${"https://github.com/diepm/vim-rest-console"}" rel="${"nofollow"}">vim-rest-console</a>, but when I look at its syntax, I don\u2019t quite like it. So I never tried it in the end.</p>
<h2 id="${"coc-rest-client"}"><a href="${"#coc-rest-client"}">COC Rest Client</a></h2>
<p>I\u2019m using a plugin called coc.nvim, and it usually has a lot of stuff. So I checked if there\u2019s any for coc, turns out, there is. It\u2019s called <a href="${"https://github.com/pr4th4m/coc-restclient"}" rel="${"nofollow"}">coc-restclient</a>.</p>
<p>Since most of coc plugins comes from vscode, this particular plugin works similar like the <a href="${"https://marketplace.visualstudio.com/items?itemName=humao.rest-client"}" rel="${"nofollow"}">one that vscode has</a>. Here\u2019s an example.</p>
<pre class="${"language-null"}">${`<code class="language-null">POST http://localhost:3000/api/user/register HTTP/1.1
Content-Type: application/json

&#123;
  &quot;username&quot;: &quot;coolguy32&quot;,
  &quot;email&quot;: &quot;im@coolguy.me&quot;,
  &quot;password&quot;: &quot;superstronkpassword&quot;
&#125;</code>`}</pre>
<p>The great thing about this plugin is that, it gives the response in a json formatted file which is what I was looking for. Here\u2019s an example of the response after running <code>:CocCommand rest-client.request</code>.</p>
<pre class="${"language-null"}">${`<code class="language-null">&#123;
  &quot;Status&quot;: 200,
  &quot;Message&quot;: &quot;OK&quot;
&#125;

&#123;
  &quot;X-Powered-By&quot;: &quot;Express&quot;,
  &quot;Content-Type&quot;: &quot;application/json; charset=utf-8&quot;,
  &quot;Content-Length&quot;: &quot;56&quot;,
  &quot;ETag&quot;: &quot;W/&quot;38-Eu4y++fOI89s+z200P0DrHLf1ZE&quot;&quot;,
  &quot;Date&quot;: &quot;Thu, 16 Jul 2020 14:35:10 GMT&quot;,
  &quot;Connection&quot;: &quot;close&quot;
&#125;

&#123;
  &quot;msg&quot;: &quot;User 5f10659e630bfa40702160e9 has been created&quot;
&#125;</code>`}</pre>
<p>Please refer to the repository for installation or configuration because they explain it really well, there\u2019s no point of me explaining it here :D</p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>I\u2019m glad I found this plugin because I am no longer need postman. I might need it for more advanced feature, but for now, simple rest client is fine. I don\u2019t have to leave my terminal and go to a separate program for that which is awesome. My current setup is having 3 tmux panes, 1 for Neovim, 1 for running the server and stuff, 1 for the rest client.</p>`
  })}`;
});
var index$b = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Rest_client_for_vim,
  metadata: metadata$b
});
const metadata$a = {
  title: "ES6 high order array methods explained",
  date: "2020-07-29T00:00:00.000Z",
  desc: "A post where I try to explain ES6 array methods in a simplest way possible that I could think of.",
  tags: ["javascript"]
};
const Es6_array_methods = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$a), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#high-order-array-methods"}">High Order Array Methods</a></p>
<ul><li><a href="${"#find"}">Find</a></li>
<li><a href="${"#filter"}">Filter</a></li>
<li><a href="${"#some"}">Some</a></li>
<li><a href="${"#every"}">Every</a></li>
<li><a href="${"#foreach"}">ForEach</a></li>
<li><a href="${"#map"}">Map</a></li>
<li><a href="${"#reduce"}">Reduce</a></li></ul></li>
<li><p><a href="${"#references"}">References</a></p></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>ECMAScript 6 introduces some new array methods that is useful to loop through an array items. In this post, I\u2019ll try to explain how I understand some ES6 high order array methods like <code>map()</code>, <code>filter()</code>, <code>reduce()</code>, <code>forEach()</code>, etc. Hopefully you will understand more about these methods after reading this post. Let\u2019s get started.</p>
<h1 id="${"high-order-array-methods"}"><a href="${"#high-order-array-methods"}">High Order Array Methods</a></h1>
<h2 id="${"find"}"><a href="${"#find"}">Find</a></h2>
<p>The first method is <code>Array.prototype.find()</code>. Just like the name suggest, it will find the item that you are looking for. It will return the item if the function returns true. Here\u2019s an example.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">const</span> users <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">&#123;</span>
    id<span class="token operator">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    name<span class="token operator">:</span> <span class="token string">"John Doe"</span><span class="token punctuation">,</span>
    admin<span class="token operator">:</span> <span class="token boolean">false</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span>
    id<span class="token operator">:</span> <span class="token number">2</span><span class="token punctuation">,</span>
    name<span class="token operator">:</span> <span class="token string">"Lukas Smith"</span><span class="token punctuation">,</span>
    admin<span class="token operator">:</span> <span class="token boolean">true</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span>
    id<span class="token operator">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    name<span class="token operator">:</span> <span class="token string">"Erina Matsumoto"</span><span class="token punctuation">,</span>
    admin<span class="token operator">:</span> <span class="token boolean">false</span>
  <span class="token punctuation">&#125;</span>
<span class="token punctuation">]</span>

<span class="token comment">// will return &#123;id: 1, name: "John Doe", admin: false&#125;</span>
users<span class="token punctuation">.</span><span class="token function">find</span><span class="token punctuation">(</span><span class="token parameter">user</span> <span class="token operator">=></span> user<span class="token punctuation">.</span>id <span class="token operator">===</span> <span class="token number">1</span><span class="token punctuation">)</span></code>`}</pre>
<p>As you can see from the example, <code>Array.prototype.find()</code> returns the first item because we give it a condition to check if the item that is currently looping has the <code>id</code> of 1.</p>
<p>What if there are multiple matches? Well, <code>.find()</code> will only return the first match it found. So if you would type</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript">user<span class="token punctuation">.</span><span class="token function">find</span><span class="token punctuation">(</span><span class="token parameter">user</span> <span class="token operator">=></span> <span class="token operator">!</span>user<span class="token punctuation">.</span>admin<span class="token punctuation">)</span></code>`}</pre>
<p>It will return the first match which is <code>{id: 1, name: &quot;John Doe&quot;, admin: false}</code>. If you want it to spit an array with matching condition, then you would use <code>.filter()</code> which we will talk about later.</p>
<p><code>Array.prototype.find()</code> will return undefined if the given condition is not fulfilled (the item that you\u2019re looking for is not available). You can play around with this <a href="${"https://repl.it/@elianiva/find-method"}" rel="${"nofollow"}">here</a>.</p>
<h2 id="${"filter"}"><a href="${"#filter"}">Filter</a></h2>
<p>Like I said earlier, if you want multiple results based off on your condition then you would use <code>Array.prototype.filter()</code>. Let\u2019s try it with the code below.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">const</span> cities <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Hiroshima"</span><span class="token punctuation">,</span> country<span class="token operator">:</span> <span class="token string">"Japan"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Sendai"</span><span class="token punctuation">,</span> country<span class="token operator">:</span> <span class="token string">"Japan"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"London"</span><span class="token punctuation">,</span> country<span class="token operator">:</span> <span class="token string">"England"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Brighton"</span><span class="token punctuation">,</span> country<span class="token operator">:</span> <span class="token string">"England"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Jakarta"</span><span class="token punctuation">,</span> country<span class="token operator">:</span> <span class="token string">"Indonesia"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Bandung"</span><span class="token punctuation">,</span> country<span class="token operator">:</span> <span class="token string">"Indonesia"</span> <span class="token punctuation">&#125;</span>
<span class="token punctuation">]</span>

<span class="token comment">// will return all cities in Japan</span>
cities<span class="token punctuation">.</span><span class="token function">filter</span><span class="token punctuation">(</span><span class="token parameter">city</span> <span class="token operator">=></span> city<span class="token punctuation">.</span>country <span class="token operator">===</span> <span class="token string">"Japan"</span><span class="token punctuation">)</span></code>`}</pre>
<p>As you would expect, it returns an array with matching items. The code above will give us this result.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token punctuation">[</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Hiroshima"</span><span class="token punctuation">,</span> country<span class="token operator">:</span> <span class="token string">"Japan"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Sendai"</span><span class="token punctuation">,</span> country<span class="token operator">:</span> <span class="token string">"Japan"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span></code>`}</pre>
<p>You can play around with the code snippet above <a href="${"https://repl.it/@elianiva/filter-method"}" rel="${"nofollow"}">here</a></p>
<h2 id="${"some"}"><a href="${"#some"}">Some</a></h2>
<p>What if you want to check if an array have some condition that you want? Well, <code>Array.prototype.some()</code> got you covered. This method checks if an array have <em>some</em> condition that you want. Take a look at this example.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">const</span> items <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Phone"</span><span class="token punctuation">,</span> discount<span class="token operator">:</span> <span class="token boolean">true</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Laptop"</span><span class="token punctuation">,</span> discount<span class="token operator">:</span> <span class="token boolean">false</span>  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Keyboard"</span><span class="token punctuation">,</span> discount<span class="token operator">:</span> <span class="token boolean">false</span>  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Mouse"</span><span class="token punctuation">,</span> discount<span class="token operator">:</span> <span class="token boolean">true</span>  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Monitor"</span><span class="token punctuation">,</span> discount<span class="token operator">:</span> <span class="token boolean">false</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span>

<span class="token comment">// will return true</span>
items<span class="token punctuation">.</span><span class="token function">some</span><span class="token punctuation">(</span><span class="token parameter">item</span> <span class="token operator">=></span> item<span class="token punctuation">.</span>discount<span class="token punctuation">)</span></code>`}</pre>
<p>As you can see, it returns <code>true</code> because there are <em>some</em> items that is currently in a discount. Go ahead and try to change them all to <code>false</code> on <a href="${"https://repl.it/@elianiva/some-method"}" rel="${"nofollow"}">repl.it</a>.</p>
<h2 id="${"every"}"><a href="${"#every"}">Every</a></h2>
<p>OK great, now you can check whether or not an array has some items that match you requirements. There\u2019s also a method that will return <code>true</code> if <em>every</em> one of them matches your condition. Check the code below.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">const</span> students <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Erika"</span><span class="token punctuation">,</span> passed<span class="token operator">:</span> <span class="token boolean">true</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Himawari"</span><span class="token punctuation">,</span> passed<span class="token operator">:</span> <span class="token boolean">false</span>  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Irene"</span><span class="token punctuation">,</span> passed<span class="token operator">:</span> <span class="token boolean">false</span>  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Suzuka"</span><span class="token punctuation">,</span> passed<span class="token operator">:</span> <span class="token boolean">true</span>  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> name<span class="token operator">:</span> <span class="token string">"Riku"</span><span class="token punctuation">,</span> passed<span class="token operator">:</span> <span class="token boolean">true</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span>

<span class="token comment">// will return false</span>
students<span class="token punctuation">.</span><span class="token function">every</span><span class="token punctuation">(</span><span class="token parameter">student</span> <span class="token operator">=></span> student<span class="token punctuation">.</span>passed<span class="token punctuation">)</span></code>`}</pre>
<p>It returns false because we need <em>every</em> single one of the student passed. As always, you can play around with the code above <a href="${"https://repl.it/@elianiva/every-method"}" rel="${"nofollow"}">here</a>.</p>
<h2 id="${"foreach"}"><a href="${"#foreach"}">ForEach</a></h2>
<p><code>Array.prototype.forEach()</code> is useful if you want to just loop through an array and don\u2019t want to return anything. For example, if you just want to <code>console.log()</code> every item of an array.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">const</span> songs <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token string">"Road of Resistance"</span><span class="token punctuation">,</span>
  <span class="token string">"Pretender"</span><span class="token punctuation">,</span>
  <span class="token string">"Megitsune"</span><span class="token punctuation">,</span>
  <span class="token string">"Feel It Still"</span><span class="token punctuation">,</span>
  <span class="token string">"Arkadia"</span>
<span class="token punctuation">]</span>

<span class="token comment">// will not return anything</span>
songs<span class="token punctuation">.</span><span class="token function">forEach</span><span class="token punctuation">(</span><span class="token parameter">song</span> <span class="token operator">=></span> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>song<span class="token punctuation">)</span><span class="token punctuation">)</span></code>`}</pre>
<p>You can play around with this method <a href="${"https://repl.it/@elianiva/foreach-method"}" rel="${"nofollow"}">here</a>.</p>
<h2 id="${"map"}"><a href="${"#map"}">Map</a></h2>
<p>Similar to <code>.forEach()</code>, <code>Array.prototype.map()</code> will also loop through each item in an array but it will return a new array. Here\u2019s an example.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">const</span> numbers <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">2</span><span class="token punctuation">,</span> <span class="token number">3</span><span class="token punctuation">,</span> <span class="token number">4</span><span class="token punctuation">,</span> <span class="token number">5</span><span class="token punctuation">]</span>

<span class="token comment">// will return multiplied value</span>
numbers<span class="token punctuation">.</span><span class="token function">map</span><span class="token punctuation">(</span><span class="token parameter">num</span> <span class="token operator">=></span> num <span class="token operator">*</span> <span class="token number">2</span><span class="token punctuation">)</span></code>`}</pre>
<p>I use this method more often than <code>.forEach()</code> because most of the time I need to process that item and returns a new array with the result. You can play around with this <a href="${"https://repl.it/@elianiva/map-method"}" rel="${"nofollow"}">here</a>.</p>
<h2 id="${"reduce"}"><a href="${"#reduce"}">Reduce</a></h2>
<p>Finally, <code>Array.prototype.reduce</code>. This method is quite hard for me to understand initially. It\u2019s sort of like merges the array. The first argument is the function handler that takes 2 arguments and the second argument is the initial value. The function\u2019s first argument called <code>accumulator</code> has the result of current iteration. The second argument called <code>currentValue</code> has the current item in an array. Let\u2019s look at the code and hope it will make more sense.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">const</span> numbers <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">]</span>

<span class="token comment">// will return 5</span>
numbers<span class="token punctuation">.</span><span class="token function">reduce</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">acc<span class="token punctuation">,</span> curr</span><span class="token punctuation">)</span> <span class="token operator">=></span> acc <span class="token operator">+</span> curr<span class="token punctuation">)</span></code>`}</pre>
<p>Let\u2019s make an analogy of that to make things simpler. Suppose you have a jar. That jar is the <code>accumulator</code>. The first time you have it, it\u2019s empty. Then you started to pick an item from a box. The box is an array and the item is the <code>currentValue</code>. You pick the item one by one, adding the total of the items in the jar (<code>accumulator</code>) with the item that you are picking (<code>currentValue</code>). Eventually, you will end up with 5 items. Same goes to the code above.</p>
<p>If you give it a second argument which is <code>initialValue</code>, then it will start from that value instead of 0. Just like if you have a jar filled with some items already.</p>
<pre class="${"language-javascript"}">${`<code class="language-javascript"><span class="token keyword">const</span> numbers <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">1</span><span class="token punctuation">]</span>

<span class="token comment">// will return 10</span>
numbers<span class="token punctuation">.</span><span class="token function">reduce</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">acc<span class="token punctuation">,</span> curr</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">(</span>acc <span class="token operator">+</span> curr<span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token number">5</span><span class="token punctuation">)</span></code>`}</pre>
<p>Reduce method is quite hard to understand at first, don\u2019t worry. Reduce deserves an article in itself, check out <a href="${"https://alligator.io/js/finally-understand-reduce/"}" rel="${"nofollow"}">this article</a> to understand <code>reduce()</code> even more.</p>
<h1 id="${"references"}"><a href="${"#references"}">References</a></h1>
<p>There are so many references for these methods out there already. <a href="${"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array"}" rel="${"nofollow"}">MDN</a> is one of the best reference out there if you want something more technical and detail. Also checkout <a href="${"https://twitter.com/profulsadangi/status/1288053880010334208"}" rel="${"nofollow"}">this tweet</a> (and follow him too! He shared <em>a lot</em> of useful stuff in a form of simple yet concise sketch).</p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>These methods that ES6 introduces is so useful. We no longer need to create a <code>for loop</code> that iterates through the whole array and then do something. Let me know what you think about this. See ya next time \u30C4</p>`
  })}`;
});
var index$a = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Es6_array_methods,
  metadata: metadata$a
});
const metadata$9 = {
  title: "The process of making my website (Part 1)",
  date: "2020-02-12T00:00:00.000Z",
  desc: "A post where I try to explain my experience of how I made my website using React and Gatsby",
  tags: ["react", "website"]
};
const Making_of_my_site = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$9), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#design-process"}">Design process</a></p>
<ul><li><a href="${"#mobile-design"}">Mobile design</a></li>
<li><a href="${"#colour-choice"}">Colour choice</a></li>
<li><a href="${"#responsive-design"}">Responsive design</a></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Hi everyone, welcome to my first post. So for the last few weeks I\u2019ve been interested on this new stack called JAMstack. Many people use it to make their own personal blog by utilizing Static Site Generator (SSG) such as Hugo, Hexo, Eleventy, Gatsby, Jekyll, you name it. They usually hosted it on github pages, netlify, or other headless CMS. As a curious person that likes to tinker around with new stuff (also because I have no life), I decided to make my own personal blog.</p>
<p>I choose Gatsby as my SSG of choice because it is based on React JS, a framework that I\u2019m already familiar with. I will divide this post into several part, starting from designing the frontend on Figma, coding the actual website using React, deploying it to Github Pages with the help of Travis.</p>
<h1 id="${"design-process"}"><a href="${"#design-process"}">Design process</a></h1>
<p>I started to design the site on Figma. If you don\u2019t know what Figma is, it\u2019s basically a web based software to create mockups or wireframe before you make the actual website to make your life easier. If you haven\u2019t tried it yet, then go ahead try it <a href="${"https://figma.com/"}" rel="${"nofollow"}">HERE</a></p>
<p>I want to make my website looks minimalist and clean, so I approach it by using a flat design, lots of squares, sans-serif font, and sharp edges. I also want my blog to have 2 themes (dark and light).</p>
<h2 id="${"mobile-design"}"><a href="${"#mobile-design"}">Mobile design</a></h2>
<p>First, I make the design for mobile. Because I\u2019m using Figma, I can use Figma Mirror app from Google Play Store to do a live preview on my phone. It is very helpful because I have a budget monitor which isn\u2019t quite accurate in terms of colours and my phone have a quite decent colour accuration. I started to make the Home then the About page, the Archives page, the actual Post page that you\u2019re currently in, the Posts List page that contains all of my posts.</p>
<h2 id="${"colour-choice"}"><a href="${"#colour-choice"}">Colour choice</a></h2>
<p>I do the dark theme first because I\u2019m a huge fan of dark themed website (or anything, really). I am no expert at choosing colours, so I took the colours from a pretty popular colour scheme called Palenight from Material Themes. I fell in love with this colours. My text editor which is Neovim use this colour scheme. It is so comfortable to look at.</p>
<p>After making the dark one for the mobile, I made the light one. Again, I took the colour scheme from Material Themes and changed it a bit. Here\u2019s the screenshot that I took after finishing the mobile layout.</p>
<p><img src="${"/assets/post/making-of-my-site/mobile-finished.png"}" alt="${"finished mobile layout"}"></p>
<h2 id="${"responsive-design"}"><a href="${"#responsive-design"}">Responsive design</a></h2>
<p>I\u2019ve finished the mobile layout (YAY!), now it is time to make the desktop one. Again, I started out by making the dark themed first then convert it to light theme. Since I\u2019ve created the mobile version, it is easier to make the desktop one. After done by that, I quite happy with the result</p>
<p><img src="${"/assets/post/making-of-my-site/finished-partial.png"}" alt="${"finished desktop layout"}"></p>
<p>Eventhough I liked the result, there\u2019s one thing that seems wrong. The light theme doesn\u2019t look really \u2018Light\u2019. It still has those dark parts for the code blocks. I think asking for people\u2019s opinion is a good idea because several minds is better than one, so I asked my friends on Facebook and they said it\u2019s better to make the light theme pure white. So I changed the code blocks to white.</p>
<p>The next day, I checked my design again and I think there\u2019s a few parts that doesn\u2019t seem right. They are the READ MORE button and the date on the post page so I changed them. Here\u2019s the difference between them.</p>
<p><img src="${"/assets/post/making-of-my-site/no-button.png"}" alt="${"no button card"}"></p>
<p><img src="${"/assets/post/making-of-my-site/button.png"}" alt="${"button card"}"></p>
<p>After making 2 version of my website (mobile and desktop), I think the design process is finished and the fun and challenging part begins!</p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>Designing a mockup for your own website isn\u2019t as easy I though it would, but it sure was quite a fun process. It took 4 days because I also have quite a bit of school stuff that I have to do. Alright, I don\u2019t want to make this post a lenghty one so I\u2019m gonna end it right here. See ya next post where I\u2019ll talk about the fun part. Bye!</p>`
  })}`;
});
var index$9 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Making_of_my_site,
  metadata: metadata$9
});
const metadata$8 = {
  title: "My setup for Neovim's builtin LSP client",
  date: "2020-12-18T00:00:00.000Z",
  desc: "A post where I explain about my setup for Neovim's builtin LSP",
  tags: ["neovim"]
};
const My_nvim_lsp_setup = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$8), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#what-is-lsp-and-why"}">What is LSP and Why?</a></p></li>
<li><p><a href="${"#neovim-builtin-lsp-client"}">Neovim builtin LSP client</a></p></li>
<li><p><a href="${"#configuration"}">Configuration</a></p>
<ul><li><p><a href="${"#nvim-lspconfig"}">nvim-lspconfig</a></p></li>
<li><p><a href="${"#setup"}">Setup</a></p></li>
<li><p><a href="${"#mappings"}">Mappings</a></p></li>
<li><p><a href="${"#language-specific-config"}">Language-specific config</a></p>
<ul><li><a href="${"#tsserver"}">tsserver</a></li>
<li><a href="${"#svelteserver"}">svelteserver</a></li>
<li><a href="${"#sumneko_lua"}">sumneko_lua</a></li></ul></li>
<li><p><a href="${"#diagnostic"}">Diagnostic</a></p></li>
<li><p><a href="${"#linting-and-formatting"}">Linting and Formatting</a></p></li>
<li><p><a href="${"#diagnostic-conflict"}">Diagnostic Conflict</a></p></li>
<li><p><a href="${"#completion-and-snippets"}">Completion and Snippets</a></p></li></ul></li>
<li><p><a href="${"#closing-note"}">Closing Note</a></p></li></ul>
<h1 id="${"what-is-lsp-and-why"}"><a href="${"#what-is-lsp-and-why"}">What is LSP and Why?</a></h1>
<p>If you don\u2019t already know what LSP is, well, LSP is a Language Server Protocol and it was created by Microsoft. It\u2019s a better implementation of language support for a text editor. Instead of having to implement it for every language on every text editor, we only need a server for a specific language and a client for a text editor that can speak to the server.</p>
<p>Imagine the editor as <code>X</code> and language feature as <code>Y</code>, the first solution would take <code>X*Y</code> to implement because it needs to implements <em>every</em> language features for <em>every</em> editor. The second solution which is the LSP way would only take <code>X+Y</code> because it would only take a server for the language and a client that can speak to that server. The server can be used for any text editor that has a client and the client can speak to any LSP server. No more reinventing the wheel, great!</p>
<p>Here are some resources that explain LSP <em>way better</em> and in more detail.</p>
<ul><li><a href="${"https://code.visualstudio.com/api/language-extensions/language-server-extension-guide"}" rel="${"nofollow"}">LSP guide for VScode</a></li>
<li><a href="${"https://microsoft.github.io/language-server-protocol/"}" rel="${"nofollow"}">Official page for LSP</a></li>
<li><a href="${"https://www.youtube.com/watch?v=C9X5VF9ASac"}" rel="${"nofollow"}">TJ\u2019s talk about LSP on Vimconf 2020</a></li></ul>
<h1 id="${"neovim-builtin-lsp-client"}"><a href="${"#neovim-builtin-lsp-client"}">Neovim builtin LSP client</a></h1>
<p>I use Neovim\u2019s built-in LSP client which only available on the <code>master</code> branch of Neovim at the time of writing this. I was using <a href="${"https://github.com/neoclide/coc.nvim"}" rel="${"nofollow"}">coc.nvim</a> but it was slow on my machine because it uses node and it\u2019s a remote plugin which adds some overhead. It still works great nonetheless, it\u2019s just slow on my machine.</p>
<p>The new neovim\u2019s built-in LSP client is written in Lua and Neovim ships with LuaJIT which makes it super fast.</p>
<h1 id="${"configuration"}"><a href="${"#configuration"}">Configuration</a></h1>
<h2 id="${"nvim-lspconfig"}"><a href="${"#nvim-lspconfig"}">nvim-lspconfig</a></h2>
<p>Neovim has a repo with LSP configuration for a various language called <a href="${"https://github.com/neovim/nvim-lspconfig"}" rel="${"nofollow"}">nvim-lspconfig</a>, this is <em>NOT</em> where the LSP client lives, the client already ships with Neovim. It\u2019s just a repo that holds the configuration for the client.</p>
<p>I have this piece of code on my config to install it. I use <a href="${"https://github.com/wbthomason/packer.nvim"}" rel="${"nofollow"}">packer.nvim</a></p>
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token function">use</span> <span class="token punctuation">&#123;</span><span class="token string">'neovim/nvim-lspconfig'</span><span class="token punctuation">,</span> opt <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">&#125;</span> <span class="token comment">-- builtin lsp config</span></code>`}</pre>
<h2 id="${"setup"}"><a href="${"#setup"}">Setup</a></h2>
<p>I have a directory filled with LSP related config. Here\u2019s some snippet that sets up the LSP.</p>
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token keyword">local</span> custom_on_attach <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  mappings<span class="token punctuation">.</span><span class="token function">lsp_mappings</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

<span class="token keyword">end</span>

<span class="token keyword">local</span> custom_on_init <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>client<span class="token punctuation">)</span>
  <span class="token function">print</span><span class="token punctuation">(</span><span class="token string">'Language Server Protocol started!'</span><span class="token punctuation">)</span>

  <span class="token keyword">if</span> client<span class="token punctuation">.</span>config<span class="token punctuation">.</span>flags <span class="token keyword">then</span>
    client<span class="token punctuation">.</span>config<span class="token punctuation">.</span>flags<span class="token punctuation">.</span>allow_incremental_sync <span class="token operator">=</span> <span class="token keyword">true</span>
  <span class="token keyword">end</span>
<span class="token keyword">end</span>

nvim_lsp<span class="token punctuation">.</span>gopls<span class="token punctuation">.</span><span class="token function">setup</span><span class="token punctuation">&#123;</span>
  on_attach <span class="token operator">=</span> custom_on_attach<span class="token punctuation">,</span>
  on_init <span class="token operator">=</span> custom_on_init<span class="token punctuation">,</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<p>I made a <code>custom_on_attach</code> function to attach LSP specific mappings. I also made a custom <code>on_init</code> function to notify me when the LSP is started and enable <code>incremental_sync</code>. Though, I\u2019m not sure if <code>on_init</code> is the correct thing that I\u2019m looking for. Sometimes it notifies me when the LSP server hasn\u2019t even started yet :p</p>
${validate_component(Update, "Update").$$render($$result, {date: "2021-02-14"}, {}, {
      default: () => `<p>I\u2019ve updated my config to use a <em>better</em> way to set them up. Basically, I have a key-value pair table, each item is a table with the server name as its key. This way, I wouldn\u2019t need to copy and paste <code>nvim_lsp.lsp_name.setup{...}</code>.</p>`
    })}
<p>You can find the full content of this file <a href="${"https://github.com/elianiva/dotfiles/blob/235c54445268f5838ac4a03669fde4d0a4738fea/nvim/.config/nvim/lua/modules/lsp/init.lua"}" rel="${"nofollow"}">here</a></p>
<h2 id="${"mappings"}"><a href="${"#mappings"}">Mappings</a></h2>
<p>Here are some of my LSP related mappings which you can find in the file <a href="${"https://github.com/elianiva/dotfiles/blob/235c54445268f5838ac4a03669fde4d0a4738fea/nvim/.config/nvim/lua/modules/lsp/_mappings.lua"}" rel="${"nofollow"}">here</a></p>
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token keyword">local</span> remap <span class="token operator">=</span> vim<span class="token punctuation">.</span>api<span class="token punctuation">.</span>nvim_set_keymap
<span class="token keyword">local</span> M <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token punctuation">&#125;</span>

<span class="token keyword">local</span> signature <span class="token operator">=</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">"lspsaga.signaturehelp"</span><span class="token punctuation">)</span>
<span class="token comment">-- other LSP saga modules</span>

M<span class="token punctuation">.</span>lsp_mappings <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">if</span> type <span class="token operator">==</span> <span class="token string">"jdtls"</span> <span class="token keyword">then</span>
    <span class="token function">nnoremap</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> <span class="token string">"ga"</span><span class="token punctuation">,</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">"jdtls"</span><span class="token punctuation">)</span><span class="token punctuation">.</span>code_action<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> silent <span class="token operator">=</span> <span class="token keyword">true</span> <span class="token punctuation">&#125;</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
  <span class="token keyword">else</span>
    <span class="token function">nnoremap</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> <span class="token string">"ga"</span><span class="token punctuation">,</span> <span class="token function">require</span><span class="token punctuation">(</span><span class="token string">"plugins._telescope"</span><span class="token punctuation">)</span><span class="token punctuation">.</span>lsp_code_actions<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> silent <span class="token operator">=</span> <span class="token keyword">true</span> <span class="token punctuation">&#125;</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
  <span class="token keyword">end</span>

  <span class="token function">inoremap</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span> <span class="token string">"&lt;C-s>"</span><span class="token punctuation">,</span> signature<span class="token punctuation">.</span>signature_help<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> silent <span class="token operator">=</span> <span class="token keyword">true</span> <span class="token punctuation">&#125;</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
  <span class="token comment">-- some other mappings here</span>
<span class="token keyword">end</span>

<span class="token keyword">return</span> M</code>`}</pre>
<h2 id="${"language-specific-config"}"><a href="${"#language-specific-config"}">Language-specific config</a></h2>
<p>I have most of my LSP config to be default but I gave several LSP an option like <code>tsserver</code>, <code>svelteserver</code>, or <code>sumneko_lua</code>.</p>
<h3 id="${"tsserver"}"><a href="${"#tsserver"}">tsserver</a></h3>
<p>I have my <code>tsserver</code> to be started on every JS/TS file regardless of its directory. The default config will only start when it found <code>package.json</code> or <code>.git</code>.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">nvim_lsp<span class="token punctuation">.</span>tsserver<span class="token punctuation">.</span><span class="token function">setup</span><span class="token punctuation">&#123;</span>
<span class="token operator">==</span><span class="token operator">==</span><span class="token operator">==</span><span class="token operator">=</span>
I have my &#96;tsserver&#96; to be started on every JS<span class="token operator">/</span>TS file regardless of its directory<span class="token punctuation">.</span> With the default config<span class="token punctuation">,</span> it will only start when it found &#96;package<span class="token punctuation">.</span>json&#96; <span class="token keyword">or</span> &#96;<span class="token punctuation">.</span>git&#96; which marks the root directory <span class="token keyword">for</span> the LSP<span class="token punctuation">.</span>

&#96;&#96;&#96;lua
<span class="token comment">-- inside the &#96;servers&#96; table</span>
tsserver <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
<span class="token operator">>></span><span class="token operator">>></span><span class="token operator">>></span><span class="token operator">></span> 06<span class="token function">f717c</span> <span class="token punctuation">(</span>I ACCIDENTALLY DELETED MY LOCAL REPOSITORY LMAO HELP<span class="token punctuation">)</span>
  filetypes <span class="token operator">=</span> <span class="token punctuation">&#123;</span> <span class="token string">'javascript'</span><span class="token punctuation">,</span> <span class="token string">'typescript'</span><span class="token punctuation">,</span> <span class="token string">'typescriptreact'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  on_attach <span class="token operator">=</span> custom_on_attach<span class="token punctuation">,</span>
  on_init <span class="token operator">=</span> custom_on_init<span class="token punctuation">,</span>
  root_dir <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">return</span> vim<span class="token punctuation">.</span>loop<span class="token punctuation">.</span><span class="token function">cwd</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token keyword">end</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<h3 id="${"svelteserver"}"><a href="${"#svelteserver"}">svelteserver</a></h3>
<p>I disabled its HTML emmet suggestion and removed <code>&gt;</code> and <code>&lt;</code> from <code>triggerCharacters</code>. They\u2019re so annoying to me.</p>
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token comment">-- inside the &#96;servers&#96; table</span>
svelteserver <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
  on_attach <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>client<span class="token punctuation">)</span>
    mappings<span class="token punctuation">.</span><span class="token function">lsp_mappings</span><span class="token punctuation">(</span><span class="token punctuation">)</span>

    client<span class="token punctuation">.</span>server_capabilities<span class="token punctuation">.</span>completionProvider<span class="token punctuation">.</span>triggerCharacters <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
      <span class="token string">"."</span><span class="token punctuation">,</span> <span class="token string">'"'</span><span class="token punctuation">,</span> <span class="token string">"'"</span><span class="token punctuation">,</span> <span class="token string">"&#96;"</span><span class="token punctuation">,</span> <span class="token string">"/"</span><span class="token punctuation">,</span> <span class="token string">"@"</span><span class="token punctuation">,</span> <span class="token string">"*"</span><span class="token punctuation">,</span>
      <span class="token string">"#"</span><span class="token punctuation">,</span> <span class="token string">"$"</span><span class="token punctuation">,</span> <span class="token string">"+"</span><span class="token punctuation">,</span> <span class="token string">"^"</span><span class="token punctuation">,</span> <span class="token string">"("</span><span class="token punctuation">,</span> <span class="token string">"["</span><span class="token punctuation">,</span> <span class="token string">"-"</span><span class="token punctuation">,</span> <span class="token string">":"</span>
    <span class="token punctuation">&#125;</span>
  <span class="token keyword">end</span><span class="token punctuation">,</span>
  on_init <span class="token operator">=</span> custom_on_init<span class="token punctuation">,</span>
  handlers <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
    <span class="token punctuation">[</span><span class="token string">"textDocument/publishDiagnostics"</span><span class="token punctuation">]</span> <span class="token operator">=</span> is_using_eslint<span class="token punctuation">,</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  filetypes <span class="token operator">=</span> <span class="token punctuation">&#123;</span> <span class="token string">'html'</span><span class="token punctuation">,</span> <span class="token string">'svelte'</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  settings <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
    svelte <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
      plugin <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
        <span class="token comment">-- some settings</span>
      <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
    <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<h3 id="${"sumneko_lua"}"><a href="${"#sumneko_lua"}">sumneko_lua</a></h3>
<p>[lua-language-server][lua-ls] is a bit different because I compiled it from source so it needs some extra setup.</p>
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token keyword">local</span> sumneko_root <span class="token operator">=</span> os<span class="token punctuation">.</span><span class="token function">getenv</span><span class="token punctuation">(</span><span class="token string">"HOME"</span><span class="token punctuation">)</span> <span class="token operator">..</span> <span class="token string">"/repos/lua-language-server"</span>

<span class="token comment">-- inside the &#96;servers&#96; table</span>
sumneko_lua <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
  cmd <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
    sumneko_root <span class="token operator">..</span> <span class="token string">"/bin/Linux/lua-language-server"</span><span class="token punctuation">,</span>
    <span class="token string">"-E"</span><span class="token punctuation">,</span>
    sumneko_root <span class="token operator">..</span> <span class="token string">"/main.lua"</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  on_attach <span class="token operator">=</span> custom_on_attach<span class="token punctuation">,</span>
  on_init <span class="token operator">=</span> custom_on_init<span class="token punctuation">,</span>
  settings <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
    Lua <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
      runtime <span class="token operator">=</span> <span class="token punctuation">&#123;</span> version <span class="token operator">=</span> <span class="token string">"LuaJIT"</span><span class="token punctuation">,</span> path <span class="token operator">=</span> vim<span class="token punctuation">.</span><span class="token function">split</span><span class="token punctuation">(</span>package<span class="token punctuation">.</span>path<span class="token punctuation">,</span> <span class="token string">";"</span><span class="token punctuation">)</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
      diagnostics <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
        enable <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span>
        globals <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
          <span class="token string">"vim"</span><span class="token punctuation">,</span> <span class="token string">"describe"</span><span class="token punctuation">,</span> <span class="token string">"it"</span><span class="token punctuation">,</span> <span class="token string">"before_each"</span><span class="token punctuation">,</span> <span class="token string">"after_each"</span><span class="token punctuation">,</span>
          <span class="token string">"awesome"</span><span class="token punctuation">,</span> <span class="token string">"theme"</span><span class="token punctuation">,</span> <span class="token string">"client"</span><span class="token punctuation">,</span> <span class="token string">"P"</span><span class="token punctuation">,</span>
        <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
      <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
      workspace <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
        preloadFileSize <span class="token operator">=</span> <span class="token number">400</span><span class="token punctuation">,</span>
      <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
    <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<h2 id="${"diagnostic"}"><a href="${"#diagnostic"}">Diagnostic</a></h2>
<p>I was using <a href="${"https://github.com/nvim-lua/diagnostic-nvim"}" rel="${"nofollow"}">diagnostic-nvim</a> before <a href="${"https://github.com/neovim/neovim/pull/12655"}" rel="${"nofollow"}">this big PR</a> got merged which makes diagnostic-nvim redundant. Here\u2019s some of my diagnostic config.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">vim<span class="token punctuation">.</span>lsp<span class="token punctuation">.</span>handlers<span class="token punctuation">[</span><span class="token string">"textDocument/publishDiagnostics"</span><span class="token punctuation">]</span> <span class="token operator">=</span> vim<span class="token punctuation">.</span>lsp<span class="token punctuation">.</span><span class="token function">with</span><span class="token punctuation">(</span>
  vim<span class="token punctuation">.</span>lsp<span class="token punctuation">.</span>diagnostic<span class="token punctuation">.</span>on_publish_diagnostics<span class="token punctuation">,</span> <span class="token punctuation">&#123;</span>
    virtual_text <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
      prefix <span class="token operator">=</span> <span class="token string">"\xBB"</span><span class="token punctuation">,</span>
      spacing <span class="token operator">=</span> <span class="token number">4</span><span class="token punctuation">,</span>
    <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
    signs <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span>
    update_in_insert <span class="token operator">=</span> <span class="token keyword">false</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#125;</span>
<span class="token punctuation">)</span>

vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">sign_define</span><span class="token punctuation">(</span><span class="token string">'LspDiagnosticsSignError'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> text <span class="token operator">=</span> <span class="token string">"\uF00D"</span><span class="token punctuation">,</span> texthl <span class="token operator">=</span> <span class="token string">"LspDiagnosticsDefaultError"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">sign_define</span><span class="token punctuation">(</span><span class="token string">'LspDiagnosticsSignWarning'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> text <span class="token operator">=</span> <span class="token string">"\uF12A"</span><span class="token punctuation">,</span> texthl <span class="token operator">=</span> <span class="token string">"LspDiagnosticsDefaultWarning"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">sign_define</span><span class="token punctuation">(</span><span class="token string">'LspDiagnosticsSignInformation'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> text <span class="token operator">=</span> <span class="token string">"\uF129"</span><span class="token punctuation">,</span> texthl <span class="token operator">=</span> <span class="token string">"LspDiagnosticsDefaultInformation"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span>
vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">sign_define</span><span class="token punctuation">(</span><span class="token string">'LspDiagnosticsSignHint'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> text <span class="token operator">=</span> <span class="token string">"\uF834"</span><span class="token punctuation">,</span> texthl <span class="token operator">=</span> <span class="token string">"LspDiagnosticsDefaultHint"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">)</span></code>`}</pre>
<p>I set the prefix for <code>virtual_text</code> to be <code>\xBB</code> because I don\u2019t really like the default one and enabled <code>signs</code> for the diagnostic hint. I also made it to only update the diagnostic when I switch between insert mode and normal mode because it\u2019s quite annoying when I haven\u2019t finished typing and get yelled at by LSP because it expects me to put <code>=</code> after a variable name that I haven\u2019t even finished typing yet.</p>
<h2 id="${"linting-and-formatting"}"><a href="${"#linting-and-formatting"}">Linting and Formatting</a></h2>
<p>I recently started using <a href="${"https://github.com/mattn/efm-langserver"}" rel="${"nofollow"}">efm-langserver</a> to run <a href="${"https://eslint.org"}" rel="${"nofollow"}">eslint</a> and formatting like <a href="${"https://prettier.io"}" rel="${"nofollow"}">prettier</a>, <a href="${"https://golang.org/cmd/gofmt/"}" rel="${"nofollow"}">gofmt</a> , <a href="${"https://github.com/johnnymorganz/stylua"}" rel="${"nofollow"}">stylua</a>, and <a href="${"https://github.com/rust-lang/rustfmt"}" rel="${"nofollow"}">rustfmt</a>.</p>
${validate_component(Update, "Update").$$render($$result, {date: "26-12-2020"}, {}, {
      default: () => `<p>I now use <a href="${"https://github.com/mvdan/gofumpt"}" rel="${"nofollow"}">gofumpt</a> for stricter formatting.</p>`
    })}
<p>It was kinda hard to setup but it was well worth it. The formatter is <em>fast</em> and I got nice linting from external linters like ESLint. Here\u2019s some of my config for efm-langserver.</p>
<pre class="${"language-lua"}">${`<code class="language-lua">nvim_lsp<span class="token punctuation">.</span>efm<span class="token punctuation">.</span><span class="token function">setup</span><span class="token punctuation">&#123;</span>
  cmd <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token string">"efm-langserver"</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
  on_attach <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>client<span class="token punctuation">)</span>
    client<span class="token punctuation">.</span>resolved_capabilities<span class="token punctuation">.</span>rename <span class="token operator">=</span> <span class="token keyword">false</span>
    client<span class="token punctuation">.</span>resolved_capabilities<span class="token punctuation">.</span>hover <span class="token operator">=</span> <span class="token keyword">false</span>
  <span class="token keyword">end</span><span class="token punctuation">,</span>
  on_init <span class="token operator">=</span> custom_on_init<span class="token punctuation">,</span>
  settings <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
    rootMarkers <span class="token operator">=</span> <span class="token punctuation">&#123;</span>vim<span class="token punctuation">.</span>loop<span class="token punctuation">.</span><span class="token function">cwd</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
    languages <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
      javascript <span class="token operator">=</span> <span class="token punctuation">&#123;</span> eslint<span class="token punctuation">,</span> prettier <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
      <span class="token comment">-- other languages here</span>
    <span class="token punctuation">&#125;</span>
  <span class="token punctuation">&#125;</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<p>I disabled the capability for rename and hover on efm-langserver because the server doesn\u2019t support that and I don\u2019t want to have any conflict with the other server that\u2019s running.</p>
<p>My prettier is a table with a key of <code>formatCommand</code> with its value as a function to check if <code>.prettierrc</code> is present on current directory and fallback to my global <code>.prettierrc</code> if it doesn\u2019t have a local <code>.prettierrc</code>.</p>
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token keyword">local</span> prettier <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
  formatCommand <span class="token operator">=</span> <span class="token punctuation">(</span>
    <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
      <span class="token keyword">if</span> <span class="token keyword">not</span> vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">empty</span><span class="token punctuation">(</span>vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">glob</span><span class="token punctuation">(</span>vim<span class="token punctuation">.</span>loop<span class="token punctuation">.</span><span class="token function">cwd</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">..</span> <span class="token string">'/.prettierrc'</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token keyword">then</span>
        <span class="token keyword">return</span> <span class="token string">"prettier --config ./.prettierrc"</span>
      <span class="token keyword">else</span>
        <span class="token keyword">return</span> <span class="token string">"prettier --config ~/.config/nvim/.prettierrc"</span>
      <span class="token keyword">end</span>
    <span class="token keyword">end</span>
  <span class="token punctuation">)</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<p>The ESlint config is pretty simple, it looks like this.</p>
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token keyword">local</span> eslint <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
  lintCommand <span class="token operator">=</span> <span class="token string">"eslint_d -f unix --stdin --stdin-filename $&#123;INPUT&#125;"</span><span class="token punctuation">,</span>
  lintIgnoreExitCode <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span>
  lintStdin <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span>
  lintFormats <span class="token operator">=</span> <span class="token punctuation">&#123;</span> <span class="token string">"%f:%l:%c: %m"</span> <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<p>I need to explicitly specify the <code>lintFormats</code>, otherwise it shows the wrong message and it\u2019s really annoying.</p>
<p>You can get my full config for <code>efm-langserver</code> <a href="${"https://github.com/elianiva/dotfiles/blob/235c54445268f5838ac4a03669fde4d0a4738fea/nvim/.config/nvim/lua/modules/lsp/init.lua#L89-L108"}" rel="${"nofollow"}">here</a></p>
${validate_component(Update, "Update").$$render($$result, {date: "22-12-2020"}, {}, {
      default: () => `<p>I am no longer using efm-langserver for formatting because I have an issue with prettier not working correctly when using it to format svelte file. So I use <a href="${"https://github.com/mhartington/formatter.nvim"}" rel="${"nofollow"}">formatter.nvim</a> instead.</p>`
    })}
<h2 id="${"diagnostic-conflict"}"><a href="${"#diagnostic-conflict"}">Diagnostic Conflict</a></h2>
<p>When I use efm-langserver, the diagnostic that comes from the LSP (like <code>tsserver</code>) and external linter that efm-langserver uses are conflicting. So, I made a custom function for it to check if there\u2019s a file like <code>.eslintrc.js</code>, it will turn off the diagnostic that comes from LSP and use ESlint instead.</p>
${validate_component(Update, "Update").$$render($$result, {date: "01-01-2021"}, {}, {
      default: () => `<p>I\u2019ve found a better way from one of <a href="${"https://www.twitch.tv/teej_dv"}" rel="${"nofollow"}">TJ\u2019s</a> stream to do this which looks like this.</p>`
    })}
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token keyword">local</span> is_using_eslint <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span>_<span class="token punctuation">,</span> _<span class="token punctuation">,</span> result<span class="token punctuation">,</span> client_id<span class="token punctuation">)</span>
  <span class="token keyword">if</span> <span class="token function">is_cfg_present</span><span class="token punctuation">(</span><span class="token string">"/.eslintrc.json"</span><span class="token punctuation">)</span> <span class="token keyword">or</span> <span class="token function">is_cfg_present</span><span class="token punctuation">(</span><span class="token string">"/.eslintrc.js"</span><span class="token punctuation">)</span> <span class="token keyword">then</span>
    <span class="token keyword">return</span>
  <span class="token keyword">end</span>

  <span class="token keyword">return</span> vim<span class="token punctuation">.</span>lsp<span class="token punctuation">.</span>handlers<span class="token punctuation">[</span><span class="token string">"textDocument/publishDiagnostics"</span><span class="token punctuation">]</span><span class="token punctuation">(</span>_<span class="token punctuation">,</span> _<span class="token punctuation">,</span> result<span class="token punctuation">,</span> client_id<span class="token punctuation">)</span>
<span class="token keyword">end</span></code>`}</pre>
<p>I\u2019ve overridden the <code>vim.lsp.handlers[&quot;textDocument/publishDiagnostics&quot;]</code> anyway so reusing it would also works and it looks way cleaner.</p>
<h2 id="${"completion-and-snippets"}"><a href="${"#completion-and-snippets"}">Completion and Snippets</a></h2>
<p>I use a completion and snippet plugin to make my life easier. For completion, I use <a href="${"https://github.com/hrsh7th/nvim-compe"}" rel="${"nofollow"}">nvim-compe</a>, previously I was using <a href="${"https://github.com/nvim-lua/completion-nvim"}" rel="${"nofollow"}">completion-nvim</a> but I had some issues with it such as path completion sometimes not showing up and flickering.</p>
<p>Snippet wise, I use <a href="${"https://github.com/hrsh7th/vim-vsnip"}" rel="${"nofollow"}">vim-vsnip</a>. I was going to use <a href="${"https://github.com/norcalli/snippets.nvim"}" rel="${"nofollow"}">snippets.nvim</a> but it doesn\u2019t integrate well enough with LSP\u2019s snippet.</p>
<p>Here\u2019s some of my <code>nvim-compe</code> config</p>
<pre class="${"language-lua"}">${`<code class="language-lua"><span class="token keyword">local</span> remap <span class="token operator">=</span> vim<span class="token punctuation">.</span>api<span class="token punctuation">.</span>nvim_set_keymap

vim<span class="token punctuation">.</span>g<span class="token punctuation">.</span>vsnip_snippet_dir <span class="token operator">=</span> vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">stdpath</span><span class="token punctuation">(</span><span class="token string">"config"</span><span class="token punctuation">)</span><span class="token operator">..</span><span class="token string">"/snippets"</span>

<span class="token function">require</span><span class="token punctuation">(</span><span class="token string">"compe"</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">setup</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
  enabled              <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span>
  debug                <span class="token operator">=</span> <span class="token keyword">false</span><span class="token punctuation">,</span>
  min_length           <span class="token operator">=</span> <span class="token number">2</span><span class="token punctuation">,</span>
  preselect            <span class="token operator">=</span> <span class="token string">"disable"</span><span class="token punctuation">,</span>
  source_timeout       <span class="token operator">=</span> <span class="token number">200</span><span class="token punctuation">,</span>
  incomplete_delay     <span class="token operator">=</span> <span class="token number">400</span><span class="token punctuation">,</span>
  allow_prefix_unmatch <span class="token operator">=</span> <span class="token keyword">false</span><span class="token punctuation">,</span>

  source <span class="token operator">=</span> <span class="token punctuation">&#123;</span>
    path     <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span>
    calc     <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span>
    buffer   <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span>
    vsnip    <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span>
    nvim_lsp <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span>
    nvim_lua <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">,</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">)</span>

Util<span class="token punctuation">.</span>trigger_completion <span class="token operator">=</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">if</span> vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">pumvisible</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">~=</span> <span class="token number">0</span> <span class="token keyword">then</span>
    <span class="token keyword">if</span> vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">complete_info</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">[</span><span class="token string">"selected"</span><span class="token punctuation">]</span> <span class="token operator">~=</span> <span class="token operator">-</span><span class="token number">1</span> <span class="token keyword">then</span>
      <span class="token keyword">return</span> vim<span class="token punctuation">.</span>fn<span class="token punctuation">[</span><span class="token string">"compe#confirm"</span><span class="token punctuation">]</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">end</span>
  <span class="token keyword">end</span>

  <span class="token keyword">local</span> prev_col<span class="token punctuation">,</span> next_col <span class="token operator">=</span> vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">col</span><span class="token punctuation">(</span><span class="token string">"."</span><span class="token punctuation">)</span> <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">,</span> vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">col</span><span class="token punctuation">(</span><span class="token string">"."</span><span class="token punctuation">)</span>
  <span class="token keyword">local</span> prev_char <span class="token operator">=</span> vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">getline</span><span class="token punctuation">(</span><span class="token string">"."</span><span class="token punctuation">)</span><span class="token punctuation">:</span><span class="token function">sub</span><span class="token punctuation">(</span>prev_col<span class="token punctuation">,</span> prev_col<span class="token punctuation">)</span>
  <span class="token keyword">local</span> next_char <span class="token operator">=</span> vim<span class="token punctuation">.</span>fn<span class="token punctuation">.</span><span class="token function">getline</span><span class="token punctuation">(</span><span class="token string">"."</span><span class="token punctuation">)</span><span class="token punctuation">:</span><span class="token function">sub</span><span class="token punctuation">(</span>next_col<span class="token punctuation">,</span> next_col<span class="token punctuation">)</span>

  <span class="token comment">-- minimal autopairs-like behaviour</span>
  <span class="token keyword">if</span> prev_char <span class="token operator">==</span> <span class="token string">"&#123;"</span> <span class="token keyword">and</span> next_char <span class="token operator">==</span> <span class="token string">""</span> <span class="token keyword">then</span> <span class="token keyword">return</span> Util<span class="token punctuation">.</span><span class="token function">t</span><span class="token punctuation">(</span><span class="token string">"&lt;CR>&#125;&lt;C-o>O"</span><span class="token punctuation">)</span> <span class="token keyword">end</span>
  <span class="token keyword">if</span> prev_char <span class="token operator">==</span> <span class="token string">"["</span> <span class="token keyword">and</span> next_char <span class="token operator">==</span> <span class="token string">""</span> <span class="token keyword">then</span> <span class="token keyword">return</span> Util<span class="token punctuation">.</span><span class="token function">t</span><span class="token punctuation">(</span><span class="token string">"&lt;CR>]&lt;C-o>O"</span><span class="token punctuation">)</span> <span class="token keyword">end</span>
  <span class="token keyword">if</span> prev_char <span class="token operator">==</span> <span class="token string">"("</span> <span class="token keyword">and</span> next_char <span class="token operator">==</span> <span class="token string">""</span> <span class="token keyword">then</span> <span class="token keyword">return</span> Util<span class="token punctuation">.</span><span class="token function">t</span><span class="token punctuation">(</span><span class="token string">"&lt;CR>)&lt;C-o>O"</span><span class="token punctuation">)</span> <span class="token keyword">end</span>
  <span class="token keyword">if</span> prev_char <span class="token operator">==</span> <span class="token string">">"</span> <span class="token keyword">and</span> next_char <span class="token operator">==</span> <span class="token string">"&lt;"</span> <span class="token keyword">then</span> <span class="token keyword">return</span> Util<span class="token punctuation">.</span><span class="token function">t</span><span class="token punctuation">(</span><span class="token string">"&lt;CR>&lt;C-o>O"</span><span class="token punctuation">)</span> <span class="token keyword">end</span> <span class="token comment">-- html indents</span>

  <span class="token keyword">return</span> Util<span class="token punctuation">.</span><span class="token function">t</span><span class="token punctuation">(</span><span class="token string">"&lt;CR>"</span><span class="token punctuation">)</span>
<span class="token keyword">end</span>

<span class="token function">remap</span><span class="token punctuation">(</span>
  <span class="token string">"i"</span><span class="token punctuation">,</span>
  <span class="token string">"&lt;CR>"</span><span class="token punctuation">,</span>
  <span class="token string">"v:lua.Util.trigger_completion()"</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> expr <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span> silent <span class="token operator">=</span> <span class="token keyword">true</span> <span class="token punctuation">&#125;</span>
<span class="token punctuation">)</span>
<span class="token function">remap</span><span class="token punctuation">(</span>
  <span class="token string">"i"</span><span class="token punctuation">,</span>
  <span class="token string">"&lt;Tab>"</span><span class="token punctuation">,</span>
  table<span class="token punctuation">.</span><span class="token function">concat</span><span class="token punctuation">(</span><span class="token punctuation">&#123;</span>
    <span class="token string">"pumvisible() ? "&lt;C-n>" : v:lua.Util.check_backspace()"</span><span class="token punctuation">,</span>
    <span class="token string">"? "&lt;Tab>" : compe#confirm()"</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#125;</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> silent <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span> noremap <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span> expr <span class="token operator">=</span> <span class="token keyword">true</span> <span class="token punctuation">&#125;</span>
<span class="token punctuation">)</span>

<span class="token function">remap</span><span class="token punctuation">(</span>
  <span class="token string">"i"</span><span class="token punctuation">,</span>
  <span class="token string">"&lt;S-Tab>"</span><span class="token punctuation">,</span>
  <span class="token string">"pumvisible() ? "&lt;C-p>" : "&lt;S-Tab>""</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> noremap <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span> expr <span class="token operator">=</span> <span class="token keyword">true</span> <span class="token punctuation">&#125;</span>
<span class="token punctuation">)</span>
<span class="token function">remap</span><span class="token punctuation">(</span>
  <span class="token string">"i"</span><span class="token punctuation">,</span>
  <span class="token string">"&lt;C-Space>"</span><span class="token punctuation">,</span>
  <span class="token string">"compe#complete()"</span><span class="token punctuation">,</span>
  <span class="token punctuation">&#123;</span> noremap <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span> expr <span class="token operator">=</span> <span class="token keyword">true</span><span class="token punctuation">,</span> silent <span class="token operator">=</span> <span class="token keyword">true</span> <span class="token punctuation">&#125;</span>
<span class="token punctuation">)</span></code>`}</pre>
<p>You can get the full config for my completion setup <a href="${"https://github.com/elianiva/dotfiles/blob/5f813d893ff5a5928bac52995d6b4f806a8b3d2a/nvim/.config/nvim/lua/plugins/_completion.lua"}" rel="${"nofollow"}">here</a></p>
<h1 id="${"closing-note"}"><a href="${"#closing-note"}">Closing Note</a></h1>
<p>I\u2019m pretty pleased with my current setup. Kudos to Neovim\u2019s developer that brings LSP client to be a built-in feature! These are of course some other great LSP client alternatives for (Neo)vim, definitely check them out!</p>
<ul><li><a href="${"https://github.com/neoclide/coc.nvim"}" rel="${"nofollow"}">coc.nvim</a> (highly recommend this if you\u2019re just getting started)</li>
<li><a href="${"https://github.com/autozimu/LanguageClient-neovim"}" rel="${"nofollow"}">LanguageClient-neovim</a></li>
<li><a href="${"https://github.com/prabirshrestha/vim-lsp"}" rel="${"nofollow"}">vim-lsp</a></li>
<li><a href="${"https://github.com/dense-analysis/ale"}" rel="${"nofollow"}">ALE</a></li></ul>
<p>Here\u2019s my <a href="${"https://github.com/elianiva/dotfiles/tree/master/nvim/.config/nvim/lua/modules/lsp"}" rel="${"nofollow"}">whole LSP config</a> if you want them. If you\u2019ve read this far then thank you and have a wonderful day :)</p>`
  })}`;
});
var index$8 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: My_nvim_lsp_setup,
  metadata: metadata$8
});
const metadata$7 = {
  title: "My Setup Using Suckless Software",
  date: "2020-06-04T00:00:00.000Z",
  desc: "A post where I fully explain about my setup using suckless's softwares",
  tags: ["linux", "window manager"]
};
const My_suckless_setup = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$7), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#window-manager"}">Window Manager</a></p>
<ul><li><a href="${"#dwm-dynamic-window-manager"}">DWM (Dynamic Window Manager)</a></li>
<li><a href="${"#installation"}">Installation</a></li>
<li><a href="${"#patching"}">Patching</a></li>
<li><a href="${"#statusbar"}">Statusbar</a></li></ul></li>
<li><p><a href="${"#app-launcher"}">App Launcher</a></p>
<ul><li><a href="${"#dmenu"}">Dmenu</a></li>
<li><a href="${"#installation-1"}">Installation</a></li>
<li><a href="${"#patching-1"}">Patching</a></li></ul></li>
<li><p><a href="${"#terminal"}">Terminal</a></p>
<ul><li><a href="${"#st-simple-terminal"}">ST (Simple Terminal)</a></li>
<li><a href="${"#installation-2"}">Installation</a></li>
<li><a href="${"#patching-2"}">Patching</a></li></ul></li>
<li><p><a href="${"#tips"}">Tips</a></p>
<ul><li><a href="${"#handling-rejected-patch"}">Handling Rejected Patch</a></li>
<li><a href="${"#using-vcs"}">Using VCS</a></li>
<li><a href="${"#enabling-colour-emoji-support"}">Enabling colour emoji support</a></li>
<li><a href="${"#desktop-files"}">Desktop files</a></li></ul></li>
<li><p><a href="${"#resources"}">Resources</a></p></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Hi! In this post, I\u2019ll go through about my current setup using suckless programs. Some people like suckless software (including me) and some of them hate it, whether if it\u2019s because they don\u2019t like patching stuff, or they don\u2019t like suckless philosophy which they don\u2019t want to exceed a certain number of lines.</p>
<h1 id="${"window-manager"}"><a href="${"#window-manager"}">Window Manager</a></h1>
<h2 id="${"dwm-dynamic-window-manager"}"><a href="${"#dwm-dynamic-window-manager"}">DWM (Dynamic Window Manager)</a></h2>
<p>Suckless has a window manager called DWM which stands for Dynamic Window Manager. It has less than ~2000 SLOC and to be honest, I don\u2019t really care about the lines of code limit. I just like this Window Manager purely because of its features.</p>
<p>DWM has 3 layouts by default. They are tiling with master and stack layout, floating, and monocle. One of the reasons I chose DWM is because of the master and stack layout. There are some WM with master and stack layout except DWM, but I don\u2019t like them as much as DWM. For example, I don\u2019t want AwesomeWM because I don\u2019t fancy writing config in Lua.</p>
${validate_component(Update, "Update").$$render($$result, {date: "27-10-2020"}, {}, {
      default: () => `<p>lmao guess who\u2019s suddently got so obsessed with Lua and decided to use AwesomeWM</p>`
    })}
<p>Another example is Xmonad, that\u2019s an instant big no. It has a ton of Haskell dependencies and its config file is written in Haskell which I never heard of until I found out this WM. I\u2019m not saying that it\u2019s bad, I just don\u2019t want to write Haskell.</p>
<h2 id="${"installation"}"><a href="${"#installation"}">Installation</a></h2>
<p>Suckless way of installing software is compiling it from the source. It\u2019s so easy, you literally need to run 2 commands and then you\u2019re done. I use <a href="${"https://dl.suckless.org/dwm/dwm-6.2.tar.gz"}" rel="${"nofollow"}">DWM 6.2</a></p>
<p>I always went with the tarball because the git version always gave me a headache when I patch it. To install DWM, you need to <code>cd</code> into dwm directory and run</p>
<pre class="${"language-bash"}">${`<code class="language-bash">$ <span class="token function">make</span> <span class="token operator">&amp;&amp;</span> <span class="token function">sudo</span> <span class="token function">make</span> <span class="token function">install</span></code>`}</pre>
<p>That\u2019s it. DWM is compiled and installed. It only took a couple of seconds on my X220.</p>
<h2 id="${"patching"}"><a href="${"#patching"}">Patching</a></h2>
<p>One of the suckless key features is patching. To add new functionality, you need to patch it your own. I honestly like this concept. They gave you a bare minimum software that you can add some features by patching it on your own.</p>
<p>I personally use 5 of them and a little bit of tweaking on <code>dwm.c</code> file. Here are those patches.</p>
<ul><li><p><a href="${"https://dwm.suckless.org/patches/actualfullscreen/"}" rel="${"nofollow"}"><strong>Actual Fullscreen</strong></a></p>
<p>As its name suggests, it enables actual fullscreen behaviour instead of toggling the bar off and go to monocle mode.</p></li>
<li><p><a href="${"https://dwm.suckless.org/patches/pertag/"}" rel="${"nofollow"}"><strong>Per Tag</strong></a></p>
<p>This patch enables per tag behaviour which means if you enable floating mode on the first tag, it won\u2019t be applied to another tag. I like this behaviour more than DWM\u2019s default behaviour which applies to all of the available tags.</p></li>
<li><p><a href="${"https://dwm.suckless.org/patches/status2d/"}" rel="${"nofollow"}"><strong>Status2d</strong></a></p>
<p>This patch gives you a new syntax for statusbar colour. It also capable of drawing rectangles to your statusbar but I personally don\u2019t use it. I only use it for changing my statusbar icon colour.</p></li>
<li><p><a href="${"https://dwm.suckless.org/patches/vanitygaps/"}" rel="${"nofollow"}"><strong>Vanity Gaps</strong></a></p>
<p>The most essential feature of a window manager for me. If a tiling window manager doesn\u2019t have this feature, I won\u2019t use it. It makes me feel less claustrophobic.</p></li>
<li><p><a href="${"https://dwm.suckless.org/patches/swallow/"}" rel="${"nofollow"}"><strong>Swallow Patch</strong></a></p>
<p>I recently use this patch to fix the usual behaviour when you open a program that spawns another window from terminal, the terminal window doesn\u2019t do anything but it stays there. If you close it, the program will also get killed. This patch allows you to spawn a program from terminal and that program will take the terminal window instead of spawning a new one. If you close the program, your terminal still there.</p></li></ul>
<ul><li><p><strong>Centered</strong></p>
<p>I modify the original isCenter patch so I don\u2019t have to define which class that needs to be centered, I just apply it globally. If you interested in how it looks, here it is.</p>
<pre class="${"language-cpp"}">${`<code class="language-cpp"><span class="token comment">// center floating window</span>
<span class="token keyword">if</span> <span class="token punctuation">(</span>c<span class="token operator">-></span>x <span class="token operator">==</span> selmon<span class="token operator">-></span>wx<span class="token punctuation">)</span> c<span class="token operator">-></span>x <span class="token operator">+=</span> <span class="token punctuation">(</span>c<span class="token operator">-></span>mon<span class="token operator">-></span>ww <span class="token operator">-</span> <span class="token function">WIDTH</span><span class="token punctuation">(</span>c<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token operator">/</span> <span class="token number">2</span> <span class="token operator">-</span> c<span class="token operator">-></span>bw<span class="token punctuation">;</span>
<span class="token keyword">if</span> <span class="token punctuation">(</span>c<span class="token operator">-></span>y <span class="token operator">==</span> selmon<span class="token operator">-></span>wy<span class="token punctuation">)</span> c<span class="token operator">-></span>y <span class="token operator">+=</span> <span class="token punctuation">(</span>c<span class="token operator">-></span>mon<span class="token operator">-></span>wh <span class="token operator">-</span> <span class="token function">HEIGHT</span><span class="token punctuation">(</span>c<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token operator">/</span> <span class="token number">2</span> <span class="token operator">-</span> c<span class="token operator">-></span>bw<span class="token punctuation">;</span></code>`}</pre>
<p>Place it inside <code>manage(Window w, XWindowAttributes *wa)</code> function in between of <code>wc.border_width = c-&gt;bw;</code> and <code>XConfigureWindow(dpy, w, CWBorderWidth, &amp;wc);</code>, then recompile it. That\u2019s it, you\u2019re done.</p></li>
<li><p><strong>No Monocle Border</strong></p>
<p>I don\u2019t like any border when in monocle mode so I tried to use no border patch and it doesn\u2019t work, I don\u2019t know why. So I add this code that I found on the internet instead.</p>
<pre class="${"language-cpp"}">${`<code class="language-cpp"><span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>monocle <span class="token operator">==</span> c<span class="token operator">-></span>mon<span class="token operator">-></span>lt<span class="token punctuation">[</span>c<span class="token operator">-></span>mon<span class="token operator">-></span>sellt<span class="token punctuation">]</span><span class="token operator">-></span>arrange<span class="token punctuation">)</span> <span class="token operator">&amp;&amp;</span> <span class="token punctuation">(</span><span class="token operator">!</span>c<span class="token operator">-></span>isfloating<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
      wc<span class="token punctuation">.</span>border_width <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
      c<span class="token operator">-></span>w <span class="token operator">=</span> wc<span class="token punctuation">.</span>width <span class="token operator">+=</span> c<span class="token operator">-></span>bw <span class="token operator">*</span> <span class="token number">2</span><span class="token punctuation">;</span>
      c<span class="token operator">-></span>h <span class="token operator">=</span> wc<span class="token punctuation">.</span>height <span class="token operator">+=</span> c<span class="token operator">-></span>bw <span class="token operator">*</span> <span class="token number">2</span><span class="token punctuation">;</span>
  <span class="token punctuation">&#125;</span></code>`}</pre>
<p>Add that to <code>resizeclient(Client *c, int x, int y, int w, int h)</code> function after <code>wc.border_width = c-&gt;bw;</code> then recompile it.</p></li>
<li><p><strong>Change Bar Height</strong></p>
<p>By default, DWM define bar height by calculating font size and adding 2px on top and bottom. It looks ugly to me, I want to be able to define my bar height. So I replaced some code with this.</p>
<pre class="${"language-cpp"}">${`<code class="language-cpp"><span class="token comment">// previous</span>
bh <span class="token operator">=</span> drw<span class="token operator">-></span>fonts<span class="token operator">-></span>h <span class="token operator">+</span> <span class="token number">2</span><span class="token punctuation">;</span>

<span class="token comment">// new</span>
bh <span class="token operator">=</span> user_bh <span class="token operator">?</span> user_bh <span class="token operator">:</span> drw<span class="token operator">-></span>fonts<span class="token operator">-></span>h <span class="token operator">+</span> <span class="token number">2</span><span class="token punctuation">;</span>

<span class="token comment">// config.h</span>
<span class="token keyword">static</span> <span class="token keyword">const</span> <span class="token keyword">int</span> user_bh <span class="token operator">=</span> <span class="token number">28</span><span class="token punctuation">;</span></code>`}</pre></li></ul>
<p>Those are all of my patches. I tried to make it as minimal as possible but keeping the look and feel that I like. If you don\u2019t know how to apply a patch, here\u2019s an example.</p>
<pre class="${"language-bash"}">${`<code class="language-bash">$ patch -p1 <span class="token operator">&lt;</span> ./path/to/patch.diff</code>`}</pre>
<p>Make sure you\u2019re currently on the DWM directory, otherwise it wouldn\u2019t work. As you can see, applying a patch is simple.</p>
<h2 id="${"statusbar"}"><a href="${"#statusbar"}">Statusbar</a></h2>
<p>For the status bar itself, I use <a href="${"https://github.com/torrinfail/dwmblocks"}" rel="${"nofollow"}">DWM Blocks</a> and <a href="${"https://github.com/expectocode/bar"}" rel="${"nofollow"}">Lemonbar</a>. Why do I use 2 status bars you might ask. Well, I\u2019ll explain later because it\u2019s quite a stupid reason.</p>
<p>I use <strong>DWM Blocks</strong> because it\u2019s able to update each module with different intervals. For example, I update my <code>date</code> module every 1 minute and I can set my <code>cpu</code> module to update every 2 seconds. All of my modules are written in <code>dash</code>, a lightweight POSIX shell. You can check all of my modules <a href="${"https://github.com/elianiva/dotfiles/tree/master/scripts/.scripts/statusbar"}" rel="${"nofollow"}">here</a>.</p>
<p>Now, the reason I use <strong>Lemonbar</strong> is that I want to draw a bottom border for DWM status bar. It\u2019s stupid, yes I\u2019m fully aware of that. I can\u2019t find any patch to draw a border on DWM statusbar and I\u2019m not familiar with C, so I use this trick instead.</p>
<p>It\u2019s simple, you just need to draw Lemonbar with full width, how many px of height you want, and fill the offsetY matching your DWM statusbar height. Here\u2019s what I did on my autostart.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token builtin class-name">echo</span> <span class="token string">""</span> <span class="token operator">|</span> lemonbar -g x1+0+28 -d -B <span class="token string">"#82aaff"</span> -p <span class="token operator">&amp;</span></code>`}</pre>
<p>It\u2019s stupid, but hey, it works. I won\u2019t complain \u30C4.</p>
<h1 id="${"app-launcher"}"><a href="${"#app-launcher"}">App Launcher</a></h1>
<h2 id="${"dmenu"}"><a href="${"#dmenu"}">Dmenu</a></h2>
<p>Dmenu is a piece of software to find a program name and execute it. But it\u2019s more than that. Basically, you pipe it some lines then it spits back the line you\u2019ve chosen to stdout. Let me give you an example of that.</p>
<pre class="${"language-bash"}">${`<code class="language-bash"><span class="token builtin class-name">echo</span> <span class="token string">"yes<span class="token entity" title="&#92;n">&#92;n</span>no"</span> <span class="token operator">|</span> dmenu</code>`}</pre>
<p>That simple command is echo-ing <code>yes</code> and <code>no</code> and piping it to dmenu. It will give you a dmenu prompt that you can type to choose the option or simply move the selection. If you press <code>ESC</code>, it will close dmenu prompt, but if you select one of them, it will give your selection to stdout which you can then process it however you want.</p>
<h2 id="${"installation-1"}"><a href="${"#installation-1"}">Installation</a></h2>
<p>Just like any other suckless software, the way you should install it is by compiling it from the source. I use the <a href="${"https://dl.suckless.org/tools/dmenu-4.9.tar.gz"}" rel="${"nofollow"}">tarball</a> of it. You know the drill, <code>cd</code> to that directory and run</p>
<pre class="${"language-bash"}">${`<code class="language-bash">$ <span class="token function">make</span> <span class="token operator">&amp;&amp;</span> <span class="token function">sudo</span> <span class="token function">make</span> <span class="token function">install</span></code>`}</pre>
<p>Out of the box, it\u2019s very usable already. But, it looks ugly to me. I want to add just 1 patch to make it look a bit better.</p>
<h2 id="${"patching-1"}"><a href="${"#patching-1"}">Patching</a></h2>
<p>As I said, I only use 1 patch for dmenu and that patch is\u2026</p>
<ul><li><p><a href="${"https://tools.suckless.org/dmenu/patches/line-height/"}" rel="${"nofollow"}"><strong>Lineheight</strong></a>.</p>
<p>It gives dmenu the ability to set the line-height by changing the <code>line-height</code> variable. I set it to 28 and my font size is 11.</p>
<pre class="${"language-c"}">${`<code class="language-c"><span class="token keyword">static</span> <span class="token keyword">unsigned</span> <span class="token keyword">int</span> lineheight <span class="token operator">=</span> <span class="token number">28</span><span class="token punctuation">;</span></code>`}</pre></li></ul>
<h1 id="${"terminal"}"><a href="${"#terminal"}">Terminal</a></h1>
<h2 id="${"st-simple-terminal"}"><a href="${"#st-simple-terminal"}">ST (Simple Terminal)</a></h2>
<p>Suckless have a terminal called <strong>ST</strong> or <strong>Simple Terminal</strong> or <strong>Suckless Terminal</strong>. It\u2019s the best terminal in my opinion. It supports true colour, ligatures, box drawing, unicode support, and more stuff that you can achieve by applying some patches.</p>
${validate_component(Update, "Update").$$render($$result, {date: "27-10-2020"}, {}, {
      default: () => `<p>Some of you might think it\u2019s the best, but then I came across <a href="${"https://github.com/alacritty/alacritty"}" rel="${"nofollow"}">Alacritty</a> and it\u2019s instantly became my new \u201Cbest terminal\u201D out there.</p>`
    })}
<p>It\u2019s <em>ultra</em> minimal out of the box. You don\u2019t even have a scroll feature builtin. It\u2019s reasonable because not everyone needs a scroll feature. For example, if you use <strong>tmux</strong> then the scroll feature would be redundant.</p>
<h2 id="${"installation-2"}"><a href="${"#installation-2"}">Installation</a></h2>
<p>As usual, I use the tarball version and it\u2019s currently at v0.8.3 which you can get from <a href="${"https://dl.suckless.org/st/st-0.8.3.tar.gz"}" rel="${"nofollow"}">here</a>. <code>cd</code> into that directory and run</p>
<pre class="${"language-bash"}">${`<code class="language-bash">$ <span class="token function">make</span> <span class="token operator">&amp;&amp;</span> <span class="token function">sudo</span> <span class="token function">make</span> <span class="token function">install</span></code>`}</pre>
<p>There you have it, a barebone installation of ST. To be honest, I can\u2019t use ST without applying some patches. I need some features that are provided by patches.</p>
<h2 id="${"patching-2"}"><a href="${"#patching-2"}">Patching</a></h2>
<p>I use quite a lot of patches for ST. Mainly for the appearance. Here\u2019s my list of patches.</p>
<ul><li><p><a href="${"https://st.suckless.org/patches/boxdraw"}" rel="${"nofollow"}"><strong>Boxdraw</strong></a></p>
<p>This patch allows a line to be drawn gapless. I use this so that lines like tmux borders, fzf pop-up border, stuff like gotop, ytop, etc. This patch makes them look <em>way</em> better.</p></li>
<li><p><a href="${"https://st.suckless.org/patches/bold-is-not-bright/"}" rel="${"nofollow"}"><strong>Bold is not bright</strong></a></p>
<p>This patch makes bold font the same colour as the regular font. I hate it when bold letters have a different colour than the regular ones.</p></li>
<li><p><a href="${"https://st.suckless.org/patches/clipboard"}" rel="${"nofollow"}"><strong>Clipboard</strong></a></p>
<p>This patch makes ST use the same clipboard that the browser uses. I don\u2019t like the default ST behaviour.</p></li>
<li><p><a href="${"https://st.suckless.org/patches/scrollback/"}" rel="${"nofollow"}"><strong>Scrollback</strong></a></p>
<p>This patch enables scrolling on <strong>ST</strong> like most terminal out there. I can\u2019t use ST without this feature because I don\u2019t use <strong>tmux</strong> that often.</p></li>
<li><p><a href="${"https://st.suckless.org/patches/font2/"}" rel="${"nofollow"}"><strong>Font2</strong></a></p>
<p>This patch makes ST be able to set a fallback font. For example, I use Iosevka which doesn\u2019t support CJK characters so I use Noto Sans CJK for the fallback to be able to render them properly.</p></li>
<li><p><a href="${"https://st.suckless.org/patches/ligatures/"}" rel="${"nofollow"}"><strong>Ligatures</strong></a></p>
<p>This is my favorite patch out of all of them. I can enjoy those sweet ligatures on ST rather than having to change to Kitty. It\u2019s a bit buggy though if you scroll up the prompt will follow you. It doesn\u2019t bother that much so I ignore that.</p></li>
<li><p><a href="${"https://st.suckless.org/patches/xresources/"}" rel="${"nofollow"}"><strong>Xresources</strong></a></p>
<p>This patch makes ST apply colours from <code>.xresources</code>. I like this approach rather than changing its <code>config.h</code> to change the colour scheme.</p></li>
<li><p><strong>Palenight Colour Scheme</strong></p>
<p>I change the default colour scheme on my build to Palenight. It\u2019s such a great colour scheme and I love it.</p></li></ul>
<h1 id="${"tips"}"><a href="${"#tips"}">Tips</a></h1>
<h2 id="${"handling-rejected-patch"}"><a href="${"#handling-rejected-patch"}">Handling Rejected Patch</a></h2>
<p>Sometimes when you are patching, the patch has a conflict with another patch. It\u2019s easy to solve actually, it tells you where you have to fix it on the log message. It also gives you a file with a <code>.rej</code> suffix that contains all of the rejected changes. Here\u2019s an example of it.</p>
<pre class="${"language-diff"}">${`<code class="language-diff"><span class="token coord">--- dwm.c</span>
<span class="token coord">+++ dwm.c</span>
@@ -163,6 +163,7 @@ static void detach(Client *c);
<span class="token unchanged"><span class="token prefix unchanged"> </span><span class="token line">static Monitor *dirtomon(int dir);
</span><span class="token prefix unchanged"> </span><span class="token line">static void drawbar(Monitor *m);
</span><span class="token prefix unchanged"> </span><span class="token line">static void drawbars(void);
</span></span><span class="token inserted-sign inserted"><span class="token prefix inserted">+</span><span class="token line">static int drawstatusbar(Monitor *m, int bh, char* text);
</span></span><span class="token unchanged"><span class="token prefix unchanged"> </span><span class="token line">static void enternotify(XEvent *e);
</span><span class="token prefix unchanged"> </span><span class="token line">static void expose(XEvent *e);
</span><span class="token prefix unchanged"> </span><span class="token line">static void focus(Client *c);
</span></span>@@ -237,7 +238,7 @@ static void zoom(const Arg *arg);

<span class="token unchanged"><span class="token prefix unchanged"> </span><span class="token line">/* variables */
</span><span class="token prefix unchanged"> </span><span class="token line">static const char broken[] = "broken";
</span></span><span class="token deleted-sign deleted"><span class="token prefix deleted">-</span><span class="token line">static char stext[256];
</span></span><span class="token inserted-sign inserted"><span class="token prefix inserted">+</span><span class="token line">static char stext[1024];
</span></span><span class="token unchanged"><span class="token prefix unchanged"> </span><span class="token line">static int screen;
</span><span class="token prefix unchanged"> </span><span class="token line">static int sw, sh;           /* X display screen geometry width, height */
</span><span class="token prefix unchanged"> </span><span class="token line">static int bh, blw = 0;      /* bar geometry */</span></span></code>`}</pre>
<p>All you need to do is find some lines that match the surrounding of the line with <code>-</code> or <code>+</code> prefix, then replace it according to it. As you can see on the 7th line, there\u2019s a line with <code>+</code> prefix. That means you need to add it to the original file which in this case is <code>dwm.c</code>. All you have to do is fine that surrounding lines and place it there. If it has a <code>-</code> prefix, you need to remove it.</p>
<h2 id="${"using-vcs"}"><a href="${"#using-vcs"}">Using VCS</a></h2>
<p>I found that using VCS like <strong>Git</strong> is quite useful if you want to add a patch but don\u2019t want to ruin your current build. Make a new branch of your current build and then patch it, that way you can always go to the other branch if you messed up. If you don\u2019t know how to set up a repo, <a href="${"https://opensource.com/article/18/1/step-step-guide-git"}" rel="${"nofollow"}">this might help</a> you getting started.</p>
<h2 id="${"enabling-colour-emoji-support"}"><a href="${"#enabling-colour-emoji-support"}">Enabling colour emoji support</a></h2>
<p>By default, suckless software doesn\u2019t support colour emoji like this \u{1F44C}. You have to remove the code that blocks it and install <code>libxft-bgra</code>. The file is called <code>drw.c</code> and the part that you need to remove is</p>
<pre class="${"language-c"}">${`<code class="language-c"><span class="token comment">/* Do not allow using color fonts. This is a workaround for a BadLength
 * error from Xft with color glyphs. Modelled on the Xterm workaround. See
 * https://bugzilla.redhat.com/show_bug.cgi?id=1498269
 * https://lists.suckless.org/dev/1701/30932.html
 * https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=916349
 * and lots more all over the internet.
 */</span>
FcBool iscol<span class="token punctuation">;</span>
<span class="token keyword">if</span><span class="token punctuation">(</span><span class="token function">FcPatternGetBool</span><span class="token punctuation">(</span>xfont<span class="token operator">-></span>pattern<span class="token punctuation">,</span> FC_COLOR<span class="token punctuation">,</span> <span class="token number">0</span><span class="token punctuation">,</span> <span class="token operator">&amp;</span>iscol<span class="token punctuation">)</span> <span class="token operator">==</span> FcResultMatch <span class="token operator">&amp;&amp;</span> iscol<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token function">XftFontClose</span><span class="token punctuation">(</span>drw<span class="token operator">-></span>dpy<span class="token punctuation">,</span> xfont<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span></code>`}</pre>
<p>After removing that, make sure you got <code>libxft-bgra</code> installed. Otherwise, it won\u2019t work.</p>
<h2 id="${"desktop-files"}"><a href="${"#desktop-files"}">Desktop files</a></h2>
<p>If you noticed, there\u2019s no .desktop files after installing suckless software. You can either add it yourself or apply a patch for it. I prefer adding it myself. Here\u2019s an example of my <code>dwm.desktop</code> located on <code>/usr/share/xsessions/</code></p>
<pre class="${"language-null"}">${`<code class="language-null">[Desktop Entry]
Name=dwm
Comment=dynamic window manager
Exec=dwm
Type=Application</code>`}</pre>
<p>I don\u2019t need ST desktop entry since I launch ST using keybind or dmenu which doesn\u2019t need it. If you launch it from <strong>Rofi</strong> or something like that, you\u2019ll need the desktop entry file.</p>
<h1 id="${"resources"}"><a href="${"#resources"}">Resources</a></h1>
<p>If you want to get all of my suckless builds, you can get it on my <a href="${"https://github.com/elianiva/suckless/"}" rel="${"nofollow"}">Github repo </a> and <a href="${"https://github.com/elianiva/dotfiles/blob/master/scripts/.scripts/"}" rel="${"nofollow"}">here</a> are my scripts.</p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>I like the suckless software because it works great and I like their way of distributing their stuff. They give you a barebones software that you can add some features through patches. This can get overwhelming since they have <em>a lot</em> of patches, like <em>a lot</em>.</p>
<p>All right then, thanks for reading this lengthy post. I hope you learn something new from this. Have a nice day!</p>`
  })}`;
});
var index$7 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: My_suckless_setup,
  metadata: metadata$7
});
const metadata$6 = {
  title: "Why I use Linux instead of other OS",
  date: "2020-02-27T00:00:00.000Z",
  desc: "A post where I try to explain why I use this beautiful and awesome operating system called Linux",
  tags: ["linux"]
};
const Why_i_use_linux = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$6), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#origin"}">Origin</a></p>
<ul><li><a href="${"#my-first-laptop"}">My first laptop</a></li>
<li><a href="${"#how-i-know-linux"}">How I know Linux</a></li>
<li><a href="${"#my-first-distribution"}">My first distribution</a></li>
<li><a href="${"#changing-distribution"}">Changing distribution</a></li></ul></li>
<li><p><a href="${"#why-linux"}">Why Linux?</a></p></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Hello internet people of the internet! In this post, I will explain the reason why I use Linux and how I know Linux. Well, the correct term here should be GNU/Linux but it\u2019s <em>way</em> too long let\u2019s be honest. So, whenever I say Linux, what I mean is GNU/Linux. Let\u2019s start with how I know Linux.</p>
<h1 id="${"origin"}"><a href="${"#origin"}">Origin</a></h1>
<h2 id="${"my-first-laptop"}"><a href="${"#my-first-laptop"}">My first laptop</a></h2>
<p>It all started when I want to buy my first laptop. Roughly about 9 months ago. It runs Intel Celeron N4000 processor, which is pretty bad (yeah, I know). At that time, I didn\u2019t know about Thinkpad which most of people said has the best value for its price. So, I do some quick research on how <del>slow</del> fast this processor runs. It turns out, it\u2019s pretty bad.</p>
<h2 id="${"how-i-know-linux"}"><a href="${"#how-i-know-linux"}">How I know Linux</a></h2>
<p>I heard a lot of people say that Windows 10 is heavy for a slow processor like mine. It\u2019s bloat, it\u2019s too heavy, too many things going on, there\u2019s some malicious virus that can easily infect your computer, yaddi yadda. To be honest, I became a bit sad at that time. Then I came across a post on Facebook saying something like \u201CTry Linux if your laptop/pc isn\u2019t powerful enough to run windows.\u201D Then I start to wonder, what is this guy talking about? Linux? I never heard that before.</p>
<p>I became interested in that. Bare in mind that I don\u2019t have any laptop yet. I don\u2019t know why I love to read some articles about Linux and joined on several groups even if I don\u2019t have any machine that runs Linux (I even help people solve issues that they have on their Linux machine even though I don\u2019t have any laptop. That\u2019s quite something if you ask me). It\u2019s an interesting operating system (mainly because I never heard of it). Somehow, I like the fact that most people don\u2019t use it. I like to be different. Finally, after about a month, I bought my very first laptop.</p>
<h2 id="${"my-first-distribution"}"><a href="${"#my-first-distribution"}">My first distribution</a></h2>
<p>Linux has so many distributions. Like, a gazillion of them. But from what I observe, there are only a few \u201Cbig boys\u201D that stands out from the others. Some of them are Debian, Ubuntu, Arch, Manjaro, OpenSUSE, Fedora, RHEL, PopOS, etc. I got confused easily on which one is the best for me. Then I decided to check what\u2019s that guy is using on Facebook.</p>
<p>The guy on Facebook runs <a href="${"https://manjaro.org"}" rel="${"nofollow"}">Manjaro Linux</a>. I was like, \u201CWhy did he choose that? That\u2019s a silly name for Linux.\u201D Not gonna lie, that\u2019s my first impression lol. About a week later, I tried to install one of Linux distribution after getting convinced enough. The one that I chose was <a href="${"https://linuxmint.com"}" rel="${"nofollow"}">Linux Mint</a>. At that time, I installed Linux Mint 19.1 XFCE Edition. I was so happy to be able to install Linux. Unfortunately, I lost my first screenshot on Linux Mint.</p>
<h2 id="${"changing-distribution"}"><a href="${"#changing-distribution"}">Changing distribution</a></h2>
<p>A month has passed. I feel pretty comfortable with Linux. Then, there was this news saying that Ubuntu dropped their support for 32bit libraries. Do you remember that news? I was like, \u201CWell, that\u2019s fine I guess. What\u2019s wrong with that?\u201D Little did I know, 32bit libraries are what most games depend on. Then I started to panic and confused lmao.</p>
<p>I was like, \u201COh come on. I\u2019m already comfortable with my current setup. I still want to play some games but I don\u2019t want to change my distribution.\u201D Yep, that\u2019s literally what I said. And you know what? f*** it. Imma change my distribution. I decided to choose Manjaro since it\u2019s not based on Ubuntu. Yep, the one that I\u2019ve mentioned before. A distribution that I thought has a stupid name (I felt so guilty now lol). Then I started to think, \u201CWho cares about names anyway. As long as it is usable, it\u2019s good.\u201D</p>
<p>Finally, I installed it. I took a quick screenshot after installing it because I was so excited. Here, take a look!</p>
<p><img src="${"/assets/post/why-i-use-linux/manjaro.png"}" alt="${"manjaro"}"></p>
<p>Manjaro is based on Arch. Some people say that it\u2019s Arch without all of its fuss. I mean, it\u2019s true. At the time I\u2019m writing this, I use Arch. For beginners that want to try Archlinux, it\u2019s a good starting point. I ended up using it for nearly 8 months. It was a great experience.</p>
<h1 id="${"why-linux"}"><a href="${"#why-linux"}">Why Linux?</a></h1>
<p>So, why do I use Linux then? Well, let me give you a quick list of why Linux is better than the other OS</p>
<ul><li><p><strong>It\u2019s free</strong></p>
<p>Linux is free both in price and free as in freedom. You don\u2019t have to pay for license and you can do anyting you want with it. You can customize your Desktop Environment (look and feel) or even build your very own kernel!</p></li>
<li><p><strong>It\u2019s lightweight</strong></p>
<p>Linux is so lightweight. It can bring your old hardware to life. There\u2019s this joke that says \u201CLinux can run on everything\u201D. Starting from <a href="${"https://www.thirtythreeforty.net/posts/2019/12/my-business-card-runs-linux/"}" rel="${"nofollow"}">business card</a> (yes, there\u2019s someone out there who built their business card with Linux inside it) until your high end $50000 beast or whatever.</p></li>
<li><p><strong>It\u2019s secure</strong></p>
<p>Linux is very secure. That\u2019s why most of servers around the world is using Linux for it. You don\u2019t have to worry to install antivirus to prevent ransomware getting into your system. No need to worry on that stuff.</p></li>
<li><p><strong>There\u2019s always something to learn</strong></p>
<p>Like, seriously. You can always learn something new everyday. There are so much good stuff that you can learn from Linux. If you like something challenging, go ahead and try Linux.</p></li>
<li><p><strong>Package Manager</strong></p>
<p>Now this is the stuff that makes me really love Linux. Linux has a centralized place to download any app that you want. You don\u2019t need to go to some kind of obscure website and find the correct download link. You just need to <code>apt install</code> or <code>pacman -S</code> any package that you want and it\u2019s totally secure.</p></li></ul>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>At first, I\u2019m afraid that I can\u2019t install Windows on my new laptop. Who would\u2019ve thought that in the end, I use Archlinux which some people say that it\u2019s difficult to install. I think it\u2019s not that hard, follow the wiki and you\u2019re set (said someone who had failed to install Archlinux 3 times lmao).</p>
<p>Alright, this post will end right here. I might post why I use VIM/Window Managers next time. See ya in the next post everyone, have a good day!</p>`
  })}`;
});
var index$6 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Why_i_use_linux,
  metadata: metadata$6
});
const metadata$5 = {
  title: "Using github actions for SSG deployment",
  date: "2020-08-01T00:00:00.000Z",
  desc: "Utilizing github action to automate boring stuff which is building and deploying SSG manually",
  tags: ["website"]
};
const Github_actions = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$5), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#initial-setup"}">Initial Setup</a></p>
<ul><li><a href="${"#removing-travis-ci"}">Removing Travis CI</a></li>
<li><a href="${"#setting-up-github-action"}">Setting up Github Action</a></li></ul></li>
<li><p><a href="${"#configuration"}">Configuration</a></p>
<ul><li><a href="${"#file-configuration"}">File configuration</a></li>
<li><a href="${"#see-it-in-action"}">See it in action</a></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Previously, I use <a href="${"https://travis-ci.org"}" rel="${"nofollow"}">Travis CI</a> to automatically deploy my site so if I push an update to my repo it will trigger a build and deploy it to github page. Turns out, github has a built in feature for CI/CD called <strong>Github Actions</strong>. In this post, I\u2019ll tell you how my experience using it.</p>
<h1 id="${"initial-setup"}"><a href="${"#initial-setup"}">Initial Setup</a></h1>
<h2 id="${"removing-travis-ci"}"><a href="${"#removing-travis-ci"}">Removing Travis CI</a></h2>
<p>Because my previous site is using <a href="${"https://travis-ci.org"}" rel="${"nofollow"}">Travis CI</a>, I need to delete the old <code>travis.yml</code>. If you haven\u2019t use any CI/CD before then just skip this step.</p>
<h2 id="${"setting-up-github-action"}"><a href="${"#setting-up-github-action"}">Setting up Github Action</a></h2>
<p>To get started, you will need a file called whatever you want inside <code>.github/worksflows/</code> on your root project, I call it <code>main.yml</code>. You can also go to <strong>Actions</strong> tab on your repo and you\u2019ll find a bunch of preset that github gives you which you can then modify according to your wish.</p>
<h1 id="${"configuration"}"><a href="${"#configuration"}">Configuration</a></h1>
<h2 id="${"file-configuration"}"><a href="${"#file-configuration"}">File configuration</a></h2>
<p>The yaml file is pretty simple, here\u2019s mine and I\u2019ll explain it briefly each part.</p>
<pre class="${"language-yaml"}">${`<code class="language-yaml"><span class="token key atrule">name</span><span class="token punctuation">:</span> Build and deploy

<span class="token key atrule">on</span><span class="token punctuation">:</span>
  <span class="token key atrule">push</span><span class="token punctuation">:</span>
    <span class="token key atrule">branches</span><span class="token punctuation">:</span> master

<span class="token key atrule">jobs</span><span class="token punctuation">:</span>
  <span class="token key atrule">build-and-deploy</span><span class="token punctuation">:</span>
    <span class="token key atrule">runs-on</span><span class="token punctuation">:</span> ubuntu<span class="token punctuation">-</span>latest
    <span class="token key atrule">steps</span><span class="token punctuation">:</span>
    <span class="token punctuation">-</span> <span class="token key atrule">uses</span><span class="token punctuation">:</span> actions/checkout@v2

    <span class="token punctuation">-</span> <span class="token key atrule">name</span><span class="token punctuation">:</span> setup node
      <span class="token key atrule">uses</span><span class="token punctuation">:</span> actions/setup<span class="token punctuation">-</span>node@v2<span class="token punctuation">-</span>beta
      <span class="token key atrule">with</span><span class="token punctuation">:</span>
        <span class="token key atrule">node-version</span><span class="token punctuation">:</span> <span class="token string">'12.x'</span>

    <span class="token punctuation">-</span> <span class="token key atrule">name</span><span class="token punctuation">:</span> install deps
      <span class="token key atrule">run</span><span class="token punctuation">:</span> npm install <span class="token punctuation">-</span><span class="token punctuation">-</span>production

    <span class="token punctuation">-</span> <span class="token key atrule">name</span><span class="token punctuation">:</span> build site
      <span class="token key atrule">run</span><span class="token punctuation">:</span> npm run build

    <span class="token punctuation">-</span> <span class="token key atrule">name</span><span class="token punctuation">:</span> deploy site
      <span class="token key atrule">uses</span><span class="token punctuation">:</span> peaceiris/actions<span class="token punctuation">-</span>gh<span class="token punctuation">-</span>pages@v3
      <span class="token key atrule">with</span><span class="token punctuation">:</span>
        <span class="token key atrule">github_token</span><span class="token punctuation">:</span> $<span class="token punctuation">&#123;</span><span class="token punctuation">&#123;</span> secrets.GITHUB_TOKEN <span class="token punctuation">&#125;</span><span class="token punctuation">&#125;</span>
        <span class="token key atrule">publish_dir</span><span class="token punctuation">:</span> ./public</code>`}</pre>
<ul><li><p><strong>name</strong></p>
<p>Fill this field with whatever you want, it is used as a name for your action that will show up on github.</p></li></ul>
<ul><li><p><strong>on:[action]:[branch]</strong></p>
<p>This field is to tell github what action will trigger the github action. For example, I use <code>push</code> which will trigger github action if I did a push on <code>master</code> branch.</p></li></ul>
<ul><li><p><strong>jobs</strong></p>
<p>This field will be filled with jobs or commands that github action will do based on previous field.</p></li></ul>
<ul><li><p><strong>build</strong></p>
<p>This is the job name, fill it with whatever you want. In my case, I fill it with <code>build-and-deploy</code></p></li></ul>
<ul><li><p><strong>runs-on</strong></p>
<p>This field specify on which platform the action will run. I fill it with <code>ubuntu-latest</code>.</p></li></ul>
<ul><li><p><strong>steps</strong></p>
<p>The steps for your action will go here. There are few steps before deploying my site such as setting up node, installing dependencies, building the site, and then deploy it to github pages.</p>
<ul><li><p><strong>name</strong>
Fill this with the name of your step, <code>setup node</code> for example.</p></li>
<li><p><strong>run</strong>
This is where you define a command to run</p></li>
<li><p><strong>uses</strong>
If you use an external action, fill this in. It\u2019s available <a href="${"https://github.com/marketplace?type=actions"}" rel="${"nofollow"}">here</a></p></li>
<li><p><strong>with</strong>
This is used to pass any additional data such as <code>node-version</code>, <code>GITHUB_TOKEN</code>, etc.</p></li></ul></li></ul>
<p>Those are my brief explanation and how I understand each fields. If you want more details, please visit <a href="${"https://docs.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow"}" rel="${"nofollow"}">this documentation</a>.</p>
<h2 id="${"see-it-in-action"}"><a href="${"#see-it-in-action"}">See it in action</a></h2>
<p>We\u2019ve set up the config file, time to see it in action. Push the config file to the remote repo and go to github action tab.</p>
<p><img src="${"/assets/post/github-actions/1.png"}" alt="${"action tab"}"></p>
<p>If we click one of the action from the list, it will go to its own page which will look like this.</p>
<p><img src="${"/assets/post/github-actions/3.png"}" alt="${"action page"}"></p>
<p>Our action name will show up here. Try to click on that.</p>
<p><img src="${"/assets/post/github-actions/4.png"}" alt="${"action name"}"></p>
<p>It will show this. The log of our action\u2019s jobs.</p>
<p><img src="${"/assets/post/github-actions/5.png"}" alt="${"action jobs"}"></p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>The reason why I moved from Travis CI is not because Travis CI is bad or anything. It\u2019s just I want to try a new thing, plus it\u2019s available on the same site that my repo is hosted. I can just visit one site to check on my repo or my build status.</p>
<p>Not gonna lie, I messed up the first time I did this lol. I messed up the config file (mainly because wrong indentation) and I messed up my repo branch because I had to move my <code>source</code> branch to <code>master</code> branch and I did it in an overcomplicated way.</p>`
  })}`;
});
var index$5 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Github_actions,
  metadata: metadata$5
});
const metadata$4 = {
  title: "Making your own statusline in (Neo)vim",
  date: "2020-02-15T00:00:00.000Z",
  desc: "A post where I made my own lightsaber. I mean, my own vim's statusline to make my vim looks even more personalised",
  tags: ["neovim"]
};
const Vim_statusline = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$4), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#prerequisite"}">Prerequisite</a></p></li>
<li><p><a href="${"#creating-the-statusline"}">Creating the statusline</a></p>
<ul><li><a href="${"#deprecating-the-old-one"}">Deprecating the old one</a></li>
<li><a href="${"#making-the-structure"}">Making the structure</a></li>
<li><a href="${"#base-colour"}">Base colour</a></li>
<li><a href="${"#modes-indicator"}">Modes indicator</a></li>
<li><a href="${"#git-integration"}">Git integration</a></li>
<li><a href="${"#right-section"}">Right Section</a></li>
<li><a href="${"#filename"}">Filename</a></li>
<li><a href="${"#filetype"}">Filetype</a></li>
<li><a href="${"#line-number"}">Line Number</a></li>
<li><a href="${"#inactive-line"}">Inactive Line</a></li></ul></li>
<li><p><a href="${"#apply-the-statusline"}">Apply the statusline</a></p></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Hi everyone! In this post, I will talk about making your own custom statusline in vim. There are a lot of plugins out there that makes vim statusline looks way better and works out of the box. But, if you make your own, that means you lose one dependency and it feels good to make your own custom one. That makes it unique compared to anyone else.</p>
<p>The reason why I made this post is also because I want to change my statusline. While my current statusline looks eye candy (to me at least), it takes a whole lot of space. So, I want to simplifiy it and why not make that process as a post. Let\u2019s get into it!</p>
${validate_component(Update, "Update").$$render($$result, {date: "29-11-2020"}, {}, {
      default: () => `<p>I wrote a better version of this in Lua which you can read <a href="${"https://elianiva.me/post/neovim-lua-statusline"}" rel="${"nofollow"}">here</a></p>`
    })}
<h1 id="${"prerequisite"}"><a href="${"#prerequisite"}">Prerequisite</a></h1>
<p>First of all, we need to prepare a few things :</p>
<ul><li>(Neo)Vim Text Editor (Duh, isn\u2019t that obvious?).</li>
<li>Terminal that is capable of true colours</li>
<li>Patience</li>
<li>Googling skills incase something doesn\u2019t work correctly</li></ul>
<p>All is set, let\u2019s actually make the statusline!</p>
<h1 id="${"creating-the-statusline"}"><a href="${"#creating-the-statusline"}">Creating the statusline</a></h1>
<h2 id="${"deprecating-the-old-one"}"><a href="${"#deprecating-the-old-one"}">Deprecating the old one</a></h2>
<p>First thing first, I removed my old statusline. You don\u2019t need to do it if you don\u2019t have it already. If you are curious how my statusline looks, let me show you.</p>
<p><img src="${"/assets/post/vim-statusline/old.png"}" alt="${"old statusline"}"></p>
<p>As you can see, it looks like a capsule for each module. I took the design from a reddit post that I\u2019ve found the other day. <a href="${"https://www.reddit.com/r/vimporn/comments/efjcv0/gruvboxxx/?utm_source=share&utm_medium=web2x"}" rel="${"nofollow"}">Here it is</a>. It looks sick when I saw it for the first time. But, as time passes I started to think that it wasted quite a lot of space. So I decided to change it</p>
<h2 id="${"making-the-structure"}"><a href="${"#making-the-structure"}">Making the structure</a></h2>
<p>Let\u2019s start with the structure of the statusline. Create 2 functions for your statusline as so.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" We'll use this for the active statusline</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">ActiveLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">=</span> <span class="token string">""</span>
  <span class="token keyword">return</span> <span class="token builtin">statusline</span>
<span class="token keyword">endfunction</span>

<span class="token comment">" We'll use this for the inactive statusline</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">InactiveLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">=</span> <span class="token string">""</span>
  <span class="token keyword">return</span> <span class="token builtin">statusline</span>
<span class="token keyword">endfunction</span></code>`}</pre>
<h2 id="${"base-colour"}"><a href="${"#base-colour"}">Base colour</a></h2>
<p>Next, we\u2019ll define the base colour for the background. I chose a lighter colour for the background so it stands out. To add a base colour, you need to add <code>%#Base#</code> where <code>Base</code> is the name of the color highlight. To set a colour highlight, you\u2019d do:</p>
<pre class="${"language-vim"}">${`<code class="language-vim">  <span class="token builtin">hi</span> Base guibg<span class="token operator">=</span>#<span class="token number">212333</span> guifg<span class="token operator">=</span>#<span class="token number">212333</span></code>`}</pre>
<p>You can freely change the colours as you like. The colour are set, let\u2019s apply it to our statusline. To apply it, you\u2019d do:</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" We'll use this for the active statusline</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">ActiveLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">=</span> <span class="token string">""</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Base#"</span>
  <span class="token keyword">return</span> <span class="token builtin">statusline</span>
<span class="token keyword">endfunction</span></code>`}</pre>
<h2 id="${"modes-indicator"}"><a href="${"#modes-indicator"}">Modes indicator</a></h2>
<p>Let\u2019s make a module for out statusline because so far, what we did is just setting the background colour. The most importan part for me is the indicator for the mode that you\u2019re currently in. To do that, you\u2019d add:</p>
<pre class="${"language-vim"}">${`<code class="language-vim">  <span class="token keyword">let</span> g<span class="token punctuation">:</span>currentmode<span class="token operator">=</span><span class="token punctuation">&#123;</span>
      <span class="token string">'n'</span> <span class="token punctuation">:</span> <span class="token string">'Normal '</span><span class="token punctuation">,</span>
      <span class="token string">'no'</span> <span class="token punctuation">:</span> <span class="token string">'N\xB7Operator Pending '</span><span class="token punctuation">,</span>
      <span class="token string">'v'</span> <span class="token punctuation">:</span> <span class="token string">'Visual '</span><span class="token punctuation">,</span>
      <span class="token string">'V'</span> <span class="token punctuation">:</span> <span class="token string">'V\xB7Line '</span><span class="token punctuation">,</span>
      <span class="token string">'^V'</span> <span class="token punctuation">:</span> <span class="token string">'V\xB7Block '</span><span class="token punctuation">,</span>
      <span class="token string">'s'</span> <span class="token punctuation">:</span> <span class="token string">'Select '</span><span class="token punctuation">,</span>
      <span class="token string">'S'</span><span class="token punctuation">:</span> <span class="token string">'S\xB7Line '</span><span class="token punctuation">,</span>
      <span class="token string">'^S'</span> <span class="token punctuation">:</span> <span class="token string">'S\xB7Block '</span><span class="token punctuation">,</span>
      <span class="token string">'i'</span> <span class="token punctuation">:</span> <span class="token string">'Insert '</span><span class="token punctuation">,</span>
      <span class="token string">'R'</span> <span class="token punctuation">:</span> <span class="token string">'Replace '</span><span class="token punctuation">,</span>
      <span class="token string">'Rv'</span> <span class="token punctuation">:</span> <span class="token string">'V\xB7Replace '</span><span class="token punctuation">,</span>
      <span class="token string">'c'</span> <span class="token punctuation">:</span> <span class="token string">'Command '</span><span class="token punctuation">,</span>
      <span class="token string">'cv'</span> <span class="token punctuation">:</span> <span class="token string">'Vim Ex '</span><span class="token punctuation">,</span>
      <span class="token string">'ce'</span> <span class="token punctuation">:</span> <span class="token string">'Ex '</span><span class="token punctuation">,</span>
      <span class="token string">'r'</span> <span class="token punctuation">:</span> <span class="token string">'Prompt '</span><span class="token punctuation">,</span>
      <span class="token string">'rm'</span> <span class="token punctuation">:</span> <span class="token string">'More '</span><span class="token punctuation">,</span>
      <span class="token string">'r?'</span> <span class="token punctuation">:</span> <span class="token string">'Confirm '</span><span class="token punctuation">,</span>
      <span class="token string">'!'</span> <span class="token punctuation">:</span> <span class="token string">'Shell '</span><span class="token punctuation">,</span>
      <span class="token string">'t'</span> <span class="token punctuation">:</span> <span class="token string">'Terminal '</span>
      <span class="token punctuation">&#125;</span>

<span class="token comment">" Get current mode</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">ModeCurrent</span><span class="token punctuation">(</span><span class="token punctuation">)</span> abort
    <span class="token keyword">let</span> <span class="token keyword">l</span><span class="token punctuation">:</span>modecurrent <span class="token operator">=</span> <span class="token function">mode</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">let</span> <span class="token keyword">l</span><span class="token punctuation">:</span>modelist <span class="token operator">=</span> <span class="token function">toupper</span><span class="token punctuation">(</span><span class="token function">get</span><span class="token punctuation">(</span>g<span class="token punctuation">:</span>currentmode<span class="token punctuation">,</span> <span class="token keyword">l</span><span class="token punctuation">:</span>modecurrent<span class="token punctuation">,</span> <span class="token string">'V\xB7Block '</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
    <span class="token keyword">let</span> <span class="token keyword">l</span><span class="token punctuation">:</span>current_status_mode <span class="token operator">=</span> <span class="token keyword">l</span><span class="token punctuation">:</span>modelist
    <span class="token keyword">return</span> <span class="token keyword">l</span><span class="token punctuation">:</span>current_status_mode
<span class="token keyword">endfunction</span></code>`}</pre>
<p>Just calm down, don\u2019t get intimidated by the code. It looks like much, but it\u2019s just a list to indicate what mode you\u2019re currently in. Make sure you place that on top of the <code>ActiveLine</code> function. You don\u2019t need to understand all of that. All you need to know is, <em>It just works.</em></p>
<p>Let\u2019s add some colours for that module. It\u2019s the same like before, you add <code>%#Mode#</code> where <code>Mode</code> is the name for highlight group. Set the colour for the highlight as so:</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token builtin">hi</span> Mode guibg<span class="token operator">=</span>#82aaff guifg<span class="token operator">=</span>#<span class="token number">181824</span> gui<span class="token operator">=</span>bold</code>`}</pre>
<p>It will give the <code>Mode</code> module a blue background and a dark colour for the text. It will also make the text bold. Let\u2019s ppply it to our statusline once again.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" We'll use this for the active statusline</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">ActiveLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">=</span> <span class="token string">""</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Base#"</span>

  <span class="token comment">" Current mode</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Mode# %&#123;ModeCurrent()&#125;"</span>
  <span class="token keyword">return</span> <span class="token builtin">statusline</span>
<span class="token keyword">endfunction</span></code>`}</pre>
<h2 id="${"git-integration"}"><a href="${"#git-integration"}">Git integration</a></h2>
<p>Being able to see your git branch on your statusline is great. So, let\u2019s do that! First thing first, you\u2019ll need some kind of git plugin to show the git status (I think it\u2019s possible without it, but I\u2019m not sure). I\u2019ll use a vim plugin called <a href="${"https://github.com/tpope/vim-fugitive"}" rel="${"nofollow"}">vim-fugitive</a>. It\u2019s not only for this reason, it has a lot of useful command too!</p>
<p>Let\u2019s create the module for that. First thing first, the branch name that you\u2019re currently in.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" Get current git branch</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">GitBranch</span><span class="token punctuation">(</span>git<span class="token punctuation">)</span>
  <span class="token keyword">if</span> a<span class="token punctuation">:</span>git <span class="token operator">==</span> <span class="token string">""</span>
    <span class="token keyword">return</span> <span class="token string">'-'</span>
  <span class="token keyword">else</span>
    <span class="token keyword">return</span> a<span class="token punctuation">:</span>git
  <span class="token keyword">endif</span>
<span class="token keyword">endfunction</span></code>`}</pre>
<p>Create the colours for that module and apply it by doing so:</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token builtin">hi</span> Git guibg<span class="token operator">=</span>#292d3e guifg<span class="token operator">=</span>#929dcb

<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">ActiveLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">=</span> <span class="token string">""</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Base#"</span>

  <span class="token comment">" Current mode</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Mode# %&#123;ModeCurrent()&#125;"</span>

  <span class="token comment">" Current git branch</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Git# %&#123;GitBranch(fugitive#head())&#125; %)"</span>
  <span class="token keyword">return</span> <span class="token builtin">statusline</span>
<span class="token keyword">endfunction</span></code>`}</pre>
<h2 id="${"right-section"}"><a href="${"#right-section"}">Right Section</a></h2>
<p>After creating the left section, let\u2019s move to the right part. To move to the right part of the statusline, what you\u2019d do is to add:</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" Make the colour highlight normal</span>
<span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Base#"</span>
<span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%="</span></code>`}</pre>
<p>What that block code is doing is:</p>
<ul><li>It normalize the colour of the background</li>
<li>Move the next module to the right</li></ul>
<h2 id="${"filename"}"><a href="${"#filename"}">Filename</a></h2>
<p>I want to make the filename module as the first module for the right section. I also added the feature where if your file isn\u2019t saved yet, it\u2019ll give a star symbol at the end of the filename, change the colour to white and make it bold.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" Check modified status</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">CheckMod</span><span class="token punctuation">(</span>modi<span class="token punctuation">)</span>
  <span class="token keyword">if</span> a<span class="token punctuation">:</span>modi <span class="token operator">==</span> <span class="token number">1</span>
    <span class="token builtin">hi</span> Modi guifg<span class="token operator">=</span>#efefef guibg<span class="token operator">=</span>#<span class="token number">212333</span> gui<span class="token operator">=</span>bold
    <span class="token builtin">hi</span> Filename guifg<span class="token operator">=</span>#efefef guibg<span class="token operator">=</span>#<span class="token number">212333</span>
    <span class="token keyword">return</span> <span class="token function">expand</span><span class="token punctuation">(</span><span class="token string">'%:t'</span><span class="token punctuation">)</span><span class="token operator">.</span><span class="token string">'*'</span>
  <span class="token keyword">else</span>
    <span class="token builtin">hi</span> Modi guifg<span class="token operator">=</span>#929dcb guibg<span class="token operator">=</span>#<span class="token number">212333</span>
    <span class="token builtin">hi</span> Filename guifg<span class="token operator">=</span>#929dcb guibg<span class="token operator">=</span>#<span class="token number">212333</span>
    <span class="token keyword">return</span> <span class="token function">expand</span><span class="token punctuation">(</span><span class="token string">'%:t'</span><span class="token punctuation">)</span>
  <span class="token keyword">endif</span>
<span class="token keyword">endfunction</span></code>`}</pre>
<p>Then we\u2019ll add it to our previous statusline like we did for the other modules.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">ActiveLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">=</span> <span class="token string">""</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Base#"</span>

  <span class="token comment">" Current mode</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Mode# %&#123;ModeCurrent()&#125;"</span>

  <span class="token comment">" Current git branch</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Git# %&#123;GitBranch(fugitive#head())&#125; %)"</span>

  <span class="token comment">" Make the colour highlight normal</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Base#"</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%="</span>

  <span class="token comment">" Current modified status and filename</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Modi# %&#123;CheckMod(&amp;modified)&#125; "</span>
  <span class="token keyword">return</span> <span class="token builtin">statusline</span>
<span class="token keyword">endfunction</span></code>`}</pre>
<h2 id="${"filetype"}"><a href="${"#filetype"}">Filetype</a></h2>
<p>Similar to <code>filename</code>, filetype module only display a filetype from that file. You know, like <code>javascript</code>, <code>html</code>, <code>markdown</code>, etc. Let\u2019s make that module.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" Set the colour</span>
<span class="token builtin">hi</span> Filetype guibg<span class="token operator">=</span>#292d3e guifg<span class="token operator">=</span>#929dcb

<span class="token comment">" Get current filetype</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">CheckFT</span><span class="token punctuation">(</span><span class="token keyword">filetype</span><span class="token punctuation">)</span>
  <span class="token keyword">if</span> a<span class="token punctuation">:</span><span class="token keyword">filetype</span> <span class="token operator">==</span> <span class="token string">''</span>
    <span class="token keyword">return</span> <span class="token string">'-'</span>
  <span class="token keyword">else</span>
    <span class="token keyword">return</span> <span class="token function">tolower</span><span class="token punctuation">(</span>a<span class="token punctuation">:</span><span class="token keyword">filetype</span><span class="token punctuation">)</span>
  <span class="token keyword">endif</span>
<span class="token keyword">endfunction</span></code>`}</pre>
<p>After making it, let\u2019s apply it to our statusline.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">ActiveLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">=</span> <span class="token string">""</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Base#"</span>

  <span class="token comment">" Current mode</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Mode# %&#123;ModeCurrent()&#125;"</span>

  <span class="token comment">" Current git branch</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Git# %&#123;GitBranch(fugitive#head())&#125; %)"</span>

  <span class="token comment">" Make the colour highlight normal</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Base#"</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%="</span>

  <span class="token comment">" Current modified status and filename</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Modi# %&#123;CheckMod(&amp;modified)&#125; "</span>

  <span class="token comment">" Current filetype</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Filetype# %&#123;CheckFT(&amp;filetype)&#125; "</span>
  <span class="token keyword">return</span> <span class="token builtin">statusline</span>
<span class="token keyword">endfunction</span></code>`}</pre>
<p>The reason why I use a function just to display a filetype is to make all of the letter lowercase and display <code>-</code> when the filetype is unidentified.</p>
<h2 id="${"line-number"}"><a href="${"#line-number"}">Line Number</a></h2>
<p>Last but not least, it\u2019s the line number and line column module. It\u2019s used to display the line number that you\u2019re currently in. It\u2019s a really simple module. Let\u2019s make that!</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" Colour for line number module</span>
<span class="token builtin">hi</span> LineCol guibg<span class="token operator">=</span>#82aaff guifg<span class="token operator">=</span>#<span class="token number">181824</span> gui<span class="token operator">=</span>bold

<span class="token comment">" Current line and column</span>
<span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#LineCol# Ln %l, Col %c "</span></code>`}</pre>
<h2 id="${"inactive-line"}"><a href="${"#inactive-line"}">Inactive Line</a></h2>
<p>We\u2019ve made the statusline for the active window, let\u2019s make one for the inactive window. It\u2019s simple.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">InactiveLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token comment">" Set empty statusline and colors</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">=</span> <span class="token string">""</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Base#"</span>

  <span class="token comment">" Full path of the file</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#LineCol# %F "</span>

  <span class="token keyword">return</span> <span class="token builtin">statusline</span>
<span class="token keyword">endfunction</span></code>`}</pre>
<h1 id="${"apply-the-statusline"}"><a href="${"#apply-the-statusline"}">Apply the statusline</a></h1>
<p>Let\u2019s see what we\u2019ve made so far.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" Statusline colors</span>
<span class="token builtin">hi</span> Base guibg<span class="token operator">=</span>#<span class="token number">212333</span> guifg<span class="token operator">=</span>#<span class="token number">212333</span>
<span class="token builtin">hi</span> Mode guibg<span class="token operator">=</span>#82aaff guifg<span class="token operator">=</span>#<span class="token number">181824</span> gui<span class="token operator">=</span>bold
<span class="token builtin">hi</span> Git guibg<span class="token operator">=</span>#292d3e guifg<span class="token operator">=</span>#929dcb
<span class="token builtin">hi</span> Filetype guibg<span class="token operator">=</span>#292d3e guifg<span class="token operator">=</span>#929dcb
<span class="token builtin">hi</span> LineCol guibg<span class="token operator">=</span>#82aaff guifg<span class="token operator">=</span>#<span class="token number">181824</span> gui<span class="token operator">=</span>bold
<span class="token comment">" Get current mode</span>
<span class="token keyword">let</span> g<span class="token punctuation">:</span>currentmode<span class="token operator">=</span><span class="token punctuation">&#123;</span>
      <span class="token string">'n'</span> <span class="token punctuation">:</span> <span class="token string">'Normal '</span><span class="token punctuation">,</span>
      <span class="token string">'no'</span> <span class="token punctuation">:</span> <span class="token string">'N\xB7Operator Pending '</span><span class="token punctuation">,</span>
      <span class="token string">'v'</span> <span class="token punctuation">:</span> <span class="token string">'Visual '</span><span class="token punctuation">,</span>
      <span class="token string">'V'</span> <span class="token punctuation">:</span> <span class="token string">'V\xB7Line '</span><span class="token punctuation">,</span>
      <span class="token string">'^V'</span> <span class="token punctuation">:</span> <span class="token string">'V\xB7Block '</span><span class="token punctuation">,</span>
      <span class="token string">'s'</span> <span class="token punctuation">:</span> <span class="token string">'Select '</span><span class="token punctuation">,</span>
      <span class="token string">'S'</span><span class="token punctuation">:</span> <span class="token string">'S\xB7Line '</span><span class="token punctuation">,</span>
      <span class="token string">'^S'</span> <span class="token punctuation">:</span> <span class="token string">'S\xB7Block '</span><span class="token punctuation">,</span>
      <span class="token string">'i'</span> <span class="token punctuation">:</span> <span class="token string">'Insert '</span><span class="token punctuation">,</span>
      <span class="token string">'R'</span> <span class="token punctuation">:</span> <span class="token string">'Replace '</span><span class="token punctuation">,</span>
      <span class="token string">'Rv'</span> <span class="token punctuation">:</span> <span class="token string">'V\xB7Replace '</span><span class="token punctuation">,</span>
      <span class="token string">'c'</span> <span class="token punctuation">:</span> <span class="token string">'Command '</span><span class="token punctuation">,</span>
      <span class="token string">'cv'</span> <span class="token punctuation">:</span> <span class="token string">'Vim Ex '</span><span class="token punctuation">,</span>
      <span class="token string">'ce'</span> <span class="token punctuation">:</span> <span class="token string">'Ex '</span><span class="token punctuation">,</span>
      <span class="token string">'r'</span> <span class="token punctuation">:</span> <span class="token string">'Prompt '</span><span class="token punctuation">,</span>
      <span class="token string">'rm'</span> <span class="token punctuation">:</span> <span class="token string">'More '</span><span class="token punctuation">,</span>
      <span class="token string">'r?'</span> <span class="token punctuation">:</span> <span class="token string">'Confirm '</span><span class="token punctuation">,</span>
      <span class="token string">'!'</span> <span class="token punctuation">:</span> <span class="token string">'Shell '</span><span class="token punctuation">,</span>
      <span class="token string">'t'</span> <span class="token punctuation">:</span> <span class="token string">'Terminal '</span>
      <span class="token punctuation">&#125;</span>

<span class="token comment">" Get current mode</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">ModeCurrent</span><span class="token punctuation">(</span><span class="token punctuation">)</span> abort
    <span class="token keyword">let</span> <span class="token keyword">l</span><span class="token punctuation">:</span>modecurrent <span class="token operator">=</span> <span class="token function">mode</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
    <span class="token keyword">let</span> <span class="token keyword">l</span><span class="token punctuation">:</span>modelist <span class="token operator">=</span> <span class="token function">toupper</span><span class="token punctuation">(</span><span class="token function">get</span><span class="token punctuation">(</span>g<span class="token punctuation">:</span>currentmode<span class="token punctuation">,</span> <span class="token keyword">l</span><span class="token punctuation">:</span>modecurrent<span class="token punctuation">,</span> <span class="token string">'V\xB7Block '</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
    <span class="token keyword">let</span> <span class="token keyword">l</span><span class="token punctuation">:</span>current_status_mode <span class="token operator">=</span> <span class="token keyword">l</span><span class="token punctuation">:</span>modelist
    <span class="token keyword">return</span> <span class="token keyword">l</span><span class="token punctuation">:</span>current_status_mode
<span class="token keyword">endfunction</span>

<span class="token comment">" Get current git branch</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">GitBranch</span><span class="token punctuation">(</span>git<span class="token punctuation">)</span>
  <span class="token keyword">if</span> a<span class="token punctuation">:</span>git <span class="token operator">==</span> <span class="token string">""</span>
    <span class="token keyword">return</span> <span class="token string">'-'</span>
  <span class="token keyword">else</span>
    <span class="token keyword">return</span> a<span class="token punctuation">:</span>git
  <span class="token keyword">endif</span>
<span class="token keyword">endfunction</span>

<span class="token comment">" Get current filetype</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">CheckFT</span><span class="token punctuation">(</span><span class="token keyword">filetype</span><span class="token punctuation">)</span>
  <span class="token keyword">if</span> a<span class="token punctuation">:</span><span class="token keyword">filetype</span> <span class="token operator">==</span> <span class="token string">''</span>
    <span class="token keyword">return</span> <span class="token string">'-'</span>
  <span class="token keyword">else</span>
    <span class="token keyword">return</span> <span class="token function">tolower</span><span class="token punctuation">(</span>a<span class="token punctuation">:</span><span class="token keyword">filetype</span><span class="token punctuation">)</span>
  <span class="token keyword">endif</span>
<span class="token keyword">endfunction</span>

<span class="token comment">" Check modified status</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">CheckMod</span><span class="token punctuation">(</span>modi<span class="token punctuation">)</span>
  <span class="token keyword">if</span> a<span class="token punctuation">:</span>modi <span class="token operator">==</span> <span class="token number">1</span>
    <span class="token builtin">hi</span> Modi guifg<span class="token operator">=</span>#efefef guibg<span class="token operator">=</span>#<span class="token number">212333</span>
    <span class="token builtin">hi</span> Filename guifg<span class="token operator">=</span>#efefef guibg<span class="token operator">=</span>#<span class="token number">212333</span>
    <span class="token keyword">return</span> <span class="token function">expand</span><span class="token punctuation">(</span><span class="token string">'%:t'</span><span class="token punctuation">)</span><span class="token operator">.</span><span class="token string">'*'</span>
  <span class="token keyword">else</span>
    <span class="token builtin">hi</span> Modi guifg<span class="token operator">=</span>#929dcb guibg<span class="token operator">=</span>#<span class="token number">212333</span>
    <span class="token builtin">hi</span> Filename guifg<span class="token operator">=</span>#929dcb guibg<span class="token operator">=</span>#<span class="token number">212333</span>
    <span class="token keyword">return</span> <span class="token function">expand</span><span class="token punctuation">(</span><span class="token string">'%:t'</span><span class="token punctuation">)</span>
  <span class="token keyword">endif</span>
<span class="token keyword">endfunction</span>

<span class="token comment">" Set active statusline</span>
<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">ActiveLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token comment">" Set empty statusline and colors</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">=</span> <span class="token string">""</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Base#"</span>

  <span class="token comment">" Current mode</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Mode# %&#123;ModeCurrent()&#125;"</span>

  <span class="token comment">" Current git branch</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Git# %&#123;GitBranch(fugitive#head())&#125; %)"</span>

  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Base#"</span>

  <span class="token comment">" Align items to right</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%="</span>

  <span class="token comment">" Current modified status and filename</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Modi# %&#123;CheckMod(&amp;modified)&#125; "</span>

  <span class="token comment">" Current filetype</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Filetype# %&#123;CheckFT(&amp;filetype)&#125; "</span>

  <span class="token comment">" Current line and column</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#LineCol# Ln %l, Col %c "</span>
  <span class="token keyword">return</span> <span class="token builtin">statusline</span>
<span class="token keyword">endfunction</span>

<span class="token keyword">function</span><span class="token operator">!</span> <span class="token function">InactiveLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token comment">" Set empty statusline and colors</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">=</span> <span class="token string">""</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Base#"</span>

  <span class="token comment">" Full path of the file</span>
  <span class="token keyword">let</span> <span class="token builtin">statusline</span> <span class="token operator">.=</span> <span class="token string">"%#Filename# %F "</span>

  <span class="token keyword">return</span> <span class="token builtin">statusline</span>
<span class="token keyword">endfunction</span></code>`}</pre>
<p>As you can see, currently we didn\u2019t do anything to our current statusline because we haven\u2019t apply it yet. So, let\u2019s apply it!</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" Change statusline automatically</span>
augroup Statusline
  <span class="token builtin">autocmd</span><span class="token operator">!</span>
  <span class="token builtin">autocmd</span> WinEnter<span class="token punctuation">,</span>BufEnter <span class="token operator">*</span> <span class="token keyword">setlocal</span> <span class="token builtin">statusline</span><span class="token operator">=</span><span class="token operator">%</span><span class="token operator">!</span><span class="token function">ActiveLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token builtin">autocmd</span> WinLeave<span class="token punctuation">,</span>BufLeave <span class="token operator">*</span> <span class="token keyword">setlocal</span> <span class="token builtin">statusline</span><span class="token operator">=</span><span class="token operator">%</span><span class="token operator">!</span><span class="token function">InactiveLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token builtin">autocmd</span> FileType nerdtree <span class="token keyword">setlocal</span> <span class="token builtin">statusline</span><span class="token operator">=</span><span class="token operator">%</span><span class="token operator">!</span><span class="token function">NERDLine</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
augroup END</code>`}</pre>
<p>We use autocmd to make the statusline changed automatically based of the current window status. Make sure you\u2019ve set <code>laststatus</code> to 2 so your vim will always display the statusline. If you don\u2019t know what I mean, add</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token keyword">set</span> <span class="token builtin">laststatus</span><span class="token operator">=</span><span class="token number">2</span></code>`}</pre>
<p>to your .vimrc or init.vim</p>
<p>Here\u2019s what it looks like when it\u2019s finished</p>
<p><img src="${"/assets/post/vim-statusline/new.png"}" alt="${"new statusline"}"></p>
<p>It doesn\u2019t look like an eye candy, but it doesn\u2019t take a whole lotta space.
If you want the old one, <a href="${"https://github.com/irrellia/dotfiles/blob/0c1ca17af07d7fdf72577a44d2a1e8bbab855d93/.config/nvim/modules/statusline.vim"}" rel="${"nofollow"}">Here it is</a>. Just take what you need from that file, it\u2019s not that hard to understand ;)</p>
${validate_component(Update, "Update").$$render($$result, {date: "15-10-2020"}, {}, {
      default: () => `<p>Welp, I accidentally lost my old statusline because I <code>git push --force</code> the other day. Sorry :p</p>`
    })}
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>Making a custom statusline of your own is quite a lengthy process. But, I think it\u2019s a fun process nonetheless. If you want to tinker with it even more, just do it! It\u2019s a repetitive process once you know the basic. I\u2019m not a vim expert myself, so sorry if I\u2019ve missed something in this post. Alright then, I\u2019m gonna end this post right here. If you have any question regarding to this post, feel free to hit me up! See ya!</p>`
  })}`;
});
var index$4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Vim_statusline,
  metadata: metadata$4
});
const metadata$3 = {
  title: "I redesigned my website because why not",
  date: "2020-05-02T00:00:00.000Z",
  desc: "A post where I explain about my site redesign to give it a bit more fresher look",
  tags: ["gatsby", "react", "website"]
};
const Site_redesign = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$3), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#components-redesign"}">Components Redesign</a></p>
<ul><li><a href="${"#navigation-bar"}">Navigation Bar</a></li>
<li><a href="${"#footer"}">Footer</a></li></ul></li>
<li><p><a href="${"#pages-redesign"}">Pages Redesign</a></p>
<ul><li><a href="${"#home-page"}">Home page</a></li>
<li><a href="${"#tags-page"}">Tags page</a></li>
<li><a href="${"#post-page"}">Post page</a></li>
<li><a href="${"#post-list-page"}">Post list page</a></li>
<li><a href="${"#about-page"}">About page</a></li>
<li><a href="${"#books-page"}">Books page</a></li>
<li><a href="${"#other-stuff"}">Other stuff</a></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Hi! So I made this blog about 2 months ago and I think now it doesn\u2019t have a decent UI/UX at least in my opinion. Now, because I have plenty of free time because of the current pandemic that\u2019s been going on for a couple of months. I decided to redesign it and I\u2019ll explain why.</p>
<h1 id="${"components-redesign"}"><a href="${"#components-redesign"}">Components Redesign</a></h1>
<h2 id="${"navigation-bar"}"><a href="${"#navigation-bar"}">Navigation Bar</a></h2>
<p>I changed the background to be a little bit transparent so that I can use a <code>backdrop-filter</code> that I recently discovered. It looks really cool, like looking through a white glass.</p>
<p>I added the social media icon to the navbar unlike previously where I put it on the footer so people can could easily see them. The icons are also changed, they have their original shape instead of having a circular background.</p>
<h2 id="${"footer"}"><a href="${"#footer"}">Footer</a></h2>
<p>Nothing much changed here except I made it to be more \u2018informative\u2019 I guess. I also removed the previous social media icon which I\u2019ve already mentioned.</p>
<h1 id="${"pages-redesign"}"><a href="${"#pages-redesign"}">Pages Redesign</a></h1>
<h2 id="${"home-page"}"><a href="${"#home-page"}">Home page</a></h2>
<p>Previously, I have this one big section that fills the entire screen with a logo and a quick description about me. That\u2019s not very good in terms of the UX. I decided to make it look more compact by dividing it into 2 sides. Here\u2019s the comparison.</p>
<p><img src="${"/assets/post/site-redesign/old.png"}" alt="${"old"}">
<img src="${"/assets/post/site-redesign/new.png"}" alt="${"new"}"></p>
<p>I also don\u2019t have a new logo for my username yet. So it is what it is. I\u2019ll make that in the future.</p>
${validate_component(Update, "Update").$$render($$result, {date: "06-09-2020"}, {}, {
      default: () => `<p>I decided to use my github profile picture instead.</p>`
    })}
<h2 id="${"tags-page"}"><a href="${"#tags-page"}">Tags page</a></h2>
<p>I decided to remove the category. I think tags will be enough because I have another plan for the \u201Ccategory\u201D thingy. I\u2019ll talk about that later on. If you\u2019ve seen my archives page before, it kinda look like a mess, like seriously. I mean just look at this.</p>
<p><img src="${"/assets/post/site-redesign/old-tag.png"}" alt="${"old"}"></p>
<p>and compare that to this.</p>
<p><img src="${"/assets/post/site-redesign/new-tag.png"}" alt="${"new"}"></p>
<p>The new page looks <em>way</em> better than the old one. At least in my opinion.</p>
<h2 id="${"post-page"}"><a href="${"#post-page"}">Post page</a></h2>
<p>I changed the post page slightly. The code block use dark theme even if the site is light theme. I try to give some contrast so the reader can focus on what they read. Other than that, nothing\u2019s changed.</p>
<h2 id="${"post-list-page"}"><a href="${"#post-list-page"}">Post list page</a></h2>
<p>I still use the same pagination page from previous website and I just changed the navigation button a little bit. That\u2019s all.</p>
<h2 id="${"about-page"}"><a href="${"#about-page"}">About page</a></h2>
<p>Previously, I made the about page as sort of a QnA page. I replace it with an explanation about myself instead this time. Go check it yourself ;)</p>
<h2 id="${"books-page"}"><a href="${"#books-page"}">Books page</a></h2>
<p>I am planning on making this page to be a place where I put some sort of series. I got this idea from <a href="${"https://bandithijo.github.io/book/"}" rel="${"nofollow"}">Bandithijo</a>. Check him out by the way, his content is just pure awesomeness.</p>
<p>So currently, it is a work in progress. \u201Ccoming soon\u201D, that\u2019s all you got for now.</p>
${validate_component(Update, "Update").$$render($$result, {date: "17-10-2020"}, {}, {
      default: () => `<p>I changed my mind. I won\u2019t make this section. I never have the time to do it unfortunately.</p>`
    })}
<h2 id="${"other-stuff"}"><a href="${"#other-stuff"}">Other stuff</a></h2>
<p>I fixed some little bugs that\u2019s previously happened and what not. Just some tiny little improvements.</p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>All in all, I really like the end result. Let me now what you think down below in the new disqus comment section ;)</p>`
  })}`;
});
var index$3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Site_redesign,
  metadata: metadata$3
});
const metadata$2 = {
  title: "My impression of Lenovo Thinkpad X220",
  date: "2020-03-19T00:00:00.000Z",
  desc: "I finally became one of those Linux users, the one who has old Thinkpad with them.",
  tags: ["other"]
};
const Thinkpad_x220 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$2), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#why-did-i-choose-thinkpad"}">Why did I choose Thinkpad?</a></p></li>
<li><p><a href="${"#my-x220-review"}">My X220 Review</a></p>
<ul><li><a href="${"#where-and-how-much"}">Where and how much</a></li>
<li><a href="${"#first-impression"}">First impression</a></li>
<li><a href="${"#features-that-i-love"}">Features that I love</a></li>
<li><a href="${"#performance"}">Performance</a></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>So, I have a pretty bad laptop with Intel Celeron N4000 processor which runs super slow. Of course I can\u2019t stand that, so I decided to change my laptop to a something better and that is none other than Thinkpad.</p>
<h1 id="${"why-did-i-choose-thinkpad"}"><a href="${"#why-did-i-choose-thinkpad"}">Why did I choose Thinkpad?</a></h1>
<p>Well, if you don\u2019t know. Thinkpad is a great laptop with cheap price. Like, really cheap. You can get it under \\$100 and still have quite a decent laptop. Thinkpad is pretty popular in Linux community as far as I know because most of them are really compatible with Linux. It\u2019s a go to if you confused whether or not your Linux will be compatible with your laptop or not.</p>
<p>Thinkpad is also known with the legendary classic keyboard and trackpoint. The keyboard is so tactile, it\u2019s really comfortable to type on unlike most of chichlet keyboard thee days. The trackpoint is also very useful compared to the touchpad. You don\u2019t have to leave your home row to move your cursor which is very useful for someone lazy like I am.</p>
<p>Despite being an old laptop (it was released on 2011), it is however a very durable laptop. This bad boy looks really solid the second you look at it. Even though it\u2019s made from plastic, it feels like a solid rock. Thinkpad is also very upgradable which makes it very convenient.</p>
<h1 id="${"my-x220-review"}"><a href="${"#my-x220-review"}">My X220 Review</a></h1>
<h2 id="${"where-and-how-much"}"><a href="${"#where-and-how-much"}">Where and how much</a></h2>
<p>I buy this bad boy on a local online store for like Rp1.950.000,00 (\\$ 124). It has a perfect condition. I can\u2019t believe how good it is when it arrived. I tought there will be some scratches and what not, but it turns out to be in a perfect condition.</p>
<p>At first, I want to buy a Thinkpad T420. But I decided to pick X220 because I think it\u2019s more portable because of its smaller size.</p>
<h2 id="${"first-impression"}"><a href="${"#first-impression"}">First impression</a></h2>
<p>I was so impressed with its condition. No scratches or anything like that. I think it\u2019s refurbished but I\u2019m not really sure since the store didn\u2019t mentioned it. I\u2019m glad that is has the US keyboard layout, not the one with that ginormous enter key and small space bar. It doesn\u2019t have a fingerprint which I won\u2019t use anyway. The battery still got 86% health which is awesome. I also got the original charger and not one of those weird ones.</p>
<h2 id="${"features-that-i-love"}"><a href="${"#features-that-i-love"}">Features that I love</a></h2>
<p>First think first, let\u2019s talk about the keyboard. This classic 7 rows keyboard is just awesome. It\u2019s so tactile and comfy to type on compared to my old laptop which has an island style keyboard or chichlet like most of other newer laptops have. I could type for hours on this bad boy where if I type on my old one, I got tired quickly. It also have a separate media key to control the volume.</p>
<p>Now let\u2019s talk about the Trackpoint. You know, the red dot on Thinkpad keyboard. It\u2019s there not for no reason. It\u2019s used to move your cursor. As far as my experience go, it\u2019s better than using a touchpad because you don\u2019t have to move your fingers from the home row. That\u2019s very convenient.</p>
<p>Thinklight! This feature isn\u2019t that quite helpful as far as I use my X220. But I\u2019m pretty sure that it\u2019ll be helpful when you work in the dark and want to see your keyboard.</p>
<p>I also like the touch of lights that indicates your battery and sleep outside of the lid. My previous laptop didn\u2019t have this feature. This Thinkpad also got many ports. 3 USB 2.0 ports, HDMI port, VGA port, Audio jack, even the obscure one that I don\u2019t know what it called lol.</p>
<h2 id="${"performance"}"><a href="${"#performance"}">Performance</a></h2>
<p>This bad boy has an Intel Core i5 2520M processors. It\u2019s not the best but it runs pretty well. Previously, I have a laptop that runs Intel Celeron N4000. It was so sluggish. Now that I have an i5 processor, it runs way better.</p>
<p>About the battery. Since it still has 86% health, it can hold up around 4-5 hours in my experience. It runs perfectly without any issue.</p>
<p>It has 4GB of RAMs. I planning on upgrading it in the future to 8GB. I also planning on upgrading it to mSATA SSD. Currently it runs HDD, but it has no issue though so I don\u2019t worry that much.</p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>All in all, I\u2019m really satisfied with this laptop. I don\u2019t regret buying it, at all. It worth all of my money. I slapp Archlinux to this bad boy as soon as I get it and it has no single issue. Everything is perfect, media button is working, Thinklight is also working. I really hope this bad boy will last for the next 3 years or so. If you want a cheap laptop with a great value, I\u2019d recommend Thinkpad. I didn\u2019t give you the full specs for X220 because I\u2019m pretty sure that you\u2019re capable to look it up on google. That\u2019s it for this short review, have a good day! ;)</p>`
  })}`;
});
var index$2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Thinkpad_x220,
  metadata: metadata$2
});
const metadata$1 = {
  title: "Defx, A Dark Powered File Explorer",
  date: "2020-02-22T00:00:00.000Z",
  desc: "Trying out yet another plugin for neovim called defx.nvim, it's dark powered! At least that's what it says on the readme",
  tags: ["neovim"]
};
const Defx_nvim = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata$1), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#installation"}">Installation</a></p></li>
<li><p><a href="${"#configuration"}">Configuration</a></p>
<ul><li><a href="${"#keybindings"}">Keybindings</a></li>
<li><a href="${"#using-split-window"}">Using split window</a></li>
<li><a href="${"#adding-icons"}">Adding icons</a></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>Hi everyone! This time I will talk about a (Neo)vim plugin called <a href="${"https://github.com/airblade/defx.nvim"}" rel="${"nofollow"}">Defx</a>. I\u2019ve been looking for an alternative to <a href="${"https://github.com/preservim/nerdtree"}" rel="${"nofollow"}">NERDTree</a> for quite a while now. I came across this plugin from a telegram channel called \u201CVim Indonesia\u201D. Since I have no project that I\u2019m currently working on, why don\u2019t I give it a shot?</p>
<h1 id="${"installation"}"><a href="${"#installation"}">Installation</a></h1>
<p>The installation is pretty simple. You can add this plugin just like any other plugin from your plugin manager. I\u2019m using <a href="${"https://github.com/junegunn/vim-plug"}" rel="${"nofollow"}">vim-plug</a> as my plugin manager. To add a plugin, I would simply add this into my plugin list.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token keyword">if</span> <span class="token function">has</span><span class="token punctuation">(</span><span class="token string">'nvim'</span><span class="token punctuation">)</span>
  Plug <span class="token string">'Shougo/defx.nvim'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span> <span class="token string">'do'</span><span class="token punctuation">:</span> <span class="token string">':UpdateRemotePlugins'</span> <span class="token punctuation">&#125;</span>
<span class="token keyword">else</span>
  Plug <span class="token string">'Shougo/defx.nvim'</span>
  Plug <span class="token string">'roxma/nvim-yarp'</span>
  Plug <span class="token string">'roxma/vim-hug-neovim-rpc'</span>
<span class="token keyword">endif</span></code>`}</pre>
<p>After doing that, I source my init.vim using <code>:so ~/.config/nvim/init.vim</code> and then just run <code>:PlugInstall</code> to install it. Make sure your (Neo)vim supports Python 3.</p>
<h1 id="${"configuration"}"><a href="${"#configuration"}">Configuration</a></h1>
<h2 id="${"keybindings"}"><a href="${"#keybindings"}">Keybindings</a></h2>
<p>To toggle Defx, you\u2019d run <code>:Defx</code>. To make it efficient, let\u2019s assign that to a keystroke. To do that, I add this into my config</p>
<pre class="${"language-vim"}">${`<code class="language-vim">nnoremap <span class="token operator">&lt;</span>C<span class="token operator">-</span><span class="token keyword">n</span><span class="token operator">></span> <span class="token punctuation">:</span>Defx</code>`}</pre>
<p>Finally, we can just simply press <code>ctrl+n</code> to toggle it. Awesome!</p>
<p>You\u2019ll notice that by default it doesn\u2019t handle keypress to open a directory, open a file, add a file, etc like NERDTree. You have to add that by yourself. Thankfully, there is <a href="${"https://tsarafatma.com/neovim/2020/02/08/defx-file-explorer-for-neovim"}" rel="${"nofollow"}">this blog</a> that helped me making those keybindings. What you need to do is to add this long lines of vimscript to your config file.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token builtin">autocmd</span> FileType defx <span class="token keyword">call</span> s<span class="token punctuation">:</span><span class="token function">defx_my_settings</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
<span class="token keyword">function</span><span class="token operator">!</span> s<span class="token punctuation">:</span><span class="token function">defx_my_settings</span><span class="token punctuation">(</span><span class="token punctuation">)</span> abort
  <span class="token comment">" Define mappings</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token operator">&lt;</span>CR<span class="token operator">></span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'drop'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">c</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'copy'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">m</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'move'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">p</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'paste'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">l</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'open'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> E defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'open'</span><span class="token punctuation">,</span> <span class="token string">'vsplit'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">P</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'open'</span><span class="token punctuation">,</span> <span class="token string">'pedit'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">o</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'open_or_close_tree'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> K defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'new_directory'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">N</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'new_file'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> M defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'new_multiple_files'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> C defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'toggle_columns'</span><span class="token punctuation">,</span> <span class="token string">'mark:indent:icon:filename:type:size:time'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> S defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'toggle_sort'</span><span class="token punctuation">,</span> <span class="token string">'time'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">d</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'remove'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">r</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'rename'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token operator">!</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'execute_command'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">x</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'execute_system'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> yy defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'yank_path'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token operator">.</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'toggle_ignored_files'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token punctuation">;</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'repeat'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">h</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'cd'</span><span class="token punctuation">,</span> <span class="token punctuation">[</span><span class="token string">'..'</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> ~ defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'cd'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">q</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'quit'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token operator">&lt;</span>Space<span class="token operator">></span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'toggle_select'</span><span class="token punctuation">)</span> <span class="token operator">.</span> <span class="token string">'j'</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token operator">*</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'toggle_select_all'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">j</span> <span class="token function">line</span><span class="token punctuation">(</span><span class="token string">'.'</span><span class="token punctuation">)</span> <span class="token operator">==</span> <span class="token function">line</span><span class="token punctuation">(</span><span class="token string">'$'</span><span class="token punctuation">)</span> <span class="token operator">?</span> <span class="token string">'gg'</span> <span class="token punctuation">:</span> <span class="token string">'j'</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">k</span> <span class="token function">line</span><span class="token punctuation">(</span><span class="token string">'.'</span><span class="token punctuation">)</span> <span class="token operator">==</span> <span class="token number">1</span> <span class="token operator">?</span> <span class="token string">'G'</span> <span class="token punctuation">:</span> <span class="token string">'k'</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token operator">&lt;</span>C<span class="token operator">-</span><span class="token keyword">l</span><span class="token operator">></span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'redraw'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token operator">&lt;</span>C<span class="token operator">-</span>g<span class="token operator">></span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'print'</span><span class="token punctuation">)</span>
  nnoremap <span class="token operator">&lt;</span><span class="token keyword">silent</span><span class="token operator">></span><span class="token operator">&lt;</span><span class="token keyword">buffer</span><span class="token operator">></span><span class="token operator">&lt;</span>expr<span class="token operator">></span> <span class="token keyword">cd</span> defx#<span class="token function">do_action</span><span class="token punctuation">(</span><span class="token string">'change_vim_cwd'</span><span class="token punctuation">)</span>
<span class="token keyword">endfunction</span></code>`}</pre>
<p>As usual, don\u2019t get intimidated by the long block of code. It\u2019s just a bunch of keybinds. You can customize it however you want.</p>
<h2 id="${"using-split-window"}"><a href="${"#using-split-window"}">Using split window</a></h2>
<p>As you can see, Defx looks way more plain than NERDTree. Let\u2019s change that! First thing first, we make it split instead of fullscreen and put it to the left of our screen. To do that, add this to your config.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" Set appearance</span>
<span class="token keyword">call</span> defx#custom#<span class="token function">option</span><span class="token punctuation">(</span><span class="token string">'_'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span>
       <span class="token string">'winwidth'</span><span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">,</span>
       <span class="token string">'split'</span><span class="token punctuation">:</span> <span class="token string">'vertical'</span><span class="token punctuation">,</span>
       <span class="token string">'direction'</span><span class="token punctuation">:</span> <span class="token string">'topleft'</span><span class="token punctuation">,</span>
       <span class="token string">'show_ignored_files'</span><span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
       <span class="token string">'buffer_name'</span><span class="token punctuation">:</span> <span class="token string">'defxplorer'</span><span class="token punctuation">,</span>
       <span class="token string">'toggle'</span><span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
       <span class="token string">'resume'</span><span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
       <span class="token punctuation">&#125;</span><span class="token punctuation">)</span></code>`}</pre>
<p>Let me quickly explain to you what does what.</p>
<p><strong>winwidth</strong> : It\u2019s pretty straight forward. This field sets the minimum width for the Defx window width.</p>
<p><strong>split</strong> : This field sets the mode of the split. You can fill this with horizontal or vertical. In our case, it\u2019s vertical.</p>
<p><strong>direction</strong> : This field sets the position of the split. In our case, it\u2019s topleft which will make it split to the left. The other possible values are available through <code>:h defx</code>.</p>
<p><strong>show_ignored_files</strong> : This option will decide whether it will display the hidden files or not. In our case, it\u2019s not getting displayed.</p>
<p><strong>buffer_name</strong> : Basically, it sets the buffer name for defx window.</p>
<p><strong>toggle</strong> : This field makes Defx window toggleable. I recommend you to fill this field with 1.</p>
<p><strong>resume</strong> : This field makes Defx resume-able. It saves the state of where your cursor is so you don\u2019t have to navigate from the root of your project directory again after you close Defx and open it again.</p>
<p>All right, let\u2019s see what we\u2019ve got so far.</p>
<p><img src="${"/assets/post/defx-nvim/preview.png"}" alt="${"preview"}"></p>
<p>It looks ok to me, but not quite yet. Let\u2019s take it even further by adding some icons to make it eye candy. This next step is optional. If you don\u2019t want any icon, you can skip it.</p>
<h2 id="${"adding-icons"}"><a href="${"#adding-icons"}">Adding icons</a></h2>
<p>You know how file explorer in most text editor right? They have an icon that indicates whether it\u2019s a folder or a file. Let\u2019s replicate that in our case.</p>
<p>I use a plugin called <a href="${"https://github.com/kristijanhusak/defx-icons"}" rel="${"nofollow"}">defx-icons</a>. As the name says, it will add some fancy icons to our file explorer. The installation is the same as Defx installation. Add this line to your config.</p>
<pre class="${"language-vim"}">${`<code class="language-vim">Plug <span class="token string">'kristijanhusak/defx-icons'</span></code>`}</pre>
<p>Make sure to source your new config and do <code>:PlugInstall</code> after that. Make sure your terminal is using a patched font which you can get from <a href="${"https://www.nerdfonts.com/font-downloads"}" rel="${"nofollow"}">here</a> so the icons will be displayed correctly. The installation process is finished, let\u2019s configure it now! It\u2019s simple, just add this block of code into your config.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" Set appearance</span>
<span class="token keyword">call</span> defx#custom#<span class="token function">option</span><span class="token punctuation">(</span><span class="token string">'_'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span>
       <span class="token string">'winwidth'</span><span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">,</span>
       <span class="token string">'split'</span><span class="token punctuation">:</span> <span class="token string">'vertical'</span><span class="token punctuation">,</span>
       <span class="token string">'direction'</span><span class="token punctuation">:</span> <span class="token string">'topleft'</span><span class="token punctuation">,</span>
       <span class="token string">'show_ignored_files'</span><span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
       <span class="token string">'buffer_name'</span><span class="token punctuation">:</span> <span class="token string">'defxplorer'</span><span class="token punctuation">,</span>
       <span class="token string">'toggle'</span><span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
       <span class="token string">'columns'</span><span class="token punctuation">:</span> <span class="token string">'icons:filename'</span><span class="token punctuation">,</span>
       <span class="token string">'resume'</span><span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
       <span class="token punctuation">&#125;</span><span class="token punctuation">)</span></code>`}</pre>
<p>As you can see, I added the columns field to the custom option function. It tells Defx to display the icons from our previous plugin. Now, I want to add those arrow symbol that indicates a directory. Let\u2019s add that to our config.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token keyword">call</span> defx#custom#<span class="token function">column</span><span class="token punctuation">(</span><span class="token string">'icon'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span>
       <span class="token string">'directory_icon'</span><span class="token punctuation">:</span> <span class="token string">'\u25B8'</span><span class="token punctuation">,</span>
       <span class="token string">'opened_icon'</span><span class="token punctuation">:</span> <span class="token string">'\u25BE'</span><span class="token punctuation">,</span>
       <span class="token punctuation">&#125;</span><span class="token punctuation">)</span></code>`}</pre>
<p>This block of code creates a new column for the arrow icon. Let\u2019s add that to our custom option function.</p>
<pre class="${"language-vim"}">${`<code class="language-vim"><span class="token comment">" Set appearance</span>
<span class="token keyword">call</span> defx#custom#<span class="token function">option</span><span class="token punctuation">(</span><span class="token string">'_'</span><span class="token punctuation">,</span> <span class="token punctuation">&#123;</span>
       <span class="token string">'winwidth'</span><span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">,</span>
       <span class="token string">'split'</span><span class="token punctuation">:</span> <span class="token string">'vertical'</span><span class="token punctuation">,</span>
       <span class="token string">'direction'</span><span class="token punctuation">:</span> <span class="token string">'topleft'</span><span class="token punctuation">,</span>
       <span class="token string">'show_ignored_files'</span><span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
       <span class="token string">'buffer_name'</span><span class="token punctuation">:</span> <span class="token string">'defxplorer'</span><span class="token punctuation">,</span>
       <span class="token string">'toggle'</span><span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
       <span class="token string">'columns'</span><span class="token punctuation">:</span> <span class="token string">'icon:indent:icons:filename'</span><span class="token punctuation">,</span>
       <span class="token string">'resume'</span><span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
       <span class="token punctuation">&#125;</span><span class="token punctuation">)</span></code>`}</pre>
<p>There we have it, people. We just transformed Defx to look like most IDE/Text Editor file explorer. Let\u2019s compare it side by side.</p>
<p><img src="${"/assets/post/defx-nvim/before.png"}" alt="${"before"}">
<img src="${"/assets/post/defx-nvim/after.png"}" alt="${"after"}"></p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>I think Defx is a good alternative to NERDTree and is worth to try. Some people said that it\u2019s faster and lighter than NERDTree, but it\u2019s not that significant in my experience. Anyway, let\u2019s end this post here. If you get confused, feel free to hit me up! That\u2019s it, see ya next time :)</p>`
  })}`;
});
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Defx_nvim,
  metadata: metadata$1
});
const metadata = {
  title: "My impression on two border window manager",
  date: "2020-04-01T00:00:00.000Z",
  desc: "My impression of a keyboard oriented stacking window manager called Two Border Window Manager or 2BWM",
  tags: ["linux", "window manager"]
};
const _2bwm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(Post, "Layout_MDSVEX_DEFAULT").$$render($$result, Object.assign(metadata), {}, {
    default: () => `<h1 id="${"table-of-content"}"><a href="${"#table-of-content"}">Table of Content</a></h1>
<ul><li><p><a href="${"#introduction"}">Introduction</a></p></li>
<li><p><a href="${"#why-2bwm"}">Why 2BWM?</a></p></li>
<li><p><a href="${"#my-experience"}">My Experience</a></p>
<ul><li><a href="${"#installation"}">Installation</a></li>
<li><a href="${"#usage"}">Usage</a></li></ul></li>
<li><p><a href="${"#conclusion"}">Conclusion</a></p></li></ul>
<h1 id="${"introduction"}"><a href="${"#introduction"}">Introduction</a></h1>
<p>I\u2019ve been using Window Manager for the past 8 months, more or less. Starting from i3, I then moved to i3-gaps, then came across BSPWM. During that period, I switched back and forth between i3-gaps and BSPWM and sometimes tried other WM like Openbox, DWM, AwesomeWM, Xmonad. They\u2019re all work great, but not quite to my taste.</p>
<p>Well, because of this pandemic and whatnot, we\u2019re advised to stay at home. Almost all of public facility such as school, market, etc got closed. This means I have plenty of free time. I decided to use some of my time to try another Window Manager which is 2BWM.</p>
<h1 id="${"why-2bwm"}"><a href="${"#why-2bwm"}">Why 2BWM?</a></h1>
<p>I chose 2bwm mostly because it has 2 borders. I know that you can make BSPWM have 2 borders but I can\u2019t make it work. It uses chwb2 or something like that from wmutils. Another reason is that I want to try a different workflow. i3 and BSPWM is a tiling window manager. I\u2019d assume you already know what a tiling WM is, otherwise <a href="${"https://en.wikipedia.org/wiki/Tiling_window_manager"}" rel="${"nofollow"}">read this</a>.</p>
<p>What makes me more interested in this WM is, even though it\u2019s a floating WM, it can be fully controlled using a keyboard only. You can even move your cursor using a keybind! But I don\u2019t really use this feature.</p>
<h1 id="${"my-experience"}"><a href="${"#my-experience"}">My Experience</a></h1>
<h2 id="${"installation"}"><a href="${"#installation"}">Installation</a></h2>
<p>2BWM is sort of stacking version of DWM (no offense, if some of you DWM fans or 2BWM fans out there gets offended by this). Just like DWM, it\u2019s really minimal, there\u2019s no configuration file. You have to edit the <code>config.h</code> file in the source code and recompile it to apply the change.</p>
<p>So, to install 2bwm is you clone the repo which is over <a href="${"https://github.com/venam/2bwm"}" rel="${"nofollow"}">here</a> and follow the instruction to build it.</p>
<p>At first, I couldn\u2019t make anything works. Can\u2019t open anything using the keybind. I probably messed up the config or something. There\u2019s only a black screen with nothingness. Then I went straight back to BSPWM, saying to myself that I\u2019m not ready for this minimalistic WM.</p>
<p>After about 3 days, I tried it one more time. This time, I decided to use other people config first which was really helpful. Then work my way up from there, changing some configuration and adding several keybinds.</p>
<h2 id="${"usage"}"><a href="${"#usage"}">Usage</a></h2>
<p>So far, it is a <em>great</em> experience. I come to a point where it feels like it\u2019s a peak comfy workflow. I never thought floating WM with keyboard control is my thing. I tried Openbox and the only thing I don\u2019t like about it, you have to use the mouse. I hate using the mouse, it\u2019s way too far. Even though I have a TrackPoint in my Thinkpad, I still don\u2019t quite like it.</p>
<p>You can move a window by using <code>mod+{h,j,k,l}</code> and resize it using <code>mod+shift+{h,j,k,l}</code>. You can also use the mouse if you want. The teleport feature is what I like the most. You can snap windows to left or right, and 4 corners of your screen.</p>
<p>So far, I have no issue with this WM. Though, I only use it for about 3 days as of the time this post is written</p>
<h1 id="${"conclusion"}"><a href="${"#conclusion"}">Conclusion</a></h1>
<p>Even though this WM size is small, it works wonderfully. Much thank you for the creator of this WM. I\u2019m really glad that there\u2019s this WM. If you wonder what\u2019s my desktop looks like, you can see it <a href="${"https://www.reddit.com/r/unixporn/comments/fst8sp/2bwm_apple_pie/?utm_source=share&utm_medium=web2x"}" rel="${"nofollow"}">here</a>. Also, <a href="${"https://github.com/irrellia/dotfiles"}" rel="${"nofollow"}">here</a> are my dotfiles and <a href="${"https://gist.github.com/irrellia/b50a35aff854d2a0983ee4c6ba29f7f9"}" rel="${"nofollow"}">here</a> is my <code>config.h</code> if you want. I think that\u2019s about it, thanks for reading everyone and stay safe! I really hope this pandemic ends as soon as possible.</p>`
  })}`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: _2bwm,
  metadata
});
const Moon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {width} = $$props;
  let {height} = $$props;
  let {className} = $$props;
  if ($$props.width === void 0 && $$bindings.width && width !== void 0)
    $$bindings.width(width);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0)
    $$bindings.height(height);
  if ($$props.className === void 0 && $$bindings.className && className !== void 0)
    $$bindings.className(className);
  return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", width, 0)}${add_attribute("height", height, 0)} viewBox="${"0 0 24 24"}" fill="${"none"}" stroke="${"currentColor"}" stroke-width="${"2"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}"${add_attribute("class", "feather feather-moon" + className, 0)}><path d="${"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"}"></path></svg>`;
});
const Logo = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {className} = $$props;
  if ($$props.className === void 0 && $$bindings.className && className !== void 0)
    $$bindings.className(className);
  return `<svg width="${"77"}" height="${"22"}" viewBox="${"0 0 77 22"}" fill="${"none"}" xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("class", className, 0)}><path d="${"M10.336 9.776C10.864 9.776 11.272 9.92 11.56 10.208C11.864 10.496 12.016 10.896 12.016 11.408C12.016 11.536 12 11.672 11.968 11.816C11.952 11.944 11.928 12.056 11.896 12.152C11.688 12.12 11.456 12.096 11.2 12.08C10.944 12.048 10.64 12.032 10.288 12.032C9.6 12.032 8.904 12.096 8.2 12.224C7.496 12.336 6.824 12.432 6.184 12.512C5.816 13.36 5.48 14.184 5.176 14.984C4.872 15.768 4.608 16.488 4.384 17.144C4.176 17.8 4.008 18.368 3.88 18.848C3.768 19.328 3.704 19.688 3.688 19.928C4.984 19.656 6.288 19.424 7.6 19.232C8.928 19.04 10.32 18.896 11.776 18.8C11.952 19.072 12.096 19.368 12.208 19.688C12.336 20.008 12.4 20.352 12.4 20.72C12.4 20.816 12.4 20.92 12.4 21.032C12.4 21.144 12.384 21.256 12.352 21.368C11.904 21.352 11.432 21.336 10.936 21.32C10.44 21.32 9.792 21.32 8.992 21.32C8.464 21.32 7.96 21.328 7.48 21.344C7.016 21.376 6.544 21.416 6.064 21.464C5.584 21.512 5.072 21.576 4.528 21.656C4 21.736 3.4 21.832 2.728 21.944C1.992 21.656 1.28 20.952 0.592 19.832C0.864 19.256 1.24 18.384 1.72 17.216C2.216 16.032 2.84 14.456 3.592 12.488C2.872 12.264 2.4 11.864 2.176 11.288C2.256 11.208 2.488 11.112 2.872 11C3.256 10.872 3.728 10.744 4.288 10.616C4.528 9.992 4.728 9.448 4.888 8.984C5.064 8.52 5.216 8.088 5.344 7.688C5.472 7.272 5.584 6.872 5.68 6.488C5.792 6.088 5.896 5.656 5.992 5.192C5.432 5.16 4.992 5.008 4.672 4.736C4.352 4.448 4.192 4.08 4.192 3.632C4.192 3.504 4.208 3.352 4.24 3.176C4.288 3 4.336 2.848 4.384 2.72C4.704 2.768 5.008 2.8 5.296 2.816C5.6 2.832 5.992 2.84 6.472 2.84C7.48 2.84 8.424 2.816 9.304 2.768C10.184 2.704 10.976 2.64 11.68 2.576C12.4 2.512 13.016 2.456 13.528 2.408C14.04 2.344 14.432 2.312 14.704 2.312C15.072 2.312 15.4 2.504 15.688 2.888C15.976 3.272 16.192 3.816 16.336 4.52C15.84 4.472 15.432 4.44 15.112 4.424C14.808 4.408 14.536 4.4 14.296 4.4C13.416 4.4 12.608 4.448 11.872 4.544C11.152 4.624 10.456 4.712 9.784 4.808C9.688 4.952 9.576 5.136 9.448 5.36C9.336 5.584 9.184 5.896 8.992 6.296C8.8 6.696 8.56 7.2 8.272 7.808C8 8.416 7.664 9.176 7.264 10.088C7.872 9.992 8.44 9.92 8.968 9.872C9.512 9.808 9.968 9.776 10.336 9.776ZM14.6009 18.464C14.6009 17.76 14.7689 16.776 15.1049 15.512C15.4409 14.232 15.9129 12.744 16.5209 11.048C17.5129 8.344 18.4409 6.096 19.3049 4.304C20.1849 2.496 21.0409 1.088 21.8729 0.079999C22.0649 0.111999 22.2969 0.191998 22.5689 0.319999C22.8569 0.447999 23.1369 0.591999 23.4089 0.751999C23.6809 0.895999 23.9209 1.048 24.1289 1.208C24.3529 1.368 24.4969 1.496 24.5609 1.592C23.3129 3.064 22.2169 4.648 21.2729 6.344C20.3289 8.04 19.4649 9.984 18.6809 12.176C18.0089 14.064 17.4969 15.768 17.1449 17.288C16.7929 18.792 16.6169 20.048 16.6169 21.056C16.6169 21.328 16.6169 21.496 16.6169 21.56C16.6169 21.624 16.6249 21.688 16.6409 21.752C16.4169 21.72 16.2249 21.664 16.0649 21.584C15.9049 21.504 15.8009 21.408 15.7529 21.296C15.7209 21.216 15.6329 21.096 15.4889 20.936C15.3449 20.792 15.2169 20.68 15.1049 20.6C14.9609 20.504 14.8409 20.256 14.7449 19.856C14.6489 19.44 14.6009 18.976 14.6009 18.464ZM20.3208 18.392C20.3208 18.248 20.3288 18.072 20.3448 17.864C20.3768 17.64 20.4248 17.352 20.4888 17C20.5528 16.632 20.6328 16.192 20.7288 15.68C20.8408 15.168 20.9768 14.552 21.1367 13.832C21.1688 13.672 21.2408 13.416 21.3528 13.064C21.4648 12.712 21.6088 12.344 21.7848 11.96C21.9768 11.56 22.2008 11.176 22.4568 10.808C22.7288 10.44 23.0488 10.168 23.4168 9.992C23.6888 10.056 24.0488 10.224 24.4968 10.496C24.9448 10.752 25.3288 11.112 25.6488 11.576C25.2808 11.992 24.9688 12.408 24.7128 12.824C24.4728 13.24 24.2488 13.672 24.0408 14.12C23.8488 14.568 23.6648 15.032 23.4888 15.512C23.3288 15.992 23.1448 16.496 22.9368 17.024C22.7608 17.472 22.6008 17.936 22.4568 18.416C22.3128 18.88 22.2328 19.288 22.2168 19.64C22.2168 19.928 22.2088 20.128 22.1928 20.24C22.1928 20.368 22.1528 20.432 22.0728 20.432C22.0088 20.432 21.8808 20.392 21.6888 20.312C21.4968 20.232 21.2968 20.112 21.0888 19.952C20.8968 19.776 20.7208 19.56 20.5608 19.304C20.4008 19.048 20.3208 18.744 20.3208 18.392ZM24.9048 7.976C24.9048 7.88 24.9288 7.736 24.9768 7.544C24.8968 7.464 24.8248 7.344 24.7608 7.184C24.7128 7.024 24.6888 6.88 24.6888 6.752C24.6888 6.608 24.7048 6.416 24.7368 6.176C24.7848 5.92 24.8408 5.648 24.9048 5.36C24.9688 5.072 25.0488 4.776 25.1448 4.472C25.2408 4.152 25.3368 3.864 25.4328 3.608C25.6248 3.608 25.8568 3.664 26.1288 3.776C26.4168 3.872 26.7048 4.008 26.9928 4.184C27.2808 4.344 27.5448 4.528 27.7848 4.736C28.0248 4.928 28.2088 5.112 28.3368 5.288C28.1608 5.464 27.9288 5.712 27.6408 6.032C27.3528 6.336 27.0728 6.664 26.8008 7.016C26.5288 7.352 26.2808 7.672 26.0568 7.976C25.8328 8.28 25.6888 8.496 25.6248 8.624C25.4328 8.592 25.2648 8.512 25.1208 8.384C24.9768 8.24 24.9048 8.104 24.9048 7.976ZM34.2486 10.304C34.4086 10.304 34.5926 10.336 34.8006 10.4C35.0246 10.448 35.2246 10.52 35.4006 10.616C35.5766 10.696 35.7206 10.784 35.8326 10.88C35.9606 10.976 36.0246 11.064 36.0246 11.144C35.7046 11.816 35.4086 12.496 35.1366 13.184C34.8646 13.856 34.6326 14.504 34.4406 15.128C34.2486 15.752 34.0966 16.336 33.9846 16.88C33.8886 17.424 33.8406 17.896 33.8406 18.296C33.8406 18.744 33.8886 19.12 33.9846 19.424C34.0806 19.712 34.2406 19.92 34.4646 20.048C34.2726 20.176 34.0246 20.28 33.7206 20.36C33.4166 20.44 33.1446 20.48 32.9046 20.48C32.0406 20.48 31.6086 19.888 31.6086 18.704C31.6086 17.792 31.9126 16.544 32.5206 14.96C32.2006 15.696 31.8326 16.392 31.4166 17.048C31.0006 17.688 30.5766 18.256 30.1446 18.752C29.7126 19.248 29.2726 19.656 28.8246 19.976C28.3926 20.28 27.9926 20.464 27.6246 20.528C27.0326 20.496 26.5526 20.216 26.1846 19.688C25.8166 19.144 25.6326 18.456 25.6326 17.624C25.6326 16.728 25.8246 15.784 26.2086 14.792C26.5926 13.8 27.0806 12.88 27.6726 12.032C28.2806 11.184 28.9366 10.48 29.6406 9.92C30.3446 9.344 31.0246 9.04 31.6806 9.008C31.8406 9.056 32.0166 9.152 32.2086 9.296C32.4166 9.44 32.6086 9.608 32.7846 9.8C32.9766 9.992 33.1366 10.192 33.2646 10.4C33.3926 10.592 33.4646 10.76 33.4806 10.904C32.8406 11 32.1766 11.312 31.4886 11.84C30.8166 12.368 30.2006 13.008 29.6406 13.76C29.0966 14.496 28.6486 15.288 28.2966 16.136C27.9446 16.984 27.7686 17.776 27.7686 18.512C27.7686 18.816 27.8806 19.008 28.1046 19.088C28.5686 18.992 29.1046 18.6 29.7126 17.912C30.3206 17.208 31.0566 16.128 31.9206 14.672C32.0806 14.384 32.2566 14.064 32.4486 13.712C32.6566 13.36 32.8646 12.992 33.0726 12.608C33.2806 12.224 33.4806 11.84 33.6726 11.456C33.8806 11.056 34.0726 10.672 34.2486 10.304ZM41.1301 8.36C41.5461 8.488 41.9381 8.776 42.3061 9.224C42.6741 9.656 42.9461 10.136 43.1221 10.664C42.9461 11.096 42.6741 11.616 42.3061 12.224C41.9381 12.832 41.5701 13.456 41.2021 14.096C40.8341 14.72 40.4981 15.32 40.1941 15.896C39.9061 16.456 39.7381 16.92 39.6901 17.288C39.9461 17.016 40.2261 16.704 40.5301 16.352C40.8501 15.984 41.1541 15.624 41.4421 15.272C41.7461 14.904 42.0261 14.576 42.2821 14.288C42.5381 13.984 42.7381 13.76 42.8821 13.616C43.1861 13.296 43.5461 12.928 43.9621 12.512C44.3781 12.08 44.8101 11.68 45.2581 11.312C45.7221 10.928 46.1861 10.608 46.6501 10.352C47.1141 10.08 47.5381 9.944 47.9221 9.944C48.3381 9.944 48.6821 10.088 48.9541 10.376C49.2421 10.648 49.4661 10.936 49.6261 11.24C49.6261 11.272 49.5621 11.32 49.4341 11.384C49.3221 11.432 49.1541 11.584 48.9301 11.84C48.7061 12.128 48.4501 12.528 48.1621 13.04C47.8901 13.536 47.6181 14.08 47.3461 14.672C47.0901 15.248 46.8741 15.84 46.6981 16.448C46.5221 17.056 46.4341 17.608 46.4341 18.104C46.4341 18.504 46.4821 18.76 46.5781 18.872C46.6901 18.984 46.8421 19.04 47.0341 19.04C47.2101 19.04 47.3941 19 47.5861 18.92C47.7781 18.84 47.9301 18.8 48.0421 18.8C48.1061 18.832 48.1541 18.904 48.1861 19.016C48.2341 19.112 48.2581 19.2 48.2581 19.28C48.1301 19.392 47.9781 19.504 47.8021 19.616C47.6261 19.728 47.4421 19.832 47.2501 19.928C47.0581 20.024 46.8661 20.104 46.6741 20.168C46.4981 20.232 46.3381 20.264 46.1941 20.264C45.7301 20.264 45.3461 20.192 45.0421 20.048C44.7541 19.92 44.5221 19.744 44.3461 19.52C44.1861 19.296 44.0741 19.032 44.0101 18.728C43.9461 18.408 43.9141 18.072 43.9141 17.72C43.9141 17.528 43.9301 17.312 43.9621 17.072C43.9941 16.832 44.0581 16.552 44.1541 16.232C44.2501 15.896 44.3861 15.504 44.5621 15.056C44.7381 14.592 44.9621 14.04 45.2341 13.4C45.2021 13.4 44.9861 13.512 44.5861 13.736C44.1861 13.96 43.7541 14.304 43.2901 14.768C42.5381 15.488 41.8581 16.2 41.2501 16.904C40.6581 17.608 40.0501 18.392 39.4261 19.256C39.0741 19.752 38.7621 20.168 38.4901 20.504C38.2341 20.856 38.0101 21.088 37.8181 21.2C37.4821 21.008 37.2341 20.736 37.0741 20.384C36.9141 20.048 36.7941 19.696 36.7141 19.328C36.7141 19.024 36.7541 18.64 36.8341 18.176C36.9301 17.712 37.0501 17.2 37.1941 16.64C37.3541 16.064 37.5461 15.464 37.7701 14.84C37.9941 14.216 38.2421 13.592 38.5141 12.968C39.1221 11.56 39.6741 10.456 40.1701 9.656C40.6821 8.856 41.0021 8.424 41.1301 8.36ZM50.227 18.392C50.227 18.248 50.235 18.072 50.251 17.864C50.283 17.64 50.331 17.352 50.395 17C50.459 16.632 50.539 16.192 50.635 15.68C50.747 15.168 50.883 14.552 51.043 13.832C51.075 13.672 51.147 13.416 51.259 13.064C51.371 12.712 51.515 12.344 51.691 11.96C51.883 11.56 52.107 11.176 52.363 10.808C52.635 10.44 52.955 10.168 53.323 9.992C53.595 10.056 53.955 10.224 54.403 10.496C54.851 10.752 55.235 11.112 55.555 11.576C55.187 11.992 54.875 12.408 54.619 12.824C54.379 13.24 54.155 13.672 53.947 14.12C53.755 14.568 53.571 15.032 53.395 15.512C53.235 15.992 53.051 16.496 52.843 17.024C52.667 17.472 52.507 17.936 52.363 18.416C52.219 18.88 52.139 19.288 52.123 19.64C52.123 19.928 52.115 20.128 52.099 20.24C52.099 20.368 52.059 20.432 51.979 20.432C51.915 20.432 51.787 20.392 51.595 20.312C51.403 20.232 51.203 20.112 50.995 19.952C50.803 19.776 50.627 19.56 50.467 19.304C50.307 19.048 50.227 18.744 50.227 18.392ZM54.811 7.976C54.811 7.88 54.835 7.736 54.883 7.544C54.803 7.464 54.731 7.344 54.667 7.184C54.619 7.024 54.595 6.88 54.595 6.752C54.595 6.608 54.611 6.416 54.643 6.176C54.691 5.92 54.747 5.648 54.811 5.36C54.875 5.072 54.955 4.776 55.051 4.472C55.147 4.152 55.243 3.864 55.339 3.608C55.531 3.608 55.763 3.664 56.035 3.776C56.323 3.872 56.611 4.008 56.899 4.184C57.187 4.344 57.451 4.528 57.691 4.736C57.931 4.928 58.115 5.112 58.243 5.288C58.067 5.464 57.835 5.712 57.547 6.032C57.259 6.336 56.979 6.664 56.707 7.016C56.435 7.352 56.187 7.672 55.963 7.976C55.739 8.28 55.595 8.496 55.531 8.624C55.339 8.592 55.171 8.512 55.027 8.384C54.883 8.24 54.811 8.104 54.811 7.976ZM57.1949 11.504C57.1949 11.216 57.2109 10.944 57.2429 10.688C57.2909 10.432 57.3789 10.216 57.5069 10.04C57.6349 9.848 57.8109 9.704 58.0349 9.608C58.2589 9.496 58.5549 9.44 58.9229 9.44C59.1469 9.44 59.3949 9.464 59.6669 9.512C59.9549 9.56 60.1629 9.648 60.2909 9.776C60.2269 10.048 60.1709 10.288 60.1229 10.496C60.0909 10.704 60.0589 10.936 60.0269 11.192C60.0109 11.432 59.9949 11.728 59.9789 12.08C59.9629 12.416 59.9469 12.856 59.9309 13.4C59.8989 14.488 59.8429 15.464 59.7629 16.328C59.6989 17.176 59.5389 18.024 59.2829 18.872C59.2829 18.936 59.3069 18.968 59.3549 18.968C59.5949 18.792 59.8669 18.536 60.1709 18.2C60.4749 17.864 60.7949 17.488 61.1309 17.072C61.4669 16.64 61.8029 16.184 62.1389 15.704C62.4749 15.224 62.7869 14.752 63.0749 14.288C63.4589 13.616 63.8829 12.776 64.3469 11.768C64.8109 10.76 65.1949 9.68 65.4989 8.528C65.5949 8.528 65.7149 8.552 65.8589 8.6C66.0189 8.632 66.1709 8.68 66.3149 8.744C66.4749 8.792 66.6109 8.848 66.7229 8.912C66.8509 8.976 66.9389 9.032 66.9869 9.08C66.9549 9.768 66.7869 10.472 66.4829 11.192C66.1949 11.912 65.8429 12.608 65.4269 13.28C65.0109 13.952 64.5709 14.584 64.1069 15.176C63.6429 15.768 63.2189 16.28 62.8349 16.712C62.0669 17.608 61.2909 18.408 60.5069 19.112C59.7389 19.816 58.8189 20.496 57.7469 21.152C57.3309 20.992 57.0029 20.776 56.7629 20.504C56.5229 20.248 56.4029 19.976 56.4029 19.688C56.4029 19.496 56.4429 19.28 56.5229 19.04C56.6189 18.784 56.7229 18.464 56.8349 18.08C56.9469 17.68 57.0429 17.184 57.1229 16.592C57.2189 16 57.2669 15.248 57.2669 14.336C57.2669 13.808 57.2509 13.28 57.2189 12.752C57.2029 12.208 57.1949 11.792 57.1949 11.504ZM74.9127 10.304C75.0727 10.304 75.2567 10.336 75.4647 10.4C75.6887 10.448 75.8887 10.52 76.0647 10.616C76.2407 10.696 76.3847 10.784 76.4967 10.88C76.6247 10.976 76.6887 11.064 76.6887 11.144C76.3687 11.816 76.0727 12.496 75.8007 13.184C75.5287 13.856 75.2967 14.504 75.1047 15.128C74.9127 15.752 74.7607 16.336 74.6487 16.88C74.5527 17.424 74.5047 17.896 74.5047 18.296C74.5047 18.744 74.5527 19.12 74.6487 19.424C74.7447 19.712 74.9047 19.92 75.1287 20.048C74.9367 20.176 74.6887 20.28 74.3847 20.36C74.0807 20.44 73.8087 20.48 73.5687 20.48C72.7047 20.48 72.2727 19.888 72.2727 18.704C72.2727 17.792 72.5767 16.544 73.1847 14.96C72.8647 15.696 72.4967 16.392 72.0807 17.048C71.6647 17.688 71.2407 18.256 70.8087 18.752C70.3767 19.248 69.9367 19.656 69.4887 19.976C69.0567 20.28 68.6567 20.464 68.2887 20.528C67.6967 20.496 67.2167 20.216 66.8487 19.688C66.4807 19.144 66.2967 18.456 66.2967 17.624C66.2967 16.728 66.4887 15.784 66.8727 14.792C67.2567 13.8 67.7447 12.88 68.3367 12.032C68.9447 11.184 69.6007 10.48 70.3047 9.92C71.0087 9.344 71.6887 9.04 72.3447 9.008C72.5047 9.056 72.6807 9.152 72.8727 9.296C73.0807 9.44 73.2727 9.608 73.4487 9.8C73.6407 9.992 73.8007 10.192 73.9287 10.4C74.0567 10.592 74.1287 10.76 74.1447 10.904C73.5047 11 72.8407 11.312 72.1527 11.84C71.4807 12.368 70.8647 13.008 70.3047 13.76C69.7607 14.496 69.3127 15.288 68.9607 16.136C68.6087 16.984 68.4327 17.776 68.4327 18.512C68.4327 18.816 68.5447 19.008 68.7687 19.088C69.2327 18.992 69.7687 18.6 70.3767 17.912C70.9847 17.208 71.7207 16.128 72.5847 14.672C72.7447 14.384 72.9207 14.064 73.1127 13.712C73.3207 13.36 73.5287 12.992 73.7367 12.608C73.9447 12.224 74.1447 11.84 74.3367 11.456C74.5447 11.056 74.7367 10.672 74.9127 10.304Z"}" fill="${"currentColor"}"></path></svg>`;
});
var Navbar_svelte = '.navbar.svelte-140cklc.svelte-140cklc.svelte-140cklc{height:4rem;border-bottom:0.0625rem var(--color-borders) solid;z-index:30;background-color:var(--color-alt-bg);position:fixed;left:0;right:0;top:0}.navbar.svelte-140cklc .active.svelte-140cklc a.svelte-140cklc{color:var(--color-shine)}.navbar__container.svelte-140cklc.svelte-140cklc.svelte-140cklc{height:100%;display:flex;align-items:center;max-width:1080px;margin:0 auto;padding:0 1rem}.navbar__title.svelte-140cklc.svelte-140cklc.svelte-140cklc{flex:1}.navbar__title.svelte-140cklc a.svelte-140cklc.svelte-140cklc{font-weight:400;text-decoration:none;color:var(--color-main-text);transition:color ease-out 0.1s}.navbar__title.svelte-140cklc a.svelte-140cklc.svelte-140cklc:hover{color:var(--color-main-accent)}.navbar__items.svelte-140cklc.svelte-140cklc.svelte-140cklc{list-style:none;display:flex;gap:1rem;align-items:center;justify-items:center}.navbar__item.svelte-140cklc.svelte-140cklc.svelte-140cklc{padding-top:0.25rem}.navbar__item.svelte-140cklc a.svelte-140cklc.svelte-140cklc{font-family:"Overpass", sans-serif;font-size:1.125rem;line-height:1.5em;position:relative;color:var(--color-alt-text);text-decoration:none;transition:color ease-out 0.1s}.navbar__item.svelte-140cklc a.svelte-140cklc.svelte-140cklc:hover{color:var(--color-shine)}.navbar__item.svelte-140cklc a.svelte-140cklc.svelte-140cklc:hover::after{transform:scale(1)}.navbar__item.svelte-140cklc a.svelte-140cklc.svelte-140cklc::after{content:"";position:absolute;bottom:-0.25rem;left:0;right:0;height:0.125rem;background-color:var(--color-main-accent);transform:scale(0);transition:transform ease-out 0.2s}.navbar__hamburger.svelte-140cklc.svelte-140cklc.svelte-140cklc{display:none;cursor:pointer}.navbar__checkbox.svelte-140cklc.svelte-140cklc.svelte-140cklc{opacity:0}.navbar__button.svelte-140cklc.svelte-140cklc.svelte-140cklc{border:none;background:none;outline:none;display:flex;align-items:center;color:var(--color-main-text);cursor:pointer}@media only screen and (max-width: 480px){.navbar__items.svelte-140cklc.svelte-140cklc.svelte-140cklc{display:none}.navbar__hamburger.svelte-140cklc.svelte-140cklc.svelte-140cklc{position:relative;display:grid;grid-template-rows:repeat(3, 1fr);gap:0.25rem;width:1.5rem;height:0.85rem}.navbar__checkbox.svelte-140cklc.svelte-140cklc.svelte-140cklc{position:absolute;min-width:1.5rem;min-height:1.5rem;z-index:50}.navbar__checkbox.svelte-140cklc:checked~.navbar__hamburger_item--1.svelte-140cklc.svelte-140cklc{transform:rotate(45deg) translate3d(0, 0.5rem, 0)}.navbar__checkbox.svelte-140cklc:checked~.navbar__hamburger_item--2.svelte-140cklc.svelte-140cklc{transform:scale(0)}.navbar__checkbox.svelte-140cklc:checked~.navbar__hamburger_item--3.svelte-140cklc.svelte-140cklc{transform:rotate(-45deg) translate3d(0, -0.5rem, 0)}[class^="navbar__hamburger_item"].svelte-140cklc.svelte-140cklc.svelte-140cklc{position:relative;display:block;background-color:var(--color-main-text);transition:transform ease-out 0.2s}.navbar__mobile.svelte-140cklc.svelte-140cklc.svelte-140cklc{position:fixed;z-index:20;top:0;left:0;right:0;bottom:0;background-color:var(--color-alt-bg);display:flex;align-items:center;justify-content:center}.navbar__mobile_items.svelte-140cklc.svelte-140cklc.svelte-140cklc{display:grid;grid-template-rows:repeat(5, 1fr);align-items:center;justify-items:center;gap:2rem;list-style:none}.navbar__mobile_item.svelte-140cklc a.svelte-140cklc.svelte-140cklc{font-family:"Overpass", sans-serif;text-decoration:none;font-size:1.5rem;color:var(--color-main-text)}}';
const css$3 = {
  code: '.navbar.svelte-140cklc.svelte-140cklc.svelte-140cklc{height:4rem;border-bottom:0.0625rem var(--color-borders) solid;z-index:30;background-color:var(--color-alt-bg);position:fixed;left:0;right:0;top:0}.navbar.svelte-140cklc .active.svelte-140cklc a.svelte-140cklc{color:var(--color-shine)}.navbar__container.svelte-140cklc.svelte-140cklc.svelte-140cklc{height:100%;display:flex;align-items:center;max-width:1080px;margin:0 auto;padding:0 1rem}.navbar__title.svelte-140cklc.svelte-140cklc.svelte-140cklc{flex:1}.navbar__title.svelte-140cklc a.svelte-140cklc.svelte-140cklc{font-weight:400;text-decoration:none;color:var(--color-main-text);transition:color ease-out 0.1s}.navbar__title.svelte-140cklc a.svelte-140cklc.svelte-140cklc:hover{color:var(--color-main-accent)}.navbar__items.svelte-140cklc.svelte-140cklc.svelte-140cklc{list-style:none;display:flex;gap:1rem;align-items:center;justify-items:center}.navbar__item.svelte-140cklc.svelte-140cklc.svelte-140cklc{padding-top:0.25rem}.navbar__item.svelte-140cklc a.svelte-140cklc.svelte-140cklc{font-family:"Overpass", sans-serif;font-size:1.125rem;line-height:1.5em;position:relative;color:var(--color-alt-text);text-decoration:none;transition:color ease-out 0.1s}.navbar__item.svelte-140cklc a.svelte-140cklc.svelte-140cklc:hover{color:var(--color-shine)}.navbar__item.svelte-140cklc a.svelte-140cklc.svelte-140cklc:hover::after{transform:scale(1)}.navbar__item.svelte-140cklc a.svelte-140cklc.svelte-140cklc::after{content:"";position:absolute;bottom:-0.25rem;left:0;right:0;height:0.125rem;background-color:var(--color-main-accent);transform:scale(0);transition:transform ease-out 0.2s}.navbar__hamburger.svelte-140cklc.svelte-140cklc.svelte-140cklc{display:none;cursor:pointer}.navbar__checkbox.svelte-140cklc.svelte-140cklc.svelte-140cklc{opacity:0}.navbar__button.svelte-140cklc.svelte-140cklc.svelte-140cklc{border:none;background:none;outline:none;display:flex;align-items:center;color:var(--color-main-text);cursor:pointer}@media only screen and (max-width: 480px){.navbar__items.svelte-140cklc.svelte-140cklc.svelte-140cklc{display:none}.navbar__hamburger.svelte-140cklc.svelte-140cklc.svelte-140cklc{position:relative;display:grid;grid-template-rows:repeat(3, 1fr);gap:0.25rem;width:1.5rem;height:0.85rem}.navbar__checkbox.svelte-140cklc.svelte-140cklc.svelte-140cklc{position:absolute;min-width:1.5rem;min-height:1.5rem;z-index:50}.navbar__checkbox.svelte-140cklc:checked~.navbar__hamburger_item--1.svelte-140cklc.svelte-140cklc{transform:rotate(45deg) translate3d(0, 0.5rem, 0)}.navbar__checkbox.svelte-140cklc:checked~.navbar__hamburger_item--2.svelte-140cklc.svelte-140cklc{transform:scale(0)}.navbar__checkbox.svelte-140cklc:checked~.navbar__hamburger_item--3.svelte-140cklc.svelte-140cklc{transform:rotate(-45deg) translate3d(0, -0.5rem, 0)}[class^="navbar__hamburger_item"].svelte-140cklc.svelte-140cklc.svelte-140cklc{position:relative;display:block;background-color:var(--color-main-text);transition:transform ease-out 0.2s}.navbar__mobile.svelte-140cklc.svelte-140cklc.svelte-140cklc{position:fixed;z-index:20;top:0;left:0;right:0;bottom:0;background-color:var(--color-alt-bg);display:flex;align-items:center;justify-content:center}.navbar__mobile_items.svelte-140cklc.svelte-140cklc.svelte-140cklc{display:grid;grid-template-rows:repeat(5, 1fr);align-items:center;justify-items:center;gap:2rem;list-style:none}.navbar__mobile_item.svelte-140cklc a.svelte-140cklc.svelte-140cklc{font-family:"Overpass", sans-serif;text-decoration:none;font-size:1.5rem;color:var(--color-main-text)}}',
  map: '{"version":3,"file":"Navbar.svelte","sources":["Navbar.svelte"],"sourcesContent":["<style>\\n.navbar {\\n  height: 4rem;\\n  border-bottom: 0.0625rem var(--color-borders) solid;\\n  z-index: 30;\\n  background-color: var(--color-alt-bg);\\n  position: fixed;\\n  left: 0;\\n  right: 0;\\n  top: 0;\\n}\\n\\n.navbar .active a {\\n  color: var(--color-shine);\\n}\\n\\n.navbar__container {\\n  height: 100%;\\n  display: flex;\\n  align-items: center;\\n  max-width: 1080px;\\n  margin: 0 auto;\\n  padding: 0 1rem;\\n}\\n\\n.navbar__title {\\n  flex: 1;\\n}\\n\\n.navbar__title a {\\n  font-weight: 400;\\n  text-decoration: none;\\n  color: var(--color-main-text);\\n  transition: color ease-out 0.1s;\\n}\\n\\n.navbar__title a:hover {\\n  color: var(--color-main-accent);\\n}\\n\\n.navbar__items {\\n  list-style: none;\\n  display: flex;\\n  gap: 1rem;\\n  align-items: center;\\n  justify-items: center;\\n}\\n\\n.navbar__item {\\n  padding-top: 0.25rem;\\n}\\n\\n.navbar__item a {\\n  font-family: \\"Overpass\\", sans-serif;\\n  font-size: 1.125rem;\\n  line-height: 1.5em;\\n  position: relative;\\n  color: var(--color-alt-text);\\n  text-decoration: none;\\n  transition: color ease-out 0.1s;\\n}\\n\\n.navbar__item a:hover {\\n  color: var(--color-shine);\\n}\\n\\n.navbar__item a:hover::after {\\n  transform: scale(1);\\n}\\n\\n.navbar__item a::after {\\n  content: \\"\\";\\n  position: absolute;\\n  bottom: -0.25rem;\\n  left: 0;\\n  right: 0;\\n  height: 0.125rem;\\n  background-color: var(--color-main-accent);\\n  transform: scale(0);\\n  transition: transform ease-out 0.2s;\\n}\\n\\n.navbar__hamburger {\\n  display: none;\\n  cursor: pointer;\\n}\\n\\n.navbar__checkbox {\\n  opacity: 0;\\n}\\n\\n.navbar__button {\\n  border: none;\\n  background: none;\\n  outline: none;\\n  display: flex;\\n  align-items: center;\\n  color: var(--color-main-text);\\n  cursor: pointer;\\n}\\n\\n@media only screen and (max-width: 480px) {\\n  .navbar__items {\\n    display: none;\\n  }\\n\\n  .navbar__hamburger {\\n    position: relative;\\n    display: grid;\\n    grid-template-rows: repeat(3, 1fr);\\n    gap: 0.25rem;\\n    width: 1.5rem;\\n    height: 0.85rem;\\n  }\\n\\n  .navbar__checkbox {\\n    position: absolute;\\n    min-width: 1.5rem;\\n    min-height: 1.5rem;\\n    z-index: 50;\\n  }\\n\\n  .navbar__checkbox:checked ~ .navbar__hamburger_item--1 {\\n    transform: rotate(45deg) translate3d(0, 0.5rem, 0);\\n  }\\n\\n  .navbar__checkbox:checked ~ .navbar__hamburger_item--2 {\\n    transform: scale(0);\\n  }\\n\\n  .navbar__checkbox:checked ~ .navbar__hamburger_item--3 {\\n    transform: rotate(-45deg) translate3d(0, -0.5rem, 0);\\n  }\\n\\n  [class^=\\"navbar__hamburger_item\\"] {\\n    position: relative;\\n    display: block;\\n    background-color: var(--color-main-text);\\n    transition: transform ease-out 0.2s;\\n  }\\n\\n  .navbar__mobile {\\n    position: fixed;\\n    z-index: 20;\\n    top: 0;\\n    left: 0;\\n    right: 0;\\n    bottom: 0;\\n    background-color: var(--color-alt-bg);\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n  }\\n\\n  .navbar__mobile_items {\\n    display: grid;\\n    grid-template-rows: repeat(5, 1fr);\\n    align-items: center;\\n    justify-items: center;\\n    gap: 2rem;\\n    list-style: none;\\n  }\\n\\n  .navbar__mobile_item a {\\n    font-family: \\"Overpass\\", sans-serif;\\n    text-decoration: none;\\n    font-size: 1.5rem;\\n    color: var(--color-main-text);\\n  }\\n}\\n</style>\\n\\n<nav class=\\"navbar\\">\\n  <div class=\\"navbar__container\\">\\n    <div class=\\"navbar__title\\">\\n      <a href=\\"/\\" aria-label=\\"logo\\"><Logo className=\\"logo__icon\\" /></a>\\n    </div>\\n    <ul class=\\"navbar__items\\">\\n      <li class=\\"navbar__item\\"><a href=\\"/\\">Home</a></li>\\n      <li class=\\"navbar__item\\" class:active={segment === \\"post\\"}>\\n        <a href=\\"/post\\">Posts</a>\\n      </li>\\n      <li class=\\"navbar__item\\" class:active={segment === \\"project\\"}>\\n        <a href=\\"/project\\">Projects</a>\\n      </li>\\n      <li class=\\"navbar__item\\" class:active={segment === \\"about\\"}>\\n        <a href=\\"/about\\">About</a>\\n      </li>\\n      <li class=\\"navbar__item\\">\\n        <button\\n          class=\\"navbar__button\\"\\n          on:click={toggleDarkMode}\\n          aria-label=\\"toggle darkmode\\"\\n        >\\n          <Moon className=\\"navbar__darkmode\\" width=\\"1.5rem\\" height=\\"1.5rem\\" />\\n        </button>\\n      </li>\\n    </ul>\\n    <div class=\\"navbar__hamburger\\" transition:fade={{ duration: 200 }}>\\n      <input\\n        class=\\"navbar__checkbox\\"\\n        on:input|stopPropagation={toggleNav}\\n        type=\\"checkbox\\"\\n        {checked}\\n        aria-label=\\"toggle menu\\"\\n      />\\n      <span class=\\"navbar__hamburger_item--1\\" />\\n      <span class=\\"navbar__hamburger_item--2\\" />\\n      <span class=\\"navbar__hamburger_item--3\\" />\\n    </div>\\n  </div>\\n</nav>\\n{#if isVisible}\\n  <div class=\\"navbar__mobile\\" transition:fly={{ duration: 200, y: -100 }}>\\n    <ul class=\\"navbar__mobile_items\\">\\n      <li class=\\"navbar__mobile_item\\" on:click={toggleNav}>\\n        <a href=\\"/\\">Home</a>\\n      </li>\\n      <li class=\\"navbar__mobile_item\\" class:active={segment === \\"post\\"}>\\n        <a href=\\"/post\\" on:click={toggleNav}>Posts</a>\\n      </li>\\n      <li class=\\"navbar__mobile_item\\" class:active={segment === \\"project\\"}>\\n        <a href=\\"/project\\" on:click={toggleNav}>Projects</a>\\n      </li>\\n      <li class=\\"navbar__mobile_item\\" class:active={segment === \\"about\\"}>\\n        <a href=\\"/about\\" on:click={toggleNav}>About</a>\\n      </li>\\n      <li class=\\"navbar__mobile_item\\">\\n        <button\\n          class=\\"navbar__button\\"\\n          on:click={toggleDarkMode}\\n          aria-label=\\"toggle darkmode\\"\\n        >\\n          <Moon className=\\"navbar__darkmode\\" width=\\"1.5rem\\" height=\\"1.5rem\\" />\\n        </button>\\n      </li>\\n    </ul>\\n  </div>\\n{/if}\\n\\n<script lang=\\"ts\\">import { fly, fade } from \\"svelte/transition\\";\\nimport Moon from \\"$lib/icons/Moon.svelte\\";\\nimport Logo from \\"$lib/icons/Logo.svelte\\";\\nimport { theme } from \\"$lib/utils/theme\\";\\nexport let segment;\\nlet isVisible = false;\\nlet checked = false;\\nconst toggleDarkMode = () => {\\n    theme.update(current => (current === \\"light\\" ? \\"dark\\" : \\"light\\"));\\n};\\nconst toggleNav = () => {\\n    checked = !checked;\\n    isVisible = !isVisible;\\n    // turn off scrolling when mobile nav is visible\\n    if (checked)\\n        document.body.style.overflow = \\"hidden\\";\\n    else\\n        document.body.style.overflow = \\"auto\\";\\n};\\n</script>\\n"],"names":[],"mappings":"AACA,OAAO,6CAAC,CAAC,AACP,MAAM,CAAE,IAAI,CACZ,aAAa,CAAE,SAAS,CAAC,IAAI,eAAe,CAAC,CAAC,KAAK,CACnD,OAAO,CAAE,EAAE,CACX,gBAAgB,CAAE,IAAI,cAAc,CAAC,CACrC,QAAQ,CAAE,KAAK,CACf,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,GAAG,CAAE,CAAC,AACR,CAAC,AAED,sBAAO,CAAC,sBAAO,CAAC,CAAC,eAAC,CAAC,AACjB,KAAK,CAAE,IAAI,aAAa,CAAC,AAC3B,CAAC,AAED,kBAAkB,6CAAC,CAAC,AAClB,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,SAAS,CAAE,MAAM,CACjB,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,OAAO,CAAE,CAAC,CAAC,IAAI,AACjB,CAAC,AAED,cAAc,6CAAC,CAAC,AACd,IAAI,CAAE,CAAC,AACT,CAAC,AAED,6BAAc,CAAC,CAAC,8BAAC,CAAC,AAChB,WAAW,CAAE,GAAG,CAChB,eAAe,CAAE,IAAI,CACrB,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,UAAU,CAAE,KAAK,CAAC,QAAQ,CAAC,IAAI,AACjC,CAAC,AAED,6BAAc,CAAC,+BAAC,MAAM,AAAC,CAAC,AACtB,KAAK,CAAE,IAAI,mBAAmB,CAAC,AACjC,CAAC,AAED,cAAc,6CAAC,CAAC,AACd,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,IAAI,CACb,GAAG,CAAE,IAAI,CACT,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,MAAM,AACvB,CAAC,AAED,aAAa,6CAAC,CAAC,AACb,WAAW,CAAE,OAAO,AACtB,CAAC,AAED,4BAAa,CAAC,CAAC,8BAAC,CAAC,AACf,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,SAAS,CAAE,QAAQ,CACnB,WAAW,CAAE,KAAK,CAClB,QAAQ,CAAE,QAAQ,CAClB,KAAK,CAAE,IAAI,gBAAgB,CAAC,CAC5B,eAAe,CAAE,IAAI,CACrB,UAAU,CAAE,KAAK,CAAC,QAAQ,CAAC,IAAI,AACjC,CAAC,AAED,4BAAa,CAAC,+BAAC,MAAM,AAAC,CAAC,AACrB,KAAK,CAAE,IAAI,aAAa,CAAC,AAC3B,CAAC,AAED,4BAAa,CAAC,+BAAC,MAAM,OAAO,AAAC,CAAC,AAC5B,SAAS,CAAE,MAAM,CAAC,CAAC,AACrB,CAAC,AAED,4BAAa,CAAC,+BAAC,OAAO,AAAC,CAAC,AACtB,OAAO,CAAE,EAAE,CACX,QAAQ,CAAE,QAAQ,CAClB,MAAM,CAAE,QAAQ,CAChB,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,QAAQ,CAChB,gBAAgB,CAAE,IAAI,mBAAmB,CAAC,CAC1C,SAAS,CAAE,MAAM,CAAC,CAAC,CACnB,UAAU,CAAE,SAAS,CAAC,QAAQ,CAAC,IAAI,AACrC,CAAC,AAED,kBAAkB,6CAAC,CAAC,AAClB,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,OAAO,AACjB,CAAC,AAED,iBAAiB,6CAAC,CAAC,AACjB,OAAO,CAAE,CAAC,AACZ,CAAC,AAED,eAAe,6CAAC,CAAC,AACf,MAAM,CAAE,IAAI,CACZ,UAAU,CAAE,IAAI,CAChB,OAAO,CAAE,IAAI,CACb,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,MAAM,CAAE,OAAO,AACjB,CAAC,AAED,OAAO,IAAI,CAAC,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACzC,cAAc,6CAAC,CAAC,AACd,OAAO,CAAE,IAAI,AACf,CAAC,AAED,kBAAkB,6CAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,OAAO,CAAC,CAAC,CAAC,GAAG,CAAC,CAClC,GAAG,CAAE,OAAO,CACZ,KAAK,CAAE,MAAM,CACb,MAAM,CAAE,OAAO,AACjB,CAAC,AAED,iBAAiB,6CAAC,CAAC,AACjB,QAAQ,CAAE,QAAQ,CAClB,SAAS,CAAE,MAAM,CACjB,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,EAAE,AACb,CAAC,AAED,gCAAiB,QAAQ,CAAG,0BAA0B,8BAAC,CAAC,AACtD,SAAS,CAAE,OAAO,KAAK,CAAC,CAAC,YAAY,CAAC,CAAC,CAAC,MAAM,CAAC,CAAC,CAAC,CAAC,AACpD,CAAC,AAED,gCAAiB,QAAQ,CAAG,0BAA0B,8BAAC,CAAC,AACtD,SAAS,CAAE,MAAM,CAAC,CAAC,AACrB,CAAC,AAED,gCAAiB,QAAQ,CAAG,0BAA0B,8BAAC,CAAC,AACtD,SAAS,CAAE,OAAO,MAAM,CAAC,CAAC,YAAY,CAAC,CAAC,CAAC,OAAO,CAAC,CAAC,CAAC,CAAC,AACtD,CAAC,AAED,CAAC,KAAK,EAAE,wBAAwB,CAAC,6CAAC,CAAC,AACjC,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,KAAK,CACd,gBAAgB,CAAE,IAAI,iBAAiB,CAAC,CACxC,UAAU,CAAE,SAAS,CAAC,QAAQ,CAAC,IAAI,AACrC,CAAC,AAED,eAAe,6CAAC,CAAC,AACf,QAAQ,CAAE,KAAK,CACf,OAAO,CAAE,EAAE,CACX,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,CAAC,CACP,KAAK,CAAE,CAAC,CACR,MAAM,CAAE,CAAC,CACT,gBAAgB,CAAE,IAAI,cAAc,CAAC,CACrC,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,AACzB,CAAC,AAED,qBAAqB,6CAAC,CAAC,AACrB,OAAO,CAAE,IAAI,CACb,kBAAkB,CAAE,OAAO,CAAC,CAAC,CAAC,GAAG,CAAC,CAClC,WAAW,CAAE,MAAM,CACnB,aAAa,CAAE,MAAM,CACrB,GAAG,CAAE,IAAI,CACT,UAAU,CAAE,IAAI,AAClB,CAAC,AAED,mCAAoB,CAAC,CAAC,8BAAC,CAAC,AACtB,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,eAAe,CAAE,IAAI,CACrB,SAAS,CAAE,MAAM,CACjB,KAAK,CAAE,IAAI,iBAAiB,CAAC,AAC/B,CAAC,AACH,CAAC"}'
};
const Navbar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {segment} = $$props;
  if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0)
    $$bindings.segment(segment);
  $$result.css.add(css$3);
  return `<nav class="${"navbar svelte-140cklc"}"><div class="${"navbar__container svelte-140cklc"}"><div class="${"navbar__title svelte-140cklc"}"><a href="${"/"}" aria-label="${"logo"}" class="${"svelte-140cklc"}">${validate_component(Logo, "Logo").$$render($$result, {className: "logo__icon"}, {}, {})}</a></div>
    <ul class="${"navbar__items svelte-140cklc"}"><li class="${"navbar__item svelte-140cklc"}"><a href="${"/"}" class="${"svelte-140cklc"}">Home</a></li>
      <li class="${["navbar__item svelte-140cklc", segment === "post" ? "active" : ""].join(" ").trim()}"><a href="${"/post"}" class="${"svelte-140cklc"}">Posts</a></li>
      <li class="${["navbar__item svelte-140cklc", segment === "project" ? "active" : ""].join(" ").trim()}"><a href="${"/project"}" class="${"svelte-140cklc"}">Projects</a></li>
      <li class="${["navbar__item svelte-140cklc", segment === "about" ? "active" : ""].join(" ").trim()}"><a href="${"/about"}" class="${"svelte-140cklc"}">About</a></li>
      <li class="${"navbar__item svelte-140cklc"}"><button class="${"navbar__button svelte-140cklc"}" aria-label="${"toggle darkmode"}">${validate_component(Moon, "Moon").$$render($$result, {
    className: "navbar__darkmode",
    width: "1.5rem",
    height: "1.5rem"
  }, {}, {})}</button></li></ul>
    <div class="${"navbar__hamburger svelte-140cklc"}"><input class="${"navbar__checkbox svelte-140cklc"}" type="${"checkbox"}" ${""} aria-label="${"toggle menu"}">
      <span class="${"navbar__hamburger_item--1 svelte-140cklc"}"></span>
      <span class="${"navbar__hamburger_item--2 svelte-140cklc"}"></span>
      <span class="${"navbar__hamburger_item--3 svelte-140cklc"}"></span></div></div></nav>
${``}`;
});
const Email = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {width} = $$props;
  let {height} = $$props;
  if ($$props.width === void 0 && $$bindings.width && width !== void 0)
    $$bindings.width(width);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0)
    $$bindings.height(height);
  return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", width, 0)}${add_attribute("height", height, 0)} viewBox="${"0 0 24 24"}" fill="${"none"}" stroke="${"currentColor"}" stroke-width="${"2"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-mail"}"><path d="${"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"}"></path><polyline points="${"22,6 12,13 2,6"}"></polyline></svg>`;
});
const Github = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {width} = $$props;
  let {height} = $$props;
  if ($$props.width === void 0 && $$bindings.width && width !== void 0)
    $$bindings.width(width);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0)
    $$bindings.height(height);
  return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", width, 0)}${add_attribute("height", height, 0)} viewBox="${"0 0 24 24"}" fill="${"none"}" stroke="${"currentColor"}" stroke-width="${"2"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-github"}"><path d="${"M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"}"></path></svg>`;
});
const Twitter = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {width} = $$props;
  let {height} = $$props;
  if ($$props.width === void 0 && $$bindings.width && width !== void 0)
    $$bindings.width(width);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0)
    $$bindings.height(height);
  return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", width, 0)}${add_attribute("height", height, 0)} viewBox="${"0 0 24 24"}" fill="${"none"}" stroke="${"currentColor"}" stroke-width="${"2"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-twitter"}"><path d="${"M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"}"></path></svg>`;
});
const Rss = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {width} = $$props;
  let {height} = $$props;
  if ($$props.width === void 0 && $$bindings.width && width !== void 0)
    $$bindings.width(width);
  if ($$props.height === void 0 && $$bindings.height && height !== void 0)
    $$bindings.height(height);
  return `<svg xmlns="${"http://www.w3.org/2000/svg"}"${add_attribute("width", width, 0)}${add_attribute("height", height, 0)} viewBox="${"0 0 24 24"}" fill="${"none"}" stroke="${"currentColor"}" stroke-width="${"2"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-rss"}"><path d="${"M4 11a9 9 0 0 1 9 9"}"></path><path d="${"M4 4a16 16 0 0 1 16 16"}"></path><circle cx="${"5"}" cy="${"19"}" r="${"1"}"></circle></svg>`;
});
var Footer_svelte = 'footer.svelte-191vxzd.svelte-191vxzd{margin-top:3rem;border-top:0.0625rem var(--color-borders) solid;font-family:"Overpass", sans-serif;text-align:center;padding:2rem 1rem;background-color:var(--color-alt-bg)}p.svelte-191vxzd.svelte-191vxzd{line-height:1.5em;color:var(--color-main-text)}a.svelte-191vxzd.svelte-191vxzd{text-decoration:none}.hl.svelte-191vxzd.svelte-191vxzd{color:var(--color-main-accent);font-weight:600}.icons.svelte-191vxzd.svelte-191vxzd{margin:0 auto 0.5rem;display:grid;grid-template-columns:repeat(4, 1fr);max-width:220px}.icons.svelte-191vxzd a.svelte-191vxzd{color:var(--color-main-text);transition:color ease-out 0.2s}.icons.svelte-191vxzd a.svelte-191vxzd:hover{color:var(--color-main-accent)}';
const css$2 = {
  code: 'footer.svelte-191vxzd.svelte-191vxzd{margin-top:3rem;border-top:0.0625rem var(--color-borders) solid;font-family:"Overpass", sans-serif;text-align:center;padding:2rem 1rem;background-color:var(--color-alt-bg)}p.svelte-191vxzd.svelte-191vxzd{line-height:1.5em;color:var(--color-main-text)}a.svelte-191vxzd.svelte-191vxzd{text-decoration:none}.hl.svelte-191vxzd.svelte-191vxzd{color:var(--color-main-accent);font-weight:600}.icons.svelte-191vxzd.svelte-191vxzd{margin:0 auto 0.5rem;display:grid;grid-template-columns:repeat(4, 1fr);max-width:220px}.icons.svelte-191vxzd a.svelte-191vxzd{color:var(--color-main-text);transition:color ease-out 0.2s}.icons.svelte-191vxzd a.svelte-191vxzd:hover{color:var(--color-main-accent)}',
  map: '{"version":3,"file":"Footer.svelte","sources":["Footer.svelte"],"sourcesContent":["<style>\\nfooter {\\n  margin-top: 3rem;\\n  border-top: 0.0625rem var(--color-borders) solid;\\n  font-family: \\"Overpass\\", sans-serif;\\n  text-align: center;\\n  padding: 2rem 1rem;\\n  background-color: var(--color-alt-bg);\\n}\\n\\np {\\n  line-height: 1.5em;\\n  color: var(--color-main-text);\\n}\\n\\na {\\n  text-decoration: none;\\n}\\n\\n.hl {\\n  color: var(--color-main-accent);\\n  font-weight: 600;\\n}\\n\\n.icons {\\n  margin: 0 auto 0.5rem;\\n  display: grid;\\n  grid-template-columns: repeat(4, 1fr);\\n  max-width: 220px;\\n}\\n\\n.icons a {\\n  color: var(--color-main-text);\\n  transition: color ease-out 0.2s;\\n}\\n.icons a:hover {\\n  color: var(--color-main-accent);\\n}\\n</style>\\n\\n<footer>\\n  <div class=\\"icons\\">\\n    <!-- prettier-ignore -->\\n    <a href=\\"mailto:{email}\\" target=\\"_blank\\" rel=\\"norel noreferrer\\" aria-label=\\"email\\">\\n      <Email height=\\"1.5rem\\" width=\\"1.5rem\\" />\\n    </a>\\n    <!-- prettier-ignore -->\\n    <a href=\\"{github}\\" target=\\"_blank\\" rel=\\"norel noreferrer\\" aria-label=\\"github\\">\\n      <Github height=\\"1.5rem\\" width=\\"1.5rem\\" />\\n    </a>\\n    <!-- prettier-ignore -->\\n    <a href={twitter} target=\\"_blank\\" rel=\\"norel noreferrer\\" aria-label=\\"twitter\\" >\\n      <Twitter height=\\"1.5rem\\" width=\\"1.5rem\\" />\\n    </a>\\n    <!-- prettier-ignore -->\\n    <a href=\\"/rss.xml\\" rel=\\"alternate\\" type=\\"application/rss+xml\\" aria-label=\\"rss\\">\\n      <RSS height=\\"1.5rem\\" width=\\"1.5rem\\" />\\n    </a>\\n  </div>\\n  <p>\\n    Powered by\\n    <a class=\\"hl\\" href=\\"https://sapper.svelte.dev\\">Sapper</a>\\n    and\\n    <a class=\\"hl\\" href=\\"https://vercel.app\\">Vercel</a>\\n    \u2022 Source code is available on\\n    <a class=\\"hl\\" href=\\"{github}/elianiva.me\\">Github</a>\\n  </p>\\n  <p>Copyright &copy; 2020 <a class=\\"hl\\" href={github}>Elianiva</a></p>\\n</footer>\\n\\n<script>\\nimport data from \\"$lib/data/site\\"\\nimport Email from \\"$lib/icons/Email.svelte\\"\\nimport Github from \\"$lib/icons/Github.svelte\\"\\nimport Twitter from \\"$lib/icons/Twitter.svelte\\"\\nimport RSS from \\"$lib/icons/Rss.svelte\\"\\n\\nconst { github, twitter, email } = data\\n</script>\\n"],"names":[],"mappings":"AACA,MAAM,8BAAC,CAAC,AACN,UAAU,CAAE,IAAI,CAChB,UAAU,CAAE,SAAS,CAAC,IAAI,eAAe,CAAC,CAAC,KAAK,CAChD,WAAW,CAAE,UAAU,CAAC,CAAC,UAAU,CACnC,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,IAAI,CAAC,IAAI,CAClB,gBAAgB,CAAE,IAAI,cAAc,CAAC,AACvC,CAAC,AAED,CAAC,8BAAC,CAAC,AACD,WAAW,CAAE,KAAK,CAClB,KAAK,CAAE,IAAI,iBAAiB,CAAC,AAC/B,CAAC,AAED,CAAC,8BAAC,CAAC,AACD,eAAe,CAAE,IAAI,AACvB,CAAC,AAED,GAAG,8BAAC,CAAC,AACH,KAAK,CAAE,IAAI,mBAAmB,CAAC,CAC/B,WAAW,CAAE,GAAG,AAClB,CAAC,AAED,MAAM,8BAAC,CAAC,AACN,MAAM,CAAE,CAAC,CAAC,IAAI,CAAC,MAAM,CACrB,OAAO,CAAE,IAAI,CACb,qBAAqB,CAAE,OAAO,CAAC,CAAC,CAAC,GAAG,CAAC,CACrC,SAAS,CAAE,KAAK,AAClB,CAAC,AAED,qBAAM,CAAC,CAAC,eAAC,CAAC,AACR,KAAK,CAAE,IAAI,iBAAiB,CAAC,CAC7B,UAAU,CAAE,KAAK,CAAC,QAAQ,CAAC,IAAI,AACjC,CAAC,AACD,qBAAM,CAAC,gBAAC,MAAM,AAAC,CAAC,AACd,KAAK,CAAE,IAAI,mBAAmB,CAAC,AACjC,CAAC"}'
};
const Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const {github, twitter, email} = data;
  $$result.css.add(css$2);
  return `<footer class="${"svelte-191vxzd"}"><div class="${"icons svelte-191vxzd"}">
    <a href="${"mailto:" + escape(email)}" target="${"_blank"}" rel="${"norel noreferrer"}" aria-label="${"email"}" class="${"svelte-191vxzd"}">${validate_component(Email, "Email").$$render($$result, {height: "1.5rem", width: "1.5rem"}, {}, {})}</a>
    
    <a${add_attribute("href", github, 0)} target="${"_blank"}" rel="${"norel noreferrer"}" aria-label="${"github"}" class="${"svelte-191vxzd"}">${validate_component(Github, "Github").$$render($$result, {height: "1.5rem", width: "1.5rem"}, {}, {})}</a>
    
    <a${add_attribute("href", twitter, 0)} target="${"_blank"}" rel="${"norel noreferrer"}" aria-label="${"twitter"}" class="${"svelte-191vxzd"}">${validate_component(Twitter, "Twitter").$$render($$result, {height: "1.5rem", width: "1.5rem"}, {}, {})}</a>
    
    <a href="${"/rss.xml"}" rel="${"alternate"}" type="${"application/rss+xml"}" aria-label="${"rss"}" class="${"svelte-191vxzd"}">${validate_component(Rss, "RSS").$$render($$result, {height: "1.5rem", width: "1.5rem"}, {}, {})}</a></div>
  <p class="${"svelte-191vxzd"}">Powered by
    <a class="${"hl svelte-191vxzd"}" href="${"https://sapper.svelte.dev"}">Sapper</a>
    and
    <a class="${"hl svelte-191vxzd"}" href="${"https://vercel.app"}">Vercel</a>
    \u2022 Source code is available on
    <a class="${"hl svelte-191vxzd"}" href="${escape(github) + "/elianiva.me"}">Github</a></p>
  <p class="${"svelte-191vxzd"}">Copyright \xA9 2020 <a class="${"hl svelte-191vxzd"}"${add_attribute("href", github, 0)}>Elianiva</a></p>
</footer>`;
});
var Loading_svelte = ".loading.svelte-1jaa4v2{position:fixed;top:4rem;left:0;height:0.25rem;background-color:var(--color-main-accent);z-index:50;transition:width ease-out 0.5s;width:0}";
const css$1 = {
  code: ".loading.svelte-1jaa4v2{position:fixed;top:4rem;left:0;height:0.25rem;background-color:var(--color-main-accent);z-index:50;transition:width ease-out 0.5s;width:0}",
  map: '{"version":3,"file":"Loading.svelte","sources":["Loading.svelte"],"sourcesContent":["<style>\\n.loading {\\n  position: fixed;\\n  top: 4rem;\\n  left: 0;\\n  height: 0.25rem;\\n  background-color: var(--color-main-accent);\\n  z-index: 50;\\n  transition: width ease-out 0.5s;\\n  width: 0;\\n}\\n</style>\\n\\n{#if $navigating}\\n  <div class=\\"loading\\" style=\\"width: {width}%\\" />\\n{/if}\\n\\n<script>\\nimport { onMount, onDestroy } from \\"svelte\\"\\nimport { navigating } from \\"$app/stores\\"\\n\\nlet counter\\nlet width = 0\\nlet speed = 10\\n\\nconst resetProgress = () => {\\n  clearInterval(counter)\\n  width = 0\\n  speed = 0\\n}\\n\\nconst startProgress = () => {\\n  counter = setInterval(() => {\\n    if (width === 95) {\\n      clearInterval(counter)\\n      return\\n    }\\n    width += 5\\n    speed += 500\\n  }, speed)\\n}\\n\\n$: if (!$navigating) resetProgress()\\n$: if ($navigating) startProgress()\\n\\nonMount(() => startProgress())\\nonDestroy(() => resetProgress())\\n</script>\\n"],"names":[],"mappings":"AACA,QAAQ,eAAC,CAAC,AACR,QAAQ,CAAE,KAAK,CACf,GAAG,CAAE,IAAI,CACT,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,OAAO,CACf,gBAAgB,CAAE,IAAI,mBAAmB,CAAC,CAC1C,OAAO,CAAE,EAAE,CACX,UAAU,CAAE,KAAK,CAAC,QAAQ,CAAC,IAAI,CAC/B,KAAK,CAAE,CAAC,AACV,CAAC"}'
};
const Loading = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $navigating, $$unsubscribe_navigating;
  $$unsubscribe_navigating = subscribe(navigating, (value) => $navigating = value);
  let counter;
  let width = 0;
  let speed = 10;
  const resetProgress = () => {
    clearInterval(counter);
    width = 0;
    speed = 0;
  };
  const startProgress = () => {
    counter = setInterval(() => {
      if (width === 95) {
        clearInterval(counter);
        return;
      }
      width += 5;
      speed += 500;
    }, speed);
  };
  onMount(() => startProgress());
  onDestroy(() => resetProgress());
  $$result.css.add(css$1);
  {
    if (!$navigating)
      resetProgress();
  }
  {
    if ($navigating)
      startProgress();
  }
  $$unsubscribe_navigating();
  return `${$navigating ? `<div class="${"loading svelte-1jaa4v2"}" style="${"width: " + escape(width) + "%"}"></div>` : ``}`;
});
var $layout_svelte = "main.svelte-r7qf84{display:flex;flex-direction:column;min-height:100vh}div.svelte-r7qf84{flex:1;margin-top:4.5rem}";
const css = {
  code: "main.svelte-r7qf84{display:flex;flex-direction:column;min-height:100vh}div.svelte-r7qf84{flex:1;margin-top:4.5rem}",
  map: '{"version":3,"file":"$layout.svelte","sources":["$layout.svelte"],"sourcesContent":["<style>\\nmain {\\n  display: flex;\\n  flex-direction: column;\\n  min-height: 100vh;\\n}\\n\\ndiv {\\n  flex: 1;\\n  margin-top: 4.5rem;\\n}\\n</style>\\n\\n<svelte:head>\\n  <script>\\n  // set dark mode correctly before everythings get rendered\\n  // thanks https://github.com/pveyes\\n  try {\\n    // prettier-ignore\\n    const { matches: isDarkMode } = window.matchMedia( \\"(prefers-color-scheme: dark)\\")\\n    let preference\\n\\n    if (localStorage.getItem(\\"theme\\"))\\n      preference = localStorage.getItem(\\"theme\\")\\n    else preference = isDarkMode ? \\"dark\\" : \\"light\\"\\n\\n    // prettier-ignore\\n    if (preference) document.documentElement.setAttribute(\\"data-theme\\", preference)\\n  } catch (err) {\\n    console.log(err)\\n  }\\n  </script>\\n</svelte:head>\\n\\n<Navbar {segment} />\\n<main>\\n  <Loading />\\n  <div>\\n    <slot />\\n  </div>\\n  <Footer />\\n</main>\\n\\n<script lang=\\"ts\\">import { onMount } from \\"svelte\\";\\nimport Navbar from \\"$lib/components/Navbar.svelte\\";\\nimport Footer from \\"$lib/components/Footer.svelte\\";\\nimport Loading from \\"$lib/components/Loading.svelte\\";\\nimport { theme } from \\"$lib/utils/theme\\";\\nexport let segment;\\nonMount(() => {\\n    const { matches: isDarkTheme } = window.matchMedia(\\"(prefers-color-scheme: dark)\\");\\n    let preference;\\n    // prettier-ignore\\n    if (localStorage.getItem(\\"theme\\"))\\n        preference = localStorage.getItem(\\"theme\\");\\n    else\\n        preference = isDarkTheme ? \\"dark\\" : \\"light\\";\\n    theme.set(preference);\\n    theme.subscribe(current => {\\n        localStorage.setItem(\\"theme\\", current);\\n        document.documentElement.setAttribute(\\"data-theme\\", current);\\n    });\\n});\\n</script>\\n"],"names":[],"mappings":"AACA,IAAI,cAAC,CAAC,AACJ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,UAAU,CAAE,KAAK,AACnB,CAAC,AAED,GAAG,cAAC,CAAC,AACH,IAAI,CAAE,CAAC,CACP,UAAU,CAAE,MAAM,AACpB,CAAC"}'
};
const $layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {segment} = $$props;
  onMount(() => {
    const {matches: isDarkTheme} = window.matchMedia("(prefers-color-scheme: dark)");
    let preference;
    if (localStorage.getItem("theme"))
      preference = localStorage.getItem("theme");
    else
      preference = isDarkTheme ? "dark" : "light";
    theme.set(preference);
    theme.subscribe((current) => {
      localStorage.setItem("theme", current);
      document.documentElement.setAttribute("data-theme", current);
    });
  });
  if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0)
    $$bindings.segment(segment);
  $$result.css.add(css);
  return `${$$result.head += `<script data-svelte="svelte-1q2vxzd">// set dark mode correctly before everythings get rendered
  // thanks https://github.com/pveyes
  try {
    // prettier-ignore
    const { matches: isDarkMode } = window.matchMedia( "(prefers-color-scheme: dark)")
    let preference

    if (localStorage.getItem("theme"))
      preference = localStorage.getItem("theme")
    else preference = isDarkMode ? "dark" : "light"

    // prettier-ignore
    if (preference) document.documentElement.setAttribute("data-theme", preference)
  } catch (err) {
    console.log(err)
  }
  </script>`, ""}

${validate_component(Navbar, "Navbar").$$render($$result, {segment}, {}, {})}
<main class="${"svelte-r7qf84"}">${validate_component(Loading, "Loading").$$render($$result, {}, {}, {})}
  <div class="${"svelte-r7qf84"}">${slots.default ? slots.default({}) : ``}</div>
  ${validate_component(Footer, "Footer").$$render($$result, {}, {}, {})}
</main>`;
});
var $layout$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: $layout
});
const HAS_EXTENSION = /\.[^/.]+$/;
const getPagePath = (kind) => path.resolve(`./src/pages/${kind}`);
const getResources = (kind) => {
  if (!kind)
    throw new Error("KIND IS REQUIRED!");
  return fs.readdirSync(getPagePath(kind)).filter((file) => !HAS_EXTENSION.test(file) && `${file}/index.svx`).map((fileName) => {
    const postContent = fs.readFileSync(`${getPagePath(kind)}/${fileName}/index.svx`, {encoding: "utf8"});
    const {
      attributes
    } = frontmatter(postContent);
    return {...attributes, slug: fileName.replace(HAS_EXTENSION, "")};
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
const get$1 = async ({query: q}) => {
  let result = getResources("project");
  const limit = parseInt(q.get("limit"));
  const title = q.get("title");
  if (limit)
    result = result.slice(0, limit);
  if (title)
    result = result.filter((item) => item.title === title);
  if (result) {
    return {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: result
    };
  }
  return {
    status: 404,
    body: "Not Found"
  };
};
var project_json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get: get$1
});
const get = async ({query: q}) => {
  let result = getResources("post");
  const limit = parseInt(q.get("limit"));
  const title = q.get("title");
  if (limit)
    result = result.slice(0, limit);
  if (title)
    result = result.filter((item) => item.title === title);
  if (result) {
    return {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: result
    };
  }
  return {
    status: 404,
    body: "Not Found"
  };
};
var post_json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get
});
export {init, render};
