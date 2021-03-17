/**
 * Events fired by the Video API Session object
 */
export enum SessionEvents {
  /**
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#.event:archiveStarted
   */
  ArchiveStarted = 'archiveStarted',
  /**
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#.event:archiveStopped
   */
  ArchiveStopped = 'archiveStopped',
  /**
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#.event:connectionCreated
   */
  ConnectionCreated = 'connectionCreated',
  /**
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#.event:connectionDestroyed
   */
  ConnectionDestroyed = 'connectionDestroyed',
  /**
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#.event:sessionConnected
   */
  SessionConnected = 'sessionConnected',
  /**
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#.event:sessionDisconnected
   */
  SessionDisconnected = 'sessionDisconnected',
  /**
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#.event:sessionReconnected
   */
  SessionReconnected = 'sessionReconnected',
  /**
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#.event:sessionReconnecting
   */
  SessionReconnecting = 'sessionReconnecting',
  /**
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#.event:signal
   */
  Signal = 'signal',
  /**
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#.event:streamCreated
   */
  StreamCreated = 'streamCreated',
  /**
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#.event:streamDestroyed
   */
  StreamDestroyed = 'streamDestroyed',
  /**
   * @see https://tokbox.com/developer/sdks/js/reference/Session.html#.event:streamPropertyChanged
   */
  StreamPropertyChanged = 'streamPropertyChanged'
}
