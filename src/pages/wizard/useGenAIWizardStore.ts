import create from 'zustand'

const useGenAIWizardStore = create(() => ({
  wizardPrototype: {
    modelName: '',
    name: '',
  },
}))

export default useGenAIWizardStore
