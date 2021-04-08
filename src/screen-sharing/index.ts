import { VideoAccelerator } from '../core';
import { defaultScreenShareOptions, ScreenSharingOptions } from '../models';
import { dom } from '../util';

const screenSharingControl = `<a id="acc-share-screen" class="acc-video-control hidden" title="Share Screen"></a>\n`;

const screenSharingView = [
  '<div class="hidden" id="screenShareView">',
  '<div class="ots-feed-main-video">',
  '<div class="ots-feed-holder" id="videoHolderScreenShare"></div>',
  '<div class="ots-feed-mask"></div>',
  '<img src="https://assets.tokbox.com/solutions/images/widget-video-mask.png"/>',
  '</div>',
  '<div class="ots-feed-call-controls" id="feedControlsFromScreen">',
  '<button class="ots-icon-screen active hidden" id="endScreenShareBtn"></button>',
  '</div>',
  '</div>'
].join('\n');

const defaultScreenProperties = {
  insertMode: 'append',
  width: '100%',
  height: '100%',
  showControls: false,
  style: {
    buttonDisplayMode: 'off'
  },
  videoSource: 'window'
};

export default class ScreenSharingAccelerator {
  private videoAccelerator?: VideoAccelerator;
  private session: OT.Session;

  constructor(private options: ScreenSharingOptions) {
    this.validateOptions();

    this.setupUI();
  }

  //   var _toggleScreenSharingButton = function (show) {
  //   $('#startScreenSharing')[show ? 'show' : 'hide']();
  // };

  // // Trigger event via common layer API
  // var _triggerEvent = function (event, data) {
  //   if (_accPack) {
  //     _accPack.triggerEvent(event, data);
  //   }
  // };

  private validateOptions = () => {
    if (!this.options.session) {
      throw new Error('Screen Share Accelerator requires a Video API session.');
    }

    this.session = this.options.session;
    this.videoAccelerator = this.options.videoAccelerator;

    this.options = { ...defaultScreenShareOptions, ...this.options };
  };

  private setupUI = () => {
    if (this.options.appendControls) {
      dom.query(this.options.controlsContainer)?.append(screenSharingControl);
      dom.query(this.options.parent)?.append(screenSharingView);
    }
  };

  /**
   * Create a publisher for the screen.  If we're using annotation, we first need
   * to create the annotation window and get a reference to its annotation container
   * element so that we can pass it to the initPublisher function.
   * @returns {promise} < Resolve: [Object] Container element for annotation in external window >
   */
  private initPublisher = async (
    publisherOptions: OT.PublisherProperties
  ): Promise<unknown> => {
    const createPublisher = async (publisherDiv): Promise<any> => {
      const getContainer = () => {
        if (publisherDiv) {
          return publisherDiv;
        }
        if (typeof _this.screenSharingContainer === 'function') {
          return document.querySelector(
            _this.screenSharingContainer('publisher', 'screen')
          );
        } else {
          return _this.screenSharingContainer;
        }
      };

      const container = getContainer();

      const properties = Object.assign(
        {},
        _this.localScreenProperties || _defaultScreenProperties,
        publisherOptions
      );

      _this.publisher = OT.initPublisher(
        container,
        properties,
        function (error) {
          if (error) {
            _triggerEvent('screenSharingError', error);
            innerDeferred.reject(
              _.extend(_.omit(error, 'messsage'), {
                message: 'Error starting the screen sharing'
              })
            );
          } else {
            _this.publisher.on('mediaStopped', function () {
              end();
            });
            innerDeferred.resolve();
          }
        }
      );

      return innerDeferred.promise();
    };

    if (
      this.videoAccelerator &&
      this.options.useAnnotation &&
      this.options.useExternalWindow
    ) {
      this.annotationWindow = await this.videoAccelerator.setupExternalAnnotation();
      if (this.annotationWindow) {
        const annotationElements = this.annotationWindow.createContainerElements();
        await createPublisher(annotationElements.publisher);
        return annotationElements.annotation;
      }
    } else {
      await createPublisher();
    }
  };
}
