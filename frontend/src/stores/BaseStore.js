import EventEmitter from 'eventemitter3';

const emitter = new EventEmitter();

let BaseStore = {
  emitChange(event = 'change') {
    emitter.emit(event);
  },

  addChangeListener(callback, event = 'change') {
    emitter.on(event, callback);
  },

  removeChangeListener(callback, event = 'change') {
    emitter.removeListener(event, callback);
  }
};

export default BaseStore;
