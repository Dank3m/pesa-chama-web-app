import api, { ApiResponse } from './api';

export interface StkPushRequest {
  sourceId: string;
  sourceType: 'LOAN_REPAYMENT' | 'CONTRIBUTION';
  amount: number;
  phoneNumber: string;
}

export interface StkPushResponse {
  collectionRef: string;
  status: string;
  message: string;
}

export interface StkPushStatus {
  collectionRef: string;
  collectionType: string;
  sourceId: string;
  amount: number;
  originalAmount: number | null;
  status: string;
  statusDescription: string;
  mpesaReceiptNumber: string | null;
  completedAt: string | null;
}

export const stkPushService = {
  initiate: async (request: StkPushRequest): Promise<StkPushResponse> => {
    const response = await api.post<StkPushResponse>('/stk-push/initiate', request);
    return response.data;
  },

  getStatus: async (collectionRef: string): Promise<StkPushStatus> => {
    const response = await api.get<StkPushStatus>(`/stk-push/status/${collectionRef}`);
    return response.data;
  },
};
