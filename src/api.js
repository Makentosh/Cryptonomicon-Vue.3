const API_KEY =
  "96f89d39719814afc48d8701eebbf1d8925a79602e366a44924acec90867a62e";

const tickersHandlers = new Map();
const soket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = "5";
// const ERROR_TYPE = "500";

soket.addEventListener("message", e => {
  const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice } = JSON.parse(
    e.data
  );

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  const handlers = tickersHandlers.get(currency) ?? [];
  handlers.forEach(fn => fn(newPrice, type));
});

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);
  if (soket.readyState === WebSocket.OPEN) {
    soket.send(stringifiedMessage);
    return;
  }

  soket.addEventListener(
    "open",
    () => {
      soket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function subScribeToTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~USD`]
  });
}

function unsubScribeFromTickerOnWs(ticker) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~USD`]
  });
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subScribeToTickerOnWs(ticker);
};

export const unsubscribeFromTicker = ticker => {
  tickersHandlers.delete(ticker);
  unsubScribeFromTickerOnWs(ticker);
};

window.tickersHandlers = tickersHandlers;

export const getAutocompleteList = () => {
  const autocompleteList = [];

  fetch(`https://min-api.cryptocompare.com/data/all/coinlist?summary=true`)
    .then(res => res.json())
    .then(data => {
      for (let tickerName in data.Data) {
        autocompleteList.push(tickerName);
      }
    });

  return autocompleteList;
};
