
// Add any other known possible jolokia URLs here
var jolokiaUrls = [
  "/" + window.location.pathname.split('/')[1] + "/jolokia",
  "/hawtio/jolokia",  // instance configured by hawtio-web war file
  "/jolokia"          // instance that's already installed in a karaf container for example
  ];

var jolokiaUrl = getJolokiaUrl();
console.log("jolokiaUrl " + jolokiaUrl);

function getJolokiaUrl() {
  var query = hawtioPluginLoader.parseQueryString();
  var uri = query['url'];
  if (angular.isArray(uri)) {
    uri = uri[0];
  }
  return uri ? decodeURIComponent(uri) : null;
}

if (!jolokiaUrl) {
  jolokiaUrl = jolokiaUrls.find(function (url) {
    var jqxhr = $.ajax(url, {
      async: false,
      username: 'public',
      password: '?'
    });
    return jqxhr.status === 200 || jqxhr.status === 401 || jqxhr.status === 403;
  });
}

// bootstrap plugin loader
if (jolokiaUrl) {
  // TODO replace with a jolokia call so we use authentication headers
  //hawtioPluginLoader.addUrl("jolokia:" + jolokiaUrl + ":hawtio:type=plugin,name=*");
}

interface IMyAppScope extends ng.IRootScopeService, ng.IScope {
  lineCount: (value:any) => number;
  params: ng.IRouteParamsService;
  is: (type:any, value:any) => bool;
  empty: (value:any) => bool;
  log: (variable:string) => void;
  alert: (text:string) => void;
}

hawtioPluginLoader.addModule('hawtioCore');

