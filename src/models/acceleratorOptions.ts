import { StreamType } from '../enums';
import { AcceleratorCommunicationOptions } from './acceleratorCommunicationOptions';
import { Credential } from './credential';

export class AcceleratorOptions {
  constructor(
    public credentials: Credential,
    public controlsContainer?: string | Element,
    public packages?: [string],
    public streamContainers?: (
      pubSub: 'publisher' | 'subscriber',
      type: StreamType,
      data?: unknown,
      streamId?: string
    ) => string | Element,
    public largeScale: boolean = false,
    public applicationName?: string,
    // public annotation?: CoreAnnotationOptions,
    // public archiving?: CoreArchivingOptions,
    public communication?: AcceleratorCommunicationOptions // public textChat?: CoreTextChatOptions, // public screenSharing?: CoreScreenSharingOptions
  ) {}
}
