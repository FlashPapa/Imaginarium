// (function () {
// 	'use strict';
//
// 	angular
// 		.module( 'imaginarium' )
// 		.controller( 'MainController', MainController );
//
// 	/** @ngInject */
// 	function MainController( $timeout, toastr, $http, $sce )
// 	{
//
// 	}
// })();

var _c = function ( v ) {
	console.log( v );
};


angular
	.module( 'imaginarium' )
	.controller( 'MainController', function MainController( $timeout, toastr, $http, $sce, Board, DataBoard, PlayersManager) {

		var vm = this;

		vm.Board = Board;
		vm.DataBoard = DataBoard;
		vm.PlayersManager = PlayersManager;

		vm.minus = function ( c, min, max ) {
			if ( vm.DataBoard.data[ c ] > min )
				vm.DataBoard.data[ c ] --;
		};

		vm.plus = function ( c, min, max ) {
			if ( vm.DataBoard.data[ c ] < max )
				vm.DataBoard.data[ c ] ++;
		};

		vm.doCancel = function () {
			vm.DataBoard.data.nb_player = 3;
			vm.DataBoard.data.pv_victory = 15;
		};

		vm.doCconfirm = function () {
			vm.DataBoard.game_is_ready = true;
			//
			vm.Board.init();
		};

		//vm.doCconfirm();

	} );


