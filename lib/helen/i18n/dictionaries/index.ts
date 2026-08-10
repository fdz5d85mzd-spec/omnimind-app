import type { Dictionary, LangCode } from "../types";
import ar from "./ar";
import de from "./de";
import el from "./el";
import en from "./en";
import es from "./es";
import fr from "./fr";
import hi from "./hi";
import it from "./it";
import ja from "./ja";
import ko from "./ko";
import nl from "./nl";
import pl from "./pl";
import pt from "./pt";
import ro from "./ro";
import ru from "./ru";
import sv from "./sv";
import tr from "./tr";
import zh from "./zh";

export const DICTIONARIES: Record<LangCode, Dictionary> = {
  el,
  en,
  es,
  fr,
  de,
  it,
  pt,
  ru,
  tr,
  ar,
  zh,
  ja,
  ko,
  hi,
  pl,
  nl,
  sv,
  ro,
};
