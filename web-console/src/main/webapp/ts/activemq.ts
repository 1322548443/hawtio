function QueueController($scope, $location, workspace) {
  $scope.workspace = workspace;
  $scope.messages = [];
  $scope.openMessages = [];

  var populateTable = function (response) {
    var data = response.value;
    $scope.messages = data;
    $scope.$apply();

    $scope.dataTable = $('#grid').dataTable({
      bPaginate: false,
      sDom: 'Rlfrtip',
      bDestroy: true,
      aaData: data,
      aoColumns: [
        {
          "mDataProp": null,
          "sClass": "control center",
          "sDefaultContent": '<i class="icon-plus"></i>'
        },
        { "mDataProp": "JMSMessageID" },
        /*
         {
         "sDefaultContent": "",
         "mData": null,
         "mDataProp": "Text"
         },
         */
        { "mDataProp": "JMSCorrelationID" },
        { "mDataProp": "JMSTimestamp" },
        { "mDataProp": "JMSDeliveryMode" },
        { "mDataProp": "JMSReplyTo" },
        { "mDataProp": "JMSRedelivered" },
        { "mDataProp": "JMSPriority" },
        { "mDataProp": "JMSXGroupSeq" },
        { "mDataProp": "JMSExpiration" },
        { "mDataProp": "JMSType" },
        { "mDataProp": "JMSDestination" }
      ]
    });


    $('#grid td.control').click(function () {
      var openMessages = $scope.openMessages;
      var dataTable = $scope.dataTable;
      var parentRow = this.parentNode;
      var i = $.inArray(parentRow, openMessages);

      var element = $('i', this);
      if (i === -1) {
        element.removeClass('icon-plus');
        element.addClass('icon-minus');
        var dataDiv = $scope.formatMessageDetails(dataTable, parentRow);
        var detailsRow = dataTable.fnOpen(parentRow, dataDiv, 'details');
        $('div.innerDetails', detailsRow).slideDown();
        openMessages.push(parentRow);
        var textAreas = $(detailsRow).find("textarea.messageDetail");
        var textArea = textAreas[0];
        if (textArea) {
          var editorSettings = createEditorSettings(workspace, $scope.format, {
            readOnly: true
          });
          var editor = CodeMirror.fromTextArea(textArea, editorSettings);
          // TODO make this editable preference!
          var autoFormat = true;
          if (autoFormat) {
            autoFormatEditor(editor);
          }
        }
      } else {
        element.removeClass('icon-minus');
        element.addClass('icon-plus');
        dataTable.fnClose(parentRow);
        openMessages.splice(i, 1);
      }
    });
  };

  $scope.formatMessageDetails = (dataTable, parentRow) => {
    var oData = dataTable.fnGetData(parentRow);
    var body = oData["Text"] || "";

    // lets guess the payload format
    $scope.format = "javascript";
    var trimmed = body.trimLeft().trimRight();
    if (trimmed && trimmed.first() === '<' && trimmed.last() === '>') {
      $scope.format = "xml";
    }

    var rows = 1;
    body.each(/\n/, () => rows++);
    var answer = '<div class="innerDetails span12" title="Message payload">' +
            '<textarea readonly class="messageDetail" class="input-xlarge" rows="' + rows + '">' +
            body +
            '</textarea>' +
            '</div>';
    return answer;
  };


  $scope.$watch('workspace.selection', function () {
    if (workspace.moveIfViewInvalid($location)) return;

    // TODO could we refactor the get mbean thingy??
    var selection = workspace.selection;
    if (selection) {
      var mbean = selection.objectName;
      if (mbean) {
        var jolokia = workspace.jolokia;

        jolokia.request(
                {type: 'exec', mbean: mbean, operation: 'browse()'},
                onSuccess(populateTable));
      }
    }
  });
}

function DestinationController($scope, $location, workspace) {
  $scope.workspace = workspace;

  $scope.$watch('workspace.selection', function () {
    workspace.moveIfViewInvalid($location);
  });

  function operationSuccess() {
    $scope.destinationName = "";
    $scope.workspace.operationCounter += 1;
    $scope.$apply();
  }

  function deleteSuccess() {
    // lets set the selection to the parent
    if (workspace.selection) {
      var parent = workspace.selection.parent;
      if (parent) {
        $scope.workspace.selection = parent;
        updateSelectionNode($location, parent);
      }
    }
    $scope.workspace.operationCounter += 1;
    $scope.$apply();
  }

  $scope.createDestination = (name, isQueue) => {
    var jolokia = workspace.jolokia;
    var selection = workspace.selection;
    var folderNames = selection.folderNames;
    if (selection && jolokia && folderNames && folderNames.length > 1) {
      var mbean = "" + folderNames[0] + ":BrokerName=" + folderNames[1] + ",Type=Broker";
      console.log("Creating queue " + isQueue + " of name: " + name + " on mbean");
      var operation;
      if (isQueue) {
        operation = "addQueue(java.lang.String)"
      } else {
        operation = "addTopic(java.lang.String)";
      }
      jolokia.execute(mbean, operation, name, onSuccess(operationSuccess));
    }
  };

  $scope.deleteDestination = () => {
    var jolokia = workspace.jolokia;
    var selection = workspace.selection;
    var entries = selection.entries;
    if (selection && jolokia && entries) {
      var domain = selection.domain;
      var brokerName = entries["BrokerName"];
      var name = entries["Destination"];
      var isQueue = "Topic" !== entries["Type"];
      if (domain && brokerName) {
        var mbean = "" + domain + ":BrokerName=" + brokerName + ",Type=Broker";
        console.log("Deleting queue " + isQueue + " of name: " + name + " on mbean");
        var operation;
        if (isQueue) {
          operation = "removeQueue(java.lang.String)"
        } else {
          operation = "removeTopic(java.lang.String)";
        }
        jolokia.execute(mbean, operation, name, onSuccess(deleteSuccess));
      }
    }
  };

  $scope.name = () => {
    var selection = workspace.selection;
    if (selection) {
      return selection.title;
    }
    return null;
  }
}


