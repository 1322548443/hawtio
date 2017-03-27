/**
 * @module Diagnostics
 */
/// <reference path="diagnosticsPlugin.ts"/>
/// <reference path="../../forms/js/formInterfaces.ts"/>
module Diagnostics {

  interface ScopeSettings {
    lastConnection: string;
  }

  interface JfrControllerScope extends ng.IScope {
    forms: any;
    jfrEnabled: boolean;
    isRecording: boolean;
    recordingNumber: number;
    compress: boolean;
    dumpOnExit: boolean;
    name: string;
    limitType: string;
    limitValue: string;
    formConfig: Forms.FormConfiguration;
    startRecording: () => void;
    stopRecording: () => void;
    dumpRecording: () => void;
  }

  export var ConnectController = _module.controller("Diagnostics.JfrController", ["$scope", "$location", "localStorage", "workspace", ($scope:JfrControllerScope, $location:ng.ILocationService, localStorage:WindowLocalStorage, workspace:Core.Workspace) => {


    $scope.forms = {};
    
    $scope.name='';
    $scope.recordingNumber = -1;
    $scope.limitType = 'unlimited';
    $scope.limitValue = '';
    $scope.compress = false;
    $scope.dumpOnExit = true;


    $scope.formConfig = <Forms.FormConfiguration> {
      properties: <Forms.FormProperties> {
        name: <Forms.FormElement> {
          type: "java.lang.String",
          tooltip: "Name for this connection",
          "input-attributes": {
            "placeholder": "Recording name (optional)..."
          }
        },
        limitType: <Forms.FormElement> {
          type: "java.lang.String",
          tooltip: "Duration if any",
          enum: ["unlimited", "duration", "size"]
        },
        limitValue: <Forms.FormElement> {
          type: "java.lang.String",
          tooltip: "Limit value. duration: [val]s/m/h , size. [val]MB/GB",
          required: false,
          "input-attributes": {
              "ng-show": "limitType != 'unlimited'"
            }
        },
        compress: <Forms.FormElement> {
          type: "java.lang.Boolean",
          tooltip: "Compress recording"
        },
        dumpOnExit: <Forms.FormElement> {
          type: "java.lang.Boolean",
          tooltip: "Automatically dump recording on VM exit"
        },
        filename: <Forms.FormElement> {
            type: "java.lang.String",
            tooltip: "Filename"
          },
      }
    };

 

  }]);
}
