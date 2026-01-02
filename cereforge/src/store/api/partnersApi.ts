// src/store/api/partnersApi.ts

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  PartnerApplicationsListResponse,
  PartnerApplicationDetailResponse,
  UpdateApplicationStatusInput,
  UpdateApplicationStatusResponse,
  PartnersListResponse,
  PartnerDetailResponse,
  UpdatePartnerInput,
  UpdatePartnerResponse,
  UpdatePartnerStatusInput,
  UpdatePartnerStatusResponse,
  GetApplicationsParams,
  GetPartnersParams
} from '../../types/partners.types';

export const partnersApi = createApi({
  reducerPath: 'partnersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/admin`,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    }
  }),
  tagTypes: ['PartnerApplications', 'Partners'],
  keepUnusedDataFor: 300, // 5 minutes cache
  refetchOnMountOrArgChange: 30,
  refetchOnFocus: true,
  refetchOnReconnect: true,

  endpoints: (builder) => ({
    // ============================================
    // PARTNER APPLICATIONS ENDPOINTS
    // ============================================

    /**
     * GET /admin/partner-applications
     * List all partner applications with filters
     */
    getPartnerApplications: builder.query<
      PartnerApplicationsListResponse,
      GetApplicationsParams | undefined
    >({
      query: (params={}) => ({
        url: '/partner-applications',
        params
      }),
      providesTags: ['PartnerApplications']
    }),

    /**
     * GET /admin/partner-applications/:id
     * Get single partner application by ID
     */
    getPartnerApplication: builder.query<
      PartnerApplicationDetailResponse,
      string
    >({
      query: (id) => `/partner-applications/${id}`,
      providesTags: (_result, _error, id) => [
        { type: 'PartnerApplications', id }
      ]
    }),

    /**
     * PATCH /admin/partner-applications/:id/status
     * Update partner application status
     */
    updateApplicationStatus: builder.mutation<
      UpdateApplicationStatusResponse,
      { id: string; body: UpdateApplicationStatusInput }
    >({
      query: ({ id, body }) => ({
        url: `/partner-applications/${id}/status`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'PartnerApplications',
        { type: 'PartnerApplications', id }
      ]
    }),

    // ============================================
    // PARTNERS ENDPOINTS
    // ============================================

    /**
     * GET /admin/partners
     * List all approved partners with filters
     */
    getPartners: builder.query<PartnersListResponse, GetPartnersParams | undefined>({
      query: (params={}) => ({
        url: '/partners',
        params
      }),
      providesTags: ['Partners']
    }),

    /**
     * GET /admin/partners/:id
     * Get single partner by ID
     */
    getPartner: builder.query<PartnerDetailResponse, string>({
      query: (id) => `/partners/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Partners', id }]
    }),

    /**
     * PUT /admin/partners/:id
     * Update partner information
     */
    updatePartner: builder.mutation<
      UpdatePartnerResponse,
      { id: string; body: UpdatePartnerInput }
    >({
      query: ({ id, body }) => ({
        url: `/partners/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'Partners',
        { type: 'Partners', id }
      ]
    }),

    /**
     * PATCH /admin/partners/:id/status
     * Update partner status
     */
    updatePartnerStatus: builder.mutation<
      UpdatePartnerStatusResponse,
      { id: string; body: UpdatePartnerStatusInput }
    >({
      query: ({ id, body }) => ({
        url: `/partners/${id}/status`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'Partners',
        { type: 'Partners', id }
      ]
    })
  })
});

export const {
  useGetPartnerApplicationsQuery,
  useGetPartnerApplicationQuery,
  useUpdateApplicationStatusMutation,
  useGetPartnersQuery,
  useGetPartnerQuery,
  useUpdatePartnerMutation,
  useUpdatePartnerStatusMutation
} = partnersApi;