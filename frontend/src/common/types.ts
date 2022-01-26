export type CSSinJS = {
  [key: string]: React.CSSProperties | { [key: string]: React.CSSProperties };
};

export enum AppPage {
  'Main',
  'Cart',
  'SavedSearches',
  'NodeStatus',
}
