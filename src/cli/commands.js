import {
  clearMessages,
  autoSaveCurrentSession,
  getCurrentModel,
  getMemoryStats,
  getModelById,
  getSessionInfo,
  listSavedSessions,
  loadCurrentSession,
  saveCurrentSession,
  switchModel,
} from './state.js';
import {
  printCommandError,
  printCurrentAgent,
  printCurrentModel,
  printHelp,
  printMemoryStats,
  printMessagesCleared,
  printModelNotFound,
  printSavedSessions,
  printSessionInfo,
  printSessionLoaded,
  printSessionNotFound,
  printSessionSaved,
  printModelSwitched,
  printRegisteredModels,
} from './view.js';

function commandArgument(trimmed, command) {
  return trimmed.slice(command.length).trim();
}

function handleSessionCommand(action) {
  try {
    action();
  } catch (error) {
    printCommandError(error);
  }
}

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

  if (trimmed === '/session') {
    printSessionInfo(getSessionInfo(state));
    return true;
  }

  if (trimmed === '/sessions') {
    handleSessionCommand(() => {
      printSavedSessions(listSavedSessions(state), state.activeSession);
    });
    return true;
  }

  if (trimmed === '/save' || trimmed.startsWith('/save ')) {
    handleSessionCommand(() => {
      const sessionId = commandArgument(trimmed, '/save') || state.activeSession;
      printSessionSaved(saveCurrentSession(state, sessionId));
    });
    return true;
  }

  if (trimmed === '/load' || trimmed.startsWith('/load ')) {
    handleSessionCommand(() => {
      const sessionId = commandArgument(trimmed, '/load') || state.activeSession;
      const loadedSession = loadCurrentSession(state, sessionId);

      if (!loadedSession) {
        printSessionNotFound(sessionId);
        return;
      }

      printSessionLoaded(loadedSession);
    });
    return true;
  }

  if (trimmed === '/models') {
    printRegisteredModels(state.currentModelId, getModelById);
    return true;
  }

  if (trimmed === '/clear') {
    clearMessages(state);
    handleSessionCommand(() => {
      autoSaveCurrentSession(state);
    });
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
