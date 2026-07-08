import {
  clearMessages,
  getCurrentModel,
  getMemoryStats,
  getModelById,
  switchModel,
} from './state.js';
import {
  printCurrentAgent,
  printCurrentModel,
  printHelp,
  printMemoryStats,
  printMessagesCleared,
  printModelNotFound,
  printModelSwitched,
  printRegisteredModels,
} from './view.js';

export function handleCommand(trimmed, state) {
  if (trimmed === '/help') {
    printHelp();
    return true;
  }

  if (trimmed === '/agent') {
    printCurrentAgent(state.agent);
    return true;
  }

  if (trimmed === '/model') {
    printCurrentModel(getCurrentModel(state));
    return true;
  }

  if (trimmed === '/memory') {
    printMemoryStats(getMemoryStats(state));
    return true;
  }

  if (trimmed === '/models') {
    printRegisteredModels(state.currentModelId, getModelById);
    return true;
  }

  if (trimmed === '/clear') {
    clearMessages(state);
    printMessagesCleared();
    return true;
  }

  if (trimmed.startsWith('/switch ')) {
    const nextModel = switchModel(state, trimmed.slice('/switch '.length).trim());

    if (!nextModel) {
      printModelNotFound(trimmed.slice('/switch '.length).trim());
      printRegisteredModels(state.currentModelId, getModelById);
      return true;
    }

    printModelSwitched(nextModel);
    return true;
  }

  return false;
}