function SubscriberGraphController($scope, $location, workspace) {
  $scope.workspace = workspace;
  $scope.nodes = [];
  $scope.links = [];
  $scope.queues = {};
  $scope.topics = {};
  $scope.subscriptions = {};
  $scope.producers = {};

  function matchesSelection(destinationName) {
    var selectionDetinationName = $scope.selectionDetinationName;
    return !selectionDetinationName || destinationName === selectionDetinationName;
  }

  function getOrCreate(container, key, defaultObject) {
    var value = container[key];
    var id;
    if (!value) {
      container[key] = defaultObject;
      id = $scope.nodes.length;
      defaultObject["id"] = id;
      $scope.nodes.push(defaultObject);
    } else {
      id = value["id"];
    }
    return id;
  }

  var populateSubscribers = function (response) {
    var data = response.value;
    for (var key in data) {
      var subscription = data[key];
      var destinationNameText = subscription["DestinationName"];
      if (destinationNameText) {
        var subscriptionId = null;
        var destinationNames = destinationNameText.split(",");
        destinationNames.forEach((destinationName) => {
          var id = null;
          var isQueue = !subscription["DestinationTopic"];
          if (isQueue === $scope.isQueue && matchesSelection(destinationName)) {
            if (isQueue) {
              id = getOrCreate($scope.queues, destinationName, {
                label: destinationName, imageUrl: "/img/activemq/queue.png" });
            } else {
              id = getOrCreate($scope.topics, destinationName, {
                label: destinationName, imageUrl: "/img/activemq/topic.png" });
            }

            // lets lazily register the subscription
            if (!subscriptionId) {
              var subscriptionKey = subscription["ConnectionId"] + ":" + subscription["SubcriptionId"];
              subscription["label"] = subscriptionKey;
              subscription["imageUrl"] = "/img/activemq/listener.gif";
              subscriptionId = getOrCreate($scope.subscriptions, subscriptionKey, subscription);
            }

            $scope.links.push({ source: id, target: subscriptionId });
            // TODO add connections...?
          }
        });
      }
    }
  };

  var populateProducers = function (response) {
    var data = response.value;
    for (var key in data) {
      var producer = data[key];
      var destinationNameText = producer["DestinationName"];
      if (destinationNameText) {
        var producerId = null;
        var destinationNames = destinationNameText.split(",");
        destinationNames.forEach((destinationName) => {
          var id = null;
          var isQueue = producer["DestinationQueue"];
          if (isQueue === $scope.isQueue && matchesSelection(destinationName)) {
            if (isQueue) {
              id = getOrCreate($scope.queues, destinationName, {
                label: destinationName, imageUrl: "/img/activemq/queue.png" });
            } else {
              id = getOrCreate($scope.topics, destinationName, {
                label: destinationName, imageUrl: "/img/activemq/topic.png" });
            }

            // lets lazily register the producer
            if (!producerId) {
              var producerKey = producer["ProducerId"];
              producer["label"] = producerKey;
              producer["imageUrl"] = "/img/activemq/sender.gif";
              producerId = getOrCreate($scope.producers, producerKey, producer);
            }

            $scope.links.push({ source: producerId, target: id });
            // TODO add connections...?
          }
        });
      }
    }
    d3ForceGraph($scope, $scope.nodes, $scope.links);
    $scope.$apply();
  };

  $scope.$watch('workspace.selection', function () {
    if (workspace.moveIfViewInvalid($location)) return;

    var isQueue = true;
    var jolokia = $scope.workspace.jolokia;
    if (jolokia) {
      var selection = $scope.workspace.selection;
      $scope.selectionDetinationName = null;
      if (selection) {
        if (selection.entries) {
          $scope.selectionDetinationName = selection.entries["Destination"];
          isQueue = selection.entries["Type"] !== "Topic";
        } else if (selection.folderNames) {
          isQueue = selection.folderNames.last() !== "Topic";
        }
      }
      $scope.isQueue = isQueue;
      // TODO detect if we're looking at topics
      var typeName;
      if (isQueue) {
        typeName = "Queue";
      } else {
        typeName = "Topic";
      }
      jolokia.request([
        {type: 'read',
          mbean: "org.apache.activemq:Type=Subscription,destinationType=" + typeName + ",*" },
        {type: 'read',
          mbean: "org.apache.activemq:Type=Producer,*"}
      ], onSuccess([populateSubscribers, populateProducers]));
    }
  });
}