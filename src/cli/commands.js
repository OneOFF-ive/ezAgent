import { clearMessages, getCurrentModel, getModelById, switchModel } from './state.js';
import {
  printCurrentModel,
  printHelp,
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

  if (trimmed === '/model') {
    printCurrentModel(getCurrentModel(state));
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
