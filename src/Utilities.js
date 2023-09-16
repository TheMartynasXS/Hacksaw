// class ColorHandler {
//     vec4;
//     time;
//     constructor(
//         vec4 = [Math.random(), Math.random(), Math.random(), Math.random()],
//         time = 0
//     ) {
//         this.vec4 = vec4;
//         this.time = time;
//     }
//     InputHex(Hex = "#000000ff") {
//         this.vec4 = [
//             parseInt(Hex.slice(1, 3), 16) / 255,
//             parseInt(Hex.slice(3, 5), 16) / 255,
//             parseInt(Hex.slice(5, 7), 16) / 255,
//             Hex.length > 7 ? parseInt(Hex.slice(7, 9), 16) / 255 : 1
//         ]
//     }
//     InputAlpha(alpha = 0) {
//         this.vec4[3] = alpha
//     }
//     ToHSL() {
//         let [r, g, b] = [this.vec4[0], this.vec4[1], this.vec4[2]]
//         let max = Math.max(r, g, b)
//         let min = Math.min(r, g, b)
//         let h = 0, s, l = (max + min) / 2
//         if (max == min) {
//             h = s = 0
//         } else {
//             let d = max - min
//             s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
//             switch (max) {
//                 case r: h = (g - b) / d + (g < b ? 6 : 0); break;
//                 case g: h = (b - r) / d + 2; break;
//                 case b: h = (r - g) / d + 4; break;
//             }
//             h /= 6
//         }
//         return [h, s, l]
//     }
//     Shift(hue = 0, sat = 0, lig = 0) {
//         let hsl = (this.ToHSL());
//         hue = Math.abs(hue) >= 360 ? hue % 360 : hue;
//         hsl[0] += hue / 360;
//         let [h, s, l] = hsl;
//         s = Math.min(Math.max(s + (sat / 100), 0.01), 1);
//         l = Math.min(Math.max(l + (lig / 100), 0.01), 1);
//         let r, g, b;
//         if (s == 0) {
//             r = g = b = l; // achromatic
//         } else {
//             const hue2rgb = function hue2rgb(p, q, t) {
//                 if (t < 0) t += 1;
//                 if (t > 1) t -= 1;
//                 if (t < 1 / 6) return p + (q - p) * 6 * t;
//                 if (t < 1 / 2) return q;
//                 if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
//                 return p;
//             }

//             var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
//             var p = 2 * l - q;
//             r = hue2rgb(p, q, h + 1 / 3);
//             g = hue2rgb(p, q, h);
//             b = hue2rgb(p, q, h - 1 / 3);
//         }
//         this.vec4 = [r, g, b, this.vec4[3]];
//     }
//     ToHEX() {
//         let rr =
//             Math.round(this.vec4[0] * 255).toString(16).length > 1
//                 ? Math.round(this.vec4[0] * 255).toString(16)
//                 : "0" + Math.round(this.vec4[0] * 255).toString(16);
//         let gg =
//             Math.round(this.vec4[1] * 255).toString(16).length > 1
//                 ? Math.round(this.vec4[1] * 255).toString(16)
//                 : "0" + Math.round(this.vec4[1] * 255).toString(16);
//         let bb =
//             Math.round(this.vec4[2] * 255).toString(16).length > 1
//                 ? Math.round(this.vec4[2] * 255).toString(16)
//                 : "0" + Math.round(this.vec4[2] * 255).toString(16);
//         return "#" + (rr + gg + bb);
//     }
//     SetTime(time) {
//         this.time = time;
//         this.vec4 = this.vec4;
//     }
// }

// export { ColorHandler };