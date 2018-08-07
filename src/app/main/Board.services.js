angular
	.module( 'imaginarium' )
	.factory( 'Board', function ( $q, $timeout, toastr, $http, $sce, Tools, DataBoard, Donne, PlayersManager, $uibModal ) {

		var board = {
			adv: function ( v ) {
				DataBoard.advert = v;
			},
			init: function () {
				_c( "--- Init la board !!! ---" );
				// On va initialliser la donne
				DataBoard.reset();
				Donne.init();
				PlayersManager.init();
				board.start();
			},
			start: function () {
				_c( "--- Start Game !!! ---" );
				toastr.info( 'Phase : ' + DataBoard.current_phase );
				this.checkPhase();
			},
			checkPhase: function () {
				if ( DataBoard.current_phase == 1 )
				{
					if ( DataBoard.current_tour >= DataBoard.data.nb_player )
					{
						DataBoard.current_player = '';
						board.adv( '' );
						// Recherche du nouvel ordre à joueur !
						DataBoard.next_order = [];
						var i;
						for ( i = (DataBoard.data.taille_mine - 1); i >= 0; i -- )
							if ( DataBoard.mines_dispo[ i ].reserved > 0 )
								DataBoard.next_order.push( parseInt( DataBoard.mines_dispo[ i ].reserved ) );
						for ( i = DataBoard.data.taille_tapis - 1; i >= 0; i -- )
							if ( DataBoard.tapis[ i ].reserved > 0 )
								DataBoard.next_order.push( parseInt( DataBoard.tapis[ i ].reserved ) );
						///-----


						DataBoard.current_phase = 2;
						DataBoard.current_tour = 0;
						toastr.info( 'Phase : ' + DataBoard.current_phase );
						board.checkPhase();
					} else
					{
						DataBoard.current_player = DataBoard.next_order[ DataBoard.current_tour ];
						board.adv( "Player " + DataBoard.current_player + " turn, he must reserve a machine or a mine" );
					}
				} else if ( DataBoard.current_phase == 2 )
				{
					if ( DataBoard.current_tour >= DataBoard.data.nb_player )
					{
						DataBoard.current_player = '';
						board.adv( '' );
						DataBoard.current_phase = 3;
						DataBoard.current_tour = 0;
						toastr.info( 'Phase : ' + DataBoard.current_phase );
						board.checkPhase();
					} else
					{
						DataBoard.current_player = DataBoard.next_order[ DataBoard.current_tour ];
						board.adv( "Player " + DataBoard.next_order[ DataBoard.current_tour ] + " turn" );
						// On fait tourner les machines
						this.tourner_machine();
						// On paye la carte ou on mine
						// On choisit 2 actions
						// joueur suivant
					}
				} else
				{
					_c( 'End of turn' );
					DataBoard.current_player = '';
					board.adv( '' );
					DataBoard.next_order = [];
					DataBoard.current_action = [];
					DataBoard.current_tour = 0;

					// On parcours le mines_dispo pour voir si pas un user
					var i;
					for ( i = (DataBoard.data.taille_mine - 1); i >= 0; i -- )
					{
						if ( DataBoard.mines_dispo[ i ].reserved > 0 )
						{
							DataBoard.next_order.push( parseInt( DataBoard.mines_dispo[ i ].reserved ) );
							DataBoard.mines_dispo[ i ].reserved = 0;
						}
					}
					// On parcours le tapis pour supprimer les cartes réservées et replacer les joueurs
					var new_tapis = [];
					for ( i = DataBoard.data.taille_tapis - 1; i >= 0; i -- )
					{
						if ( DataBoard.tapis[ i ].reserved > 0 )
						{
							DataBoard.next_order.push( parseInt( DataBoard.tapis[ i ].reserved ) );
						} else
						{
							if ( i == DataBoard.data.taille_tapis - 1 )
							{
								// crash the last card not reserved!
							} else
							{
								new_tapis.unshift( DataBoard.tapis[ i ] );
							}

						}
					}

					// DataBoard.tapis = new_tapis;
					var carte_a_ajouter = DataBoard.data.taille_tapis - new_tapis.length;
					for ( i = 0; i < carte_a_ajouter; i ++ )
					{
						new_tapis.unshift( angular.copy( DataBoard.donne[ 0 ] ) );
						DataBoard.donne.shift();
					}

					DataBoard.tapis = new_tapis;
					DataBoard.current_tour = 0;
					DataBoard.current_phase = 1;
					DataBoard.current_action = [];

					var winner = false;
					angular.forEach( PlayersManager.players, function ( player ) {
						if ( player.ressources.pv >= DataBoard.data.pv_victory )
							winner = true;
					} );

					if ( winner )
					{

						var final_order = angular.copy( PlayersManager.players ).sort( Tools.compare );
						_c( "Final order >>" );
						_c( final_order );

						var modalInstance = $uibModal.open( {
							animation: true,
							templateUrl: 'app/modals/modal_victory.html',
							controller: 'ModalVictoryCtrl',
							size: 'lg',
							backdrop: 'static',
							resolve: {
								Obj: {
									nb_victorious: final_order[ 0 ].nb,
									final_order: final_order
								}
							}
						} );

						modalInstance.result.then( function ( Obj ) {
							DataBoard.game_is_ready = false;
						}, function () {
							DataBoard.game_is_ready = false;
						} );
					} else
					{
						board.checkPhase();
					}


				}
			},
			open_card_detail: function ( t ) {
				var modalInstance = $uibModal.open( {
					animation: true,
					templateUrl: 'app/modals/modal_card_detail.html',
					controller: 'ModalCardDetailCtrl',
					size: 'lg',
					resolve: {
						Obj: { type: t }
					}
				} );
			},
			do_action_player: function ( action ) {
				// 1 - Réparation
				// 2 - Echange
				// 3 - Destruction
				// 4 - Combine
				// 5 - Assistant
				// 6 - Miner

				if ( ! DataBoard.being_processed )
				{
					DataBoard.being_processed = true;
					var cp = this.get_current_player();

					if ( action != 0 )
						board.enleve_to_current_action( action );

					if ( action === 1 )
					{
						// REPARATION ---

						if ( cp.machines.length <= 0 )
						{
							_c( "Player " + cp.nb + " does not have a repair machine !" );
							toastr.info( "Player " + cp.nb + " does not have a repair machine !" );
							$timeout( function () {
								board.test_fin_action();
							}, 1500 );
						} else if ( cp.machines_reparees.length >= cp.nb_machine_reparable )
						{
							_c( "Player " + cp.nb + " has no room for a new machine !" );
							toastr.info( "Player " + cp.nb + " has no room for a new machine !" );
							$timeout( function () {
								board.test_fin_action();
							}, 1500 );
						} else
						{
							_c( "Player " + cp.nb + " repairs a machine" );
							var modalInstance = $uibModal.open( {
								animation: true,
								templateUrl: 'app/modals/modal_reparation.html',
								controller: 'ModalReparationCtrl',
								size: 'lg',
								backdrop: 'static',
								resolve: {
									Obj: {}
								}
							} );

							modalInstance.result.then( function ( Obj ) {
								board.resolve_reparation( Obj );
							}, function () {
								board.resolve_reparation();
							} );
						}
					} else if ( action === 2 )
					{
						// ECHANGES ---

						var total_ressource_echangeable = cp.ressources.charbonium + cp.ressources.bois + cp.ressources.cuivre + cp.ressources.cristal;

						if ( total_ressource_echangeable <= 0 )
						{
							toastr.error( "Player " + cp.nb + " has no resources to trade !" );
							board.test_fin_action();
						} else
						{
							var modalInstance = $uibModal.open( {
								animation: true,
								templateUrl: 'app/modals/modal_echange.html',
								controller: 'ModalEchangeCtrl',
								size: 'lg',
								backdrop: 'static',
								resolve: {
									Obj: {}
								}
							} );

							modalInstance.result.then( function ( Obj ) {
								board.resolve_echange( Obj );
							}, function () {
								board.resolve_echange();
							} );
						}
					} else if ( action === 3 )
					{
						// DESTRUCTION ---

						// On va chercher le nombre de machine réparées et non combinées
						var reslt = board.check_statut_machine_reparees( cp );
						if ( cp.machines_reparees == 0 )
						{
							toastr.info( "Player " + cp.nb + " has no machine repaired to destroy !" );
							$timeout( function () {
								board.test_fin_action();
							}, 1500 );
						} else if ( reslt.non_combinee == 0 && reslt.combinee > 0 )
						{
							toastr.info( "Player " + cp.nb + " must reorganize his machines in order to destroy them !" );
							$timeout( function () {
								board.test_fin_action();
							}, 1500 );
						} else
						{
							var modalInstance = $uibModal.open( {
								animation: true,
								templateUrl: 'app/modals/modal_destruction.html',
								controller: 'ModalDestructionCtrl',
								size: 'lg',
								backdrop: 'static',
								resolve: { Obj: {} }
							} );

							modalInstance.result.then( function ( Obj ) {
								$timeout( function () {
									var cp = board.get_current_player();
									$q.all( [
										cp.addRessourcesSpec( 'bois', Obj.bois ),
										cp.addRessourcesSpec( 'cuivre', Obj.cuivre ),
										cp.addRessourcesSpec( 'cristal', Obj.cristal ),
										cp.addRessourcesSpec( 'pv', Obj.pv )
									] ).then( function () {
										board.test_fin_action();
									} );
								}, 500 );
							}, function () {
								board.test_fin_action();
							} );
						}

					} else if ( action === 4 )
					{
						// COMBINE ---

						if ( cp.machines_reparees == 0 )
						{
							toastr.info( "Player " + cp.nb + " has no machine repaired to combine !" );
							$timeout( function () {
								board.test_fin_action();
							}, 1500 );
						} else
						{
							var modalInstance = $uibModal.open( {
								animation: true,
								templateUrl: 'app/modals/modal_combine.html',
								controller: 'ModalCombineCtrl',
								size: 'lg',
								backdrop: 'static',
								resolve: { Obj: {} }
							} );

							modalInstance.result.then( function ( Obj ) {
								board.test_fin_action();
							}, function () {
								board.test_fin_action();
							} );
						}

					} else if ( action === 6 )
					{
						// MINER ---

						_c( "Player " + cp.nb + " mines 3 charbonium" );
						//cp.ressources.charbonium += 3;
						cp.addRessourcesSpec( "charbonium", 3 );
						board.test_fin_action();
					} else
					{
						if ( action !== 0 )
						{
							DataBoard.being_processed = false;
							board.test_fin_action();
						}
					}
				}
			},
			enleve_to_current_action: function ( action ) {
				_c( "we must remove the action : " + action );
				var idx = _.indexOf( DataBoard.current_action, parseInt( action ) );
				_c( idx );
				DataBoard.current_action.splice( idx, 1 );
				_c( DataBoard.current_action );
			},
			test_fin_action: function () {
				var cp = this.get_current_player();
				DataBoard.being_processed = false;
				if ( DataBoard.current_action.length == 0 )
				{
					cp.must_do = false;
					_c( "Player " + cp.nb + " finishes his turn !" );
					$timeout( function () {
						DataBoard.current_tour ++;
						board.checkPhase();
					}, 1000 );
				}
			},
			check_statut_machine_reparees: function ( cp ) {
				var non_combinee = 0;
				var combinee = 0;
				angular.forEach( cp.machines_reparees, function ( card ) {
					if ( card.combined.length <= 0 )
					{
						non_combinee ++;
					} else
						combinee ++;
				} );
				return { combinee: combinee, non_combinee: non_combinee };
			},
			resolve_echange: function ( Obj ) {
				_c( Obj );
				$q.all( Obj ).then( function () {
					board.test_fin_action();
				} )
			},
			resolve_reparation: function ( Obj ) {
				var cp = this.get_current_player();
				var liste_demande = [];

				var gestionnaire_ressource = $q.defer();
				var gestionnaire_joker = $q.defer();

				function get_gestionnaire_ressource()
				{
					if ( Obj !== undefined )
					{

						$q.all( [
							cp.addRessourcesSpec( "bois", - Obj.card.cout_reparation.bois ),
							cp.addRessourcesSpec( "cuivre", - Obj.card.cout_reparation.cuivre ),
							cp.addRessourcesSpec( "cristal", - Obj.card.cout_reparation.cristal )
						] ).then( function () {

							cp.machines.splice( Obj.idx, 1 );
							cp.machines_reparees.push( angular.copy( Obj.card ) );

							var sub = String( Obj.card.type ).substr( 0, 1 );

							if ( sub === 'p' )
							{
								// Machines de Production ---
								_c( "we repair " + Obj.card.type );
								cp.addRessources( Obj.card ).then( function () {
									_c( "next" );
									next();
								} );
							} else if ( sub === 't' )
							{
								// Machines de transformation ---
								liste_demande.push( { type: Obj.card.type, p: $q.defer(), card: Obj.card } );
								next();
							} else if ( sub === 's' )
							{
								// Machines de spéciales ---
								next();
							} else if ( sub === 'a' )
							{
								// Machines de attaque ---
								next();
							} else if ( sub === 'd' )
							{
								// Machines de defense ---
								next();
							}
						} );
					} else
					{
						next();
					}

				}

				function next()
				{
					if ( liste_demande.length > 0 )
					{
						board.manage_liste_demande( 0, liste_demande, gestionnaire_ressource );
					} else
					{
						gestionnaire_ressource.resolve( "gestionnaire_ressource" );
					}
				}

				function get_gestionnaire_joker()
				{
					_c( "cp.ressources.joker :" + cp.ressources.joker );
					if ( cp.ressources.joker > 0 )
					{
						var modalInstance = $uibModal.open( {
							animation: true,
							templateUrl: 'app/modals/modal_ressource_bonus.html',
							controller: 'ModalBonusCtrl',
							size: 'lg',
							backdrop: 'static',
							resolve: {
								Obj: {}
							}
						} );

						modalInstance.result.then( function () {
							gestionnaire_joker.resolve( "gestionnaire_joker" );
						}, function () {
							gestionnaire_joker.resolve( "gestionnaire_joker" );
						} );
					}
					else
					{
						gestionnaire_joker.resolve( "gestionnaire_joker" );
					}
				}

				gestionnaire_ressource.promise.then( function () {
					_c( "test joker" );
					get_gestionnaire_joker();
				} );

				gestionnaire_joker.promise.then( function () {
					board.test_fin_action();
				} );

				get_gestionnaire_ressource();

			},
			reserve_card: function ( idx, card ) {
				if ( DataBoard.current_phase == 1 && ! DataBoard.being_processed )
				{
					DataBoard.being_processed = true;
					if ( card.reserved == 0 )
					{
						_c( card );
						if ( card.type == "m1" )
						{
							_c( "Player " + DataBoard.next_order[ DataBoard.current_tour ] + " reserves the mine " + idx );
						} else
						{
							_c( "Player " + DataBoard.next_order[ DataBoard.current_tour ] + " reserves the machine" + idx );
						}

						card.reserved = parseInt( DataBoard.next_order[ DataBoard.current_tour ] );
						$timeout( function () {
							DataBoard.current_tour ++;
							DataBoard.being_processed = false;
							board.checkPhase();
						}, 200 );
					} else
					{
						toastr.error( 'Card already reserved by the player : ' + card.reserved );
						DataBoard.being_processed = false;
					}
				}
			},
			manage_liste_demande: function ( idx, liste, gestionnaire_ressource ) {
				var cp = this.get_current_player();
				if ( idx < liste.length )
				{

					var nb_choice = liste[ idx ].type === "t4" ? 2 : 1;

					if ( nb_choice > cp.ressources.bois + cp.ressources.cuivre + cp.ressources.cristal )
					{
						_c( "Player " + cp.nb + " does not have enough resources for the card" + liste[ idx ].type );
						toastr.info( "Player " + cp.nb + " does not have enough resources for the card" + liste[ idx ].type );
						board.manage_liste_demande( idx + 1, liste, gestionnaire_ressource );
					} else
					{
						liste[ idx ].p.promise.then( function () {
							board.manage_liste_demande( idx + 1, liste, gestionnaire_ressource );
						} );

						var modalInstance = $uibModal.open( {
							animation: true,
							templateUrl: 'app/modals/modal_demande.html',
							controller: 'ModalDemandeCtrl',
							size: 'lg',
							backdrop: 'static',
							resolve: {
								Obj: liste[ idx ]
							}
						} );
						// modalInstance.result.then( function () {
						// }, function () {
						// } );
					}

				} else
				{
					gestionnaire_ressource.resolve( "gestionnaire_ressource" );
				}

			},
			tourner_machine: function () {

				var cp = this.get_current_player();
				_c( DataBoard.current_tour );
				_c( DataBoard.next_order );
				_c( cp );
				_c( "Player " + cp.nb + " runs the machines of !!!" );
				// _c( PlayersManager.players );

				// le joueur a t il des machines réparées
				if ( cp.machines_reparees.length > 0 )
				{

					var gestionnaire_ressource = $q.defer();
					var gestionnaire_joker = $q.defer();
					var liste_promises = [];
					var liste_demande = [];

					// On calcul les ressources produites
					function get_gestionnaire_ressource()
					{
						angular.forEach( cp.machines_reparees, function ( v ) {
							var sub = String( v.type ).substr( 0, 1 );
							_c( sub );
							if ( sub === 'p' )
							{
								// Machines de Production ---
								liste_promises.push( cp.addRessources( v ) );

							} else if ( sub === 't' )
							{
								// Machines de transformation ---
								if ( v.auto_alimentation )
								{
									liste_promises.push( cp.addRessources( v ) );
								} else
								{
									liste_demande.push( { type: v.type, p: $q.defer(), card: v } );
								}
							} else if ( sub === 's' )
							{
								// Machines de spéciales ---
							} else if ( sub === 'a' )
							{
								// Machines de attaque ---
							} else if ( sub === 'd' )
							{
								// Machines de defense ---
							}
						} );
						next();
					}

					function next()
					{
						if ( liste_promises.length > 0 )
						{
							$q.all( liste_promises ).then( function () {
								next2();
							} );
						} else
						{
							next2();
						}
					}

					function next2()
					{
						if ( liste_demande.length > 0 )
						{
							board.manage_liste_demande( 0, liste_demande, gestionnaire_ressource );
						} else
						{
							gestionnaire_ressource.resolve( "gestionnaire_ressource" );
						}
					}

					function get_gestionnaire_joker()
					{
						if ( cp.ressources.joker > 0 )
						{
							var modalInstance = $uibModal.open( {
								animation: true,
								templateUrl: 'app/modals/modal_ressource_bonus.html',
								controller: 'ModalBonusCtrl',
								size: 'lg',
								backdrop: 'static',
								resolve: {
									Obj: {}
								}
							} );

							modalInstance.result.then( function () {
								//board.paye_reservation( cp );
								gestionnaire_joker.resolve( "gestionnaire_joker" );
							}, function () {
								gestionnaire_joker.resolve( "gestionnaire_joker" );
								//board.paye_reservation( cp );
							} );
						} else
						{
							gestionnaire_joker.resolve( "gestionnaire_joker" );
						}
					}

					gestionnaire_ressource.promise.then( function () {
						get_gestionnaire_joker();
					} );
					gestionnaire_joker.promise.then( function () {
						board.paye_reservation( cp );
					} );

					get_gestionnaire_ressource();

					// ---- ASYNCH

					// ----> this.paye_reservation( cp );

				} else
				{
					_c( "Player " + cp.nb + " does not have repaired machines" );
					this.paye_reservation( cp );
				}
			},
			paye_reservation: function ( cp ) {
				var card = this.get_card_reserved( cp.nb );
				_c( card );
				if ( card == '' )
				{
					_c( "big problem of selection !!!!" );
				} else
				{
					if ( card.type == "m1" )
					{
						_c( "Player " + cp.nb + " mines " + card.charbonium );
						cp.addRessourcesSpec( "charbonium", card.charbonium ).then( function () {
							board.do_action( cp );
						} )
					} else
					{
						_c( "Player " + cp.nb + " has reserved a card " + card.type );
						var card_selected = DataBoard.data.type_card[ card.type ];
						card_selected.type = String( card.type );
						_c( card_selected );
						_c( "Player " + cp.nb + "must pay to the treadmill " + card.cout_tapis + " + Level " + card_selected.niveau );
						var cost = parseInt( card.cout_tapis ) + parseInt( card_selected.niveau );
						_c( cost );

						if ( cp.ressources.charbonium < cost )
						{
							_c( "Player " + cp.nb + " does not have enough charbonium " );
							_c( "Player " + cp.nb + " loses all his resources and loses a turn " );
							cp.ressources.charbonium = 0;
							cp.ressources.bois = 0;
							cp.ressources.cuivre = 0;
							cp.ressources.cristal = 0;
							$timeout( function () {
								DataBoard.current_tour ++;
								board.checkPhase();
							}, 200 );
						} else
						{
							cp.addRessourcesSpec( "charbonium", - cost ).then( function () {
								cp.machines.push( angular.copy( card_selected ) );
								$timeout( function () {
									board.do_action( cp );
								}, 200 );
							} );
						}


					}
				}
			},
			do_action: function ( cp ) {
				_c( "Player " + cp.nb + " must choose 2 actions ! " );
				toastr.success( "Player " + cp.nb + " must choose 2 actions" );
				cp.must_choose = true;
			},
			get_card_reserved: function ( nb_player ) {
				var card = '';
				var i = 0;
				angular.forEach( DataBoard.tapis, function ( v, k ) {
					if ( parseInt( v.reserved ) == parseInt( nb_player ) )
					{
						card = v;
						card.cout_tapis = DataBoard.data.cout_tapis[ i ]
					}
					i ++;
				} );
				if ( card === '' )
				{
					angular.forEach( DataBoard.mines_dispo, function ( v, k ) {
						if ( parseInt( v.reserved ) == parseInt( nb_player ) )
						{
							card = v;
						}
					} );
				}
				return card;
			},
			get_current_player: function () {
				return PlayersManager.players[ (DataBoard.next_order[ DataBoard.current_tour ]) - 1 ];
			},
			chosse_action: function ( v ) {
				if ( ! DataBoard.being_processed )
				{
					DataBoard.being_processed = true;
					var cp = this.get_current_player();

					if ( cp.old_action != v )
					{
						cp.old_action = v;
						var tab = [ [ 1, 2 ]
							, [ 2, 3 ]
							, [ 3, 4 ]
							, [ 4, 5 ]
							, [ 5, 6 ]
							, [ 6, 1 ] ];

						_c( "Player " + cp.nb + " chooses the actions  " + tab[ v - 1 ][ 0 ] + " & " + tab[ v - 1 ][ 1 ] );
						toastr.info( "Player " + cp.nb + " chooses the actions  " + tab[ v - 1 ][ 0 ] + " & " + tab[ v - 1 ][ 1 ] );
						cp.must_choose = false;
						DataBoard.current_action = tab[ v - 1 ];
						cp.must_do = true;
						DataBoard.being_processed = false;
					} else
					{
						toastr.error( "Can not do the same actions twice !" );
						DataBoard.being_processed = false;
					}
				}
			},
			add_ressource: function ( cp, v ) {
				_c( cp );
				_c( v );
				if ( v === 1 ) cp.addRessourcesSpec( "charbonium", 1 );
				if ( v === 2 ) cp.addRessourcesSpec( "bois", 1 );
				if ( v === 3 ) cp.addRessourcesSpec( "cuivre", 1 );
				if ( v === 4 ) cp.addRessourcesSpec( "cristal", 1 );
				if ( v === 5 ) cp.addRessourcesSpec( "pv", 1 );
				if ( v === 6 ) cp.addRessourcesSpec( "joker", 1 );
			},
			getStylePlayer: function ( item ) {
				var st = 'col-md-4';
				if ( DataBoard.current_phase == 2 )
				{
					st = DataBoard.next_order[ DataBoard.current_tour ] == item.nb ? 'col-md-6' : 'col-md-3'
				}
				return st;
			}

		};
		return board;
	} )
