angular
	.module( 'imaginarium' )
	.factory( 'Mines', function ( $timeout, toastr, $http, $sce, DataBoard, Tools ) {
		var mine = {
			deroule: function () {
				var i;
				for ( i = 0; i < DataBoard.data.taille_mine; i ++ )
				{
					DataBoard.mines_dispo.push( { "type": "m1", reserved:0, charbonium:(i+1)} );
				}
			}
		};
		return mine;
	} );