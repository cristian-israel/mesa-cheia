export type CoinSideId = "a" | "b";

export type CoinPreset = {
  id: string;
  a: string;
  b: string;
};

export const COIN_PRESETS: CoinPreset[] = [
  { id: "cara-coroa", a: "Cara", b: "Coroa" },
  { id: "sim-nao", a: "Sim", b: "Não" },
  { id: "vive-morre", a: "Vive", b: "Morre" },
  { id: "par-impar", a: "Par", b: "Ímpar" },
];

export const DEFAULT_COIN_PRESET = COIN_PRESETS[0];

export function matchingPresetId(a: string, b: string) {
  return COIN_PRESETS.find((preset) => preset.a === a && preset.b === b)?.id;
}