;


angular
	.module( 'imaginarium' )
	.controller( 'ModalReparationCtrl', function ( $scope, $q, $uibModalInstance, Obj, Board, DataBoard, toastr ) {

			$scope.Obj = Obj;
			$scope.Board = Board;
			$scope.cp = Board.get_current_player();

			$scope.repare_machine = function ( idx, card ) {
				toastr.clear();
				_c( "Player " + $scope.cp.nb + " wishes to repair the machine " + idx );
				_c( card );

				if (
					card.cout_reparation.bois <= $scope.cp.ressources.bois
					&& card.cout_reparation.cuivre <= $scope.cp.ressources.cuivre
					&& card.cout_reparation.cristal <= $scope.cp.ressources.cristal
				)
				{
					_c( 'Repair ok' );
					toastr.success( 'Repair ok' );
					$uibModalInstance.close( { idx: idx, card: angular.copy( card ) } );
				} else
				{
					_c( 'Insufficient resources to repair this machine' );
					toastr.error( 'Insufficient resources to repair this machine' );
				}
			}
			;

			$scope.ok = function () {
				$uibModalInstance.close( $scope.selected.item );
			};

			$scope.cancel = function () {
				$uibModalInstance.dismiss( 'cancel' );
			};
		}
	);


angular
	.module( 'imaginarium' )
	.controller( 'ModalDestructionCtrl', function ( $scope, $q, $uibModalInstance, Obj, Board, DataBoard, toastr ) {

			$scope.Obj = Obj;
			$scope.Board = Board;
			$scope.cp = Board.get_current_player();
			$scope.liste = [];
			$scope.sel = { idx: '', card: {}, selected: false };

			$scope.sel_bois = 0;
			$scope.sel_cuivre = 0;
			$scope.sel_cristal = 0;
			$scope.sel_pv = 0;

			angular.forEach( $scope.cp.machines_reparees, function ( card ) {
				if ( card.combined.length <= 0 )
				{
					$scope.liste.push( angular.copy( card ) );
				}
			} );

			$scope.selection = function ( idx, card ) {
				$scope.annuler_sel();
				$scope.sel.idx = idx;
				$scope.sel.card = card;
				$scope.sel.selected = true;
			};

			$scope.make_echange = function ( v ) {
				if ( $scope.sel_bois + $scope.sel_cuivre + $scope.sel_cristal < $scope.sel.card.niveau )
				{
					if ( v === 1 )
					{
						$scope.sel_pv = 0;
						if ( $scope.sel_bois < $scope.sel.card.cout_reparation.bois )
							$scope.sel_bois ++;
					} else if ( v === 2 )
					{
						$scope.sel_pv = 0;
						if ( $scope.sel_cuivre < $scope.sel.card.cout_reparation.cuivre )
							$scope.sel_cuivre ++;
					} else
					{
						$scope.sel_pv = 0;
						if ( $scope.sel_cristal < $scope.sel.card.cout_reparation.cristal )
							$scope.sel_cristal ++;
					}
				}
				if ( v === 4 && $scope.sel_pv < $scope.sel.card.niveau )
				{
					$scope.sel_bois = 0;
					$scope.sel_cuivre = 0;
					$scope.sel_cristal = 0;
					$scope.sel_pv += $scope.sel.card.niveau;
				}
			};

			$scope.annuler_sel = function () {
				$scope.sel_bois = 0;
				$scope.sel_cuivre = 0;
				$scope.sel_cristal = 0;
				$scope.sel_pv = 0;
			};

			$scope.ok = function () {
				if ( $scope.sel_pv == $scope.sel.card.niveau || $scope.sel.card.niveau == ($scope.sel_bois + $scope.sel_cuivre + $scope.sel_cristal) )
				{
					$scope.liste.splice( $scope.sel.idx, 1 );
					angular.forEach( $scope.cp.machines_reparees, function ( card ) {
						if ( card.combined.length > 0 )
						{
							$scope.liste.push( angular.copy( card ) );
						}
					} );
					$scope.cp.machines_reparees = angular.copy( $scope.liste );
					$uibModalInstance.close( {
						bois: $scope.sel_bois,
						cuivre: $scope.sel_cuivre,
						cristal: $scope.sel_cristal,
						pv: $scope.sel_pv
					} );
				} else
				{
					toastr.info( "Thank you to complete your selection" );
				}
			};

			$scope.cancel = function () {
				$uibModalInstance.dismiss( 'cancel' );
			};
		}
	);

