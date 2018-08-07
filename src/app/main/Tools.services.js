angular
	.module( 'imaginarium' )
	.factory( 'Tools', function ( $timeout, toastr, $http, $sce ) {
		var tools = {
			shuffle: function ( array ) {
				var m = array.length, t, i;

				// While there remain elements to shuffle…
				while ( m )
				{

					// Pick a remaining element…
					i = Math.floor( Math.random() * m -- );

					// And swap it with the current element.
					t = array[ m ];
					array[ m ] = array[ i ];
					array[ i ] = t;
				}

				return array;
			},
			compare: function ( a, b ) {
				if ( a.ressources.pv > b.ressources.pv )
					return - 1;
				if ( a.ressources.pv < b.ressources.pv )
					return 1;
				return 0;
			}
		};
		return tools;
	} );