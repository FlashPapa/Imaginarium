(function () {
	'use strict';

	angular
		.module( 'imaginarium' )
		.config( routerConfig );

	/** @ngInject */
	function routerConfig( $stateProvider, $urlRouterProvider )
	{
		$stateProvider
			.state( 'main', {
				url: '/',
				templateUrl: 'app/main/main.html',
				controller: 'MainController',
				controllerAs: 'main'
			} )

		$urlRouterProvider.otherwise( '/' );
	}

})();