angular
	.module( 'imaginarium' )
	.controller( 'ModalCombineCtrl', function ( $scope, $q, $uibModalInstance, Obj, Board, DataBoard, toastr ) {

			$scope.Obj = Obj;
			$scope.cp = Board.get_current_player();
			//$scope.mirroir = [];//angular.copy( $scope.cp.machines_reparees );

			$scope.reset = function () {
				//
				$scope.tabS1 = [];
				$scope.tabS2 = [];
				$scope.tabS3 = [];
				$scope.tabS4 = [];
				$scope.tabS5 = [];
				$scope.tabS6 = [];
				$scope.new_result = [];
				//
				$scope.ResS1 = {};
				$scope.ResS2 = {};
				$scope.ResS3 = {};
				$scope.ResS4 = {};
				$scope.ResS5 = {};
				$scope.ResS6 = {};
				//
			};

			$scope.init = function () {
				$scope.reset();
				var tab = [];
				_c( $scope.cp.machines_reparees );
				angular.forEach( $scope.cp.machines_reparees, function ( card, key ) {
					if ( card.hasOwnProperty( 'type' ) && card !== undefined )
					{
						tab.push( angular.copy( DataBoard.data.type_card[ card.type ] ) );
						if ( card.combined.length > 0 )
						{
							if ( card.combined[ 0 ].type !== undefined )
							{
								tab.push( angular.copy( DataBoard.data.type_card[ card.combined[ 0 ].type ] ) );
								if ( card.combined[ 0 ].combined.length > 0 )
								{
									if ( card.combined[ 0 ].combined[ 0 ].type !== undefined )
									{
										tab.push( angular.copy( DataBoard.data.type_card[ card.combined[ 0 ].combined[ 0 ].type ] ) );
									}
								}
							}
						}
					}
				} );
				$scope.mirroir = tab;

				_c( tab );
				_c( $scope.mirroir );
			};
			$scope.init();

			$scope.sortableOptions = {
				// placeholder: "app",
				connectWith: ".apps-container",

				// STOP SORTABLE ---
				stop: function ( event, ui ) {
					var from_list = ui.item.sortable.source[ 0 ].attributes[ 'ng-model' ].nodeValue;
					var dest_list = ui.item.sortable.droptarget[ 0 ].attributes[ 'ng-model' ].nodeValue;


					if ( dest_list != 'mirroir' && from_list != 'mirroir' && from_list != dest_list )
					{
						var bac = [];
						var possible = true;
						angular.forEach( $scope[ String( from_list ) ], function ( vv, key ) {
							if ( possible )
							{
								if ( ! $scope.testCombinaison( vv, bac ) )
								{
									possible = false;
								} else
								{
									bac.push( vv );
								}
							}
						} );
						if ( ! possible )
						{
							$scope.mirroir = $scope.mirroir.concat( angular.copy( $scope[ String( from_list ) ] ) );
							$scope[ String( from_list ) ] = [];
						}
					}

					$scope.getResult();
				},

				// UPDATE SORTABLE ---
				update: function ( event, ui ) {
					if ( ! ui.item.sortable.received )
					{
						var from_list = ui.item.sortable.source[ 0 ].attributes[ 'ng-model' ].nodeValue;
						var dest_list = ui.item.sortable.droptarget[ 0 ].attributes[ 'ng-model' ].nodeValue;
						if ( dest_list !== 'mirroir' )
						{
							//ui.item.sortable.source[0].attributes[ 'ng-model' ].nodeValue==='mirroir'
							var originNgModel = ui.item.sortable.sourceModel;
							var itemModel = originNgModel[ ui.item.sortable.index ];

							var deja = _.indexOf( $scope[ String( dest_list ) ], itemModel );
							if ( ! $scope.testLoop( ui.item.sortable.dropindex, $scope[ String( dest_list ) ], angular.copy( itemModel ), deja ) )
							{
								ui.item.sortable.cancel();
							}


						}
					}
				}
			};

			$scope.testLoop = function ( idx, dest, card, deja ) {

				var possible = true;
				if ( dest.length > 0 )
				{
					// On fait une copie de travail du tableau
					var tab = angular.copy( dest );

					if ( deja !== - 1 )
						tab.splice( deja, 1 );

					// On inject le possible element au bon index
					tab.splice( idx, 0, card );
					var bac = [];
					angular.forEach( tab, function ( vv, key ) {
						if ( possible )
						{
							if ( ! $scope.testCombinaison( vv, bac ) )
							{
								possible = false;
							} else
							{
								bac.push( vv );
							}
						}
					} );
				}
				return possible;
			};

			$scope.testCombinaison = function ( card, bac ) {
				var possible = true;
				if ( bac.length > 0 )
				{
					var c = bac[ bac.length - 1 ];
					if ( _.indexOf( c.combinaison, card.type ) !== - 1 && bac.length < 3 )
					{
						if ( bac.length == 1 && String( c.type ).substr( 0, 1 ) == 't' && String( card.type ).substr( 0, 1 ) !== 't' )
						{
							possible = false;
						} else if ( bac.length == 2 && c.type != card.type )
						{
							possible = false;
						} else if ( bac.length == 2 && c.type == card.type && bac[ 0 ].type != card.type )
						{
							possible = false;
						} else if ( bac.length == 2 && card.rendement.length <= 2 )
						{
							possible = false;
						}
					} else
					{
						possible = false;
					}
				}
				return possible;
			};

			$scope.getResult = function ( source ) {
				var i;
				$scope.new_result = [];
				for ( i = 0; i < 6; i ++ )
				{
					$scope[ 'ResS' + (i + 1) ] = $scope.getCombinaisonResult( $scope[ 'tabS' + (i + 1) ] );
					_c( 'ResS' + (i + 1) + ">>" );
					_c( $scope[ 'ResS' + (i + 1) ] );
					_c( "-----" );
					if ( $scope[ 'ResS' + (i + 1) ].hasOwnProperty( 'type' ) )
					{
						$scope.new_result.push( $scope[ 'ResS' + (i + 1) ] );
					}
				}
			};
			$scope.getCombinaisonResult = function ( source ) {
				var o = {};
				angular.forEach( source, function ( card ) {
					if ( source.length == 1 )
					{
						o = angular.copy( card );
					} else if ( source.length == 2 )
					{
						var last = angular.copy( o );
						o = angular.copy( card );
						o.combined = [ angular.copy( last ) ];
						if ( last.type == o.type )
						{
							o.level_rendement ++;
						} else
						{
							o.auto_alimentation = true;
						}
					} else if ( source.length == 3 )
					{
						var last = angular.copy( o );
						o = angular.copy( card );
						o.combined = [ angular.copy( last ) ];
						if ( last.type == o.type )
						{
							o.level_rendement += 2;
						}
					}
				} );
				return o;
			};

			$scope.valideSel = function () {
				if ( $scope.mirroir.length == 0 && $scope.new_result.length > 0 )
				{
					_c( 'newresult>>' );
					_c( $scope.new_result );
					_c( "-----" );
					$scope.cp.machines_reparees = angular.copy( $scope.new_result );
					$uibModalInstance.close();
				} else
				{
					toastr.info( "You must use all your repaired machines !" )
				}

			};
			$scope.annuleSel = function () {
				$scope.mirroir = angular.copy( $scope.cp.machines_reparees );
				$scope.reset();
			};

			$scope.ok = function () {
				$uibModalInstance.close( $scope.selected.item );
			};

			$scope.cancel = function () {
				$uibModalInstance.dismiss( 'cancel' );
			};
		}
	);

