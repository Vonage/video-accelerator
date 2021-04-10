import { VideoAccelerator } from '../../core';
import { StreamType } from '../../enums';
import { TextChatSender } from './textChatSender';

export class TextChatOptions {
  constructor(
    public session: OT.Session,
    public controlsContainer: string | HTMLElement,
    public appendControl: boolean,
    public streamContainers: (
      pubSub: 'publisher' | 'subscriber',
      type: StreamType,
      data?: unknown,
      streamId?: string
    ) => string | Element,
    public sender: TextChatSender,
    public textChatContainer?: string | HTMLElement,
    public waitingMessage: string = 'Messages will be delivered once your contact arrives',
    public limitCharacterMessage: number = 160,
    public videoAccelerator?: VideoAccelerator,
    public alwaysOpen?: boolean
  ) {}
}
