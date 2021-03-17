import { SDKWrapper } from './sdkWrapper';
import {
  AcceleratorError,
  AcceleratorOptions,
  CommunicationOptions,
  Credential,
  PubSubDetail
} from './models';
import { log } from './log';
import { AcceleratorEvents, Packages, SessionEvents } from './enums';
import { Communication } from './communication';

export class VideoAccelerator {
  private VideoSDK: SDKWrapper;
  private eventListeners: Record<string, Set<(event: unknown) => void>>;
  private communication: Communication;

  constructor(private options: AcceleratorOptions) {
    this.VideoSDK = new SDKWrapper(
      this.options ? this.options.credentials : null,
      this.options.largeScale ? { connectionEventsSuppressed: true } : undefined
    );
    this.VideoSDK.setOptions(options);
  }

  connect = async (): Promise<void> => {
    try {
      await this.VideoSDK.connect();

      // Create internal event listeners
      this.createEventListeners();

      const session = this.getSession();

      this.initPackages();

      this.triggerEvent(AcceleratorEvents.Connected, session);
    } catch (err) {
      throw new AcceleratorError(err, 'Error connecting');
    }
  };

  /**
   * Disconnect from the session
   */
  disconnect = (): void => this.VideoSDK.disconnect();

  /**
   * Start publishing video and subscribing to streams
   * @param publisherProperties
   * @see https://tokbox.com/developer/sdks/js/reference/OT.html#initPublisher
   */
  join = async (
    publisherProperties: OT.PublisherProperties
  ): Promise<PubSubDetail & { publisher: OT.Publisher }> =>
    await this.communication.startCall(publisherProperties);

  /**
   * Stop all publishing un unsubscribe from all streams
   */
  leave = async (): Promise<void> => await this.communication.endCall();

  /**
   * Gets the current session
   */
  getSession = (): OT.Session => this.VideoSDK.getSession();

  /**
   * Gets the current credentials
   */
  getCredentials = (): Credential => this.VideoSDK.getCredentials();

  /**
   * Gets the current options
   */
  getOptions = (): AcceleratorOptions => this.VideoSDK.getOptions();

  /**
   * Force a remote connection to leave the session
   * @param connection
   */
  forceDisconnect = async (connection: OT.Connection): Promise<void> => {
    await this.VideoSDK.forceDisconnect(connection);
  };

  /**
   * Retrieve current state of session
   */
  state = (): unknown => this.VideoSDK.all();

  /**
   * Manually subscribe to a stream
   * @param stream An OpenTok stream
   * @param subscriberProperties
   * @param networkTest Subscribing to our own publisher as part of a network test?
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#subscribe
   */
  subscribe = async (
    stream: OT.Stream,
    subscriberProperties: OT.SubscriberProperties,
    networkTest = false
  ): Promise<OT.Subscriber> =>
    this.communication.subscribe(stream, subscriberProperties, networkTest);

  /**
   * Manually unsubscribe from a stream
   * @param subscriber An OpenTok subscriber object
   */
  unsubscribe = async (subscriber: OT.Subscriber): Promise<void> =>
    await this.communication.unsubscribe(subscriber);

  /**
   * Force the publisher of a stream to stop publishing the stream
   * @param stream An OpenTok stream object
   */
  forceUnpublish = async (stream: OT.Stream): Promise<void> => {
    await this.VideoSDK.forceUnpublish(stream);
  };