angular
	.module( 'imaginarium' )
	.controller( 'ModalEchangeCtrl', function ( $scope, $q, $uibModalInstance, Obj, Board, DataBoard, toastr ) {

			$scope.Obj = Obj;
			$scope.Board = Board;
			$scope.cp = Board.get_current_player();
			$scope.tour = 1;
			$scope.limite = 3;

			$scope.copy_ressources = angular.copy( $scope.cp.ressources );
			$scope.copy_mirroir = angular.copy( $scope.cp.ressources );

			$scope.make_echange = function ( v ) {

				// 1 - 1 Charbonium/{{cp.ressources.charbonium}} > Pour 1 Bois
				// 2 - 2 Charboniums/{{cp.ressources.charbonium}} > Pour 1 Cuivre
				// 3 - 3 Charboniums/{{cp.ressources.charbonium}} > Pour 1 Cristal
				// 4 - 5 Charboniums/{{cp.ressources.charbonium}} > Pour 1 PV
				// 5 - 1 Bois/{{cp.ressources.bois}} > Pour 1 Charbonium
				// 6 - 1 Cuivre/{{cp.ressources.cuivre}} > Pour 2 Charboniums
				// 7 - 1 Cristal/{{cp.ressources.cristal}} > Pour 3 Charboniums

				if ( v === 1 )
				{
					$scope.copy_mirroir.charbonium --;
					$scope.copy_mirroir.bois ++;
				} else if ( v === 2 )
				{
					$scope.copy_mirroir.charbonium -= 2;
					$scope.copy_mirroir.cuivre ++;

				} else if ( v === 3 )
				{
					$scope.copy_mirroir.charbonium -= 3;
					$scope.copy_mirroir.cristal ++;

				} else if ( v === 4 )
				{
					$scope.copy_mirroir.charbonium -= 5;
					$scope.copy_mirroir.pv ++;

				} else if ( v === 5 )
				{
					$scope.copy_mirroir.bois --;
					$scope.copy_mirroir.charbonium ++;

				} else if ( v === 6 )
				{
					$scope.copy_mirroir.cuivre --;
					$scope.copy_mirroir.charbonium += 2;
				} else if ( v === 7 )
				{
					$scope.copy_mirroir.cristal --;
					$scope.copy_mirroir.charbonium += 3;
				}

				if ( $scope.tour > $scope.limite - 1 )
				{
					$scope.termine_echange();
				} else
				{
					$scope.tour ++;
				}

			};

			$scope.termine_echange = function () {
				$uibModalInstance.close(
					[
						$scope.cp.addRessourcesSpec( "charbonium", $scope.copy_mirroir.charbonium - $scope.copy_ressources.charbonium ),
						$scope.cp.addRessourcesSpec( "bois", $scope.copy_mirroir.bois - $scope.copy_ressources.bois ),
						$scope.cp.addRessourcesSpec( "cuivre", $scope.copy_mirroir.cuivre - $scope.copy_ressources.cuivre ),
						$scope.cp.addRessourcesSpec( "cristal", $scope.copy_mirroir.cristal - $scope.copy_ressources.cristal ),
						$scope.cp.addRessourcesSpec( "pv", $scope.copy_mirroir.pv - $scope.copy_ressources.pv )
					]
				);

			};

			$scope.cancel = function () {
				$scope.cp.ressources = angular.copy( $scope.copy_ressources );
				$uibModalInstance.dismiss( 'cancel' );
			};
		}
	);
