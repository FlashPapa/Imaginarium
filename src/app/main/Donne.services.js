angular
	.module( 'imaginarium' )
	.factory( 'Donne', function ( $timeout, toastr, $http, $sce, Tools, DataBoard, Tapis, Assistants, Projets,Mines ) {
		var donne = {
			init: function () {

				// On va initialliser la donne des carte machine ---
				$.each( DataBoard.data.donne_start, function ( index, value ) {
					// _c( index, value );
					var i;
					for ( i = 0; i < value; i ++ )
					{
						DataBoard.donne.push( { "type": String( index ), reserved:0, cout_tapis:0 } );
					}
				} );
				DataBoard.donne = Tools.shuffle( angular.copy( DataBoard.donne ) );

				// On va initialliser la donne des carte assistants ---
				var i;
				for ( i = 0; i < DataBoard.data.nb_assistant; i ++ )
				{
					DataBoard.donne_assistant.push( (i + 1) );
				}
				DataBoard.donne_assistant = Tools.shuffle( angular.copy( DataBoard.donne_assistant ) );


				// On va initialliser la donne des carte projets ---
				var i;
				for ( i = 0; i < DataBoard.data.nb_projet; i ++ )
				{
					DataBoard.donne_projet.push( (i + 1) );
				}
				DataBoard.donne_projet = Tools.shuffle( angular.copy( DataBoard.donne_projet ) );

				Tapis.deroule();
				Assistants.deroule();
				Projets.deroule();
				Mines.deroule();


			}
		};
		return donne;
	} );