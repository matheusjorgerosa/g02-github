import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  scenarios: {
    rampa_taxa: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 500,
      stages: [
        { duration: '2m', target: 1000 },
        { duration: '2m', target: 10000 },
        { duration: '2m', target: 50000 },
        { duration: '2m', target: 100000 },
        { duration: '2m', target: 200000 },
        { duration: '1m', target: 0 },  
      ],
    },
  },
};

function gerarPayload() {
  const locations = [
    [-23.58334,  -46.686511],
    [-23.62332,  -46.69964],
    [-23.5367702,-46.6543715],
    [-23.5376064,-46.6639499],
    [-23.5359656,-46.6627848],
    [-23.553436, -46.672653],
    [-23.54648,  -46.681503],
    [-23.552703, -46.678954],
    [-23.549935, -46.677319],
    [-23.5723209,-46.6458695],
    [-23.56579,  -46.65145],
    [-23.5809882,-46.6637179],
    [-23.5757273,-46.6574723],
    [-23.5768521,-46.656592],
    [-23.577032, -46.672463],
    [-23.5929665,-46.6470365],
    [-23.55721,  -46.66263],
    [-23.5733455,-46.6550994],
    [-23.571479, -46.665473],
    [-23.578485, -46.6625515],
    [-23.577475, -46.663294],
    [-23.5751150,-46.6779397],
    [-23.5842771,-46.6835017],
    [-23.6157943,-46.6174434],
    [-23.514543, -46.638992],
    [-23.5178060,-46.6298068],
    [-23.5038534,-46.6340617],
  ];

  const classesSociais = ["A", "B1", "B2", "C", "DE"];

  const locIndex = Math.floor(Math.random() * 10);
  const latitude = locations[locIndex][0];
  const longitude = locations[locIndex][1];
  const idade = Math.floor(Math.random() * (80 - 18)) + 18;
  const classeSocial = classesSociais[Math.floor(Math.random() * classesSociais.length)];
  const genero = Math.random() < 0.5 ? "M" : "F";

  return JSON.stringify({
    latitude,
    longitude,
    idade,
    classe_social: classeSocial,
    genero,
    timestamp: new Date().toISOString()
  });
}

export default function () {
  const url = 'https://ingestao-gateway-5zyx9zcn.ue.gateway.dev/ingest';

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, gerarPayload(), params);

  check(res, {
    'status 200': (r) => r.status === 200,
    'respondeu rápido (<500ms)': (r) => r.timings.duration < 500,
  });

}