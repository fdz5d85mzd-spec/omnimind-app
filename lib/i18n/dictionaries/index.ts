import ar from "./ar";
import de from "./de";
import el from "./el";
import en from "./en";
import es from "./es";
import fr from "./fr";
import it from "./it";
import ja from "./ja";
import pt from "./pt";
import ru from "./ru";
import tr from "./tr";
import zh from "./zh";
import type { Dictionary, LangCode } from "../types";

export const DICTIONARIES: Record<LangCode, Dictionary> = { en, el, es, fr, de, it, pt, ru, zh, ja, ar, tr };
