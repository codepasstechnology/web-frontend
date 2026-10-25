/** Approximate county-town centres for the starting view, not boundary validation. */
const CENTERS: Record<string, [number, number]> = {
  Mombasa: [-4.0435, 39.6682],
  Kwale: [-4.1744, 39.4521],
  Kilifi: [-3.6305, 39.8499],
  "Tana River": [-1.498, 40.033],
  Lamu: [-2.2717, 40.902],
  "Taita-Taveta": [-3.396, 38.556],
  Garissa: [-0.4532, 39.6461],
  Wajir: [1.7471, 40.0573],
  Mandera: [3.9366, 41.867],
  Marsabit: [2.3347, 37.9909],
  Isiolo: [0.3546, 37.5822],
  Meru: [0.047, 37.649],
  "Tharaka-Nithi": [-0.333, 37.65],
  Embu: [-0.539, 37.457],
  Kitui: [-1.367, 38.01],
  Machakos: [-1.5177, 37.2634],
  Makueni: [-1.7808, 37.6288],
  Nyandarua: [-0.2709, 36.3792],
  Nyeri: [-0.4201, 36.9476],
  Kirinyaga: [-0.4989, 37.2803],
  "Murang'a": [-0.721, 37.1526],
  Kiambu: [-1.1714, 36.8356],
  Turkana: [3.116, 35.597],
  "West Pokot": [1.2389, 35.1119],
  Samburu: [1.0968, 36.698],
  "Trans Nzoia": [1.0157, 35.0062],
  "Uasin Gishu": [0.5143, 35.2698],
  "Elgeyo-Marakwet": [0.6703, 35.5081],
  Nandi: [0.2039, 35.105],
  Baringo: [0.4919, 35.743],
  Laikipia: [0.0062, 37.0739],
  Nakuru: [-0.3031, 36.08],
  Narok: [-1.0857, 35.8716],
  Kajiado: [-1.8524, 36.7768],
  Kericho: [-0.3689, 35.2863],
  Bomet: [-0.7813, 35.3416],
  Kakamega: [0.2827, 34.7519],
  Vihiga: [0.076, 34.725],
  Bungoma: [0.5635, 34.5606],
  Busia: [0.4601, 34.1115],
  Siaya: [0.0607, 34.2881],
  Kisumu: [-0.0917, 34.768],
  "Homa Bay": [-0.5273, 34.4571],
  Migori: [-1.0634, 34.4731],
  Kisii: [-0.6817, 34.7667],
  Nyamira: [-0.5633, 34.9358],
  Nairobi: [-1.286389, 36.817223],
};

export function countyCenter(county?: string): [number, number] | undefined {
  const normalized = county
    ?.toLowerCase()
    .replace(/county$/i, "")
    .replace(/[^a-z]/g, "");
  return Object.entries(CENTERS).find(
    ([name]) => name.toLowerCase().replace(/[^a-z]/g, "") === normalized,
  )?.[1];
}
