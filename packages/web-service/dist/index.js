"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _uuid = _interopRequireDefault(require("uuid"));

var _lodash = require("lodash");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var WebService = /*#__PURE__*/function () {
  function WebService(serviceOption) {
    (0, _classCallCheck2.default)(this, WebService);
    (0, _defineProperty2.default)(this, "messager", void 0);
    (0, _defineProperty2.default)(this, "listeners", new Map());
    (0, _defineProperty2.default)(this, "services", []);
    (0, _defineProperty2.default)(this, "retryQueue", []);
    var messager = serviceOption.messager;
    this.initMessager(messager);
  }

  (0, _createClass2.default)(WebService, [{
    key: "initMessager",
    value: function initMessager(messager) {
      var _this = this;

      this.messager = messager;
      this.messager.onReceiveMessage(this.handleReceiveMessage.bind(this));

      this.messager.onready = function () {
        _this.startRetryRequest();
      };

      this.fetchServices();
    }
    /**
     * 发现可用服务
     */

  }, {
    key: "fetchServices",
    value: function () {
      var _fetchServices = (0, _asyncToGenerator2.default)( /*#__PURE__*/_regenerator.default.mark(function _callee() {
        var response;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.request({
                  type: this.messager.getCheckServiceType()
                });

              case 2:
                response = _context.sent;
                this.services = response.data.body.functions;
                return _context.abrupt("return", this.services);

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function fetchServices() {
        return _fetchServices.apply(this, arguments);
      }

      return fetchServices;
    }()
    /**
     * 检测服务是否可用
     * @param {string} type 服务类型
     *  
     */

  }, {
    key: "checkServiceAvailable",
    value: function checkServiceAvailable(type) {
      return this.services.indexOf(type) !== -1;
    }
    /**
     * 开始执行请求重发队列
     */

  }, {
    key: "startRetryRequest",
    value: function startRetryRequest() {
      var _this2 = this;

      var retryQueue = this.retryQueue.slice();
      this.retryQueue = [];
      retryQueue.forEach(function (message) {
        _this2.send(message);
      });
    }
    /**
     * 处理平台发送给webview的消息
     */

  }, {
    key: "handleReceiveMessage",
    value: function handleReceiveMessage(message) {
      var _this3 = this;

      var type = message.type,
          headers = message.headers;
      console.log('[webService]receive message', message);
      var eventListeners = this.listeners[type];

      if (!eventListeners) {
        return;
      }

      var reqId = headers.reqId;

      var ctx = _objectSpread(_objectSpread({}, message), {}, {
        end: function end(response) {
          (0, _lodash.merge)(response, {
            headers: {
              reqId: reqId
            },
            type: type
          });

          _this3.send(response);
        }
      });

      this._handleOnceListeners(eventListeners, ctx);

      this._handleNormalListeners(eventListeners, ctx);
    }
    /**
     * 处理一次性事件监听器（执行和移除）
     * @param {事件监听器数组} eventListeners 
     * @param {消息上下文} ctx
     */

  }, {
    key: "_handleOnceListeners",
    value: function _handleOnceListeners(eventListeners, ctx) {
      var headers = ctx.headers,
          data = ctx.data;
      var reqId = headers.reqId;
      var onceListeners = (0, _lodash.remove)(eventListeners, function (listener) {
        var isReqMatch = listener.reqId && listener.reqId === reqId || !listener.reqId;
        return listener.once && isReqMatch;
      });
      onceListeners.forEach(function (listener) {
        listener.callback && listener.callback(data, ctx);
      });
    }
    /**
     * 处理普通事件监听器（执行）
     * @param {事件监听器数组} eventListeners 
     * @param {消息上下文} ctx
     */

  }, {
    key: "_handleNormalListeners",
    value: function _handleNormalListeners(eventListeners, ctx) {
      var headers = ctx.headers,
          data = ctx.data;
      var reqId = headers.reqId;
      eventListeners.forEach(function (listener) {
        if (!listener.reqId) {
          listener.callback && listener.callback(data, ctx);
          return;
        }

        if (listener.reqId === reqId) {
          listener.callback && listener.callback(data, ctx);
        }
      });
    }
    /**
     * 发送消息
     * @param {object} config 请求信息
     */

  }, {
    key: "send",
    value: function send(message, body) {
      var finalMessage = {
        type: '',
        headers: {
          reqId: (0, _uuid.default)(),
          mMode: 'push'
        },
        data: {}
      };

      if (typeof message === 'string') {
        (0, _lodash.merge)(finalMessage, {
          type: message,
          data: {
            body: body
          }
        });
      } else {
        (0, _lodash.merge)(finalMessage, message);
      }

      var type = finalMessage.type;

      if (!type) {
        console.error('type is not supplied');
        return;
      }

      var isSuccess = this.messager.sendAction(finalMessage);

      if (!isSuccess) {
        this.retryQueue.push(finalMessage);
        console.log('[webservice]client is not ready, request wait for sending', finalMessage);
      } else {
        var onWebServiceExecOperation = global['onWebServiceExecOperation'];
        onWebServiceExecOperation && onWebServiceExecOperation(this, 'sendAction', finalMessage);
        console.log('[webService]send action', finalMessage);
      }

      return finalMessage;
    }
    /**
     * 发起请求
     * @param {Message} message 请求信息
     * @return {Promise}
     */

  }, {
    key: "request",
    value: function request(message, body) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        var finalMessage;

        if (typeof message === 'string') {
          finalMessage = {
            type: message,
            data: {
              body: body
            }
          };
        } else {
          finalMessage = message;
        }

        finalMessage.headers = _objectSpread(_objectSpread({}, finalMessage.headers), {}, {
          mMode: 'request'
        });

        var req = _this4.send(finalMessage);

        _this4.on(finalMessage.type, {
          callback: function callback(data) {
            resolve(data);
          },
          reqId: req.headers.reqId,
          once: true
        });
      });
    }
    /**
     * 监听事件
     * @param {string} type 监听事件类型 
     * @param {function} callback 监听器回调函数
     * @param {MessageListener} 完整监听器
     */

  }, {
    key: "on",
    value: function on(type, arg) {
      if (!this.listeners[type]) {
        this.listeners[type] = [];
      }

      var messageListener;

      if (typeof arg === 'function') {
        messageListener = {
          callback: arg,
          reqId: '',
          once: false
        };
      } else {
        messageListener = arg;
      }

      this.listeners[type].push(messageListener);
      var onWebServiceExecOperation = global['onWebServiceExecOperation'];
      onWebServiceExecOperation && onWebServiceExecOperation(this, 'addListener', {
        type: type,
        messageListener: messageListener
      });
    }
    /**
     * 移除事件监听器
     * @param {监听事件类型} type 
     * @param {监听器属性} messageListener 不传则移除对应事件全部监听器，可指定 callback 或 id 进行移除
     */

  }, {
    key: "off",
    value: function off(type, arg) {
      if (!arg) {
        delete this.listeners[type];
        return;
      }

      if (typeof arg === 'function') {
        (0, _lodash.remove)(this.listeners[type], function (listener) {
          return listener.callback === arg;
        });
      } else {
        var callback = arg.callback,
            reqId = arg.reqId;
        (0, _lodash.remove)(this.listeners[type], function (listener) {
          return listener.callback === callback || listener.reqId && listener.reqId === reqId;
        });
      }
    }
  }, {
    key: "removeAllListeners",
    value: function removeAllListeners() {
      this.listeners = new Map();
    }
  }]);
  return WebService;
}();

var _default = WebService;
exports.default = _default;