import { VideoAccelerator } from '../core';
import { AcceleratorCommunicationOptions } from './acceleratorCommunicationOptions';
import { StreamType } from './streamCollectionSummary';

export class CommunicationOptions {
  constructor(
    public videoAccelerator: VideoAccelerator,
    public session: OT.Session,
    public appendControl: boolean,
    public controlsContainer: string,
    public coreCommunicationOptions?: AcceleratorCommunicationOptions,
    public streamContainers?: (
      pubSub: 'publisher' | 'subscriber',
      type: StreamType,
      data?: unknown,
      streamId?: string
    ) => string | Element
  ) {}
}
