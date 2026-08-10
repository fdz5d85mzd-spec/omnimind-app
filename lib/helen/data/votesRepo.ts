import type { VoteMap } from "../types";
import { readJSON, writeJSON } from "./storage";

const KEY = "helen-votes";

export function getVotes(): VoteMap {
  return readJSON<VoteMap>(KEY) ?? {};
}

/** One vote per member per cycle is enforced by the caller (Profile.votedCycle);
 *  the real backend additionally enforces it with a unique (member_id, cycle_id) constraint. */
export function castVote(cycle: number, orgId: number): void {
  const votes = getVotes();
  const key = `${cycle}_${orgId}`;
  votes[key] = (votes[key] ?? 0) + 1;
  writeJSON(KEY, votes);
}
