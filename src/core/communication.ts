import {
  AcceleratorError,
  PubSubDetail,
  StreamCollection,
  StreamEvent,
  StreamType,
  CommunicationOptions
} from '../models';
import { AcceleratorEvents, SessionEvents } from '../enums';
import { VideoAccelerator } from '.';
import { SDKWrapper } from './sdkWrapper';
import { defaultCallProperties } from '../constants';
import { dom, properCase } from '../util';
import { log } from '../log';

/**
 *
 */
export class Communication {
  private active = false;
  private videoAccelerator: VideoAccelerator;
  private VideoSDK: SDKWrapper;
  private streamContainers: (
    pubSub: 'publisher' | 'subscriber',
    type: StreamType,
    data?: unknown,
    streamId?: string
  ) => string | Element;
  private callProperties: OT.PublisherProperties;
  private screenProperties: OT.PublisherProperties;
  private subscribeOnly: boolean;
  private autoSubscribe: boolean;
  private connectionLimit?: number;

  constructor(options: CommunicationOptions, sdkWrapper: SDKWrapper) {
    this.VideoSDK = sdkWrapper;
    this.validateOptions(options);
    this.createEventListeners();
  }

  validateOptions = (options: CommunicationOptions): void => {
    const requiredOptions = ['videoAccelerator', 'session'];
    requiredOptions.forEach((option) => {
      if (!options[option]) {
        throw new AcceleratorError(
          `${option} is a required option.`,
          'invalidParameters'
        );
      }
    });

    this.videoAccelerator = options.videoAccelerator;
    this.streamContainers = options.streamContainers;
    this.connectionLimit = options.coreCommunicationOptions?.connectionLimit;
    this.autoSubscribe =
      (options.coreCommunicationOptions &&
        options.coreCommunicationOptions.autoSubscribe) ||
      true;
    this.subscribeOnly =
      (options.coreCommunicationOptions &&
        options.coreCommunicationOptions.subscribeOnly) ||
      false;

    this.callProperties = Object.assign(
      {},
      defaultCallProperties,
      options.coreCommunicationOptions?.callProperties
    );
    this.screenProperties = Object.assign(
      {},
      defaultCallProperties,
      { videoSource: 'window' },
      options.coreCommunicationOptions?.screenProperties
    );
  };

  /**
   * Trigger an event through the API layer
   * @param event The name of the event
   * @param data
   */
  triggerEvent = (event: string, data: unknown): void =>
    this.videoAccelerator.triggerEvent(event, data);

  /**
   * Determine whether or not the party is able to join the call based on
   * the specified connection limit, if any.
   */
  ableToJoin = (): boolean => {
    if (!this.connectionLimit) {
      return true;
    }
    // Not using the session here since we're concerned with number of active publishers
    const connections = Object.values(this.VideoSDK.getStreams()).filter(
      (s) => s.videoType === StreamType.Camera
    );
    return connections.length < this.connectionLimit;
  };

  /**
   * Publish the local camera stream and update state
   * @param publisherProperties Properties of the published stream
   */
  publish = async (
    publisherProperties: OT.PublisherProperties
  ): Promise<OT.Publisher | undefined> => {
    /**
     * For subscriber tokens or cases where we just don't want to be seen or heard.
     */
    if (this.subscribeOnly) {
      log(
        'Instance is configured with subscribeOnly set to true. Cannot publish to session'
      );
      return undefined;
    }

    try {
      const props = Object.assign({}, this.callProperties, publisherProperties);
      const container = dom.element(
        this.streamContainers('publisher', StreamType.Camera)
      );
      const publisher = await this.VideoSDK.publish(
        container as HTMLElement,
        props
      );
      this.VideoSDK.addPublisher(StreamType.Camera, publisher);
      return publisher;
    } catch (error) {
      const errorMessage =
        error.code === 1010 ? 'Check your network connection' : error.message;
      this.triggerEvent('error', errorMessage);
      return undefined;
    }
  };

  /**
   * Subscribe to a stream and update the state
   * @param stream An OpenTok stream object
   * @param subsriberOptions Specific options for this subscriber
   * @param networkTest Are we subscribing to our own publisher for a network test?
   */
  subscribe = async (
    stream: OT.Stream,
    subscriberProperties?: OT.SubscriberProperties,
    networkTest = false
  ): Promise<OT.Subscriber> => {
    const streamMap = this.VideoSDK.getStreamMap();

    // No videoType indicates SIP https://tokbox.com/developer/guides/sip/
    const type: StreamType = (stream.videoType as StreamType) || StreamType.SIP;

    if (streamMap[stream.streamId] && !networkTest) {
      // Are we already subscribing to the stream?
      return this.VideoSDK.getSubscriber(stream.streamId);
    } else {
      let connectionData: string | unknown;
      try {
        connectionData = JSON.parse(stream.connection.data || null);
      } catch (e) {
        connectionData = stream.connection.data;
      }

      const container = dom.element(
        this.streamContainers(
          'subscriber',
          type,
          connectionData,
          stream.streamId
        )
      );
      const options = Object.assign(
        {},
        type === StreamType.Camera || type === StreamType.SIP
          ? this.callProperties
          : this.screenProperties,
        subscriberProperties
      );

      try {
        const subscriber = await this.VideoSDK.subscribe(
          stream,
          container as HTMLElement,
          options
        );

        this.triggerEvent(
          `subscribeTo${properCase(type)}`,
          Object.assign({}, { subscriber }, this.VideoSDK.all())
        );

        return subscriber;
      } catch (error) {
        return Promise.reject(error);
      }
    }
  };

