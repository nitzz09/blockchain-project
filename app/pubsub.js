const PubNub = require('pubnub');

const credentials = {
  publishKey: 'pub-c-8e1673c9-55e7-4eaf-9fc3-b6bff3c99146',
  subscribeKey: 'sub-c-7df65603-ae0b-464d-9759-19977b3d370e',
  secretKey: 'sec-c-MjE5NzhlNWUtYzVlZS00OGE3LWJmNDYtNTU0YzFiYzQ5ODE1'
};

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
};

class PubSub {
  constructor({ blockchain, transactionPool }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;

    this.pubnub = new PubNub(credentials);
    this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
    this.pubnub.addListener(this.listener());
  }

  handleMessage(channel, message) {
    console.log(`Message received. Channel: ${channel}. Message: ${message}`);

    const parsedMessage = JSON.parse(message);

    switch(channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage, true, () => {
          this.transactionPool.clearBlockchainTransactions({
             chain: parsedMessage
          });
        });
        break;
      case CHANNELS.TRANSACTION:
        this.transactionPool.setTransaction(parsedMessage);
        break;
      default:
        return;
    }
  }


  listener() {
    return {
      message: messageObject => {
        const { channel, message } = messageObject;

        this.handleMessage(channel, message);
      }
    };
  }

  publish({ channel, message}) {
    this.pubnub.publish({ channel, message });
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction)
    })
  }
}

module.exports = PubSub;