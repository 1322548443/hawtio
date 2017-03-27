/**
 * @module Diagnostics
 */
/// <reference path="./diagnosticsPlugin.ts"/>
module Diagnostics {

    _module.controller( "Diagnostics.FlagsController", ["$scope", "$window", "$location", "localStorage", "workspace", "jolokia", ( $scope, $window, $location, localStorage: WindowLocalStorage, workspace, jolokia ) => {

        Diagnostics.configureScope( $scope, $location, workspace );
        $scope.flags = [];
        $scope.tableDef = tableDef();


        Core.register( jolokia, $scope, {
            type: 'read',
            mbean: 'com.sun.management:type=HotSpotDiagnostic',
            arguments: []

        }, onSuccess( render ) );




        function render( response ) {
            //remove watches on previous content
            for ( var i = 0; i < $scope.flags.length; i++ ) {
                $scope.flags[i].deregisterWatch();
            }

            $scope.flags = response.value.DiagnosticOptions;;
            for ( var i = 0; i < $scope.flags.length; i++ ) {
                var flag=$scope.flags[i];
                flag.value  = parseValue(flag.value); //convert to typed value
                if(flag.writeable) { //hint for the kind of control to use
                    flag.dataType = typeof(flag.value);
                } else {
                    flag.dataType = "readonly";
                }
                
                flag.deregisterWatch = $scope.$watch( 'flags[' + i + ']', ( newValue,  oldValue) => {
                    if ( newValue.value != oldValue.value ) {
                        jolokia.request( [{
                            type: 'exec',
                            mbean: 'com.sun.management:type=HotSpotDiagnostic',
                            operation: 'setVMOption(java.lang.String,java.lang.String)',
                            arguments: [newValue.name, newValue.value]
                        }], onSuccess(( response ) => {
                            log.info( response.value );
                        }) );
                    }

                }, true );
            }

            Core.$apply( $scope );
        }

        function parseValue( value ) {
            if ( typeof ( value ) === "string" ) {
                if ( value.match( /true/ ) ) {
                    return true;
                } else if ( value.match( /false/ ) ) {
                    return false;
                } else if ( value.match( /\d+/ ) ) {
                    return Number( value )
                }
            }
            return value;
        }


        function tableDef() {
            return {
                selectedItems: [],
                data: 'flags',
                showFilter: true,
                filterOptions: {
                    filterText: ''
                },
                showSelectionCheckbox: false,
                enableRowClickSelection: true,
                multiSelect: false,
                primaryKeyFn: function( entity, idx ) {
                    return entity.name;
                },
                columnDefs: [
                    {
                        field: 'name',
                        displayName: 'VM Flag',
                        resizable: true
                    }, {
                        field: 'origin',
                        displayName: 'Origin',
                        resizable: true
                    }, {
                        field: 'value',
                        displayName: 'Value',
                        resizable: true,
                        cellTemplate: '<div ng-switch on="row.entity.dataType"><span ng-switch-when="readonly">{{row.entity.value}}</span><input ng-switch-when="boolean" type="checkbox" ng-model="row.entity.value"></input><input ng-switch-when="string" type="text" ng-model="row.entity.value"></input><input ng-switch-when="number" type="number" ng-model="row.entity.value"></input></div>'
                    }]
            };

        }
    }] );

}