angular.module('hawtioCore', ['bootstrap', 'ngResource', 'ui', 'ui.bootstrap.dialog']).
        config(($routeProvider, $dialogProvider) => {

          $dialogProvider.options({
            backdropFade: true,
            dialogFade: true
          });

          $routeProvider.
                  when('/login', {templateUrl: 'app/core/html/login.html'}).
                  when('/preferences', {templateUrl: 'app/core/html/preferences.html'}).
                  when('/help', {
                    redirectTo: '/help/index'
                  }).
                  when('/help/:topic/', {templateUrl: 'app/core/html/help.html'}).
                  when('/help/:topic/:subtopic', {templateUrl: 'app/core/html/help.html'}).

                  otherwise({redirectTo: '/help/index'});
        }).
        constant('layoutTree', 'app/core/html/layoutTree.html').
        constant('layoutFull', 'app/core/html/layoutFull.html').
        constant('editablePropertyTemplate',
                '<div ng-mouseenter="showEdit()" ng-mouseleave="hideEdit()" class="ep" ng-hide="editing">' +
                        '{{text}}&nbsp;<i class="ep-edit icon-pencil" title="Edit this item" ng-click="doEdit()"></i>' +
                        '</div>' +
                        '<div class="ep" ng-show="editing">' +
                        '<form class="form-inline no-bottom-margin" ng-submit="saveEdit()">' +
                        '<fieldset>' +
                        '<input type="text" value="{{text}}">' +
                        '<i class="green icon-ok" title="Save changes" ng-click="saveEdit()"></i>' +
                        '<i class="red icon-remove" title="Discard changes" ng-click="stopEdit()"></i>' +
                        '</fieldset>' +
                        '</form>' +
                        '</div>').

        service('localStorage',function () {
          // TODO Create correct implementation of windowLocalStorage
          var storage:WindowLocalStorage = window.localStorage || <any> (function () {
            return {};
          })();
          return storage;
        }).

        factory('marked',function () {
          marked.setOptions({
            gfm: true,
            tables: true,
            breaks: false,
            pedantic: true,
            sanitize: false,
            smartLists: true,
            langPrefix: 'language-'
          });
          return marked;
        }).

        factory('pageTitle', function () {
          var answer = new Core.PageTitle();
          answer.addTitleElement(() => { return 'hawtio'; });
          return answer;
        }).

        factory('viewRegistry',function () {
          return {};
        }).

        factory('lastLocation', function () {
          return {};
        }).

        factory('helpRegistry', function($rootScope) {
          return new Core.HelpRegistry($rootScope);
        }).

        factory('jolokiaUrl', function() {
          return jolokiaUrl;
        }).

        factory('userDetails', function(jolokiaUrl, localStorage) {
          var answer = angular.fromJson(localStorage[jolokiaUrl]);
          if (!angular.isDefined(answer)) {
            return {
              username: '',
              password: ''
            };
          } else {
            return answer;
          }

        }).

        factory('jolokia',($location:ng.ILocationService, localStorage, $rootScope, userDetails) => {
          // TODO - Maybe have separate URLs or even jolokia instances for loading plugins vs. application stuff
          // var jolokiaUrl = $location.search()['url'] || url("/jolokia");
          console.log("Jolokia URL is " + jolokiaUrl);
          if (jolokiaUrl) {
            var jolokiaParams = {url: jolokiaUrl, canonicalNaming: false, ignoreErrors: true, mimeType: 'application/json'};

            var credentials = hawtioPluginLoader.getCredentials(jolokiaUrl);
            // pass basic auth credentials down to jolokia if set
            var username = null;
            var password = null;

            //var userDetails = angular.fromJson(localStorage[jolokiaUrl]);

            if (credentials.length === 2) {
              username = credentials[0];
              password = credentials[1];

            } else if (angular.isDefined(userDetails) &&
                       angular.isDefined(userDetails.userName) &&
                       angular.isDefined(userDetails.password)) {

              username = userDetails.userName;
              password = userDetails.password;

            } else {
              // lets see if they are passed in via request parameter...
              var search = hawtioPluginLoader.parseQueryString();
              username = search["_user"];
              password = search["_pwd"];
              if (angular.isArray(username)) username = username[0];
              if (angular.isArray(password)) password = password[0];
            }

            if (username && password) {
              jolokiaParams['username'] = username;
              jolokiaParams['password'] = password;

              console.log("Using user / pwd " + username + " / " + password);

              userDetails.username = username;
              userDetails.password = password;
            }

            jolokiaParams['ajaxError'] = (xhr, textStatus, error) => {
              if (xhr.status === 401 || xhr.status === 403) {
                userDetails.username = null;
                userDetails.password = null;
                Core.$apply($rootScope);
              }
            }

            var jolokia = new Jolokia(jolokiaParams);
            localStorage['url'] = jolokiaUrl;
            jolokia.stop();
            return jolokia;
          } else {
            // empty jolokia that returns nothing
            return {
              request: () => null,
              register: () => null,
              list: () => null,
              search: () => null,
              read: () => null,
              execute: () => null,

              start: () => {
                this.running = true;
                return null;
              },
              stop: () => {
                this.running = false;
                return null;
              },
              isRunning: () => this.running,
              jobs: () => []
            };
          }
        }).

        factory('toastr', ($window) => {
          return $window.toastr;
        }).
        factory('xml2json', ($window) => {
          var jquery:any = $;
          return jquery.xml2json;
        }).
        factory('workspace',($location:ng.ILocationService, jmxTreeLazyLoadRegistry, $compile:ng.ICompileService, $templateCache:ng.ITemplateCacheService, localStorage:WindowLocalStorage, jolokia, $rootScope) => {
          var answer = new Workspace(jolokia, jmxTreeLazyLoadRegistry, $location, $compile, $templateCache, localStorage, $rootScope);
          answer.loadTree();
          return answer;
        }).

        filter("valueToHtml", () => Core.valueToHtml).
        filter('humanize',() => humanizeValue).

        run(($rootScope, $routeParams, jolokia, workspace, localStorage, viewRegistry, layoutFull, helpRegistry) => {

          $.support.cors = true;

          /**
           * Count the number of lines in the given text
           */
          $rootScope.lineCount = lineCount;

          /**
           * Easy access to route params
           */
          $rootScope.params = $routeParams;

          /**
           * Wrapper for angular.isArray, isObject, etc checks for use in the view
           *
           * @param type {string} the name of the check (casing sensitive)
           * @param value {string} value to check
           */
          $rootScope.is = function (type:any, value:any):bool {
            return angular['is' + type](value);
          };

          /**
           * Wrapper for $.isEmptyObject()
           *
           * @param value  {mixed} Value to be tested
           * @return boolean
           */
          $rootScope.empty = function (value:any):bool {
            return $.isEmptyObject(value);
          };

          /**
           * Initialize jolokia polling and add handler to change poll
           * frequency
           */
          // only reset the update rate if its not defined
          var updateRate = localStorage['updateRate'];
          if (angular.isUndefined(updateRate)) {
            localStorage['updateRate'] = 5000;
          }

          $rootScope.$on('UpdateRate', (event, rate) => {
            jolokia.stop();
            if (rate > 0) {
              jolokia.start(rate);
            }
            console.log("Set update rate to: " + rate);
          });

          $rootScope.$emit('UpdateRate', localStorage['updateRate']);

          /**
           * Debugging Tools
           *
           * Allows you to execute debug functions from the view
           */
            // TODO Doesn't support vargs like it should
          $rootScope.log = function (variable:any):void {
            console.log(variable);
          };
          $rootScope.alert = function (text:string) {
            alert(text);
          };

          viewRegistry['fullscreen'] = layoutFull;
          viewRegistry['notree'] = layoutFull;
          viewRegistry['help'] = layoutFull;
          viewRegistry['preferences'] = layoutFull;
          viewRegistry['login'] = layoutFull;

          helpRegistry.addUserDoc('index', 'app/core/doc/overview.md');
          helpRegistry.addSubTopic('index', 'faq', 'app/core/doc/FAQ.md');
          helpRegistry.addSubTopic('index', 'changes', 'app/core/doc/CHANGES.md');
          helpRegistry.addSubTopic('index', 'developer', 'app/core/doc/developer.md');
          helpRegistry.discoverHelpFiles(hawtioPluginLoader.getModules());

        }).
        directive('expandable',function () {
          return {
            restrict: 'C',
            replace: false,
            link: function (scope, element, attrs) {
              var expandable = $(element);

              var title = expandable.find('.title');
              var button = expandable.find('.cancel');

              button.bind('click', function () {
                expandable.find('.expandable-body').slideUp(400, function() {
                  expandable.addClass('closed');
                  expandable.removeClass('opened');
                });
                return false;
              });

              title.bind('click', function () {
                if (expandable.hasClass('opened')) {
                  expandable.find('.expandable-body').slideUp(400, function() {
                    expandable.toggleClass('opened');
                    expandable.toggleClass('closed');
                  });
                } else {
                  expandable.find('.expandable-body').slideDown(400, function() {
                    expandable.toggleClass('opened');
                    expandable.toggleClass('closed');
                  });
                }
                return false;
              });
            }
          }
        }).
        directive('editableProperty', ['$compile', 'editablePropertyTemplate', function ($compile, editablePropertyTemplate) {
          var editableProperty = {
            restrict: 'E',
            scope: true,
            template: editablePropertyTemplate,
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {

              scope.editing = false;
              $(element.find(".icon-pencil")[0]).hide();

              ngModel.$render = function () {
                var propertyName = attrs['property'];
                if (propertyName && ngModel.$viewValue) {
                  scope.text = ngModel.$viewValue[ propertyName];
                }
              };

              scope.showEdit = function () {
                $(element.find(".icon-pencil")[0]).show();
              };

              scope.hideEdit = function () {
                $(element.find(".icon-pencil")[0]).hide();
              };

              scope.doEdit = function () {
                scope.editing = true;
              };

              scope.stopEdit = function () {
                scope.editing = false;
              };

              scope.saveEdit = function () {
                var value = $(element.find(":input[type=text]")[0]).val();
                var obj = ngModel.$viewValue;
                obj[attrs['property']] = value;
                ngModel.$setViewValue(obj);
                ngModel.$render();
                scope.editing = false;
                scope.$parent.$eval(attrs['onSave']);
              }

            }
          };
          return editableProperty;
        }]).
        directive('gridStyle', function($window) {
          return new Core.GridStyle($window);
        });

// enable bootstrap tooltips
$(function () {
  $("a[title]").tooltip({
    selector: '',
    delay: { show: 1000, hide: 100 }
  });
});

var adjustHeight = function () {
  var windowHeight = $(window).height()
  var headerHeight = $("#main-nav").height()
  var containerHeight = windowHeight - headerHeight;
  $("#main").css("min-height", "" + containerHeight + "px");
}

$(function () {
  hawtioPluginLoader.loadPlugins(function () {
    var doc = $(document);
    angular.bootstrap(doc, hawtioPluginLoader.getModules());
    $(document.documentElement).attr('xmlns:ng', "http://angularjs.org");
    $(document.documentElement).attr('ng-app', 'hawtioCore');
    adjustHeight();
    $(window).resize(adjustHeight);

    // var tmp:any = window;
    // tmp.less.watch();

  });
});


