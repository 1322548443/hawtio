module Fabric {

  export class ContainerList {

    public restrict = 'A';
    public replace = true;
    public templateUrl = Fabric.templatePath + "containerList.html";

    public scope = false;

    public controller($scope, $element, $attrs, jolokia, $location, workspace) {

      $scope.containerArgs = ["id", "alive", "parentId", "profileIds", "versionId", "provisionResult", "jolokiaUrl", "root", 'jmxDomains'];
      $scope.profileFields = ["id", "hidden"];
      $scope.containersOp = 'containers(java.util.List, java.util.List)';
      $scope.ensembleContainerIdListOp = 'EnsembleContainers';

      $scope.containers = [];
      $scope.activeProfiles = [];
      $scope.selectedContainers = [];
      $scope.selectedContainerIds = [];
      $scope.connectToContainerDialog = new Core.Dialog();
      $scope.targetContainer = {};
      $scope.showSelect = true;
      $scope.requirements = null;

      $scope.editRequirementsDialog = new Core.Dialog();


      $scope.updateActiveContainers = () => {
        var activeProfiles = $scope.activeProfiles;
        $scope.activeProfiles = $scope.currentActiveProfiles();
        $scope.activeProfiles.each((activeProfile) => {

          var ap = activeProfiles.find((ap) => { return ap.id === activeProfile.id && ap.versionId === activeProfile.versionId });
          if (ap) {
            activeProfile['selected'] = ap.selected;
          } else {
            activeProfile['selected'] = false;
          }
        });
      };

      $scope.updateContainers = (newContainers) => {

        var response = angular.toJson(newContainers);
        if ($scope.containersResponse !== response) {
          $scope.containersResponse = response;

          var rootContainers = newContainers.exclude((c) => { return !c.root; });
          var childContainers = newContainers.exclude((c) => { return c.root; });

          if (childContainers.length > 0) {
            var tmp = [];
            rootContainers = rootContainers.sortBy('id');
            rootContainers.each((c) => {
              tmp.add(c);
              var children = childContainers.exclude((child) => { return child.parentId !== c.id });
              tmp.add(children.sortBy('id'));
            });
            newContainers = tmp;
          }

          newContainers.each((container) => {
            container.services = getServiceList(container);
            var c = $scope.containers.find((c) => { return c.id === container.id; });
            if (c) {
              container['selected'] = c.selected;
            } else {
              container['selected'] = false;
            }
            if ($scope.selectedContainerIds.any(container.id)) {
              container.selected = true;
            }
          });

          $scope.containers = newContainers;
          $scope.updateActiveContainers();
          Core.$apply($scope);
        }
      };


      $scope.currentActiveProfiles = () => {
        var answer = [];

        $scope.containers.each((container) => {
          container.profileIds.each((profile) => {

            var p = container.profiles.find((p) => { return p.id === profile; });
            if (p && p.hidden) {
              return;
            }

            var activeProfile = answer.find((o) => { return o.versionId === container.versionId && o.id === profile });

            if (activeProfile) {
              activeProfile.containers = activeProfile.containers.include(container.id).unique();
              activeProfile.count = activeProfile.containers.length;
            } else {
              answer.push({
                id: profile,
                count: 1,
                versionId: container.versionId,
                containers: [container.id],
                selected: false,
                requirements: null,
                requireStyle: null
              });
            }
          });
        });

        if ($scope.requirements) {
          angular.forEach($scope.requirements.profileRequirements, (profileRequirement) => {
            var id = profileRequirement.profile;
            var min = profileRequirement.minimumInstances;
            if (id) {
              var profile = answer.find({id: id});

              function requireStyle() {
                if (min) {
                  if (!profile || !profile.count) {
                    return "badge-important";
                  } else {
                    return min <= profile.count ? "badge-success" : "badge-warning";
                  }
                }
                return "";
              }

              if (profile) {
                profile["requirements"] = profileRequirement;
                profile["requireStyle"] = requireStyle();
              } else {
                // lets add the profile with no containers
                answer.push({
                  id: id,
                  count: 0,
                  // TODO how to define the version of the current profile?
                  // versionId: container.versionId,
                  containers: [],
                  selected: false,
                  requirements: profileRequirement,
                  requireStyle: requireStyle()
                });
              }
            }
          });
        }

        return answer;
      };


      $scope.showContainer = (container) => {
        $location.path('/fabric/container/' + container.id);
      };


      $scope.createRequiredContainers = (profile) => {
        var profileId = profile.id;
        var args = {};
        if (profileId) {
          args["profileIds"] = profileId;
        }
        var versionId = profile.versionId;
        if (versionId) {
          args["versionId"] = versionId;
        }
        var requirements = profile.requirements;
        if (requirements) {
          var min = requirements.minimumInstances;
          if (min) {
            var delta = min - (profile.count || 0);
            if (delta > 1) {
              args["number"] = delta;
            }
          }
        }
        $location.url('/fabric/containers/createContainer').search(args);
      };

      $scope.createChildContainer = (container) => {
        $location.url('/fabric/containers/createContainer').search({ 'tab': 'child', 'parentId': container.id });
      };


      $scope.createChildContainer = (container) => {
        $location.url('/fabric/containers/createContainer').search({ 'tab': 'child', 'parentId': container.id });
      };


      $scope.statusIcon = (row) => {
        return Fabric.statusIcon(row);
      };


      $scope.isEnsembleContainer = (containerId) => {
        if ($scope.ensembleContainerIds) {
          return $scope.ensembleContainerIds.any(containerId);
        }
        return false;
      }


      $scope.doConnect = (container) => {
        $scope.targetContainer = container;
        $scope.connectToContainerDialog.open();
      }

      $scope.connect = (row) => {
        if ($scope.saveCredentials) {
          $scope.saveCredentials = false;
          localStorage['fabric.userName'] = $scope.userName;
          localStorage['fabric.password'] = $scope.password;
        }
        Fabric.connect(localStorage, $scope.targetContainer, $scope.userName, $scope.password, true);
        $scope.targetContainer = {};
        $scope.connectToContainerDialog.close();
      };


      $scope.updateEnsembleContainerIdList = (ids) => {
        var response = angular.toJson(ids);
        if ($scope.ensembleContainerIdsResponse !== response) {
          $scope.ensembleContainerIdsResponse = response;
          $scope.ensembleContainerIds = ids;
          Core.$apply($scope);
        }
      }


      $scope.getSelectedClass = (obj) => {
        var answer = [];
        if (obj.selected) {
          answer.push('selected');
        }
        if (angular.isDefined(obj['root']) && obj['root'] === false) {
          answer.push('child-container');
        }
        return answer.join(' ');
      };


      $scope.dispatch = (response) => {
        switch (response.request.operation) {
          case($scope.containersOp):
            $scope.updateContainers(response.value);
            return;
        }
        switch (response.request.attribute) {
          case($scope.ensembleContainerIdListOp):
            $scope.updateEnsembleContainerIdList(response.value);
            return;
        }
      };

      $scope.clearSelection = (group) => {
        group.each((item) => { item.selected = false; });
      };


      $scope.setActiveProfile = (profile) => {
        $scope.clearSelection($scope.activeProfiles);
        if (!profile || profile === null) {
          return;
        }
        profile.selected = true;
      };


      $scope.selectAllContainers = () => {
        $scope.containers.each((container) => {
          if ($scope.filterContainer(container)) {
            container.selected = true;
          }
        });
      };


      $scope.setActiveContainer = (container) => {
        $scope.clearSelection($scope.containers);
        if (!container || container === null) {
          return;
        }
        container.selected = true;
      };


      $scope.createContainer = () => {
        var kind = null;
        // lets see if there is an openshift option
        var providers = registeredProviders(jolokia);
        angular.forEach(["openshift", "jclouds"], (value) => {
          if (!kind && providers[value]) {
            kind = value;
          }
        });
        if (!kind) {
          kind = 'child';
        }
        $location.url('/fabric/containers/createContainer').search('tab', kind);
      };


      $scope.deleteSelectedContainers = () => {
        $scope.selectedContainers.each((c) => {
          $scope.deleteContainer(c.id);
        });
      };


      $scope.startSelectedContainers = () => {
        $scope.selectedContainers.each((c) => {
          $scope.startContainer(c.id);
        });
      };


      $scope.stopSelectedContainers = () => {
        $scope.selectedContainers.each((c) => {
          $scope.stopContainer(c.id);
        });
      };


      $scope.deleteContainer = (name) => {
        doDeleteContainer($scope, jolokia, name);
      };


      $scope.startContainer = (name) => {
        doStartContainer($scope, jolokia, name);
      };


      $scope.stopContainer = (name) => {
        doStopContainer($scope, jolokia, name);
      };


      $scope.anySelectionAlive = (state) => {
        var selected = $scope.selectedContainers;
        return selected.length > 0 && selected.any((s) => s.alive === state);
      };


      $scope.everySelectionAlive = (state) => {
        var selected = $scope.selectedContainers;
        return selected.length > 0 && selected.every((s) => s.alive === state);
      };


      Core.register(jolokia, $scope, [
        {type: 'exec', mbean: Fabric.managerMBean, operation: $scope.containersOp, arguments: [$scope.containerArgs, $scope.profileFields]},
        {type: 'read', mbean: Fabric.clusterManagerMBean, attribute: $scope.ensembleContainerIdListOp}
      ], onSuccess($scope.dispatch));

    }

    public link = ($scope, $element, $attrs) => {
      if (angular.isDefined($attrs['showSelect'])) {
        $scope.showSelect = Core.parseBooleanValue($attrs['showSelect']);
      }
    };

  }


  export class ActiveProfileList extends Fabric.ContainerList {

    public templateUrl = Fabric.templatePath + "activeProfileList.html";

    public controller($scope, $element, $attrs, jolokia, $location, workspace) {

      super.controller($scope, $element, $attrs, jolokia, $location, workspace);

      $scope.searchFilter = '';

      $scope.isOpen = (profile) => {
        if ($scope.searchFilter !== '') {
          return "opened";
        }
        return "closed";
      };

      $scope.containersForProfile = (id) => {
        return $scope.containers.filter((container) => {
          return container.profileIds.some(id);
        });
      };

      $scope.showProfile = (profile) => {
        if (angular.isDefined(profile.versionId)) {
          Fabric.gotoProfile(workspace, jolokia, localStorage, $location, profile.versionId, profile);
        } else {
          Fabric.gotoProfile(workspace, jolokia, localStorage, $location, $scope.activeVersionId, profile);
        }
      };

      $scope.profileMatchesFilter = (profile) => {
        return profile.id.has($scope.searchFilter) || !profile.containers.filter((id) => { return id.has($scope.searchFilter); }).isEmpty();
      };

      $scope.containerMatchesFilter = (container) => {
        return container.id.has($scope.searchFilter) || !container.profileIds.filter((id) => {return id.has($scope.searchFilter);}).isEmpty();
      };

      $scope.editRequirementsDialogOpen = (profile) => {
        // lets make sure the requirements are pre-populated with values
        var editRequirementsEntity = {
          profileRequirements: []
        };
        if ($scope.requirements) {
          angular.copy($scope.requirements, editRequirementsEntity);
        }
        var profileRequirements = editRequirementsEntity.profileRequirements;
        if (profileRequirements) {
          angular.forEach($scope.activeProfiles, (profile) => {
            var currentRequirements = profile.requirements;
            if (!currentRequirements) {
              currentRequirements = {
                profile: profile.id
              };
              profile.requirements = currentRequirements;
              profileRequirements.push(currentRequirements);
            }
          });
        }
        $scope.editRequirementsEntity = editRequirementsEntity;
        $scope.editRequirementsDialog.open();
      };

      $scope.updateRequirements = (requirements) => {
        function onRequirementsSaved(response) {
          $scope.requirements = requirements;
          notification("success", "Updated the requirements");
          $scope.updateActiveContainers();
          Core.$apply($scope);
        };

        if (requirements) {
          $scope.editRequirementsDialog.close();

          var json = JSON.stringify(requirements);
          jolokia.execute(Fabric.managerMBean, "requirementsJson",
                  json, onSuccess(onRequirementsSaved));
        }
      };

      function onRequirements(response) {
        var responseJson = angular.toJson(response.value);

        if (responseJson !== $scope.requirementsResponse) {
          $scope.requirementsResponse = responseJson;
          $scope.requirements = response.value;
          $scope.updateActiveContainers();
          Core.$apply($scope);
        }
      }

      Core.register(jolokia, $scope, {type: 'exec', mbean: Fabric.managerMBean, operation: "requirements()"}, onSuccess(onRequirements));
    }
  }
}
