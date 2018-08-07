(function() {
  'use strict';

  angular
    .module('imaginarium')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
