import Homey from 'homey';
import { SomfyApi } from '../../api/somfy.api';

module.exports = class MyDevice extends Homey.Device {

  private interval: NodeJS.Timer | undefined = undefined;
  private somfyApi: SomfyApi = new SomfyApi();

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('MyDevice has been initialized');

    // scheduling
    const settings = await this.getSettings()
    const username = settings['username'];
    const password = settings['password'];

    await this.somfyApi.login(username, password);
    this.schedule();
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({
    oldSettings,
    newSettings,
    changedKeys,
  }: {
    oldSettings: { [key: string]: boolean | string | number | undefined | null };
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log("MyDevice settings where changed");
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
  }

  schedule() {
    // cancel any existing timers if present
    if (this.interval) {
      console.log("Removing the existing interval")
      this.homey.clearTimeout(this.interval)
    }


    // scheduled & keep track
    this.interval = this.homey.setInterval(this.sync.bind(this), 10000);
  }

  /**
   * Perform the synchronisation of the data towards Homey.
   */
  async sync() {
    console.log("running synchronisation");
    await this.somfyApi.retrieveHomeAlarm();
  }

};
