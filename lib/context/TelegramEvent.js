"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class TelegramEvent {
  constructor(rawEvent) {
    _defineProperty(this, "_rawEvent", void 0);

    this._rawEvent = rawEvent;
  }
  /**
   * Underlying raw event from Telegram.
   *
   */


  get rawEvent() {
    return this._rawEvent;
  }
  /**
   * Determine if the event is a message event.
   *
   */


  get isMessage() {
    return !!this._rawEvent.message;
  }
  /**
   * The message object from Telegram raw event.
   *
   */


  get message() {
    return this._rawEvent.message || null;
  }
  /**
   * Determine if the event is a message event which includes text.
   *
   */


  get isText() {
    return this.isMessage && typeof this.message.text === 'string';
  }
  /**
   * The text string from Telegram raw event.
   *
   */


  get text() {
    if (this.isText) {
      return this.message.text;
    }

    return null;
  }
  /**
   * Determine if the event which include reply to message.
   *
   */


  get isReplyToMessage() {
    if (!this.isMessage) return false;
    const message = this.message;
    return !!message.reply_to_message && typeof message.reply_to_message === 'object';
  }
  /**
   * The Message object from Telegram raw event which includes reply_to_message.
   *
   */


  get replyToMessage() {
    if (this.isReplyToMessage) {
      return this.message.reply_to_message;
    }

    return null;
  }
  /**
   * Determine if the event is a message event which includes audio.
   *
   */


  get isAudio() {
    if (!this.isMessage) return false;
    const message = this.message;
    return !!message.audio && typeof message.audio === 'object';
  }
  /**
   * The audio object from Telegram raw event.
   *
   */


  get audio() {
    if (this.isAudio) {
      return this.message.audio;
    }

    return null;
  }
  /**
   * Determine if the event is a message event which includes document.
   *
   */


  get isDocument() {
    if (!this.isMessage) return false;
    const message = this.message;
    return !!message.document && typeof message.document === 'object';
  }
  /**
   * The document object from Telegram raw event.
   *
   */


  get document() {
    if (this.isDocument) {
      return this.message.document;
    }

    return null;
  }
  /**
   * Determine if the event is a message event which includes game.
   *
   */


  get isGame() {
    if (!this.isMessage) return false;
    const message = this.message;
    return !!message.game && typeof message.game === 'object';
  }
  /**
   * The game object from Telegram raw event.
   *
   */


  get game() {
    if (this.isGame) {
      return this.message.game;
    }

    return null;
  }
  /**
   * Determine if the event is a message event which includes photo.
   *
   */


  get isPhoto() {
    if (!this.isMessage) return false;
    const message = this.message;
    return !!message.photo && message.photo.length > 0;
  }
  /**
   * The photo object from Telegram raw event.
   *
   */


  get photo() {
    if (this.isPhoto) {
      return this.message.photo;
    }

    return null;
  }
  /**
   * Determine if the event is a message event which includes sticker.
   *
   */


  get isSticker() {
    if (!this.isMessage) return false;
    const message = this.message;
    return !!message.sticker && typeof message.sticker === 'object';
  }
  /**
   * The sticker object from Telegram raw event.
   *
   */


  get sticker() {
    if (this.isSticker) {
      return this.message.sticker;
    }

    return null;
  }
  /**
   * Determine if the event is a message event which includes video.
   *
   */


  get isVideo() {
    if (!this.isMessage) return false;
    const message = this.message;
    return !!message.video && typeof message.video === 'object';
  }
  /**
   * The video object from Telegram raw event.
   *
   */


  get video() {
    if (this.isVideo) {
      return this.message.video;
    }

    return null;
  }
  /**
   * Determine if the event is a message event which includes voice.
   *
   */


  get isVoice() {
    if (!this.isMessage) return false;
    const message = this.message;
    return !!message.voice && typeof message.voice === 'object';
  }
  /**
   * The voice object from Telegram raw event.
   *
   */


  get voice() {
    if (this.isVoice) {
      return this.message.voice;
    }

    return null;
  }
  /**
   * Determine if the event is a message event which includes video note.
   *
   */


  get isVideoNote() {
    if (!this.isMessage) return false;
    const message = this.message;
    return !!message.video_note && typeof message.video_note === 'object';
  }
  /**
   * The video note object from Telegram raw event.
   *
   */


  get videoNote() {
    if (this.isVideoNote) {
      return this.message.video_note;
    }

    return null;
  }
  /**
   * Determine if the event is a message event which includes contact.
   *
   */


  get isContact() {
    if (!this.isMessage) return false;
    const message = this.message;
    return !!message.contact && typeof message.contact === 'object';
  }
  /**
   * The contact object from Telegram raw event.
   *
   */


  get contact() {
    if (this.isContact) {
      return this.message.contact;
    }

    return null;
  }
  /**
   * Determine if the event is a message event which includes location.
   *
   */


  get isLocation() {
    if (!this.isMessage) return false;
    const message = this.message;
    return !!message.location && typeof message.location === 'object';
  }
  /**
   * The location object from Telegram raw event.
   *
   */


  get location() {
    if (this.isLocation) {
      return this.message.location;
    }

    return null;
  }
  /**
   * Determine if the event is a message event which includes venue.
   *
   */


  get isVenue() {
    if (!this.isMessage) return false;
    const message = this.message;
    return !!message.venue && typeof message.venue === 'object';
  }
  /**
   * The venue object from Telegram raw event.
   *
   */


  get venue() {
    if (this.isVenue) {
      return this.message.venue;
    }

    return null;
  }
  /**
   * Determine if the event is an edited message event.
   *
   */


  get isEditedMessage() {
    return !!this.editedMessage && typeof this.editedMessage === 'object';
  }
  /**
   * The edited message from Telegram raw event.
   *
   */


  get editedMessage() {
    return this._rawEvent.edited_message || null;
  }
  /**
   * Determine if the event is a channel post event.
   *
   */


  get isChannelPost() {
    return !!this.channelPost && typeof this.channelPost === 'object';
  }
  /**
   * The channel post from Telegram raw event.
   *
   */


  get channelPost() {
    return this._rawEvent.channel_post || null;
  }
  /**
   * Determine if the event is an edited channel post event.
   *
   */


  get isEditedChannelPost() {
    return !!this.editedChannelPost && typeof this.editedChannelPost === 'object';
  }
  /**
   * The edited channel post from Telegram raw event.
   *
   */


  get editedChannelPost() {
    return this._rawEvent.edited_channel_post || null;
  }
  /**
   * Determine if the event is an inline query event.
   *
   */


  get isInlineQuery() {
    return !!this.inlineQuery && typeof this.inlineQuery === 'object';
  }
  /**
   * The inline query from Telegram raw event.
   *
   */


  get inlineQuery() {
    return this._rawEvent.inline_query || null;
  }
  /**
   * Determine if the event is a chosen inline result event.
   *
   */


  get isChosenInlineResult() {
    return !!this.chosenInlineResult && typeof this.chosenInlineResult === 'object';
  }
  /**
   * The chosen inline result from Telegram raw event.
   *
   */


  get chosenInlineResult() {
    return this._rawEvent.chosen_inline_result || null;
  }
  /**
   * Determine if the event is a callback query event.
   *
   */


  get isCallbackQuery() {
    return !!this.callbackQuery && typeof this.callbackQuery === 'object';
  }
  /**
   * The callback query from Telegram raw event.
   *
   */


  get callbackQuery() {
    return this._rawEvent.callback_query || null;
  }
  /**
   * Determine if the event is a callback query event.
   *
   */


  get isPayload() {
    return this.isCallbackQuery;
  }
  /**
   * The payload string from Telegram raw event.
   *
   */


  get payload() {
    if (this.isPayload) {
      return this.callbackQuery.data;
    }

    return null;
  }
  /**
   * Determine if the event is a shipping query event.
   *
   */


  get isShippingQuery() {
    return !!this.shippingQuery && typeof this.shippingQuery === 'object';
  }
  /**
   * The shipping query from Telegram raw event.
   *
   */


  get shippingQuery() {
    return this._rawEvent.shipping_query || null;
  }
  /**
   * Determine if the event is a pre checkout query event.
   *
   */


  get isPreCheckoutQuery() {
    return !!this.preCheckoutQuery && typeof this.preCheckoutQuery === 'object';
  }
  /**
   * The pre checkout query from Telegram raw event.
   *
   */


  get preCheckoutQuery() {
    return this._rawEvent.pre_checkout_query || null;
  }

}

exports.default = TelegramEvent;