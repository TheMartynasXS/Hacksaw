import { writable } from 'svelte/store';
import { ColorHandler } from './Utilities';

// appLocalDataDir()
//   .then(dir => readTextFile(`${dir}UserPrefs.json`))
//   .then(data => settings.set(JSON.parse(data)));

// export const targetLocation = writable('')
// export const donorLocation = writable('')
// export const targetBin = writable([]);
// export const donorBin = writable([]);

// export function openBin(target=true) {
//   if(target){
//     open({
//       filters: [
//         { name: "Target Bin", extensions: ['bin'] }
//       ]
//     }).then(result => {

//       targetLocation.set(result)
//       readTextFile(result.slice(0, -4) + ".json").then(data => targetBin.set(JSON.parse(data)))
//     })
//   }
//   else{
//     open({
//       filters: [
//         { name: "Target Bin", extensions: ['bin'] }
//       ]
//     }).then(result => console.log(result))
//   }
// }


// export async function openBin(target) {
//   return new Promise((resolve, reject) => {
//     if (target) {
//       open({
//         filters: [
//           { name: "Target Bin", extensions: ['bin'] }
//         ],
//         title: "Select Target Bin"
//       }).then((result = "") => {
//         if (result != "")
//           targetLocation.set(result)
//         readTextFile(result?.slice(0, -4) + ".json").then(data => targetBin.set(JSON.parse(data)))
//       })
//     }
//     else {
//       open({
//         filters: [
//           { name: "Donor Bin", extensions: ['bin'] }
//         ],
//         title: "Select Donor Bin"
//       }).then(result => console.log(result))
//     }
//     resolve();
//   })
// }

export const settings = writable({
  "PreferredMode": "linear",
  "IgnoreBW": true,
  "RitoBinPath": "",
  "Targets": [
    true,
    true,
    true,
    true,
    true
  ],
  "Regenerate": true
});
export const paletteStore = writable([new ColorHandler()]);