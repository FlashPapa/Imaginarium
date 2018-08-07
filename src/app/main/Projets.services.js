angular
	.module( 'imaginarium' )
	.factory( 'Projets', function ( $timeout, toastr, $http, $sce, DataBoard, Tools ) {
		var projet = {
			deroule: function () {
				DataBoard.projets_dispo = DataBoard.donne_projet.slice(0, DataBoard.data.taille_projet);
				DataBoard.donne_projet = angular.copy(DataBoard.donne_projet).slice(DataBoard.data.taille_projet);
			}
		};
		return projet;
	} );