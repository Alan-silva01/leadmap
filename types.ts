
export interface Prospeccao {
  id: string;
  telefone: string;
  cidade: string | null;
  bairro: string | null;
  nome: string | null;
  website: string | null;
  email: string | null;
  email2: string | null;
  segmento: string | null;
  created_at?: string;
}

export interface WebhookPayload {
  "Termo da Busca": string;
  "Cidade": string;
  "submittedAt": string;
  "formMode": string;
}
