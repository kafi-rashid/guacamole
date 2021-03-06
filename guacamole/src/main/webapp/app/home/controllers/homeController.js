/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * The controller for the home page.
 */
angular.module('home').controller('homeController', ['$scope', '$injector', '$interval', '$http',
        function homeController($scope, $injector, $interval, $http) {

    // Get required types
    var ConnectionGroup  = $injector.get('ConnectionGroup');
    var GroupListItem    = $injector.get('GroupListItem');
            
    // Get required services
    var authenticationService  = $injector.get('authenticationService');
    var connectionGroupService = $injector.get('connectionGroupService');
    var dataSourceService      = $injector.get('dataSourceService');
    var requestService         = $injector.get('requestService');

    /**
     * Map of data source identifier to the root connection group of that data
     * source, or null if the connection group hierarchy has not yet been
     * loaded.
     *
     * @type Object.<String, ConnectionGroup>
     */
    $scope.rootConnectionGroups = null;

    /**
     * Array of all connection properties that are filterable.
     *
     * @type String[]
     */
    $scope.filteredConnectionProperties = [
        'name'
    ];

    /**
     * Array of all connection group properties that are filterable.
     *
     * @type String[]
     */
    $scope.filteredConnectionGroupProperties = [
        'name'
    ];

    /**
     * Returns whether critical data has completed being loaded.
     *
     * @returns {Boolean}
     *     true if enough data has been loaded for the user interface to be
     *     useful, false otherwise.
     */
    $scope.isLoaded = function isLoaded() {

        return $scope.rootConnectionGroups !== null;

    };

    /**
     * Refreshing agent
     */
    // $scope.baseUrl     = 'http://172.104.253.214:8081';
    $scope.baseUrl      = window.location.protocol + '//' + window.location.hostname + ':8081'
    $scope.isRefreshing = false;
    $scope.refresh = function refresh() {
        $scope.isRefreshing = true;
        var username    = authenticationService.getCurrentUsername();
        var agentId     = '';
        if(username.toLowerCase() === 'agent10')          agentId = '10';
        else if(username.toLowerCase() === 'agent11')     agentId = '11';
        else if(username.toLowerCase() === 'agent12')     agentId = '12';
        else if(username.toLowerCase() === 'agent13')     agentId = '13';
        $http({
            method: 'GET',
            url: $scope.baseUrl+'/refreshAgent?agent='+agentId,
            // headers: {
            //     'Origin': '',
            //     'X-Requested-With': '',
            // },
        }).then(function successCallback(response) {

        });
        $scope.isAlive(agentId);
    };

    /**
     * Check if alive
     */
    $scope.intervalPeriod = 10000;
    $scope.isAlive = function isAlive(agentId) {
        var numCalls = 10;
        var checkIsAlive = $interval(function() {
            $http({
                method: 'GET',
                url: $scope.baseUrl+'/isAlive',
                // headers: {
                //     'Origin': '',
                //     'X-Requested-With': '',
                // },
            }).then(function successCallback(response) {
                if(response.status == 200) {
                    $interval.cancel(checkIsAlive);
                    $scope.isRefreshing = false;
                }
            }, function errorCallback(response) {
                numCalls--;
                if(numCalls === 0) {
                    $interval.cancel(checkIsAlive);
                    $scope.isRefreshing = false;
                    alert(`Couldn't connect to server. Please try again later.`)
                }
            });
        }, $scope.intervalPeriod);
    }

    // Retrieve root groups and all descendants
    dataSourceService.apply(
        connectionGroupService.getConnectionGroupTree,
        authenticationService.getAvailableDataSources(),
        ConnectionGroup.ROOT_IDENTIFIER
    )
    .then(function rootGroupsRetrieved(rootConnectionGroups) {
        $scope.rootConnectionGroups = rootConnectionGroups;
    }, requestService.DIE);

}]);
