import {
  Atom, Award, Banknote, Bike, Blocks, BookMarked, BookOpen, Braces, Brain, Briefcase, Bug,
  Calculator, Camera, Car, ChartLine, ChefHat, Cloud, Code, Coffee, Coins, Compass, Cpu,
  Database, Dna, Drama, Dumbbell, Film, Gavel, GitBranch, Globe, Guitar, HeartPulse, Hourglass,
  Landmark, Languages, Library, Map as MapIcon, Medal, Microscope, Mountain, Music, NotebookPen, Palette,
  PawPrint, Pill, Plane, Puzzle, Rocket, Scale, ScrollText, Server, Shield, Sigma, Sprout,
  Stethoscope, Target, Telescope, Terminal, TreePine, TrendingUp, Trophy, UtensilsCrossed,
  Wrench, Zap, type LucideIcon,
} from "lucide-react";

// set curado de ícones de tema (DESIGN-TEMA-ICONE §1) — imports nominais: tree-shake garante
// que só estes 64 entram no bundle. Ordem = ordem do grid do picker (clusters de domínio).
export const TRACK_ICON_LIST: ReadonlyArray<readonly [string, LucideIcon, string]> = [
  ["target", Target, "alvo"], ["book-open", BookOpen, "livro aberto"], ["book-marked", BookMarked, "livro marcado"],
  ["library", Library, "biblioteca"], ["notebook-pen", NotebookPen, "caderno"], ["brain", Brain, "cérebro"],
  ["puzzle", Puzzle, "quebra-cabeça"], ["blocks", Blocks, "blocos"],
  ["code", Code, "código"], ["terminal", Terminal, "terminal"], ["braces", Braces, "chaves"],
  ["database", Database, "banco de dados"], ["server", Server, "servidor"], ["cpu", Cpu, "processador"],
  ["bug", Bug, "bug"], ["git-branch", GitBranch, "branch"],
  ["atom", Atom, "átomo"], ["microscope", Microscope, "microscópio"], ["telescope", Telescope, "telescópio"],
  ["dna", Dna, "DNA"], ["calculator", Calculator, "calculadora"], ["sigma", Sigma, "somatório"],
  ["chart-line", ChartLine, "gráfico"], ["cloud", Cloud, "nuvem"],
  ["stethoscope", Stethoscope, "estetoscópio"], ["heart-pulse", HeartPulse, "batimentos"], ["pill", Pill, "remédio"],
  ["scale", Scale, "balança"], ["gavel", Gavel, "martelo do juiz"], ["landmark", Landmark, "instituição"],
  ["scroll-text", ScrollText, "pergaminho"], ["shield", Shield, "escudo"],
  ["briefcase", Briefcase, "maleta"], ["coins", Coins, "moedas"], ["banknote", Banknote, "cédula"],
  ["trending-up", TrendingUp, "alta"],
  ["languages", Languages, "idiomas"], ["globe", Globe, "globo"], ["map", MapIcon, "mapa"],
  ["compass", Compass, "bússola"], ["hourglass", Hourglass, "ampulheta"],
  ["palette", Palette, "paleta"], ["music", Music, "música"], ["guitar", Guitar, "violão"],
  ["camera", Camera, "câmera"], ["film", Film, "filme"], ["drama", Drama, "teatro"],
  ["dumbbell", Dumbbell, "halter"], ["bike", Bike, "bicicleta"], ["trophy", Trophy, "troféu"], ["medal", Medal, "medalha"],
  ["chef-hat", ChefHat, "chapéu de chef"], ["utensils-crossed", UtensilsCrossed, "talheres"], ["coffee", Coffee, "café"],
  ["mountain", Mountain, "montanha"], ["tree-pine", TreePine, "pinheiro"], ["sprout", Sprout, "broto"], ["paw-print", PawPrint, "pata"],
  ["wrench", Wrench, "chave inglesa"], ["rocket", Rocket, "foguete"], ["zap", Zap, "raio"],
  ["plane", Plane, "avião"], ["car", Car, "carro"], ["award", Award, "prêmio"],
];

const MAP = new Map(TRACK_ICON_LIST.map(([name, Icon]) => [name, Icon] as [string, LucideIcon]));

// ícone do tema com fallback: nome desconhecido/ausente/null → Target (default histórico)
export function TrackIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && MAP.get(name)) || Target;
  return <Icon className={className} aria-hidden="true" />;
}
