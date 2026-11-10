import type { HoleIndex, Player } from '@etg/gebeta-rules';
import { useFrame } from '@react-three/fiber';
import { CupRings } from './CupRings';
import { Dust } from './Dust';
import { Celebration } from './Celebration';
import { EyeGlint } from './EyeGlint';
import { Flash } from './Flash';
import { now, useFeedback } from './feedbackStore';
import { Inlays } from './Inlays';
import { Sparks } from './Sparks';
import { StoreGlow } from './StoreGlow';

/** Forgets feedback events once every effect has had its three seconds with them. */
function Pruner() {
  useFrame(() => useFeedback.getState().prune(now()));
  return null;
}

/** Everything the world does in answer to the game (spec §7 "Game feedback in the world"). */
export function Feedback({ owners, playable, suggested = null }: { owners: readonly Player[]; playable: ReadonlySet<HoleIndex>; suggested?: HoleIndex | null }) {
  return (
    <>
      <Inlays owners={owners} />
      <CupRings playable={playable} suggested={suggested} />
      <Dust />
      <Sparks />
      <StoreGlow />
      <Flash />
      <Celebration />
      <EyeGlint />
      <Pruner />
    </>
  );
}
