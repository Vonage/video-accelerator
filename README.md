# Vonage Video Accelerators

[![CI](https://github.com/Vonage/video-accelerator/actions/workflows/CI.yml/badge.svg)](https://github.com/Vonage/video-accelerator/actions/workflows/CI.yml)

The Video Accelerators provide an easy integration for the Vonage Video API.
Whether you've already built your application using the Video API or are just
getting started, Vonage Video Accelerators help you implement the functionality
you need.

The Vonage Video Accelerators includes [one package](#configuration) that
includes everything needed to create your video application and 4 packages
that can be used individually to implement specific features in your existing
Video API application.

The four component packages are:

- [Annotation] // TODO: Build & document in `/src/annotation`
- [Archiving] // TODO: Build & document in `/src/archiving`
- [Screen Sharing] // TODO: Build & document in `/src/screen-sharing`
- [Text Chat] // TODO: Build & document in `/src/text-chat`

## Configuration

The Vonage Video Accelerator can be configured in a number of ways, but the
only required options property is credentials, which includes a Vonage Video
API Key, Session Id, and Token. These can be obtained from the
[developer dashboard](https://tokbox.com/account/#/) or generated with one
of the Video API Server SDKs.

```js
const options = {
  credentials: {
    apiKey: {Your Video API Key},
    sessionId: {Your Video API Session Id},
    token: {Your Video API Token}
  }
};
```

Other configuration options are below:

//TODO: Document configuration options of the full accelerator.

## Usage

Initialize the Video Accelerator:

```js
const videoAccelerator = new VideoAccelerator(options);
```

Connect to the session:

```js
await videoAccelerator.connect();
```

The Video Accelerator maintains the state of your session for you. Calling
`videoAccelerator.state()` returns an object containing:

// TODO: Define state object

## UI Styling

Default icons and styling for accelerator pack components are provided by
opentok-solutions-css, which is available as an
[npm](https://www.npmjs.com/package/opentok-solutions-css) module or from
our [CDN](https://assets.tokbox.com/solutions/css/style.css). To customize
the layout and styling in your application, simply override these CSS
rules with your own.

## Development and Contributing

Interested in contributing? We :heart: pull requests! See the [Contribution](CONTRIBUTING.md) guidelines.

## Getting Help

We love to hear from you so if you have questions, comments or find a bug in the project, let us know! You can either:

- Open an issue on this repository
- See <https://support.tokbox.com/> for support options
- Tweet at us! We're [@VonageDev](https://twitter.com/VonageDev) on Twitter
- Or [join the Vonage Developer Community Slack](https://developer.nexmo.com/community/slack)

## Further Reading

- Check out the Developer Documentation at <https://tokbox.com/developer/>

[Text Chat]: https://github.com/vonage/video-accelerator/tree/main/src/text-chat
[Screen Sharing]: https://github.com/vonage/video-accelerator/tree/main/src/screen-sharing
[Annotation]: https://github.com/vonage/video-accelerator/tree/main/src/annotation
[Archiving]: https://github.com/vonage/video-accelerator/tree/main/src/archiving
