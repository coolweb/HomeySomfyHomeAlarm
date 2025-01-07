import Homey from 'homey';
import { SomfyApi } from '../../api/somfy.api';

module.exports = class MyDevice extends Homey.Device {

  private interval: NodeJS.Timer | undefined = undefined;
  private somfyApi: SomfyApi = new SomfyApi();
  private HOME_ALARM_STATE_CAPABILITY = 'homealarm_state';

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

    this.registerCapabilityListener(this.HOME_ALARM_STATE_CAPABILITY, async (value) => {
      await this.onAlarmStateChanged(value);
    });
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

    const settings = await this.getSettings()
    let username = settings['username'];
    let password = settings['password'];
    var mustLogin = false;

    if (changedKeys.find(k => k == 'username')) {
      username = newSettings['username'];
      mustLogin = true;
    }

    if (changedKeys.find(k => k == 'password')) {
      password = newSettings['password'];
      mustLogin = true;
    }

    if (mustLogin) {
      console.log('Device - user and/or password changed, try to login');
      await this.somfyApi.login(username, password);

      // check the site id
      var alarm = await this.somfyApi.retrieveHomeAlarm();
      if (alarm.siteId != this.getDeviceId()) {
        console.log(`Device - The site id is not the same actual id: ${this.getDeviceId}, new id: ${alarm.siteId}`);
        throw new Error('The site id is not the same as the previous one, to do this remove the alarm and add it again');
      }
    }
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
    this.clearSyncInterval();


    // scheduled & keep track
    this.interval = this.homey.setInterval(this.sync.bind(this), 60000);
  }

  /**
   * Perform the synchronisation of the data towards Homey.
   */
  async sync() {
    console.log("running synchronisation");
    var alarmData = await this.somfyApi.retrieveHomeAlarm();
    this.setAlarmState(alarmData.securityLevel);
  }

  private clearSyncInterval() {
    if (this.interval) {
      console.log("Removing the existing interval")
      this.homey.clearTimeout(this.interval)
    }
  }

  private setAlarmState(state: String) {
    switch (state) {
      case 'armed':
        this.setCapabilityValue(this.HOME_ALARM_STATE_CAPABILITY, 'armed');
        break;

      case 'disarmed':
        this.setCapabilityValue(this.HOME_ALARM_STATE_CAPABILITY, 'disarmed');
        break;

      case 'partial':
        this.setCapabilityValue(this.HOME_ALARM_STATE_CAPABILITY, 'partially_armed');
        break;

      default:
        break;
    }
  }

  private getDeviceId(): String {
    return this.getData().id;
  }

  private async onAlarmStateChanged(state: String) {
    // prevent sync while changing state on somfy server
    this.clearSyncInterval();

    var somfyAlarmState = state == 'partially_armed' ? 'partial' : state;

    await this.somfyApi.updateAlarmState(this.getDeviceId(), somfyAlarmState);
    // reenable the sync
    this.schedule();
  }

};