angular
	.module( 'imaginarium' )
	.controller( 'ModalBonusCtrl', function ( $scope, $q, $uibModalInstance, Obj, Board, DataBoard, toastr ) {

			$scope.Obj = Obj;
			$scope.Board = Board;
			$scope.cp = Board.get_current_player();

			$scope.copy_ressources = angular.copy( $scope.cp.ressources );
			var val_joker_final = parseInt( $scope.cp.ressources.joker );
			var liste_add = [];
			$scope.get_bonus = function ( v ) {

				// 1 - Bois
				// 2 - Cuivre
				// 3 - Cristal

				if ( v === 1 )
				{
					//$scope.cp.addRessourcesSpec( "bois", 1 );
					liste_add.push( { type: "bois", qt: 1 } )
				} else if ( v === 2 )
				{
					//$scope.cp.addRessourcesSpec( "cuivre", 1 );
					liste_add.push( { type: "cuivre", qt: 1 } )

				} else if ( v === 3 )
				{
					//$scope.cp.addRessourcesSpec( "cristal", 1 );
					liste_add.push( { type: "cristal", qt: 1 } )
				}

				//$scope.cp.addRessourcesSpec( "joker", - 1 );
				val_joker_final --;

				if ( val_joker_final <= 0 )
					$scope.termine_bonus();
			};

			$scope.termine_bonus = function () {
				var promesses = [];
				angular.forEach( liste_add, function ( value, key ) {
					promesses.push( $scope.cp.addRessourcesSpec( value.type, value.qt ) );
				} );
				$q.all( promesses ).then( function () {
					$scope.cp.addRessourcesSpec( "joker", - parseInt( $scope.cp.ressources.joker ) ).then( function () {
						$uibModalInstance.close();
					} );
				} )
			};

			$scope.cancel = function () {
				$scope.cp.ressources = angular.copy( $scope.copy_ressources );
				//$uibModalInstance.dismiss( 'cancel' );
			};
		}
	);

