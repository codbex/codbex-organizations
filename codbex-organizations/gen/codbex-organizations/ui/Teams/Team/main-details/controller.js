angular.module('page', ['blimpKit', 'platformView', 'EntityService'])
	.config(["EntityServiceProvider", (EntityServiceProvider) => {
		EntityServiceProvider.baseUrl = '/services/ts/codbex-organizations/gen/codbex-organizations/api/Teams/TeamService.ts';
	}])
	.controller('PageController', ($scope, $http, Extensions, EntityService) => {
		const Dialogs = new DialogHub();
		$scope.entity = {};
		$scope.forms = {
			details: {},
		};
		$scope.formHeaders = {
			select: 'Team Details',
			create: 'Create Team',
			update: 'Update Team'
		};
		$scope.action = 'select';

		//-----------------Custom Actions-------------------//
		Extensions.getWindows(['codbex-organizations-custom-action']).then((response) => {
			$scope.entityActions = response.data.filter(e => e.perspective === 'Teams' && e.view === 'Team' && e.type === 'entity');
		});

		$scope.triggerEntityAction = (action) => {
			Dialogs.showWindow({
				hasHeader: true,
        		title: action.label,
				path: action.path,
				params: {
					id: $scope.entity.Id
				},
				closeButton: true
			});
		};
		//-----------------Custom Actions-------------------//

		//-----------------Events-------------------//
		Dialogs.addMessageListener({ topic: 'codbex-organizations.Teams.Team.clearDetails', handler: () => {
			$scope.$evalAsync(() => {
				$scope.entity = {};
				$scope.optionsManager = [];
				$scope.optionsOrganization = [];
				$scope.optionsDepartment = [];
				$scope.action = 'select';
			});
		}});
		Dialogs.addMessageListener({ topic: 'codbex-organizations.Teams.Team.entitySelected', handler: (data) => {
			$scope.$evalAsync(() => {
				$scope.entity = data.entity;
				$scope.optionsManager = data.optionsManager;
				$scope.optionsOrganization = data.optionsOrganization;
				$scope.optionsDepartment = data.optionsDepartment;
				$scope.action = 'select';
			});
		}});
		Dialogs.addMessageListener({ topic: 'codbex-organizations.Teams.Team.createEntity', handler: (data) => {
			$scope.$evalAsync(() => {
				$scope.entity = {};
				$scope.optionsManager = data.optionsManager;
				$scope.optionsOrganization = data.optionsOrganization;
				$scope.optionsDepartment = data.optionsDepartment;
				$scope.action = 'create';
			});
		}});
		Dialogs.addMessageListener({ topic: 'codbex-organizations.Teams.Team.updateEntity', handler: (data) => {
			$scope.$evalAsync(() => {
				$scope.entity = data.entity;
				$scope.optionsManager = data.optionsManager;
				$scope.optionsOrganization = data.optionsOrganization;
				$scope.optionsDepartment = data.optionsDepartment;
				$scope.action = 'update';
			});
		}});

		$scope.serviceManager = '/services/ts/codbex-employees/gen/codbex-employees/api/Employees/EmployeeService.ts';
		$scope.serviceOrganization = '/services/ts/codbex-organizations/gen/codbex-organizations/api/organizations/OrganizationService.ts';
		$scope.serviceDepartment = '/services/ts/codbex-organizations/gen/codbex-organizations/api/organizations/DepartmentService.ts';


		$scope.$watch('entity.Organization', (newValue, oldValue) => {
			if (newValue !== undefined && newValue !== null) {
				$http.get($scope.serviceOrganization + '/' + newValue).then((response) => {
					let valueFrom = response.data.Id;
					$http.post('/services/ts/codbex-organizations/gen/codbex-organizations/api/organizations/DepartmentService.ts/search', {
						$filter: {
							equals: {
								Organization: valueFrom
							}
						}
					}).then((response) => {
						$scope.optionsDepartment = response.data.map(e => ({
							value: e.Id,
							text: e.Name
						}));
						if ($scope.action !== 'select' && newValue !== oldValue) {
							if ($scope.optionsDepartment.length == 1) {
								$scope.entity.Department = $scope.optionsDepartment[0].value;
							} else {
								$scope.entity.Department = undefined;
							}
						}
					}, (error) => {
						console.error(error);
					});
				}, (error) => {
					console.error(error);
				});
			}
		});
		//-----------------Events-------------------//

		$scope.create = () => {
			EntityService.create($scope.entity).then((response) => {
				Dialogs.postMessage({ topic: 'codbex-organizations.Teams.Team.entityCreated', data: response.data });
				Dialogs.postMessage({ topic: 'codbex-organizations.Teams.Team.clearDetails' , data: response.data });
				Dialogs.showAlert({
					title: 'Team',
					message: 'Team successfully created',
					type: AlertTypes.Success
				});
			}, (error) => {
				const message = error.data ? error.data.message : '';
				Dialogs.showAlert({
					title: 'Team',
					message: `Unable to create Team: '${message}'`,
					type: AlertTypes.Error
				});
				console.error('EntityService:', error);
			});
		};

		$scope.update = () => {
			EntityService.update($scope.entity.Id, $scope.entity).then((response) => {
				Dialogs.postMessage({ topic: 'codbex-organizations.Teams.Team.entityUpdated', data: response.data });
				Dialogs.postMessage({ topic: 'codbex-organizations.Teams.Team.clearDetails', data: response.data });
				Dialogs.showAlert({
					title: 'Team',
					message: 'Team successfully updated',
					type: AlertTypes.Success
				});
			}, (error) => {
				const message = error.data ? error.data.message : '';
				Dialogs.showAlert({
					title: 'Team',
					message: `Unable to create Team: '${message}'`,
					type: AlertTypes.Error
				});
				console.error('EntityService:', error);
			});
		};

		$scope.cancel = () => {
			Dialogs.triggerEvent('codbex-organizations.Teams.Team.clearDetails');
		};
		
		//-----------------Dialogs-------------------//
		$scope.alert = (message) => {
			if (message) Dialogs.showAlert({
				title: 'Description',
				message: message,
				type: AlertTypes.Information,
				preformatted: true,
			});
		};
		
		$scope.createManager = () => {
			Dialogs.showWindow({
				id: 'Employee-details',
				params: {
					action: 'create',
					entity: {},
				},
				closeButton: false
			});
		};
		$scope.createOrganization = () => {
			Dialogs.showWindow({
				id: 'Organization-details',
				params: {
					action: 'create',
					entity: {},
				},
				closeButton: false
			});
		};
		$scope.createDepartment = () => {
			Dialogs.showWindow({
				id: 'Department-details',
				params: {
					action: 'create',
					entity: {},
				},
				closeButton: false
			});
		};

		//-----------------Dialogs-------------------//



		//----------------Dropdowns-----------------//

		$scope.refreshManager = () => {
			$scope.optionsManager = [];
			$http.get('/services/ts/codbex-employees/gen/codbex-employees/api/Employees/EmployeeService.ts').then((response) => {
				$scope.optionsManager = response.data.map(e => ({
					value: e.Id,
					text: e.Name
				}));
			}, (error) => {
				console.error(error);
				const message = error.data ? error.data.message : '';
				Dialogs.showAlert({
					title: 'Manager',
					message: `Unable to load data: '${message}'`,
					type: AlertTypes.Error
				});
			});
		};
		$scope.refreshOrganization = () => {
			$scope.optionsOrganization = [];
			$http.get('/services/ts/codbex-organizations/gen/codbex-organizations/api/organizations/OrganizationService.ts').then((response) => {
				$scope.optionsOrganization = response.data.map(e => ({
					value: e.Id,
					text: e.Name
				}));
			}, (error) => {
				console.error(error);
				const message = error.data ? error.data.message : '';
				Dialogs.showAlert({
					title: 'Organization',
					message: `Unable to load data: '${message}'`,
					type: AlertTypes.Error
				});
			});
		};
		$scope.refreshDepartment = () => {
			$scope.optionsDepartment = [];
			$http.get('/services/ts/codbex-organizations/gen/codbex-organizations/api/organizations/DepartmentService.ts').then((response) => {
				$scope.optionsDepartment = response.data.map(e => ({
					value: e.Id,
					text: e.Name
				}));
			}, (error) => {
				console.error(error);
				const message = error.data ? error.data.message : '';
				Dialogs.showAlert({
					title: 'Department',
					message: `Unable to load data: '${message}'`,
					type: AlertTypes.Error
				});
			});
		};

		//----------------Dropdowns-----------------//	
	});