  /**
   * Register events that can be listened to be other components/modules
   * @param events An enum containing events
   */
  registerEvents = (events: unknown): void => {
    Object.values(events).forEach((event) => {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = new Set();
      }
    });
  };

  /**
   * Get the local publisher object for a stream
   * @param stream An OpenTok stream object
   */
  getPublisherForStream = (stream: OT.Stream): OT.Publisher =>
    this.getSession().getPublisherForStream(stream);

  /**
   * Get the local subscriber objects for a stream
   * @param stream An OpenTok stream object
   */
  getSubscribersForStream = (stream: OT.Stream): [OT.Subscriber] =>
    this.getSession().getSubscribersForStream(stream);
  /**
   * Send a signal using the OpenTok signaling apiKey
   * @param type
   * @param data
   * @param to An OpenTok connection object
   */
  signal = async (
    type: string,
    data: unknown,
    to: OT.Connection
  ): Promise<void> => {
    await this.VideoSDK.signal(type, data, to);
  };

  /**
   * Enable or disable local audio
   * @param enable
   */
  toggleLocalAudio = (enable: boolean): void => {
    const { publishers } = this.VideoSDK.getPubSub();

    const toggleAudio = (id) =>
      this.communication.enableLocalAV(id, 'audio', enable);

    Object.keys(publishers.camera).forEach(toggleAudio);
    Object.keys(publishers.screen).forEach(toggleAudio);
    Object.keys(publishers.sip).forEach(toggleAudio);
  };

  /**
   * Enable or disable local video
   * @param enable
   */
  toggleLocalVideo = (enable: boolean): void => {
    const { publishers } = this.VideoSDK.getPubSub();
    const toggleVideo = (id) =>
      this.communication.enableLocalAV(id, 'video', enable);
    Object.keys(publishers.camera).forEach(toggleVideo);
    Object.keys(publishers.screen).forEach(toggleVideo);
    Object.keys(publishers.sip).forEach(toggleVideo);
  };

  /**
   * Enable or disable remote audio
   * @param subscriberId Subscriber id
   * @param enable
   */
  toggleRemoteAudio = (subscriberId: string, enable: boolean): void => {
    this.communication.enableRemoteAV(subscriberId, 'audio', enable);
  };

  /**
   * Enable or disable remote video
   * @param subscriberId Subscriber id
   * @param enable
   */
  toggleRemoteVideo = (subscriberId: string, enable: boolean): void => {
    this.communication.enableRemoteAV(subscriberId, 'video', enable);
  };

  /**
   * Trigger an event and fire all registered callbacks
   * @param event The name of the event
   * @param data Data to be passed to callback functions
   */
  triggerEvent = (event: string, data: unknown): void => {
    const eventCallbacks = this.eventListeners[event];
    if (!eventCallbacks) {
      this.registerEvents(event);
      log(`${event} has been registered as a new event.`);
    } else {
      eventCallbacks.forEach((callback) => callback(data));
    }
  };

  initPackages = (): void => {
    const session = this.getSession();
    const options = this.getOptions();

    /**
     * Get containers for streams, controls, and the chat widget
     */
    const getDefaultContainer = (pubSub) =>
      document.getElementById(`${pubSub}Container`);
    const getContainerElements = () => {
      // Need to use path to check for null values
      const controls = options.controlsContainer || '#videoControls';
      //const chat = (options.textChat && options.textChat.container) || '#chat';
      const stream = options.streamContainers || getDefaultContainer;
      return { stream, controls }; //, chat };
    };

    /**
     * Return options for the specified package
     * @param packageName
     */
    const packageOptions = (
      packageName: string
    ): CommunicationOptions | unknown => {
      /**
       * If options.controlsContainer/containers.controls is null,
       * accelerator packs should not append their controls.
       */
      const containers = getContainerElements();
      const appendControl = !!containers.controls;
      const controlsContainer = containers.controls;
      const streamContainers = containers.stream;
      // const baseOptions = {
      //   session,
      //   core: this,
      //   controlsContainer,
      //   appendControl,
      //   streamContainers
      // };

      switch (packageName) {
        //     case Packages.Annotation: {
        //       return Object.assign({}, baseOptions, options.annotation);
        //     }
        //     case Packages.Archiving: {
        //       return Object.assign({}, baseOptions, options.archiving);
        //     }
        case Packages.Communication: {
          return new CommunicationOptions(
            this,
            session,
            appendControl,
            controlsContainer as string,
            options.communication,
            streamContainers
          );
        }
        //     case Packages.ScreenSharing: {
        //       const screenSharingContainer = {
        //         screenSharingContainer: streamContainers
        //       };
        //       return Object.assign(
        //         {},
        //         baseOptions,
        //         screenSharingContainer,
        //         options.screenSharing
        //       );
        //     }
        //     case Packages.TextChat: {
        //       const textChatOptions = {
        //         textChatContainer:
        //           options.textChat && options.textChat.container
        //             ? options.textChat.container
        //             : undefined,
        //         waitingMessage:
        //           options.textChat && options.textChat.waitingMessage
        //             ? options.textChat.waitingMessage
        //             : undefined,
        //         sender: {
        //           alias:
        //             options.textChat && options.textChat.name
        //               ? options.textChat.name
        //               : undefined
        //         },
        //         alwaysOpen:
        //           options.textChat && options.textChat.alwaysOpen
        //             ? options.textChat.alwaysOpen
        //             : undefined
        //       };
        //       return Object.assign({}, baseOptions, textChatOptions);
        //     }
        default:
          return {};
      }
    };

    /** Create instances of each package */

    this.communication = new Communication(
      packageOptions('communication') as CommunicationOptions,
      this.VideoSDK
    );
    // this.textChat = packages.TextChat
    //   ? packages.TextChat(packageOptions('textChat'))
    //   : null;
    // this.screenSharing = packages.ScreenSharing
    //   ? packages.ScreenSharing(packageOptions('screenSharing'))
    //   : null;
    // this.annotation = packages.Annotation
    //   ? packages.Annotation(packageOptions('annotation'))
    //   : null;
    // this.archiving = packages.Archiving
    //   ? packages.Archiving(packageOptions('archiving'))
    //   : null;
  };

  // setupExternalAnnotation = async (): Promise<void> =>
  //   await this.annotation.start(this.OpenTokSDK.getSession(), {
  //     screensharing: true
  //   });

  // linkAnnotation = (
  //   pubSub: OT.Publisher | OT.Subscriber,
  //   annotationContainer: HTMLElement,
  //   externalWindow: string | HTMLElement
  // ): void => {
  //   // this.annotation.linkCanvas(
  //   //   pubSub,
  //   //   annotationContainer,
  //   //   new LinkCanvasOptions(externalWindow)
  //   // );

  //   if (externalWindow) {
  //     // Add subscribers to the external window
  //     const streams = this.OpenTokSDK.getStreams();
  //     const cameraStreams = Object.keys(streams).reduce((acc, streamId) => {
  //       const stream = streams[streamId];
  //       return (stream.videoType as StreamType) === StreamType.Camera ||
  //         (stream.videoType as StreamType) === StreamType.SIP
  //         ? acc.concat(stream)
  //         : acc;
  //     }, []);
  //     cameraStreams.forEach(this.annotation.addSubscriberToExternalWindow);
  //   }
  // };

  /**
   * Establishes all events we could be listening to and
   * any callbacks that should occur.
   */
  private createEventListeners = (): void => {
    this.eventListeners = {};

    this.registerEvents(AcceleratorEvents);
    this.registerEvents(SessionEvents);

    // const options = this.VideoSDK.getOptions();
    // const session = this.VideoSDK.getSession();

    // /**
    //  * If using screen sharing + annotation in an external window, the screen sharing
    //  * package will take care of calling annotation.start() and annotation.linkCanvas()
    //  */
    // const usingAnnotation: boolean =
    //   options.screenSharing && options.screenSharing.annotation;
    // // const internalAnnotation: boolean =
    // //   usingAnnotation && options.screenSharing.externalWindow;

    /**
     * Wrap session events and update internalState when streams are created
     * or destroyed
     */
    Object.values(SessionEvents).forEach((eventName: string) => {
      this.VideoSDK.on(eventName, (data) => {
        this.triggerEvent(eventName, data);
      });
    });

    /**
     *
     */
    // if (usingAnnotation) {
    //   this.on(
    //     CoreEvents.StartScreenShare,
    //     (subscribeToScreenEvent: SubscribeToScreenEvent) => {
    //       this.annotation.start(session).then(() => {
    //         if (
    //           options.annotation &&
    //           options.annotation.absoluteParent &&
    //           options.annotation.absoluteParent.subscriber
    //         ) {
    //           const absoluteParent = dom.query(
    //             options.annotation.absoluteParent.subscriber
    //           ) as HTMLElement | undefined;
    //           const linkOptions = absoluteParent ? { absoluteParent } : null;
    //           const subscriber = subscribeToScreenEvent.subscriber;
    //           this.annotation.linkCanvas(
    //             subscriber,
    //             subscriber.element.parentElement,
    //             linkOptions
    //           );
    //         }
    //       });
    //     }
    //   );

    //   this.on(CoreEvents.EndScreenShare, () => {
    //     this.annotation.end();
    //   });
    // }

    // this.on(
    //   ScreenSharingEvents.StartScreensharing,
    //   (publisher: OT.Publisher) => {
    //     this.OpenTokSDK.addPublisher(StreamType.Screen, publisher);
    //     this.triggerEvent(
    //       CoreEvents.StartScreenShare,
    //       new StartScreenShareEvent(publisher, this.OpenTokSDK.getPubSub())
    //     );

    //     if (internalAnnotation) {
    //       this.annotation.start(session).then(() => {
    //         if (
    //           options.annotation &&
    //           options.annotation.absoluteParent &&
    //           options.annotation.absoluteParent.publisher
    //         ) {
    //           const absoluteParent = dom.query(
    //             options.annotation.absoluteParent.publisher
    //           ) as HTMLElement | undefined;
    //           const linkOptions = absoluteParent ? { absoluteParent } : null;
    //           this.annotation.linkCanvas(
    //             publisher,
    //             publisher.element.parentElement,
    //             linkOptions
    //           );
    //         }
    //       });
    //     }
    //   }
    // );

    // this.on(ScreenSharingEvents.EndScreenSharing, (publisher: OT.Publisher) => {
    //   this.OpenTokSDK.removePublisher(StreamType.Screen, publisher);
    //   this.triggerEvent(
    //     CoreEvents.EndScreenShare,
    //     new EndScreenShareEvent(this.OpenTokSDK.getPubSub())
    //   );
    //   if (usingAnnotation) {
    //     this.annotation.end();
    //   }
    // });
  };

  /**
   * Register a callback for a specific event or pass an object with
   * with event => callback key/value pairs to register listeners for
   * multiple events.
   * @param event The name of the event
   * @param callback
   */
  on = (event: string | unknown, callback: (event: unknown) => void): void => {
    if (typeof event !== 'string') {
      Object.keys(event).forEach((eventName) => {
        this.on(eventName, event[eventName]);
      });
      return;
    }
    if (!this.eventListeners[event]) {
      log(`${event} is not a registered event.`);
    } else {
      this.eventListeners[event].add(callback);
    }
  };

  /**
   * Remove a callback for a specific event.  If no parameters are passed,
   * all event listeners will be removed.
   * @param event - The name of the event
   * @param callback
   */
  off = (event: string, callback: (event: unknown) => void): void => {
    if (!event && !callback) {
      Object.keys(this.eventListeners).forEach((eventType) => {
        this.eventListeners[eventType].clear();
      });
    } else {
      if (!this.eventListeners[event]) {
        log(`${event} is not a registered event.`);
      } else {
        this.eventListeners[event].delete(callback);
      }
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let window: any;
if (typeof window !== 'undefined') {
  window.VideoAccelerator = VideoAccelerator;
}
