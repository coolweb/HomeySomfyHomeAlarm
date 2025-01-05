'use strict';

import Homey from 'homey';

module.exports = class MyApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('MyApp has been initialized');

    // Start debuger
    if (process.env.DEBUG === '1'){
      try{ 
        require('inspector').waitForDebugger();
      }
      catch(error){
        require('inspector').open(9225, '0.0.0.0', true);
      }
  }
  }

}
