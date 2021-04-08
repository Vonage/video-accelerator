import { StreamType } from '../enums';
import { AcceleratorCommunicationOptions } from './acceleratorCommunicationOptions';
import { Credential } from './credential';
import { TextChatOptions } from './text-chat';

export class AcceleratorOptions {
  constructor(
    public credentials: Credential,
    public controlsContainer?: string | Element,
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
    public communication?: AcceleratorCommunicationOptions,
    public textChat?: TextChatOptions 
    // public screenSharing?: CoreScreenSharingOptions
  ) {}
}
