module.exports = {
  roots: ['<rootDir>/src'],
  collectCoverageFrom: [
    'src/services/slices/ingredients-slice.ts',
    'src/services/slices/constructor-slice.ts'
  ],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
  clearMocks: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  moduleNameMapper: {
    '^@api$': '<rootDir>/src/utils/burger-api.ts',
    '^@utils-types$': '<rootDir>/src/utils/types.ts',
    '^@pages$': '<rootDir>/src/pages',
    '^@components$': '<rootDir>/src/components',
    '^@ui$': '<rootDir>/src/components/ui',
    '^@ui-pages$': '<rootDir>/src/components/ui/pages',
    '\\.(css)$': '<rootDir>/test/style-mock.cjs',
    '\\.(svg|png|jpg|jpeg|woff|woff2)$': '<rootDir>/test/file-mock.cjs'
  }
};
