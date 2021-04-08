import { VideoAccelerator } from '../../core';

export class ScreenSharingOptions {
  constructor(
    public session: OT.Session,
    public screenSharingContainer:
      | string
      | HTMLElement = document.getElementById('videoHolderSharedScreen'),
    public parent: string = '#videoContainer',
    public controlsContainer: string = '#accVideoControls',
    public appendControls: boolean = true,
    public useAnnotation: boolean = false,
    public useExternalWindow: boolean = false,
    public screenProperties?: unknown,
    public videoAccelerator?: VideoAccelerator
  ) {}
}

export const defaultScreenShareOptions: ScreenSharingOptions = {
  screenSharingContainer: document.getElementById('videoHolderSharedScreen'),
  parent: '#videoContainer',
  controlsContainer: '#accVideoControls',
  appendControls: true,
  useAnnotation: false,
  useExternalWindow: false,
  session: undefined
};
