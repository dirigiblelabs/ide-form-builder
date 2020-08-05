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
        $scope.components = JSON.parse(contents);
        $scope.defaultValue = {};
        $scope.data = {};
        $scope.data["firstName"] = "John";
        $scope.data["lastName"] = "Smith";
        $.each($scope.components, function(i, item){
            var formObj = $builder.addFormObject('default', item);
            $scope.defaultValue[formObj.id] =  $scope.data[formObj.model];
        });
      }
	
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
        contents = JSON.stringify($scope.form);
        saveContents(contents);
      };
	
      $scope.$watch(function() {
        var components = JSON.stringify($scope.components);
        if (contents !== components) {
          messageHub.post({data: $scope.file}, 'editor.file.dirty');
        }
      });

      $scope.form = $builder.forms['default'];
      $scope.input = [];
      return $scope.submit = function() {
        return $validator.validate($scope, 'default').success(function() {
          return console.log('success');
        }).error(function() {
          return console.log('error');
        });
      };
    }
  ]);

}).call(this);
