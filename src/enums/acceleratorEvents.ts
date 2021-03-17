/**
 * Events fired by the Accelerator
 */
export enum AcceleratorEvents {
  Connected = 'connected',
  Disconnected = 'disconnected',
  Error = 'error',
  JoinSession = 'joinSession',
  LeaveSession = 'leaveSession',

  SubscribeToCamera = 'subscribeToCamera',
  SubscribeToScreen = 'subscribeToScreen',
  SubscribeToSIP = 'subscribeToSip',
  UnsubscribeFromCamera = 'unsubscribeFromCamera',
  UnsubscribeFromSIP = 'unsubscribeFromSip',
  UnsubscribeFromScreen = 'unsubscribeFromScreen',

  StartScreenShare = 'startScreenShare',
  EndScreenShare = 'endScreenShare'
}
