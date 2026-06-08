import fs from 'fs';

const text = `
Date;Libellé;Débit euros;Crédit euros;
07/06/2026;"REMISE CARTE            
CARTE 8004701 001 380797 07/06  


";;0,01;
02/06/2026;"PRELEVEMENT             
Facture Crédit Agricole 2026-05  


";3,00;;
`;

const matches = [...text.matchAll(/(\d{2}\/\d{2}\/\d{4});("[^"]*"|[^;]*);([^;]*);([^;\r\n]*)/g)];
console.log(matches.map(m =>({
  date: m[1],
  lib: m[2],
  deb: m[3],
  cred: m[4]
})));
