// Mintlify component shims, kept LOCAL to this site rather than in
// @ubx/docs-ui (UBI-247 slice 3). These are docs-content components, not
// chrome: the provider site renders generated reference pages and will
// never use a ResponseField or a Steps block. Putting them in the shared
// package would make it carry things one of its two consumers cannot
// use, the same reasoning that kept ProviderSidebar out. Extract later
// if a second consumer genuinely appears.
export { Note, Warning, Info, Tip } from "./Callout";
export { ResponseField } from "./ResponseField";
export { Expandable } from "./Expandable";
export { Card, CardGroup } from "./Card";
export { Steps, Step } from "./Steps";
export { Tabs, Tab } from "./Tabs";
