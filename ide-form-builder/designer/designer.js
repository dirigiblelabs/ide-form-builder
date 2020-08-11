(function() {
  angular.module('app', ['builder', 'builder.components', 'validator.rules', 'ngSanitize']).run([
    '$builder', function($builder) {
      $builder.registerComponent('sampleInput', {
        group: 'Composite',
        label: 'Sample',
        description: 'From html template',
        placeholder: 'placeholder',
        required: false,
        validationOptions: [
          {
            label: 'none',
            rule: '/.*/'
          }, {
            label: 'number',
            rule: '[number]'
          }, {
            label: 'email',
            rule: '[email]'
          }, {
            label: 'url',
            rule: '[url]'
          }
        ],
        templateUrl: 'designer/template.html',
        popoverTemplateUrl: 'designer/popoverTemplate.html'
      });
    }
  ]).controller('DesignerController', [
    '$scope', '$builder', '$validator', function($scope, $builder, $validator) {

      var messageHub = new FramesMessageHub();
      var contents;
      
      function getResource(resourcePath) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', resourcePath, false);
            xhr.send();
            if (xhr.status === 200) {
              return xhr.responseText;
            }
      }
	
      function loadContents(file) {
        if (file) {
          return getResource('../../../../../../services/v4/ide/workspaces' + file);
        }
        console.error('file parameter is not present in the URL');
      }

      function load() {
        var searchParams = new URLSearchParams(window.location.search);
        $scope.file = searchParams.get('file');
        contents = loadContents($scope.file);
        if (!contents || contents === null || contents === "") {
          contents = '{"metadata":{"feeds":[]},"form":[]}';
        }
        var description = JSON.parse(contents);
        if (!description.form) {
          description.form = {};
        }
        if (!description.metadata) {
          description.metadata = {};
        }
        if (!description.metadata.feeds) {
          description.metadata.feeds = [];
        }
        $scope.components = description.form;
        $scope.metadata = description.metadata;
        $scope.defaultValue = {};
        $scope.data = {};
        $scope.metadata.feeds.forEach(feed => {
          var data = getResource(feed.url);
          if (feed.primary) {
            $scope.data = JSON.parse(data);
          } else {
            $scope[feed.name] = JSON.parse(data);
          }
        });
        $.each($scope.components, function(i, item){
            var formObj = $builder.addFormObject('default', item);
            $scope.defaultValue[formObj.id] =  $scope.data[formObj.model];
        });
      }
      $scope.getData = function(control) {
        alert(JSON.stringify(control));
      };
	
      load();

      function saveContents(text) {
        console.log('Save called...');
        if ($scope.file) {
          var xhr = new XMLHttpRequest();
          xhr.open('PUT', '../../../../../../services/v4/ide/workspaces' + $scope.file);
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              console.log('file saved: ' + $scope.file);
            }
          };
          xhr.send(text);
          messageHub.post({data: $scope.file}, 'editor.file.saved');
        } else {
          console.error('file parameter is not present in the request');
        }
      }

      $scope.save = function() {
        var description = {};
        description.metadata = $scope.metadata;
        description.form = $scope.form;
        contents = JSON.stringify(description);
        saveContents(contents);
      };
	
      $scope.$watch(function() {
        var components = JSON.stringify($scope.components);
        if (contents !== components) {
          messageHub.post({data: $scope.file}, 'editor.file.dirty');
        }
      });



      // metadata
      $scope.openNewDialog = function() {
        $scope.actionType = 'new';
        $scope.entity = {};
        $scope.entity.url = "";
        $scope.entity.primary = false;
        toggleEntityModal();
      };

      $scope.openEditDialog = function(entity) {
        $scope.actionType = 'update';
        $scope.entity = entity;
        toggleEntityModal();
      };

      $scope.openDeleteDialog = function(entity) {
        $scope.actionType = 'delete';
        $scope.entity = entity;
        toggleEntityModal();
      };

      $scope.close = function() {
        load();
        toggleEntityModal();
      };
      
      $scope.create = function() {
        if (!$scope.metadata) {
          $scope.metadata = {};
        }
        if (!$scope.metadata.feeds) {
          $scope.metadata.feeds = [];
        }
        var exists = $scope.metadata.feeds.filter(function(e) {
          return e.name === $scope.entity.name;
        });
        if (exists.length === 0) {
          $scope.metadata.feeds.push($scope.entity);
          toggleEntityModal();
        } else {
          $scope.error = "Feed with a name [" + $scope.entity.name + "] already exists!";
        }
        
      };

      $scope.update = function() {
        // auto-wired
        toggleEntityModal();
      };

      $scope.delete = function() {
        $scope.metadata.feeds = $scope.metadata.feeds.filter(function(e) {
          return e !== $scope.entity;
        }); 
        toggleEntityModal();
      };

      
      function toggleEntityModal() {
        $('#entityModal').modal('toggle');
        $scope.error = null;
      }





      $scope.form = $builder.forms['default'];
      $scope.input = [];

      $scope.ok = function() {
        return $validator.validate($scope, 'default').success(function() {
          return console.log('success');
        }).error(function() {
          return console.log('error');
        });
      };

      $scope.cancel = function() {
          return console.log('cancel');
      };

      return $scope.submit = function(button) {
        return $validator.validate($scope, 'default').success(function() {
          return console.log('success');
        }).error(function() {
          return console.log('error');
        });
      };

      
    }
  ]);

}).call(this);
