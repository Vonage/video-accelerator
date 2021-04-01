import { VideoAccelerator } from '../core';

export default class ScreenSharingAccelerator {
  private videoAccelerator?: VideoAccelerator;
  private session: OT.Session;
}