angular
	.module( 'imaginarium' )
	.controller( 'ModalCardDetailCtrl', function ( $scope, $q, $uibModalInstance, Obj, Board, DataBoard, toastr ) {

		$scope.Obj = Obj;
	} );

angular
	.module( 'imaginarium' )
	.controller( 'ModalDemandeCtrl', function ( $scope, $q, $uibModalInstance, Obj, Board, DataBoard, toastr ) {

			$scope.Obj = Obj;
			$scope.Board = Board;
			$scope.cp = Board.get_current_player();
			$scope.cible = $scope.Obj.type == "t1" ? 'Charbonium' : $scope.Obj.type == "t2" ? 'Copper' : $scope.Obj.type == "t3" ? 'Crystal' : 'Charbonium';
			$scope.rendement = $scope.Obj.card.rendement[ $scope.Obj.card.level_rendement ];
			$scope.nb_choice = $scope.Obj.type == "t4" ? 2 : 1;

			$scope.count_bois = 0;
			$scope.count_cuivre = 0;
			$scope.count_cristal = 0;
			$scope.erreur = "";

			$scope.copy_ressources = angular.copy( $scope.cp.ressources );

			$scope.zero = function ( v ) {
				$scope.erreur = "";
				if ( v === 1 )
				{
					$scope.count_bois = 0;
				} else if ( v === 2 )
				{
					$scope.count_cuivre = 0;
				} else if ( v === 3 )
				{
					$scope.count_cristal = 0;
				}
			};
			$scope.plus = function ( v ) {
				$scope.erreur = "";
				if ( $scope.count_bois + $scope.count_cuivre + $scope.count_cristal < $scope.nb_choice )
				{
					if ( v === 1 )
					{
						if ( $scope.count_bois < $scope.cp.ressources.bois ) $scope.count_bois ++;
					} else if ( v === 2 )
					{
						if ( $scope.count_cuivre < $scope.cp.ressources.cuivre ) $scope.count_cuivre ++;
					} else if ( v === 3 )
					{
						if ( $scope.count_cristal < $scope.cp.ressources.cristal ) $scope.count_cristal ++;
					}
				}
			};
			$scope.moins = function ( v ) {
				$scope.erreur = "";
				if ( v === 1 )
				{
					if ( $scope.count_bois > 0 ) $scope.count_bois --;
				} else if ( v === 2 )
				{
					if ( $scope.count_cuivre > 0 ) $scope.count_cuivre --;
				} else if ( v === 3 )
				{
					if ( $scope.count_cristal > 0 ) $scope.count_cristal --;
				}
			};
			$scope.valide = function () {

				if ( $scope.count_bois + $scope.count_cuivre + $scope.count_cristal != $scope.nb_choice )
				{
					$scope.erreur = "Thank you to complete your selection !"
				} else
				{
					$q.all( [
						$scope.cp.addRessourcesSpec( "bois", - $scope.count_bois ),
						$scope.cp.addRessourcesSpec( "cuivre", - $scope.count_cuivre ),
						$scope.cp.addRessourcesSpec( "cristal", - $scope.count_cristal ),
						// $scope.cp.addRessources( DataBoard.data.type_card[ Obj.type ] )
						$scope.cp.addRessources( $scope.Obj.card )
					] ).then( function () {
						$uibModalInstance.close();
						$scope.Obj.p.resolve( "request ok" );
					} );
				}
			};
			$scope.cancel = function () {
				$scope.cp.ressources = angular.copy( $scope.copy_ressources );
				$uibModalInstance.close();
				$scope.Obj.p.resolve( "request ok" );
			};
		}
	);


