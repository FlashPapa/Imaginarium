angular
	.module( 'imaginarium' )
	.factory( 'Assistants', function ( $timeout, toastr, $http, $sce, DataBoard, Tools ) {
		var assistant = {
			deroule: function () {
				_c(DataBoard.donne_assistant);
				DataBoard.assistant_dispo = DataBoard.donne_assistant.slice(0, DataBoard.data.taille_assistant);
				_c(DataBoard.assistant_dispo);
				DataBoard.donne_assistant = angular.copy(DataBoard.donne_assistant).slice(DataBoard.data.taille_assistant);
				_c(DataBoard.donne_assistant);
			}
		};
		return assistant;
	} );