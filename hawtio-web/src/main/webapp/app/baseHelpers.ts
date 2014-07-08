/**
 * @module Core
 */
/// <reference path="../../d.ts/angular.d.ts"/>
/// <reference path="../../d.ts/angular-resource.d.ts"/>
/// <reference path="../../d.ts/bootstrap-2.1.d.ts"/>
/// <reference path="../../d.ts/camel.d.ts"/>
/// <reference path="../../d.ts/chrome.d.ts"/>
/// <reference path="../../d.ts/codemirror-additional.d.ts"/>
/// <reference path="../../d.ts/codemirror.d.ts"/>
/// <reference path="../../d.ts/dagre.d.ts"/>
/// <reference path="../../d.ts/dmr.d.ts"/>
/// <reference path="../../d.ts/google.d.ts"/>
/// <reference path="../../d.ts/hawtio-plugin-loader.d.ts"/>
/// <reference path="../../d.ts/jolokia-1.0.d.ts"/>
/// <reference path="../../d.ts/jquery-datatable.d.ts"/>
/// <reference path="../../d.ts/jquery-datatable-extra.d.ts"/>
/// <reference path="../../d.ts/jquery.d.ts"/>
/// <reference path="../../d.ts/jquery.dynatree-1.2.d.ts"/>
/// <reference path="../../d.ts/jquery.gridster.d.ts"/>
/// <reference path="../../d.ts/jquery.jsPlumb.d.ts"/>
/// <reference path="../../d.ts/logger.d.ts"/>
/// <reference path="../../d.ts/marked.d.ts"/>
/// <reference path="../../d.ts/schemas.d.ts"/>
/// <reference path="../../d.ts/sugar-1.3.d.ts"/>
module Core {

  // use a better implementation of unescapeHTML
  String.prototype.unescapeHTML = function() {
      var txt = document.createElement("textarea");
      txt.innerHTML = this;
      return txt.value;
  };