angular
	.module( 'imaginarium' )
	.controller( 'ModalVictoryCtrl', function ( $scope, $q, $uibModalInstance, Obj, Board, DataBoard, toastr ) {

			$scope.Obj = Obj;

			$scope.restart = function () {
				$uibModalInstance.close();
			};
		}
	);

angular
	.module( 'imaginarium' )
	.directive( 'animateOnChange', function ( $animate, $timeout ) {
		return function ( scope, elem, attr ) {
			scope.$watch( attr.animateOnChange, function ( nv, ov ) {
				if ( nv != ov )
				{
					var c = (nv != ov && nv != '') ? 'animated fadeInUp' : '';
					$animate.addClass( elem, c ).then( function () {
						$timeout( function () {
							$animate.removeClass( elem, c )
						} );
					} );
				}
			} )
		}
	} )
	.directive( 'animateOnAdd', function ( $animate, $timeout ) {
		return function ( scope, elem, attr ) {
			scope.$watch( attr.animateOnAdd, function ( nv, ov ) {
				if ( nv != ov )
				{
					var c = (nv != ov && nv != '') ? 'animated speed03 ' + (String( nv ).substr( 0, 1 ) === '+' ? 'fadeInLeft badge-success' : 'fadeInRight badge-error') : '';
					$animate.addClass( elem, c ).then( function () {
						$timeout( function () {
							$animate.removeClass( elem, c )
						} );
					} );
				}
			} )
		}
	} );