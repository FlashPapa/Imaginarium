angular
	.module( 'imaginarium' )
	.factory( 'DataBoard', function ( $timeout, toastr, $http, $sce ) {
		var databoard = {
			game_is_ready: false,
			being_processed: false,
			advert: '',
			current_phase: 1,
			current_player: 1,
			current_tour: 0,
			current_action: [],
			next_order: [],
			type_ressource: [ "charbonium", "bois", "cuivre", "cristal", "pv", "joker" ],
			data: {
				nb_player: 3,
				pv_victory: 10,
				ressources: {
					charbonium: 70,
					bois: 40,
					cuivre: 40,
					cristal: 40
				},
				ressources_start_player: {
					charbonium: 3,
					bois: 1,
					cuivre: 1,
					cristal: 1
				},
				donne_start: {
					"p1": 8 * 2,
					"p2": 7 * 2,
					"p3": 6 * 2,
					"p4": 4 * 2,
					"p5": 2 * 2,
					"p6": 2 * 2,
					"t1": 3 * 2,
					"t2": 3 * 2,
					"t3": 3 * 2,
					"t4": 3 * 2,
					"s1": 0,//1,
					"s2": 0,//3,
					"a1": 0,//2,
					"a2": 0,//2,
					"a3": 0,//2,
					"a4": 0,//2,
					"a5": 0,//1,
					"a6": 0,//1,
					"d1": 0,//2,
					"d2": 0,//2,
					"d3": 0,//2
				},
				good_donne_start: {
					"p1": 8,
					"p2": 7,
					"p3": 6,
					"p4": 4,
					"p5": 2,
					"p6": 2,
					"t1": 3,
					"t2": 3,
					"t3": 3,
					"t4": 3,
					"s1": 1,
					"s2": 3,
					"a1": 2,
					"a2": 2,
					"a3": 2,
					"a4": 2,
					"a5": 1,
					"a6": 1,
					"d1": 2,
					"d2": 2,
					"d3": 2
				},
				type_card: {
					"p1": {
						type: "p1",
						name: 'La Charbonneuse',
						niveau: 1,
						cout_reparation: { charbonium: 0, bois: 2, cuivre: 0, cristal: 0, joker: 0, pv: 0 },
						production: { charbonium: 1, bois: 0, cuivre: 0, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1, 3, 7 ],
						combined: [],
						auto_alimentation: false,
						combinaison: [ "p1" ]
					},
					"p2": {
						type: "p2",
						name: 'La Menuisette',
						niveau: 1,
						cout_reparation: { bois: 0, cuivre: 2, cristal: 0, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 1, cuivre: 0, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1, 3, 5 ],
						combined: [],
						auto_alimentation: false,
						combinaison: [ "p2", "t1", "t2", "t3" ]
					},
					"p3": {
						type: "p3",
						name: 'La Coperette',
						niveau: 2,
						cout_reparation: { bois: 2, cuivre: 0, cristal: 1, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 0, cuivre: 1, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1, 3, 5 ],
						combined: [],
						auto_alimentation: false,
						combinaison: [ "p3", "t1", "t3" ]
					},
					"p4": {
						type: "p4",
						name: 'La Rotativette',
						niveau: 2,
						cout_reparation: { bois: 2, cuivre: 2, cristal: 0, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 0, cuivre: 0, cristal: 1, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1, 3, 5 ],
						combined: [],
						auto_alimentation: false,
						combinaison: [ "p4", "t1", "t2" ]
					},
					"p5": {
						type: "p5",
						name: 'La Productivette',
						niveau: 2,
						cout_reparation: { bois: 0, cuivre: 0, cristal: 3, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 1, cuivre: 1, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1 ],
						combined: [],
						auto_alimentation: false,
						combinaison: [ "t4" ]
					},
					"p6": {
						type: "p6",
						name: 'La Flamelleur',
						niveau: 3,
						cout_reparation: { bois: 0, cuivre: 2, cristal: 2, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 0, cuivre: 0, cristal: 0, joker: 1, pv: 0 },
						level_rendement: 0,
						rendement: [ 1, 3 ],
						combined: [],
						auto_alimentation: false,
						combinaison: [ "p6", "t1" ]
					},
					//-------
					"t1": {
						type: "t1",
						name: 'Le Combustoir',
						niveau: 1,
						cout_reparation: { bois: 0, cuivre: 1, cristal: 1, joker: 0, pv: 0 },
						production: { charbonium: 1, bois: 0, cuivre: 0, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 3, 5 ],
						combined: [],
						auto_alimentation: false,
						combinaison: [ "t1", "p2", "p3", "p4", "p6" ]
					},
					"t2": {
						type: "t2",
						name: 'Le Transmutoir',
						niveau: 1,
						cout_reparation: { bois: 1, cuivre: 0, cristal: 1, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 0, cuivre: 1, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1, 3 ],
						combined: [],
						auto_alimentation: false,
						combinaison: [ "t2", "p2", "p4" ]
					},
					"t3": {
						type: "t3",
						name: 'Le Surtransmutoir',
						niveau: 2,
						cout_reparation: { bois: 1, cuivre: 2, cristal: 0, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 0, cuivre: 0, cristal: 1, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1, 3 ],
						combined: [],
						auto_alimentation: false,
						combinaison: [ "t3", "p2", "p3" ]
					},
					"t4": {
						type: "t4",
						name: 'Le Surcombustoir',
						niveau: 2,
						cout_reparation: { bois: 1, cuivre: 1, cristal: 1, joker: 0, pv: 0 },
						production: { charbonium: 1, bois: 0, cuivre: 0, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 6, 9, 12 ],
						combined: [],
						auto_alimentation: false,
						combinaison: [ "t4", "p5" ]
					},
					//-------
					"a1": {
						type: "a1",
						name: 'La Larcinette',
						niveau: 1,
						cout_reparation: { bois: 1, cuivre: 0, cristal: 1, joker: 0, pv: 0 },
						production: { charbonium: 3, bois: 0, cuivre: 0, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1 ],
						combined: [],
						auto_alimentation: false,
						combinaison: []
					},
					"a2": {
						type: "a2",
						name: 'La Sylvisiteuse',
						niveau: 1,
						cout_reparation: { bois: 0, cuivre: 1, cristal: 1, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 3, cuivre: 0, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1 ],
						combined: [],
						auto_alimentation: false,
						combinaison: []
					},
					"a3": {
						type: "a3",
						name: 'La Copobrigandeuse',
						niveau: 1,
						cout_reparation: { bois: 1, cuivre: 0, cristal: 2, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 0, cuivre: 2, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1 ],
						combined: [],
						auto_alimentation: false,
						combinaison: []
					},
					"a4": {
						type: "a4",
						name: 'La Cristarnaqueuse',
						niveau: 1,
						cout_reparation: { bois: 1, cuivre: 3, cristal: 0, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 0, cuivre: 0, cristal: 2, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1 ],
						combined: [],
						auto_alimentation: false,
						combinaison: []
					},
					"a5": {
						type: "a5",
						name: 'La Neuralisatrice',
						niveau: 2,
						cout_reparation: { bois: 0, cuivre: 2, cristal: 2, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 0, cuivre: 0, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1 ],
						combined: [],
						auto_alimentation: false,
						combinaison: []
					},
					"a6": {
						type: "a6",
						name: 'L’Embrouillette',
						niveau: 3,
						cout_reparation: { bois: 0, cuivre: 1, cristal: 3, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 0, cuivre: 0, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1 ],
						combined: [],
						auto_alimentation: false,
						combinaison: []
					},
					//-------
					"d1": {
						type: "d1",
						name: 'La Verrouillette',
						niveau: 1,
						cout_reparation: { bois: 1, cuivre: 1, cristal: 0, joker: 0, pv: 0 },
						production: { charbonium: 1, bois: 0, cuivre: 0, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1 ],
						combined: [],
						auto_alimentation: false,
						combinaison: []
					},
					"d2": {
						type: "d2",
						name: 'Le Cadenassoir',
						niveau: 2,
						cout_reparation: { bois: 3, cuivre: 1, cristal: 0, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 1, cuivre: 1, cristal: 1, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1 ],
						combined: [],
						auto_alimentation: false,
						combinaison: []
					},
					"d3": {
						type: "d3",
						name: 'Le Breveteur',
						niveau: 3,
						cout_reparation: { bois: 1, cuivre: 1, cristal: 2, joker: 0, pv: 0 },
						production: { charbonium: 1, bois: 1, cuivre: 1, cristal: 1, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1 ],
						combined: [],
						auto_alimentation: false,
						combinaison: []
					},
					//-------
					"s1": {
						type: "s1",
						name: 'La Recyclatrice',
						niveau: 3,
						cout_reparation: { bois: 1, cuivre: 1, cristal: 2, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 0, cuivre: 0, cristal: 0, joker: 0, pv: 0 },
						level_rendement: 0,
						rendement: [ 1 ],
						combined: [],
						auto_alimentation: false,
						combinaison: []
					},
					"s2": {
						type: "s2",
						name: 'La Diplomatrice',
						niveau: 3,
						cout_reparation: { bois: 1, cuivre: 1, cristal: 2, joker: 0, pv: 0 },
						production: { charbonium: 0, bois: 0, cuivre: 0, cristal: 0, joker: 0, pv: 1 },
						level_rendement: 0,
						rendement: [ 1, 3 ],
						combined: [],
						auto_alimentation: false,
						combinaison: [ "s2" ]
					},
				},
				//
				cout_tapis: [ 4, 3, 3, 2, 2, 1, 1 ],
				taille_mine: 3,
				taille_tapis: 7,
				taille_assistant: 3,
				taille_projet: 6,
				//
				nb_projet: 14,
				nb_assistant: 13
			},
			donne: [],
			donne_assistant: [],
			donne_projet: [],
			//
			tapis: [],
			assistant_dispo: [],
			projets_dispo: [],
			mines_dispo: [],
			reset: function () {
				this.being_processed = false;
				this.advert = '';
				this.current_phase = 1;
				this.current_player = 1;
				this.current_tour = 0;
				this.current_action = [];
				this.next_order = [];
				this.donne = [];
				this.donne_assistant = [];
				this.donne_projet = [];
				this.tapis = [];
				this.assistant_dispo = [];
				this.projets_dispo = [];
				this.mines_dispo = [];
			}
		};
		return databoard;
	} );