var Radar = (function () {
    'use strict';
  
    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }
  
    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
  
    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      return Constructor;
    }
  
    // cookie keys
    var DESCRIPTION = 'radar-description';
    var DEVICE_ID = 'radar-deviceId';
    var HOST = 'radar-host';
    var PLACES_PROVIDER = 'radar-placesProvider';
    var PUBLISHABLE_KEY = 'radar-publishableKey';
    var USER_ID = 'radar-userId'; // parse cookie string to return value at {key}
  
    function getCookie(key) {
      if (!document || document.cookie === undefined) {
        return null;
      }
  
      var prefix = "".concat(key, "=");
      var cookies = document.cookie.split(';');
      var value = cookies.find(function (cookie) {
        return cookie.indexOf(prefix) != -1;
      });
      return value ? value.trim().substring(prefix.length) : null;
    } // set cookie using {key, value}
  
    function setCookie(key, value) {
      if (!document || !document.cookie === undefined || typeof value !== 'string') {
        return;
      }
  
      var date = new Date();
      date.setFullYear(date.getFullYear() + 10);
      var expires = "expires=".concat(date.toGMTString());
      document.cookie = "".concat(key, "=").concat(value, ";path=/;").concat(expires);
    } // delete cookie with {key}
  
    function deleteCookie(key) {
      if (!document || !document.cookie) {
        return;
      }
  
      document.cookie = "".concat(key, "=;expires=Thu, 01-Jan-1970 00:00:01 GMT;path=/");
    }
  
    function getId() {
      // use existing deviceId if present
      var deviceId = getCookie(DEVICE_ID);
  
      if (deviceId) {
        return deviceId;
      } // generate new deviceId
  
  
      var uuid = generateUUID();
      setCookie(DEVICE_ID, uuid);
      return uuid;
    }
  
    function generateUUID() {
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
        var r = Math.random() * 16 | 0;
        var v = char == 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
      });
      return uuid;
    }
  
    var STATUS = {
      ERROR_LOCATION: 'ERROR_LOCATION',
      ERROR_NETWORK: 'ERROR_NETWORK',
      ERROR_PERMISSIONS: 'ERROR_PERMISSIONS',
      ERROR_PUBLISHABLE_KEY: 'ERROR_PUBLISHABLE_KEY',
      ERROR_RATE_LIMIT: 'ERROR_RATE_LIMIT',
      ERROR_SERVER: 'ERROR_SERVER',
      ERROR_UNAUTHORIZED: 'ERROR_UNAUTHORIZED',
      SUCCESS: 'SUCCESS'
    };
  
    function request(method, url, body, headers, successCallback, errorCallback) {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
  
      for (var header in headers) {
        xhr.setRequestHeader(header, headers[header]);
      }
  
      xhr.onload = function () {
        if (xhr.status == 200) {
          successCallback(xhr.response);
        } else if (xhr.status == 401) {
          errorCallback(STATUS.ERROR_UNAUTHORIZED);
        } else if (xhr.status == 429) {
          errorCallback(STATUS.ERROR_RATE_LIMIT);
        } else {
          errorCallback(STATUS.ERROR_SERVER);
        }
      };
  
      xhr.onerror = function () {
        errorCallback(STATUS.ERROR_SERVER);
      };
  
      xhr.timeout = function () {
        errorCallback(STATUS.ERROR_NETWORK);
      };
  
      xhr.send(JSON.stringify(body));
    }
  
    var PLACES_PROVIDER$1 = {
      FACEBOOK: 'facebook',
      NONE: 'none'
    };
  
    var SDK_VERSION = '1.1.0';
  
    var DEFAULT_HOST = 'https://api.radar.io';
  
    var Radar =
    /*#__PURE__*/
    function () {
      function Radar() {
        _classCallCheck(this, Radar);
      }
  
      _createClass(Radar, null, [{
        key: "initialize",
        value: function initialize(publishableKey) {
          if (!publishableKey) {
            console.error('Radar "initialize" was called without a publishable key');
          }
  
          setCookie(PUBLISHABLE_KEY, publishableKey);
        }
      }, {
        key: "setHost",
        value: function setHost(host) {
          setCookie(HOST, host, true);
        }
      }, {
        key: "setPlacesProvider",
        value: function setPlacesProvider(placesProvider) {
          if (placesProvider !== PLACES_PROVIDER$1.FACEBOOK) {
            placesProvider = PLACES_PROVIDER$1.NONE;
          }
  
          setCookie(PLACES_PROVIDER, placesProvider);
        }
      }, {
        key: "setUserId",
        value: function setUserId(userId) {
          if (!userId) {
            deleteCookie(USER_ID);
            return;
          }
  
          userId = String(userId).trim();
  
          if (userId.length === 0 || userId.length > 256) {
            deleteCookie(USER_ID);
            return;
          }
  
          setCookie(USER_ID, userId);
        }
      }, {
        key: "setDescription",
        value: function setDescription(description) {
          if (!description) {
            deleteCookie(DESCRIPTION);
            return;
          }
  
          description = String(description).trim();
  
          if (description.length === 0 || description.length > 256) {
            deleteCookie(DESCRIPTION);
            return;
          }
  
          setCookie(DESCRIPTION, description);
        }
      }, {
        key: "trackOnce",
        value: function trackOnce(callback) {
          var publishableKey = getCookie(PUBLISHABLE_KEY);
  
          if (!publishableKey) {
            if (callback) {
              callback(STATUS.ERROR_PUBLISHABLE_KEY);
            }
  
            return;
          }
  
          if (!navigator || !navigator.geolocation) {
            if (callback) {
              callback(STATUS.ERROR_LOCATION);
            }
  
            return;
          }
  
          navigator.geolocation.getCurrentPosition(
          /* on getCurrentPosition success */
          function (position) {
            if (!position || !position.coords) {
              if (callback) {
                callback(STATUS.ERROR_LOCATION);
              }
  
              return;
            } // Get location data
  
  
            var _position$coords = position.coords,
                accuracy = _position$coords.accuracy,
                latitude = _position$coords.latitude,
                longitude = _position$coords.longitude; // Get user data
  
            var deviceId = getId();
            var userId = getCookie(USER_ID);
            var placesProvider = getCookie(PLACES_PROVIDER);
            var description = getCookie(DESCRIPTION);
  
            var _id = userId || deviceId; // Setup http
  
  
            var headers = {
              Authorization: publishableKey
            };
            var body = {
              accuracy: accuracy,
              description: description,
              deviceId: deviceId,
              deviceType: 'Web',
              foreground: true,
              latitude: latitude,
              longitude: longitude,
              placesProvider: placesProvider,
              sdkVersion: SDK_VERSION,
              stopped: true,
              userAgent: navigator.userAgent,
              userId: userId
            };
            var host = getCookie(HOST) || DEFAULT_HOST;
            var url = "".concat(host, "/v1/users/").concat(_id);
            var method = 'PUT';
  
            var onSuccess = function onSuccess(response) {
              try {
                response = JSON.parse(response);
  
                if (callback) {
                  callback(STATUS.SUCCESS, position.coords, response.user, response.events);
                }
              } catch (e) {
                if (callback) {
                  callback(STATUS.ERROR_SERVER);
                }
              }
            };
  
            var onError = function onError(error) {
              if (callback) {
                callback(error);
              }
            };
  
            // console.log(url);
            // console.log(headers);
            // console.log(method);
            // console.log(body);
            request(method, url, body, headers, onSuccess, onError);
          },
          /* on getCurrentPosition error */
          function (err) {
            if (callback) {
              if (err && err.code) {
                if (err.code === 1) {
                  callback(STATUS.ERROR_PERMISSIONS);
                } else {
                  callback(STATUS.ERROR_LOCATION);
                }
              }
            }
          });
        }
      }, {
        key: "VERSION",
        get: function get() {
          return SDK_VERSION;
        }
      }, {
        key: "PLACES_PROVIDER",
        get: function get() {
          return PLACES_PROVIDER$1;
        }
      }, {
        key: "STATUS",
        get: function get() {
          return STATUS;
        }
      }]);
  
      return Radar;
    }();
  
    return Radar;
  
  }());