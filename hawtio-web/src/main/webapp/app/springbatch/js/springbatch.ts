module SpringBatch {
    var springBatchServerPath ='localhost\\:8080/spring-batch-admin-sample/jobs.json';
    var proxyUrl = '/hawtio/proxy/';
    export function JobListController($scope, $location, workspace:Workspace, jolokia, $resource) {

        var jobList = $resource(proxyUrl+springBatchServerPath);
        jobList.get(function(data){
            if(data.jobs && data.jobs.registrations) $scope.jobList = data.jobs.registrations;
        });
    }
}