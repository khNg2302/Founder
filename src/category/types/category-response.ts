export type CategoryType = 'FIELD' | 'INDUSTRY' | 'NICHE';

export interface CategoryResponse {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
}
