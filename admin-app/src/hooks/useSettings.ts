// Mock settings hooks for testing
export const useSystemSettings = () => ({
  data: null,
  isLoading: false,
  error: null,
})

export const useUpdateSystemSettings = () => ({
  mutate: jest.fn(),
  isLoading: false,
})
