angular.module('page', ['blimpKit', 'platformView', 'EntityService'])
	.config(["EntityServiceProvider", (EntityServiceProvider) => {
		EntityServiceProvider.baseUrl = '/services/ts/codbex-organizations/gen/codbex-organizations/api/organizations/OrganizationService.ts';
	}])
	.controller('PageController', ($scope, $http, Extensions, EntityService) => {
		const Dialogs = new DialogHub();
		$scope.entity = {};
		$scope.forms = {
			details: {},
		};
		$scope.formHeaders = {
			select: 'Organization Details',
			create: 'Create Organization',
			update: 'Update Organization'
		};
		$scope.action = 'select';

		//-----------------Custom Actions-------------------//
		Extensions.getWindows(['codbex-organizations-custom-action']).then((response) => {
			$scope.entityActions = response.data.filter(e => e.perspective === 'organizations' && e.view === 'Organization' && e.type === 'entity');
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
		Dialogs.addMessageListener({ topic: 'codbex-organizations.organizations.Organization.clearDetails', handler: () => {
			$scope.$evalAsync(() => {
				$scope.entity = {};
				$scope.optionsCompany = [];
				$scope.action = 'select';
			});
		}});
		Dialogs.addMessageListener({ topic: 'codbex-organizations.organizations.Organization.entitySelected', handler: (data) => {
			$scope.$evalAsync(() => {
				$scope.entity = data.entity;
				$scope.optionsCompany = data.optionsCompany;
				$scope.action = 'select';
			});
		}});
		Dialogs.addMessageListener({ topic: 'codbex-organizations.organizations.Organization.createEntity', handler: (data) => {
			$scope.$evalAsync(() => {
				$scope.entity = {};
				$scope.optionsCompany = data.optionsCompany;
				$scope.action = 'create';
			});
		}});
		Dialogs.addMessageListener({ topic: 'codbex-organizations.organizations.Organization.updateEntity', handler: (data) => {
			$scope.$evalAsync(() => {
				$scope.entity = data.entity;
				$scope.optionsCompany = data.optionsCompany;
				$scope.action = 'update';
			});
		}});

		$scope.serviceCompany = '/services/ts/codbex-companies/gen/codbex-companies/api/Companies/CompanyService.ts';

		//-----------------Events-------------------//

		$scope.create = () => {
			EntityService.create($scope.entity).then((response) => {
				Dialogs.postMessage({ topic: 'codbex-organizations.organizations.Organization.entityCreated', data: response.data });
				Dialogs.postMessage({ topic: 'codbex-organizations.organizations.Organization.clearDetails' , data: response.data });
				Dialogs.showAlert({
					title: 'Organization',
					message: 'Organization successfully created',
					type: AlertTypes.Success
				});
			}, (error) => {
				const message = error.data ? error.data.message : '';
				Dialogs.showAlert({
					title: 'Organization',
					message: `Unable to create Organization: '${message}'`,
					type: AlertTypes.Error
				});
				console.error('EntityService:', error);
			});
		};

		$scope.update = () => {
			EntityService.update($scope.entity.Id, $scope.entity).then((response) => {
				Dialogs.postMessage({ topic: 'codbex-organizations.organizations.Organization.entityUpdated', data: response.data });
				Dialogs.postMessage({ topic: 'codbex-organizations.organizations.Organization.clearDetails', data: response.data });
				Dialogs.showAlert({
					title: 'Organization',
					message: 'Organization successfully updated',
					type: AlertTypes.Success
				});
			}, (error) => {
				const message = error.data ? error.data.message : '';
				Dialogs.showAlert({
					title: 'Organization',
					message: `Unable to create Organization: '${message}'`,
					type: AlertTypes.Error
				});
				console.error('EntityService:', error);
			});
		};

		$scope.cancel = () => {
			Dialogs.triggerEvent('codbex-organizations.organizations.Organization.clearDetails');
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
		
		$scope.createCompany = () => {
			Dialogs.showWindow({
				id: 'Company-details',
				params: {
					action: 'create',
					entity: {},
				},
				closeButton: false
			});
		};

		//-----------------Dialogs-------------------//



		//----------------Dropdowns-----------------//

		$scope.refreshCompany = () => {
			$scope.optionsCompany = [];
			$http.get('/services/ts/codbex-companies/gen/codbex-companies/api/Companies/CompanyService.ts').then((response) => {
				$scope.optionsCompany = response.data.map(e => ({
					value: e.Id,
					text: e.Name
				}));
			}, (error) => {
				console.error(error);
				const message = error.data ? error.data.message : '';
				Dialogs.showAlert({
					title: 'Company',
					message: `Unable to load data: '${message}'`,
					type: AlertTypes.Error
				});
			});
		};

		//----------------Dropdowns-----------------//	
	});