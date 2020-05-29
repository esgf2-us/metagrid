// Type definition for a search result object, based on the ESG Search APi
type SearchResult = {
  id: string;
  url: string[];
  access: string[];
  xlink?: string[] | [];
  citation_url?: string[] | [];
  further_info_url?: string[] | [];
  [key: string]: string | string[] | number | undefined;
};
