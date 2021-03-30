const options = {
  credentials: {
    apiKey: '47163894',
    sessionId:
      '2_MX40NzE2Mzg5NH5-MTYxNjAxMzE4NzIxN35WcXFPVitUdDQ0REQvS2lUeEZNRHhUOEl-fg',
    token:
      'T1==cGFydG5lcl9pZD00NzE2Mzg5NCZzaWc9M2QzMDJhYjA3NTUxMzhmMmEzYWY2Mjk0NjcyODcxYWY5MjE0OTY1YjpzZXNzaW9uX2lkPTJfTVg0ME56RTJNemc1Tkg1LU1UWXhOakF4TXpFNE56SXhOMzVXY1hGUFZpdFVkRFEwUkVRdlMybFVlRVpOUkhoVU9FbC1mZyZjcmVhdGVfdGltZT0xNjE2MDEzMTk3Jm5vbmNlPTAuMzE2NjMwNzUxMTkyOTc1MzUmcm9sZT1wdWJsaXNoZXImZXhwaXJlX3RpbWU9MTYxNjAxNjc5NCZpbml0aWFsX2xheW91dF9jbGFzc19saXN0PQ=='
  },
  controlsContainer: '#controls',
  streamContainers: (pubSub, type, data, stream) => {
    return {
      publisher: {
        camera: '#publisher',
        screen: '#publisher'
      },
      subscriber: {
        camera: '#subscribers',
        screen: '#subscribers'
      }
    }[pubSub][type];
  },
  appendControl: true
};

const videoAccelerator = new VideoAccelerator(options);

videoAccelerator.connect().then(() => {
  videoAccelerator.join();
});
