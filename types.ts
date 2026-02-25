
export interface Notice {
  id: string;
  title: string;
  body: string;
  is_published: boolean;
  published_at: string;
}

export interface GalleryFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: any;
}

export interface DevotionalData {
  title: string;
  text: string;
  reference: string;
}

export interface MemberDetails {
  full_name: string;
  gender: string;
  birth_date: string;
  marital_status: string;
  address_street: string;
  address_block: string;
  address_lot: string;
  address_sector: string;
  address_city: string;
  address_state: string;
  postal_code: string;
  phone: string;
  email: string;
  church_role_info: string;
  church_entry_date: string;
  baptism_date: string;
  church_function: string;
  photo_path: string;
}

export const emptyMemberDetails: MemberDetails = {
  full_name: '',
  gender: '',
  birth_date: '',
  marital_status: '',
  address_street: '',
  address_block: '',
  address_lot: '',
  address_sector: '',
  address_city: '',
  address_state: '',
  postal_code: '',
  phone: '',
  email: '',
  church_role_info: '',
  church_entry_date: '',
  baptism_date: '',
  church_function: '',
  photo_path: '',
};

export const MEMBER_REQUIRED_FIELDS: (keyof MemberDetails)[] = [
  'full_name',
  'gender',
  'birth_date',
  'marital_status',
  'address_street',
  'address_block',
  'address_lot',
  'address_sector',
  'address_city',
  'address_state',
  'postal_code',
  'phone',
  'email',
  'church_entry_date',
  'baptism_date',
  'church_function',
];

export const isFichaComplete = (details: Partial<MemberDetails>) =>
  MEMBER_REQUIRED_FIELDS.every((field) => String(details[field] ?? '').trim().length > 0);

export const formatDate = (value?: string) => {
  if (!value) return '--/--/----';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
};
