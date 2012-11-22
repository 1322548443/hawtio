var logQueryMBean = 'org.fusesource.insight:type=LogQuery';

// the paths into the mbean tree which we should ignore doing a folder view
// due to the huge size involved!
var ignoreDetailsOnBigFolders = [
  [
    ['java.lang'],
    ['MemoryPool', 'GarbageCollector']
  ]
];

var numberTypeNames = {
  'byte': true,
  'short': true,
  'integer': true,
  'long': true,
  'float': true,
  'double': true,
  'java.lang.Byte': true,
  'java.lang.Short': true,
  'java.lang.Integer': true,
  'java.lang.Long': true,
  'java.lang.Float': true,
  'java.lang.Double': true
};

function humanizeValue(value) {
  if (value) {
    var text = value.toString();
    return trimQuotes(text.underscore().humanize());
  }
  return value;
}

function trimQuotes(text:string) {
  if ((text.startsWith('"') || text.startsWith("'")) && (text.endsWith('"') || text.endsWith("'"))) {
    return text.substring(1, text.length - 1);
  }
  return text;
}

function ignoreFolderDetails(node) {
  return folderMatchesPatterns(node, ignoreDetailsOnBigFolders);
}

function folderMatchesPatterns(node, patterns) {
  if (node) {
    var folderNames = node.folderNames;
    if (folderNames) {
      return patterns.any((ignorePaths) => {
        for (var i = 0; i < ignorePaths.length; i++) {
          var folderName = folderNames[i];
          var ignorePath = ignorePaths[i];
          if (!folderName) return false;
          var idx = ignorePath.indexOf(folderName);
          if (idx < 0) {
            return false;
          }
        }
        return true;
      });
    }
  }
  return false;
}

function scopeStoreJolokiaHandle($scope, jolokia, jolokiaHandle) {
  // TODO do we even need to store the jolokiaHandle in the scope?
  if (jolokiaHandle) {
    $scope.$on('$destroy', function () {
      closeHandle($scope, jolokia)
    });
    $scope.jolokiaHandle = jolokiaHandle;
  }
}

function closeHandle($scope, jolokia) {
  var jolokiaHandle = $scope.jolokiaHandle
  if (jolokiaHandle) {
    //console.log('Closing the handle ' + jolokiaHandle);
    jolokia.unregister(jolokiaHandle);
    $scope.jolokiaHandle = null;
  }
}

function onSuccess(fn, options = {}) {
  options['ignoreErrors'] = true;
  options['mimeType'] = 'application/json';
  options['success'] = fn;
  if (!options['error']) {
    options['error'] = function (response) {
      //alert("Jolokia request failed: " + response.error);
      console.log("Jolokia request failed: " + response.error);
    };
  }
  return options;
}

function supportsLocalStorage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}


function isNumberTypeName(typeName):bool {
  if (typeName) {
    var text = typeName.toString().toLowerCase();
    var flag = numberTypeNames[text];
    return flag;
  }
  return false;
}

function encodeMBeanPath(mbean) {
  return mbean.replace(/\//g, '!/').replace(':', '/').escapeURL();
}

function encodeMBean(mbean) {
  return mbean.replace(/\//g, '!/').escapeURL();
}
