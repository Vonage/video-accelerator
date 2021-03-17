import {
  Credential,
  AcceleratorOptions,
  PubSubDetail,
  PubSubSummary,
  StreamCollection,
  StreamType,
  AcceleratorError
} from './models';

export class State {
  private connected: boolean;
  private credentials: Credential | null = null;
  private options: AcceleratorOptions;
  private publishers = new StreamCollection<OT.Publisher>();
  private session: OT.Session | null = null;
  private streamMap: Record<string, string> = {};
  private streams: Record<string, OT.Stream> = {};
  private subscribers = new StreamCollection<OT.Subscriber>();

  constructor(credentials: Credential) {
    this.setCredentials(credentials);
  }

  /**
   * Ensures that we have the required credentials
   * @param credentials Credentials for the OpenTok session/user
   */
  private validateCredentials(credentials?: Credential): void {
    if (credentials === null) {
      throw new AcceleratorError(
        'Missing credentials required for initialization',
        'invalidParameters'
      );
    }

    const required = ['apiKey', 'sessionId', 'token'];
    required.forEach((credential) => {
      if (!credentials[credential]) {
        throw new AcceleratorError(
          `${credential} is a required credential`,
          'invalidParameters'
        );
      }
    });
  }

  /**
   * Sets the current connection state
   * @param connected Whether we're connected to the session or not
   */
  protected setConnected(connected: boolean): void {
    this.connected = connected;
  }

  /**
   * Gets the current connection state
   */
  protected getConnected(): boolean {
    return this.connected;
  }

  /**
   * Get the options defined
   */
  public getOptions(): AcceleratorOptions {
    return this.options;
  }

  /**
   * Set the options defined for core
   * @param options Options to use for the session
   */
  public setOptions(options: AcceleratorOptions): void {
    this.options = options;
  }

  /**
   * Gets the current OpenTok session
   */
  public getSession(): OT.Session | null {
    return this.session;
  }

  /**
   * Sets the current OpenTok session
   * @param session Current OpenTok session
   */
  public setSession(session: OT.Session): void {
    this.session = session;
  }

  /**
   * Gets the current OpenTok credentials
   */
  public getCredentials(): Credential | null {
    return this.credentials;
  }

  /**
   * Set the current OpenTok credentials
   * @param credentials OpenTok credentials
   */
  public setCredentials(credentials: Credential): void {
    this.validateCredentials(credentials);
    this.credentials = credentials;
  }

  /**
   * Retrieves all streams
   */
  public getStreams(): Record<string, OT.Stream> {
    return this.streams;
  }

  /**
   * Returns the count of current publishers and subscribers by type
   */
  public pubSubCount(): PubSubSummary {
    return new PubSubSummary(this.publishers, this.subscribers);
  }

  /**
   * Returns the current publishers and subscribers, along with a count of each
   */
  public getPubSub(): PubSubDetail {
    return new PubSubDetail(this.publishers, this.subscribers);
  }

  /**
   * Gets a subscriber
   * @param streamId Unique identifier of the stream
   */
  public getSubscriber(streamId: string): OT.Subscriber | undefined {
    const id = this.streamMap[streamId];
    if (id) {
      return this.subscribers.getStream(id);
    }
    return undefined;
  }

  /**
   * Gets a subscriber
   * @param streamId Unique identifier of the stream
   */
  public getPublisher(streamId: string): OT.Publisher | undefined {
    const id = this.streamMap[streamId];
    if (id) {
      return this.publishers.getStream(id);
    }
    return undefined;
  }

  /**
   * Gets a subscriber
   * @param type Type of publishers to return
   */
  public getPublishers(type: StreamType): OT.Publisher[] {
    return Object.values(this.publishers[type]).map((publisher) => publisher);
  }

  /**
   * Add publisher to state
   * @param type Type of stream being published
   * @param publisher OpenTok publisher
   */
  public addPublisher(type: StreamType, publisher: OT.Publisher): void {
    this.publishers.addStream(type, publisher);
    this.streamMap[publisher.stream.streamId] = publisher.id;
  }

  /**
   * Removes a publisher from state
   * @param type Type of stream being removed
   * @param publisher OpenTok publisher
   */
  public removePublisher(type: StreamType, publisher: OT.Publisher): void {
    this.publishers.removeStream(type, publisher);
  }

  /**
   * Removes all publishers
   */
  public removeAllPublishers(): void {
    this.publishers.reset();
  }

  /**
   * Adds subscriber
   * @param subscriber Subscriber to add
   */
  public addSubscriber(subscriber: OT.Subscriber): void {
    this.subscribers.addStream(
      subscriber.stream.videoType as StreamType,
      subscriber
    );
    this.streamMap[subscriber.stream.streamId] = subscriber.id;
  }

  /**
   * Removes a subscriber
   * @param subscriber Subscriber to remove
   */
  public removeSubscriber(subscriber: OT.Subscriber): void {
    if (!subscriber) return;
    this.subscribers.removeStream(
      subscriber.stream.videoType as StreamType,
      subscriber
    );
  }

  /**
   * Add a stream to state
   * @param stream An OpenTok stream
   */
  public addStream(stream: OT.Stream): void {
    this.streams[stream.streamId] = stream;
  }

  /**
   * Remove a stream from state and any associated subscribers
   * @param stream An OpenTok stream object
   */
  public removeStream(stream: OT.Stream): void {
    const type = stream.videoType;
    const subscriberId = this.streamMap[stream.streamId];
    delete this.streamMap[stream.streamId];
    delete this.streams[stream.streamId];
    this.removeSubscriber(this.subscribers[type][subscriberId]);
  }

  /**
   * Reset publishers, streams, and subscribers
   */
  public reset(): void {
    this.publishers.reset();
    this.subscribers.reset();
    this.streamMap = {};
    this.streams = {};
  }

  /**
   * Returns the map of stream ids to publisher/subscriber ids
   */
  public getStreamMap(): Record<string, string> {
    return this.streamMap;
  }

  /**
   * Returns the contents of state
   */
  public all(): unknown {
    return Object.assign(
      this.streams,
      this.streamMap,
      this.connected,
      this.getPubSub()
    );
  }
}
