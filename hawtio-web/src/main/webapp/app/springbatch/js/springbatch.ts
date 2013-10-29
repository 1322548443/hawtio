module SpringBatch {
    var springBatchServerPath ='localhost:8181/jobs.json';
    var proxyUrl = '/hawtio/proxy/';
    export function JobListController($scope, $location, workspace:Workspace, jolokia, $http, $resource) {

        $http.get((proxyUrl+springBatchServerPath),{
            cache:false
        }).success(function(data){
                if(data.jobs && data.jobs.registrations) $scope.jobList = data.jobs.registrations;
            });

    }
}