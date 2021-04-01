import { OTError } from '@opentok/client';
import { VideoAccelerator } from '../core';
import { AcceleratorEvents, TextChatEvents } from '../enums';
import {
  Signal,
  TextChatError,
  TextChatMessage,
  TextChatOptions
} from '../models';

export default class TextChatAccelerator {
  private videoAccelerator?: VideoAccelerator;
  private session: OT.Session;

  private options: TextChatOptions;

  private composer: HTMLInputElement;
  private newMessages: HTMLElement;
  private characterCount: HTMLElement;
  private characterIcon: HTMLElement;

  private sender;
  private lastMessage?: TextChatMessage;
  private displayed: boolean;
  private enabled: boolean;
  private initialized: boolean;
  private controlAdded: boolean;
  private futureMessageNotice: boolean;
  private sentMessageHistory: TextChatMessage[] = [];
  private remoteParticipant: boolean;

  constructor(options: TextChatOptions) {
    // Validate provided options
    this.validateOptions(options);

    if (options.alwaysOpen) {
      this.initTextChat();
    }

    if (options.appendControl) {
      this.appendControl();
    }

    this.registerEvents();
    this.addEventListeners();
  }

  isDisplayed(): boolean {
    return this.displayed;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  showTextChat(): void {
    this.openTextChat();
  }

  hideTextChat(): void {
    this.closeTextChat();
  }

  deliverUnsentMessages(): void {
    this.sendUnsentMessages();
  }

  /** PRIVATE METHODS **/

  /**
   * Triggers an event in the Accelerator Core
   * @param event Event triggered
   * @param data Payload to send with event
   */
  private triggerEvent(event: string, data?: unknown): void {
    this.videoAccelerator && this.videoAccelerator.triggerEvent(event, data);
  }

  /**
   * Sends a message to the session or optionally a specific recipient
   * @param message Text message to send
   * @param recipient OpenTok connection of a recipient
   */
  private async sendTextMessage(
    message: string,
    recipient?: OT.Connection
  ): Promise<void> {
    if (message && message.length > 0) {
      try {
        const sentMessage: TextChatMessage = await this.sendMessage(
          message,
          recipient
        );

        await this.handleMessageSent(sentMessage);
        if (this.futureMessageNotice) {
          this.futureMessageNotice = false;
        }
      } catch (error: unknown) {
        this.handleMessageError(error as TextChatError);
      }
    }
  }

  private escapeHtml(text: string): string {
    const charactersMap = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return (text || '').toString().replace(/[<>"']/gi, function (match) {
      return charactersMap[match];
    });
  }

  private renderUILayout(): string {
    return `
      <div class="ots-text-chat-container">
        <div class="ots-text-chat">
          <div class="ots-messages-header ots-hidden" id="chatHeader">
            <span>Chat with</span>
          </div>
          <div id="otsChatWrap">
            <div class="ots-messages-holder" id="messagesHolder">
              <div class="ots-messages-alert ots-hidden" id="messagesWaiting">
                ${this.escapeHtml(this.options.waitingMessage)}
              </div>
              <div class="ots-message-item ots-message-sent"></div>
            </div>
            <div class="ots-send-message-box">
              <input type="text" maxlength="${
                this.options.limitCharacterMessage
              }"
                class="ots-message-input" placeholder="Enter your message here" id="messageBox">
              <button class="ots-icon-check" id="sendMessage" type="submit"></button>
              <div class="ots-character-count">
                <span>
                  <span id="characterCount">0</span>/${
                    this.options.limitCharacterMessage
                  } characters
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  private getBubbleHtml(
    message: TextChatMessage,
    isFailedMessage = false
  ): string {
    return `
      <div class="${this.escapeHtml(message.messageClass)}${
      isFailedMessage ? ' ots-message-failed' : ''
    }">
        <div class="ots-user-name-initial">
          ${this.escapeHtml(message.senderAlias[0])}
        </div>
        <div class="ots-item-timestamp">
          ${this.escapeHtml(message.senderAlias)},
          <span data-livestamp="${new Date(message.time)}"</span>
        </div>
        <div class="ots-item-text">
          <span>
            ${this.escapeHtml(message.message)}
          </span>
        </div>
      </div>
    `;
  }

  private setupUI(): void {
    const parent =
      document.querySelector(this.options.textChatContainer as string) ||
      document.body;

    const chatView = document.createElement('section');
    chatView.innerHTML = this.renderUILayout();

    this.composer = chatView.querySelector('#messageBox');
    this.newMessages = chatView.querySelector('#messagesHolder');
    this.characterCount = chatView.querySelector('#characterCount');
    this.characterIcon = chatView.querySelector('.ots-icon-check');

    this.composer.onkeyup = () => {
      const charLength = this.composer.getAttribute('value').length;
      this.characterCount.innerText = charLength.toString();
      if (charLength !== 0) {
        this.characterIcon.classList.add('active');
      } else {
        this.characterIcon.classList.remove('active');
      }
    };

    this.composer.onkeydown = (event) => {
      const isEnter = event.code === 'Enter';
      if (!event.shiftKey && isEnter) {
        event.preventDefault();
        this.sendTextMessage(this.composer.value);
      }
    };

    parent.appendChild(chatView);

    document.getElementById('sendMessage').onclick = () => {
      this.sendTextMessage(this.composer.value);
    };
  }

  private renderChatMessage(
    textChatMessage: TextChatMessage,
    isFailedMessage = false
  ): void {
    if (this.shouldAppendMessage(textChatMessage)) {
      const newMessage = `<span>${this.escapeHtml(
        textChatMessage.message
      )}</span>`;

      const _lastMessage = document.querySelector('ots-item-text:last-child');
      _lastMessage.innerHTML += newMessage;
    } else {
      textChatMessage.messageClass =
        this.sender.id === textChatMessage.senderId
          ? 'ots-message-item ots-message-sent'
          : 'ots-message-item';

      const view = this.getBubbleHtml(textChatMessage, isFailedMessage);
      this.newMessages.append(view);
    }

    this.newMessages.scrollTop = this.newMessages.scrollHeight;
  }

  private handleMessageSent(sentMessage: TextChatMessage): void {
    this.sentMessageHistory.push(sentMessage);
    this.cleanComposer();
    this.renderChatMessage(sentMessage);
    this.lastMessage = sentMessage;
    this.triggerEvent(TextChatEvents.MessageSent, sentMessage);
  }

  private shouldAppendMessage = (receivedMessage: TextChatMessage): boolean =>
    this.lastMessage && this.lastMessage.senderId === receivedMessage.senderId;

  private cleanComposer(): void {
    this.composer.value = '';
    this.characterCount.innerText = '0';
  }

  private handleMessageError(error: TextChatError): void {
    // Add an error message to the message view
    // that is standardized as far as classes
    this.renderChatMessage(error.textChatMessage, true);
    this.triggerEvent(TextChatEvents.ErrorSendingMessage, error);
  }

  private showWaitingMessage(): void {
    const el = document.getElementById('messagesWaiting');
    el && el.classList.remove('ots-hidden');
    const parent = document.getElementById('messagesHolder');
    parent && parent.classList.add('has-alert');
  }

  private hideWaitingMessage(): void {
    const el = document.getElementById('messagesWaiting');
    el && el.classList.add('ots-hidden');
    const parent = document.getElementById('messagesHolder');
    parent && parent.classList.add('has-alert');
  }

  private sendMessage = async (
    message: string,
    recipient?: OT.Connection
  ): Promise<TextChatMessage> => {
    const textChatMessage: TextChatMessage = new TextChatMessage(
      this.sender.id,
      this.sender.alias,
      null,
      message,
      Date.now().toString()
    );

    if (!this.remoteParticipant) {
      this.showWaitingMessage();
      return;
    } else {
      this.hideWaitingMessage();
    }
    this.session.signal(
      {
        type: 'text-chat',
        data: JSON.stringify(textChatMessage),
        to: recipient
      },
      function (error: OTError) {
        if (error) {
          const errorMessage = 'Error sending a message. ';

          throw new TextChatError(textChatMessage, errorMessage);
        }

        return textChatMessage;
      }
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private onIncomingMessage(event: any): void {
    const signal = event.target as Signal;
    const me = this.session.connection.connectionId;
    const from = signal.from.connectionId;
    if (from !== me) {
      const receivedTextChatMessage: TextChatMessage = JSON.parse(signal.data);
      this.renderChatMessage(receivedTextChatMessage);
      this.lastMessage = receivedTextChatMessage;
      this.triggerEvent(TextChatEvents.MessageReceived, signal);
    }
  }

  private sendUnsentMessages(): void {
    this.sentMessageHistory.forEach((message: TextChatMessage) => {
      this.sendMessage(message.message, message.recipient);
    });
    this.sentMessageHistory = [];
  }

  private openTextChat() {
    document
      .querySelector(this.options.textChatContainer as string)
      .classList.remove('ots-hidden');
    this.displayed = true;
    this.triggerEvent(TextChatEvents.ShowTextChat);
  }

  private initTextChat() {
    this.enabled = true;
    this.displayed = true;
    this.initialized = true;
    this.setupUI();
    this.triggerEvent(TextChatEvents.ShowTextChat);
    this.session.on('signal:text-chat', this.onIncomingMessage);
  }

  private closeTextChat() {
    document
      .querySelector(this.options.textChatContainer as string)
      .classList.add('ots-hidden');
    this.displayed = false;
    this.triggerEvent(TextChatEvents.HideTextChat);
  }

  private registerEvents() {
    const events = Object.values(TextChatEvents);
    if (this.videoAccelerator) {
      this.videoAccelerator.registerEvents(events);
    }
  }

  private handleConnectionCreated(
    event: OT.Event<'connectionCreated', OT.Session> & {
      connection: OT.Connection;
    }
  ) {
    if (
      event &&
      event.connection.connectionId !== this.session.connection.connectionId
    ) {
      this.remoteParticipant = true;
      this.hideWaitingMessage();
    }
  }

  // private handleStreamCreated(
  //   event?: OT.Event<'streamCreated', OT.Session> & { stream: OT.Stream }
  // ) {
  //   if (
  //     event &&
  //     event.stream.connection.connectionId !==
  //       this.session.connection.connectionId
  //   ) {
  //     this.remoteParticipant = true;
  //     this.hideWaitingMessage();
  //   }
  // }

  // private handleStreamDestroyed() {
  //   if (this.session.streams.length < 2) {
  //     this.remoteParticipant = false;
  //   }
  // }

  private appendControl() {
    const feedControls = document.querySelector(
      this.options.controlsContainer as string
    );

    const el = document.createElement('div');
    const enableTextChat = document.createElement('div');
    enableTextChat.classList.add(
      'ots-video-control',
      'circle',
      'text-chat',
      'enabled'
    );
    enableTextChat.id = 'enableTextChat';
    el.appendChild(enableTextChat);

    feedControls.appendChild(enableTextChat);

    this.controlAdded = true;

    enableTextChat.onclick = () => {
      if (!this.initialized) {
        this.initTextChat();
      } else if (!this.displayed) {
        this.openTextChat();
      } else {
        this.closeTextChat();
      }
    };
  }

  private uniqueString(length?: number): string {
    const len = length || 3;
    return Math.random().toString(36).substr(2, len);
  }

  private validateOptions(options: TextChatOptions): void {
    if (!options.session) {
      throw new Error(
        'Text Chat Accelerator Pack requires an OpenTok session.'
      );
    }

    this.session = options.session;
    this.videoAccelerator = options.videoAccelerator;

    /**
     * Create arbitrary values for sender id and alias if not received
     * in options hash.
     */
    this.sender = options.sender || {
      id: `${this.uniqueString()}${
        this.session.sessionId
      }${this.uniqueString()}`,
      alias: `User${this.uniqueString()}`
    };

    this.options = options;
  }

  private addEventListeners() {
    if (this.videoAccelerator) {
      // this.videoAccelerator.on(
      //   SessionEvents.StreamCreated,
      //   this.handleStreamCreated
      // );
      // this.videoAccelerator.on(
      //   SessionEvents.StreamDestroyed,
      //   this.handleStreamDestroyed
      // );

      this.videoAccelerator.on(AcceleratorEvents.JoinSession, function () {
        if (!this.options.alwaysOpen) {
          if (this.controlAdded) {
            document
              .querySelector('#enableTextChat')
              .classList.remove('ots-hidden');
          } else {
            this.options.appendControl && this.appendControl();
          }
        }
      });

      this.videoAccelerator.on(AcceleratorEvents.LeaveSession, function () {
        if (!this.alwaysOpen) {
          document.getElementById('enableTextChat').classList.add('ots-hidden');
          if (this.displayed) {
            this.closeTextChat();
          }
        }
      });
    } else {
      // this.session.on(SessionEvents.StreamCreated, this.handleStreamCreated);
      // this.session.on(
      //   SessionEvents.StreamDestroyed,
      //   this.handleStreamDestroyed
      // );
    }

    this.session.on('connectionCreated', this.handleConnectionCreated);

    /**
     * We need to check for remote participants in case we were the last party to join and
     * the session event fired before the text chat component was initialized.
     */
    //this.handleStreamCreated();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let window: any;
if (typeof window !== 'undefined') {
  window.TextChatAccelerator = TextChatAccelerator;
}
