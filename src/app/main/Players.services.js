angular
	.module( 'imaginarium' )
	.factory( 'PlayersManager', function ( $timeout, toastr, $http, $sce, DataBoard, Tools, Players ) {
		var pp = {
			players: [],
			init: function () {
				_c( "------->  We prepare the players" );
				this.players = [];
				DataBoard.next_order = [];
				var i;
				for ( i = 0; i < DataBoard.data.nb_player; i ++ )
				{
					var jj = new Players.Instance( (i + 1), String( "Player " + (i + 1) ) );
					jj.prepare_joueur();
					this.players.push( jj );

					DataBoard.next_order.push( i + 1 );
				}

				// For testing !
				this.players[ 0 ].machines_reparees = [];
			}
		};
		return pp;
	} )
	.factory( 'Players', function ( $timeout, toastr, $http, $sce, DataBoard, Tools, $q ) {
		var playerObj = {
			prepare_joueur: function () {
				_c( "We prepare player " + this.nb + " >> " + this.name );
			},
			addRessources: function ( card ) {
				var deferred = $q.defer();
				var promesses = [];
				angular.forEach( DataBoard.type_ressource, function ( type_ressource, key ) {
					if ( card.production[ type_ressource ] * card.rendement[ card.level_rendement ] > 0 )
						promesses.push( this.addRessourcesSpec( type_ressource, card.production[ type_ressource ] * card.rendement[ card.level_rendement ] ) );
				}.bind( this ) );
				$q.all( promesses ).then( function () {
					deferred.resolve();
				} );
				return deferred.promise;
			},
			addRessourcesSpec: function ( type_ressource, nb ) {
				var deferred = $q.defer();
				this.liste_add = this.liste_add.concat( [ { type: type_ressource, qt: nb, p: deferred } ] );
				if ( this.liste_add.length == 1 )
				{
					this.do_animation();
				}
				return deferred.promise;
			},
			do_animation: function () {
				if ( this.liste_add.length > 0 )
				{
					if ( this.liste_add[ 0 ].qt == 0 )
					{
						$timeout( function () {
							this.liste_add[ 0 ].p.resolve();
							this.liste_add.shift();
							this.do_animation();
						}.bind( this ), 1 );
					} else
					{
						this[ 'add_' + this.liste_add[ 0 ].type ] = this.liste_add[ 0 ].qt > 0 ? String( '+ ' + this.liste_add[ 0 ].qt ) : String( this.liste_add[ 0 ].qt );
						$timeout( function () {
							this[ 'add_' + this.liste_add[ 0 ].type ] = '';
							$timeout( function () {
								this.ressources[ this.liste_add[ 0 ].type ] += this.liste_add[ 0 ].qt;
								this.liste_add[ 0 ].p.resolve();
								this.liste_add.shift();
								this.do_animation();
							}.bind( this ), 1 );
						}.bind( this ), 400 );
					}
				}
			}
		};
		return {
			Instance: function ( nb, name ) {
				this.nb = nb;
				this.name = name;
				this.liste_add = [];
				this.add_charbonium = '';
				this.add_bois = '';
				this.add_cuivre = '';
				this.add_cristal = '';
				this.add_pv = '';
				this.add_joker = '';
				this.nb_machine_reparable = 4;
				//
				this.ressources = {
					charbonium: 3,
					bois: 1,
					cuivre: 1,
					cristal: 1,
					pv: 0,
					joker: 0
				};
				this.machines = [];
				this.machines_reparees = [];
				this.assistants = [];
				this.projets = [];
				this.old_action = 0;
				this.must_choose = false;
				this.must_do = false;
				//
				angular.extend( this, playerObj );

			}
		}
	} );