  /**
   * Unsubscribe from a stream and update the state
   * @param subscriber An OpenTok subscriber object
   */
  unsubscribe = async (subscriber: OT.Subscriber): Promise<void> => {
    await this.VideoSDK.unsubscribe(subscriber);
  };

  /**
   * Subscribe to new stream unless autoSubscribe is set to false
   * @param streamEvent An OpenTok event with a stream property
   */
  onStreamCreated = async (streamEvent: StreamEvent): Promise<void> => {
    this.active &&
      this.autoSubscribe &&
      streamEvent.stream &&
      (await this.subscribe(streamEvent.stream));
  };

  /**
   * Update state and trigger corresponding event(s) when stream is destroyed
   * @param streamEvent An OpenTok event with a stream property
   */
  onStreamDestroyed = (streamEvent: StreamEvent): void => {
    const type = (streamEvent.stream.videoType as StreamType) || StreamType.SIP;
    this.triggerEvent(
      `unsubscribeFrom${properCase(type)}`,
      this.VideoSDK.getPubSub()
    );
  };

  /**
   * Listen for API-level events
   */
  createEventListeners = (): void => {
    this.videoAccelerator.on(SessionEvents.StreamCreated, this.onStreamCreated);
    this.videoAccelerator.on(
      SessionEvents.StreamDestroyed,
      this.onStreamDestroyed
    );
  };

  /**
   * Start publishing the local camera feed and subscribing to streams in the session
   * @param publisherProperties Properties for this specific publisher
   */
  startCall = async (
    publisherProperties: OT.PublisherProperties
  ): Promise<PubSubDetail & { publisher: OT.Publisher }> => {
    this.active = true;
    const initialStreams = this.VideoSDK.getStreams();

    /**
     * Determine if we're able to join the session based on an existing connection limit
     */
    if (!this.ableToJoin()) {
      const errorMessage = 'Session has reached its connection limit';
      this.triggerEvent('error', errorMessage);
      return Promise.reject(
        new AcceleratorError(errorMessage, 'connectionLimit')
      );
    }

    let publisher;

    try {
      publisher = await this.publish(publisherProperties);

      /**
       * Subscribe to any streams that existed before we start the call from our side.
       */

      // Get an array of initial subscription promises
      const initialSubscriptions = (): Promise<OT.Subscriber | void>[] => {
        if (this.autoSubscribe) {
          return Object.values(initialStreams).map((stream) =>
            this.subscribe(stream)
          );
        }
        return [Promise.resolve()];
      };

      await Promise.all(initialSubscriptions());

      const pubSubData = Object.assign({}, this.VideoSDK.getPubSub(), {
        publisher
      });
      this.triggerEvent(AcceleratorEvents.JoinSession, pubSubData);
      return pubSubData;
    } catch (error) {
      log(`Failed to subscribe to all existing streams: ${error}`);
      // We do not reject here in case we still successfully publish to the session
      return Object.assign({}, this.VideoSDK.getPubSub(), { publisher });
    }
  };

  /**
   * Stop publishing and unsubscribe from all streams
   */
  endCall = async (): Promise<void> => {
    const { publishers, subscribers } = this.VideoSDK.getPubSub();

    const unpublish = (publisher) => this.VideoSDK.unpublish(publisher);

    Object.values(publishers.camera).forEach(unpublish);
    Object.values(publishers.screen).forEach(unpublish);

    const unsubscribeFromAll = (
      subscriberCollection: StreamCollection<OT.Subscriber>
    ) => {
      const subscribers = {
        ...subscriberCollection.camera,
        ...subscriberCollection.screen
      };
      return Object.values(subscribers).map((subscriber) =>
        this.unsubscribe(subscriber as OT.Subscriber)
      );
    };

    await Promise.all(unsubscribeFromAll(subscribers));

    this.active = false;
    this.triggerEvent(AcceleratorEvents.LeaveSession, null);
  };

  /**
   * Enable/disable local audio or video
   * @param id
   * @param source 'audio' or 'video'
   * @param enable Whether to device is enabled or not
   */
  enableLocalAV = (
    id: string,
    source: 'audio' | 'video',
    enable: boolean
  ): void => {
    const method = `publish${properCase(source)}`;
    const { publishers } = this.VideoSDK.getPubSub();

    const publisher = publishers.camera[id] || publishers.screen[id];
    publisher[method](enable);
  };

  /**
   * Enable/disable remote audio or video
   * @param subscriberId
   * @param source 'audio' or 'video'
   * @param enable
   */
  enableRemoteAV = (
    subscriberId: string,
    source: 'audio' | 'video',
    enable: boolean
  ): void => {
    const method = `subscribeTo${properCase(source)}`;
    const { subscribers } = this.VideoSDK.getPubSub();
    const subscriber =
      subscribers.camera[subscriberId] || subscribers.sip[subscriberId];
    subscriber[method](enable);
  };
}
