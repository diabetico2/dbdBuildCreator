import {recommend} from './recommender.js';
self.onmessage=({data})=>{try{self.postMessage({id:data.id,result:recommend(data.input)});}catch{self.postMessage({id:data.id,error:'Não foi possível calcular a build.'});}};
