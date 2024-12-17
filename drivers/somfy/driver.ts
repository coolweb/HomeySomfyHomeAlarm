import Homey from 'homey';
import { PairSession } from 'homey/lib/Driver';
import { SomfyApi } from '../../api/somfy.api';

module.exports = class MyDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPair(session: PairSession) {
    let username = "";
    let password = "";
    let somfyApi = new SomfyApi();

    session.setHandler("login", async (data) => {
      username = data.username;
      password = data.password;

      try {
        await somfyApi.login(username, password);
        return true;
      }
      catch (e) {
        throw e;
      }
    });

    session.setHandler("list_devices", async () => {
      const homeAlarm = await somfyApi.retrieveHomeAlarm();

      return {
        name: homeAlarm.name,
        data: {
          id: homeAlarm.siteId,
        },
        settings: {
          // Store username & password in settings
          // so the user can change them later
          username,
          password,
        },
      };
    });
  }

};
