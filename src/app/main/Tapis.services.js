angular
	.module( 'imaginarium' )
	.factory( 'Tapis', function ( $timeout, toastr, $http, $sce, DataBoard, Tools ) {
		var tapis = {
			deroule: function () {
				DataBoard.tapis = DataBoard.donne.slice(0, DataBoard.data.taille_tapis);
				DataBoard.donne = angular.copy(DataBoard.donne).slice(DataBoard.data.taille_tapis);
			}
		};
		return tapis;
	} );