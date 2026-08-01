import type { Component } from 'svelte';
import FolderIcon from './FolderIcon.svelte';
import DotIcon from './DotIcon.svelte';
import AngleIcon from './AngleIcon.svelte';
import CrossIcon from './CrossIcon.svelte';
import ValorantIcon from './ValorantIcon.svelte';
import LOLIcon from './LOLIcon.svelte';
import RocketLeague1Icon from './RocketLeague1Icon.svelte';
import RocketLeague2Icon from './RocketLeague2Icon.svelte';
import COD1Icon from './COD1Icon.svelte';
import COD2Icon from './COD2Icon.svelte';
import COD3Icon from './COD3Icon.svelte';
import COD4Icon from './COD4Icon.svelte';
import CSIcon from './CSIcon.svelte';
import MinecraftIcon from './MinecraftIcon.svelte';
import MinecraftIcon2 from './MinecraftIcon2.svelte';
import CoffeeIcon from './CoffeeIcon.svelte';
import DotaIcon from './DotaIcon.svelte';
import FortniteIcon from './FortniteIcon.svelte';
import FortniteIcon2 from './FortniteIcon2.svelte';
import OverwatchIcon from './OverwatchIcon.svelte';
import ArcRaidersIcon from './ArcRaidersIcon.svelte';
import R6Icon from './R6Icon.svelte';
import GTA5Icon from './GTA5Icon.svelte';
import GTA6Icon from './GTA6Icon.svelte';
import MusicIcon1 from './MusicIcon1.svelte';
import MusicIcon2 from './MusicIcon2.svelte';
import MarvelRivalsIcon from './MarvelRivalsIcon.svelte';
import ApexLegendsIcon from './ApexLegendsIcon.svelte';
import RobloxIcon from './RobloxIcon.svelte';
import DeadlockIcon from './DeadlockIcon.svelte';
import Battlefield6Icon from './Battlefield6Icon.svelte';
import CounterStrike2Icon from './CounterStrike2Icon.svelte';
import SplitgateIcon from './SplitgateIcon.svelte';
import HaloIcon from './HaloIcon.svelte';
import Smite2Icon from './Smite2Icon.svelte';
import Destiny2Icon from './Destiny2Icon.svelte';
import TeamfightTacticsIcon from './TeamfightTacticsIcon.svelte';
import OffTheGridIcon from './OffTheGridIcon.svelte';
import TwoXKOIcon from './2XKOIcon.svelte';
import PUBGIcon from './PUBGIcon.svelte';
import CallOfDutyIcon from './CallOfDutyIcon.svelte';
import BloodhuntIcon from './BloodhuntIcon.svelte';
import BrawlhallaIcon from './BrawlhallaIcon.svelte';
import ForHonorIcon from './ForHonorIcon.svelte';
import TheDivision2Icon from './TheDivision2Icon.svelte';

// Sentinel values stored in `type.iconType`. They have no component: NONE
// renders nothing at all, EMPTY_PLACEHOLDER keeps the icon slot so the list
// name stays aligned with the lists that do have an icon.
export const ICON_NONE = 0;
export const ICON_EMPTY_PLACEHOLDER = -1;

// Both already act as an open indicator: they rotate on --icon-open. A list
// using one of them gets no extra chevron, whatever the chevron option says.
export const ICON_ANGLE = 3;
export const ICON_CROSS = 4;

export interface IconDef {
  id: number;
  key: string; // i18n key, e.g. 'icon.folder' (resolved with $_ by the consumer)
  component: Component;
}

// Single source of truth for icons. The `id`s must stay stable: they are
// persisted in the user config (`type.iconType`).
export const ICONS: IconDef[] = [
  { id: 1, key: 'icon.folder', component: FolderIcon },
  { id: 2, key: 'icon.dot', component: DotIcon },
  { id: 3, key: 'icon.angle', component: AngleIcon },
  { id: 4, key: 'icon.cross', component: CrossIcon },
  { id: 5, key: 'icon.valorant', component: ValorantIcon },
  { id: 6, key: 'icon.lol', component: LOLIcon },
  { id: 7, key: 'icon.rocketLeague1', component: RocketLeague1Icon },
  { id: 8, key: 'icon.rocketLeague2', component: RocketLeague2Icon },
  { id: 9, key: 'icon.cod1', component: COD1Icon },
  { id: 10, key: 'icon.cod2', component: COD2Icon },
  { id: 11, key: 'icon.cod3', component: COD3Icon },
  { id: 12, key: 'icon.cod4', component: COD4Icon },
  { id: 13, key: 'icon.counterStrike', component: CSIcon },
  { id: 14, key: 'icon.minecraft', component: MinecraftIcon },
  { id: 15, key: 'icon.minecraft2', component: MinecraftIcon2 },
  { id: 16, key: 'icon.coffee', component: CoffeeIcon },
  { id: 17, key: 'icon.dota', component: DotaIcon },
  { id: 18, key: 'icon.fortnite', component: FortniteIcon },
  { id: 19, key: 'icon.fortnite2', component: FortniteIcon2 },
  { id: 20, key: 'icon.overwatch', component: OverwatchIcon },
  { id: 21, key: 'icon.arcRaiders', component: ArcRaidersIcon },
  { id: 22, key: 'icon.rainbow6', component: R6Icon },
  { id: 23, key: 'icon.gta5', component: GTA5Icon },
  { id: 24, key: 'icon.gta6', component: GTA6Icon },
  { id: 25, key: 'icon.music1', component: MusicIcon1 },
  { id: 26, key: 'icon.music2', component: MusicIcon2 },
  { id: 27, key: 'icon.marvelRivals', component: MarvelRivalsIcon },
  { id: 28, key: 'icon.apexLegends', component: ApexLegendsIcon },
  { id: 29, key: 'icon.roblox', component: RobloxIcon },
  { id: 30, key: 'icon.deadlock', component: DeadlockIcon },
  { id: 31, key: 'icon.battlefield6', component: Battlefield6Icon },
  { id: 32, key: 'icon.counterStrike2', component: CounterStrike2Icon },
  { id: 33, key: 'icon.splitgate', component: SplitgateIcon },
  { id: 34, key: 'icon.halo', component: HaloIcon },
  { id: 35, key: 'icon.smite2', component: Smite2Icon },
  { id: 36, key: 'icon.destiny2', component: Destiny2Icon },
  { id: 37, key: 'icon.teamfightTactics', component: TeamfightTacticsIcon },
  { id: 38, key: 'icon.offTheGrid', component: OffTheGridIcon },
  { id: 39, key: 'icon.xko2', component: TwoXKOIcon },
  { id: 40, key: 'icon.pubg', component: PUBGIcon },
  { id: 41, key: 'icon.callOfDuty', component: CallOfDutyIcon },
  { id: 42, key: 'icon.bloodhunt', component: BloodhuntIcon },
  { id: 43, key: 'icon.brawlhalla', component: BrawlhallaIcon },
  { id: 44, key: 'icon.forHonor', component: ForHonorIcon },
  { id: 45, key: 'icon.theDivision2', component: TheDivision2Icon },
];

export const ICON_BY_ID = new Map<number, IconDef>(ICONS.map((i) => [i.id, i]));

// Sorted on the translated LABEL, so it depends on the current locale: the
// translate function ($_) is taken as an argument to stay reactive.
export function sortIconsByLabel(translate: (key: string) => string): IconDef[] {
  return [...ICONS].sort((a, b) => translate(a.key).localeCompare(translate(b.key)));
}
