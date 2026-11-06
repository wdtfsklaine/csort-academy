export const sortItems=[
  {id:'a',emoji:'⛽',name:'Чек на бензин',details:'2 450,70 ₽ · 01.10',zone:'fuel'},
  {id:'b',emoji:'🛣️',name:'Платная дорога',details:'760 ₽ · 02.10',zone:'fuel'},
  {id:'c',emoji:'🧰',name:'Покупка запчастей',details:'3 399 ₽ · чек',zone:'purchase'},
  {id:'d',emoji:'🍱',name:'Суточные',details:'1 400 ₽ · 2 дня',zone:'daily'},
  {id:'e',emoji:'🏨',name:'Проживание',details:'5 200 ₽ · гостиница',zone:'hotel'},
  {id:'f',emoji:'🛢️',name:'ГСМ на маршрут',details:'8 170 ₽ · 430 км',zone:'fuel'}
];
export const sortZones=[
  {id:'fuel',emoji:'🚗',label:'Проезд / ГСМ',subtitle:'Маршрут и транспорт'},
  {id:'purchase',emoji:'🧰',label:'Покупки',subtitle:'Товары и запчасти'},
  {id:'daily',emoji:'💼',label:'Суточные',subtitle:'Отдельная строка'},
  {id:'hotel',emoji:'🏨',label:'Проживание',subtitle:'Гостиница и жильё'}
];
export function evaluateSorting(placements){
  return sortItems.map(item=>({ok:placements[item.id]===item.zone,text:`${item.name} — ${sortZones.find(z=>z.id===item.zone).label}`}));
}