  // add object.keys if we don't have it, used
  // in a few places
  if (!Object.keys) {
    Object.keys = function(obj) {
      var keys = [],
          k;
      for (k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          keys.push(k);
        }
      }
      return keys;
    };
  }


  // Add any other known possible jolokia URLs here
  var jolokiaUrls:string[] = [
    url("jolokia"),    // instance configured by hawtio-web war file
    "/jolokia"         // instance that's already installed in a karaf container for example
  ];
  
  export function getJolokiaUrl():any {
    var query = hawtioPluginLoader.parseQueryString();
    var localMode = query['localMode'];
    if (localMode) {
      console.log("local mode so not using jolokia URL");
      jolokiaUrls = <string[]>[];
      return null;
    }
    var uri = query['url'];
    if (angular.isArray(uri)) {
      uri = uri[0];
    }
    var answer:any = uri ? decodeURIComponent(uri) : null;
    if (!answer) {
      answer = jolokiaUrls.find(function (url) {
        var jqxhr = $.ajax(url, {
          async: false,
          username: 'public',
          password: 'biscuit'
        });
        return jqxhr.status === 200 || jqxhr.status === 401 || jqxhr.status === 403;
      });
    }
    return answer;
  }




  /**
   * Ensure our main app container takes up at least the viewport
   * height
   */
  export function adjustHeight() {
    var windowHeight = $(window).height();
    var headerHeight = $("#main-nav").height();
    var containerHeight = windowHeight - headerHeight;
    $("#main").css("min-height", "" + containerHeight + "px");
  };


  /**
   * Returns true if we are running inside a Chrome app or extension
   */
  export function isChromeApp() {
    var answer = false;
    try {
      answer = (chrome && chrome.app && chrome.extension) ? true : false;
    } catch (e) {
      answer = false;
    }
    //log.info("isChromeApp is: " + answer);
    return answer;
  }

  /**
   * Adds the specified CSS file to the document's head, handy
   * for external plugins that might bring along their own CSS
   * @param path
   */
  export function addCSS(path) {
    if ('createStyleSheet' in document) {
      // IE9
      document.createStyleSheet(path);
    } else {
      // Everyone else
      var link = $("<link>");
      $("head").append(link);

      link.attr({
        rel: 'stylesheet',
        type: 'text/css',
        href: path
      });
    }
  }

  var dummyStorage = {};

  /**
   * Wrapper to get the window local storage object
   * @returns {WindowLocalStorage}
   */
  export function getLocalStorage() {
    // TODO Create correct implementation of windowLocalStorage
    var storage:WindowLocalStorage = window.localStorage || <any> (function () {
      return dummyStorage;
    })();
    return storage;
  }

  /**
   * If the value is not an array then wrap it in one
   * @method asArray
   * @for Core
   * @static
   * @param {any} value
   * @return {Array}
   */
  export function asArray(value:any):any[] {
    return angular.isArray(value) ? value : [value];
  }

  /**
   * Ensure whatever value is passed in is converted to a boolean
   *
   * In the branding module for now as it's needed before bootstrap
   *
   * @method parseBooleanValue
   * @for Core
   * @param {any} value
   * @return {Boolean}
   */
  export function parseBooleanValue(value:any):boolean {
    if (!angular.isDefined(value) || !value) {
      return false;
    }

    if (value.constructor === Boolean) {
      return <boolean>value;
    }

    if (angular.isString(value)) {
      switch(value.toLowerCase()) {
        case "true":
        case "1":
        case "yes":
          return true;
        default:
          return false;
      }
    }

    if (angular.isNumber(value)) {
      return value !== 0;
    }

    throw new Error("Can't convert value " + value + " to boolean");
  }

  export function booleanToString(value:boolean):string {
    return "" + value;
  }

  export function parseIntValue(value, description: string = "integer") {
    if (angular.isString(value)) {
      try {
        return parseInt(value);
      } catch (e) {
        console.log("Failed to parse " + description + " with text '" + value + "'");
      }
    }
    return null;
  }

  export function numberToString(value:number):string {
    return "" + value;
  }

  export function parseFloatValue(value, description: string = "float") {
    if (angular.isString(value)) {
      try {
        return parseFloat(value);
      } catch (e) {
        console.log("Failed to parse " + description + " with text '" + value + "'");
      }
    }
    return null;
  }


  /**
   * Navigates the given set of paths in turn on the source object
   * and returns the last most value of the path or null if it could not be found.
   * @method pathGet
   * @for Core
   * @static
   * @param {Object} object the start object to start navigating from
   * @param {Array} paths an array of path names to navigate or a string of dot separated paths to navigate
   * @return {*} the last step on the path which is updated
   */
  export function pathGet(object, paths) {
    var pathArray = (angular.isArray(paths)) ? paths : (paths || "").split(".");
    var value = object;
    angular.forEach(pathArray, (name):any => {
      if (value) {
        try {
          value = value[name];
        } catch (e) {
          // ignore errors
          return null;
        }
      } else {
        return null;
      }
    });
    return value;
  }


  /**
   * Navigates the given set of paths in turn on the source object
   * and updates the last path value to the given newValue
   * @method pathSet
   * @for Core
   * @static
   * @param {Object} object the start object to start navigating from
   * @param {Array} paths an array of path names to navigate or a string of dot separated paths to navigate
   * @param {Object} newValue the value to update
   * @return {*} the last step on the path which is updated
   */
  export function pathSet(object, paths, newValue) {
    var pathArray = (angular.isArray(paths)) ? paths : (paths || "").split(".");
    var value = object;
    var lastIndex = pathArray.length - 1;
    angular.forEach(pathArray, (name, idx) => {
      var next = value[name];
      if (idx >= lastIndex || !angular.isObject(next)) {
        next = (idx < lastIndex) ? {} : newValue;
        value[name] = next;
      }
      value = next;
    });
    return value;
  }


  /**
   * Performs a $scope.$apply() if not in a digest right now otherwise it will fire a digest later
   * @method $applyNowOrLater
   * @for Core
   * @static
   * @param {*} $scope
   */
  export function $applyNowOrLater($scope) {
    if ($scope.$$phase || $scope.$root.$$phase) {
      setTimeout(() => {
        Core.$apply($scope);
      }, 50);
    } else {
      $scope.$apply();
    }
  }

  /**
   * Performs a $scope.$apply() after the given timeout period
   * @method $applyLater
   * @for Core
   * @static
   * @param {*} $scope
   * @param {Integer} timeout
   */
  export function $applyLater($scope, timeout = 50) {
    setTimeout(() => {
      Core.$apply($scope);
    }, timeout);
  }


  /**
   * Performs a $scope.$apply() if not in a digest or apply phase on the given scope
   * @method $apply
   * @for Core
   * @static
   * @param {*} $scope
   */
  export function $apply($scope) {
    var phase = $scope.$$phase || $scope.$root.$$phase;
    if (!phase) {
      $scope.$apply();
    }
  }

  export function $digest($scope) {
    var phase = $scope.$$phase || $scope.$root.$$phase;
    if (!phase) {
      $scope.$digest();
    }
  }

  /**
   * Look up a list of child element names or lazily create them.
   *
   * Useful for example to get the <tbody> <tr> element from a <table> lazily creating one
   * if not present.
   *
   * Usage: var trElement = getOrCreateElements(tableElement, ["tbody", "tr"])
   * @method getOrCreateElements
   * @for Core
   * @static
   * @param {Object} domElement
   * @param {Array} arrayOfElementNames
   * @return {Object}
   */
  export function getOrCreateElements(domElement, arrayOfElementNames:string[]) {
    var element = domElement;
    angular.forEach(arrayOfElementNames, name => {
      if (element) {
        var children = $(element).children(name);
        if (!children || !children.length) {
          $("<" + name + "></" + name + ">").appendTo(element);
          children = $(element).children(name);
        }
        element = children;
      }
    });
    return element;
  }

  var _escapeHtmlChars = {
    "#": "&#35;",
    "'": "&#39;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  };

  export function unescapeHtml(str) {
    angular.forEach(_escapeHtmlChars, (value, key) => {
      var regex = new RegExp(value, "g");
      str = str.replace(regex, key);
    });
    str = str.replace(/&gt;/g, ">");
    return str;
  }

  export function escapeHtml(str) {
    if (angular.isString(str)) {
      var newStr = "";
      for (var i = 0; i < str.length; i++) {
        var ch = str.charAt(i);
        var ch = _escapeHtmlChars[ch] || ch;
        newStr += ch;
        /*
         var nextCode = str.charCodeAt(i);
         if (nextCode > 0 && nextCode < 48) {
         newStr += "&#" + nextCode + ";";
         }
         else {
         newStr += ch;
         }
         */
      }
      return newStr;
    }
    else {
      return str;
    }
  }

  /**
   * Returns true if the string is either null or empty
   *
   * @method isBlank
   * @for Core
   * @static
   * @param {String} str
   * @return {Boolean}
   */
  export function isBlank(str:string) {
    if (str === undefined || str === null) {
      return true;
    }
    if (angular.isString(str)) {
      return str.isBlank();
    } else {
      // TODO - not undefined but also not a string...
      return false;
    }
  }

  /**
   * Displays an alert message which is typically the result of some asynchronous operation
   *
   * @method notification
   * @static
   * @param type which is usually "success" or "error" and matches css alert-* css styles
   * @param message the text to display
   *
   */

  export function notification (type:string, message:string, options:any = null) {
    var w:any = window;

    if (options === null) {
      options = {};
    }

    if (type === 'error' || type === 'warning') {
      if (!angular.isDefined(options.onclick)) {
        options.onclick = window['showLogPanel'];
      }
    }

    w.toastr[type](message, '', options);
  }

  /**
   * Clears all the pending notifications
   * @method clearNotifications
   * @static
   */
  export function clearNotifications() {
    var w:any = window;
    w.toastr.clear();
  }

  export function humanizeValue(value:any):string {
    if (value) {
      var text = value.toString();
      try {
        text = text.underscore();
      } catch (e) {
        // ignore
      }
      try {
        text = text.humanize();
      } catch (e) {
        // ignore
      }
      return trimQuotes(text);
    }
    return value;
  }

  export function trimQuotes(text:string) {
    if (text) {
      while (text.endsWith('"') || text.endsWith("'")) {
        text = text.substring(0, text.length - 1);
      }
      while (text.startsWith('"') || text.startsWith("'")) {
        text = text.substring(1, text.length);
      }
    }
    return text;
  }
}

// Lots of code refers to these functions in the global namespace
var notification = Core.notification;
var clearNotifications = Core.clearNotifications;
var humanizeValue = Core.humanizeValue;
var trimQuotes = Core.trimQuotes;
